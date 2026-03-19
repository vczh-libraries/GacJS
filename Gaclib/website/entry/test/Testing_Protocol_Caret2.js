// Testing_Protocol_Caret2.js
//
// Vitest test suite that verifies:
//   - Cursor style (IBeam) is preserved after tab switching
//   - Caret blinking works after tab switching
//   - Clicking at the end of a line places the caret after the last character
//
// Test plan (the goal of the test plan cannot be changed):
//   1. Launch the application (start the C++ server, open index.html in Playwright).
//   2. Open the "Control" tab. Click the text box next to "Search:" so the caret
//      becomes active. Type "Hello" into the text box.
//   3. Switch to the "List" tab, wait, then switch back to the "Control" tab.
//      [VERIFY] The cursor CSS on the text box area is "text" (IBeam), not "default".
//   4. Click the text box again.
//      [VERIFY] A caret is visible. Wait 0.6 seconds.
//      [VERIFY] The caret blinks off. Wait 0.6 seconds.
//      [VERIFY] The caret blinks on again.
//   5. Click the rich-text document editor. Type "ABCDEF".
//   6. Press Home to move the caret to position 0.
//      [VERIFY] The caret is at the leftmost position of the text.
//   7. Press End to move the caret to the end of the line.
//      [VERIFY] The caret is at the rightmost position (after the last character),
//      not before the last character.
//   8. Press Home, then click with the mouse to the right of the last character.
//      [VERIFY] The caret jumps to the end of the line (same position as End key),
//      not before the last character.
//   9. Kill the process directly and close the webpage. No elegant exit is needed.

import { describe, test, expect } from 'vitest';
import {
    sleep,
    getLeafTextPositions,
    findEditorCenter,
    clickAt,
    findAndClick,
    setupProtocolTest
} from './Testing_Protocol.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find all visible caret divs in the screen (same as Testing_Protocol_Caret.js).
 */
async function findCarets(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) return [];
        const carets = [];
        for (const div of screen.querySelectorAll('div')) {
            const style = div.style;
            if (style.position !== 'absolute') continue;
            if (style.display === 'none') continue;
            if (!style.backgroundColor || style.backgroundColor === 'transparent') continue;
            const w = parseFloat(style.width);
            if (isNaN(w) || w > 4) continue;
            const h = parseFloat(style.height);
            if (isNaN(h) || h < 4) continue;
            const parent = div.parentElement;
            if (!parent) continue;
            const parentWs = parent.style.whiteSpace;
            if (parentWs !== 'pre-wrap' && parentWs !== 'pre') continue;
            const r = div.getBoundingClientRect();
            carets.push({
                x: r.x,
                y: r.y,
                width: r.width,
                height: r.height,
                backgroundColor: style.backgroundColor
            });
        }
        return carets;
    });
}

async function waitForCaret(page, timeout = 1200) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const carets = await findCarets(page);
        if (carets.length >= 1) return carets;
        await sleep(100);
    }
    return [];
}

/**
 * Get the cursor CSS value at a specific screen coordinate.
 * Uses elementFromPoint to find what element is under the mouse,
 * then returns its computed cursor style.
 */
async function getCursorAtPoint(page, x, y) {
    return page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return 'none';
        return window.getComputedStyle(el).cursor;
    }, { x, y });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Caret2', () => {
    const ctx = setupProtocolTest();

    test('Step 1: Page rendering', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        expect(positions.length).toBeGreaterThanOrEqual(20);
    });

    // Store text box position for later steps
    let searchTextBoxX = 0;
    let searchTextBoxY = 0;

    test('Step 2: Open Control tab and type in Search text box', async () => {
        let positions = await getLeafTextPositions(ctx.page);
        expect(await findAndClick(ctx.page, 'Control', positions)).toBe(true);
        await sleep(800);

        positions = await getLeafTextPositions(ctx.page);
        const docEditorTab = positions.find(p => p.text === 'Document Editor (Ribbon)');
        if (docEditorTab) {
            await clickAt(ctx.page, docEditorTab.cx, docEditorTab.cy);
            await sleep(800);
        }

        positions = await getLeafTextPositions(ctx.page);
        const searchLabelPos = positions.find(p => p.text.startsWith('Search'));
        expect(searchLabelPos).toBeDefined();

        searchTextBoxX = searchLabelPos.right + 30;
        searchTextBoxY = searchLabelPos.cy;

        await clickAt(ctx.page, searchTextBoxX, searchTextBoxY);
        await sleep(300);

        for (const ch of 'Hello') {
            await ctx.page.keyboard.press(ch);
            await sleep(300);
        }
        await sleep(300);

        const screenText = await ctx.page.evaluate(() => {
            const screen = document.getElementById('gacui-screen');
            return screen !== null ? screen.textContent : '';
        });
        expect(screenText).toContain('Hello');
    });

    test('Step 3: Switch tabs and verify cursor style preserved', async () => {
        // Switch to List tab
        let positions = await getLeafTextPositions(ctx.page);
        expect(await findAndClick(ctx.page, 'List', positions)).toBe(true);
        await sleep(800);

        // Switch back to Control tab
        positions = await getLeafTextPositions(ctx.page);
        expect(await findAndClick(ctx.page, 'Control', positions)).toBe(true);
        await sleep(800);

        // Ensure the Document Editor (Ribbon) sub-tab is active
        positions = await getLeafTextPositions(ctx.page);
        const docEditorTab = positions.find(p => p.text === 'Document Editor (Ribbon)');
        if (docEditorTab) {
            await clickAt(ctx.page, docEditorTab.cx, docEditorTab.cy);
            await sleep(300);
        }

        // Find the Search text box position again
        positions = await getLeafTextPositions(ctx.page);
        const searchLabelPos = positions.find(p => p.text.startsWith('Search'));
        expect(searchLabelPos).toBeDefined();
        searchTextBoxX = searchLabelPos.right + 30;
        searchTextBoxY = searchLabelPos.cy;

        // Check the cursor style at the text box location
        const cursorStyle = await getCursorAtPoint(ctx.page, searchTextBoxX, searchTextBoxY);
        console.log(`  Cursor at text box after tab switch: ${cursorStyle}`);
        expect.soft(cursorStyle, 'Cursor should be IBeam (text) on text box after tab switch').toBe('text');
    });

    test('Step 4: Click text box and verify caret blinks', async () => {
        await clickAt(ctx.page, searchTextBoxX, searchTextBoxY);

        // Wait long enough for the protocol round-trip and a full blink cycle
        // so the caret reaches a known blink state (visible at a cycle boundary).
        await sleep(1000);

        // The caret should be visible after the click
        let carets = await findCarets(ctx.page);
        console.log(`  Carets after click: ${carets.length}`);
        expect.soft(carets.length, 'Caret should be visible after clicking').toBeGreaterThanOrEqual(1);

        // Wait 0.6s — should catch the off phase
        await sleep(600);
        carets = await findCarets(ctx.page);
        console.log(`  After 0.6s: ${carets.length} caret(s) visible`);
        expect.soft(carets.length, 'Caret should blink off').toBe(0);

        // Wait 0.6s — should catch the on phase
        await sleep(600);
        carets = await findCarets(ctx.page);
        console.log(`  After another 0.6s: ${carets.length} caret(s) visible`);
        expect.soft(carets.length, 'Caret should blink on').toBeGreaterThanOrEqual(1);
    });

    let homeCaretX = 0;
    let endCaretXSaved = 0;

    test('Step 5: Click editor and type ABCDEF', async () => {
        const editorPos = await findEditorCenter(ctx.page);
        expect(editorPos).not.toBeNull();

        await clickAt(ctx.page, editorPos.cx, editorPos.cy);
        await sleep(300);

        // Clear any existing text
        await ctx.page.keyboard.press('Control+a');
        await sleep(300);
        await ctx.page.keyboard.press('Delete');
        await sleep(300);

        for (const ch of 'ABCDEF') {
            await ctx.page.keyboard.press(ch);
            await sleep(300);
        }
        await sleep(300);

        const screenText = await ctx.page.evaluate(() => {
            const screen = document.getElementById('gacui-screen');
            return screen !== null ? screen.textContent : '';
        });
        expect(screenText).toContain('ABCDEF');
    });

    test('Step 6: Press Home — caret at leftmost position', async () => {
        await ctx.page.keyboard.press('Home');
        await sleep(300);

        const carets = await waitForCaret(ctx.page);
        console.log(`  Carets after Home: ${carets.length}`);
        expect.soft(carets.length, 'Caret should be visible after Home').toBeGreaterThanOrEqual(1);

        if (carets.length >= 1) {
            homeCaretX = carets[0].x;
            console.log(`  Home caret X: ${homeCaretX.toFixed(1)}`);
        }
    });

    test('Step 7: Press End — caret after last character', async () => {
        await ctx.page.keyboard.press('End');
        await sleep(300);

        const carets = await waitForCaret(ctx.page);
        console.log(`  Carets after End: ${carets.length}`);
        expect.soft(carets.length, 'Caret should be visible after End').toBeGreaterThanOrEqual(1);

        if (carets.length >= 1) {
            const endCaretX = carets[0].x;
            endCaretXSaved = endCaretX;
            console.log(`  End caret X: ${endCaretX.toFixed(1)}, Home caret X: ${homeCaretX.toFixed(1)}`);
            // The caret after End must be further right than after Home
            // (i.e., after the last character, not before it)
            expect.soft(
                endCaretX,
                'End caret should be to the right of Home caret'
            ).toBeGreaterThan(homeCaretX + 10);

            // Additionally verify the caret moved right by pressing Right from Home
            // Navigate: Home, then Right 6 times to reach end
            await ctx.page.keyboard.press('Home');
            await sleep(300);
            for (let i = 0; i < 6; i++) {
                await ctx.page.keyboard.press('ArrowRight');
                await sleep(200);
            }
            await sleep(300);

            const rightCarets = await waitForCaret(ctx.page);
            if (rightCarets.length >= 1) {
                const rightEndX = rightCarets[0].x;
                console.log(`  Right-arrow end X: ${rightEndX.toFixed(1)}, End-key X: ${endCaretX.toFixed(1)}`);
                // Caret from End key and caret from arrow-right 6 times should be at the same position
                expect.soft(
                    Math.abs(rightEndX - endCaretX),
                    'End key and Right-arrow-to-end should produce same caret position'
                ).toBeLessThan(3);
            }
        }
    });

    test('Step 8: Press Home then mouse-click at end of line', async () => {
        // First go to Home so caret is at the start
        await ctx.page.keyboard.press('Home');
        await sleep(300);

        const homeCaret = await waitForCaret(ctx.page);
        expect.soft(homeCaret.length, 'Caret should be visible after Home').toBeGreaterThanOrEqual(1);

        // Click past the end of the text.
        // We know endCaretXSaved is the X of the end-of-line caret from Step 7,
        // and the caret Y from homeCaret gives us the correct line Y.
        // Click well to the right of where the text ends.
        const clickX = endCaretXSaved + 20;
        const clickY = homeCaret[0].y + homeCaret[0].height / 2;
        await clickAt(ctx.page, clickX, clickY);
        await sleep(300);

        const clickCarets = await waitForCaret(ctx.page);
        console.log(`  Carets after clicking past end of text: ${clickCarets.length}`);
        expect.soft(clickCarets.length, 'Caret should be visible after clicking').toBeGreaterThanOrEqual(1);

        if (clickCarets.length >= 1) {
            const clickCaretX = clickCarets[0].x;
            console.log(`  Click caret X: ${clickCaretX.toFixed(1)}, Home caret X: ${homeCaretX.toFixed(1)}, End caret X: ${endCaretXSaved.toFixed(1)}`);

            // The caret after clicking past the end must be at the end of the line
            expect.soft(
                clickCaretX,
                'Click-at-end caret should be to the right of Home caret'
            ).toBeGreaterThan(homeCaretX + 10);

            // Should match the End key position
            expect.soft(
                Math.abs(clickCaretX - endCaretXSaved),
                'Click-at-end caret should match End key caret position'
            ).toBeLessThan(3);
        }
    });
});
