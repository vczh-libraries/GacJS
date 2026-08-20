import { expect, test } from 'vitest';
import {
    WEBSITE_URL,
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

function registerBrowserHostTest(rendererTransport) {
    describeProtocolTest(`Remote view-model browser host ${rendererTransport}`, () => {
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

            await ctx.page.evaluate(() => window.__gacui_rvmhost_session.host.stop());
            const input = await findInput(replacement);
            await clickAt(replacement, input.x, input.y);
            await replacement.keyboard.press('Control+A');
            await replacement.keyboard.type('Charlie');
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
