// Testing_Protocol_Font.js
//
// Standalone Playwright test script for GacUI font/color formatting in the
// rich-text document editor.
//
// Usage:
//   cd Gaclib
//   node ../doc/Testing_Protocol_Font.js
//
// Prerequisites:
//   - yarn build  (in Gaclib/)
//   - RemotingTest_Core.exe built (via scripts/start-test-server.ps1)
//   - npx playwright install chromium  (first time only)
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

const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const GACLIB_ROOT = path.resolve(REPO_ROOT, 'Gaclib');

const { chromium } = require(path.resolve(GACLIB_ROOT, 'node_modules', '@playwright', 'test'));
const { execSync, exec } = require('child_process');
const { existsSync } = require('fs');

const SERVER_EXE = path.resolve(REPO_ROOT, 'GacUI', 'Test', 'GacUISrc', 'x64', 'Debug', 'RemotingTest_Core.exe');
const WEBSITE_URL = 'http://localhost:8896/index.html';
const TYPED_TEXT = 'ABCDEFGHIJKLMN';
const BIG_SIZE = 24; // The bigger font size we'll apply

function killServer() {
    try {
        execSync('taskkill /F /IM RemotingTest_Core.exe', { stdio: 'ignore' });
    } catch {
        // Process may not exist
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeColor(cssColor) {
    const m = cssColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (m) {
        const hex = (i) => parseInt(m[i]).toString(16).padStart(2, '0');
        return `#${hex(1)}${hex(2)}${hex(3)}`.toUpperCase();
    }
    return cssColor.toUpperCase().replace(/\s/g, '');
}

async function getLeafTextPositions(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) return [];
        const result = [];
        for (const d of screen.querySelectorAll('div')) {
            if (d.childElementCount === 0 && d.textContent.trim() !== '') {
                const r = d.getBoundingClientRect();
                result.push({
                    text: d.textContent.trim(),
                    cx: r.x + r.width / 2,
                    cy: r.y + r.height / 2,
                    right: r.x + r.width,
                    left: r.x,
                    top: r.y,
                    bottom: r.y + r.height,
                    width: r.width,
                    height: r.height
                });
            }
        }
        return result;
    });
}

/** Return per-character styles from the largest DocumentParagraph element.
 *  Uses getComputedStyle to capture inherited styles from plain spans. */
async function getDocCharStyles(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) return [];
        // Find the largest pre-wrap container (DocumentParagraph)
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

/** Find the editor (largest pre-wrap element) center coordinates. */
async function findEditorCenter(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) return null;
        let best = null;
        let maxArea = 0;
        for (const div of screen.querySelectorAll('div')) {
            if (div.style.whiteSpace === 'pre-wrap') {
                const r = div.getBoundingClientRect();
                const area = r.width * r.height;
                if (area > maxArea) {
                    maxArea = area;
                    best = { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
                }
            }
        }
        return best;
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
 * Verify formatting.
 *   selectedEnd – how many characters from position 0 are selected (0 = none).
 *   defaultSize – the default (small) font size.
 *   bigSize     – the bigger font size that was applied to C..K.
 */
function verifyFormatting(styles, selectedEnd, defaultSize, bigSize, pass, fail, label) {
    if (!styles) {
        fail(label, `Could not find "${TYPED_TEXT}" in document`);
        return false;
    }
    let ok = true;
    const errors = [];

    // 1. Selected text (indices 0..selectedEnd-1) should be white
    if (selectedEnd > 0) {
        for (let i = 0; i < selectedEnd && i < 14; i++) {
            const actual = normalizeColor(styles[i].color);
            if (actual !== '#FFFFFF') {
                errors.push(`sel '${styles[i].char}'[${i}]: color=${actual} expected=#FFFFFF`);
                ok = false;
            }
        }
    }

    // 2. Non-selected C..K (indices 2-10) should have bigger size
    for (let i = Math.max(selectedEnd, 2); i <= 10; i++) {
        if (styles[i].fontSize < bigSize - 1) {
            errors.push(`big '${styles[i].char}'[${i}]: size=${styles[i].fontSize} expected>=${bigSize}`);
            ok = false;
        }
    }

    // 3. Non-selected H..M (indices 7-12) should be #00FFFF
    for (let i = Math.max(selectedEnd, 7); i <= 12; i++) {
        const actual = normalizeColor(styles[i].color);
        if (actual !== '#00FFFF') {
            errors.push(`cyan '${styles[i].char}'[${i}]: color=${actual} expected=#00FFFF`);
            ok = false;
        }
    }

    if (ok) {
        pass(label);
    } else {
        fail(label, errors.join('; '));
    }
    return ok;
}

function dumpStyles(styles) {
    if (!styles) return '(null)';
    return styles.map(s => `${s.char}(${s.fontSize}px,${normalizeColor(s.color)})`).join(' ');
}

// ---------------------------------------------------------------------------
// Click helpers
// ---------------------------------------------------------------------------

async function clickAt(page, x, y) {
    await page.mouse.move(x, y);
    await sleep(200);
    await page.mouse.down();
    await sleep(100);
    await page.mouse.up();
}

async function findAndClick(page, textToFind, positions) {
    const pos = (positions || await getLeafTextPositions(page)).find(p => p.text === textToFind);
    if (!pos) return false;
    await clickAt(page, pos.cx, pos.cy);
    return true;
}

/**
 * Find icon buttons (small elements with background-image) in a bounding box.
 * Returns sorted by (y, x).
 */
async function findIconButtonsInArea(page, xMin, xMax, yMin, yMax) {
    return page.evaluate(({ xMin, xMax, yMin, yMax }) => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) return [];
        const result = [];
        for (const div of screen.querySelectorAll('div')) {
            const bi = div.style.backgroundImage;
            if (bi && bi !== 'none') {
                const r = div.getBoundingClientRect();
                const cx = r.x + r.width / 2;
                const cy = r.y + r.height / 2;
                if (cx >= xMin && cx <= xMax && cy >= yMin && cy <= yMax &&
                    r.width >= 8 && r.width <= 32 && r.height >= 8 && r.height <= 32) {
                    result.push({ cx, cy, x: r.x, y: r.y, w: r.width, h: r.height });
                }
            }
        }
        return result.sort((a, b) => a.cy - b.cy || a.cx - b.cx);
    }, { xMin, xMax, yMin, yMax });
}

/**
 * Group icon buttons into rows by Y coordinate (within tolerance).
 * Returns array of rows sorted top-to-bottom; each row sorted left-to-right.
 */
function groupIntoRows(icons, tolerance) {
    const rows = [];
    for (const icon of icons) {
        let found = false;
        for (const row of rows) {
            if (Math.abs(row[0].cy - icon.cy) < (tolerance || 5)) {
                row.push(icon);
                found = true;
                break;
            }
        }
        if (!found) rows.push([icon]);
    }
    rows.sort((a, b) => a[0].cy - b[0].cy);
    for (const row of rows) {
        row.sort((a, b) => a.cx - b.cx);
    }
    return rows;
}

/**
 * Compare 'before' and 'after' leaf text snapshots. Return texts present only
 * in 'after' (i.e. dialog-specific elements).
 */
function findNewTexts(before, after) {
    return after.filter(a =>
        !before.some(b =>
            b.text === a.text &&
            Math.abs(b.cx - a.cx) < 8 &&
            Math.abs(b.cy - a.cy) < 8
        )
    );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    let serverProcess = null;
    let browser = null;
    let passed = 0;
    let failed = 0;

    function pass(name) {
        passed++;
        console.log(`  [PASS] ${name}`);
    }

    function fail(name, detail) {
        failed++;
        console.log(`  [FAIL] ${name}: ${detail}`);
    }

    try {
        // -----------------------------------------------------------------
        // Prerequisites
        // -----------------------------------------------------------------
        if (!existsSync(SERVER_EXE)) {
            console.error(`Server executable not found: ${SERVER_EXE}`);
            console.error('Run: scripts/start-test-server.ps1 to build it.');
            process.exit(1);
        }

        killServer();
        await sleep(1000);

        serverProcess = exec(`"${SERVER_EXE}" /Http`);
        serverProcess.stdout?.on('data', () => {});
        serverProcess.stderr?.on('data', () => {});
        await sleep(3000);

        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        page.on('dialog', async dialog => {
            console.error(`  [CRASH] Dialog: ${dialog.message()}`);
            failed++;
            await dialog.dismiss();
        });

        // Forward browser console messages (renderer logging) to Node stdout
        page.on('console', () => {});

        await page.goto(WEBSITE_URL, { timeout: 30000 });
        await page.waitForSelector('#gacui-screen div div', { timeout: 30000 });
        await sleep(8000);

        // =================================================================
        // Step 1: Page loaded
        // =================================================================
        console.log('\nStep 1: Page rendering');
        let positions = await getLeafTextPositions(page);
        if (positions.length >= 20) {
            pass(`Page rendered with ${positions.length} leaf text elements`);
        } else {
            fail('Page rendering', `Expected >=20 leaf texts, got ${positions.length}`);
        }

        // =================================================================
        // Step 2: Click "Control" tab
        // =================================================================
        console.log('\nStep 2: Open the Control tab');
        if (await findAndClick(page, 'Control', positions)) {
            pass('Clicked Control tab');
        } else {
            fail('Control tab', 'Could not find "Control" text');
        }
        await sleep(5000);

        // Make sure "Document Editor (Ribbon)" sub-tab is selected
        positions = await getLeafTextPositions(page);
        const docEditorTab = positions.find(p => p.text === 'Document Editor (Ribbon)');
        if (docEditorTab) {
            await clickAt(page, docEditorTab.cx, docEditorTab.cy);
            await sleep(3000);
            pass('Clicked Document Editor (Ribbon) sub-tab');
        }

        // =================================================================
        // Step 3: Click the rich text editor
        // =================================================================
        console.log('\nStep 3: Click the rich-text editor');
        const editorPos = await findEditorCenter(page);
        if (!editorPos) {
            fail('Find editor', 'Could not find pre-wrap element for DocumentParagraph');
        } else {
            await clickAt(page, editorPos.cx, editorPos.cy);
            await sleep(2000);
            pass(`Clicked editor at (${Math.round(editorPos.cx)}, ${Math.round(editorPos.cy)})`);
        }

        // =================================================================
        // Step 4: Clear + type ABCDEFGHIJKLMN
        // =================================================================
        console.log('\nStep 4: Type text');
        // Select all and delete existing content
        await page.keyboard.press('Control+a');
        await sleep(1000);
        await page.keyboard.press('Delete');
        await sleep(2000);

        // Type ABCDEFGHIJKLMN
        for (const ch of TYPED_TEXT) {
            await page.keyboard.press(ch);
            await sleep(200);
        }
        await sleep(3000);

        // Verify text appeared
        let allChars = await getDocCharStyles(page);
        let styles = extractTypedStyles(allChars);
        if (styles) {
            pass(`Typed text found: ${dumpStyles(styles)}`);
        } else {
            const fullText = allChars.map(c => c.char).join('');
            fail('Type text', `"${TYPED_TEXT}" not found in doc chars: "${fullText}"`);
        }

        // Detect default font size
        const defaultSize = styles ? styles[0].fontSize : 12;
        console.log(`  Default font size: ${defaultSize}px`);

        // =================================================================
        // Step 5: Select C..K → Font dialog
        // =================================================================
        console.log('\nStep 5: Select C..K and apply bigger font');
        // Home, Right 2, Shift+Right 9
        await page.keyboard.press('Home');
        await sleep(500);
        for (let i = 0; i < 2; i++) {
            await page.keyboard.press('ArrowRight');
            await sleep(200);
        }
        for (let i = 0; i < 9; i++) {
            await page.keyboard.press('Shift+ArrowRight');
            await sleep(200);
        }
        await sleep(1000);
        pass('Selected C..K');

        // Find the "Set Font ..." icon button in the "Text" ribbon group.
        // The buttons are icon-only (no text labels). We locate them by finding
        // icon elements near the "Text" group label. The layout has 2 rows:
        //   Row 0: Bold, Italic, EditHyperlink, RemoveHyperlink
        //   Row 1: Font, Color, BackColor, (maybe Underline, Strike too)
        // "Set Font" is Row 1 index 0, "Text Color" is Row 1 index 1.
        positions = await getLeafTextPositions(page);
        const textGroupLabel = positions.find(p => p.text === 'Text');
        const iconLabelsLabel = positions.find(p => p.text === 'Icon Labels');

        let fontBtnPos = null;
        let colorBtnPos = null;

        if (textGroupLabel) {
            // Search area: above the "Text" label, roughly the group's width
            const xMin = textGroupLabel.left - 20;
            const xMax = iconLabelsLabel ? iconLabelsLabel.left : textGroupLabel.right + 200;
            const yMin = textGroupLabel.top - 100;
            const yMax = textGroupLabel.top;

            const icons = await findIconButtonsInArea(page, xMin, xMax, yMin, yMax);
            const rows = groupIntoRows(icons, 5);

            console.log(`  Icon rows in Text group: ${rows.map(r => r.length).join(', ')} (total ${icons.length})`);
            for (let ri = 0; ri < rows.length; ri++) {
                console.log(`    Row ${ri}: ${rows[ri].map(i => `(${Math.round(i.cx)},${Math.round(i.cy)})`).join(' ')}`);
            }

            // In a 2-row arrangement, the last row starts with Group 2 (Font, Color,
            // BackColor) followed by Group 3 (EditHyperlink, RemoveHyperlink).
            // Font is always at index 0, Color at index 1 in the last row.
            if (rows.length >= 2) {
                const lastRow = rows[rows.length - 1];
                if (lastRow.length >= 2) {
                    fontBtnPos = lastRow[0];
                    colorBtnPos = lastRow[1];
                }
                if (fontBtnPos) {
                    pass(`Found Font icon at (${Math.round(fontBtnPos.cx)}, ${Math.round(fontBtnPos.cy)})`);
                }
            }
        }

        // Record leaf texts BEFORE opening the dialog (to detect new dialog texts)
        const textsBeforeFont = await getLeafTextPositions(page);

        if (fontBtnPos) {
            await clickAt(page, fontBtnPos.cx, fontBtnPos.cy);
            await sleep(3000);
            pass('Clicked Font icon button');
        } else {
            fail('Font button', 'Could not locate Font icon button in Text group');
        }

        // -- Font dialog interaction using "new texts" approach --
        const textsAfterFont = await getLeafTextPositions(page);
        const newFontTexts = findNewTexts(textsBeforeFont, textsAfterFont);
        console.log(`  Dialog new texts: ${newFontTexts.map(t => t.text).join(', ')}`);

        const chooseFontTitle = newFontTexts.find(p => p.text === 'Choose Font');
        if (!chooseFontTitle) {
            fail('Font dialog', 'Dialog did not appear');
        } else {
            pass('Font dialog opened');

            const knownLabels = new Set([
                'Choose Font', 'Font:', 'Size:', 'Preview:', 'ABCxyz', 'OK', 'Cancel'
            ]);
            const sizeLabel = newFontTexts.find(p => p.text === 'Size:');

            // Instead of clicking list items, directly type in the Size text box.
            // The Size text box is below the "Size:" label.
            // First select a font by clicking the font name in the font list.
            const fontNames = newFontTexts.filter(p =>
                !knownLabels.has(p.text) &&
                !/^\d+$/.test(p.text) &&
                (sizeLabel ? p.cx < sizeLabel.cx : p.cx < chooseFontTitle.cx + 100)
            );
            console.log(`  Font names: ${fontNames.map(f => f.text).join(', ')}`);

            if (fontNames.length > 0) {
                await clickAt(page, fontNames[0].cx, fontNames[0].cy);
                await sleep(1000);
                pass(`Selected font: "${fontNames[0].text}"`);
            } else {
                fail('Select font', 'No font names found in dialog');
            }

            // Type the desired size directly in the Size text box
            // The text box is right below "Size:" label
            if (sizeLabel) {
                // The text box is below the Size: label — click just below it
                const sizeBoxX = sizeLabel.cx;
                const sizeBoxY = sizeLabel.bottom + 10;
                await clickAt(page, sizeBoxX, sizeBoxY);
                await sleep(500);
                await page.keyboard.press('Control+a');
                await sleep(300);
                await page.keyboard.type(String(BIG_SIZE));
                await sleep(1000);
                pass(`Typed size ${BIG_SIZE} in Size text box`);
            } else {
                fail('Size text box', 'Could not find Size: label');
            }

            // Click OK
            await sleep(500);
            const fontOk = newFontTexts.find(p => p.text === 'OK');
            if (fontOk) {
                await clickAt(page, fontOk.cx, fontOk.cy);
                await sleep(3000);
                pass('Clicked OK in font dialog');
            } else {
                fail('Font dialog OK', 'Could not find OK button');
            }

            // Verify dialog closed
            const afterFontOk = await getLeafTextPositions(page);
            if (afterFontOk.some(p => p.text === 'Choose Font')) {
                fail('Font dialog close', 'Font dialog still open after clicking OK');
            } else {
                pass('Font dialog closed');
            }
        }

        // =================================================================
        // Step 6: Select H..M → Color dialog
        // =================================================================
        console.log('\nStep 6: Select H..M and apply text color');
        // Re-focus editor
        const editorPos2 = await findEditorCenter(page);
        if (editorPos2) {
            await clickAt(page, editorPos2.cx, editorPos2.cy);
            await sleep(1000);
        }

        // Home, Right 7, Shift+Right 6
        await page.keyboard.press('Home');
        await sleep(500);
        for (let i = 0; i < 7; i++) {
            await page.keyboard.press('ArrowRight');
            await sleep(200);
        }
        for (let i = 0; i < 6; i++) {
            await page.keyboard.press('Shift+ArrowRight');
            await sleep(200);
        }
        await sleep(1000);
        pass('Selected H..M');

        // Record texts before opening color dialog
        const textsBeforeColor = await getLeafTextPositions(page);

        // Click "Text Color ..." icon button
        if (colorBtnPos) {
            await clickAt(page, colorBtnPos.cx, colorBtnPos.cy);
            await sleep(3000);
            pass('Clicked Text Color icon button');
        } else {
            fail('Color button', 'Could not locate Text Color icon button');
        }

        // -- Color dialog interaction using "new texts" approach --
        const textsAfterColor = await getLeafTextPositions(page);
        const newColorTexts = findNewTexts(textsBeforeColor, textsAfterColor);
        console.log(`  Color dialog new texts: ${newColorTexts.map(t => t.text).join(', ')}`);

        const redLabel = newColorTexts.find(p => p.text === 'Red:');
        if (!redLabel) {
            fail('Color dialog', `Dialog did not appear. New texts: ${newColorTexts.map(t=>t.text).join(', ')}`);
        } else {
            pass('Color dialog opened');

            // Click into the Red text box (to the right of the "Red:" label)
            const redBoxX = redLabel.right + 40;
            const redBoxY = redLabel.cy;
            await clickAt(page, redBoxX, redBoxY);
            await sleep(500);

            // Select all and type "0"
            await page.keyboard.press('Control+a');
            await sleep(300);
            await page.keyboard.type('0');
            await sleep(1000);
            pass('Set Red to 0');

            // Click OK
            await sleep(500);
            const colorOk = newColorTexts.find(p => p.text === 'OK');
            if (colorOk) {
                await clickAt(page, colorOk.cx, colorOk.cy);
                await sleep(3000);
                pass('Clicked OK in color dialog');
            } else {
                fail('Color dialog OK', 'Could not find OK button');
            }

            // Verify dialog closed
            const afterColorOk = await getLeafTextPositions(page);
            if (afterColorOk.some(p => p.text === 'Red:')) {
                fail('Color dialog close', 'Color dialog still open after clicking OK');
            } else {
                pass('Color dialog closed');
            }
        }

        // =================================================================
        // Step 7: VERIFY after color applied
        // =================================================================
        console.log('\nStep 7: Verify formatting (after color applied)');

        // Click editor to deselect, then press Right to clear selection
        const editorPos3 = await findEditorCenter(page);
        if (editorPos3) {
            await clickAt(page, editorPos3.cx, editorPos3.cy);
            await sleep(1000);
        }
        await page.keyboard.press('End');
        await sleep(1000);

        allChars = await getDocCharStyles(page);
        styles = extractTypedStyles(allChars);
        console.log(`  Styles: ${dumpStyles(styles)}`);

        const detectedBigSize = styles ? Math.max(...styles.slice(2, 11).map(s => s.fontSize)) : BIG_SIZE;
        console.log(`  Detected big size: ${detectedBigSize}px, default: ${defaultSize}px`);
        const effectiveBigSize = detectedBigSize > defaultSize ? detectedBigSize : BIG_SIZE;

        verifyFormatting(styles, 0, defaultSize, effectiveBigSize, pass, fail, 'Verify after color');

        // =================================================================
        // Step 8: Click editor + Home → VERIFY
        // =================================================================
        console.log('\nStep 8: Press Home and verify');
        const editorPos4 = await findEditorCenter(page);
        if (editorPos4) {
            await clickAt(page, editorPos4.cx, editorPos4.cy);
            await sleep(1000);
        }
        await page.keyboard.press('Home');
        await sleep(2000);

        allChars = await getDocCharStyles(page);
        styles = extractTypedStyles(allChars);
        console.log(`  Styles: ${dumpStyles(styles)}`);
        verifyFormatting(styles, 0, defaultSize, effectiveBigSize, pass, fail, 'Verify after Home');

        // =================================================================
        // Step 9: Shift+Right 14 times with verification each time
        // =================================================================
        console.log('\nStep 9: Shift+Right loop (14 presses)');
        for (let press = 1; press <= 14; press++) {
            await page.keyboard.press('Shift+ArrowRight');
            await sleep(1500);

            allChars = await getDocCharStyles(page);
            styles = extractTypedStyles(allChars);
            const label = `Press ${press}: select [0..${press})`;
            if (!styles) {
                fail(label, `Could not find "${TYPED_TEXT}"`);
                console.log(`    chars: ${allChars.map(c => c.char).join('')}`);
            } else {
                console.log(`    ${dumpStyles(styles)}`);
                verifyFormatting(styles, press, defaultSize, effectiveBigSize, pass, fail, label);
            }
        }

        // =================================================================
        // Summary
        // =================================================================
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Results: ${passed} passed, ${failed} failed`);
        if (failed > 0) {
            process.exitCode = 1;
        }

    } catch (error) {
        console.error(`[error] ${error.message}`);
        console.error(error.stack);
        process.exitCode = 1;
    } finally {
        if (browser !== null) {
            await browser.close();
        }
        killServer();
    }
}

main();
