// Testing_Protocol_Font.js
//
// Vitest test suite for GacUI font/color formatting in the rich-text
// document editor.
//
// Test plan (the goal of the test plan cannot be changed):
//   1. Launch the application (start the C++ server, open index.html in Playwright).
//   2. Open the "Control" tab, click the rich-text document editor (large area
//      at the bottom).
//   3. Type ABCDEFGHIJKLMN into the editor.
//   4. Select C..K, open the font dialog from the toolbar, select the only font,
//      pick a bigger text size so OK becomes enabled, click OK.
//   5. Select H..M, open the text-color dialog from the toolbar, change the first
//      text box (Red) to 0, click OK.
//   6. Verify C..K has bigger font size and H..M is #00FFFF.
//   7. Click the rich editor again, press Home (cursor at 0). Verify same.
//   8. Press Shift+Right 14 times. After each press verify: selected text is white,
//      non-selected C..K still bigger, non-selected H..M still #00FFFF.
//   9. Kill the process directly and close the webpage. No elegant exit is needed.

import { describe, test, expect } from 'vitest';
import {
    sleep,
    getLeafTextPositions,
    findEditorCenter,
    clickAt,
    findAndClick,
    findNewTexts,
    findIconButtonsInArea,
    groupIntoRows,
    setupProtocolTest
} from './Testing_Protocol.js';

const TYPED_TEXT = 'ABCDEFGHIJKLMN';
const BIG_SIZE = 24;

// ---------------------------------------------------------------------------
// Helpers (unique to this test)
// ---------------------------------------------------------------------------

function normalizeColor(cssColor) {
    const m = cssColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (m) {
        const hex = (i) => parseInt(m[i]).toString(16).padStart(2, '0');
        return `#${hex(1)}${hex(2)}${hex(3)}`.toUpperCase();
    }
    return cssColor.toUpperCase().replace(/\s/g, '');
}

/** Return per-character styles from the largest DocumentParagraph element. */
async function getDocCharStyles(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) return [];
        let container = null;
        let maxArea = 0;
        for (const div of screen.querySelectorAll('div')) {
            if (div.style.whiteSpace === 'pre-wrap') {
                const r = div.getBoundingClientRect();
                const area = r.width * r.height;
                if (area > maxArea) {
                    maxArea = area;
                    container = div;
                }
            }
        }
        if (!container) return [];
        const chars = [];
        for (const span of container.querySelectorAll('span')) {
            const computed = window.getComputedStyle(span);
            const fs = parseFloat(computed.fontSize) || 0;
            const color = computed.color || '';
            for (const ch of span.textContent) {
                chars.push({ char: ch, fontSize: fs, color });
            }
        }
        return chars;
    });
}

/** Extract per-character styles for our typed text from the char array. */
function extractTypedStyles(allChars) {
    const full = allChars.map(c => c.char).join('');
    const idx = full.indexOf(TYPED_TEXT);
    if (idx === -1) return null;
    return allChars.slice(idx, idx + TYPED_TEXT.length);
}

/**
 * Verify formatting using soft assertions.
 *   selectedEnd – how many characters from position 0 are selected (0 = none).
 *   defaultSize – the default (small) font size.
 *   bigSize     – the bigger font size that was applied to C..K.
 */
function verifyFormatting(styles, selectedEnd, defaultSize, bigSize, label) {
    expect.soft(styles, `${label}: Could not find "${TYPED_TEXT}"`).not.toBeNull();
    if (styles === null) return;

    // Selected text (indices 0..selectedEnd-1) should be white
    if (selectedEnd > 0) {
        for (let i = 0; i < selectedEnd && i < 14; i++) {
            const actual = normalizeColor(styles[i].color);
            expect.soft(actual, `${label}: sel '${styles[i].char}'[${i}] color`).toBe('#FFFFFF');
        }
    }

    // Non-selected C..K (indices 2-10) should have bigger size
    for (let i = Math.max(selectedEnd, 2); i <= 10; i++) {
        expect.soft(
            styles[i].fontSize,
            `${label}: '${styles[i].char}'[${i}] size`
        ).toBeGreaterThanOrEqual(bigSize - 1);
    }

    // Non-selected H..M (indices 7-12) should be #00FFFF
    for (let i = Math.max(selectedEnd, 7); i <= 12; i++) {
        const actual = normalizeColor(styles[i].color);
        expect.soft(actual, `${label}: '${styles[i].char}'[${i}] color`).toBe('#00FFFF');
    }
}

function dumpStyles(styles) {
    if (!styles) return '(null)';
    return styles.map(s => `${s.char}(${s.fontSize}px,${normalizeColor(s.color)})`).join(' ');
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Font', () => {
    const ctx = setupProtocolTest();
    let defaultSize = 12;
    let effectiveBigSize = BIG_SIZE;
    let colorBtnPos = null;

    test('Step 1: Page rendering', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        expect(positions.length).toBeGreaterThanOrEqual(20);
    });

    test('Step 2: Open the Control tab', async () => {
        let positions = await getLeafTextPositions(ctx.page);
        expect(await findAndClick(ctx.page, 'Control', positions)).toBe(true);
        await sleep(250);

        positions = await getLeafTextPositions(ctx.page);
        const docEditorTab = positions.find(p => p.text === 'Document Editor (Ribbon)');
        if (docEditorTab) {
            await clickAt(ctx.page, docEditorTab.cx, docEditorTab.cy);
            await sleep(250);
        }
    });

    test('Step 3: Click the rich-text editor', async () => {
        const editorPos = await findEditorCenter(ctx.page);
        expect(editorPos).not.toBeNull();

        await clickAt(ctx.page, editorPos.cx, editorPos.cy);
        await sleep(250);
    });

    test('Step 4: Type ABCDEFGHIJKLMN', async () => {
        await ctx.page.keyboard.press('Control+a');
        await sleep(250);
        await ctx.page.keyboard.press('Delete');
        await sleep(250);

        for (const ch of TYPED_TEXT) {
            await ctx.page.keyboard.press(ch);
            await sleep(250);
        }
        await sleep(250);

        const allChars = await getDocCharStyles(ctx.page);
        const styles = extractTypedStyles(allChars);
        expect(styles).not.toBeNull();

        if (styles) {
            defaultSize = styles[0].fontSize;
            console.log(`  Default font size: ${defaultSize}px`);
        }
    });

    test('Step 5: Select C..K and apply bigger font', async () => {
        // Home, Right 2, Shift+Right 9
        await ctx.page.keyboard.press('Home');
        await sleep(250);
        for (let i = 0; i < 2; i++) {
            await ctx.page.keyboard.press('ArrowRight');
            await sleep(250);
        }
        for (let i = 0; i < 9; i++) {
            await ctx.page.keyboard.press('Shift+ArrowRight');
            await sleep(250);
        }
        await sleep(250);

        // Find icon buttons in the "Text" ribbon group
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
                if (lastRow.length >= 2) {
                    fontBtnPos = lastRow[0];
                    colorBtnPos = lastRow[1];
                }
            }
        }

        const textsBeforeFont = await getLeafTextPositions(ctx.page);

        expect(fontBtnPos, 'Font icon button not found').not.toBeNull();
        await clickAt(ctx.page, fontBtnPos.cx, fontBtnPos.cy);
        await sleep(250);

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
        console.log(`  Font names: ${fontNames.map(f => f.text).join(', ')}`);

        // Verify the first font name is not quoted
        if (fontNames.length > 0) {
            expect.soft(
                fontNames[0].text.startsWith('"') || fontNames[0].text.startsWith("'"),
                `Font name should not be quoted: "${fontNames[0].text}"`
            ).toBe(false);

            await clickAt(ctx.page, fontNames[0].cx, fontNames[0].cy);
            await sleep(250);
        }

        if (sizeLabel) {
            await clickAt(ctx.page, sizeLabel.cx, sizeLabel.bottom + 10);
            await sleep(250);
            await ctx.page.keyboard.press('Control+a');
            await sleep(250);
            await ctx.page.keyboard.type(String(BIG_SIZE));
            await sleep(250);
        }

        const fontOk = newFontTexts.find(p => p.text === 'OK');
        expect(fontOk, 'OK button not found in font dialog').toBeDefined();
        await clickAt(ctx.page, fontOk.cx, fontOk.cy);
        await sleep(250);

        // Verify dialog closed
        const afterFontOk = await getLeafTextPositions(ctx.page);
        expect.soft(afterFontOk.some(p => p.text === 'Choose Font'), 'Font dialog still open').toBe(false);
    });

    test('Step 6: Select H..M and apply text color', async () => {
        const editorPos = await findEditorCenter(ctx.page);
        if (editorPos) {
            await clickAt(ctx.page, editorPos.cx, editorPos.cy);
            await sleep(250);
        }

        // Home, Right 7, Shift+Right 6
        await ctx.page.keyboard.press('Home');
        await sleep(250);
        for (let i = 0; i < 7; i++) {
            await ctx.page.keyboard.press('ArrowRight');
            await sleep(250);
        }
        for (let i = 0; i < 6; i++) {
            await ctx.page.keyboard.press('Shift+ArrowRight');
            await sleep(250);
        }
        await sleep(250);

        const textsBeforeColor = await getLeafTextPositions(ctx.page);

        expect(colorBtnPos, 'Text Color icon button not found').not.toBeNull();
        await clickAt(ctx.page, colorBtnPos.cx, colorBtnPos.cy);
        await sleep(250);

        const textsAfterColor = await getLeafTextPositions(ctx.page);
        const newColorTexts = findNewTexts(textsBeforeColor, textsAfterColor);
        console.log(`  Color dialog new texts: ${newColorTexts.map(t => t.text).join(', ')}`);

        const redLabel = newColorTexts.find(p => p.text === 'Red:');
        expect(redLabel, 'Color dialog did not appear').toBeDefined();

        await clickAt(ctx.page, redLabel.right + 40, redLabel.cy);
        await sleep(250);
        await ctx.page.keyboard.press('Control+a');
        await sleep(250);
        await ctx.page.keyboard.type('0');
        await sleep(250);

        const colorOk = newColorTexts.find(p => p.text === 'OK');
        expect(colorOk, 'OK button not found in color dialog').toBeDefined();
        await clickAt(ctx.page, colorOk.cx, colorOk.cy);
        await sleep(250);

        // Verify dialog closed
        const afterColorOk = await getLeafTextPositions(ctx.page);
        expect.soft(afterColorOk.some(p => p.text === 'Red:'), 'Color dialog still open').toBe(false);
    });

    test('Step 7: Verify formatting after color applied', async () => {
        const editorPos = await findEditorCenter(ctx.page);
        if (editorPos) {
            await clickAt(ctx.page, editorPos.cx, editorPos.cy);
            await sleep(250);
        }
        await ctx.page.keyboard.press('End');
        await sleep(250);

        const allChars = await getDocCharStyles(ctx.page);
        const styles = extractTypedStyles(allChars);
        console.log(`  Styles: ${dumpStyles(styles)}`);

        if (styles) {
            const detectedBigSize = Math.max(...styles.slice(2, 11).map(s => s.fontSize));
            effectiveBigSize = detectedBigSize > defaultSize ? detectedBigSize : BIG_SIZE;
            console.log(`  Detected big size: ${detectedBigSize}px`);
        }

        verifyFormatting(styles, 0, defaultSize, effectiveBigSize, 'After color');
    });

    test('Step 8: Press Home and verify', async () => {
        const editorPos = await findEditorCenter(ctx.page);
        if (editorPos) {
            await clickAt(ctx.page, editorPos.cx, editorPos.cy);
            await sleep(250);
        }
        await ctx.page.keyboard.press('Home');
        await sleep(250);

        const allChars = await getDocCharStyles(ctx.page);
        const styles = extractTypedStyles(allChars);
        console.log(`  Styles: ${dumpStyles(styles)}`);
        verifyFormatting(styles, 0, defaultSize, effectiveBigSize, 'After Home');
    });

    test('Step 9: Shift+Right loop (14 presses)', async () => {
        for (let press = 1; press <= 14; press++) {
            await ctx.page.keyboard.press('Shift+ArrowRight');
            await sleep(250);

            const allChars = await getDocCharStyles(ctx.page);
            const styles = extractTypedStyles(allChars);
            const label = `Press ${press}: select [0..${press})`;
            if (styles) {
                console.log(`    ${label}: ${dumpStyles(styles)}`);
            }
            verifyFormatting(styles, press, defaultSize, effectiveBigSize, label);
        }
    });
});
