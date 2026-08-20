import {
    CHANNEL_ERROR_NAME,
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
} from './channel.js';

export const DEFAULT_HTTP_CHANNEL_ORIGIN = 'http://localhost:8888';
export const DEFAULT_HTTP_CHANNEL_BASE_PATH = '/GacUIRemoteProtocolHttp';

export type HttpFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class HttpChannelConnectionError extends Error {
    public readonly assigned: boolean;
    public readonly serverError: boolean;

    constructor(assigned: boolean, message = assigned
        ? 'HTTP channel disconnected.'
        : 'HTTP channel closed before client assignment.', serverError = false) {
        super(message);
        this.assigned = assigned;
        this.serverError = serverError;
    }
}

export interface HttpChannelClientOptions {
    origin?: string;
    basePath?: string;
    channelNames: readonly string[];
    fetch?: HttpFetch;
}

interface ConnectResponse {
    requestUrl: string;
    responseUrl: string;
}

type ReadResult =
    | { type: 'message'; responseText: string | undefined }
    | { type: 'failure'; error: Error };

function normalizeError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }
    return new Error(String(error));
}

function validateOrigin(origin: string): void {
    const url = new URL(origin);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.pathname !== '/' || url.search !== '' || url.hash !== '') {
        throw new Error(`Invalid HTTP channel origin: ${origin}`);
    }
}

function validateBasePath(basePath: string): void {
    if (!basePath.startsWith('/') || basePath.endsWith('/') || basePath.includes('?') || basePath.includes('#')) {
        throw new Error(`Invalid HTTP channel base path: ${basePath}`);
    }
}

export class HttpChannelClient implements IChannelClient {
    private readonly origin: string;
    private readonly basePath: string;
    private readonly channelNames: readonly string[];
    private readonly fetchImpl: HttpFetch;
    private readonly handlers = new Set<ChannelMessageHandler>();
    private readonly queuedMessages: ChannelMessage[] = [];
    private readonly abortControllers = new Set<AbortController>();
    private readonly completionResolve: (completion: ChannelCompletion) => void;
    private readonly completionPromise: Promise<ChannelCompletion>;
    private currentState: ChannelClientState = 'connecting';
    private assignedClientId: number | undefined;
    private urls: ConnectResponse | undefined;
    private sending: Promise<void> = Promise.resolve();
    private startPromise: Promise<void> | undefined;
    private completed = false;

    constructor(options: HttpChannelClientOptions) {
        if (options.channelNames.length === 0) {
            throw new Error('An HTTP channel client must advertise at least one channel.');
        }

        const uniqueNames = new Set<string>();
        for (const channelName of options.channelNames) {
            validateChannelName(channelName);
            if (uniqueNames.has(channelName)) {
                throw new Error(`Duplicate HTTP channel name: ${channelName}`);
            }
            uniqueNames.add(channelName);
        }

        this.origin = options.origin ?? DEFAULT_HTTP_CHANNEL_ORIGIN;
        this.basePath = options.basePath ?? DEFAULT_HTTP_CHANNEL_BASE_PATH;
        validateOrigin(this.origin);
        validateBasePath(this.basePath);
        this.channelNames = [...options.channelNames];
        const globalFetch = globalThis.fetch as HttpFetch | undefined;
        let fetchImpl = options.fetch;
        if (fetchImpl === undefined) {
            if (globalFetch === undefined) {
                throw new Error('No fetch implementation is available for the HTTP channel client.');
            }
            fetchImpl = (input, init) => globalThis.fetch(input, init);
        }
        this.fetchImpl = fetchImpl;

        let resolveCompletion: ((completion: ChannelCompletion) => void) | undefined;
        this.completionPromise = new Promise(resolve => {
            resolveCompletion = resolve;
        });
        if (resolveCompletion === undefined) {
            throw new Error('Failed to create the HTTP channel completion promise.');
        }
        this.completionResolve = resolveCompletion;
    }

    get clientId(): number | undefined {
        return this.assignedClientId;
    }

    get state(): ChannelClientState {
        return this.currentState;
    }

    get completion(): Promise<ChannelCompletion> {
        return this.completionPromise;
    }

    private finish(completion: ChannelCompletion): void {
        if (this.completed) {
            return;
        }
        this.completed = true;
        this.currentState = completion.type === 'stopped' ? 'stopped' : 'failed';
        for (const controller of this.abortControllers) {
            controller.abort();
        }
        this.abortControllers.clear();
        this.completionResolve(completion);
    }

    private fail(error: unknown): Error {
        const normalized = normalizeError(error);
        const failure = normalized instanceof HttpChannelConnectionError
            ? normalized
            : new HttpChannelConnectionError(this.assignedClientId !== undefined, normalized.message);
        this.finish({ type: 'failed', error: failure });
        return failure;
    }

    private getUrl(path: string): string {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        if (path.startsWith(this.basePath)) {
            return `${this.origin}${path}`;
        }
        return `${this.origin}${this.basePath}${path}`;
    }

    private async fetchText(url: string, init: RequestInit): Promise<string> {
        const controller = new AbortController();
        this.abortControllers.add(controller);
        try {
            const response = await this.fetchImpl(url, { ...init, signal: controller.signal });
            if (response.status !== 200) {
                throw new HttpChannelConnectionError(this.assignedClientId !== undefined);
            }
            return await response.text();
        } catch (error) {
            if (this.currentState === 'stopped') {
                throw error;
            }
            throw this.fail(error);
        } finally {
            this.abortControllers.delete(controller);
        }
    }

    private async connectServer(): Promise<ConnectResponse> {
        const url = `${this.origin}${this.basePath}/VlppInterProcess/Connect`;
        const responseText = await this.fetchText(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json; charset=utf8' },
        });
        const separator = responseText.indexOf(';');
        if (separator === -1 || responseText.indexOf(';', separator + 1) !== -1) {
            throw this.fail(new Error(`Invalid connect response: ${responseText}`));
        }
        return {
            requestUrl: responseText.substring(0, separator),
            responseUrl: responseText.substring(separator + 1),
        };
    }

    private async post(message: string): Promise<string | undefined> {
        if (this.urls === undefined) {
            throw new Error('HTTP channel connection URLs are not available.');
        }
        const responseText = await this.fetchText(this.getUrl(this.urls.responseUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf8' },
            body: message,
        });
        return responseText === '' ? undefined : responseText;
    }

    private async read(): Promise<string | undefined> {
        if (this.urls === undefined) {
            throw new Error('HTTP channel connection URLs are not available.');
        }
        const responseText = await this.fetchText(this.getUrl(this.urls.requestUrl), {
            method: 'POST',
            headers: { 'Accept': 'application/json; charset=utf8' },
        });
        return responseText === '' ? undefined : responseText;
    }

    private acceptAssignment(networkPackage: NetworkPackage, originalText: string): boolean {
        if (networkPackage.channelName !== '') {
            return false;
        }
        if (networkPackage.extraClientIds !== undefined || networkPackage.messageBody !== '' || networkPackage.clientId === undefined) {
            throw this.fail(new Error(`Invalid channel assignment: ${originalText}`));
        }
        validatePositiveClientId(networkPackage.clientId, 'assigned channel client id');
        if (this.assignedClientId !== undefined) {
            throw this.fail(new Error('The HTTP channel client received more than one assignment.'));
        }
        this.assignedClientId = networkPackage.clientId;
        this.currentState = 'assigned';
        return true;
    }

    private dispatch(networkPackage: NetworkPackage, originalText: string): void {
        if (networkPackage.channelName === CHANNEL_ERROR_NAME) {
            throw this.fail(new HttpChannelConnectionError(
                this.assignedClientId !== undefined,
                networkPackage.messageBody,
                true,
            ));
        }
        if (this.acceptAssignment(networkPackage, originalText)) {
            return;
        }
        if (networkPackage.extraClientIds !== undefined || networkPackage.clientId === undefined) {
            throw this.fail(new Error(`Invalid incoming network package: ${originalText}`));
        }
        validatePositiveClientId(networkPackage.clientId, 'sender client id');
        if (!this.channelNames.includes(networkPackage.channelName)) {
            return;
        }

        const message: ChannelMessage = {
            senderClientId: networkPackage.clientId,
            channelName: networkPackage.channelName,
            messageBody: networkPackage.messageBody,
        };
        if (this.handlers.size === 0) {
            this.queuedMessages.push(message);
            return;
        }
        this.deliver(message);
    }

    private deliver(message: ChannelMessage): void {
        for (const handler of this.handlers) {
            Promise.resolve(handler(message)).catch(error => {
                this.fail(error);
            });
        }
    }

    private handleText(text: string): void {
        let networkPackage: NetworkPackage;
        try {
            networkPackage = parseNetworkPackage(text);
        } catch (error) {
            throw this.fail(error);
        }
        this.dispatch(networkPackage, text);
    }

    async connect(): Promise<void> {
        if (this.currentState !== 'connecting') {
            if (this.currentState === 'assigned') {
                return;
            }
            throw new Error('The HTTP channel client is already closed.');
        }

        this.urls = await this.connectServer();
        const join = serializeNetworkPackage({
            channelName: '',
            messageBody: this.channelNames.join('!'),
        });
        const firstResponse = await this.post(join);
        if (firstResponse !== undefined) {
            this.handleText(firstResponse);
        }

        while (this.currentState === 'connecting') {
            const responseText = await this.read();
            if (responseText !== undefined) {
                this.handleText(responseText);
            }
        }

        if (this.currentState !== 'assigned') {
            throw new HttpChannelConnectionError(false);
        }
    }

    private enqueue(networkPackage: NetworkPackage): Promise<void> {
        if (this.currentState !== 'assigned') {
            return Promise.reject(new Error('The HTTP channel client is not assigned.'));
        }

        const message = serializeNetworkPackage(networkPackage);
        const current = this.sending
            .catch(() => undefined)
            .then(async () => {
                if (this.currentState !== 'assigned') {
                    throw new Error('The HTTP channel client is closed.');
                }
                const responseText = await this.post(message);
                if (responseText !== undefined) {
                    this.handleText(responseText);
                }
            });
        this.sending = current;
        return current;
    }

    sendToClient(receiverClientId: number, channelName: string, messageBody: string): Promise<void> {
        validatePositiveClientId(receiverClientId, 'receiver client id');
        validateChannelName(channelName);
        if (!this.channelNames.includes(channelName)) {
            return Promise.reject(new Error(`The HTTP channel client did not advertise channel: ${channelName}`));
        }
        return this.enqueue({ clientId: receiverClientId, channelName, messageBody });
    }

    broadcast(channelName: string, messageBody: string, blockedReceivers: readonly number[] = []): Promise<void> {
        validateChannelName(channelName);
        if (!this.channelNames.includes(channelName)) {
            return Promise.reject(new Error(`The HTTP channel client did not advertise channel: ${channelName}`));
        }
        const uniqueIds = new Set<number>();
        for (const clientId of blockedReceivers) {
            validatePositiveClientId(clientId, 'blocked receiver client id');
            if (clientId === this.assignedClientId) {
                return Promise.reject(new Error('The HTTP channel client cannot block itself from a broadcast.'));
            }
            if (uniqueIds.has(clientId)) {
                return Promise.reject(new Error(`Duplicate blocked receiver client id: ${String(clientId)}`));
            }
            uniqueIds.add(clientId);
        }
        return this.enqueue({
            extraClientIds: blockedReceivers.length === 0 ? undefined : [...blockedReceivers],
            channelName,
            messageBody,
        });
    }

    onMessage(handler: ChannelMessageHandler): () => void {
        this.handlers.add(handler);
        if (this.queuedMessages.length > 0) {
            const messages = this.queuedMessages.splice(0, this.queuedMessages.length);
            for (const message of messages) {
                this.deliver(message);
            }
        }
        return () => {
            this.handlers.delete(handler);
        };
    }

    start(): Promise<void> {
        if (this.startPromise !== undefined) {
            return this.startPromise;
        }
        if (this.currentState !== 'assigned') {
            return Promise.reject(new Error('The HTTP channel client is not assigned.'));
        }

        this.startPromise = (async () => {
            while (this.currentState === 'assigned') {
                const reading = this.read()
                    .then<ReadResult>(responseText => ({ type: 'message', responseText }))
                    .catch<ReadResult>(error => ({ type: 'failure', error: normalizeError(error) }));
                const result = await Promise.race<ReadResult | ChannelCompletion>([
                    reading,
                    this.completion,
                ]);
                if (result.type === 'failed') {
                    throw result.error;
                }
                if (result.type === 'stopped') {
                    return;
                }
                if (result.type === 'failure') {
                    throw result.error;
                }
                if (result.responseText !== undefined && this.currentState === 'assigned') {
                    this.handleText(result.responseText);
                }
            }
            const completion = await this.completion;
            if (completion.type === 'failed') {
                throw completion.error;
            }
        })();
        return this.startPromise;
    }

    stop(): void {
        this.finish({ type: 'stopped' });
    }
}

export async function connectHttpChannel(options: HttpChannelClientOptions): Promise<HttpChannelClient> {
    const client = new HttpChannelClient(options);
    await client.connect();
    return client;
}
