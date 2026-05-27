// Testing_Protocol_SimpleTyping.js
//
// Vitest test suite that verifies basic UI rendering and interaction
// with the GacUI remote protocol.
//
// Test plan (the goal of the test plan cannot be changed):
//   1. Launch the application (start the C++ server, open index.html in Playwright).
//   2. Open the "Control" tab, find the text box next to the "Search:" label.
//   3. Type text into the text box. Typing is implemented by sending IOChar messages.
//      The client sends IOChar events and the core side judges which text box is active.
//   4. Verify that the typed text appears in the text box.
//   5. Kill the process directly and close the webpage. No elegant exit is needed.

import { test, expect } from 'vitest';
import {
    getLeafTextPositions,
    clickAt,
    waitForIdle,
    setupProtocolTest,
    describeProtocolTest
} from './Testing_Protocol.js';

// ---------------------------------------------------------------------------
// Helpers (unique to this test)
// ---------------------------------------------------------------------------

async function getLeafTexts(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) return [];
        const texts = [];
        for (const d of screen.querySelectorAll('div')) {
            if (d.childElementCount === 0 && d.textContent.trim() !== '') {
                texts.push(d.textContent.trim());
            }
        }
        return texts;
    });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describeProtocolTest('SimpleTyping', () => {
    const ctx = setupProtocolTest();
    let searchLabelPos;

    test('Step 1: Page rendering', async () => {
        const initial = await getLeafTexts(ctx.page);
        expect(initial.length).toBeGreaterThanOrEqual(20);
    });

    test('Step 2: Open the Control tab', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        const controlTabPos = positions.find(p => p.text === 'Control');
        expect(controlTabPos).toBeDefined();

        await clickAt(ctx.page, controlTabPos.cx, controlTabPos.cy);

        const afterControl = await getLeafTexts(ctx.page);
        const hasExpectedContent =
            afterControl.some(t => t.startsWith('Search')) ||
            afterControl.includes('Document Editor (Ribbon)') ||
            afterControl.includes('TextBox');
        expect(hasExpectedContent).toBe(true);
    });

    test('Step 3: Find and click the text box next to "Search:"', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        searchLabelPos = positions.find(p => p.text.startsWith('Search'));
        expect(searchLabelPos).toBeDefined();

        await clickAt(ctx.page, searchLabelPos.right + 30, searchLabelPos.cy);
    });

    test('Step 4: Type text', async () => {
        expect(searchLabelPos).toBeDefined();
        await clickAt(ctx.page, searchLabelPos.right + 30, searchLabelPos.cy);

        for (const ch of 'Hello') {
            await ctx.page.keyboard.press(ch);
            await waitForIdle(ctx.page);
        }
    });

    test('Step 5: Verify typed text', async () => {
        const screenText = await ctx.page.evaluate(() => {
            const screen = document.getElementById('gacui-screen');
            return screen !== null ? screen.textContent : '';
        });
        expect(screenText).toContain('Hello');
    });
});
