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

/** Return per-character styles from the largest DocumentParagraph element. */
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
            const fs = parseFloat(span.style.fontSize) || 0;
            const color = span.style.color || '';
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

        // Click "Set Font ..." button
        positions = await getLeafTextPositions(page);
        const fontBtn = positions.find(p => p.text === 'Set Font ...');
        if (!fontBtn) {
            fail('Font button', `Could not find "Set Font ..." in: ${positions.map(p => p.text).join(', ')}`);
        } else {
            await clickAt(page, fontBtn.cx, fontBtn.cy);
            await sleep(3000);
            pass('Clicked "Set Font ..."');
        }

        // -- Font dialog interaction --
        positions = await getLeafTextPositions(page);
        const chooseFontTitle = positions.find(p => p.text === 'Choose Font');
        if (!chooseFontTitle) {
            fail('Font dialog', `Dialog did not appear. Texts: ${positions.map(p => p.text).join(', ')}`);
        } else {
            pass('Font dialog opened');

            // Identify dialog bounds (rough)
            const dlgLeft = chooseFontTitle.left - 10;
            const dlgTop = chooseFontTitle.top - 10;
            const dlgRight = dlgLeft + 400;
            const dlgBottom = dlgTop + 420;

            // Known dialog labels
            const knownLabels = new Set([
                'Choose Font', 'Font:', 'Size:', 'Preview:', 'ABCxyz', 'OK', 'Cancel'
            ]);

            // Find font names: non-numeric, non-label texts in left half of dialog
            const dlgMidX = (dlgLeft + dlgRight) / 2;
            const fontLabel = positions.find(p => p.text === 'Font:');
            const sizeLabel = positions.find(p => p.text === 'Size:');
            const fontNames = positions.filter(p =>
                p.cx >= dlgLeft && p.cx <= dlgMidX &&
                p.cy > (fontLabel ? fontLabel.cy + 10 : dlgTop + 30) &&
                p.cy < dlgBottom - 40 &&
                !knownLabels.has(p.text) &&
                !/^\d+$/.test(p.text)
            );

            console.log(`  Font names found: ${fontNames.map(f => f.text).join(', ')}`);

            if (fontNames.length > 0) {
                // Click the first font name
                await clickAt(page, fontNames[0].cx, fontNames[0].cy);
                await sleep(1000);
                pass(`Selected font: "${fontNames[0].text}"`);
            } else {
                fail('Select font', 'No font names found in dialog');
            }

            // Enter bigger size in the Size text box
            if (sizeLabel) {
                // The text box is below the "Size:" label
                const sizeBoxX = sizeLabel.cx;
                const sizeBoxY = sizeLabel.cy + 25;
                await clickAt(page, sizeBoxX, sizeBoxY);
                await sleep(500);
                await page.keyboard.press('Control+a');
                await sleep(300);
                await page.keyboard.type(String(BIG_SIZE));
                await sleep(1000);
                pass(`Typed size ${BIG_SIZE}`);
            } else {
                fail('Size text box', 'Could not find "Size:" label');
            }

            // Click OK
            await sleep(500);
            const okBtn = positions.find(p =>
                p.text === 'OK' &&
                p.cx >= dlgLeft && p.cx <= dlgRight &&
                p.cy >= dlgTop && p.cy <= dlgBottom
            );
            if (okBtn) {
                await clickAt(page, okBtn.cx, okBtn.cy);
                await sleep(3000);
                pass('Clicked OK in font dialog');
            } else {
                // Try finding OK anywhere
                if (await findAndClick(page, 'OK')) {
                    await sleep(3000);
                    pass('Clicked OK (fallback)');
                } else {
                    fail('Font dialog OK', 'Could not find OK button');
                }
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

        // Click "Text Color ..." button
        positions = await getLeafTextPositions(page);
        const colorBtn = positions.find(p => p.text === 'Text Color ...');
        if (!colorBtn) {
            fail('Color button', `Could not find "Text Color ..." in: ${positions.map(p => p.text).join(', ')}`);
        } else {
            await clickAt(page, colorBtn.cx, colorBtn.cy);
            await sleep(3000);
            pass('Clicked "Text Color ..."');
        }

        // -- Color dialog interaction --
        positions = await getLeafTextPositions(page);
        const redLabel = positions.find(p => p.text === 'Red:');
        if (!redLabel) {
            fail('Color dialog', `Dialog did not appear. Texts: ${positions.map(p => p.text).join(', ')}`);
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
            const colorDlgOk = positions.find(p => p.text === 'OK');
            if (colorDlgOk) {
                await clickAt(page, colorDlgOk.cx, colorDlgOk.cy);
                await sleep(3000);
                pass('Clicked OK in color dialog');
            } else {
                fail('Color dialog OK', 'Could not find OK button');
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
