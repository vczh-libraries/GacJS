import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { chromium, Browser, Page } from '@playwright/test';
import { createServer, Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

// These tests consume built assets, use a real Chromium DOM/canvas, and never
// invoke the Windows native Core build or the live protocol harness.
const dist = resolve(import.meta.dirname, '../lib/dist');
let server: Server;
let browser: Browser;
let page: Page | undefined;
let baseUrl: string;
let errors: string[];
let expectedErrors: string[];

beforeAll(async () => {
    server = createServer((request, response) => {
        void (async () => {
            const pathname = new URL(request.url!, 'http://localhost').pathname;
            const file = pathname === '/entry.js'
                ? resolve(import.meta.dirname, 'RawBrowserClient.js')
                : resolve(dist, `.${pathname === '/entry-real.js' ? '/entry.js' : pathname}`);
            if (pathname !== '/entry.js' && !file.startsWith(dist + sep)) {
                response.writeHead(403).end();
                return;
            }
            const body = await readFile(file);
            const mime: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json' };
            response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(body);
        })().catch(error => { response.writeHead(500).end(String(error)); });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('Missing browser test server address.');
    baseUrl = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch({ headless: true });
}, 30000);

afterEach(async () => {
    await page?.close();
    page = undefined;
    expect(errors).toEqual(expectedErrors);
});

afterAll(async () => {
    await browser?.close();
    await new Promise<void>((resolve, reject) => server?.close(error => error === undefined ? resolve() : reject(error)));
});

async function open(query = ''): Promise<Page> {
    errors = [];
    expectedErrors = [];
    page = await browser.newPage({ viewport: { width: 900, height: 700 } });
    page.on('pageerror', error => { errors.push(error.message); });
    await page.addInitScript(() => {
        const original = window.ResizeObserver;
        (window as any).rawObserved = new Set<Element>();
        window.ResizeObserver = class extends original {
            private targets = new Set<Element>();
            observe(target: Element, options?: ResizeObserverOptions): void {
                this.targets.add(target);
                (window as any).rawObserved.add(target);
                super.observe(target, options);
            }
            unobserve(target: Element): void {
                this.targets.delete(target);
                (window as any).rawObserved.delete(target);
                super.unobserve(target);
            }
            disconnect(): void {
                for (const target of this.targets) (window as any).rawObserved.delete(target);
                this.targets.clear();
                super.disconnect();
            }
        };
    });
    await page.goto(`${baseUrl}/index.html${query}`);
    await page.waitForFunction(() => (window as any).rawTest?.started === true);
    return page;
}

async function paint(page: Page, time = '10:20:30'): Promise<void> {
    await page.evaluate(time => {
        const t = (window as any).rawTest;
        t.describe('FullControlTest.Clock', time);
        t.layout();
    }, time);
    await waitForCanvas(page, 240, 240);
}

async function waitForCanvas(page: Page, width: number, height: number, ratio = 1): Promise<void> {
    await page.waitForFunction(({ width, height, ratio }) => {
        const raw = (window as any).rawTest.renderer.getRawElements()[0];
        const canvas = raw.element.querySelector('canvas');
        return canvas !== null && canvas.width === width * ratio && canvas.height === height * ratio;
    }, { width, height, ratio });
}

async function picture(page: Page) {
    return page.evaluate(() => {
        const raw = (window as any).rawTest.renderer.getRawElements()[0];
        const canvas = raw.element.querySelector('canvas') as HTMLCanvasElement;
        const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
        let hash = 2166136261;
        let painted = 0;
        for (let i = 0; i < pixels.length; i++) hash = Math.imul(hash ^ pixels[i], 16777619) >>> 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] !== 0) painted++;
        return { hash, painted, width: canvas.width, height: canvas.height };
    });
}

async function expectHands(page: Page, time: string): Promise<void> {
    const samples = await page.evaluate(time => {
        const [hour, minute, second] = time.split(':').map(Number);
        const canvas = (window as any).rawTest.renderer.getRawElements()[0].element.querySelector('canvas') as HTMLCanvasElement;
        const bounds = canvas.getBoundingClientRect();
        const ratio = canvas.width / bounds.width;
        const radius = Math.min(bounds.width, bounds.height) / 2 - 10;
        const angles = [(hour + minute / 60 + second / 3600) * Math.PI / 6 - Math.PI / 2,
            (minute + second / 60) * Math.PI / 30 - Math.PI / 2, second * Math.PI / 30 - Math.PI / 2];
        const lengths = [90 / 160, 110 / 160, 130 / 160];
        const colors = [[0, 255, 255], [0, 255, 0], [255, 255, 0]];
        return angles.map((angle, i) => {
            const x = Math.round((bounds.width / 2 + Math.cos(angle) * radius * lengths[i] * 0.75) * ratio);
            const y = Math.round((bounds.height / 2 + Math.sin(angle) * radius * lengths[i] * 0.75) * ratio);
            const pixels = canvas.getContext('2d')!.getImageData(x - 2, y - 2, 5, 5).data;
            for (let p = 0; p < pixels.length; p += 4) {
                if (pixels[p + 3] > 128 && colors[i].every((value, channel) => Math.abs(value - pixels[p + channel]) < 20)) return true;
            }
            return false;
        });
    }, time);
    expect(samples).toEqual([true, true, true]);
}

test('built HTTP page draws protocol time, updates without a DOM diff, and preserves fixed hand angles', async () => {
    const page = await open();
    expect(await page.locator('canvas').count()).toBe(0);
    await page.evaluate(() => (window as any).rawTest.describe('FullControlTest.Clock', ''));
    await page.evaluate(() => (window as any).rawTest.layout());
    await waitForCanvas(page, 240, 240);
    expect((await picture(page)).painted).toBe(0);
    await paint(page);
    await expectHands(page, '10:20:30');
    const first = await picture(page);
    expect(first.painted).toBeGreaterThan(1000);
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.savedCanvas = t.renderer.getRawElements()[0].element.querySelector('canvas');
        t.describe('FullControlTest.Clock', '03:15:45');
    });
    await expectHands(page, '03:15:45');
    const changed = await picture(page);
    expect(changed.hash).not.toBe(first.hash);
    await page.clock.install({ time: new Date('2040-01-01T00:00:00Z') });
    await page.clock.runFor(2100);
    expect(await picture(page)).toEqual(changed);
    expect(await page.evaluate(() => {
        const t = (window as any).rawTest;
        const raw = t.renderer.getRawElements()[0];
        return { same: raw.element.querySelector('canvas') === t.savedCanvas, count: raw.element.querySelectorAll('canvas').length,
            pointerEvents: getComputedStyle(t.savedCanvas).pointerEvents };
    })).toEqual({ same: true, count: 1, pointerEvents: 'none' });
});

test('clock redraws after zero-size layout, resize, high DPI, hide/show, and ID changes', async () => {
    const page = await open();
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.describe('FullControlTest.Clock', '10:20:30');
        t.layout(0, 0);
    });
    await page.evaluate(() => (window as any).rawTest.layout(300, 260));
    await waitForCanvas(page, 300, 260);
    await expectHands(page, '10:20:30');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 900, height: 700, deviceScaleFactor: 2, mobile: false });
    await waitForCanvas(page, 300, 260, 2);
    await expectHands(page, '10:20:30');
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.savedCanvas = t.renderer.getRawElements()[0].element.querySelector('canvas');
        t.full(t.root([]));
        t.describe('FullControlTest.Clock', '03:15:45');
    });
    expect(await page.locator('#gacui-screen canvas').count()).toBe(0);
    await page.evaluate(() => (window as any).rawTest.layout(280, 280));
    await waitForCanvas(page, 280, 280, 2);
    await expectHands(page, '03:15:45');
    expect(await page.evaluate(() => {
        const t = (window as any).rawTest;
        return t.savedCanvas === t.renderer.getRawElements()[0].element.querySelector('canvas');
    })).toBe(true);
    await page.evaluate(() => (window as any).rawTest.describe('Other.Raw', '03:15:45'));
    expect(await page.locator('canvas').count()).toBe(0);
    expect(await page.evaluate(() => {
        const t = (window as any).rawTest;
        return (window as any).rawObserved.has(t.renderer.getRawElements()[0].element);
    })).toBe(false);
    await page.evaluate(() => (window as any).rawTest.describe('FullControlTest.Clock', '03:15:45'));
    await waitForCanvas(page, 280, 280, 2);
    await expectHands(page, '03:15:45');
    expect(await page.locator('canvas').count()).toBe(1);
    await page.evaluate(() => (window as any).rawTest.renderer.requests.RequestRendererDestroyed([1]));
    expect(await page.evaluate(() => ({
        raws: (window as any).rawTest.renderer.getRawElements().length,
        listeners: (window as any).rawTest.counts.uninstalled,
        observed: [...(window as any).rawObserved].filter((element: any) => element.id !== 'gacui-screen').length,
    }))).toEqual({ raws: 0, listeners: 1, observed: 0 });
});

test('already-started rvmhost enumeration installs exactly one clock and reuses it on updates', async () => {
    const page = await open('?rvmhost');
    await waitForCanvas(page, 240, 240);
    await expectHands(page, '10:20:30');
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.describe('FullControlTest.Clock', '10:20:30');
        t.describe('FullControlTest.Clock', '03:15:45');
    });
    await expectHands(page, '03:15:45');
    expect(await page.locator('canvas').count()).toBe(1);
    expect(await page.evaluate(() => (window as any).rawTest.counts.installed)).toBe(1);
});

test('a detached descriptor update redraws after same-frame reattachment at the same size', async () => {
    const page = await open();
    await paint(page);
    await page.evaluate(async () => {
        const t = (window as any).rawTest;
        t.savedCanvas = t.renderer.getRawElements()[0].element.querySelector('canvas');
        t.full(t.root([]));
        t.describe('FullControlTest.Clock', '03:15:45');
        t.layout();
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    });
    await expectHands(page, '03:15:45');
    expect(await page.evaluate(() => {
        const t = (window as any).rawTest;
        return t.savedCanvas === t.renderer.getRawElements()[0].element.querySelector('canvas');
    })).toBe(true);
});

test.each(['disconnect', 'exit', 'fatal'])('rvmhost %s preserves only a detached renderer host until page teardown', async outcome => {
    const page = await open('?rvmhost');
    await waitForCanvas(page, 240, 240);
    const before = await picture(page);
    if (outcome === 'fatal') expectedErrors.push('Controlled raw clock failure');
    await page.evaluate(outcome => (window as any).rawTest.finish(outcome), outcome);
    await page.waitForFunction(() => Object.values((window as any).rawTest.listeners).every(count => count === 0));
    expect(await picture(page)).toEqual(before);
    expect(await page.evaluate(() => (window as any).rawObserved.size)).toBe(0);
    expect(await page.evaluate(() => (window as any).rawTest.hostStops)).toBe(outcome === 'fatal' ? 1 : 0);
    await page.evaluate(() => {
        window.dispatchEvent(new Event('pagehide'));
        window.dispatchEvent(new Event('pagehide'));
    });
    expect(await page.evaluate(() => (window as any).rawTest.hostStops)).toBe(1);
});

test('an accepted host completing after renderer takeover cleans the remaining session', async () => {
    const page = await open('?rvmhost');
    await page.evaluate(() => (window as any).rawTest.finish('exit'));
    await page.locator('#gacui-success-mask.visible').waitFor();
    expect(await page.evaluate(() => (window as any).rawTest.hostStops)).toBe(0);
    await page.evaluate(() => (window as any).rawTest.finishHost());
    await page.waitForFunction(() => (window as any).rawTest.hostStops === 1);
});

test.each(['normal', 'disconnect', 'exit', 'fatal'])('session %s cleans subscriptions and observers while retaining pixels', async outcome => {
    const page = await open();
    await paint(page);
    const before = await picture(page);
    if (outcome === 'fatal') expectedErrors.push('Controlled raw clock failure');
    await page.evaluate(outcome => (window as any).rawTest.finish(outcome), outcome);
    await page.waitForFunction(() => Object.values((window as any).rawTest.listeners).every(count => count === 0));
    expect(await picture(page)).toEqual(before);
    expect(await page.evaluate(() => (window as any).rawObserved.size)).toBe(0);
    if (outcome === 'fatal') await page.locator('#gacui-error-mask.visible').waitFor();
    if (outcome === 'disconnect' || outcome === 'exit') await page.locator('#gacui-success-mask.visible').waitFor();
    await page.evaluate(() => {
        window.dispatchEvent(new Event('pagehide'));
        window.dispatchEvent(new Event('pagehide'));
        (window as any).rawTest.describe('FullControlTest.Clock', '03:15:45');
        window.dispatchEvent(new Event('resize'));
    });
    expect(await picture(page)).toEqual(before);
});

test.each(['', '?rvmhost'])('page teardown of active %s session retains the last drawing and is safe before completion', async query => {
    const page = await open(query);
    await paint(page);
    const before = await picture(page);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    expect(await page.evaluate(() => ({
        observers: (window as any).rawObserved.size,
        listeners: (window as any).rawTest.listeners,
    }))).toEqual({ observers: 0, listeners: { installed: 0, updated: 0, uninstalled: 0 } });
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.describe('FullControlTest.Clock', '03:15:45');
        t.finish('normal');
        window.dispatchEvent(new Event('pagehide'));
    });
    expect(await picture(page)).toEqual(before);
});

test('page teardown during HTTP connection setup does not install a painter or start delivery later', async () => {
    errors = [];
    expectedErrors = [];
    page = await browser.newPage();
    page.on('pageerror', error => { errors.push(error.message); });
    await page.goto(`${baseUrl}/index.html?defer-startup`);
    await page.waitForFunction(() => typeof (window as any).rawTest?.releaseStartup === 'function');
    await page.evaluate(() => {
        window.dispatchEvent(new Event('pagehide'));
        (window as any).rawTest.releaseStartup();
    });
    await page.waitForFunction(() => (window as any).rawTest.clientStops > 0);
    expect(await page.evaluate(() => ({
        started: (window as any).rawTest.started,
        rawCount: (window as any).rawTest.renderer.getRawElements().length,
        listeners: (window as any).rawTest.listeners,
    }))).toEqual({ started: false, rawCount: 0, listeners: { installed: 0, updated: 0, uninstalled: 0 } });
});

test('persistent raw div and page children survive full/diff DOM replacement and clipping/reparenting', async () => {
    const page = await open();
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.describe('Page.Drawing', 'retained');
        const raw = t.renderer.getRawElements()[0];
        t.savedRaw = raw;
        t.savedCanvas = document.createElement('canvas');
        t.savedCanvas.width = 7;
        t.savedCanvas.height = 7;
        t.savedCanvas.getContext('2d').fillRect(0, 0, 7, 7);
        t.savedContent = document.createElement('span');
        t.savedContent.textContent = 'Page-owned content';
        raw.element.append(t.savedCanvas, t.savedContent);
        t.clicks = 0;
        raw.element.addEventListener('click', () => { t.clicks++; });
        t.layout();
    });
    const assertIdentity = async (visible = true) => {
        expect(await page.evaluate(() => {
            const t = (window as any).rawTest;
            const raw = t.renderer.getRawElements()[0];
            return { record: raw === t.savedRaw, canvas: raw.element.contains(t.savedCanvas),
                content: raw.element.contains(t.savedContent), visible: raw.element.isConnected,
                pixel: t.savedCanvas.getContext('2d').getImageData(3, 3, 1, 1).data[3], counts: t.counts };
        })).toEqual({ record: true, canvas: true, content: true, visible, pixel: 255,
            counts: { installed: 1, updated: 1, uninstalled: 0 } });
    };
    await assertIdentity();
    await page.evaluate(() => (window as any).rawTest.layout());
    await assertIdentity();
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.diff([{ id: 1, diffType: 'Modified', content: t.content(1, t.rect(35, 45, 260, 250)), children: [] }]);
    });
    await assertIdentity();
    expect(await page.evaluate(() => {
        const raw = (window as any).rawTest.savedRaw.element;
        const bounds = raw.getBoundingClientRect();
        const screen = document.getElementById('gacui-screen')!.firstElementChild!.getBoundingClientRect();
        return [bounds.x - screen.x, bounds.y - screen.y, bounds.width, bounds.height];
    })).toEqual([35, 45, 260, 250]);
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.diff([{ id: 1, diffType: 'Modified', content: t.content(1, t.rect(35, 45, 260, 250), t.rect(50, 60, 100, 90)), children: [] }]);
    });
    await assertIdentity();
    expect(await page.evaluate(() => {
        let parent = (window as any).rawTest.savedRaw.element.parentElement;
        while (parent !== null) {
            const bounds = parent.getBoundingClientRect();
            const style = getComputedStyle(parent);
            if (style.overflow === 'hidden' && style.position === 'absolute' && bounds.width === 100 && bounds.height === 90) return true;
            parent = parent.parentElement;
        }
        return false;
    })).toBe(true);
    const bounds = () => page.evaluate(() => {
        const rawBounds = (window as any).rawTest.savedRaw.element.getBoundingClientRect();
        const screen = document.getElementById('gacui-screen')!.firstElementChild!.getBoundingClientRect();
        return [rawBounds.x - screen.x, rawBounds.y - screen.y, rawBounds.width, rawBounds.height];
    });
    expect(await bounds()).toEqual([35, 45, 260, 250]);
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.diff([{ id: 1, diffType: 'Modified', content: t.content(1, t.rect(35, 45, 260, 250)), children: [] }]);
    });
    expect(await bounds()).toEqual([35, 45, 260, 250]);
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.full(t.root([t.node(10, null, t.rect(0, 0, 400, 400), [t.node(1, 1, t.rect(35, 45, 260, 250))]),
            t.node(20, null, t.rect(0, 0, 400, 400))]));
        t.diff([{ id: 10, diffType: 'Modified', content: null, children: [] },
            { id: 20, diffType: 'Modified', content: null, children: [1] }]);
    });
    await assertIdentity();
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.diff([{ id: 2, diffType: 'Created', content: t.content(null, t.rect(60, 60, 10, 10)), children: [] },
            { id: 1, diffType: 'Modified', content: null, children: [2] }]);
    });
    await assertIdentity();
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.diff([{ id: 1, diffType: 'Modified', content: null, children: [] },
            { id: 2, diffType: 'Deleted', content: null, children: null }]);
        t.full(t.root([]));
    });
    await assertIdentity(false);
    await page.evaluate(() => {
        const t = (window as any).rawTest;
        t.layout();
        t.savedRaw.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await assertIdentity();
    expect(await page.evaluate(() => (window as any).rawTest.clicks)).toBe(1);
});

test('browser snapshot renderer consumes generated Raw descriptors and ordinary frames', async () => {
    errors = [];
    expectedErrors = [];
    page = await browser.newPage();
    page.on('pageerror', error => { errors.push(error.message); });
    await page.goto(`${baseUrl}/snapshots.html`);
    await page.addScriptTag({ type: 'module', content: `
        import { renderUI } from '/entry-real.js';
        import { ElementManager } from '/gacui.js';
        window.rawSnapshotModules = { renderUI, ElementManager };
    ` });
    await page.waitForFunction(() => (window as any).rawSnapshotModules !== undefined);
    const result = await page.evaluate(async () => {
        const { renderUI, ElementManager } = (window as any).rawSnapshotModules;
        const observed: { id: string; data: string }[] = [];
        const update = ElementManager.prototype.updateDesc;
        ElementManager.prototype.updateDesc = function (id, desc) {
            if (desc.type === 'Raw') observed.push({ id: desc.desc.rawId, data: desc.desc.data });
            return update.call(this, id, desc);
        };
        const get = async (path: string) => {
            const response = await fetch(path);
            return JSON.parse((await response.text()).replace(/^\uFEFF/u, ''));
        };
        const target = document.getElementById('gacuiScreen')!;
        const trace = await get('/snapshots/Elements/Raw/Properties.json');
        const expected: { id: string; data: string }[] = [];
        for (let i = 0; i < trace.frames.length; i++) {
            trace.frames[i] = await get(`/snapshots/Elements/Raw/Properties/frame_${i}.json`);
            const raw = trace.frames[i].elements.find((entry: any) => entry[1][0] === 'ElementDesc_Raw')[1][1];
            expected.push({ id: raw.rawId, data: raw.data });
            renderUI(target, trace, i);
            if (target.children.length === 0) throw new Error('Snapshot frame was not rendered.');
        }
        const noClock = target.querySelectorAll('canvas').length === 0;
        const hello = await get('/snapshots/HelloWorld.json');
        hello.frames[0] = await get('/snapshots/HelloWorld/frame_0.json');
        renderUI(target, hello, 0);
        return { expected, observed: observed.filter(item => item.id !== '' || item.data !== ''),
            noClock, ordinaryText: target.textContent };
    });
    expect(result.observed).toEqual(result.expected);
    expect(result.expected[1].id).not.toBe(result.expected[0].id);
    expect(result.expected[2].data).toMatch(/[^\u0000-\u007f]/u);
    expect(result.noClock).toBe(true);
    expect(result.ordinaryText).toContain('Hello');
}, 30000);


test('Touching painter draws Core rectangle and contact markers, updates and changes IDs', async () => {
    const current = await open();
    await current.evaluate(() => {
        const t = (window as any).rawTest;
        t.describe('FullControlTest.Touching', '120,120,1,0,1,0,40,40');
        t.layout();
    });
    await waitForCanvas(current, 240, 240);
    const before = await picture(current);
    expect(before.painted).toBeGreaterThan(15000);
    const samples = await current.evaluate(() => {
        const canvas = (window as any).rawTest.renderer.getRawElements()[0].element.querySelector('canvas');
        const context = canvas.getContext('2d');
        return [Array.from(context.getImageData(120,120,1,1).data), Array.from(context.getImageData(55,40,1,1).data)];
    });
    expect(samples[0]).toEqual([135,206,235,255]);
    expect(samples[1][0]).toBeGreaterThan(200);
    await current.evaluate(() => (window as any).rawTest.describe('FullControlTest.Touching', '160,140,0.8,0.4,0'));
    await expect.poll(async () => (await picture(current)).hash).not.toBe(before.hash);
    await paint(current);
    await expectHands(current, '10:20:30');
});

test('Browser touch injection owns the surface, orders overlapping contacts and suppresses mouse compatibility', async () => {
    const current = await open();
    await paint(current);
    await current.evaluate(() => { document.body.style.minHeight = '3000px'; document.body.style.overflow = 'auto'; });
    const target = current.locator('#gacui-screen');
    const bounds = (await target.boundingBox())!;
    const cdp = await current.context().newCDPSession(current);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    const a = { x: bounds.x + 70, y: bounds.y + 80, id: 10, radiusX: 5, radiusY: 7, force: 0.7 };
    const b = { x: bounds.x + 110, y: bounds.y + 100, id: 20 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a,b] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [a] });
    await current.evaluate(() => (window as any).rawTest.layout(280,260));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{...b,x:b.x+20}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{...b,x:bounds.x+bounds.width+80,y:bounds.y+bounds.height+80}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{...b,x:b.x+20}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{...b,x:b.x+20},a] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const messages = await current.evaluate(() => (window as any).rawTest.sent.filter((v:any) => v.semantic === 'Event'));
    const points = messages.filter((v:any) => v.name.startsWith('IOPoint'));
    expect(points[0].name).toBe('IOPointStarted');
    expect(points.at(-1).name).toBe('IOPointEnded');
    expect(points.filter((v:any) => v.name === 'IOPointStarted')).toHaveLength(1);
    expect(points.filter((v:any) => v.name === 'IOPointEnded')).toHaveLength(1);
    expect(points.filter((v:any) => v.name === 'IOPointDown').map((v:any) => v.arguments.info.pointId)).toEqual([0,1,2]);
    expect(points.map((v:any) => v.arguments.eventIndex)).toEqual(points.map((_v:any,i:number) => i));
    expect(points.at(-1).arguments.reason).toBe('Succeeded');
    expect(messages.filter((v:any) => /^IOButton|^IOMouse/.test(v.name))).toEqual([]);
    expect(await current.evaluate(() => window.scrollY)).toBe(0);
    expect(points.some((v:any) => v.name === 'IOPointUpdate' && v.arguments.info.position.x.value > bounds.width)).toBe(true);
    expect(await target.evaluate(element => [...element.querySelectorAll('*')].every(child => getComputedStyle(child).touchAction === 'none'))).toBe(true);
    await current.mouse.click(bounds.x+50,bounds.y+60);
    expect(await current.evaluate(() => (window as any).rawTest.sent.filter((v:any) => v.name === 'IOButtonDown').length)).toBe(1);
    await current.evaluate(() => {
        const outside = document.createElement('button');
        outside.id = 'outside-touch'; outside.textContent = 'Outside';
        outside.style.cssText = 'position:fixed;right:0;top:0;width:60px;height:30px';
        outside.onclick = () => outside.dataset.clicked = 'yes';
        document.body.append(outside);
    });
    const outside = (await current.locator('#outside-touch').boundingBox())!;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{x:outside.x+30,y:outside.y+15,id:90}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => current.locator('#outside-touch').getAttribute('data-clicked')).toBe('yes');
});


test('Synthetic capture loss drains contacts, preserves sparse IDs and stops after disposal', async () => {
    const current = await open();
    await paint(current);
    const result = await current.evaluate(() => {
        const t = (window as any).rawTest;
        const root = document.getElementById('gacui-screen')!;
        // Synthetic PointerEvents cannot acquire real pointer capture. Capture calls
        // are stubbed only in this adapter test; the CDP test exercises actual capture.
        root.setPointerCapture = () => {};
        root.hasPointerCapture = () => false;
        const send = (type: string, id: number, primary = false) => root.dispatchEvent(new PointerEvent(type,
            { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: id, isPrimary: primary,
                clientX: 60, clientY: 70, width: 8, height: 12, pressure: 0.5 }));
        send('pointerdown', 7, true);
        send('pointerdown', 8);
        send('pointerup', 7, true);
        send('lostpointercapture', 7, true);
        send('pointermove', 8);
        send('pointerdown', 7);
        send('lostpointercapture', 8);
        send('pointermove', 7);
        send('pointerup', 8);
        send('pointerdown', 9);
        send('pointerup', 7);
        send('pointerup', 9);
        send('pointerdown', 7, true);
        send('pointercancel', 7, true);
        send('lostpointercapture', 7, true);
        send('pointerdown', 10, true);
        send('pointerup', 10, true);
        send('pointerdown', 12, true);
        t.renderer.stop();
        t.renderer.stop();
        const before = t.sent.length;
        send('pointerdown', 11, true);
        return { events: t.sent.filter((v: any) => v.name.startsWith('IOPoint')), silent: t.sent.length === before };
    });
    const groups = Map.groupBy(result.events, (v: any) => v.arguments.sequenceId ?? v.arguments.info.sequenceId);
    expect(groups.size).toBe(4);
    const sequences = [...groups.values()] as any[][];
    expect(sequences[0].map(v => v.name)).toEqual(['IOPointStarted','IOPointDown','IOPointDown','IOPointUp','IOPointUpdate','IOPointDown','IOPointEnded']);
    expect(sequences[0].filter(v => v.name === 'IOPointDown').map(v => v.arguments.info.pointId)).toEqual([0,1,2]);
    expect(sequences.map(v => v.at(-1).arguments.reason)).toEqual(['Canceled_CaptureLost','Canceled_PlatformCanceled','Succeeded','Canceled_WindowDestroyed']);
    for (const sequence of sequences) expect(sequence.map(v => v.arguments.eventIndex)).toEqual(sequence.map((_v, i) => i));
    expect(result.silent).toBe(true);
});


test('Synthetic coalesced samples preserve metadata and disconnected cleanup emits no stale End', async () => {
    const current = await open();
    await paint(current);
    const result = await current.evaluate(() => {
        const t = (window as any).rawTest;
        const root = document.getElementById('gacui-screen')!;
        root.setPointerCapture = () => {};
        root.hasPointerCapture = () => false;
        const box = root.getBoundingClientRect();
        const child = document.createElement('span');
        child.style.overflow = 'hidden';
        root.append(child);
        const sample = (type: string, x: number) => new PointerEvent(type, {
            bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 2, isPrimary: true,
            clientX: box.left + x, clientY: box.top + 40, width: 8, height: 12, pressure: 0.75,
            ctrlKey: true, shiftKey: true, altKey: true, metaKey: true,
        });
        const down = sample('pointerdown', 30);
        child.dispatchEvent(down);
        child.remove();
        const move = sample('pointermove', 70);
        Object.defineProperty(move, 'getCoalescedEvents', { value: () => [sample('pointermove', 50), sample('pointermove', 50)] });
        root.dispatchEvent(move);
        const before = t.sent.filter((v: any) => v.name.startsWith('IOPoint'));
        t.renderer.stop(true);
        return { before, after: t.sent.filter((v: any) => v.name.startsWith('IOPoint')),
            canceled: down.defaultPrevented };
    });
    expect(result.canceled).toBe(true);
    expect(result.after).toEqual(result.before);
    expect(result.before.map((v: any) => v.name)).toEqual(['IOPointStarted','IOPointDown','IOPointUpdate','IOPointUpdate']);
    expect(result.before.map((v: any) => v.arguments.eventIndex)).toEqual([0,1,2,3]);
    expect(result.before[0].arguments.info).toEqual(result.before[1].arguments.info);
    for (const record of result.before) {
        const info = record.arguments.info;
        expect(info.sequenceId).toBe('1');
        expect(info.timestamp).toMatch(/^[0-9]+$/u);
        expect(info.pointId).toBe(0);
        expect(info.activePointCount).toBe(1);
        expect([info.primary,info.ctrl,info.shift,info.alt,info.osSuper]).toEqual([true,true,true,true,true]);
        expect(info.pressure).toBe(0.75);
        expect(info.orientation).toBeNull();
        expect(info.platformFrameId).toBeNull();
    }
    expect(result.before[0].arguments.info.position).toEqual({x:{value:30},y:{value:40}});
    expect(result.before[0].arguments.info.contactBounds).toEqual({x1:{value:26},y1:{value:34},x2:{value:34},y2:{value:46}});
    expect(result.before.slice(2).map((v: any) => v.arguments.info.position.x.value)).toEqual([50,50]);
});
