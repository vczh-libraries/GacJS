import { test, expect } from 'vitest';
import {
    clickAt,
    describeProtocolTest,
    getLeafTextPositions,
    setupProtocolTest,
} from './Testing_Protocol.js';

// The portable RawElements suite verifies fixed protocol data and DOM ownership.
// This suite additionally checks a compatible native FCT Core driving the page.
describeProtocolTest('FullControlTest Raw Clock', () => {
    const errors = [];
    const ctx = setupProtocolTest({
        setupPage: async page => {
            page.on('pageerror', error => errors.push(error.message));
            await page.addInitScript(() => {
                const stroke = CanvasRenderingContext2D.prototype.stroke;
                CanvasRenderingContext2D.prototype.stroke = function (...args) {
                    const result = stroke.apply(this, args);
                    this.canvas.__clockStrokes = (this.canvas.__clockStrokes ?? 0) + 1;
                    this.canvas.dispatchEvent(new Event('clock-stroke'));
                    return result;
                };
            });
        },
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
            return canvas !== null && canvas.width > 0 && canvas.__clockStrokes >= 16;
        });

        const drawing = await ctx.page.evaluate(async () => {
            const canvas = document.querySelector('#gacui-screen canvas');
            window.__rawClockCanvas = canvas;
            const before = canvas.toDataURL();
            const context = canvas.getContext('2d');
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            const hasDrawing = pixels.some((value, index) => index % 4 === 3 && value !== 0);
            const strokes = canvas.__clockStrokes;
            await new Promise(resolve => {
                const onStroke = () => {
                    // The painter completes one face and fifteen lines per draw.
                    if (canvas.__clockStrokes < strokes + 16 || canvas.__clockStrokes % 16 !== 0 || canvas.toDataURL() === before) return;
                    canvas.removeEventListener('clock-stroke', onStroke);
                    resolve();
                };
                canvas.addEventListener('clock-stroke', onStroke);
            });
            return { hasDrawing, changed: canvas.toDataURL() !== before };
        });
        expect(drawing).toEqual({ hasDrawing: true, changed: true });

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
