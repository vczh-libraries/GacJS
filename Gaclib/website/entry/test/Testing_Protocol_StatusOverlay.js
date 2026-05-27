// Testing_Protocol_StatusOverlay.js
//
// Verifies that terminal status masks show messages in-page without browser alerts.

import { test, expect } from 'vitest';
import {
    getLeafTextPositions,
    setupProtocolTest,
    describeProtocolTest
} from './Testing_Protocol.js';

describeProtocolTest('StatusOverlay', () => {
    const dialogMessages = [];
    const ctx = setupProtocolTest('/RPT /Http');

    test('Server error is shown on the red cross mask without alerting', async () => {
        ctx.page.on('dialog', dialog => {
            dialogMessages.push(dialog.message());
        });

        const positions = await getLeafTextPositions(ctx.page);
        const fatalErrorPos = positions.find(p => p.text === 'Fatel Error');
        expect(fatalErrorPos).toBeDefined();

        await ctx.page.mouse.click(fatalErrorPos.cx, fatalErrorPos.cy);
        await ctx.page.waitForSelector('#gacui-error-mask.visible', { timeout: 5000 });

        const maskState = await ctx.page.evaluate(() => {
            const errorMask = document.getElementById('gacui-error-mask');
            const errorMessage = document.getElementById('gacui-error-message');
            return {
                message: errorMessage !== null ? errorMessage.textContent : null,
                visible: errorMask !== null ? errorMask.classList.contains('visible') : false,
            };
        });

        expect(dialogMessages).toEqual([]);
        expect(maskState.visible).toBe(true);
        expect(maskState.message).toBe('This is a fatel error!');
    });
});
