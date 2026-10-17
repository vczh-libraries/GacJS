import { afterEach, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const controlled = vi.hoisted(() => ({
    createApplication: undefined as (() => unknown) | undefined,
    createRenderer: undefined as (() => unknown) | undefined,
    connectRenderer: undefined as (() => Promise<unknown>) | undefined,
    startHost: undefined as (() => unknown) | undefined,
}));
vi.mock('@gaclib-website/remote-protocol-wasm', () => ({
    WasmApplication: class { constructor() { return controlled.createApplication!(); } },
    connectWasmServer: () => controlled.connectRenderer!(),
}));
vi.mock('@gaclib-website/rvmhost', () => ({
    RVM_CHANNEL_NAME: 'RVM',
    RVM_READY_CHANNEL_NAME: 'RVM_READY',
    startRvmHostWithChannel: () => controlled.startHost!(),
}));
vi.mock('@gaclib/renderer', () => ({
    createHtmlRenderer: () => controlled.createRenderer!(),
    GacUIHtmlRendererExitError: class extends Error {},
    isShortcutReservedForBrowser: () => false,
}));

// Test compiled composition, after yarn build, without loading a Wasm runtime.
import { startWasmPage } from '../lib/wasmPage.js';

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    void promise.catch(() => undefined);
    return { promise, resolve, reject };
}

class PageElement extends EventTarget {
    style: Record<string, string> = {};
    children: unknown[] = [];
    classList = new Set<string>();
    textContent = '';
    disabled = true;
    onclick?: () => void;
    focus(): void {}
    append(child: unknown): void { this.children.push(child); }
    replaceChildren(...children: unknown[]): void { this.children = children; }
}

function setup(app = 'fct') {
    const ids = ['screen', 'exit', 'force-exit', 'reload', 'error-mask', 'error-message', 'success-mask', 'success-message'];
    const elements = Object.fromEntries(ids.map(id => [id, new PageElement()]));
    const pageWindow = new EventTarget();
    const events: string[] = [];
    const delivery = deferred<void>();
    const core = deferred<number>();
    const started = deferred<void>();
    const picture = { kind: 'retained canvas picture' };
    const buttons = ['exit', 'force-exit', 'reload'].map(id => elements[id]);
    vi.stubGlobal('document', {
        body: { dataset: { app } },
        getElementById: (id: string) => elements[id.replace('gacui-', '')],
        querySelectorAll: () => buttons,
    });
    vi.stubGlobal('window', pageWindow);
    vi.stubGlobal('location', { href: `http://localhost/wasm-${app}/`, reload: () => events.push('reload') });
    vi.stubGlobal('crossOriginIsolated', true);
    const application = {
        ready: Promise.resolve(),
        completion: core.promise,
        channels: [{}, { connect: () => { events.push('host-connect'); return Promise.resolve(); } }],
        stop: () => { events.push('application-stop'); },
    };
    const renderer = {
        requests: {},
        start: () => events.push('renderer-start'),
        stop: () => events.push('renderer-stop'),
        requestStopToCore: (force: boolean) => events.push(force ? 'force-exit' : 'exit'),
    };
    const client = {
        responses: {}, events: {},
        start: () => { events.push('client-start'); started.resolve(); return delivery.promise; },
        stop: () => events.push('client-stop'),
    };
    const host = {
        startup: Promise.resolve(),
        serviceHeld: Promise.resolve(),
        stop: () => events.push('host-stop'),
    };
    controlled.createApplication = () => { events.push('application'); return application; };
    controlled.createRenderer = () => { events.push('renderer'); return renderer; };
    controlled.connectRenderer = () => { events.push('renderer-connect'); return Promise.resolve(client); };
    controlled.startHost = () => { events.push('host-start'); return host; };
    const setupRenderer = (actual: unknown) => {
        expect(actual).toBe(renderer);
        events.push('setup');
        elements.screen.append(picture);
        return () => { events.push('cleanup'); };
    };
    return { events, elements, pageWindow, delivery, core, started, picture, setupRenderer, application, client, host };
}

afterEach(() => vi.unstubAllGlobals());

test('Wasm setup precedes connection and delivery, with retained picture and idempotent completion cleanup', async () => {
    const h = setup();
    const running = startWasmPage(h.setupRenderer);
    await h.started.promise;
    expect(h.events).toEqual(['application', 'renderer', 'setup', 'renderer-connect', 'renderer-start', 'client-start']);
    expect(h.elements.reload.disabled).toBe(true);
    h.elements.exit.onclick!();
    h.elements['force-exit'].onclick!();
    expect(h.events.slice(-2)).toEqual(['exit', 'force-exit']);
    h.delivery.resolve();
    await Promise.resolve();
    expect(h.events).not.toContain('cleanup');
    h.core.resolve(0);
    await running;
    expect(h.events.slice(-3)).toEqual(['cleanup', 'renderer-stop', 'client-stop']);
    expect(h.elements.screen.children).toEqual([h.picture, h.elements['success-mask']]);
    expect(h.elements['success-mask'].classList.has('visible')).toBe(true);
    expect(h.elements.reload.disabled).toBe(false);
    h.pageWindow.dispatchEvent(new Event('pagehide'));
    expect(h.events.filter(event => event === 'cleanup')).toHaveLength(1);
    h.elements.reload.onclick!();
    expect(h.events.at(-1)).toBe('reload');
    expect(h.elements.reload.disabled).toBe(true);
});

test('RVMT holds its host through Core completion and cleans drawing on fatal errors without erasing it', async () => {
    const h = setup('rvmt');
    const running = startWasmPage(h.setupRenderer);
    const result = expect(running).rejects.toThrow('controlled fatal error');
    await h.started.promise;
    expect(h.events.slice(0, 5)).toEqual(['application', 'host-connect', 'host-start', 'renderer', 'setup']);
    h.delivery.reject(new Error('controlled fatal error'));
    await result;
    expect(h.events.slice(-5)).toEqual(['application-stop', 'cleanup', 'renderer-stop', 'client-stop', 'host-stop']);
    expect(h.elements.screen.children).toEqual([h.picture, h.elements['error-mask']]);
    expect(h.elements['error-message'].textContent).toBe('controlled fatal error');
    expect(h.elements.reload.disabled).toBe(true);
    h.pageWindow.dispatchEvent(new Event('pagehide'));
    expect(h.events.filter(event => event === 'cleanup')).toHaveLength(1);
});

test('RVMT normal completion waits for Core before stopping the host', async () => {
    const h = setup('rvmt');
    const running = startWasmPage(h.setupRenderer);
    await h.started.promise;
    h.delivery.resolve();
    await Promise.resolve();
    expect(h.events).not.toContain('host-stop');
    h.core.resolve(0);
    await running;
    expect(h.events.at(-1)).toBe('host-stop');
    expect(h.elements.reload.disabled).toBe(false);
});

test('page teardown overlapping failure disposes drawing and renderer only once', async () => {
    const h = setup('rvmt');
    const running = startWasmPage(h.setupRenderer);
    await h.started.promise;
    h.pageWindow.dispatchEvent(new Event('pagehide'));
    expect(h.events.slice(-5)).toEqual(['cleanup', 'renderer-stop', 'client-stop', 'application-stop', 'host-stop']);
    h.delivery.reject(new Error('closed after pagehide'));
    await running;
    for (const event of ['cleanup', 'renderer-stop', 'client-stop', 'host-stop']) {
        expect(h.events.filter(value => value === event)).toHaveLength(1);
    }
    expect(h.elements.screen.children).toEqual([h.picture]);
});

test('renderer admission failure still disposes page setup and preserves its picture', async () => {
    const h = setup();
    controlled.connectRenderer = () => Promise.reject(new Error('admission failed'));
    await expect(startWasmPage(h.setupRenderer)).rejects.toThrow('admission failed');
    expect(h.events.slice(-2)).toEqual(['application-stop', 'cleanup']);
    expect(h.events).not.toContain('renderer-stop');
    expect(h.elements.screen.children).toEqual([h.picture, h.elements['error-mask']]);
});

test('page teardown during renderer admission cleans setup without stopping an unstarted renderer', async () => {
    const h = setup();
    const admission = deferred<unknown>();
    const connecting = deferred<void>();
    controlled.connectRenderer = () => { connecting.resolve(); return admission.promise; };
    const running = startWasmPage(h.setupRenderer);
    await connecting.promise;
    h.pageWindow.dispatchEvent(new Event('pagehide'));
    expect(h.events.slice(-2)).toEqual(['cleanup', 'application-stop']);
    admission.resolve(h.client);
    await running;
    expect(h.events.at(-1)).toBe('client-stop');
    expect(h.events).not.toContain('renderer-start');
    expect(h.events).not.toContain('renderer-stop');
    expect(h.events).not.toContain('client-start');
    expect(h.events.filter(event => event === 'cleanup')).toHaveLength(1);
    expect(h.elements.screen.children).toEqual([h.picture]);
});

test('page teardown during application startup prevents RVMT host and renderer startup', async () => {
    const h = setup('rvmt');
    const ready = deferred<void>();
    h.application.ready = ready.promise;
    const running = startWasmPage(h.setupRenderer);
    h.pageWindow.dispatchEvent(new Event('pagehide'));
    ready.resolve();
    await running;
    expect(h.events).toEqual(['application', 'application-stop']);
});

test('page teardown during RVMT host startup stops that host and prevents renderer startup', async () => {
    const h = setup('rvmt');
    const startup = deferred<void>();
    const hostStarted = deferred<void>();
    h.host.startup = startup.promise;
    controlled.startHost = () => { h.events.push('host-start'); hostStarted.resolve(); return h.host; };
    const running = startWasmPage(h.setupRenderer);
    await hostStarted.promise;
    h.pageWindow.dispatchEvent(new Event('pagehide'));
    startup.resolve();
    await running;
    expect(h.events).toEqual(['application', 'host-connect', 'host-start', 'application-stop', 'host-stop']);
});

test('all built Wasm pages explicitly start, and FCT shares the page-owned raw painter', () => {
    const http = readFileSync(new URL('../lib/dist/index.html', import.meta.url), 'utf8');
    const painterImport = "import { installFullControlTestRawElements } from '/fullControlTestRaw.js'";
    expect(http).toContain(painterImport);
    for (const app of ['fct', 'rpt', 'rvmt']) {
        const html = readFileSync(new URL(`../lib/dist/wasm-${app}/index.html`, import.meta.url), 'utf8');
        expect(html).toContain("import { startWasmPage } from '/wasm-page.js'");
        expect(html).toContain(app === 'fct' ? 'void startWasmPage(installFullControlTestRawElements)' : 'void startWasmPage()');
        if (app === 'fct') expect(html).toContain(painterImport);
    }
});
