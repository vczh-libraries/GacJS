import { test, expect } from 'vitest';
import { clickAt, describeProtocolTest, getLeafTextPositions, setupProtocolTest, observeProtocolEvents,
    CORE_AUTOMATION_CONTROLS_URL } from './Testing_Protocol.js';

function findRaw(value, id) {
    if (value === null || typeof value !== 'object') return undefined;
    if (value.elementId === id) return value;
    for (const child of Object.values(value)) {
        const found = findRaw(child, id);
        if (found !== undefined) return found;
    }
}

async function raw(id = 'FullControlTest.Touching') {
    return findRaw(await (await fetch(CORE_AUTOMATION_CONTROLS_URL)).json(), id);
}
async function state() {
    const element = await raw();
    if (element === undefined) throw new Error('Touching raw element is missing from Core.');
    return element.elementData.split(',').map(Number);
}
const poll = callback => expect.poll(callback, { timeout: 30000 });
async function select(page, text) {
    await poll(async () => {
        const position = (await getLeafTextPositions(page)).find(p => p.text === text);
        if (position === undefined) return false;
        await clickAt(page, position.cx, position.cy);
        return text === 'Misc'
            ? (await getLeafTextPositions(page)).some(p => p.text === 'Touching')
            : (await raw()) !== undefined;
    }).toBe(true);
}

for (const transport of ['/Http', '/MiniHttp']) describeProtocolTest('Touching browser acquisition ' + transport, () => {
    const errors = [];
    const ctx = setupProtocolTest({ serverArguments: ['/FCT', transport],
        setupPage: async page => { page.on('pageerror', error => errors.push(error.message)); } });
    test('translates, scales, pauses, rebases, cancels and falls back once through the live Core', async () => {
        const page = ctx.page;
        await select(page, 'Misc');
        await select(page, 'Touching');
        const canvas = page.locator('#gacui-screen canvas');
        await canvas.waitFor();
        const bounds = await canvas.boundingBox();
        await page.mouse.move(1, 1);
        const events = observeProtocolEvents(page);
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
        const send = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
        let a = { id: 10, x: bounds.x + 140, y: bounds.y + 120, radiusX: 6, radiusY: 8, force: 0.7 };
        let b = { id: 20, x: bounds.x + 140, y: bounds.y + 40 };
        let c = { id: 30, x: bounds.x + 90, y: bounds.y + 100 };
        const initial = await state();
        await send('touchStart', [a]);
        await poll(async () => (await state())[4]).toBe(1);
        a = { ...a, x: a.x + 30, y: a.y + 20 };
        await send('touchMove', [a]);
        await poll(async () => (await state()).slice(0,2)).toEqual([initial[0]+30,initial[1]+20]);
        b = { ...b, y: a.y, x: a.x + 100 };
        await send('touchStart', [a,b]);
        await poll(async () => (await state())[4]).toBe(2);
        b = { ...b, x: a.x, y: a.y + 160 };
        await send('touchMove', [a,b]);
        await poll(async () => (await state())[3]).toBeCloseTo(1.6, 2);
        const transformed = (await state()).slice(0,4);
        await send('touchStart', [a,b,c]);
        await poll(async () => (await state())[4]).toBe(3);
        c = { ...c, x: c.x + 20 };
        await send('touchMove', [a,b,c]);
        await poll(async () => (await state()).slice(0,4)).toEqual(transformed);
        await send('touchEnd', [c]);
        await poll(async () => (await state())[4]).toBe(2);
        expect((await state()).slice(0,4)).toEqual(transformed);
        a = {...a, x:a.x+10}; b = {...b, x:b.x+10};
        await send('touchMove', [a,b]);
        await poll(async () => (await state())[0]).toBeCloseTo(transformed[0]+10, 2);
        await send('touchEnd', []);
        await poll(async () => (await state())[4]).toBe(0);
        const picture = () => canvas.evaluate(element => {
            const bytes = element.getContext('2d').getImageData(0,0,element.width,element.height).data;
            let sky = 0, yellow = 0;
            for (let i=0; i<bytes.length; i+=4) {
                if (bytes[i] === 135 && bytes[i+1] === 206 && bytes[i+2] === 235) sky++;
                if (bytes[i] === 255 && bytes[i+1] === 255 && bytes[i+2] === 0) yellow++;
            }
            return { sky, yellow };
        });
        await poll(async () => (await picture()).sky).toBeGreaterThan(1000);
        await poll(async () => (await picture()).yellow).toBe(0);
        const pointEvents = events.filter(e => e.name.startsWith('IOPoint'));
        expect(pointEvents.filter(e => e.name === 'IOPointStarted')).toHaveLength(1);
        expect(pointEvents.filter(e => e.name === 'IOPointEnded')).toHaveLength(1);
        expect(pointEvents.map(e => e.arguments.eventIndex)).toEqual(pointEvents.map((_e,i) => i));
        expect(events.filter(e => /^IOButton|^IOMouse/.test(e.name))).toEqual([]);
        await send('touchStart', [a]);
        await poll(async () => (await state())[4]).toBe(1);
        await poll(async () => (await picture()).yellow).toBeGreaterThan(20);
        await send('touchCancel', []);
        await poll(async () => (await state())[4]).toBe(0);
        expect(events.filter(e => e.name === 'IOPointEnded').at(-1).arguments.reason).toBe('Canceled_PlatformCanceled');
        const tab = (await getLeafTextPositions(page)).find(p => p.text === 'Raw Clock');
        const finger = { id: 40, x: tab.cx, y: tab.cy };
        await send('touchStart', [finger]);
        await send('touchEnd', []);
        await poll(async () => (await raw('FullControlTest.Clock')) !== undefined).toBe(true);
        expect(events.filter(e => /^IOButton/.test(e.name))).toEqual([]);
        await select(page, 'Touching'); // Independent physical mouse path still works.
        await poll(async () => (await raw()) !== undefined).toBe(true);
        expect(errors).toEqual([]);
    });
});
