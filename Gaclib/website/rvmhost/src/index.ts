import {
    HttpChannelClient,
    HttpChannelClientOptions,
} from '@gaclib-website/remote-protocol-http/http-channel';
import { IChannelClient } from '@gaclib-website/remote-protocol-http/channel';
import {
    IViewModelLocal,
    IViewModelTypeId,
    configureRpcEndpoint,
    registerIViewModelService,
} from '@gaclib-website/rvm';
import {
    RpcEndpoint,
    RpcEndpointCompletion,
    createRpcEndpoint,
} from '@gaclib/workflow-rpc';

export const RVM_CHANNEL_NAME = 'ViewModelChannel';
export const RVM_READY_CHANNEL_NAME = 'ViewModelReadyChannel';

export interface RvmHostSession {
    readonly channel: IChannelClient;
    readonly endpoint: RpcEndpoint;
    readonly startup: Promise<void>;
    readonly serviceHeld: Promise<void>;
    readonly completion: Promise<RpcEndpointCompletion>;
    stop(): void;
}

function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
    let resolve: (() => void) | undefined;
    const promise = new Promise<void>(resolvePromise => {
        resolve = resolvePromise;
    });
    if (resolve === undefined) {
        throw new Error('Failed to create an RVM host barrier.');
    }
    return { promise, resolve };
}

export function startRvmHostWithChannel(channel: IChannelClient): RvmHostSession {
    if (channel.clientId === undefined) {
        throw new Error('The RVM host channel must be assigned before starting the session.');
    }
    const endpoint = createRpcEndpoint(channel);
    configureRpcEndpoint(endpoint);
    const service: IViewModelLocal = {
        Translate(name: string): string {
            return `Hello, ${name}!`;
        },
    };
    const serviceReference = registerIViewModelService(endpoint, service);
    const held = deferred();
    let heldResolved = false;
    const unsubscribeHold = endpoint.onLocalObjectHold(notification => {
        if (!heldResolved
            && notification.hold
            && notification.remoteClientId !== endpoint.clientId
            && notification.reference.clientId === endpoint.clientId
            && notification.reference.objectId === serviceReference.objectId
            && notification.reference.typeId === IViewModelTypeId) {
            heldResolved = true;
            held.resolve();
        }
    });
    let stopped = false;
    const reading = channel.start();
    void reading.catch(() => undefined);
    const startup = (async () => {
        await channel.broadcast(RVM_READY_CHANNEL_NAME, JSON.stringify(['Ready']));
        await endpoint.initialize();
    })();
    void startup.catch(error => {
        endpoint.finalize(error instanceof Error ? error : new Error(String(error)));
    });
    const completion = endpoint.completion.finally(() => {
        unsubscribeHold();
    });
    const serviceHeld = Promise.race([
        held.promise,
        completion.then(result => {
            if (result.type === 'failed') {
                throw result.error;
            }
            throw new Error('The RVM host stopped before its service was held.');
        }),
    ]);
    void serviceHeld.catch(() => undefined);
    return {
        channel,
        endpoint,
        startup,
        serviceHeld,
        completion,
        stop(): void {
            if (stopped) {
                return;
            }
            stopped = true;
            endpoint.finalize();
            channel.stop();
        },
    };
}

export interface BrowserRvmHostOptions {
    readonly origin?: string;
    readonly basePath?: string;
    readonly fetch?: typeof fetch;
}

function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

export function startBrowserRvmHost(options: BrowserRvmHostOptions = {}): RvmHostSession {
    const channelOptions: HttpChannelClientOptions = {
        origin: options.origin,
        basePath: options.basePath,
        fetch: options.fetch,
        channelNames: [RVM_CHANNEL_NAME, RVM_READY_CHANNEL_NAME],
    };
    const channel = new HttpChannelClient(channelOptions);
    let inner: RvmHostSession | undefined;
    let stopped = false;
    const startup = (async () => {
        await channel.connect();
        if (stopped) {
            throw new Error('The RVM host was stopped during channel assignment.');
        }
        inner = startRvmHostWithChannel(channel);
        await inner.startup;
    })();
    void startup.catch(() => undefined);
    const serviceHeld = (async () => {
        await startup;
        if (inner === undefined) throw new Error('The RVM host did not start.');
        await inner.serviceHeld;
    })();
    void serviceHeld.catch(() => undefined);
    const completion = (async (): Promise<RpcEndpointCompletion> => {
        try {
            await startup;
            if (inner === undefined) throw new Error('The RVM host did not start.');
            return await inner.completion;
        } catch (error) {
            if (stopped) return { type: 'stopped' };
            return { type: 'failed', error: normalizeError(error) };
        }
    })();
    return {
        channel,
        get endpoint(): RpcEndpoint {
            if (inner === undefined) {
                throw new Error('The RVM host endpoint is unavailable before startup.');
            }
            return inner.endpoint;
        },
        startup,
        serviceHeld,
        completion,
        stop(): void {
            if (stopped) return;
            stopped = true;
            if (inner === undefined) channel.stop();
            else inner.stop();
        },
    };
}
