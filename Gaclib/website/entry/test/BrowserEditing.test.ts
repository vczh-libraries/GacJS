import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { chromium, firefox, webkit, Browser, Page } from '@playwright/test';
import { createServer, Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const dist = resolve(import.meta.dirname, '../lib/dist');
let server: Server;
let origin: string;
let page: Page | undefined;
let errors: string[] = [];
const browsers = new Map<string, Browser>();

beforeAll(async () => {
    server = createServer((request, response) => {
        void (async () => {
            const pathname = new URL(request.url!, 'http://localhost').pathname;
            const file = pathname === '/entry.js' ? resolve(import.meta.dirname, 'RawBrowserClient.js') :
                resolve(dist, `.${pathname === '/entry-real.js' ? '/entry.js' : pathname}`);
            if (pathname !== '/entry.js' && !file.startsWith(dist + sep)) { response.writeHead(403).end(); return; }
            const body = await readFile(file);
            const mime: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json' };
            response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(body);
        })().catch(error => { response.writeHead(500).end(String(error)); });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('Missing editing server address.');
    origin = `http://127.0.0.1:${address.port}`;
    for (const engine of [chromium, webkit, firefox]) browsers.set(engine.name(), await engine.launch());
}, 60000);

afterEach(async context => {
    if (page !== undefined) {
        const diagnostics = await page.evaluate(() => ({ state: (window as any).rawTest?.renderer.textInputState,
            focused: document.activeElement?.outerHTML.slice(0, 250),
            sent: (window as any).rawTest?.sent.filter((value: any) => value.name === 'IOChar'),
            mask: document.querySelector('#gacui-error-mask')?.className }));
        if (context.task.result?.state === 'fail') console.error('Browser editing failure', JSON.stringify(diagnostics));
        expect(errors, JSON.stringify(diagnostics)).toEqual([]);
        await page.close(); page = undefined;
    }
});

afterAll(async () => {
    for (const browser of browsers.values()) await browser.close();
    await new Promise<void>((resolve, reject) => server.close(error => error === undefined ? resolve() : reject(error)));
});

async function open(engine: string, adapter: string, initialFocus: number | null = 10, text = 'Core', keyboard?: 'manual' | 'absent') {
    errors = [];
    page = await browsers.get(engine)!.newPage({ viewport: { width: 900, height: 700 } });
    page.on('pageerror', error => errors.push(error.message));
    if (keyboard !== undefined) await page.addInitScript(mode => {
        const state = window as any;
        state.keyboardCalls = [];
        state.editingKeyboard = mode === 'absent' ? null : new class extends EventTarget {
            boundingRect = new DOMRect(0, 500, 900, 200);
            show() { state.keyboardCalls.push(['show', (document.activeElement as HTMLElement)?.dataset.gacuiInput]); }
            hide() { state.keyboardCalls.push(['hide', (document.activeElement as HTMLElement)?.dataset.gacuiInput]); }
        }();
    }, keyboard);
    await page.goto(`${origin}/index.html?text-adapter=${adapter}&keyboard-policy=${keyboard === 'manual' ? 'manual' : 'auto'}`);
    await page.waitForFunction(() => (window as any).rawTest?.started === true);
    await page.evaluate(async ({ initialFocus, text }) => {
        const t = (window as any).rawTest;
        t.paragraph = (id: number, text: string | null) => ({ id, text, wrapLine: false, maxWidth: 280, alignment: 'Left',
            runsDiff: [], createdInlineObjects: [], removedInlineObjects: [] });
        t.message('RendererCreated', [{ id: 101, type: 'DocumentParagraph' }, { id: 102, type: 'DocumentParagraph' }]);
        await t.request('RendererUpdateElement_DocumentParagraph', t.paragraph(101, text));
        await t.request('RendererUpdateElement_DocumentParagraph', t.paragraph(102, 'Second'));
        t.message('DocumentParagraph_OpenCaret', { id: 101, caret: text.length, caretColor: '#000000', frontSide: true });
        t.nodes = [10, 20, 30].map((id, i) => {
            const bounds = t.rect(30, 50 + i * 130, 300, 100);
            const child = i < 2 ? [t.node(id + 1, 101 + i, t.rect(35, 55 + i * 130, 280, 80))] : [];
            const node = t.node(id, null, bounds, child);
            node.content.editableAttribute = { focused: id === initialFocus, editable: i < 2 };
            return node;
        });
        t.full(t.root(t.nodes));
        t.change = (id: number, attribute: any, extra = {}) => {
            const node = t.nodes.find((value: any) => value.id === id);
            node.content = { ...node.content, editableAttribute: attribute, ...extra };
            return { id, diffType: 'Modified', content: node.content, children: null };
        };
        t.codes = () => t.sent.filter((value: any) => value.name === 'IOChar').map((value: any) => value.arguments.code);
        t.hosts = new Map(Array.from(document.querySelectorAll<HTMLElement>('[data-gacui-input]')).map(host => [Number(host.dataset.gacuiInput), host]));
        t.sent.length = 0;
    }, { initialFocus, text });
    return page;
}

async function codes(current: Page): Promise<string[]> {
    return current.evaluate(async () => {
        const t = (window as any).rawTest;
        await t.request('ControllerGetFontConfig');
        return t.codes();
    });
}

for (const [engine, adapter] of [['chromium', 'auto'], ['chromium', 'contenteditable'], ['webkit', 'auto'], ['firefox', 'auto']]) {
    describe(`${engine}/${adapter}`, () => {
        test('engine Unicode insertion commits UTF-16 once and preserves Core DOM', async () => {
            const current = await open(engine, adapter);
            const before = await current.locator('[data-gacui-input="10"]').innerHTML();
            const state = await current.evaluate(() => (window as any).rawTest.renderer.textInputState);
            console.log(JSON.stringify({ engine, version: browsers.get(engine)!.version(), ...state }));
            expect(state.adapter).toBe(engine === 'chromium' && adapter === 'auto' ? 'edit-context' : 'contenteditable');
            for (const text of ['Latin', '中文', 'e\u0301', '🙂', '同', '同']) await current.keyboard.insertText(text);
            expect(await codes(current)).toEqual('Latin中文e\u0301🙂同同'.split(''));
            expect(await current.locator('[data-gacui-input="10"]').innerHTML()).toBe(before);
            expect(await current.locator('#gacui-screen input, #gacui-screen textarea').count()).toBe(0);
        });

        test('completed batches derive focus including unchanged and read-only boundaries', async () => {
            const current = await open(engine, adapter, null);
            const result = await current.evaluate(() => {
                const t = (window as any).rawTest;
                const seen = [t.renderer.textInputState.activeId];
                t.diff([t.change(10, { focused: true, editable: true })]); seen.push(t.renderer.textInputState.activeId);
                t.diff([t.change(20, { focused: true, editable: true }), t.change(10, { focused: false, editable: true })]); seen.push(t.renderer.textInputState.activeId);
                t.diff([t.change(20, { focused: false, editable: true }), t.change(10, { focused: true, editable: true })]); seen.push(t.renderer.textInputState.activeId);
                t.diff([t.change(20, { focused: false, editable: true })]); seen.push(t.renderer.textInputState.activeId);
                t.diff([t.change(10, { focused: false, editable: true }), t.change(30, { focused: true, editable: false })]); seen.push(t.renderer.textInputState.activeId);
                t.diff([t.change(30, null)]); seen.push(t.renderer.textInputState.activeId);
                return seen;
            });
            expect(result).toEqual([null, 10, 20, 10, 10, null, null]);
        });

        test('host and ancestors stay connected through child, clip, full and bounds refreshes', async () => {
            const current = await open(engine, adapter);
            const result = await current.evaluate(async () => {
                const t = (window as any).rawTest;
                const host = t.hosts.get(10);
                const ancestors: Node[] = [];
                for (let node: Node | null = host; node !== null; node = node.parentNode) ancestors.push(node);
                const removed: Node[] = [];
                const observer = new MutationObserver(records => records.forEach(record => removed.push(...Array.from(record.removedNodes))));
                observer.observe(document.getElementById('gacui-screen')!, { childList: true, subtree: true });
                t.diff([t.change(10, { focused: true, editable: true }, { validArea: t.rect(40, 55, 280, 85) }),
                    { id: -1, diffType: 'Modified', content: null, children: [10, 20, 30] },
                    { id: 10, diffType: 'Modified', content: null, children: [11] }]);
                t.full(t.root(t.nodes));
                t.diff([{ id: -1, diffType: 'Modified', content: null, children: [20, 10, 30] }]);
                t.diff([{ id: -1, diffType: 'Modified', content: null, children: [10, 20, 30] }]);
                t.diff([t.change(10, { focused: true, editable: true }, { validArea: t.nodes[0].content.bounds })]);
                await t.request('RendererUpdateElement_DocumentParagraph', t.paragraph(102, null));
                await Promise.resolve();
                observer.disconnect();
                return { same: t.hosts.get(10) === document.activeElement, connected: host.isConnected,
                    remounted: removed.some(node => ancestors.includes(node)) };
            });
            expect(result).toEqual({ same: true, connected: true, remounted: false });
        });

        test('duplicate focus is fatal for full and diff trees before readonly filtering', async () => {
            for (const full of [false, true]) {
                const current = await open(engine, adapter);
                const result = await current.evaluate(async full => {
                    const t = (window as any).rawTest;
                    let failure = '';
                    try {
                        const diff = t.change(30, { focused: true, editable: false });
                        if (full) t.full(t.root(t.nodes)); else t.diff([diff]);
                    } catch (error) { failure = String(error); }
                    const host = t.hosts.get(10);
                    host.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'stale', bubbles: true, cancelable: true }));
                    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX', bubbles: true }));
                    await Promise.resolve();
                    return { failure, codes: t.codes() };
                }, full);
                expect(result.failure).toMatch(/10.*30/);
                expect(result.codes).toEqual([]);
                await current.close(); page = undefined;
            }
        });

        test('trusted click focuses immediately and holds commits until Core confirms', async () => {
            const current = await open(engine, adapter);
            await current.locator('[data-gacui-input="20"]').click({ position: { x: 10, y: 15 } });
            expect(await current.evaluate(() => (window as any).rawTest.renderer.textInputState.pending)).toBe(true);
            await current.keyboard.insertText('queued');
            expect(await current.evaluate(() => (window as any).rawTest.codes())).toEqual([]);
            await current.evaluate(() => {
                const t = (window as any).rawTest;
                t.diff([t.change(10, { focused: false, editable: true }), t.change(20, { focused: true, editable: true })]);
            });
            expect(await codes(current)).toEqual('queued'.split(''));
            await current.locator('[data-gacui-input="10"]').click({ position: { x: 10, y: 15 } });
            await current.keyboard.insertText('discard');
            await current.evaluate(() => (window as any).rawTest.message('RendererIdle'));
            expect(await codes(current)).toEqual('queued'.split(''));
            expect(await current.evaluate(() => (window as any).rawTest.renderer.textInputState.activeId)).toBe(20);
        });

        test('soft and physical commands, rejected corrections and plaintext paste', async () => {
            const current = await open(engine, adapter);
            await current.keyboard.press('Backspace');
            await current.keyboard.press('Enter');
            await current.keyboard.press('Control+c');
            await current.keyboard.press('Control+x');
            await current.keyboard.press('Control+v');
            await current.evaluate(() => {
                const host = document.activeElement!;
                for (const inputType of ['deleteContentBackward', 'deleteContentForward', 'insertParagraph', 'insertReplacementText']) {
                    host.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType, data: inputType === 'insertReplacementText' ? 'WRONG' : null }));
                }
                // Synthetic clipboard payload: Firefox does not expose constructor-supplied
                // clipboard bytes as a trusted paste. This tests the adapter, not OS paste.
                const paste = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
                Object.defineProperty(paste, 'clipboardData', { value: { getData: (format: string) => format === 'text/plain' ? 'Paste🙂' : '<b>WRONG</b>' } });
                host.dispatchEvent(paste);
            });
            expect(await codes(current)).toEqual('\r\rPaste🙂'.split(''));
            const keyDowns = await current.evaluate(() => (window as any).rawTest.sent.filter((v: any) => v.name === 'IOKeyDown').map((v: any) => v.arguments.code));
            expect(keyDowns).toEqual([8, 13, 162, 67, 162, 88, 162, 86, 8, 46, 13]);
            expect(await current.locator('[data-gacui-input="10"]').textContent()).toBe('Core');
        });
    });
}

for (const adapter of ['auto', 'contenteditable']) {
    test(`Chromium engine composition revises, commits, cancels and invalidates (${adapter})`, async () => {
        const current = await open('chromium', adapter, 10, '');
        const cdp = await current.context().newCDPSession(current);
        const compose = (text: string) => cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
        await current.evaluate(() => {
            const t = (window as any).rawTest;
            const other = t.nodes[1].children.pop();
            other.content.bounds = other.content.validArea = t.rect(35, 85, 280, 20);
            t.nodes[0].children.push(other);
            t.full(t.root(t.nodes));
        });
        await compose('n'); await compose('ni');
        expect(await codes(current)).toEqual([]);
        expect(await current.evaluate(() => (window as any).rawTest.renderer.textInputState.composing)).toBe(true);
        await current.evaluate(async () => {
            const t = (window as any).rawTest;
            await t.request('RendererUpdateElement_DocumentParagraph', t.paragraph(101, null));
            await t.request('RendererUpdateElement_DocumentParagraph', t.paragraph(102, 'Updated other paragraph'));
            t.diff([t.change(20, { focused: false, editable: true })]);
        });
        expect(await current.evaluate(() => (window as any).rawTest.renderer.textInputState.composing)).toBe(true);
        await cdp.send('Input.insertText', { text: '你' });
        expect(await codes(current)).toEqual(['你']);
        await current.keyboard.insertText('你');
        expect(await codes(current)).toEqual(['你', '你']);
        expect(await current.locator('[data-gacui-input="10"]').textContent()).toBe('Updated other paragraph');
        expect(await current.locator('[data-gacui-input="10"] span').count()).toBe(2);
        await compose('cancel'); await compose('');
        expect(await codes(current)).toEqual(['你', '你']);
        await compose('late');
        await current.evaluate(() => {
            const t = (window as any).rawTest;
            t.diff([t.change(10, null)]);
            t.hosts.get(10).dispatchEvent(new CompositionEvent('compositionend', { data: 'stale', bubbles: true }));
            t.hosts.get(10).dispatchEvent(new InputEvent('input', { data: 'stale', inputType: 'insertCompositionText', bubbles: true }));
        });
        expect(await codes(current)).toEqual(['你', '你']);
    });
}

for (const engine of ['chromium', 'webkit', 'firefox']) {
    test(`${engine} synthetic noncancelable composition orders restore current Core nodes`, async () => {
        const current = await open(engine, 'contenteditable', 10, '');
        const result = await current.evaluate(async () => {
            const t = (window as any).rawTest;
            const host = t.hosts.get(10);
            const run = async (endFirst: boolean) => {
                host.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
                host.dispatchEvent(new CompositionEvent('compositionupdate', { data: '预', bubbles: true }));
                host.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertCompositionText', data: '预', isComposing: true, bubbles: true }));
                // Model a native IME splitting/replacing nodes in an empty paragraph.
                const line = host.querySelector('span').parentElement;
                line.replaceChildren(document.createTextNode('定'));
                const end = () => host.dispatchEvent(new CompositionEvent('compositionend', { data: '定', bubbles: true }));
                const input = () => {
                    host.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertFromComposition', data: '定', bubbles: true }));
                    host.dispatchEvent(new InputEvent('input', { inputType: 'insertFromComposition', data: '定', bubbles: true }));
                };
                if (endFirst) { end(); input(); } else { input(); end(); }
                await Promise.resolve();
            };
            await run(false); await run(true);
            return { codes: t.codes(), text: host.textContent, spans: host.querySelectorAll('span').length,
                focused: document.activeElement === host, proxies: host.querySelectorAll('input, textarea, [contenteditable]').length };
        });
        expect(result).toEqual({ codes: ['定', '定'], text: '', spans: 1, focused: true, proxies: 0 });
    });
}

test('session generations end on hiding, disablement, deletion, reused IDs and disconnect', async () => {
    const current = await open('chromium', 'contenteditable');
    const result = await current.evaluate(async () => {
        const t = (window as any).rawTest;
        const host = t.hosts.get(10);
        const start = () => host.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
        const late = () => {
            host.dispatchEvent(new CompositionEvent('compositionend', { data: 'stale', bubbles: true }));
            host.dispatchEvent(new InputEvent('input', { inputType: 'insertCompositionText', data: 'stale', bubbles: true }));
        };
        const generations = [t.renderer.textInputState.generation];
        start();
        t.diff([t.change(10, { focused: true, editable: true }, { validArea: t.rect(30, 50, 0, 0) })]); late();
        t.diff([t.change(10, { focused: true, editable: true }, { validArea: t.nodes[0].content.bounds })]);
        generations.push(t.renderer.textInputState.generation);
        start(); t.diff([t.change(10, { focused: true, editable: false })]); late();
        t.diff([t.change(10, { focused: true, editable: true })]); generations.push(t.renderer.textInputState.generation);
        start(); t.diff([{ id: -1, diffType: 'Modified', content: null, children: [20, 30] },
            { id: 11, diffType: 'Deleted', content: null, children: null },
            { id: 10, diffType: 'Deleted', content: null, children: null }]); late();
        t.full(t.root(t.nodes)); generations.push(t.renderer.textInputState.generation); late();
        t.renderer.stop(true); late();
        await Promise.resolve();
        return { codes: t.codes(), generations, active: t.renderer.textInputState.activeId,
            restored: host.getAttribute('contenteditable') === null, connected: host.isConnected };
    });
    expect(result.codes).toEqual([]);
    expect(result.generations.every((value, i, values) => i === 0 || value > values[i - 1])).toBe(true);
    expect(result).toMatchObject({ active: null, restored: true, connected: false });
});

test('VirtualKeyboard test double respects manual ownership and geometry without layout insets', async () => {
    const current = await open('chromium', 'contenteditable', 10, 'Core', 'manual');
    await current.locator('[data-gacui-input="10"]').click();
    expect(await current.evaluate(() => (window as any).keyboardCalls)).toEqual([['show', '10']]);
    await current.evaluate(() => {
        const t = (window as any).rawTest;
        (window as any).editingKeyboard.dispatchEvent(new Event('geometrychange'));
        t.diff([t.change(10, { focused: false, editable: true }), t.change(20, { focused: true, editable: true })]);
    });
    await current.locator('[data-gacui-input="20"]').click();
    await current.setViewportSize({ width: 880, height: 600 });
    const result = await current.evaluate(() => {
        const t = (window as any).rawTest;
        const same = t.hosts.get(20) === document.activeElement;
        const outside = document.querySelector<HTMLInputElement>('input')!;
        outside.focus();
        t.renderer.stop();
        return { calls: (window as any).keyboardCalls, same, overlay: (window as any).editingKeyboard.overlaysContent,
            policy: t.hosts.get(20).getAttribute('virtualkeyboardpolicy') };
    });
    expect(result).toEqual({ calls: [['show', '10'], ['hide', '10'], ['show', '20']], same: true, overlay: undefined, policy: null });
});

test('absent VirtualKeyboard and EditContext manual ineligibility preserve automatic host focus', async () => {
    const current = await open('chromium', 'auto', 10, 'Core', 'absent');
    expect(await current.evaluate(() => (window as any).rawTest.renderer.textInputState.capabilities.virtualKeyboard)).toBe(false);
    await current.keyboard.insertText('无');
    expect(await codes(current)).toEqual(['无']);
    await current.close(); page = undefined;
    const manual = await open('chromium', 'auto', 10, 'Core', 'manual');
    await manual.locator('[data-gacui-input="10"]').click();
    expect(await manual.evaluate(() => (window as any).keyboardCalls)).toEqual([]);
    expect(await manual.locator('[data-gacui-input="10"]').getAttribute('virtualkeyboardpolicy')).toBe(null);
});

test('snapshot InlineObjectWithCaret playback is passive despite focused editing metadata', async () => {
    errors = [];
    page = await browsers.get('chromium')!.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/snapshots.html`);
    await page.addScriptTag({ type: 'module', content: `import { renderUI } from '/entry-real.js'; window.editingSnapshot = renderUI;` });
    await page.waitForFunction(() => (window as any).editingSnapshot !== undefined);
    const result = await page.evaluate(async () => {
        const get = async (path: string) => JSON.parse((await (await fetch(path)).text()).replace(/^\uFEFF/u, ''));
        const path = '/snapshots/Controls/Editor/Features/InlineObjectWithCaret';
        const trace = await get(`${path}.json`);
        const target = document.getElementById('gacuiScreen')!;
        const focused = document.activeElement;
        let images = 0;
        for (let i = 0; i < trace.frames.length; i++) {
            trace.frames[i] = await get(`${path}/frame_${i}.json`);
            (window as any).editingSnapshot(target, trace, i);
            images = Math.max(images, target.querySelectorAll('img').length);
            if (document.activeElement !== focused) throw new Error('Snapshot playback acquired focus.');
            if (target.querySelector('[data-gacui-input], [contenteditable], input, textarea') !== null) throw new Error('Snapshot playback activated text capture.');
        }
        return { frames: trace.frames.length, images };
    });
    expect(result.frames).toBeGreaterThan(1);
    expect(result.images).toBeGreaterThan(0);
});

test('trusted touch activates only a short single-contact tap before Core confirmation', async () => {
    const current = await open('chromium', 'contenteditable', null);
    const cdp = await current.context().newCDPSession(current);
    const bounds = (await current.locator('[data-gacui-input="20"]').boundingBox())!;
    const point = { x: bounds.x + 20, y: bounds.y + 20, id: 1 };
    let timestamp = Date.now() / 1000;
    const touch = async (type: string, touchPoints: typeof point[], elapsed = 0.02) => {
        timestamp += elapsed;
        await cdp.send('Input.dispatchTouchEvent', { type, touchPoints, timestamp });
    };
    const inactive = async () => expect(await current.evaluate(() => (window as any).rawTest.renderer.textInputState.activeId)).toBe(null);
    await touch('touchStart', [point]);
    await touch('touchMove', [{ ...point, x: point.x + 30 }]);
    await touch('touchEnd', []); await inactive();
    await touch('touchStart', [point]); await touch('touchEnd', [], 0.6); await inactive();
    await touch('touchStart', [point]); await touch('touchCancel', []); await inactive();
    await touch('touchStart', [point]);
    await touch('touchStart', [point, { ...point, id: 2, x: point.x + 20 }]);
    await touch('touchEnd', []); await inactive();
    await touch('touchStart', [point]); await touch('touchEnd', []);
    expect(await current.evaluate(() => ({ ...((window as any).rawTest.renderer.textInputState),
        focus: (document.activeElement as HTMLElement).dataset.gacuiInput }))).toMatchObject({ activeId: 20, pending: true, focus: '20' });
    await current.keyboard.insertText('tap');
    expect(await current.evaluate(() => (window as any).rawTest.codes())).toEqual([]);
    await current.evaluate(() => { const t = (window as any).rawTest; t.diff([t.change(20, { focused: true, editable: true })]); });
    expect(await codes(current)).toEqual(['t', 'a', 'p']);
});

for (const adapter of ['auto', 'contenteditable']) {
    test(`Core anchor changes and hidden ancestors invalidate local composition (${adapter})`, async () => {
        const current = await open('chromium', adapter);
        const cdp = await current.context().newCDPSession(current);
        const compose = (text: string) => cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
        await compose('pending');
        await current.evaluate(async () => {
            const t = (window as any).rawTest;
            t.oldContext = t.hosts.get(10).editContext;
            await t.request('RendererUpdateElement_DocumentParagraph', t.paragraph(101, 'Changed'));
        });
        expect(await current.evaluate(() => (window as any).rawTest.renderer.textInputState.composing)).toBe(false);
        expect(await current.locator('[data-gacui-input="10"]').textContent()).toBe('Changed');
        await compose('ancestor');
        const result = await current.evaluate(async () => {
            const t = (window as any).rawTest;
            const parent = t.node(100, null, t.rect(0, 0, 850, 600), t.nodes);
            t.full(t.root([parent]));
            parent.content.validArea = t.rect(0, 0, 0, 0);
            t.diff([{ id: 100, diffType: 'Modified', content: parent.content, children: null }]);
            const hidden = t.renderer.textInputState.activeId;
            parent.content.validArea = parent.content.bounds;
            t.diff([{ id: 100, diffType: 'Modified', content: parent.content, children: null }]);
            t.oldContext?.dispatchEvent(new Event('compositionend'));
            t.hosts.get(10).dispatchEvent(new CompositionEvent('compositionend', { data: 'late', bubbles: true }));
            await Promise.resolve();
            return { hidden, current: t.renderer.textInputState.activeId, codes: t.codes() };
        });
        expect(result).toEqual({ hidden: null, current: 10, codes: [] });
    });
}

test('EditContext respects capture selection, character bounds and unsupported replacement ranges', async () => {
    const current = await open('chromium', 'auto');
    const cdp = await current.context().newCDPSession(current);
    await cdp.send('Input.imeSetComposition', { text: 'abcd', selectionStart: 1, selectionEnd: 3 });
    const result = await current.evaluate(() => {
        const t = (window as any).rawTest;
        const host = t.hosts.get(10);
        const context = host.editContext;
        const bounds = new Event('characterboundsupdate');
        Object.assign(bounds, { rangeStart: 1, rangeEnd: 5 });
        context.dispatchEvent(bounds);
        const rectangles = context.characterBounds().map((rect: DOMRect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height }));
        const format = new Event('textformatupdate');
        Object.assign(format, { getTextFormats: () => [{ rangeStart: 1, rangeEnd: 5, underlineStyle: 'solid', underlineThickness: 'thin' }] });
        context.dispatchEvent(format);
        const selection = [context.selectionStart, context.selectionEnd];
        const preedit = host.dataset.gacuiPreedit;
        // A replacement crossing a capture guard cannot be mapped to a Core range.
        const correction = new Event('textupdate');
        Object.assign(correction, { updateRangeStart: 0, updateRangeEnd: 2, text: 'WRONG', selectionStart: 5, selectionEnd: 5 });
        context.dispatchEvent(correction);
        return { rectangles, selection, preedit, composing: t.renderer.textInputState.composing, codes: t.codes(),
            host: host.getBoundingClientRect().toJSON() };
    });
    expect(result.selection).toEqual([2, 4]);
    expect(result.preedit).toBe('abcd');
    expect(result.rectangles).toHaveLength(4);
    expect(result.rectangles.every((rect: any, index: number, values: any[]) => rect.width > 0 && rect.height > 0 &&
        rect.x >= result.host.x && rect.y >= result.host.y && (index === 0 || rect.x >= values[index - 1].x))).toBe(true);
    expect(result).toMatchObject({ composing: false, codes: [] });
});

test('range corrections are rejected and IME candidate keys do not reach Core', async () => {
    const current = await open('chromium', 'contenteditable');
    const result = await current.evaluate(async () => {
        const t = (window as any).rawTest;
        const host = t.hosts.get(10);
        const text = host.querySelector('span').firstChild;
        const correction = new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: 'WRONG',
            targetRanges: [new StaticRange({ startContainer: text, startOffset: 0, endContainer: text, endOffset: 2 })] });
        host.dispatchEvent(correction);
        host.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
        for (const key of ['Enter', 'Escape', 'ArrowDown', 'Process']) {
            for (const type of ['keydown', 'keyup']) host.dispatchEvent(new KeyboardEvent(type, { key, isComposing: true, bubbles: true, cancelable: true }));
        }
        host.dispatchEvent(new CompositionEvent('compositionend', { data: '', bubbles: true }));
        await Promise.resolve();
        return { prevented: correction.defaultPrevented, text: host.textContent,
            input: t.sent.filter((value: any) => ['IOChar', 'IOKeyDown', 'IOKeyUp'].includes(value.name)) };
    });
    expect(result).toEqual({ prevented: true, text: 'Core', input: [] });
    await current.keyboard.press('Tab');
    await current.keyboard.press('Control+z');
    await current.keyboard.press('Control+y');
    expect(await codes(current)).toEqual(['\t']);
});

test('explicit legacy mode keeps physical-key characters without advertising IME capture', async () => {
    const current = await open('chromium', 'legacy');
    await current.locator('#gacui-screen').focus();
    await current.keyboard.type('abc');
    expect(await codes(current)).toEqual(['a', 'b', 'c']);
    expect(await current.evaluate(() => (window as any).rawTest.renderer.textInputState.adapter)).toBe('legacy');
    expect(await current.locator('[contenteditable="plaintext-only"]').count()).toBe(0);
});
