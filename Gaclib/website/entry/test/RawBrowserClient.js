// Browser-only controlled transport. The built page and renderer remain unchanged.
import { createHtmlRenderer } from '/gacui.js';
import { createRemoteProtocolHttpClient } from '/http.js';
import { GacUIHtmlRendererExitError, RemoteProtocolHttpDisconnectError } from '/entry-real.js';
export * from '/entry-real.js';

function createSession(settings, alreadyStarted) {
    const renderer = createHtmlRenderer(settings);
    const sent = [];
    let nextRequest = 1;
    const pending = new Map();
    let receive;
    const protocolClient = createRemoteProtocolHttpClient(renderer.requests, {
        onMessage(handler) { receive = handler; return () => undefined; },
        sendToClient(_id, _channel, body) {
            const invocations = JSON.parse(body);
            sent.push(...invocations);
            for (const invocation of invocations) {
                if (invocation.semantic === 'Response') {
                    pending.get(invocation.id)?.(invocation.arguments);
                    pending.delete(invocation.id);
                }
            }
            return Promise.resolve();
        },
    });
    renderer.start(protocolClient.responses, protocolClient.events);
    const send = (name, args) => receive({
        senderClientId: 1,
        channelName: 'GacUIRemoteProtocol',
        messageBody: JSON.stringify([{ semantic: 'Message', name, arguments: args }]),
    });
    let resolveCompletion;
    let rejectCompletion;
    const completion = new Promise((resolve, reject) => {
        resolveCompletion = resolve;
        rejectCompletion = reject;
    });
    const counts = { installed: 0, updated: 0, uninstalled: 0 };
    const listeners = { installed: 0, updated: 0, uninstalled: 0 };
    for (const kind of Object.keys(counts)) {
        const name = `rawElement${kind[0].toUpperCase()}${kind.slice(1)}`;
        const original = renderer[name].bind(renderer);
        original(() => { counts[kind]++; });
        renderer[name] = listener => {
            listeners[kind]++;
            const unsubscribe = original(listener);
            let active = true;
            return () => {
                if (!active) return;
                active = false;
                listeners[kind]--;
                unsubscribe();
            };
        };
    }
    const rect = (x, y, width, height) => ({ x1: x, y1: y, x2: x + width, y2: y + height });
    const content = (element, bounds, validArea = bounds) => ({
        element, bounds, validArea, hitTestResult: null, cursor: null,
    });
    const node = (id, element, bounds, children = [], validArea = bounds) => ({
        id, content: content(element, bounds, validArea), children,
    });
    const root = children => node(-1, null, rect(0, 0, 0, 0), children);
    let frameId = 0;
    const state = {
        renderer, counts, listeners, rect, content, node, root, sent,
        request(name, args) {
            const id = nextRequest++;
            return new Promise(resolve => {
                pending.set(id, resolve);
                receive({ senderClientId: 1, channelName: 'GacUIRemoteProtocol', messageBody: JSON.stringify([
                    { semantic: 'Request', id, name, arguments: args },
                ]) });
                send('RendererIdle');
            });
        },
        started: false,
        clientStops: 0,
        describe(rawId, data) {
            send('RendererBeginRendering', {
                frameId: ++frameId,
                updatedElements: [['ElementDesc_Raw', { id: 1, rawId, data }]],
            });
            send('RendererIdle');
        },
        full(tree) {
            send('RendererRenderDom', tree);
            send('RendererIdle');
        },
        diff(diffsInOrder) {
            send('RendererRenderDomDiff', { diffsInOrder });
            send('RendererIdle');
        },
        layout(width = 240, height = 240) {
            state.full(root([node(1, 1, rect(20, 30, width, height))]));
        },
        finish(outcome) {
            renderer.stop();
            if (outcome === 'normal') resolveCompletion();
            else if (outcome === 'disconnect') rejectCompletion(new RemoteProtocolHttpDisconnectError());
            else if (outcome === 'exit') rejectCompletion(new GacUIHtmlRendererExitError());
            else rejectCompletion(new Error('Controlled raw clock failure'));
        },
    };
    const client = {
        start() {
            if (!state.started) {
                state.started = true;
                send('RendererCreated', [{ id: 1, type: 'Raw' }]);
                if (alreadyStarted) {
                    state.describe('FullControlTest.Clock', '10:20:30');
                    state.layout();
                }
            }
            return completion;
        },
        stop() { state.clientStops++; },
    };
    window.rawTest = state;
    if (alreadyStarted) client.start();
    return { renderer, client, completion };
}

export async function runGacUI(settings) {
    const { renderer, client } = createSession(settings, false);
    if (new URLSearchParams(location.search).has('defer-startup')) {
        await new Promise(resolve => { window.rawTest.releaseStartup = resolve; });
    }
    return [renderer, client];
}

export function runRvmGacUI(settings) {
    const { renderer, client, completion } = createSession(settings, true);
    const state = window.rawTest;
    state.hostStops = 0;
    let stopped = false;
    let finishHost;
    const hostOutcome = new Promise(resolve => { finishHost = resolve; });
    state.finishHost = () => finishHost('stopped');
    return {
        renderer, rendererClient: client, completion, hostOutcome,
        startup: Promise.resolve(),
        stop() {
            if (stopped) return;
            stopped = true;
            state.hostStops++;
            finishHost('stopped');
            client.stop();
            renderer.stop();
        },
    };
}
export { parseConnectionOptions, connectionOptionsUrl, coreOrigin } from '/entry-real.js';
