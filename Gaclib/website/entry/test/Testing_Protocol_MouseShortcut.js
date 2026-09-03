import { test, expect } from 'vitest';
import {
    describeProtocolTest,
    setupProtocolTest,
    getLeafTextPositions,
    clickAt,
    waitForIdle
} from './Testing_Protocol.js';

// Covers the shortcut labels and extended-button operations in the GacUI SOP.
for (const app of ['FCT', 'RPT']) {
    describeProtocolTest(`Mouse shortcuts /${app}`, () => {
        const errors = [];
        const ctx = setupProtocolTest({
            serverArguments: [`/${app}`, '/Http'],
            setupPage: async page => {
                page.on('pageerror', error => errors.push(error.message));
            }
        });

        test('keeps localized labels and consumes browser history buttons after renderer replacement', async () => {
            for (let connection = 0; connection < 2; connection++) {
                const page = connection === 0 ? ctx.page : await ctx.openPage();
                const tab = (await getLeafTextPositions(page)).find(p => p.text === (app === 'FCT' ? 'Window Manager' : 'Home'));
                expect(tab).toBeDefined();
                await clickAt(page, tab.cx, tab.cy);
                const texts = (await getLeafTextPositions(page)).map(p => p.text);
                expect(texts).toContain('Ctrl+Q');
                expect(texts).toContain('Ctrl+Alt+Win+Q');
                expect(texts).toContain('{Ctrl+Shift+Alt+Win+Q}');
                expect(texts.some(text => text.includes('osSuper'))).toBe(false);

                const url = page.url();
                await page.evaluate(() => {
                    history.pushState(null, '', '?mouse-forward-target');
                    history.back();
                });
                await page.waitForURL(url);
                const cdp = await page.context().newCDPSession(page);
                for (const [name, button, buttons] of [['Mouse4', 'back', 8], ['Mouse5', 'forward', 16]]) {
                    const target = (await getLeafTextPositions(page)).find(p =>
                        p.text === 'Click here with any mouse button.' || p.text.endsWith(' button up!'));
                    expect(target).toBeDefined();
                    await page.mouse.move(target.cx, target.cy);
                    page.__idleState.pending = false;
                    await cdp.send('Input.dispatchMouseEvent', {
                        type: 'mousePressed', x: target.cx, y: target.cy, button, buttons, clickCount: 1
                    });
                    await waitForIdle(page);
                    expect((await getLeafTextPositions(page)).map(p => p.text)).toContain(`${name} button down!`);
                    page.__idleState.pending = false;
                    await cdp.send('Input.dispatchMouseEvent', {
                        type: 'mouseReleased', x: target.cx, y: target.cy, button, buttons: 0, clickCount: 1
                    });
                    await waitForIdle(page);
                    expect(page.url()).toBe(url);
                    expect((await getLeafTextPositions(page)).map(p => p.text)).toContain(`${name} button up!`);
                    expect(await page.locator('#gacui-error-mask').isVisible()).toBe(false);
                    expect(await page.locator('#gacui-success-mask').isVisible()).toBe(false);
                }
                await cdp.detach();
            }
            expect(errors).toEqual([]);
        });
    });
}
