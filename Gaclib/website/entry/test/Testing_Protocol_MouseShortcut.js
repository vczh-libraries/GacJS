import { test, expect } from 'vitest';
import { IOMouseButton } from '@gaclib/remote-protocol';
import {
    describeProtocolTest,
    setupProtocolTest,
    getLeafTextPositions,
    clickAt,
    waitForIdle,
    observeProtocolEvents
} from './Testing_Protocol.js';

// Covers the shortcut labels and extended-button operations in the GacUI SOP.
for (const app of ['FCT', 'RPT']) {
    describeProtocolTest(`Mouse shortcuts /${app}`, () => {
        const errors = [];
        const outgoing = new WeakMap();
        const ctx = setupProtocolTest({
            serverArguments: [`/${app}`, '/Http'],
            setupPage: async page => {
                page.on('pageerror', error => errors.push(error.message));
                outgoing.set(page, observeProtocolEvents(page));
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
                for (const modifiers of [0, 1, 4, 5, 15]) {
                    for (const [name, button, buttons] of [
                        ['Left', 'left', 1], ['Middle', 'middle', 4], ['Right', 'right', 2],
                        ['Mouse4', 'back', 8], ['Mouse5', 'forward', 16]
                    ]) {
                        const target = (await getLeafTextPositions(page)).find(p =>
                            p.text === 'Click here with any mouse button.' || p.text.endsWith(' button up!'));
                        expect(target).toBeDefined();
                        await page.mouse.move(target.cx, target.cy);
                        const firstEvent = outgoing.get(page).length;
                        page.__idleState.pending = false;
                        await cdp.send('Input.dispatchMouseEvent', {
                            modifiers, type: 'mousePressed', x: target.cx, y: target.cy, button, buttons, clickCount: 1
                        });
                        await waitForIdle(page);
                        await expect.poll(async () => (await getLeafTextPositions(page)).map(p => p.text), {
                            timeout: 15000
                        }).toContain(`${name} button down!`);
                        page.__idleState.pending = false;
                        await cdp.send('Input.dispatchMouseEvent', {
                            modifiers, type: 'mouseReleased', x: target.cx, y: target.cy, button, buttons: 0, clickCount: 1
                        });
                        await waitForIdle(page);
                        await expect.poll(async () => (await getLeafTextPositions(page)).map(p => p.text), {
                            timeout: 15000
                        }).toContain(`${name} button up!`);
                        await expect.poll(async () => (await getLeafTextPositions(page)).map(p => p.text), {
                            timeout: 15000
                        }).toContain(`Alt: ${(modifiers & 1) !== 0 ? 1 : 0}; Super: ${(modifiers & 4) !== 0 ? 1 : 0}`);
                        const actual = outgoing.get(page).slice(firstEvent).filter(event =>
                            event.name === 'IOButtonDown' || event.name === 'IOButtonUp');
                        expect(actual.map(event => event.name)).toEqual(['IOButtonDown', 'IOButtonUp']);
                        for (const event of actual) {
                            expect(event.arguments.button).toBe(IOMouseButton[name]);
                            expect(event.arguments.info).toMatchObject({
                                alt: (modifiers & 1) !== 0, ctrl: (modifiers & 2) !== 0,
                                osSuper: (modifiers & 4) !== 0, shift: (modifiers & 8) !== 0
                            });
                        }
                        expect(page.url()).toBe(url);
                        expect((await getLeafTextPositions(page)).map(p => p.text)).toContain(`${name} button up!`);
                        expect(await page.locator('#gacui-error-mask').isVisible()).toBe(false);
                        expect(await page.locator('#gacui-success-mask').isVisible()).toBe(false);
                    }
                    const target = (await getLeafTextPositions(page)).find(p => p.text.endsWith(' button up!'));
                    expect(target).toBeDefined();
                    const expectedModifiers = {
                        alt: (modifiers & 1) !== 0, ctrl: (modifiers & 2) !== 0,
                        osSuper: (modifiers & 4) !== 0, shift: (modifiers & 8) !== 0
                    };
                    for (const [name, input, payload] of [
                        ['IOMouseMoving', { type: 'mouseMoved', x: target.cx + 1, y: target.cy, button: 'none' }, {}],
                        ['IOVWheel', { type: 'mouseWheel', deltaX: 0, deltaY: -120 }, { wheel: 120 }],
                        ['IOVWheel', { type: 'mouseWheel', deltaX: 0, deltaY: 120 }, { wheel: -120 }],
                        ['IOHWheel', { type: 'mouseWheel', deltaX: -120, deltaY: 0 }, { wheel: 120 }],
                        ['IOHWheel', { type: 'mouseWheel', deltaX: 120, deltaY: 0 }, { wheel: -120 }]
                    ]) {
                        const start = outgoing.get(page).length;
                        await cdp.send('Input.dispatchMouseEvent', {
                            x: target.cx, y: target.cy, modifiers, ...input
                        });
                        await expect.poll(() => outgoing.get(page).slice(start).filter(event => event.name === name), {
                            timeout: 15000
                        }).toHaveLength(1);
                        const event = outgoing.get(page).slice(start).find(event => event.name === name);
                        expect(event.arguments).toMatchObject({ ...expectedModifiers, ...payload });
                        await expect.poll(async () => (await getLeafTextPositions(page)).map(p => p.text), {
                            timeout: 15000
                        }).toContain(`Alt: ${expectedModifiers.alt ? 1 : 0}; Super: ${expectedModifiers.osSuper ? 1 : 0}`);
                    }
                    for (const [button, buttons, name] of [
                        ['left', 1, 'Left'], ['middle', 4, 'Middle'], ['right', 2, 'Right'],
                        ['back', 8, 'Mouse4'], ['forward', 16, 'Mouse5']
                    ]) {
                        const start = outgoing.get(page).length;
                        await cdp.send('Input.dispatchMouseEvent', {
                            modifiers, type: 'mousePressed', x: target.cx, y: target.cy, button, buttons, clickCount: 2
                        });
                        await cdp.send('Input.dispatchMouseEvent', {
                            modifiers, type: 'mouseReleased', x: target.cx, y: target.cy, button, buttons: 0, clickCount: 2
                        });
                        await expect.poll(() => outgoing.get(page).slice(start).filter(event => event.name === 'IOButtonDoubleClick'), {
                            timeout: 15000
                        }).toHaveLength(1);
                        const event = outgoing.get(page).slice(start).find(event => event.name === 'IOButtonDoubleClick');
                        expect(event.arguments).toMatchObject({ button: IOMouseButton[name], info: expectedModifiers });
                        await expect.poll(async () => (await getLeafTextPositions(page)).map(p => p.text), {
                            timeout: 15000
                        }).toContain(`${name} button up!`);
                    }
                }
                await cdp.detach();
            }
            expect(errors).toEqual([]);
        });
    });
}
