import { expect, test } from 'vitest';
import { chromium, firefox, expect as expectUI } from '@playwright/test';
import { setupIdleTracking, waitUntilIdle } from './Testing_Protocol.js';
import { observeWasm, rawData, poll, select, touchDriver, checkTouching, checkTouchingList, checkOrdinaryTouch } from './WasmTouching.js';

const url = process.env.GACUI_PUBLIC_DEMO_URL;
for (const [name, engine] of [['Chromium', chromium], ['Firefox', firefox]]) {
    test.skipIf(url === undefined)(`${name} public Wasm launcher, service worker, raw pages and refresh`, async () => {
        const browser = await engine.launch({ headless: true });
        const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
        const page = await context.newPage();
        const errors = [], missing = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('response', response => { if (response.status() >= 400) missing.push(`${response.status()} ${response.url()}`); });
        await setupIdleTracking(page);
        await observeWasm(page);
        const ready = async () => {
            await expectUI(page.locator('#gacui-screen')).toContainText('Complete Control Showcase', { timeout: 120000 });
            await waitUntilIdle(page, 60000);
            expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
            expect(await page.evaluate(() => new URL(navigator.serviceWorker.controller.scriptURL).pathname)).toBe('/wasm-fct/service-worker.js');
            await expectUI(page.locator('#gacui-loading')).toBeHidden();
            await expectUI(page.locator('#gacui-error-mask')).not.toBeVisible();
            await expectUI(page.getByRole('button', { name: 'Reload', exact: true })).toHaveCount(0);
            expect(page.workers().some(worker => worker.url().endsWith('/wasm-worker.js'))).toBe(true);
            expect(page.workers().some(worker => worker.url().endsWith('/app.worker.js'))).toBe(true);
            const progress = await page.locator('#gacui-progress').evaluate(node => ({ value: node.value, max: node.max }));
            expect(progress.value).toBe(progress.max);
            expect(progress.max).toBeGreaterThan(1000000);
        };
        const clock = async () => {
            await select(page, 'Misc'); await select(page, 'Raw Clock');
            await expectUI(page.locator('#gacui-screen canvas')).toHaveCount(1);
            await poll(() => rawData(page, 'FullControlTest.Clock')).toMatch(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/u);
            const data = await rawData(page, 'FullControlTest.Clock');
            const pixels = await page.locator('canvas').evaluate(canvas => canvas.toDataURL());
            await poll(() => rawData(page, 'FullControlTest.Clock')).not.toBe(data);
            await poll(() => page.locator('canvas').evaluate(canvas => canvas.toDataURL())).not.toBe(pixels);
            await select(page, 'Elements');
            await expectUI(page.locator('#gacui-screen canvas')).toHaveCount(0);
            await select(page, 'Raw Clock');
            await expectUI(page.locator('#gacui-screen canvas')).toHaveCount(1);
        };
        try {
            if (process.env.GACUI_PUBLIC_HOME !== undefined) {
                await page.goto(process.env.GACUI_PUBLIC_HOME);
                await page.locator('#tab-html5').click();
                const link = page.getByRole('link', { name: 'Start WASM Now!', exact: true });
                expect(new URL(await link.getAttribute('href'), page.url()).href).toBe(url);
                // Follow the actual destination in this fresh browser context.
                await page.goto(new URL(await link.getAttribute('href'), page.url()).href);
            } else await page.goto(url);
            await ready();
            for (const shutdown of ['Exit', 'Force Exit']) {
                await clock();
                const send = await touchDriver(page, name === 'Chromium');
                await checkTouching(page, send, name === 'Chromium');
                await checkTouchingList(page, send);
                await checkOrdinaryTouch(page, send);
                await select(page, 'Window Manager'); await select(page, 'Aurora');
                await clock();
                await page.getByRole('button', { name: shutdown, exact: true }).click();
                await expectUI(page.locator('#gacui-success-mask')).toBeVisible();
                await poll(() => page.workers().length).toBe(0);
                expect(await page.evaluate(() => window.__rawObservers.size)).toBe(0);
                page.__idleState.pending = false;
                await page.reload();
                await ready();
            }
            await clock();
            await page.close();
            await poll(() => context.pages().length).toBe(0);
            expect(errors).toEqual([]);
            expect(missing).toEqual([]);
        } finally { await browser.close(); }
    }, 240000);
}
