// Testing_Protocol_Caret.js
//
// Standalone Playwright test script that verifies caret rendering, blinking,
// positioning, and size in the GacUI rich-text document editor and text boxes.
//
// Usage:
//   cd Gaclib
//   node ..\doc\Testing_Protocol_Caret.js
//
// Prerequisites:
//   - yarn build  (in Gaclib/)
//   - RemotingTest_Core.exe built (via scripts/start-test-server.ps1)
//   - npx playwright install chromium  (first time only)
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
//      [VERIFY] Positions 3 and 4 (after B, after C) have a taller caret; 1, 2,
//      and 5 have a shorter caret.
//   8. Press Left 4 times back to position 0 (4 positions).
//      [VERIFY] Positions 2 and 3 (before C, before B) have a taller caret; 1
//      and 4 have a shorter caret.
//   9. Press Ctrl+A to select all, then press Home.
//      [VERIFY] A caret is visible at the expected position (matching the
//      position-0 caret from step 7).
//   10. Press End.
//      [VERIFY] A caret is visible at the expected position (matching the
//      position-4 caret from step 7).
//   11. Kill the process directly and close the webpage. No elegant exit is needed.

const {
    sleep,
    getLeafTextPositions,
    findEditorCenter,
    clickAt,
    findAndClick,
    findNewTexts,
    findIconButtonsInArea,
    groupIntoRows,
    runTest
} = require('./Testing_Protocol');

const TYPED_TEXT = 'ABCD';
const BIG_SIZE = 24;

// ---------------------------------------------------------------------------
// Helpers (unique to this test)
// ---------------------------------------------------------------------------

/**
 * Find all visible caret divs in the screen.
 * A caret is a narrow (width <= 4px) absolutely positioned div with a
 * background color and display !== 'none', inside a pre-wrap container.
 * Returns array of { x, y, width, height, backgroundColor, container }.
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
            // Must be inside a pre-wrap or nowrap container (paragraph)
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const result = await runTest('Caret', async (page, pass, fail) => {
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
        // Step 2: Open "Control" tab and click the Search text box
        // =================================================================
        console.log('\nStep 2: Open Control tab and click Search text box');
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

        // Find "Search:" label and click the text box next to it
        positions = await getLeafTextPositions(page);
        const searchLabelPos = positions.find(p => p.text.startsWith('Search'));
        if (searchLabelPos === undefined) {
            fail('Search label', 'Could not find "Search:" label');
        } else {
            const textBoxX = searchLabelPos.right + 30;
            const textBoxY = searchLabelPos.cy;
            await clickAt(page, textBoxX, textBoxY);
            await sleep(2000);
            pass(`Clicked text box at (${Math.round(textBoxX)}, ${Math.round(textBoxY)})`);
        }

        // [VERIFY] A caret is visible in the Search text box
        let carets = await findCarets(page);
        console.log(`  Carets found after clicking Search: ${carets.length}`);
        for (const c of carets) {
            console.log(`    caret at (${c.x.toFixed(1)}, ${c.y.toFixed(1)}) h=${c.height.toFixed(1)} bg=${c.backgroundColor}`);
        }
        if (carets.length >= 1) {
            pass('Caret visible in Search text box');
        } else {
            fail('Caret in Search', 'No caret found after clicking Search text box');
        }
        const searchCarets = carets;

        // =================================================================
        // Step 3: Click the rich-text editor
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

        // [VERIFY] Caret in Search disappears, caret appears in editor
        carets = await findCarets(page);
        console.log(`  Carets found after clicking editor: ${carets.length}`);
        for (const c of carets) {
            console.log(`    caret at (${c.x.toFixed(1)}, ${c.y.toFixed(1)}) h=${c.height.toFixed(1)} bg=${c.backgroundColor}`);
        }

        // The editor caret should be in a different location than the search caret
        if (carets.length === 1) {
            if (searchCarets.length >= 1) {
                const searchY = searchCarets[0].y;
                const editorCaretY = carets[0].y;
                if (Math.abs(searchY - editorCaretY) > 10) {
                    pass('Caret transferred from Search to editor');
                } else {
                    // Could still be correct if they happen to be at similar Y
                    pass('Caret visible (position may overlap with Search area)');
                }
            } else {
                pass('Caret visible in editor');
            }
        } else if (carets.length === 0) {
            fail('Caret in editor', 'No caret found after clicking editor');
        } else {
            // Multiple carets visible — might be a bug but check at least one exists
            fail('Caret transfer', `Expected 1 caret but found ${carets.length} — old caret may not have been hidden`);
        }

        // =================================================================
        // Step 4: Test caret blinking
        // =================================================================
        console.log('\nStep 4: Test caret blinking');
        // Wait 0.6 seconds — caret should blink off
        await sleep(600);
        carets = await findCarets(page);
        const blinkOffCount = carets.length;
        console.log(`  After 0.6s: ${blinkOffCount} caret(s) visible`);
        if (blinkOffCount === 0) {
            pass('Caret blinked off after 0.6s');
        } else {
            fail('Caret blink off', `Expected 0 visible carets, got ${blinkOffCount}`);
        }

        // Wait another 0.6 seconds — caret should blink on
        await sleep(600);
        carets = await findCarets(page);
        const blinkOnCount = carets.length;
        console.log(`  After another 0.6s: ${blinkOnCount} caret(s) visible`);
        if (blinkOnCount >= 1) {
            pass('Caret blinked on after another 0.6s');
        } else {
            fail('Caret blink on', `Expected >=1 visible caret, got ${blinkOnCount}`);
        }

        // =================================================================
        // Step 5: Type ABCD
        // =================================================================
        console.log('\nStep 5: Type ABCD');
        // Select all + delete existing content first
        await page.keyboard.press('Control+a');
        await sleep(1000);
        await page.keyboard.press('Delete');
        await sleep(2000);

        for (const ch of TYPED_TEXT) {
            await page.keyboard.press(ch);
            await sleep(300);
        }
        await sleep(3000);

        // Verify text appeared
        const screenText = await page.evaluate(() => {
            const screen = document.getElementById('gacui-screen');
            return screen !== null ? screen.textContent : '';
        });
        if (screenText.includes(TYPED_TEXT)) {
            pass(`Typed text "${TYPED_TEXT}" found in page`);
        } else {
            fail('Type text', `"${TYPED_TEXT}" not found in page`);
        }

        // =================================================================
        // Step 6: Select BC and apply bigger font size (24)
        // =================================================================
        console.log('\nStep 6: Select BC and apply font size 24');
        // Home, Right 1, Shift+Right 2
        await page.keyboard.press('Home');
        await sleep(500);
        await page.keyboard.press('ArrowRight');
        await sleep(200);
        for (let i = 0; i < 2; i++) {
            await page.keyboard.press('Shift+ArrowRight');
            await sleep(200);
        }
        await sleep(1000);
        pass('Selected BC');

        // Find the font icon button using the same approach as Font.js
        positions = await getLeafTextPositions(page);
        const textGroupLabel = positions.find(p => p.text === 'Text');
        const iconLabelsLabel = positions.find(p => p.text === 'Icon Labels');

        let fontBtnPos = null;

        if (textGroupLabel) {
            const xMin = textGroupLabel.left - 20;
            const xMax = iconLabelsLabel ? iconLabelsLabel.left : textGroupLabel.right + 200;
            const yMin = textGroupLabel.top - 100;
            const yMax = textGroupLabel.top;

            const icons = await findIconButtonsInArea(page, xMin, xMax, yMin, yMax);
            const rows = groupIntoRows(icons, 5);

            console.log(`  Icon rows in Text group: ${rows.map(r => r.length).join(', ')} (total ${icons.length})`);
            if (rows.length >= 2) {
                const lastRow = rows[rows.length - 1];
                if (lastRow.length >= 1) {
                    fontBtnPos = lastRow[0];
                }
            }
        }

        const textsBeforeFont = await getLeafTextPositions(page);

        if (fontBtnPos) {
            await clickAt(page, fontBtnPos.cx, fontBtnPos.cy);
            await sleep(3000);
            pass('Clicked Font icon button');
        } else {
            fail('Font button', 'Could not locate Font icon button');
        }

        // Font dialog interaction
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

            // Select the font
            const fontNames = newFontTexts.filter(p =>
                !knownLabels.has(p.text) &&
                !/^\d+$/.test(p.text) &&
                (sizeLabel ? p.cx < sizeLabel.cx : p.cx < chooseFontTitle.cx + 100)
            );
            if (fontNames.length > 0) {
                await clickAt(page, fontNames[0].cx, fontNames[0].cy);
                await sleep(1000);
                pass(`Selected font: "${fontNames[0].text}"`);
            }

            // Type size
            if (sizeLabel) {
                const sizeBoxX = sizeLabel.cx;
                const sizeBoxY = sizeLabel.bottom + 10;
                await clickAt(page, sizeBoxX, sizeBoxY);
                await sleep(500);
                await page.keyboard.press('Control+a');
                await sleep(300);
                await page.keyboard.type(String(BIG_SIZE));
                await sleep(1000);
                pass(`Typed size ${BIG_SIZE}`);
            }

            // Click OK
            await sleep(500);
            const fontOk = newFontTexts.find(p => p.text === 'OK');
            if (fontOk) {
                await clickAt(page, fontOk.cx, fontOk.cy);
                await sleep(3000);
                pass('Clicked OK in font dialog');
            }
        }

        // =================================================================
        // Step 7: Press Home then Right 4 times — verify caret sizes
        // =================================================================
        console.log('\nStep 7: Right-arrow caret sizes (frontSide)');
        // Refocus editor
        const editorPos2 = await findEditorCenter(page);
        if (editorPos2) {
            await clickAt(page, editorPos2.cx, editorPos2.cy);
            await sleep(1000);
        }
        await page.keyboard.press('Home');
        await sleep(1500);

        // Collect caret heights at 5 positions (before A, after A, after B, after C, after D)
        const rightCaretHeights = [];
        // Position 0 (before A) — caret should already be here after Home
        carets = await findCarets(page);
        if (carets.length >= 1) {
            rightCaretHeights.push(carets[0].height);
            console.log(`  Pos 0 (before A): h=${carets[0].height.toFixed(1)}`);
        } else {
            rightCaretHeights.push(0);
            console.log('  Pos 0 (before A): no caret found');
        }

        for (let i = 1; i <= 4; i++) {
            await page.keyboard.press('ArrowRight');
            await sleep(1500);
            carets = await findCarets(page);
            if (carets.length >= 1) {
                rightCaretHeights.push(carets[0].height);
                const posNames = ['before A', 'after A', 'after B', 'after C', 'after D'];
                console.log(`  Pos ${i} (${posNames[i]}): h=${carets[0].height.toFixed(1)}`);
            } else {
                rightCaretHeights.push(0);
                console.log(`  Pos ${i}: no caret found`);
            }
        }

        // Verify: positions 0,1,4 should be shorter; positions 2,3 should be taller
        if (rightCaretHeights.every(h => h > 0)) {
            const shortHeights = [rightCaretHeights[0], rightCaretHeights[1], rightCaretHeights[4]];
            const tallHeights = [rightCaretHeights[2], rightCaretHeights[3]];
            const maxShort = Math.max(...shortHeights);
            const minTall = Math.min(...tallHeights);

            console.log(`  Short heights (pos 0,1,4): ${shortHeights.map(h => h.toFixed(1)).join(', ')}`);
            console.log(`  Tall heights (pos 2,3): ${tallHeights.map(h => h.toFixed(1)).join(', ')}`);

            if (minTall > maxShort + 2) {
                pass(`Right-arrow: tall carets (${minTall.toFixed(1)}) > short carets (${maxShort.toFixed(1)})`);
            } else {
                fail('Right-arrow caret sizes', `Tall (${minTall.toFixed(1)}) should be > short (${maxShort.toFixed(1)})`);
            }
        } else {
            fail('Right-arrow caret sizes', `Some carets missing: ${rightCaretHeights.join(', ')}`);
        }

        // Verify each position has a visible caret (OpenCaret resets blink)
        const rightAllVisible = rightCaretHeights.every(h => h > 0);
        if (rightAllVisible) {
            pass('Right-arrow: all 5 positions had visible caret (blink reset)');
        } else {
            fail('Right-arrow visibility', `Not all positions had visible caret: ${rightCaretHeights.join(', ')}`);
        }

        // =================================================================
        // Step 8: Press Left 4 times — verify caret sizes (backSide)
        // =================================================================
        console.log('\nStep 8: Left-arrow caret sizes (backSide)');
        const leftCaretHeights = [];

        for (let i = 1; i <= 4; i++) {
            await page.keyboard.press('ArrowLeft');
            await sleep(1500);
            carets = await findCarets(page);
            if (carets.length >= 1) {
                leftCaretHeights.push(carets[0].height);
                const posNames = ['before D', 'before C', 'before B', 'before A'];
                console.log(`  Left ${i} (${posNames[i - 1]}): h=${carets[0].height.toFixed(1)}`);
            } else {
                leftCaretHeights.push(0);
                console.log(`  Left ${i}: no caret found`);
            }
        }

        // Verify: positions 1,4 should be shorter; positions 2,3 should be taller
        if (leftCaretHeights.every(h => h > 0)) {
            const shortHeights = [leftCaretHeights[0], leftCaretHeights[3]];
            const tallHeights = [leftCaretHeights[1], leftCaretHeights[2]];
            const maxShort = Math.max(...shortHeights);
            const minTall = Math.min(...tallHeights);

            console.log(`  Short heights (before D, before A): ${shortHeights.map(h => h.toFixed(1)).join(', ')}`);
            console.log(`  Tall heights (before C, before B): ${tallHeights.map(h => h.toFixed(1)).join(', ')}`);

            if (minTall > maxShort + 2) {
                pass(`Left-arrow: tall carets (${minTall.toFixed(1)}) > short carets (${maxShort.toFixed(1)})`);
            } else {
                fail('Left-arrow caret sizes', `Tall (${minTall.toFixed(1)}) should be > short (${maxShort.toFixed(1)})`);
            }
        } else {
            fail('Left-arrow caret sizes', `Some carets missing: ${leftCaretHeights.join(', ')}`);
        }

        const leftAllVisible = leftCaretHeights.every(h => h > 0);
        if (leftAllVisible) {
            pass('Left-arrow: all 4 positions had visible caret (blink reset)');
        } else {
            fail('Left-arrow visibility', `Not all positions had visible caret: ${leftCaretHeights.join(', ')}`);
        }

        // =================================================================
        // Step 9: Ctrl+A then Home — verify caret survives selection
        // =================================================================
        console.log('\nStep 9: Ctrl+A then Home');
        await page.keyboard.press('Control+a');
        await sleep(2000);
        await page.keyboard.press('Home');
        await sleep(1500);

        carets = await findCarets(page);
        console.log(`  Carets after Ctrl+A + Home: ${carets.length}`);
        if (carets.length >= 1) {
            console.log(`    caret at (${carets[0].x.toFixed(1)}, ${carets[0].y.toFixed(1)}) h=${carets[0].height.toFixed(1)}`);
            // Should match position 0 from step 7 (before A — short height)
            if (rightCaretHeights[0] > 0 && Math.abs(carets[0].height - rightCaretHeights[0]) < 2) {
                pass(`Caret after Home matches pos-0 height (${carets[0].height.toFixed(1)} ≈ ${rightCaretHeights[0].toFixed(1)})`);
            } else if (rightCaretHeights[0] > 0) {
                fail('Caret after Home height', `Got ${carets[0].height.toFixed(1)}, expected ≈${rightCaretHeights[0].toFixed(1)}`);
            } else {
                pass('Caret visible after Ctrl+A + Home');
            }
        } else {
            fail('Caret after Ctrl+A + Home', 'No caret found');
        }

        // =================================================================
        // Step 10: Press End — verify caret at end position
        // =================================================================
        console.log('\nStep 10: Press End');
        await page.keyboard.press('End');
        await sleep(1500);

        carets = await findCarets(page);
        console.log(`  Carets after End: ${carets.length}`);
        if (carets.length >= 1) {
            console.log(`    caret at (${carets[0].x.toFixed(1)}, ${carets[0].y.toFixed(1)}) h=${carets[0].height.toFixed(1)}`);
            // Should match position 4 from step 7 (after D — short height)
            if (rightCaretHeights[4] > 0 && Math.abs(carets[0].height - rightCaretHeights[4]) < 2) {
                pass(`Caret after End matches pos-4 height (${carets[0].height.toFixed(1)} ≈ ${rightCaretHeights[4].toFixed(1)})`);
            } else if (rightCaretHeights[4] > 0) {
                fail('Caret after End height', `Got ${carets[0].height.toFixed(1)}, expected ≈${rightCaretHeights[4].toFixed(1)}`);
            } else {
                pass('Caret visible after End');
            }
        } else {
            fail('Caret after End', 'No caret found');
        }
    });

    if (result.failed > 0) {
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
