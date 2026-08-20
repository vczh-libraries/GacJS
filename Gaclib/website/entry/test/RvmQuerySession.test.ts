import { expect, test } from 'vitest';
import { ChannelCompletion, ChannelMessageHandler, IChannelClient } from '@gaclib-website/remote-protocol-http/channel';
import { HttpChannelConnectionError } from '@gaclib-website/remote-protocol-http/http-channel';
import { IRemoteProtocolHttpClient } from '@gaclib-website/remote-protocol-http';
import { RvmHostSession } from '@gaclib-website/rvmhost';
import { runRvmGacUI } from '../src/index.js';

function deferred<T>(): { readonly promise: Promise<T>; readonly resolve: (value: T) => void; readonly reject: (error: Error) => void } {
    let resolve: ((value: T) => void) | undefined;
    let reject: ((error: Error) => void) | undefined;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    if (resolve === undefined || reject === undefined) throw new Error('Failed to create a test barrier.');
    return { promise, resolve, reject };
}

async function waitUntil(predicate: () => boolean): Promise<void> {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    throw new Error('Timed out waiting for the query-session test condition.');
}

function fakeHost(startup: Promise<void>, held: Promise<void>) {
    const completion = deferred<Awaited<RvmHostSession['completion']>>();
    let stops = 0;
    const session: RvmHostSession = {
        channel: {} as IChannelClient,
        endpoint: {} as RvmHostSession['endpoint'],
        startup,
        serviceHeld: held,
        completion: completion.promise,
        stop: () => { stops++; },
    };
    return { session, completion, stops: () => stops };
}

class FakeRendererChannel implements IChannelClient {
    private assignedClientId: number | undefined;
    private currentState = 'connecting' as const;
    private readonly terminal = deferred<ChannelCompletion>();
    readonly completion = this.terminal.promise;
    stopCount = 0;

    constructor(private readonly connecting: 'assign' | Error) {}
    get clientId(): number | undefined { return this.assignedClientId; }
    get state() { return this.currentState; }
    connect(): Promise<void> {
        if (this.connecting instanceof Error) return Promise.reject(this.connecting);
        this.assignedClientId = 7;
        return Promise.resolve();
    }
    start(): Promise<void> { return this.completion.then(() => undefined); }
    onMessage(_handler: ChannelMessageHandler): () => void { return () => undefined; }
    sendToClient(): Promise<void> { return Promise.resolve(); }
    broadcast(): Promise<void> { return Promise.resolve(); }
    stop(): void {
        if (this.stopCount++ === 0) this.terminal.resolve({ type: 'stopped' });
    }
}

function fakeRenderer() {
    let starts = 0;
    let stops = 0;
    return {
        value: {
            requests: {},
            start: () => { starts++; },
            stop: () => { stops++; },
        },
        starts: () => starts,
        stops: () => stops,
    };
}

test('query session is returned before bootstrap and page teardown cancels it immediately', async () => {
    const startup = deferred<void>();
    const host = fakeHost(startup.promise, new Promise<void>(() => undefined));
    const renderer = fakeRenderer();
    const session = runRvmGacUI({} as never, {
        createRenderer: () => renderer.value as never,
        startHost: () => host.session,
        createRendererChannel: () => new FakeRendererChannel('assign'),
    });
    expect(session.host).toBe(host.session);
    session.stop();
    session.stop();
    await expect(session.startup).rejects.toThrow(/stopped during bootstrap/u);
    expect(host.stops()).toBe(1);
    expect(renderer.stops()).toBe(1);
});

test('query composition retries renderer assignment, preserves host failure after assignment, and tears down exactly once', async () => {
    const host = fakeHost(Promise.resolve(), Promise.resolve());
    const renderer = fakeRenderer();
    const first = new FakeRendererChannel(new HttpChannelConnectionError(false));
    const second = new FakeRendererChannel('assign');
    const channels = [first, second];
    const rendererCompletion = deferred<void>();
    let clientStops = 0;
    const client: IRemoteProtocolHttpClient = {
        responses: {} as IRemoteProtocolHttpClient['responses'],
        events: {} as IRemoteProtocolHttpClient['events'],
        channelClient: second,
        start: () => rendererCompletion.promise,
        stop: () => { clientStops++; second.stop(); },
    };
    const session = runRvmGacUI({} as never, {
        createRenderer: () => renderer.value as never,
        startHost: () => host.session,
        createRendererChannel: () => channels.shift()!,
        createRendererClient: () => client,
        retryDelay: () => Promise.resolve(),
    });
    await session.startup;
    expect(session.rendererClient).toBe(client);
    expect(first.stopCount).toBe(1);
    expect(renderer.starts()).toBe(1);
    let rendererSettled = false;
    void session.completion.then(
        () => { rendererSettled = true; },
        () => { rendererSettled = true; },
    );
    host.completion.resolve({ type: 'failed', error: new Error('host failed after assignment') });
    await expect(session.hostOutcome).resolves.toBe('failed');
    await Promise.resolve();
    expect(rendererSettled).toBe(false);
    const rendererFailure = new Error('Core-authored renderer failure');
    rendererCompletion.reject(rendererFailure);
    await expect(session.completion).rejects.toBe(rendererFailure);
    expect(host.stops()).toBe(0);
    session.stop();
    session.stop();
    await waitUntil(() => second.stopCount === 1);
    expect(clientStops).toBe(1);
    expect(renderer.stops()).toBe(1);
    expect(host.stops()).toBe(1);
});
