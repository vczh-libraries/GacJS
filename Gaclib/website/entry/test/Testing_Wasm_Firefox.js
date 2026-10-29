import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { firefox, expect as expectUI } from '@playwright/test';
import { clickAt, getLeafTextPositions, setupIdleTracking, waitUntilIdle } from './Testing_Protocol.js';
import { observeWasm, checkLocalServices, touchDriver, checkTouching, checkTouchingList, checkOrdinaryTouch } from './WasmTouching.js';

let browser;
let page;
let errors;

beforeAll(async () => { browser = await firefox.launch({ headless: true }); });
afterEach(async () => {
    await page?.close();
    expect(errors).toEqual([]);
});
afterAll(async () => { await browser?.close(); });

async function clickText(text) {
    const element = await page.locator('#gacui-screen').getByText(text, { exact: true }).first().elementHandle();
    expect(element).not.toBeNull();
    await element.waitForElementState('stable');
    let target;
    await expect.poll(async () => {
        target = (await getLeafTextPositions(page)).find(position => position.text === text && position.width > 0 && position.height > 0);
        return target;
    }).toBeDefined();
    await clickAt(page, target.cx, target.cy);
}

async function ready(title) {
    await expectUI(page.locator('#gacui-screen')).toContainText(title, { timeout: 60000 });
    await waitUntilIdle(page, 60000);
    await checkLocalServices(page);
    expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
    await expectUI(page.locator('#gacui-error-mask')).not.toBeVisible();
    await expectUI(page.getByRole('button', { name: 'Reload', exact: true })).toBeDisabled();
    // Firefox omits worker fetches from page request events. Inspect the workers
    // and their resource timing entries without replacing the actual modules.
    const workers = page.workers();
    expect(workers.some(worker => worker.url().endsWith('/app.worker.js'))).toBe(true);
    const resources = (await Promise.all(workers.map(worker => worker.evaluate(() =>
        performance.getEntriesByType('resource').map(resource => resource.name))))).flat();
    for (const artifact of ['app.mjs', 'app.wasm']) {
        expect(resources.some(url => url.endsWith(`/${artifact}`)), artifact).toBe(true);
    }
}

async function exercise(app, marker) {
    if (app === 'fct') {
        await clickText('List');
        await clickText('Add 10 items');
        await expect.poll(async () => (await getLeafTextPositions(page)).filter(position => position.text === '0').length).toBe(2);
        await clickText('Misc');
        await clickText('Raw Clock');
        await page.waitForFunction(() => {
            const clock = window.__gacui_wasm_session.renderer.getRawElements().find(raw => raw.id === 'FullControlTest.Clock');
            const canvas = clock?.element.querySelector('canvas');
            return canvas !== null && canvas !== undefined && canvas.width > 0 && canvas.height > 0
                && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value !== 0);
        });
        const first = await page.evaluate(() => {
            const clock = window.__gacui_wasm_session.renderer.getRawElements().find(raw => raw.id === 'FullControlTest.Clock');
            return { data: clock.data, pixels: clock.element.querySelector('canvas').toDataURL() };
        });
        await page.waitForFunction(first => {
            const clock = window.__gacui_wasm_session.renderer.getRawElements().find(raw => raw.id === 'FullControlTest.Clock');
            return clock.data !== first.data && clock.element.querySelector('canvas').toDataURL() !== first.pixels;
        }, first);
        await expectUI(page.locator('#gacui-screen canvas')).toHaveCount(1);
        const send = await touchDriver(page, false);
        await checkTouching(page, send, false);
        await checkTouchingList(page, send);
        await checkOrdinaryTouch(page, send);
    } else if (app === 'rpt') {
        await expectUI(page.locator('#gacui-screen')).toContainText('Click Me!');
        await clickText('Click Me!');
        await expectUI(page.locator('#gacui-screen')).toContainText('You have clicked!');
    } else {
        await expectUI(page.locator('#gacui-screen')).toContainText('Hello, !');
        const point = await page.locator('#gacui-screen div').evaluateAll(nodes => {
            const rectangles = nodes.filter(node => getComputedStyle(node).cursor === 'text')
                .map(node => node.getBoundingClientRect()).filter(rect => rect.width > 20 && rect.height > 10)
                .sort((a, b) => b.width * b.height - a.width * a.height);
            const rect = rectangles[0];
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        });
        await clickAt(page, point.x, point.y);
        await page.keyboard.type(marker);
        await expectUI(page.locator('#gacui-screen')).toContainText(`Hello, ${marker}!`);
        // Firefox has no CDP; inject Unicode keyboard events into the real input surface.
        for (const key of '你好') {
            await page.evaluate(key => {
                const screen = document.getElementById('gacui-screen');
                for (const type of ['keydown', 'keyup']) screen.dispatchEvent(new KeyboardEvent(type, { key, code: 'KeyA', keyCode: 65, bubbles: true }));
            }, key);
        }
        await expectUI(page.locator('#gacui-screen')).toContainText(`Hello, ${marker}你好!`);
    }
}

test.each([
    ['fct', 'Complete Control Showcase'],
    ['rpt', 'Remote Protocol Test'],
    ['rvmt', 'Remote View Model Test'],
])('Firefox Wasm %s loads pthreads, accepts input and shuts down/reloads', async (app, title) => {
    errors = [];
    page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await setupIdleTracking(page);
    await observeWasm(page);
    await page.goto(`http://127.0.0.1:8896/wasm-${app}/`);
    await ready(title);
    await exercise(app, 'FirefoxRPC');
    for (const shutdown of ['Exit', 'Force Exit']) {
        await page.getByRole('button', { name: shutdown, exact: true }).click();
        if (app === 'rpt' && shutdown === 'Exit') {
            await expectUI(page.locator('#gacui-screen')).toContainText('Do you want to exit?');
            await clickText('Cancel');
            await expectUI(page.getByRole('button', { name: 'Reload', exact: true })).toBeDisabled();
            await page.getByRole('button', { name: shutdown, exact: true }).click();
            await clickText('OK');
        }
        await expectUI(page.locator('#gacui-success-mask')).toBeVisible();
        await checkLocalServices(page);
        expect(await page.evaluate(() => window.__gacui_wasm_session.application.completion)).toBe(0);
        await expect.poll(() => page.workers().length).toBe(0);
        await expectUI(page.getByRole('button', { name: 'Reload', exact: true })).toBeEnabled();
        page.__idleState.pending = false;
        await Promise.all([
            page.waitForEvent('domcontentloaded'),
            page.getByRole('button', { name: 'Reload', exact: true }).click(),
        ]);
        await ready(title);
        await exercise(app, `Reload${shutdown.replaceAll(' ', '')}`);
    }
    await page.getByRole('button', { name: 'Force Exit', exact: true }).click();
    await expectUI(page.locator('#gacui-success-mask')).toBeVisible();
    await expect.poll(() => page.workers().length).toBe(0);
});
