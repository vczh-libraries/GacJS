// Testing_Protocol_ImageInText.js
//
// Standalone Playwright test script for GacUI inline image insertion and
// rendering in the rich-text document editor.
//
// Usage:
//   cd Gaclib
//   node ../doc/Testing_Protocol_ImageInText.js
//
// Prerequisites:
//   - yarn build  (in Gaclib/)
//   - RemotingTest_Core.exe built (via scripts/start-test-server.ps1)
//   - npx playwright install chromium  (first time only)
//   - C:\5900.png must exist on disk
//
// Test plan (the goal of the test plan cannot be changed):
//   1. Launch the application (start the C++ server, open index.html in Playwright).
//   2. Open the "Control" tab, click the rich-text document editor (large area
//      at the bottom).
//   3. Type ABC into the editor.
//   4. Click the "Insert" tab in the ribbon, then click "Insert Image ..." button.
//      In the file dialog, double-click C: on the right list to navigate into the
//      C: drive. Then click the filename text box, type 5900.png, click OK.
//      An image is inserted after ABC on the same line.
//   5. Press Home, then type X.
//      [VERIFY] The content is XABC followed by an inline image that is visible.
//   6. Press Ctrl+A to select all content.
//      [VERIFY] The content is XABC followed by an inline image, and the image has
//      a visible selection indicator (background overlay).
//   7. Kill the process directly and close the webpage. No elegant exit is needed.

const {
    sleep,
    getLeafTextPositions,
    findEditorCenter,
    clickAt,
    findAndClick,
    findNewTexts,
    runTest
} = require('./Testing_Protocol');

const TYPED_TEXT = 'ABC';

// ---------------------------------------------------------------------------
// Helpers (unique to this test)
// ---------------------------------------------------------------------------

/**
 * Check the editor content: extract text and inline images.
 * Returns { text, images } where text is all span text joined,
 * and images is an array of { hasSrc, width, height, parentBgColor } for each <img>.
 */
async function getEditorContent(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) return { text: '', images: [] };
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
        if (!container) return { text: '', images: [] };

        // Collect text from spans
        let text = '';
        for (const span of container.querySelectorAll('span')) {
            // Only count direct text content (not from child spans)
            for (const node of span.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            }
        }

        // Collect images
        const images = [];
        for (const img of container.querySelectorAll('img')) {
            const parentSpan = img.parentElement;
            // Check for selection overlay: look for a sibling div or the parent span's background
            let hasSelectionOverlay = false;
            if (parentSpan !== null) {
                // Check if the parent span has a background-color set with non-zero alpha
                const bgColor = parentSpan.style.backgroundColor;
                if (bgColor && bgColor !== '' && bgColor !== 'transparent') {
                    hasSelectionOverlay = true;
                }
                // Also check for an overlay div sibling
                for (const sibling of parentSpan.children) {
                    if (sibling !== img && sibling.tagName === 'DIV') {
                        const sibBg = sibling.style.backgroundColor;
                        if (sibBg && sibBg !== '' && sibBg !== 'transparent') {
                            hasSelectionOverlay = true;
                        }
                    }
                }
            }
            images.push({
                hasSrc: img.src !== '' && img.src !== 'about:blank',
                width: img.getBoundingClientRect().width,
                height: img.getBoundingClientRect().height,
                hasSelectionOverlay
            });
        }
        return { text, images };
    });
}

async function doubleClickAt(page, x, y) {
    await page.mouse.move(x, y);
    await sleep(200);
    await page.mouse.down({ clickCount: 1 });
    await sleep(50);
    await page.mouse.up({ clickCount: 1 });
    await sleep(50);
    await page.mouse.down({ clickCount: 2 });
    await sleep(50);
    await page.mouse.up({ clickCount: 2 });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const result = await runTest('ImageInText', async (page, pass, fail) => {
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
        // Step 3: Click the rich text editor and type ABC
        // =================================================================
        console.log('\nStep 3: Click the rich-text editor and type ABC');
        const editorPos = await findEditorCenter(page);
        if (!editorPos) {
            fail('Find editor', 'Could not find pre-wrap element for DocumentParagraph');
        } else {
            await clickAt(page, editorPos.cx, editorPos.cy);
            await sleep(2000);
            pass(`Clicked editor at (${Math.round(editorPos.cx)}, ${Math.round(editorPos.cy)})`);
        }

        // Select all and delete existing content
        await page.keyboard.press('Control+a');
        await sleep(1000);
        await page.keyboard.press('Delete');
        await sleep(2000);

        // Type ABC
        for (const ch of TYPED_TEXT) {
            await page.keyboard.press(ch);
            await sleep(200);
        }
        await sleep(3000);

        let content = await getEditorContent(page);
        if (content.text.includes(TYPED_TEXT)) {
            pass(`Typed text found: "${content.text}"`);
        } else {
            fail('Type text', `"${TYPED_TEXT}" not found in editor. Got: "${content.text}"`);
        }

        // =================================================================
        // Step 4: Click Insert tab, then Insert Image
        // =================================================================
        console.log('\nStep 4: Switch to Insert tab and insert image');

        // Find and click the "Insert" ribbon tab (inside the document editor)
        positions = await getLeafTextPositions(page);
        const insertTab = positions.find(p => p.text === 'Insert');
        if (insertTab) {
            await clickAt(page, insertTab.cx, insertTab.cy);
            await sleep(3000);
            pass('Clicked Insert ribbon tab');
        } else {
            fail('Insert tab', 'Could not find "Insert" text in ribbon');
        }

        // Find and click "Insert Image ..." button
        positions = await getLeafTextPositions(page);
        const insertImageBtn = positions.find(p => p.text === 'Insert Image ...');
        if (!insertImageBtn) {
            // Try partial match
            const altBtn = positions.find(p => p.text.includes('Insert Image'));
            if (altBtn) {
                await clickAt(page, altBtn.cx, altBtn.cy);
                await sleep(3000);
                pass(`Clicked Insert Image button (text: "${altBtn.text}")`);
            } else {
                fail('Insert Image button', `Could not find "Insert Image ..." button. Available: ${positions.map(p => p.text).join(', ')}`);
            }
        } else {
            await clickAt(page, insertImageBtn.cx, insertImageBtn.cy);
            await sleep(3000);
            pass('Clicked Insert Image ... button');
        }

        // =================================================================
        // Step 4b: Handle the file dialog
        // =================================================================
        console.log('\nStep 4b: Handle file dialog');
        await sleep(3000);

        // Detect the file dialog by looking for new texts
        const textsBeforeDialog = positions; // already captured
        const textsAfterDialog = await getLeafTextPositions(page);
        const newDialogTexts = findNewTexts(textsBeforeDialog, textsAfterDialog);
        console.log(`  Dialog new texts: ${newDialogTexts.map(t => t.text).join(', ')}`);

        // Look for the dialog title "Select an Image" or similar
        const dialogTitle = newDialogTexts.find(p =>
            p.text === 'Select an Image' || p.text.includes('Image') || p.text.includes('Select')
        );
        if (dialogTitle) {
            pass(`File dialog opened: "${dialogTitle.text}"`);
        } else {
            // The dialog might still be there, just detect by new text elements
            if (newDialogTexts.length > 0) {
                pass(`File dialog detected (${newDialogTexts.length} new elements)`);
            } else {
                fail('File dialog', 'No new dialog elements detected');
            }
        }

        // Find the filename text box in the dialog.
        // The text box is near the bottom of the dialog. We look for input-like areas.
        // Strategy: find all new text positions, the filename text box should be near
        // labels like a filename label. We'll click to the right of it or below the lists.

        // Find the dialog bounds: use new text positions to estimate
        let dialogBounds = null;
        if (newDialogTexts.length > 0) {
            const minX = Math.min(...newDialogTexts.map(t => t.left));
            const maxX = Math.max(...newDialogTexts.map(t => t.left + t.width));
            const minY = Math.min(...newDialogTexts.map(t => t.top));
            const maxY = Math.max(...newDialogTexts.map(t => t.top + t.height));
            dialogBounds = { minX, maxX, minY, maxY };
            console.log(`  Dialog bounds: (${Math.round(minX)},${Math.round(minY)}) to (${Math.round(maxX)},${Math.round(maxY)})`);
        }

        // Find OK-like button and the filename area. The dialog has:
        // - Two list panels (top)
        // - A filename label + text box (bottom area)
        // - OK / Cancel buttons (very bottom)
        // We need to find the text box. Look for a pre-wrap div near the bottom
        // of the dialog, or just click in the area above the OK button.

        // Find OK/Open/Cancel buttons
        const okBtn = newDialogTexts.find(p =>
            p.text === 'OK' || p.text === 'Open' || p.text === '打开'
        );
        const cancelBtn = newDialogTexts.find(p =>
            p.text === 'Cancel' || p.text === '取消'
        );

        if (okBtn) {
            console.log(`  OK button found: "${okBtn.text}" at (${Math.round(okBtn.cx)}, ${Math.round(okBtn.cy)})`);
        }

        // The filename text box should be above the OK/Cancel buttons.
        // First, double-click "C:" in the right list to navigate into the C: drive.
        const cDriveItem = newDialogTexts.find(p => p.text === 'C:');
        if (cDriveItem) {
            await doubleClickAt(page, cDriveItem.cx, cDriveItem.cy);
            await sleep(5000);
            pass(`Double-clicked C: at (${Math.round(cDriveItem.cx)}, ${Math.round(cDriveItem.cy)})`);
        } else {
            fail('C: drive', `Could not find "C:" in dialog. Available: ${newDialogTexts.map(t => t.text).join(', ')}`);
        }

        // Now click the filename text box and type just the filename
        // Re-detect dialog elements after navigation
        const textsAfterNav = await getLeafTextPositions(page);
        const newNavTexts = findNewTexts(textsBeforeDialog, textsAfterNav);
        const okBtnAfterNav = newNavTexts.find(p =>
            p.text === 'OK' || p.text === 'Open' || p.text === '打开'
        );
        const navDialogBounds = (() => {
            if (newNavTexts.length === 0) return dialogBounds;
            const minX = Math.min(...newNavTexts.map(t => t.left));
            const maxX = Math.max(...newNavTexts.map(t => t.left + t.width));
            const minY = Math.min(...newNavTexts.map(t => t.top));
            const maxY = Math.max(...newNavTexts.map(t => t.top + t.height));
            return { minX, maxX, minY, maxY };
        })();

        const effectiveOk = okBtnAfterNav || okBtn;
        const effectiveBounds = navDialogBounds || dialogBounds;

        if (effectiveOk && effectiveBounds) {
            const textBoxX = (effectiveBounds.minX + effectiveBounds.maxX) / 2 + 50;
            const textBoxY = effectiveOk.top - 30;
            await clickAt(page, textBoxX, textBoxY);
            await sleep(1000);
            pass(`Clicked filename area at (${Math.round(textBoxX)}, ${Math.round(textBoxY)})`);
        } else if (effectiveBounds) {
            const textBoxX = (effectiveBounds.minX + effectiveBounds.maxX) / 2 + 50;
            const textBoxY = effectiveBounds.maxY - 50;
            await clickAt(page, textBoxX, textBoxY);
            await sleep(1000);
            pass('Clicked estimated filename area (fallback)');
        }

        // Clear any existing text and type just the filename
        await page.keyboard.press('Control+a');
        await sleep(300);
        await page.keyboard.type('5900.png');
        await sleep(2000);
        pass('Typed file path: 5900.png');

        // Click OK
        if (effectiveOk) {
            await clickAt(page, effectiveOk.cx, effectiveOk.cy);
            await sleep(5000);
            pass(`Clicked ${effectiveOk.text} button`);
        } else {
            fail('OK button', 'Could not find OK/Open button in dialog');
        }

        // Verify dialog closed
        const afterOk = await getLeafTextPositions(page);
        if (afterOk.some(p => p.text === 'Select an Image')) {
            fail('Dialog close', 'File dialog still open after clicking OK');
        } else {
            pass('File dialog closed');
        }

        // Verify image was inserted
        await sleep(3000);
        content = await getEditorContent(page);
        console.log(`  After insert: text="${content.text}", images=${content.images.length}`);
        if (content.images.length > 0) {
            pass(`Image inserted (${content.images.length} image(s) found)`);
        } else {
            fail('Image insert', 'No <img> element found in editor after insert');
        }

        // =================================================================
        // Step 5: Press Home, type X
        // =================================================================
        console.log('\nStep 5: Press Home and type X');

        // Re-focus the editor
        const editorPos2 = await findEditorCenter(page);
        if (editorPos2) {
            await clickAt(page, editorPos2.cx, editorPos2.cy);
            await sleep(1000);
        }

        await page.keyboard.press('Home');
        await sleep(1000);
        await page.keyboard.press('X');
        await sleep(3000);

        // =================================================================
        // [VERIFY] Step 5: Content is XABC followed by a visible image
        // =================================================================
        console.log('\nStep 5 [VERIFY]: XABC followed by visible image');
        content = await getEditorContent(page);
        console.log(`  Content: text="${content.text}", images=${JSON.stringify(content.images)}`);

        const expectedText = 'X' + TYPED_TEXT; // XABC
        if (content.text.includes(expectedText)) {
            pass(`Text is "${expectedText}"`);
        } else {
            fail('Text content', `Expected "${expectedText}", got "${content.text}"`);
        }

        if (content.images.length > 0) {
            const img = content.images[0];
            if (img.hasSrc) {
                pass('Image is visible (has valid src)');
            } else {
                fail('Image visible', 'Image exists but has no src (invisible)');
            }
            if (img.width > 0 && img.height > 0) {
                pass(`Image has size: ${img.width}x${img.height}`);
            } else {
                fail('Image size', `Image has zero size: ${img.width}x${img.height}`);
            }
        } else {
            fail('Image present', 'No <img> element found after typing X');
        }

        // =================================================================
        // Step 6: Press Ctrl+A to select all
        // =================================================================
        console.log('\nStep 6: Press Ctrl+A');
        await page.keyboard.press('Control+a');
        await sleep(3000);

        // =================================================================
        // [VERIFY] Step 6: Image present with selection indicator
        // =================================================================
        console.log('\nStep 6 [VERIFY]: XABC with image and selection indicator');
        content = await getEditorContent(page);
        console.log(`  Content: text="${content.text}", images=${JSON.stringify(content.images)}`);

        if (content.text.includes(expectedText)) {
            pass(`Text is "${expectedText}" (after Ctrl+A)`);
        } else {
            fail('Text content (selected)', `Expected "${expectedText}", got "${content.text}"`);
        }

        if (content.images.length > 0) {
            const img = content.images[0];
            if (img.hasSrc) {
                pass('Image is visible after Ctrl+A');
            } else {
                fail('Image visible (selected)', 'Image has no src after Ctrl+A');
            }
            if (img.hasSelectionOverlay) {
                pass('Image has selection indicator');
            } else {
                fail('Image selection', 'Image has no visible selection indicator (no background overlay)');
            }
        } else {
            fail('Image present (selected)', 'No <img> element found after Ctrl+A');
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
