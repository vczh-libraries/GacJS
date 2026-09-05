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
    openControlTab,
    findTextInputPointRightOfLabel,
    setupProtocolTest,
    describeProtocolTest,
    observeProtocolEvents
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
    let outgoing;
    const ctx = setupProtocolTest({ setupPage: async page => { outgoing = observeProtocolEvents(page); } });
    let searchLabelPos;
    let searchTextBox;

    test('Step 1: Page rendering', async () => {
        const initial = await getLeafTexts(ctx.page);
        expect(initial.length).toBeGreaterThanOrEqual(20);
    });

    test('Step 2: Open the Control tab', async () => {
        expect(await openControlTab(ctx.page)).toBe(true);
    });

    test('Step 3: Find and click the text box next to "Search:"', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        searchLabelPos = positions.find(p => p.text.startsWith('Search'));
        expect(searchLabelPos).toBeDefined();

        searchTextBox = await findTextInputPointRightOfLabel(ctx.page, searchLabelPos);
        await clickAt(ctx.page, searchTextBox.x, searchTextBox.y);
    });

    test('Step 4: Type text', async () => {
        expect(searchLabelPos).toBeDefined();
        await clickAt(ctx.page, searchTextBox.x, searchTextBox.y);

        for (const ch of 'Hello[Ab]{Cd}') {
            await ctx.page.keyboard.press(ch);
            await waitForIdle(ctx.page);
        }
    });

    test('Step 5: Verify typed text', async () => {
        const screenText = await ctx.page.evaluate(() => {
            const screen = document.getElementById('gacui-screen');
            return screen !== null ? screen.textContent : '';
        });
        expect(screenText).toContain('Hello[Ab]{Cd}');
        const keys = outgoing.filter(event => event.name === 'IOKeyDown').map(event => event.arguments.code);
        expect(keys).toContain(0xDB);
        expect(keys).toContain(0xDD);
    });

    test('Step 6: Preserve and type bracket keys after renderer replacement', async () => {
        const page = await ctx.openPage();
        expect(await openControlTab(page)).toBe(true);
        await expect.poll(() => page.locator('#gacui-screen').textContent(), { timeout: 15000 }).toContain('Hello[Ab]{Cd}');
        const label = (await getLeafTextPositions(page)).find(p => p.text.startsWith('Search'));
        expect(label).toBeDefined();
        const point = await findTextInputPointRightOfLabel(page, label);
        await clickAt(page, point.x, point.y);
        await page.keyboard.press('Control+a');
        for (const ch of 'Again[Ef]{Gh}') {
            await page.keyboard.press(ch);
            await waitForIdle(page);
        }
        await expect.poll(() => page.locator('#gacui-screen').textContent(), { timeout: 15000 }).toContain('Again[Ef]{Gh}');
        const keys = outgoing.filter(event => event.name === 'IOKeyDown').map(event => event.arguments.code);
        expect(keys).toContain(0xDB);
        expect(keys).toContain(0xDD);
    });
});
