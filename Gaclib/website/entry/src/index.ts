import {
    connectHttpServer,
    createRemoteProtocolHttpClient,
    HttpChannelClient,
    HttpChannelConnectionError,
    IRemoteProtocolHttpClient
} from '@gaclib-website/remote-protocol-http';
import { IChannelClient } from '@gaclib-website/remote-protocol-http/channel';
import { createHtmlRenderer, IGacUIRenderer, GacUISettings } from '@gaclib/renderer'
import { RvmHostSession, startBrowserRvmHost } from '@gaclib-website/rvmhost';

export { isShortcutReservedForBrowser } from '@gaclib/renderer';

export async function runGacUI(settings: GacUISettings): Promise<[IGacUIRenderer, IRemoteProtocolHttpClient]> {
    const renderer = createHtmlRenderer(settings);
    const client = await connectHttpServer('http://localhost:8888', renderer.requests);
    renderer.start(client.responses, client.events);
    return [renderer, client];
}

export interface RvmGacUISession {
    readonly renderer: IGacUIRenderer;
    readonly rendererClient: IRemoteProtocolHttpClient;
    readonly host: RvmHostSession;
    readonly startup: Promise<void>;
    readonly completion: Promise<void>;
    readonly hostOutcome: Promise<'stopped' | 'failed'>;
    stop(): void;
}

export interface RvmGacUIOptions {
    readonly createRenderer?: (settings: GacUISettings) => IGacUIRenderer;
    readonly startHost?: () => RvmHostSession;
    readonly createRendererChannel?: () => IChannelClient;
    readonly createRendererClient?: typeof createRemoteProtocolHttpClient;
    readonly retryDelay?: () => Promise<void>;
}

function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

export function runRvmGacUI(settings: GacUISettings, options: RvmGacUIOptions = {}): RvmGacUISession {
    const renderer = (options.createRenderer ?? createHtmlRenderer)(settings);
    const startHost: () => RvmHostSession = options.startHost
        ?? (() => startBrowserRvmHost());
    const host = startHost();
    const createRendererChannel = options.createRendererChannel
        ?? (() => new HttpChannelClient({ channelNames: ['GacUIRemoteProtocol'] }));
    const createRendererClient = options.createRendererClient ?? createRemoteProtocolHttpClient;
    const retryDelay = options.retryDelay ?? (() => new Promise<void>(resolve => setTimeout(resolve, 25)));
    let rendererClient: IRemoteProtocolHttpClient | undefined;
    let rendererStarted = false;
    let rendererChannel: IChannelClient | undefined;
    let stopped = false;
    let hostStopped = false;
    let rendererStopped = false;
    let rendererClientStopped = false;
    const stopHost = (): void => {
        if (hostStopped) return;
        hostStopped = true;
        host.stop();
    };
    const stopRenderer = (): void => {
        if (rendererStopped) return;
        rendererStopped = true;
        renderer.stop();
    };
    const stopRendererClient = (): void => {
        if (rendererClientStopped || rendererClient === undefined) return;
        rendererClientStopped = true;
        rendererClient.stop();
    };
    let resolveStopped: (() => void) | undefined;
    const stoppedPromise = new Promise<void>(resolve => { resolveStopped = resolve; });
    if (resolveStopped === undefined) throw new Error('Failed to create the RVM query stop barrier.');
    const raceStopped = async <T>(operation: Promise<T>): Promise<T> => {
        const result = await Promise.race([
            operation.then(value => ({ type: 'value' as const, value })),
            stoppedPromise.then(() => ({ type: 'stopped' as const })),
        ]);
        if (result.type === 'stopped') throw new Error('RVM query session stopped during bootstrap.');
        return result.value;
    };
    const startup = (async () => {
        try {
            await raceStopped(host.startup);
            await raceStopped(host.serviceHeld);
            while (!stopped) {
                const channel = createRendererChannel();
                rendererChannel = channel;
                try {
                    const result = await Promise.race([
                        channel.connect().then(() => 'assigned' as const),
                        host.completion.then(() => 'host-complete' as const),
                        stoppedPromise.then(() => 'stopped' as const),
                    ]);
                    if (result === 'stopped') {
                        channel.stop();
                        throw new Error('RVM query session stopped during renderer assignment.');
                    }
                    if (result === 'host-complete') {
                        channel.stop();
                        throw new Error('The RVM host stopped before renderer assignment.');
                    }
                    rendererClient = createRendererClient(renderer.requests, channel);
                    renderer.start(rendererClient.responses, rendererClient.events);
                    rendererStarted = true;
                    rendererChannel = undefined;
                    return;
                } catch (error) {
                    channel.stop();
                    if (rendererChannel === channel) rendererChannel = undefined;
                    if (!(error instanceof HttpChannelConnectionError) || error.assigned || error.serverError) throw error;
                    const result = await Promise.race([
                        host.completion.then(() => 'host-complete' as const),
                        stoppedPromise.then(() => 'stopped' as const),
                        retryDelay().then(() => 'retry' as const),
                    ]);
                    if (result === 'host-complete') throw error;
                    if (result === 'stopped') throw new Error('RVM query session stopped during renderer assignment.');
                }
            }
            throw new Error('RVM query session stopped before renderer assignment.');
        } catch (error) {
            const normalized = normalizeError(error);
            stopHost();
            rendererChannel?.stop();
            stopRendererClient();
            if (rendererStarted) stopRenderer();
            throw normalized;
        }
    })();
    void startup.catch(() => undefined);
    const completion = (async () => {
        await startup;
        if (rendererClient === undefined) throw new Error('RVM renderer client is unavailable after startup.');
        await rendererClient.start();
    })();
    void completion.catch(() => undefined);
    const hostOutcome = host.completion.then(result => result.type);
    return {
        renderer,
        get rendererClient(): IRemoteProtocolHttpClient {
            if (rendererClient === undefined) {
                throw new Error('The RVM renderer client is unavailable before startup.');
            }
            return rendererClient;
        },
        host,
        startup,
        completion,
        hostOutcome,
        stop(): void {
            if (stopped) return;
            stopped = true;
            resolveStopped?.();
            rendererChannel?.stop();
            stopRendererClient();
            stopRenderer();
            stopHost();
        },
    };
}

// for elements.html
export { GacUIHtmlRendererExitError, applyBounds, applyTypedStyle, applyFeatureGates } from '@gaclib/renderer';
export { RemoteProtocolHttpDisconnectError } from '@gaclib-website/remote-protocol-http';

// for snapshots.html
export { Snapshot } from './snapshotIndex';
export { createTreeElement, readSnapshot, readFrames } from './snapshotTreeView';
export { renderUI } from './snapshotRendering';
