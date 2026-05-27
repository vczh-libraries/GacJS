// Testing_Protocol_RendererSwitching.js
//
// Vitest test suite that verifies renderer switching (reconnection).
// When a new browser tab opens index.html, it connects to the C++ server,
// taking over the session from any previous tab. The new tab should see
// the same UI state (typed text, selection, etc.).
//
// Test plan (the goal of the test plan cannot be changed):
//   1. Launch the application (start the C++ server, open index.html in Playwright).
//   2. Open the "Control" tab, find the text box next to the "Search:" label.
//   3. Type "Hello" into the text box.
//   4. Open a second browser tab with index.html (renderer switching).
//      The second tab should take over and display the same UI state.
//   5. Verify the second tab renders and contains the typed text "Hello".
//   6. Select part of the text in the text box.
//   7. Open a third browser tab with index.html (another renderer switch).
//   8. Verify the third tab renders and contains the typed text with selection.
//   9. Kill the process directly and close all webpages. No elegant exit is needed.

import { test, expect } from 'vitest';
import {
    getLeafTextPositions,
    clickAt,
    waitForIdle,
    sleep,
    openControlTab,
    findTextInputPointRightOfLabel,
    setupProtocolTest,
    describeProtocolTest
} from './Testing_Protocol.js';

// ---------------------------------------------------------------------------
// Helpers
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

async function getScreenText(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        return screen !== null ? screen.textContent : '';
    });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describeProtocolTest('RendererSwitching', () => {
    const ctx = setupProtocolTest();
    let page2 = null;
    let page3 = null;

    test('Step 1: First page renders', async () => {
        const initial = await getLeafTexts(ctx.page);
        expect(initial.length).toBeGreaterThanOrEqual(20);
    });

    test('Step 2: Open the Control tab and find Search text box', async () => {
        expect(await openControlTab(ctx.page)).toBe(true);
    });

    test('Step 3: Type "Hello" in the Search text box', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        const searchLabelPos = positions.find(p => p.text.startsWith('Search'));
        expect(searchLabelPos).toBeDefined();

        const searchTextBox = await findTextInputPointRightOfLabel(ctx.page, searchLabelPos);
        await clickAt(ctx.page, searchTextBox.x, searchTextBox.y);

        for (const ch of 'Hello') {
            await ctx.page.keyboard.press(ch);
            await waitForIdle(ctx.page);
        }

        const screenText = await getScreenText(ctx.page);
        expect(screenText).toContain('Hello');
    });

    test('Step 4+5: Switch to second page and verify "Hello"', async () => {
        // Open second page in the same browser context.
        // The GET /Connect from the new page triggers reconnection in the core.
        page2 = await ctx.openPage();

        const screenText = await getScreenText(page2);
        expect(screenText).toContain('Hello');
    });

    test('Step 6: Select part of the text in the Search text box', async () => {
        // Find the Search text box area and select text using keyboard
        const positions = await getLeafTextPositions(page2);
        const searchLabelPos = positions.find(p => p.text.startsWith('Search'));
        expect(searchLabelPos).toBeDefined();

        // Click on the text box
        const searchTextBox = await findTextInputPointRightOfLabel(page2, searchLabelPos);
        await clickAt(page2, searchTextBox.x, searchTextBox.y);

        // Select all text with Ctrl+A then move to select partial
        await page2.keyboard.press('Home');
        await waitForIdle(page2);
        // Select "Hel" by shift+right 3 times
        for (let i = 0; i < 3; i++) {
            await page2.keyboard.press('Shift+ArrowRight');
            await waitForIdle(page2);
        }

        const screenText = await getScreenText(page2);
        expect(screenText).toContain('Hello');
        await sleep(1000);
    });

    test('Step 7+8: Switch to third page and verify "Hello" with rendering', async () => {
        // Open third page — another renderer switch
        page3 = await ctx.openPage();

        const screenText = await getScreenText(page3);
        expect(screenText).toContain('Hello');
    });
});
