// Testing_Protocol_Caret.js
//
// Vitest test suite that verifies caret rendering, blinking, positioning,
// and size in the GacUI rich-text document editor and text boxes.
//
// Test plan (the goal of the test plan cannot be changed):
//   1. Launch the application (start the C++ server, open index.html in Playwright).
//   2. Open the "Control" tab. Click the text box next to "Search:" so the caret
//      becomes active.
//      [VERIFY] A caret is visible in the Search text box.
//   3. Click the rich-text document editor (the large area at the bottom).
//      [VERIFY] The caret in the Search text box disappears, and a caret appears
//      in the rich-text editor.
//   4. Test caret blinking: wait 0.6 seconds.
//      [VERIFY] The caret is now invisible (blinked off). Wait 0.6 seconds.
//      [VERIFY] The caret is now visible again (blinked on).
//   5. Type ABCD into the editor.
//   6. Select BC (Home, Right 1, Shift+Right 2). Open the font dialog, select the
//      only font, pick size 24, click OK.
//   7. Press Home then Right 4 times (5 positions total).
//      [VERIFY] Positions 2 and 3 (after A, after B) have a taller caret
//      (frontSide: caret uses the font of the character ahead); 1, 4, and 5
//      have a shorter caret.
//   8. Press Left 4 times back to position 0 (4 positions).
//      [VERIFY] Positions 1 and 2 (before D, before C) have a taller caret
//      (backSide: caret uses the font of the character behind); 3 and 4 have
//      a shorter caret.
//   9. Press Ctrl+A to select all, then press Home.
//      [VERIFY] A caret is visible at the expected position.
//   10. Press End.
//      [VERIFY] A caret is visible at the expected position.
//   11. Kill the process directly and close the webpage. No elegant exit is needed.

import { describe, test, expect } from 'vitest';
import {
    getLeafTextPositions,
    findEditorCenter,
    clickAt,
    findAndClick,
    findNewTexts,
    findIconButtonsInArea,
    groupIntoRows,
    waitForIdle,
    findCarets,
    waitForCarets,
    setupProtocolTest
} from './Testing_Protocol.js';

const TYPED_TEXT = 'ABCD';
const BIG_SIZE = 24;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Caret', () => {
    const ctx = setupProtocolTest();
    const rightCaretHeights = [];

    test('Step 1: Page rendering', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        expect(positions.length).toBeGreaterThanOrEqual(20);
    });

    test('Step 2: Open Control tab and click Search text box', async () => {
        let positions = await getLeafTextPositions(ctx.page);
        expect(await findAndClick(ctx.page, 'Control', positions)).toBe(true);

        positions = await getLeafTextPositions(ctx.page);
        const docEditorTab = positions.find(p => p.text === 'Document Editor (Ribbon)');
        if (docEditorTab) {
            await clickAt(ctx.page, docEditorTab.cx, docEditorTab.cy);
        }

        positions = await getLeafTextPositions(ctx.page);
        const searchLabelPos = positions.find(p => p.text.startsWith('Search'));
        expect(searchLabelPos).toBeDefined();

        await clickAt(ctx.page, searchLabelPos.right + 30, searchLabelPos.cy);

        const carets = await findCarets(ctx.page);
        console.log(`  Carets found after clicking Search: ${carets.length}`);
        expect.soft(carets.length, 'Caret visible in Search text box').toBeGreaterThanOrEqual(1);
    });

    test('Step 3: Click the rich-text editor', async () => {
        const editorPos = await findEditorCenter(ctx.page);
        expect(editorPos).not.toBeNull();

        await clickAt(ctx.page, editorPos.cx, editorPos.cy);

        const carets = await waitForCarets(ctx.page);
        console.log(`  Carets found after clicking editor: ${carets.length}`);
        expect.soft(carets.length, 'Caret should appear in editor').toBe(1);
    });

    test('Step 4: Test caret blinking', async () => {
        // Poll until caret blinks off
        const blinkOff = await waitForCarets(ctx.page, { visible: false });
        console.log(`  Blink off detected: ${blinkOff}`);
        expect.soft(blinkOff, 'Caret should blink off').toBe(true);

        // Poll until caret blinks back on
        const carets = await waitForCarets(ctx.page, { timeout: 600 });
        console.log(`  After blink on: ${carets.length} caret(s) visible`);
        expect.soft(carets.length, 'Caret should blink on again').toBeGreaterThanOrEqual(1);
    });

    test('Step 5: Type ABCD', async () => {
        await ctx.page.keyboard.press('Control+a');
        await waitForIdle(ctx.page);
        await ctx.page.keyboard.press('Delete');
        await waitForIdle(ctx.page);

        for (const ch of TYPED_TEXT) {
            await ctx.page.keyboard.press(ch);
            await waitForIdle(ctx.page);
        }

        const screenText = await ctx.page.evaluate(() => {
            const screen = document.getElementById('gacui-screen');
            return screen !== null ? screen.textContent : '';
        });
        expect(screenText).toContain(TYPED_TEXT);
    });

    test('Step 6: Select BC and apply font size 24', async () => {
        await ctx.page.keyboard.press('Home');
        await waitForIdle(ctx.page);
        await ctx.page.keyboard.press('ArrowRight');
        await waitForIdle(ctx.page);
        for (let i = 0; i < 2; i++) {
            await ctx.page.keyboard.press('Shift+ArrowRight');
            await waitForIdle(ctx.page);
        }

        const positions = await getLeafTextPositions(ctx.page);
        const textGroupLabel = positions.find(p => p.text === 'Text');
        const iconLabelsLabel = positions.find(p => p.text === 'Icon Labels');

        let fontBtnPos = null;

        if (textGroupLabel) {
            const xMin = textGroupLabel.left - 20;
            const xMax = iconLabelsLabel ? iconLabelsLabel.left : textGroupLabel.right + 200;
            const yMin = textGroupLabel.top - 100;
            const yMax = textGroupLabel.top;

            const icons = await findIconButtonsInArea(ctx.page, xMin, xMax, yMin, yMax);
            const rows = groupIntoRows(icons, 5);
            console.log(`  Icon rows in Text group: ${rows.map(r => r.length).join(', ')} (total ${icons.length})`);

            if (rows.length >= 2) {
                const lastRow = rows[rows.length - 1];
                if (lastRow.length >= 1) {
                    fontBtnPos = lastRow[0];
                }
            }
        }

        const textsBeforeFont = await getLeafTextPositions(ctx.page);

        expect(fontBtnPos, 'Font icon button not found').not.toBeNull();
        await clickAt(ctx.page, fontBtnPos.cx, fontBtnPos.cy);

        const textsAfterFont = await getLeafTextPositions(ctx.page);
        const newFontTexts = findNewTexts(textsBeforeFont, textsAfterFont);
        console.log(`  Dialog new texts: ${newFontTexts.map(t => t.text).join(', ')}`);

        const chooseFontTitle = newFontTexts.find(p => p.text === 'Choose Font');
        expect(chooseFontTitle, 'Font dialog did not appear').toBeDefined();

        const knownLabels = new Set([
            'Choose Font', 'Font:', 'Size:', 'Preview:', 'ABCxyz', 'OK', 'Cancel'
        ]);
        const sizeLabel = newFontTexts.find(p => p.text === 'Size:');

        const fontNames = newFontTexts.filter(p =>
            !knownLabels.has(p.text) &&
            !/^\d+$/.test(p.text) &&
            (sizeLabel ? p.cx < sizeLabel.cx : p.cx < chooseFontTitle.cx + 100)
        );

        if (fontNames.length > 0) {
            await clickAt(ctx.page, fontNames[0].cx, fontNames[0].cy);
        }

        if (sizeLabel) {
            await clickAt(ctx.page, sizeLabel.cx, sizeLabel.bottom + 10);
            await ctx.page.keyboard.press('Control+a');
            await waitForIdle(ctx.page);
            await ctx.page.keyboard.type(String(BIG_SIZE));
            await waitForIdle(ctx.page);
        }

        const fontOk = newFontTexts.find(p => p.text === 'OK');
        expect(fontOk, 'OK button not found in font dialog').toBeDefined();
        await clickAt(ctx.page, fontOk.cx, fontOk.cy);
    });

    test('Step 7: Right-arrow caret sizes (frontSide)', async () => {
        const editorPos = await findEditorCenter(ctx.page);
        if (editorPos) {
            await clickAt(ctx.page, editorPos.cx, editorPos.cy);
        }
        await ctx.page.keyboard.press('Home');
        await waitForIdle(ctx.page);

        // Position 0 (before A)
        let carets = await waitForCarets(ctx.page);
        rightCaretHeights.push(carets.length >= 1 ? carets[0].height : 0);
        const posNames = ['before A', 'after A', 'after B', 'after C', 'after D'];
        console.log(`  Pos 0 (${posNames[0]}): h=${rightCaretHeights[0].toFixed(1)}`);

        for (let i = 1; i <= 4; i++) {
            await ctx.page.keyboard.press('ArrowRight');
            await waitForIdle(ctx.page);
            carets = await waitForCarets(ctx.page);
            const h = carets.length >= 1 ? carets[0].height : 0;
            rightCaretHeights.push(h);
            console.log(`  Pos ${i} (${posNames[i]}): h=${h.toFixed(1)}`);
        }

        // All positions should have visible carets
        for (let i = 0; i < 5; i++) {
            expect.soft(rightCaretHeights[i], `Position ${i} should have visible caret`).toBeGreaterThan(0);
        }

        // Positions 1,2 (after A, after B) should be taller than positions 0,3,4
        // frontSide: caret uses the font of the character ahead (to the right)
        if (rightCaretHeights.every(h => h > 0)) {
            const maxShort = Math.max(rightCaretHeights[0], rightCaretHeights[3], rightCaretHeights[4]);
            const minTall = Math.min(rightCaretHeights[1], rightCaretHeights[2]);
            console.log(`  Short heights (pos 0,3,4): ${[rightCaretHeights[0], rightCaretHeights[3], rightCaretHeights[4]].map(h => h.toFixed(1)).join(', ')}`);
            console.log(`  Tall heights (pos 1,2): ${[rightCaretHeights[1], rightCaretHeights[2]].map(h => h.toFixed(1)).join(', ')}`);
            expect.soft(minTall, 'Tall carets should be taller than short carets').toBeGreaterThan(maxShort + 2);
        }
    });

    test('Step 8: Left-arrow caret sizes (backSide)', async () => {
        const leftCaretHeights = [];
        const posNames = ['before D', 'before C', 'before B', 'before A'];

        for (let i = 1; i <= 4; i++) {
            await ctx.page.keyboard.press('ArrowLeft');
            await waitForIdle(ctx.page);
            const carets = await waitForCarets(ctx.page);
            const h = carets.length >= 1 ? carets[0].height : 0;
            leftCaretHeights.push(h);
            console.log(`  Left ${i} (${posNames[i - 1]}): h=${h.toFixed(1)}`);
        }

        for (let i = 0; i < 4; i++) {
            expect.soft(leftCaretHeights[i], `Left position ${i} should have visible caret`).toBeGreaterThan(0);
        }

        // Positions 0,1 (before D, before C) should be taller; 2,3 shorter
        // backSide: caret uses the font of the character behind (to the left)
        if (leftCaretHeights.every(h => h > 0)) {
            const shortHeights = [leftCaretHeights[2], leftCaretHeights[3]];
            const tallHeights = [leftCaretHeights[0], leftCaretHeights[1]];
            const maxShort = Math.max(...shortHeights);
            const minTall = Math.min(...tallHeights);
            console.log(`  Short heights (before B, before A): ${shortHeights.map(h => h.toFixed(1)).join(', ')}`);
            console.log(`  Tall heights (before D, before C): ${tallHeights.map(h => h.toFixed(1)).join(', ')}`);
            expect.soft(minTall, 'Tall carets should be taller than short carets').toBeGreaterThan(maxShort + 2);
        }
    });

    test('Step 9: Ctrl+A then Home', async () => {
        await ctx.page.keyboard.press('Control+a');
        await waitForIdle(ctx.page);
        await ctx.page.keyboard.press('Home');
        await waitForIdle(ctx.page);

        const carets = await waitForCarets(ctx.page);
        console.log(`  Carets after Ctrl+A + Home: ${carets.length}`);
        expect.soft(carets.length, 'Caret should be visible after Ctrl+A + Home').toBeGreaterThanOrEqual(1);

        if (carets.length >= 1 && rightCaretHeights[0] > 0) {
            console.log(`    caret h=${carets[0].height.toFixed(1)}, expected ≈${rightCaretHeights[0].toFixed(1)}`);
            expect.soft(
                Math.abs(carets[0].height - rightCaretHeights[0]),
                'Caret height should match position 0'
            ).toBeLessThan(2);
        }
    });

    test('Step 10: Press End', async () => {
        await ctx.page.keyboard.press('End');
        await waitForIdle(ctx.page);

        const carets = await waitForCarets(ctx.page);
        console.log(`  Carets after End: ${carets.length}`);
        expect.soft(carets.length, 'Caret should be visible after End').toBeGreaterThanOrEqual(1);

        if (carets.length >= 1 && rightCaretHeights[4] > 0) {
            console.log(`    caret h=${carets[0].height.toFixed(1)}, expected ≈${rightCaretHeights[4].toFixed(1)}`);
            expect.soft(
                Math.abs(carets[0].height - rightCaretHeights[4]),
                'Caret height should match position 4'
            ).toBeLessThan(2);
        }
    });
});
