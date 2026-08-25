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

export const WORKFLOW_RPC_STDIO_CHANNEL = 'WorkflowRpcStdioTest';
export const WORKFLOW_RPC_STDIO_JOIN_PACKAGE = `;;${WORKFLOW_RPC_STDIO_CHANNEL}`;

export class WorkflowRpcStdioError extends Error {}

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

export function encodeWorkflowRpcStdioFrame(message: string): string {
    if (hasLoneSurrogate(message)) throw new WorkflowRpcStdioError('Cannot encode a lone UTF-16 surrogate to stdio UTF-8.');
    return `${Buffer.from(message, 'utf8').toString('base64')}\n`;
}

export function decodeWorkflowRpcStdioFrame(line: string): string {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(line)) {
        throw new WorkflowRpcStdioError('The stdio line is not canonical Base64.');
    }
    const bytes = Buffer.from(line, 'base64');
    if (bytes.toString('base64') !== line) throw new WorkflowRpcStdioError('The stdio line is not canonical Base64.');
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
        throw new WorkflowRpcStdioError('The stdio frame is not strict UTF-8.');
    }
}

function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

function traceFrame(direction: 'incoming' | 'outgoing', message: string): void {
    if (process.env.GACJS_RPC_TEST_TRACE === '1') process.stderr.write(`[${direction}] ${message}\n`);
}

function deferred<T>(): { readonly promise: Promise<T>; readonly resolve: (value: T) => void; readonly reject: (error: Error) => void } {
    let resolve: ((value: T) => void) | undefined;
    let reject: ((error: Error) => void) | undefined;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    if (resolve === undefined || reject === undefined) throw new Error('Failed to create a Workflow RPC stdio barrier.');
    return { promise, resolve, reject };
}

export class WorkflowRpcStdioChannelClient implements IChannelClient {
    private readonly handlers = new Set<ChannelMessageHandler>();
    private readonly queuedMessages: ChannelMessage[] = [];
    private readonly assignment = deferred<void>();
    private readonly completionDeferred = deferred<ChannelCompletion>();
    private bytes = Buffer.alloc(0);
    private assignedClientId: number | undefined;
    private currentState: ChannelClientState = 'connecting';
    private writing: Promise<void> = Promise.resolve();
    private finished = false;
    private listenersAttached = false;
    private exitedByParent = false;

    constructor(private readonly input: Readable, private readonly output: Writable) {
        void this.assignment.promise.catch(() => undefined);
    }

    get clientId(): number | undefined { return this.assignedClientId; }
    get state(): ChannelClientState { return this.currentState; }
    get completion(): Promise<ChannelCompletion> { return this.completionDeferred.promise; }
    get parentExited(): boolean { return this.exitedByParent; }

    private readonly onData = (chunk: Buffer | string): void => {
        const incoming = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
        this.bytes = Buffer.concat([this.bytes, incoming]);
        this.processCompleteLines();
    };

    private readonly onEnd = (): void => {
        if (this.bytes.length > 0) {
            const line = this.bytes;
            this.bytes = Buffer.alloc(0);
            this.processLine(line);
        }
        if (!this.finished) this.fail(new WorkflowRpcStdioError('Workflow RPC stdio input reached EOF before !Exit.'));
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
        while (!this.finished) {
            const newline = this.bytes.indexOf(0x0A);
            if (newline < 0) return;
            let line = this.bytes.subarray(0, newline);
            this.bytes = this.bytes.subarray(newline + 1);
            if (line.length > 0 && line[line.length - 1] === 0x0D) line = line.subarray(0, line.length - 1);
            this.processLine(line);
        }
    }

    private processLine(bytes: Buffer): void {
        try {
            if (bytes.some(byte => byte > 0x7F)) throw new WorkflowRpcStdioError('A stdio control/Base64 line must be ASCII.');
            const line = bytes.toString('ascii');
            if (line === '!Exit') {
                this.parentExit();
                return;
            }
            if (line.startsWith('!')) return;
            const decoded = decodeWorkflowRpcStdioFrame(line);
            traceFrame('incoming', decoded);
            this.dispatch(parseNetworkPackage(decoded), decoded);
        } catch (error) {
            this.fail(normalizeError(error));
        }
    }

    private dispatch(networkPackage: NetworkPackage, original: string): void {
        if (networkPackage.channelName === '!Error') throw new WorkflowRpcStdioError(networkPackage.messageBody);
        if (networkPackage.channelName === '') {
            if (networkPackage.clientId === undefined
                || networkPackage.extraClientIds !== undefined
                || networkPackage.messageBody !== ''
                || this.assignedClientId !== undefined) {
                throw new WorkflowRpcStdioError(`Invalid Workflow RPC stdio assignment: ${original}`);
            }
            validatePositiveClientId(networkPackage.clientId, 'assigned Workflow RPC stdio client id');
            this.assignedClientId = networkPackage.clientId;
            this.currentState = 'assigned';
            this.assignment.resolve();
            return;
        }
        if (networkPackage.clientId === undefined || networkPackage.extraClientIds !== undefined) {
            throw new WorkflowRpcStdioError(`Invalid incoming Workflow RPC stdio package: ${original}`);
        }
        validatePositiveClientId(networkPackage.clientId, 'Workflow RPC stdio sender client id');
        if (networkPackage.channelName !== WORKFLOW_RPC_STDIO_CHANNEL) {
            throw new WorkflowRpcStdioError(`Unexpected Workflow RPC stdio channel: ${networkPackage.channelName}`);
        }
        const message: ChannelMessage = {
            senderClientId: networkPackage.clientId,
            channelName: networkPackage.channelName,
            messageBody: networkPackage.messageBody,
        };
        if (this.handlers.size === 0) this.queuedMessages.push(message);
        else this.deliver(message);
    }

    private deliver(message: ChannelMessage): void {
        for (const handler of this.handlers) void Promise.resolve(handler(message)).catch(error => this.fail(error));
    }

    private parentExit(): void {
        if (this.finished) return;
        this.exitedByParent = true;
        this.finished = true;
        this.currentState = 'stopped';
        this.cleanup();
        this.assignment.reject(new WorkflowRpcStdioError('The parent exited before Workflow RPC stdio assignment.'));
        this.completionDeferred.resolve({ type: 'stopped' });
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
        this.input.pause();
        this.handlers.clear();
        this.queuedMessages.length = 0;
        this.bytes = Buffer.alloc(0);
    }

    private write(message: string): Promise<void> {
        traceFrame('outgoing', message);
        const line = encodeWorkflowRpcStdioFrame(message);
        const next = this.writing.catch(() => undefined).then(async () => {
            if (this.finished) throw new WorkflowRpcStdioError('Workflow RPC stdio output is closed.');
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
        if (this.currentState !== 'connecting') throw new WorkflowRpcStdioError('The Workflow RPC stdio channel can only connect once.');
        this.attach();
        await this.write(WORKFLOW_RPC_STDIO_JOIN_PACKAGE);
        await this.assignment.promise;
    }

    start(): Promise<void> {
        if (this.currentState !== 'assigned') return Promise.reject(new WorkflowRpcStdioError('The Workflow RPC stdio channel is not assigned.'));
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
        validatePositiveClientId(receiverClientId, 'Workflow RPC stdio receiver client id');
        validateChannelName(channelName);
        return this.write(serializeNetworkPackage({ clientId: receiverClientId, channelName, messageBody }));
    }

    broadcast(channelName: string, messageBody: string, blockedReceivers: readonly number[] = []): Promise<void> {
        validateChannelName(channelName);
        for (const clientId of blockedReceivers) validatePositiveClientId(clientId, 'Workflow RPC stdio blocked receiver client id');
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
        this.assignment.reject(new WorkflowRpcStdioError('The Workflow RPC stdio channel stopped before assignment.'));
        this.completionDeferred.resolve({ type: 'stopped' });
    }
}
