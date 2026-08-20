import { Readable, Writable } from 'node:stream';
import {
    ChannelClientState,
    ChannelCompletion,
    ChannelMessage,
    ChannelMessageHandler,
    IChannelClient,
    NetworkPackage,
    parseNetworkPackage,
    serializeNetworkPackage,
    validateChannelName,
    validatePositiveClientId,
} from '@gaclib-website/remote-protocol-http/channel';

export const STDIO_JOIN_PACKAGE = ';;ViewModelChannel!ViewModelReadyChannel';
export const STDIO_JOIN_GOLDEN = 'OztWaWV3TW9kZWxDaGFubmVsIVZpZXdNb2RlbFJlYWR5Q2hhbm5lbA==';
export const STDIO_READY_GOLDEN = 'O1ZpZXdNb2RlbFJlYWR5Q2hhbm5lbDtbIlJlYWR5Il0=';

export class StdioChannelError extends Error {}
export class StdioParentExitError extends StdioChannelError {}

function hasLoneSurrogate(value: string): boolean {
    for (let index = 0; index < value.length; index++) {
        const code = value.charCodeAt(index);
        if (code >= 0xD800 && code <= 0xDBFF) {
            const next = value.charCodeAt(index + 1);
            if (Number.isNaN(next) || next < 0xDC00 || next > 0xDFFF) return true;
            index++;
        } else if (code >= 0xDC00 && code <= 0xDFFF) {
            return true;
        }
    }
    return false;
}

export function encodeStdioMessage(message: string): string {
    if (hasLoneSurrogate(message)) {
        throw new StdioChannelError('Cannot encode a lone UTF-16 surrogate to stdio UTF-8.');
    }
    return `${Buffer.from(message, 'utf8').toString('base64')}\n`;
}

export function decodeStdioBase64(line: string): string | undefined {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(line)) {
        return undefined;
    }
    const bytes = Buffer.from(line, 'base64');
    if (bytes.toString('base64') !== line) {
        return undefined;
    }
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
        return undefined;
    }
}

function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: Error) => void } {
    let resolve: ((value: T) => void) | undefined;
    let reject: ((error: Error) => void) | undefined;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    if (resolve === undefined || reject === undefined) throw new Error('Failed to create stdio deferred promise.');
    return { promise, resolve, reject };
}

export class StdioChannelClient implements IChannelClient {
    private readonly handlers = new Set<ChannelMessageHandler>();
    private readonly queuedMessages: ChannelMessage[] = [];
    private readonly assignment = createDeferred<void>();
    private readonly completionDeferred = createDeferred<ChannelCompletion>();
    private bytes = Buffer.alloc(0);
    private assignedClientId: number | undefined;
    private currentState: ChannelClientState = 'connecting';
    private writing: Promise<void> = Promise.resolve();
    private finished = false;
    private listenersAttached = false;

    constructor(private readonly input: Readable, private readonly output: Writable) {
        void this.assignment.promise.catch(() => undefined);
    }

    get clientId(): number | undefined { return this.assignedClientId; }
    get state(): ChannelClientState { return this.currentState; }
    get completion(): Promise<ChannelCompletion> { return this.completionDeferred.promise; }

    private isStopped(): boolean { return this.currentState === 'stopped'; }

    private readonly onData = (chunk: Buffer | string): void => {
        const incoming = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
        this.bytes = Buffer.concat([this.bytes, incoming]);
        this.processCompleteLines();
    };

    private readonly onEnd = (): void => {
        if (this.bytes.length > 0) {
            const finalLine = this.bytes;
            this.bytes = Buffer.alloc(0);
            this.processLine(finalLine);
        }
        if (!this.finished) this.fail(new StdioChannelError('RVM stdio input reached EOF.'));
    };

    private readonly onInputError = (error: Error): void => { this.fail(error); };
    private readonly onOutputError = (error: Error): void => { this.fail(error); };

    private attach(): void {
        if (this.listenersAttached) return;
        this.listenersAttached = true;
        this.input.on('data', this.onData);
        this.input.once('end', this.onEnd);
        this.input.once('error', this.onInputError);
        this.output.once('error', this.onOutputError);
    }

    private detach(): void {
        if (!this.listenersAttached) return;
        this.listenersAttached = false;
        this.input.off('data', this.onData);
        this.input.off('end', this.onEnd);
        this.input.off('error', this.onInputError);
        this.output.off('error', this.onOutputError);
    }

    private processCompleteLines(): void {
        while (true) {
            const newline = this.bytes.indexOf(0x0A);
            if (newline < 0) return;
            let line = this.bytes.subarray(0, newline);
            this.bytes = this.bytes.subarray(newline + 1);
            if (line.length > 0 && line[line.length - 1] === 0x0D) line = line.subarray(0, line.length - 1);
            this.processLine(line);
            if (this.finished) return;
        }
    }

    private processLine(bytes: Buffer): void {
        if (bytes.some(byte => byte > 0x7F)) return;
        const line = bytes.toString('ascii');
        if (line === '!Exit') {
            this.fail(new StdioParentExitError('Core requested RVM stdio shutdown.'));
            return;
        }
        if (line.startsWith('!')) return;
        const decoded = decodeStdioBase64(line);
        if (decoded === undefined) return;
        let networkPackage: NetworkPackage;
        try {
            networkPackage = parseNetworkPackage(decoded);
        } catch (error) {
            this.fail(new StdioChannelError(normalizeError(error).message));
            return;
        }
        try {
            this.dispatch(networkPackage, decoded);
        } catch (error) {
            this.fail(normalizeError(error));
        }
    }

    private dispatch(networkPackage: NetworkPackage, original: string): void {
        if (networkPackage.channelName === '!Error') throw new StdioChannelError(networkPackage.messageBody);
        if (networkPackage.channelName === '') {
            if (networkPackage.clientId === undefined || networkPackage.extraClientIds !== undefined || networkPackage.messageBody !== '' || this.assignedClientId !== undefined) {
                throw new StdioChannelError(`Invalid stdio channel assignment: ${original}`);
            }
            validatePositiveClientId(networkPackage.clientId, 'assigned stdio client id');
            this.assignedClientId = networkPackage.clientId;
            this.currentState = 'assigned';
            this.assignment.resolve();
            return;
        }
        if (networkPackage.clientId === undefined || networkPackage.extraClientIds !== undefined) {
            throw new StdioChannelError(`Invalid incoming stdio channel package: ${original}`);
        }
        validatePositiveClientId(networkPackage.clientId, 'stdio sender client id');
        if (networkPackage.channelName !== 'ViewModelChannel' && networkPackage.channelName !== 'ViewModelReadyChannel') return;
        const message = { senderClientId: networkPackage.clientId, channelName: networkPackage.channelName, messageBody: networkPackage.messageBody };
        if (this.handlers.size === 0) this.queuedMessages.push(message);
        else this.deliver(message);
    }

    private deliver(message: ChannelMessage): void {
        for (const handler of this.handlers) {
            void Promise.resolve(handler(message)).catch(error => this.fail(error));
        }
    }

    private fail(error: unknown): void {
        if (this.finished) return;
        const normalized = normalizeError(error);
        this.finished = true;
        this.currentState = 'failed';
        this.cleanup();
        this.assignment.reject(normalized);
        this.completionDeferred.resolve({ type: 'failed', error: normalized });
    }

    private cleanup(): void {
        this.detach();
        this.handlers.clear();
        this.queuedMessages.length = 0;
        this.bytes = Buffer.alloc(0);
    }

    private write(message: string): Promise<void> {
        const line = encodeStdioMessage(message);
        const next = this.writing.catch(() => undefined).then(async () => {
            if (this.finished) throw new StdioChannelError('RVM stdio output is closed.');
            await new Promise<void>((resolve, reject) => {
                this.output.write(line, 'ascii', error => {
                    if (error !== undefined && error !== null) reject(error);
                    else resolve();
                });
            });
        });
        this.writing = next;
        void next.catch(error => this.fail(error));
        return next;
    }

    async connect(): Promise<void> {
        if (this.currentState !== 'connecting') throw new StdioChannelError('The stdio channel can only connect once.');
        this.attach();
        try {
            await this.write(STDIO_JOIN_PACKAGE);
        } catch (error) {
            if (this.isStopped()) {
                throw new StdioChannelError('RVM stdio channel stopped before assignment.');
            }
            throw error;
        }
        await this.assignment.promise;
    }

    start(): Promise<void> {
        if (this.currentState !== 'assigned') return Promise.reject(new StdioChannelError('The stdio channel is not assigned.'));
        return this.completion.then(completion => {
            if (completion.type === 'failed') throw completion.error;
        });
    }

    onMessage(handler: ChannelMessageHandler): () => void {
        this.handlers.add(handler);
        for (const message of this.queuedMessages.splice(0)) this.deliver(message);
        return () => this.handlers.delete(handler);
    }

    sendToClient(receiverClientId: number, channelName: string, messageBody: string): Promise<void> {
        validatePositiveClientId(receiverClientId, 'stdio receiver client id');
        validateChannelName(channelName);
        return this.write(serializeNetworkPackage({ clientId: receiverClientId, channelName, messageBody }));
    }

    broadcast(channelName: string, messageBody: string, blockedReceivers: readonly number[] = []): Promise<void> {
        validateChannelName(channelName);
        for (const clientId of blockedReceivers) validatePositiveClientId(clientId, 'stdio blocked receiver client id');
        return this.write(serializeNetworkPackage({
            extraClientIds: blockedReceivers.length === 0 ? undefined : blockedReceivers,
            channelName,
            messageBody,
        }));
    }

    stop(): void {
        if (this.finished) return;
        this.finished = true;
        this.currentState = 'stopped';
        this.cleanup();
        this.assignment.reject(new StdioChannelError('RVM stdio channel stopped before assignment.'));
        this.completionDeferred.resolve({ type: 'stopped' });
    }
}
