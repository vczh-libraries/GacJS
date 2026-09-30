import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { chromium, expect as expectUI } from '@playwright/test';
import { IOMouseButton } from '@gaclib/remote-protocol';
import { clickAt, findTextInputPointRightOfLabel, getLeafTextPositions, setupIdleTracking, waitUntilIdle, waitForIdle } from './Testing_Protocol.js';

let browser;
let page;
let errors;
let expectedErrors;
let browserSession;

beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    browserSession = await browser.newBrowserCDPSession();
});
afterEach(async () => {
    if (page !== undefined) {
        if (errors.length !== expectedErrors.length) console.log(await page.locator('#gacui-screen').innerText());
        await page.close();
        page = undefined;
        await workersStopped();
        expect(errors).toEqual(expectedErrors);
    }
});
afterAll(async () => { await browser?.close(); });

async function open(app, title) {
    page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    errors = [];
    expectedErrors = [];
    page.on('pageerror', error => { errors.push(error.message); });
    page.on('console', message => { if (message.type() === 'error') console.log('Browser:', message.text()); });
    page.on('dialog', dialog => { errors.push(dialog.message()); void dialog.dismiss(); });
    await setupIdleTracking(page);
    await page.goto(`http://127.0.0.1:8896/wasm-${app}/`);
    await expect.poll(async () => errors.length > 0 || (await page.locator('#gacui-screen').textContent()).includes(title), { timeout: 60000 }).toBe(true);
    expect(errors).toEqual([]);
    await waitUntilIdle(page, 60000);
    await expectUI(page.locator('#gacui-screen')).toContainText(title);
    await expectUI(page.locator('#gacui-error-mask')).not.toBeVisible();
    expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
    expect((await browserSession.send('Target.getTargets')).targetInfos.some(target => target.type === 'worker')).toBe(true);
    await page.evaluate(() => {
        const application = window.__gacui_wasm_session.application;
        window.__wasm_events = [];
        window.__wasm_errors = [];
        application.worker.addEventListener('message', ({ data }) => {
            if (data.kind === 'data' && data.data.includes(';!Error;')) window.__wasm_errors.push(data);
        });
        const send = application.send.bind(application);
        application.send = command => {
            if (command.kind === 'data') {
                const marker = ';GacUIRemoteProtocol;';
                const offset = command.data.indexOf(marker);
                if (offset !== -1) {
                    const messages = JSON.parse(command.data.substring(offset + marker.length));
                    window.__wasm_events.push(...messages.filter(message => message.semantic === 'Event'));
                }
            }
            send(command);
        };
    });
}

async function clickText(text) {
    const element = await page.locator('#gacui-screen').getByText(text, { exact: true }).first().elementHandle();
    expect(element, `Missing text: ${text}`).not.toBeNull();
    await element.waitForElementState('stable');
    let target;
    await expect.poll(async () => {
        target = (await getLeafTextPositions(page)).find(position => position.text === text && position.width > 0 && position.height > 0);
        return target;
    }, { message: `Missing visible text: ${text}` }).toBeDefined();
    await clickAt(page, target.cx, target.cy);
}

async function stopped() {
    await expectUI(page.locator('#gacui-success-mask')).toBeVisible();
    expect(await page.evaluate(() => window.__gacui_wasm_session.application.completion)).toBe(0);
    await expectUI(page.locator('#gacui-error-mask')).not.toBeVisible();
    await workersStopped();
}

async function workersStopped() {
    await expect.poll(async () => (await browserSession.send('Target.getTargets')).targetInfos.filter(target => target.type === 'worker').map(target => target.url), { timeout: 15000 }).toEqual([]);
}

async function editorPoint() {
    const point = await page.locator('#gacui-screen div').evaluateAll(nodes => {
        const rectangles = nodes.filter(node => getComputedStyle(node).cursor === 'text')
            .map(node => node.getBoundingClientRect())
            .filter(rect => rect.width > 20 && rect.height > 10)
            .sort((a, b) => b.width * b.height - a.width * a.height);
        const rect = rectangles[0];
        return rect === undefined ? null : { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    expect(point).not.toBeNull();
    return point;
}

async function leafTexts() { return (await getLeafTextPositions(page)).map(position => position.text); }

async function replaceRenderer() {
    await page.evaluate(() => { window.__wasm_old_client = window.__gacui_wasm_session.client; });
    await page.getByRole('button', { name: 'Replace Renderer', exact: true }).click();
    await page.waitForFunction(() => window.__gacui_wasm_session.client !== window.__wasm_old_client);
    await waitForIdle(page);
    const previous = await page.evaluate(async () => {
        const result = await window.__wasm_old_client.channelClient.completion;
        return { type: result.type, message: result.error?.message };
    });
    expect(previous).toEqual({ type: 'failed', message: 'IGacUIRenderer exited due to receiving RequestControllerConnectionStopped.' });
    await expectUI(page.locator('#gacui-error-mask')).not.toBeVisible();
}

async function shortcutsAndMouse() {
    const screen = page.locator('#gacui-screen');
    for (const label of ['Ctrl+Q', 'Ctrl+Alt+Super+Q', '{Ctrl+Shift+Alt+Super+Q}']) await expect.poll(leafTexts).toContain(label);
    const labels = await leafTexts();
    expect(labels.some(label => label.includes('osSuper'))).toBe(false);
    // The dialog text is fixed in the resource; the shortcut labels use the renderer's platform name.
    for (const [key, text] of [
        ['Control+q', 'You pressed Ctrl+Q!'],
        ['Control+Alt+Meta+q', 'You pressed Ctrl+Alt+Win+Q!'],
        ['Control+Shift+Alt+Meta+q', 'You pressed Ctrl+Shift+Alt+Win+Q!'],
    ]) {
        await screen.focus();
        await page.keyboard.press(key);
        await expectUI(screen).toContainText(text);
        await clickText('OK');
        await expectUI(screen).not.toContainText(text);
    }
    const url = page.url();
    const cdp = await page.context().newCDPSession(page);
    for (const modifiers of [0, 1, 4, 5, 15]) {
        const expected = { alt: (modifiers & 1) !== 0, ctrl: (modifiers & 2) !== 0, osSuper: (modifiers & 4) !== 0, shift: (modifiers & 8) !== 0 };
        for (const [name, button, buttons] of [
            ['Left', 'left', 1], ['Middle', 'middle', 4], ['Right', 'right', 2], ['Mouse4', 'back', 8], ['Mouse5', 'forward', 16],
        ]) {
            const target = (await getLeafTextPositions(page)).find(p => p.text === 'Click here with any mouse button.' || p.text.endsWith(' button up!'));
            expect(target).toBeDefined();
            for (const [type, suffix, pressed] of [['mousePressed', 'down', buttons], ['mouseReleased', 'up', 0]]) {
                await cdp.send('Input.dispatchMouseEvent', { type, x: target.cx, y: target.cy, button, buttons: pressed, clickCount: 1, modifiers });
                await expect.poll(leafTexts).toContain(`${name} button ${suffix}!`);
                await expect.poll(leafTexts).toContain(`Alt: ${expected.alt ? 1 : 0}; Super: ${expected.osSuper ? 1 : 0}`);
                const event = await page.evaluate(() => window.__wasm_events.filter(item => item.name === 'IOButtonDown' || item.name === 'IOButtonUp').at(-1));
                expect(event.arguments).toMatchObject({ button: IOMouseButton[name], info: expected });
            }
            expect(page.url()).toBe(url);
        }
        const target = (await getLeafTextPositions(page)).find(p => p.text.endsWith(' button up!'));
        for (const [name, input, payload] of [
            ['IOMouseMoving', { type: 'mouseMoved', x: target.cx + 1, button: 'none' }, {}],
            ['IOVWheel', { type: 'mouseWheel', deltaX: 0, deltaY: -120 }, { wheel: 120 }],
            ['IOVWheel', { type: 'mouseWheel', deltaX: 0, deltaY: 120 }, { wheel: -120 }],
            ['IOHWheel', { type: 'mouseWheel', deltaX: -120, deltaY: 0 }, { wheel: 120 }],
            ['IOHWheel', { type: 'mouseWheel', deltaX: 120, deltaY: 0 }, { wheel: -120 }],
        ]) {
            await page.evaluate(() => { window.__wasm_events = []; });
            await cdp.send('Input.dispatchMouseEvent', { x: target.cx, y: target.cy, modifiers, ...input });
            await expect.poll(() => page.evaluate(name => window.__wasm_events.filter(item => item.name === name), name)).toHaveLength(1);
            const event = await page.evaluate(name => window.__wasm_events.find(item => item.name === name), name);
            expect(event.arguments).toMatchObject({ ...expected, ...payload });
            await expect.poll(leafTexts).toContain(`Alt: ${expected.alt ? 1 : 0}; Super: ${expected.osSuper ? 1 : 0}`);
        }
        for (const [button, buttons, name] of [['left', 1, 'Left'], ['middle', 4, 'Middle'], ['right', 2, 'Right'], ['back', 8, 'Mouse4'], ['forward', 16, 'Mouse5']]) {
            await page.evaluate(() => { window.__wasm_events = []; });
            for (const type of ['mousePressed', 'mouseReleased']) {
                await cdp.send('Input.dispatchMouseEvent', { type, x: target.cx, y: target.cy, button, buttons: type === 'mousePressed' ? buttons : 0, clickCount: 2, modifiers });
            }
            await expect.poll(() => page.evaluate(() => window.__wasm_events.filter(item => item.name === 'IOButtonDoubleClick'))).toHaveLength(1);
            const event = await page.evaluate(() => window.__wasm_events.find(item => item.name === 'IOButtonDoubleClick'));
            expect(event.arguments).toMatchObject({ button: IOMouseButton[name], info: expected });
            await expect.poll(leafTexts).toContain(`${name} button up!`);
        }
    }
    await cdp.detach();
}

async function typeGreeting(marker) {
    const point = await editorPoint();
    await clickAt(page, point.x, point.y);
    await page.keyboard.press('Control+a');
    await page.keyboard.type(marker);
    await expect.poll(leafTexts).toContain(`Hello, ${marker}!`);
}

async function fatal(message) {
    await expectUI(page.locator('#gacui-error-mask')).toBeVisible();
    await expectUI(page.locator('#gacui-error-message')).toHaveText(message);
    await expectUI(page.locator('#gacui-success-mask')).not.toBeVisible();
    await expect(page.evaluate(() => window.__gacui_wasm_session.application.completion)).rejects.toThrow('Wasm application stopped.');
    await workersStopped();
    await expect.poll(() => errors).toEqual(expectedErrors);
    const packets = await page.evaluate(() => window.__wasm_errors);
    const rendererPackets = packets.filter(packet => packet.data.endsWith(`;!Error;${message}`));
    expect(rendererPackets).toHaveLength(1);
}

test('WasmRPT renders and exchanges Home/DataGrid/Document events, replaces its renderer and exits', async () => {
    await open('rpt', 'Remote Protocol Test');
    await clickText('Click Me!');
    await expectUI(page.locator('#gacui-screen')).toContainText('You have clicked!');
    expect(await leafTexts()).not.toContain('Click Me!');
    await shortcutsAndMouse();
    await clickText('DataGrid');
    await expect.poll(leafTexts).toContain('Description');
    const emptyGrid = await leafTexts();
    for (const header of ['Name', 'Title', 'Description']) expect(emptyGrid).toContain(header);
    await clickText('Add 3 Rows');
    await expect.poll(async () => (await leafTexts()).filter(text => !emptyGrid.includes(text))).toHaveLength(9);
    const cells = (await getLeafTextPositions(page)).filter(p => !emptyGrid.includes(p.text));
    expect(cells).toHaveLength(9);
    const rows = [...new Set(cells.map(cell => cell.top))];
    expect(rows).toHaveLength(3);
    for (const y of rows) expect(cells.filter(cell => cell.top === y)).toHaveLength(3);
    await clickText('Clear');
    await expect.poll(leafTexts).toEqual(emptyGrid);
    await clickText('Document');
    await clickText('RIGHT NOW');
    await expectUI(page.locator('#gacui-screen')).toContainText('Pretend to be starting!');
    await clickText('OK');
    await expectUI(page.locator('#gacui-screen')).not.toContainText('Pretend to be starting!');
    await replaceRenderer();
    await clickText('Home');
    await expectUI(page.locator('#gacui-screen')).toContainText('You have clicked!');
    await replaceRenderer();
    await expectUI(page.locator('#gacui-screen')).toContainText('You have clicked!');
    await shortcutsAndMouse();
    await clickText('File');
    await clickText('self.Close() (InvokeInMainThread)');
    await expectUI(page.locator('#gacui-screen')).toContainText('Do you want to exit?');
    await clickText('OK');
    await stopped();
});

test('WasmFCT preserves both editors, lists and input through tabs, palette refresh and renderer replacement', async () => {
    await open('fct', 'Complete Control Showcase');
    await clickText('Add 10 items');
    await expect.poll(async () => (await leafTexts()).filter(text => text === '0')).toHaveLength(2);
    const text = (await getLeafTextPositions(page)).map(p => p.text);
    for (let i = 0; i < 10; i++) expect(text.filter(t => t === String(i))).toHaveLength(2);
    await clickText('Clear');
    await expect.poll(async () => (await leafTexts()).filter(text => /^\d$/u.test(text))).toHaveLength(0);
    const cleared = (await getLeafTextPositions(page)).map(p => p.text);
    for (let i = 0; i < 10; i++) expect(cleared).not.toContain(String(i));
    await clickText('Control');
    await clickText('Document Editor (Ribbon)');
    const searchLabel = (await getLeafTextPositions(page)).find(p => p.text === 'Search:');
    expect(searchLabel).toBeDefined();
    const search = await findTextInputPointRightOfLabel(page, searchLabel);
    await clickAt(page, search.x, search.y);
    for (const key of 'Wasm[Ab]{Cd}') await page.keyboard.press(key);
    await expectUI(page.locator('#gacui-screen')).toContainText('Wasm[Ab]{Cd}');
    const keys = await page.evaluate(() => window.__wasm_events.filter(item => item.name === 'IOKeyDown').map(item => item.arguments.code));
    expect(keys).toContain(0xDB);
    expect(keys).toContain(0xDD);
    const rich = await editorPoint();
    await clickAt(page, rich.x, rich.y);
    await page.keyboard.type('WasmRichEditor');
    await expectUI(page.locator('#gacui-screen')).toContainText('WasmRichEditor');
    await clickText('List');
    await expectUI(page.locator('#gacui-screen')).toContainText('Add 10 items');
    await clickText('Control');
    for (const marker of ['Wasm[Ab]{Cd}', 'WasmRichEditor']) await expectUI(page.locator('#gacui-screen')).toContainText(marker);
    await clickText('Window Manager');
    await shortcutsAndMouse();
    const colors = () => page.locator('#gacui-screen').evaluate(screen => [...screen.querySelectorAll('*')].flatMap(node => {
        const style = getComputedStyle(node);
        return [style.backgroundColor, style.borderTopColor, style.color];
    }));
    expect(await colors()).not.toContain('rgb(22, 138, 122)');
    await clickText('Aurora');
    await expect.poll(colors).toContain('rgb(22, 138, 122)');
    await clickText('Control');
    for (const marker of ['Wasm[Ab]{Cd}', 'WasmRichEditor']) await expectUI(page.locator('#gacui-screen')).toContainText(marker);
    await clickText('Window Manager');
    await expect.poll(leafTexts).toContain('Aurora');
    await replaceRenderer();
    await shortcutsAndMouse();
    await clickText('Control');
    for (const marker of ['Wasm[Ab]{Cd}', 'WasmRichEditor']) await expectUI(page.locator('#gacui-screen')).toContainText(marker);
    await page.getByRole('button', { name: 'Force Exit', exact: true }).click();
    await stopped();
});

test('WasmRVMT retains its TypeScript host through rejected admission and renderer replacement', async () => {
    await open('rvmt', 'Remote View Model Test');
    await expectUI(page.locator('#gacui-screen')).toContainText('Hello, !');
    await typeGreeting('WasmRPC');
    const rejection = await page.evaluate(async () => {
        const host = window.__gacui_wasm_session.application.createChannel(['ViewModelChannel', 'ViewModelReadyChannel']);
        try { await host.connect(); return ''; }
        catch (error) { return error.message; }
        finally { host.stop(); }
    });
    expect(rejection).not.toBe('');
    await typeGreeting('OriginalHost');
    await replaceRenderer();
    await expect.poll(leafTexts).toContain('Hello, OriginalHost!');
    await typeGreeting('WasmUTF16');
    const cdp = await page.context().newCDPSession(page);
    for (const key of '你好') {
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: 'KeyA', windowsVirtualKeyCode: 65, text: key });
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: 'KeyA', windowsVirtualKeyCode: 65 });
    }
    await cdp.detach();
    await expect.poll(leafTexts).toContain('Hello, WasmUTF16你好!');
    await page.getByRole('button', { name: 'Force Exit', exact: true }).click();
    await stopped();
});

test('WasmRPT preserves the exact Core-authored fatal error', async () => {
    await open('rpt', 'Remote Protocol Test');
    expectedErrors = ['This is a fatel error!'];
    await clickText('Fatel Error');
    await fatal(expectedErrors[0]);
});

for (const pending of [false, true]) {
    test(`WasmRVMT reports accepted-host loss ${pending ? 'during an outstanding RPC' : 'before the next RPC'}`, async () => {
        await open('rvmt', 'Remote View Model Test');
        await typeGreeting('Alive');
        const point = await editorPoint();
        await clickAt(page, point.x, point.y);
        await page.keyboard.press('End');
        expectedErrors = ['RemotingTest_RvmHost disconnected.'];
        if (pending) {
            await page.evaluate(() => {
                const channel = window.__gacui_wasm_session.host.channel;
                const send = channel.sendToClient.bind(channel);
                channel.sendToClient = (id, name, body) => {
                    if (body.includes('Hello, AliveX!')) {
                        window.__wasm_rpc_reply_held = true;
                        return new Promise(() => {});
                    }
                    return send(id, name, body);
                };
            });
            await page.keyboard.type('X');
            await page.waitForFunction(() => window.__wasm_rpc_reply_held === true);
        }
        await page.evaluate(() => { window.__gacui_wasm_session.host.stop(); });
        if (!pending) await page.keyboard.type('X');
        await fatal(expectedErrors[0]);
    });
}

test('closing a live Wasm page terminates its Core and pthreads', async () => {
    await open('rvmt', 'Remote View Model Test');
    await typeGreeting('ClosingPage');
    await page.close();
    page = undefined;
    await workersStopped();
    expect(errors).toEqual([]);
});
