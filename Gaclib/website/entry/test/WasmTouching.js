import { expect } from 'vitest';
import { expect as expectUI } from '@playwright/test';
import { clickAt, getLeafTextPositions } from './Testing_Protocol.js';

// Observe the real worker boundary without replacing the channel, Core or painter.
// This also works with WebsiteSource's public launcher, which has no test session API.
export async function observeWasm(page) {
    await page.addInitScript(() => {
        window.__touchWire = { events: [], raw: {}, received: 0, downloads: [] };
        const inspect = value => {
            if (value === null || typeof value !== 'object') return;
            if (typeof value.rawId === 'string' && typeof value.data === 'string') window.__touchWire.raw[value.rawId] = value.data;
            for (const child of Object.values(value)) inspect(child);
        };
        const observe = (command, outgoing) => {
            if (command.kind !== 'data') return;
            const marker = ';GacUIRemoteProtocol;';
            const offset = command.data.indexOf(marker);
            if (offset === -1) return;
            const messages = JSON.parse(command.data.slice(offset + marker.length));
            if (outgoing) window.__touchWire.events.push(...messages.filter(message => message.semantic === 'Event'));
            else { inspect(messages); window.__touchWire.received++; }
        };
        const OriginalWorker = window.Worker;
        window.Worker = class extends OriginalWorker {
            constructor(...args) {
                super(...args);
                this.addEventListener('message', event => observe(event.data, false));
            }
            postMessage(command, ...args) { observe(command, true); return super.postMessage(command, ...args); }
        };
        const OriginalObserver = window.ResizeObserver;
        window.__rawObservers = new Set();
        window.ResizeObserver = class extends OriginalObserver {
            observe(target, ...args) {
                if (target.querySelector('canvas') !== null) window.__rawObservers.add(this);
                return super.observe(target, ...args);
            }
            disconnect() { window.__rawObservers.delete(this); return super.disconnect(); }
        };
        navigator.serviceWorker?.addEventListener('message', ({ data }) => {
            if (data.kind === 'wasm-download') window.__touchWire.downloads.push(data);
        });
    });
}

export const poll = callback => expect.poll(callback, { timeout: 15000 });
export const texts = async page => (await getLeafTextPositions(page)).map(p => p.text);
export async function textPoint(page, text) {
    let point;
    await poll(async () => {
        point = (await getLeafTextPositions(page)).find(p => p.text === text && p.width > 1 && p.height > 1);
        return point;
    }).toBeDefined();
    return { x: point.cx, y: point.cy };
}
export async function select(page, text) {
    const element = await page.locator('#gacui-screen').getByText(text, { exact: true }).first().elementHandle();
    expect(element, `Missing text: ${text}`).not.toBeNull();
    await element.waitForElementState('stable');
    const point = await textPoint(page, text);
    await clickAt(page, point.x, point.y);
}
export const rawData = (page, id = 'FullControlTest.Touching') => page.evaluate(id => window.__touchWire.raw[id], id);
const state = async page => (await rawData(page)).split(',').map(Number);
const wireEvents = page => page.evaluate(() => window.__touchWire.events);
const clearEvents = page => page.evaluate(() => { window.__touchWire.events = []; });
const sameTransform = (a, b) => a.slice(0, 4).every((n, i) => Math.abs(n - b[i]) < 0.01);

export async function touchDriver(page, native = true) {
    if (native) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
        return async (type, touchPoints) => { await cdp.send('Input.dispatchTouchEvent', { type, touchPoints }); };
    }
    // Firefox DOM-synthetic adapter coverage only. Real capture is covered by Chromium CDP.
    await page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        screen.setPointerCapture = () => {};
        screen.releasePointerCapture = () => {};
        screen.hasPointerCapture = () => false;
        window.__syntheticContacts = new Map();
    });
    return async (type, fingers) => page.evaluate(({ type, fingers }) => {
        const contacts = window.__syntheticContacts;
        const send = (name, finger) => {
            const target = document.elementFromPoint(finger.x, finger.y) ?? document.getElementById('gacui-screen');
            target.dispatchEvent(new PointerEvent(name, { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: finger.id,
                isPrimary: finger.id === contacts.keys().next().value, clientX: finger.x, clientY: finger.y, pressure: 0.7, width: 10, height: 10 }));
        };
        if (type === 'touchStart') {
            for (const finger of fingers) if (!contacts.has(finger.id)) { contacts.set(finger.id, finger); send('pointerdown', finger); }
        } else if (type === 'touchMove') {
            for (const finger of fingers) { contacts.set(finger.id, finger); send('pointermove', finger); }
        } else {
            const ending = fingers.length === 0 ? [...contacts.values()] : fingers;
            for (const finger of ending) { send(type === 'touchCancel' ? 'pointercancel' : 'pointerup', finger); contacts.delete(finger.id); }
        }
    }, { type, fingers });
}

async function pixels(page) {
    return page.locator('#gacui-screen canvas').evaluate(canvas => {
        const bytes = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let sky = 0, yellow = 0, hash = 0;
        for (let i = 0; i < bytes.length; i += 4) {
            if (bytes[i] === 135 && bytes[i + 1] === 206 && bytes[i + 2] === 235) sky++;
            if (bytes[i] === 255 && bytes[i + 1] === 255 && bytes[i + 2] === 0) yellow++;
            hash = (Math.imul(hash, 31) + bytes[i] + bytes[i + 1] + bytes[i + 2]) | 0;
        }
        return { sky, yellow, hash };
    });
}

function sequence(events, slots, reason = 'Succeeded') {
    const points = events.filter(e => e.name.startsWith('IOPoint'));
    expect(points.filter(e => e.name === 'IOPointStarted')).toHaveLength(1);
    expect(points.filter(e => e.name === 'IOPointEnded')).toHaveLength(1);
    expect(points.map(e => e.arguments.eventIndex)).toEqual(points.map((_, i) => i));
    expect(points.filter(e => e.name === 'IOPointDown').map(e => e.arguments.info.pointId)).toEqual(slots);
    expect(points.at(-1).arguments.reason).toBe(reason);
    for (const event of points) {
        const sample = event.arguments.info ?? event.arguments;
        for (const field of ['sequenceId', 'timestamp']) expect(sample[field]).toMatch(/^(0|[1-9]\d*)$/u);
    }
    expect(events.filter(e => /^(IOButton|IOMouse)/u.test(e.name))).toEqual([]);
}

export async function checkTouching(page, send, native = true) {
    await select(page, 'Misc');
    await select(page, 'Touching');
    await expectUI(page.locator('#gacui-screen canvas')).toHaveCount(1);
    await poll(() => rawData(page)).toBeDefined();
    const bounds = await page.locator('#gacui-screen canvas').boundingBox();
    const initial = await state(page);
    const picture = await pixels(page);
    expect(picture.sky).toBeGreaterThan(1000);
    let a = { id: 10, x: bounds.x + 140, y: bounds.y + 120, radiusX: 6, radiusY: 8, force: 0.7 };
    let b = { id: 20, x: a.x + 100, y: a.y };
    await clearEvents(page);
    await send('touchStart', [a]);
    await poll(async () => (await state(page))[4]).toBe(1);
    a = { ...a, x: a.x + 30, y: a.y + 20 };
    await send('touchMove', [a]);
    await poll(async () => (await state(page)).slice(0, 2)).toEqual([initial[0] + 30, initial[1] + 20]);
    await poll(async () => (await pixels(page)).yellow).toBeGreaterThan(20);
    expect((await pixels(page)).hash).not.toBe(picture.hash);
    b = { ...b, x: a.x + 100, y: a.y };
    await send('touchStart', [a, b]);
    await poll(async () => (await state(page))[4]).toBe(2);
    b = { ...b, x: a.x, y: a.y + 160 };
    await send('touchMove', [a, b]);
    await poll(async () => (await state(page))[3]).toBeCloseTo(initial[2] * 1.6, 2);
    const transformed = await state(page);
    let c = { id: 30, x: a.x + 40, y: a.y + 40 };
    await send('touchStart', [a, b, c]);
    await poll(async () => (await state(page))[4]).toBe(3);
    c = { ...c, x: c.x + 20 };
    await send('touchMove', [a, b, c]);
    await poll(async () => (await state(page)).at(-2)).toBeCloseTo(c.x - bounds.x, 0);
    expect(sameTransform(await state(page), transformed)).toBe(true);
    await send('touchEnd', [c]);
    await poll(async () => (await state(page))[4]).toBe(2);
    expect(sameTransform(await state(page), transformed)).toBe(true);
    a = { ...a, x: a.x + 10 }; b = { ...b, x: b.x + 10 };
    await send('touchMove', [a, b]);
    await poll(async () => (await state(page))[0]).toBeCloseTo(transformed[0] + 10, 0);
    await send('touchEnd', []);
    await poll(async () => (await state(page))[4]).toBe(0);
    await poll(async () => (await pixels(page)).yellow).toBe(0);
    sequence(await wireEvents(page), [0, 1, 2]);

    await clearEvents(page);
    await send('touchStart', [a]);
    await send('touchStart', [a, b]);
    await send('touchEnd', [a]);
    await poll(async () => (await state(page))[4]).toBe(1);
    const baseline = await state(page);
    c = { ...a }; // Reuse the browser contact identity, but allocate a new Down-order slot.
    await send('touchStart', [b, c]);
    await poll(async () => (await state(page))[4]).toBe(2);
    expect(sameTransform(await state(page), baseline)).toBe(true);
    await send('touchEnd', [b]);
    await poll(async () => (await state(page))[4]).toBe(1);
    await send('touchEnd', [c]);
    await poll(async () => (await state(page))[4]).toBe(0);
    sequence(await wireEvents(page), [0, 1, 2]);

    await clearEvents(page);
    await send('touchStart', [a]); await send('touchStart', [a, b]);
    await poll(async () => (await state(page))[4]).toBe(2);
    await send('touchCancel', []);
    await poll(async () => (await state(page))[4]).toBe(0);
    sequence(await wireEvents(page), [0, 1], 'Canceled_PlatformCanceled');
    await send('touchStart', [a]); await send('touchEnd', []);
    await poll(async () => (await state(page))[4]).toBe(0);

    if (native) {
        await page.evaluate(() => {
            const screen = document.getElementById('gacui-screen');
            screen.addEventListener('pointerdown', event => { window.__lastTouchPointer = event.pointerId; });
        });
        await clearEvents(page);
        await send('touchStart', [a]); await send('touchStart', [a, b]);
        await poll(async () => (await state(page))[4]).toBe(2);
        // A down only requests capture. Process one event on B so capture is
        // established before releasing it; canceling a pending capture emits no loss.
        await send('touchMove', [a, { ...b, x: b.x + 2 }]);
        await page.evaluate(() => document.getElementById('gacui-screen').releasePointerCapture(window.__lastTouchPointer));
        // Flush pending capture loss on the released contact itself.
        await send('touchMove', [a, { ...b, x: b.x + 1 }]);
        await poll(async () => (await state(page))[4]).toBe(0);
        await send('touchEnd', []);
        sequence(await wireEvents(page), [0, 1], 'Canceled_CaptureLost');
        await clearEvents(page);
        await send('touchStart', [a]);
        await poll(async () => (await state(page))[4]).toBe(1);
        // Resize forces child layout replacement while capture stays on the stable renderer target.
        await page.setViewportSize({ width: 1200, height: 900 });
        const screen = await page.locator('#gacui-screen').boundingBox();
        await send('touchMove', [{ ...a, x: screen.x + screen.width + 10, y: a.y }]);
        await poll(async () => (await wireEvents(page)).some(e => e.name === 'IOPointUpdate' && e.arguments.info.position.x.value > screen.width)).toBe(true);
        await send('touchEnd', []);
        await poll(async () => (await state(page))[4]).toBe(0);
        sequence(await wireEvents(page), [0]);
    }
    expect(await page.locator('#gacui-screen').evaluate(target => [...target.querySelectorAll('*')].every(child => getComputedStyle(child).touchAction === 'none'))).toBe(true);
}

const rows = async page => (await getLeafTextPositions(page)).filter(p => /^Item \d+ /u.test(p.text)).sort((a, b) => a.top - b.top);
const identities = async page => (await rows(page)).map(p => Number(/^Item (\d+) /u.exec(p.text)[1]));
const redWidths = page => page.locator('#gacui-screen div').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).backgroundColor === 'rgb(184, 32, 48)').map(node => node.getBoundingClientRect().width));

export async function checkTouchingList(page, send) {
    await select(page, 'Misc'); await select(page, 'TouchingList');
    await select(page, 'Clear');
    await poll(() => rows(page)).toHaveLength(0);
    await select(page, 'Add 5 Items');
    await poll(() => rows(page)).toHaveLength(5);
    const original = await identities(page);
    const row = (await rows(page))[1];
    const a = { id: 101, x: row.left + 230, y: row.cy };
    // The foreground occludes the delete label until the row is revealed.
    await send('touchStart', [a]);
    await send('touchMove', [{ ...a, x: a.x - 220 }]);
    await poll(async () => (await getLeafTextPositions(page)).some(p => p.text === 'DELETE IT')).toBe(true);
    const label = (await getLeafTextPositions(page)).find(p => p.text === 'DELETE IT');
    expect(label).toBeDefined();
    const maximum = label.width + 32;
    await poll(async () => Math.max(0, ...await redWidths(page))).toBe(maximum);
    await send('touchCancel', []);
    const move = distance => send('touchMove', [{ ...a, x: a.x - distance }]);
    const reveal = distance => poll(async () => {
        const current = (await rows(page)).find(p => p.text === row.text);
        return current === undefined ? -1 : Math.round(row.left - current.left);
    }).toBe(Math.round(distance));
    await send('touchStart', [a]); await move(-50); await send('touchEnd', []);
    await reveal(0);
    expect(await identities(page)).toEqual(original);
    await send('touchStart', [a]); await move(40); await reveal(40);
    await poll(async () => Math.max(0, ...await redWidths(page))).toBe(40);
    await move(25); await reveal(25);
    await send('touchEnd', []); await reveal(0);
    await send('touchStart', [a]); await move(maximum + 50); await reveal(maximum);
    await move(maximum + 35); await reveal(maximum - 15); // Reverse from the clamped value immediately.
    await send('touchCancel', []); await reveal(0);
    expect(await identities(page)).toEqual(original);
    await send('touchStart', [a]); await move(maximum); await reveal(maximum);
    await send('touchStart', [{ ...a, x: a.x - maximum }, { id: 102, x: a.x + 20, y: a.y }]);
    await reveal(0);
    await send('touchEnd', []);
    expect(await identities(page)).toEqual(original);
    await send('touchStart', [a]); await move(maximum); await reveal(maximum);
    await send('touchEnd', []);
    await poll(() => identities(page)).toEqual(original.filter(id => id !== original[1]));
    expect((await rows(page))[1].top).toBeCloseTo(row.top, 0);
    await poll(() => redWidths(page)).toEqual([]);

    const beforeFinalUp = await identities(page);
    const finalRow = (await rows(page))[1];
    const finalPoint = { id: 105, x: finalRow.left + 230, y: finalRow.cy };
    await send('touchStart', [finalPoint]);
    await send('touchEnd', [{ ...finalPoint, x: finalPoint.x - maximum }]);
    await poll(() => identities(page)).toEqual(beforeFinalUp.filter(id => id !== beforeFinalUp[1]));
    const remaining = await identities(page);
    const last = (await rows(page)).at(-1);
    const outside = { id: 106, x: last.left + 230, y: last.top + last.height + 130 };
    await send('touchStart', [outside]);
    await send('touchMove', [{ ...outside, x: outside.x - maximum }]);
    await send('touchEnd', []);
    await poll(() => redWidths(page)).toEqual([]);
    expect(await identities(page)).toEqual(remaining);

    // Pending interaction cannot redirect its eventual removal after Clear/Add.
    const next = (await rows(page))[1];
    const pending = { id: 103, x: next.left + 230, y: next.cy };
    await send('touchStart', [pending]);
    await send('touchMove', [{ ...pending, x: pending.x - maximum }]);
    await poll(async () => Math.max(0, ...await redWidths(page))).toBe(maximum);
    await select(page, 'Clear'); await select(page, 'Add 5 Items');
    await poll(() => rows(page)).toHaveLength(5);
    const fresh = await identities(page);
    expect(fresh.every(id => id > original.at(-1))).toBe(true);
    await send('touchEnd', []);
    await poll(() => identities(page)).toEqual(fresh);
    await poll(() => redWidths(page)).toEqual([]);
    await select(page, 'Add 5 Items'); await select(page, 'Add 5 Items');
    const before = (await rows(page))[1];
    const scroll = { id: 104, x: before.left + 200, y: before.cy + 150 };
    await send('touchStart', [scroll]);
    await send('touchMove', [{ ...scroll, y: scroll.y - 180 }]);
    await send('touchEnd', []);
    await poll(async () => (await rows(page)).find(p => p.text === before.text)?.top ?? -1).toBeLessThan(before.top);
    await send('touchStart', [scroll]);
    await send('touchMove', [{ ...scroll, y: scroll.y + 300 }]);
    await send('touchEnd', []);
    await poll(async () => (await rows(page))[1].top).toBeCloseTo(before.top, 0);
    await poll(() => redWidths(page)).toEqual([]);
}

export async function checkOrdinaryTouch(page, send) {
    await select(page, 'Misc'); await select(page, 'TouchingList'); await select(page, 'Clear');
    await poll(() => rows(page)).toHaveLength(0);
    const add = { id: 201, ...await textPoint(page, 'Add 5 Items') };
    await clearEvents(page);
    await send('touchStart', [add]); await send('touchEnd', []);
    await poll(() => rows(page)).toHaveLength(5); // Exactly one rejected-touch activation.
    sequence(await wireEvents(page), [0]);
    const first = await identities(page);
    await send('touchStart', [add]); await send('touchCancel', []);
    expect(await identities(page)).toEqual(first);
    const clear = { id: 202, ...await textPoint(page, 'Clear') };
    await send('touchStart', [clear]); await send('touchStart', [clear, add]);
    await send('touchEnd', [clear]);
    await poll(() => rows(page)).toHaveLength(0);
    await send('touchMove', [{ ...add, x: add.x + 1 }]); await send('touchEnd', []);
    expect(await rows(page)).toHaveLength(0); // The secondary contact cannot become the fallback mouse.

    // Establish more rows than fit in the viewport, independent of showcase data.
    const viewport = page.viewportSize();
    await page.setViewportSize({ width: 1000, height: 600 });
    await select(page, 'List'); await select(page, 'TextList');
    await select(page, 'Clear');
    for (let i = 0; i < 4; i++) await select(page, 'Add 10 items');
    const listRows = async () => (await getLeafTextPositions(page)).filter(p => /^\d+$/u.test(p.text)).sort((a, b) => a.left - b.left || a.top - b.top);
    const task = (await listRows())[0];
    expect(task).toBeDefined();
    const tap = { id: 203, x: task.cx, y: task.cy };
    const patch = () => page.screenshot({ clip: { x: task.left, y: task.top, width: task.width, height: task.height } }).then(buffer => buffer.toString('base64'));
    const unselected = await patch();
    await send('touchStart', [tap]); await send('touchEnd', []);
    await poll(patch).not.toBe(unselected);
    const selectedRow = await patch();
    const scroll = { id: 205, x: task.cx, y: task.cy + 150 };
    await send('touchStart', [scroll]);
    await send('touchMove', [{ ...scroll, y: scroll.y - 60 }]);
    const selectedItem = async () => (await listRows()).find(p => p.text === task.text && p.left < task.left + 20);
    await poll(async () => (await selectedItem())?.top ?? -1).toBeLessThan(task.top);
    await send('touchMove', [scroll]); await send('touchEnd', []);
    await poll(async () => (await selectedItem())?.top).toBeCloseTo(task.top, 0);
    await poll(patch).toBe(selectedRow);
    await page.setViewportSize(viewport);
    // Real input on nested document spans must select text rather than scroll its container.
    await select(page, 'Control'); await select(page, 'TextBox');
    const paragraph = page.locator('#gacui-screen span').filter({ hasText: 'I am the bone' }).first();
    await expectUI(paragraph).toBeVisible();
    const rect = await paragraph.boundingBox();
    const paragraphBox = page.locator('#gacui-screen div').filter({ hasText: 'I am the bone' }).last();
    const initialBox = await paragraphBox.boundingBox();
    const text = { id: 204, x: rect.x + 5, y: rect.y + 5 };
    const selected = () => page.locator('#gacui-screen span').evaluateAll(nodes => nodes.filter(node => {
        const color = getComputedStyle(node).backgroundColor;
        return node.textContent.length > 0 && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent';
    }).map(node => node.textContent).join(''));
    const before = await selected();
    await send('touchStart', [text]);
    await send('touchMove', [{ ...text, x: text.x + 100, y: text.y + 25 }]);
    await poll(selected).not.toBe(before);
    const firstSelection = await selected();
    await send('touchMove', [{ ...text, x: text.x + 180, y: text.y + 50 }]);
    await poll(selected).not.toBe(firstSelection);
    await send('touchEnd', []);
    // Selection splits text into new spans; inspect the enclosing paragraph.
    const after = await paragraphBox.boundingBox();
    expect(after.y).toBeCloseTo(initialBox.y, 0);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type('TouchKeyboard');
    await expectUI(page.locator('#gacui-screen')).toContainText('TouchKeyboard');
}
