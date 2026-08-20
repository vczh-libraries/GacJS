import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { expect, test } from 'vitest';
import {
    GACLIB_ROOT,
    WEBSITE_URL,
    clickAt,
    describeProtocolTest,
    getLeafTextPositions,
    setupProtocolTest,
    waitForChildOutputLine,
    waitForChildProcessExit,
    waitForIdle,
} from './Testing_Protocol.js';

async function inputPosition(page) {
    const position = await page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (screen === null) return null;
        const rectangles = [...screen.querySelectorAll('div')]
            .filter(element => getComputedStyle(element).cursor === 'text')
            .map(element => element.getBoundingClientRect())
            .filter(rect => rect.width > 20 && rect.height > 10)
            .sort((a, b) => b.width * b.height - a.width * a.height);
        const rect = rectangles[0];
        return rect === undefined ? null : { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    expect(position).not.toBeNull();
    return position;
}

function registerNetworkHostTest(rendererTransport) {
    describeProtocolTest(`Remote view-model independent Node host ${rendererTransport}`, () => {
        let host = null;
        const ctx = setupProtocolTest({
            serverArguments: ['/RVMT', rendererTransport],
            websiteUrl: WEBSITE_URL,
            gracefulTeardown: false,
            async startupReadiness() {
                host = spawn(process.execPath, [path.join(GACLIB_ROOT, 'website', 'rvmhost', 'lib', 'src', 'cli.js')], {
                    cwd: path.join(GACLIB_ROOT, 'website', 'rvmhost'),
                    stdio: ['ignore', 'pipe', 'pipe'],
                    windowsHide: true,
                });
                await waitForChildOutputLine(host, 'GACJS_RVMHOST_READY');
            },
            async cleanupChildProcesses() {
                if (host !== null && host.exitCode === null && host.signalCode === null) host.kill();
                if (host !== null) await waitForChildProcessExit(host).catch(() => undefined);
                host = null;
            },
        });

        test('serves Translate and exposes accepted-host loss without retry', async () => {
            let positions = await getLeafTextPositions(ctx.page);
            expect(positions.some(position => position.text === 'Hello, !')).toBe(true);
            const input = await inputPosition(ctx.page);
            await clickAt(ctx.page, input.x, input.y);
            await ctx.page.keyboard.type('Alice');
            await waitForIdle(ctx.page);
            positions = await getLeafTextPositions(ctx.page);
            expect(positions.some(position => position.text === 'Hello, Alice!')).toBe(true);

            host.kill();
            await waitForChildProcessExit(host);
            await clickAt(ctx.page, input.x, input.y);
            await ctx.page.keyboard.press('Control+A');
            await ctx.page.keyboard.type('Bob');
            await ctx.page.waitForFunction(() => document.getElementById('gacui-error-message')?.textContent === 'RemotingTest_RvmHost disconnected.', undefined, { timeout: 30000 });
            expect(await ctx.page.locator('#gacui-error-message').textContent()).toBe('RemotingTest_RvmHost disconnected.');
            const core = ctx.serverProcess;
            await waitForChildProcessExit(core, 30000);
            expect(core.signalCode).toBeNull();
            expect(core.exitCode).not.toBe(0);
        });
    });
}

registerNetworkHostTest('/Http');
registerNetworkHostTest('/MiniHttp');
