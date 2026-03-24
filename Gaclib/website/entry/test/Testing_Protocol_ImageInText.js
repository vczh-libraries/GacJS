// Testing_Protocol_ImageInText.js
//
// Vitest test suite for inline image insertion and rendering in the
// GacUI rich-text document editor.
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

import { describe, test, expect } from 'vitest';
import {
    getLeafTextPositions,
    findEditorCenter,
    clickAt,
    findAndClick,
    findNewTexts,
    waitForIdle,
    setupProtocolTest
} from './Testing_Protocol.js';

const TYPED_TEXT = 'ABC';

// ---------------------------------------------------------------------------
// Helpers (unique to this test)
// ---------------------------------------------------------------------------

/**
 * Check the editor content: extract text and inline images.
 * Returns { text, images } where text is all span text joined,
 * and images is an array of { hasSrc, width, height, hasSelectionOverlay }.
 */
async function getEditorContent(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) return { text: '', images: [] };
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

        let text = '';
        for (const span of container.querySelectorAll('span')) {
            for (const node of span.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            }
        }

        const images = [];
        for (const img of container.querySelectorAll('img')) {
            const parentSpan = img.parentElement;
            let hasSelectionOverlay = false;
            if (parentSpan !== null) {
                const bgColor = parentSpan.style.backgroundColor;
                if (bgColor && bgColor !== '' && bgColor !== 'transparent') {
                    hasSelectionOverlay = true;
                }
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
    await page.mouse.down({ clickCount: 1 });
    await page.mouse.up({ clickCount: 1 });
    await page.mouse.down({ clickCount: 2 });
    await page.mouse.up({ clickCount: 2 });
    await waitForIdle(page);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ImageInText', () => {
    const ctx = setupProtocolTest();

    test('Step 1: Page rendering', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        expect(positions.length).toBeGreaterThanOrEqual(20);
    });

    test('Step 2: Open the Control tab', async () => {
        let positions = await getLeafTextPositions(ctx.page);
        expect(await findAndClick(ctx.page, 'Control', positions)).toBe(true);

        positions = await getLeafTextPositions(ctx.page);
        const docEditorTab = positions.find(p => p.text === 'Document Editor (Ribbon)');
        if (docEditorTab) {
            await clickAt(ctx.page, docEditorTab.cx, docEditorTab.cy);
        }
    });

    test('Step 3: Click editor and type ABC', async () => {
        const editorPos = await findEditorCenter(ctx.page);
        expect(editorPos).not.toBeNull();

        await clickAt(ctx.page, editorPos.cx, editorPos.cy);

        await ctx.page.keyboard.press('Control+a');
        await waitForIdle(ctx.page);
        await ctx.page.keyboard.press('Delete');
        await waitForIdle(ctx.page);

        for (const ch of TYPED_TEXT) {
            await ctx.page.keyboard.press(ch);
            await waitForIdle(ctx.page);
        }

        const content = await getEditorContent(ctx.page);
        expect(content.text).toContain(TYPED_TEXT);
    });

    test('Step 4: Insert image via ribbon dialog', async () => {
        // Click the "Insert" ribbon tab
        let positions = await getLeafTextPositions(ctx.page);
        const insertTab = positions.find(p => p.text === 'Insert');
        expect(insertTab, 'Could not find "Insert" ribbon tab').toBeDefined();

        await clickAt(ctx.page, insertTab.cx, insertTab.cy);

        // Click "Insert Image ..." button
        positions = await getLeafTextPositions(ctx.page);
        const insertImageBtn = positions.find(p => p.text.includes('Insert Image'));
        expect(insertImageBtn, 'Could not find "Insert Image" button').toBeDefined();

        await clickAt(ctx.page, insertImageBtn.cx, insertImageBtn.cy);

        // Detect the file dialog
        const textsBeforeDialog = positions;
        const textsAfterDialog = await getLeafTextPositions(ctx.page);
        const newDialogTexts = findNewTexts(textsBeforeDialog, textsAfterDialog);
        console.log(`  Dialog new texts: ${newDialogTexts.map(t => t.text).join(', ')}`);
        expect(newDialogTexts.length, 'File dialog not detected').toBeGreaterThan(0);

        // Double-click "C:" to navigate into the C: drive
        const cDriveItem = newDialogTexts.find(p => p.text === 'C:');
        if (cDriveItem) {
            await doubleClickAt(ctx.page, cDriveItem.cx, cDriveItem.cy);
        }

        // Find dialog bounds and OK button after navigation
        const textsAfterNav = await getLeafTextPositions(ctx.page);
        const newNavTexts = findNewTexts(textsBeforeDialog, textsAfterNav);
        const okBtn = newNavTexts.find(p =>
            p.text === 'OK' || p.text === 'Open' || p.text === '打开'
        ) || newDialogTexts.find(p =>
            p.text === 'OK' || p.text === 'Open' || p.text === '打开'
        );

        const dialogBounds = (() => {
            const texts = newNavTexts.length > 0 ? newNavTexts : newDialogTexts;
            if (texts.length === 0) return null;
            return {
                minX: Math.min(...texts.map(t => t.left)),
                maxX: Math.max(...texts.map(t => t.left + t.width)),
                minY: Math.min(...texts.map(t => t.top)),
                maxY: Math.max(...texts.map(t => t.top + t.height))
            };
        })();

        // Click filename text box area (above OK button)
        if (okBtn && dialogBounds) {
            const textBoxX = (dialogBounds.minX + dialogBounds.maxX) / 2 + 50;
            const textBoxY = okBtn.top - 30;
            await clickAt(ctx.page, textBoxX, textBoxY);
        } else if (dialogBounds) {
            const textBoxX = (dialogBounds.minX + dialogBounds.maxX) / 2 + 50;
            const textBoxY = dialogBounds.maxY - 50;
            await clickAt(ctx.page, textBoxX, textBoxY);
        }

        await ctx.page.keyboard.press('Control+a');
        await waitForIdle(ctx.page);
        await ctx.page.keyboard.type('5900.png');
        await waitForIdle(ctx.page);

        expect(okBtn, 'OK/Open button not found').toBeDefined();
        await clickAt(ctx.page, okBtn.cx, okBtn.cy);

        // Verify image was inserted
        const content = await getEditorContent(ctx.page);
        console.log(`  After insert: text="${content.text}", images=${content.images.length}`);
        expect.soft(content.images.length, 'Image should be inserted').toBeGreaterThan(0);
    });

    test('Step 5: Press Home, type X, verify XABC + image', async () => {
        const editorPos = await findEditorCenter(ctx.page);
        if (editorPos) {
            await clickAt(ctx.page, editorPos.cx, editorPos.cy);
        }

        await ctx.page.keyboard.press('Home');
        await waitForIdle(ctx.page);
        await ctx.page.keyboard.press('X');
        await waitForIdle(ctx.page);

        const content = await getEditorContent(ctx.page);
        console.log(`  Content: text="${content.text}", images=${JSON.stringify(content.images)}`);

        const expectedText = 'X' + TYPED_TEXT;
        expect.soft(content.text, `Text should be "${expectedText}"`).toContain(expectedText);
        expect.soft(content.images.length, 'Image should be present').toBeGreaterThan(0);

        if (content.images.length > 0) {
            expect.soft(content.images[0].hasSrc, 'Image should have valid src').toBe(true);
            expect.soft(content.images[0].width, 'Image width > 0').toBeGreaterThan(0);
            expect.soft(content.images[0].height, 'Image height > 0').toBeGreaterThan(0);
        }
    });

    test('Step 6: Ctrl+A and verify selection indicator', async () => {
        await ctx.page.keyboard.press('Control+a');
        await waitForIdle(ctx.page);

        const content = await getEditorContent(ctx.page);
        console.log(`  Content: text="${content.text}", images=${JSON.stringify(content.images)}`);

        const expectedText = 'X' + TYPED_TEXT;
        expect.soft(content.text, `Text should be "${expectedText}" after Ctrl+A`).toContain(expectedText);
        expect.soft(content.images.length, 'Image should be present').toBeGreaterThan(0);

        if (content.images.length > 0) {
            expect.soft(content.images[0].hasSrc, 'Image should be visible after Ctrl+A').toBe(true);
            expect.soft(content.images[0].hasSelectionOverlay, 'Image should have selection indicator').toBe(true);
        }
    });
});
