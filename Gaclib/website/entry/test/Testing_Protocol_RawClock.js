import { test, expect } from 'vitest';
import {
    clickAt,
    describeProtocolTest,
    getLeafTextPositions,
    setupProtocolTest,
    waitForIdle,
} from './Testing_Protocol.js';

// The portable RawElements suite verifies fixed protocol data and DOM ownership.
// This suite additionally checks a compatible native FCT Core driving the page.
describeProtocolTest('FullControlTest Raw Clock', () => {
    const errors = [];
    const ctx = setupProtocolTest({
        setupPage: async page => { page.on('pageerror', error => errors.push(error.message)); },
    });

    test('draws received times, ticks without input, and retains its canvas across hide/show', async () => {
        const miscTab = (await getLeafTextPositions(ctx.page)).find(position => position.text === 'Misc');
        expect(miscTab).toBeDefined();
        await clickAt(ctx.page, miscTab.cx, miscTab.cy);
        const positions = await getLeafTextPositions(ctx.page);
        const clockTab = positions.find(position => position.text === 'Raw Clock');
        expect(clockTab, 'The prebuilt Core must include the Raw Clock prerequisite').toBeDefined();
        await clickAt(ctx.page, clockTab.cx, clockTab.cy);
        await ctx.page.waitForFunction(() => {
            const canvas = document.querySelector('#gacui-screen canvas');
            if (canvas === null || canvas.width === 0 || canvas.height === 0) return false;
            const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            for (let i = 0; i < pixels.length; i += 4) {
                if (pixels[i] === 255 && pixels[i + 1] === 255 && pixels[i + 2] === 0 && pixels[i + 3] === 255) {
                    window.__rawClockCanvas = canvas;
                    window.__rawClockPicture = canvas.toDataURL();
                    return true;
                }
            }
            return false;
        });
        await expect.poll(async () => {
            await waitForIdle(ctx.page);
            return ctx.page.evaluate(() => window.__rawClockCanvas.toDataURL() !== window.__rawClockPicture);
        }, { timeout: 15000 }).toBe(true);

        const elementsTab = (await getLeafTextPositions(ctx.page)).find(position => position.text === 'Elements');
        expect(elementsTab).toBeDefined();
        await clickAt(ctx.page, elementsTab.cx, elementsTab.cy);
        await ctx.page.waitForFunction(() => !window.__rawClockCanvas.isConnected);
        expect(await ctx.page.evaluate(() => window.__rawClockCanvas.isConnected)).toBe(false);
        const returnTab = (await getLeafTextPositions(ctx.page)).find(position => position.text === 'Raw Clock');
        expect(returnTab).toBeDefined();
        await clickAt(ctx.page, returnTab.cx, returnTab.cy);
        await ctx.page.waitForFunction(() => window.__rawClockCanvas.isConnected);
        expect(await ctx.page.evaluate(() => {
            const canvases = document.querySelectorAll('#gacui-screen canvas');
            return canvases.length === 1 && canvases[0] === window.__rawClockCanvas;
        })).toBe(true);
        expect(errors).toEqual([]);
    });
});
