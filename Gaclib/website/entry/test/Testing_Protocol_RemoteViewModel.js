import { expect, test } from 'vitest';
import {
    WEBSITE_URL,
    CORE_AUTOMATION_CONTROLS_URL,
    clickAt,
    describeProtocolTest,
    getLeafTextPositions,
    setupProtocolTest,
    waitForChildProcessExit,
    waitForIdle,
} from './Testing_Protocol.js';

async function findInput(page) {
    const input = await page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (screen === null) return null;
        const candidates = [...screen.querySelectorAll('div')]
            .filter(element => getComputedStyle(element).cursor === 'text')
            .map(element => element.getBoundingClientRect())
            .filter(rect => rect.width > 20 && rect.height > 10)
            .sort((a, b) => b.width * b.height - a.width * a.height);
        const rect = candidates[0];
        return rect === undefined ? null : { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    expect(input).not.toBeNull();
    return input;
}

async function replaceInput(page, value) {
    const input = await findInput(page);
    await clickAt(page, input.x, input.y);
    await page.keyboard.press('Control+A');
    await page.keyboard.type(value);
    await waitForIdle(page);
}

function registerBrowserHostTest(rendererTransport, blockedLoss = false) {
    describeProtocolTest(`Remote view-model browser host ${rendererTransport}${blockedLoss ? " with a pending automation read" : ""}`, () => {
        let connectRequests = 0;
        const ctx = setupProtocolTest({
            serverArguments: ['/RVMT', rendererTransport],
            websiteUrl: `${WEBSITE_URL}?rvmhost`,
            gracefulTeardown: false,
            setupPage(page) {
                page.on('request', request => {
                    if (request.method() === 'GET' && request.url().endsWith('/VlppInterProcess/Connect')) {
                        connectRequests++;
                    }
                });
            },
        });

        test('keeps the host through renderer replacement and reports accepted-host loss exactly', async () => {
            expect(connectRequests).toBeGreaterThanOrEqual(2);
            let positions = await getLeafTextPositions(ctx.page);
            expect(positions.some(position => position.text === 'Hello, !')).toBe(true);

            await replaceInput(ctx.page, 'Alice');

            positions = await getLeafTextPositions(ctx.page);
            expect(positions.some(position => position.text === 'Hello, Alice!')).toBe(true);

            const rejectedHost = await ctx.openPage(`${WEBSITE_URL}?rvmhost`, false);
            await rejectedHost.waitForFunction(() => (document.getElementById('gacui-error-message')?.textContent?.length ?? 0) > 0, undefined, { timeout: 30000 });
            expect(await rejectedHost.evaluate(() => window.__gacui_rvmhost_session !== undefined)).toBe(true);
            await rejectedHost.close();

            const replacement = await ctx.openPage(WEBSITE_URL);
            positions = await getLeafTextPositions(replacement);
            expect(positions.some(position => position.text === 'Hello, Alice!')).toBe(true);
            await replaceInput(replacement, 'Bob');
            positions = await getLeafTextPositions(replacement);
            expect(positions.some(position => position.text === 'Hello, Bob!')).toBe(true);

            if (blockedLoss) {
                const heldRequests = [];
                const controller = new AbortController();
                let readCompleted = false;
                let read;
                let notifyBlocked;
                let blockedTimeout;
                const replyBlocked = new Promise((resolve, reject) => {
                    notifyBlocked = resolve;
                    blockedTimeout = setTimeout(() => reject(new Error('The host RPC reply was not intercepted.')), 10000);
                });
                try {
                    await ctx.page.route('**/VlppInterProcess/{Request,Response}/**', route => {
                        heldRequests.push(route);
                        if (heldRequests.some(item => item.request().url().includes('/Request/'))
                            && heldRequests.some(item => (item.request().postData() ?? '').includes('Hello, BobX!'))) {
                            notifyBlocked();
                        }
                    });
                    const input = await findInput(replacement);
                    await clickAt(replacement, input.x, input.y);
                    await replacement.keyboard.press('End');
                    await replacement.keyboard.type('X');
                    await replyBlocked;

                    // The reply is held, so this read must be queued behind the real RPC call.
                    const controlsUrl = rendererTransport === '/MiniHttp'
                        ? CORE_AUTOMATION_CONTROLS_URL.replace('localhost', '127.0.0.1')
                        : CORE_AUTOMATION_CONTROLS_URL;
                    read = fetch(controlsUrl, { signal: controller.signal }).then(
                        () => { readCompleted = true; },
                        () => { readCompleted = true; },
                    );
                    await new Promise(resolve => setTimeout(resolve, 150));
                    expect(readCompleted).toBe(false);
                    await ctx.page.evaluate(() => window.__gacui_rvmhost_session.host.stop());
                    for (const route of heldRequests) await route.abort();
                    heldRequests.length = 0;
                    await waitForChildProcessExit(ctx.serverProcess, 15000);
                } finally {
                    clearTimeout(blockedTimeout);
                    controller.abort();
                    if (read !== undefined) await read;
                    for (const route of heldRequests) await route.abort().catch(() => {});
                    await ctx.page.unrouteAll({ behavior: 'ignoreErrors' });
                }
            } else {
                await ctx.page.evaluate(() => window.__gacui_rvmhost_session.host.stop());
                const input = await findInput(replacement);
                await clickAt(replacement, input.x, input.y);
                await replacement.keyboard.press('Control+A');
                await replacement.keyboard.type('Charlie');
            }
            await replacement.waitForFunction(() => document.getElementById('gacui-error-message')?.textContent === 'RemotingTest_RvmHost disconnected.', undefined, { timeout: 30000 });
            expect(await replacement.locator('#gacui-error-message').textContent()).toBe('RemotingTest_RvmHost disconnected.');
            const core = ctx.serverProcess;
            await waitForChildProcessExit(core, 30000);
            expect(core.signalCode).toBeNull();
            expect(core.exitCode).not.toBe(0);
        });
    });
}

registerBrowserHostTest('/Http');
registerBrowserHostTest('/MiniHttp');

registerBrowserHostTest('/Http', true);
registerBrowserHostTest('/MiniHttp', true);
