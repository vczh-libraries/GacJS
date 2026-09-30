import {
    CHANNEL_ERROR_NAME,
    ChannelClientState,
    ChannelCompletion,
    ChannelMessageHandler,
    IChannelClient,
    NetworkPackage,
    parseNetworkPackage,
    serializeNetworkPackage,
    validateChannelName,
    validatePositiveClientId,
} from '@gaclib-website/remote-protocol-http/channel';
import {
    createRemoteProtocolClient,
    IRemoteProtocolClient,
} from '@gaclib-website/remote-protocol-http';
import { IRemoteProtocolRequests } from '@gaclib/remote-protocol';
import { deferred, normalizeError, WasmCommand, WasmNotification } from './messages.js';

export interface WasmApplicationOptions {
    moduleUrl: string | URL;
    workerUrl: string | URL;
    channels: readonly (readonly string[])[];
    createWorker?: (url: string | URL) => Worker;
}

export class WasmApplication {
    private readonly worker: Worker;
    private readonly readySignal = deferred<void>();
    private readonly rendererSignal = deferred<void>();
    private readonly exitSignal = deferred<number>();
    private stopped = false;
    readonly channels: readonly WasmChannelClient[];
    readonly ready = this.readySignal.promise;
    readonly rendererReady = this.rendererSignal.promise;
    readonly completion = this.exitSignal.promise;

    constructor(options: WasmApplicationOptions) {
        if (options.channels.length === 0) throw new Error('A Wasm application needs at least one connection.');
        this.channels = options.channels.map((names, index) => new WasmChannelClient(this, index + 1, names));
        this.worker = (options.createWorker ?? (url => new Worker(url, { type: 'module' })))(options.workerUrl);
        this.worker.onmessage = (event: MessageEvent<WasmNotification>) => {
            if (this.stopped) return;
            try {
                const { kind, connectionId, data } = event.data;
                switch (kind) {
                    case 'ready': this.readySignal.resolve(); break;
                    case 'renderer-ready': this.rendererSignal.resolve(); break;
                    case 'data': this.channels[connectionId - 1]?.receive(data); break;
                    case 'closed': this.channels[connectionId - 1]?.closed(); break;
                    case 'error': this.fail(new Error(data)); break;
                    case 'exit':
                        this.worker.terminate();
                        this.stopped = true;
                        this.readySignal.reject(new Error('Wasm application exited before startup.'));
                        this.rendererSignal.reject(new Error('Wasm application exited before renderer admission.'));
                        this.exitSignal.resolve(Number(data));
                        for (const connection of this.channels) connection.closed();
                        break;
                    default: throw new Error(`Unknown Wasm notification: ${String(kind)}`);
                }
            } catch (error) {
                this.fail(normalizeError(error));
            }
        };
        this.worker.onerror = event => { this.fail(new Error(event.message)); };
        this.send({ kind: 'start', moduleUrl: String(options.moduleUrl), connectionCount: this.channels.length });
    }

    private fail(error: Error): void {
        if (this.stopped) return;
        this.readySignal.reject(error);
        this.rendererSignal.reject(error);
        this.exitSignal.reject(error);
        for (const connection of this.channels) connection.fail(error);
        this.stop();
    }

    send(command: WasmCommand): void {
        if (this.stopped) throw new Error('Wasm application is stopped.');
        this.worker.postMessage(command);
    }

    stop(): void {
        if (this.stopped) return;
        this.worker.terminate();
        this.stopped = true;
        const error = new Error('Wasm application stopped.');
        this.readySignal.reject(error);
        this.rendererSignal.reject(error);
        this.exitSignal.reject(error);
        for (const connection of this.channels) connection.closed();
    }
}

export class WasmChannelClient implements IChannelClient {
    private assignedClientId: number | undefined;
    private currentState: ChannelClientState = 'connecting';
    private readonly assignment = deferred<void>();
    private readonly completed = deferred<ChannelCompletion>();
    private readonly handlers = new Set<ChannelMessageHandler>();
    private readonly pending: NetworkPackage[] = [];
    private connecting: Promise<void> | undefined;
    readonly completion = this.completed.promise;

    constructor(
        private readonly application: WasmApplication,
        private readonly connectionId: number,
        private readonly channelNames: readonly string[],
    ) {
        if (channelNames.length === 0) throw new Error('A Wasm client needs at least one channel.');
        for (const name of channelNames) validateChannelName(name);
        if (new Set(channelNames).size !== channelNames.length) throw new Error('Duplicate Wasm channel name.');
    }

    get clientId(): number | undefined { return this.assignedClientId; }
    get state(): ChannelClientState { return this.currentState; }

    connect(): Promise<void> {
        this.connecting ??= (async () => {
            await this.application.ready;
            if (this.currentState !== 'connecting') throw new Error('Wasm channel is closed.');
            this.application.send({
                kind: 'data', connectionId: this.connectionId,
                data: serializeNetworkPackage({ channelName: '', messageBody: this.channelNames.join('!') }),
            });
            await this.assignment.promise;
        })();
        return this.connecting;
    }

    receive(text: string): void {
        if (this.currentState === 'failed' || this.currentState === 'stopped') return;
        try {
            const message = parseNetworkPackage(text);
            if (message.channelName === CHANNEL_ERROR_NAME) throw new Error(message.messageBody);
            if (message.channelName === '') {
                if (this.assignedClientId !== undefined || message.extraClientIds !== undefined || message.messageBody !== '' || message.clientId === undefined) {
                    throw new Error('Invalid Wasm channel assignment.');
                }
                validatePositiveClientId(message.clientId);
                this.assignedClientId = message.clientId;
                this.currentState = 'assigned';
                this.assignment.resolve();
                return;
            }
            if (this.assignedClientId === undefined || message.extraClientIds !== undefined || message.clientId === undefined) {
                throw new Error('Invalid incoming Wasm package.');
            }
            validatePositiveClientId(message.clientId);
            if (!this.channelNames.includes(message.channelName)) return;
            if (this.handlers.size === 0) this.pending.push(message);
            else this.deliver(message);
        } catch (error) {
            this.fail(normalizeError(error));
        }
    }

    private deliver(message: NetworkPackage): void {
        for (const handler of this.handlers) {
            Promise.resolve(handler({
                senderClientId: message.clientId!, channelName: message.channelName, messageBody: message.messageBody,
            })).catch(error => { this.fail(normalizeError(error)); });
        }
    }

    onMessage(handler: ChannelMessageHandler): () => void {
        this.handlers.add(handler);
        try {
            for (const message of this.pending.splice(0)) this.deliver(message);
        } catch (error) {
            this.fail(normalizeError(error));
        }
        return () => { this.handlers.delete(handler); };
    }

    private send(message: NetworkPackage): Promise<void> {
        try {
            if (this.currentState !== 'assigned') throw new Error('Wasm channel is not assigned.');
            validateChannelName(message.channelName);
            if (!this.channelNames.includes(message.channelName)) throw new Error('Wasm channel was not advertised.');
            this.application.send({ kind: 'data', connectionId: this.connectionId, data: serializeNetworkPackage(message) });
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(normalizeError(error));
        }
    }

    sendToClient(receiverClientId: number, channelName: string, messageBody: string): Promise<void> {
        validatePositiveClientId(receiverClientId);
        return this.send({ clientId: receiverClientId, channelName, messageBody });
    }

    broadcast(channelName: string, messageBody: string, blockedReceivers: readonly number[] = []): Promise<void> {
        for (const id of blockedReceivers) validatePositiveClientId(id);
        if (new Set(blockedReceivers).size !== blockedReceivers.length || blockedReceivers.includes(this.assignedClientId ?? -1)) {
            return Promise.reject(new Error('Invalid blocked Wasm receivers.'));
        }
        return this.send({ channelName, messageBody, extraClientIds: blockedReceivers.length === 0 ? undefined : blockedReceivers });
    }

    async start(): Promise<void> {
        const result = await this.completion;
        if (result.type === 'failed') throw result.error;
    }

    fail(error: Error): void {
        if (this.currentState === 'stopped' || this.currentState === 'failed') return;
        this.currentState = 'failed';
        this.assignment.reject(error);
        this.completed.resolve({ type: 'failed', error });
    }

    closed(): void {
        if (this.currentState === 'stopped' || this.currentState === 'failed') return;
        this.currentState = 'stopped';
        this.assignment.reject(new Error('Wasm channel closed before assignment.'));
        this.completed.resolve({ type: 'stopped' });
    }

    stop(): void {
        this.closed();
    }
}

export async function connectWasmServer(application: WasmApplication, requests: IRemoteProtocolRequests): Promise<IRemoteProtocolClient> {
    await application.rendererReady;
    const channel = application.channels[0];
    await channel.connect();
    return createRemoteProtocolClient(requests, channel);
}
