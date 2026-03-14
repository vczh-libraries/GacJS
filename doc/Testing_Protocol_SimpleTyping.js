// Testing_Protocol_SimpleTyping.js
//
// Standalone Playwright test script for the GacUI remote protocol.
//
// Usage:
//   cd Gaclib
//   node ../doc/Testing_Protocol_SimpleTyping.js
//
// Prerequisites:
//   - yarn build  (in Gaclib/)
//   - RemotingTest_Core.exe built (via scripts/start-test-server.ps1)
//   - npx playwright install chromium  (first time only)
//
// Test plan (the goal of the test plan cannot be changed):
//   1. Launch the application (start the C++ server, open index.html in Playwright).
//   2. Open the "Control" tab, find the text box next to the "Search:" label.
//   3. Type text into the text box. Typing is implemented by sending IOChar messages.
//      The client sends IOChar events and the core side judges which text box is active.
//   4. Verify that the typed text appears in the text box.
//   5. Kill the process directly and close the webpage. No elegant exit is needed.

const {
    sleep,
    getLeafTextPositions,
    clickAt,
    runTest
} = require('./Testing_Protocol');

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
// Main
// ---------------------------------------------------------------------------

async function main() {
    const result = await runTest('SimpleTyping', async (page, pass, fail) => {
        // =====================================================================
        // Step 1: Verify page loaded
        // =====================================================================
        console.log('\nStep 1: Page rendering');
        const initial = await getLeafTexts(page);
        if (initial.length >= 20) {
            pass(`Page rendered with ${initial.length} leaf text elements`);
        } else {
            fail('Page rendering', `Expected >=20 leaf texts, got ${initial.length}`);
        }

        // =====================================================================
        // Step 2: Open the "Control" tab
        // =====================================================================
        console.log('\nStep 2: Open the Control tab');
        let positions = await getLeafTextPositions(page);
        const controlTabPos = positions.find(p => p.text === 'Control');

        if (controlTabPos === undefined) {
            fail('Control tab', 'Could not find "Control" tab header');
        } else {
            // Click on the Control tab
            await clickAt(page, controlTabPos.cx, controlTabPos.cy);
            await sleep(5000);

            const afterControl = await getLeafTexts(page);
            if (afterControl.includes('Search:') || afterControl.includes('Search:  ') || afterControl.some(t => t.startsWith('Search'))) {
                pass('Control tab switched — "Search:" label found');
            } else if (afterControl.includes('Document Editor (Ribbon)') || afterControl.includes('TextBox')) {
                pass('Control tab switched — sub-tab headers visible');
            } else {
                fail('Control tab switch', `"Search:" not found after clicking Control tab. Texts: ${afterControl.slice(0, 30).join(', ')}`);
            }
        }

        // =====================================================================
        // Step 3: Find the text box next to "Search:" and click on it
        // =====================================================================
        console.log('\nStep 3: Find and click the text box next to "Search:"');
        positions = await getLeafTextPositions(page);
        const searchLabelPos = positions.find(p => p.text.startsWith('Search'));

        if (searchLabelPos === undefined) {
            fail('Search label', 'Could not find "Search:" label');
        } else {
            pass(`Found "Search:" label at (${Math.round(searchLabelPos.cx)}, ${Math.round(searchLabelPos.cy)})`);

            // Click to the right of "Search:" where the text box should be
            const textBoxX = searchLabelPos.right + 30;
            const textBoxY = searchLabelPos.cy;
            await clickAt(page, textBoxX, textBoxY);
            await sleep(2000);
            pass(`Clicked text box area at (${Math.round(textBoxX)}, ${Math.round(textBoxY)})`);
        }

        // =====================================================================
        // Step 4: Type text into the text box
        // =====================================================================
        console.log('\nStep 4: Type text');
        const testText = 'Hello';

        // Click on the text box area to focus it on the server side
        if (searchLabelPos !== undefined) {
            const textBoxX = searchLabelPos.right + 30;
            const textBoxY = searchLabelPos.cy;
            await clickAt(page, textBoxX, textBoxY);
            await sleep(2000);
        }

        // Type characters one at a time with delay
        for (const ch of testText) {
            await page.keyboard.press(ch);
            await sleep(300);
        }
        await sleep(5000);
        pass(`Typed "${testText}" via keyboard`);

        // =====================================================================
        // Step 5: Verify typed text appears
        // =====================================================================
        console.log('\nStep 5: Verify typed text');

        // Check the full text content of #gacui-screen (not just leaf divs)
        // DocumentParagraph text is in <span> elements inside line <div>s,
        // so searching only leaf divs would miss it.
        const screenText = await page.evaluate(() => {
            const screen = document.getElementById('gacui-screen');
            return screen !== null ? screen.textContent : '';
        });

        const foundTypedText = screenText.includes(testText);
        if (foundTypedText) {
            pass(`Typed text "${testText}" found in page`);
        } else {
            // Dump all text from spans for debugging
            const spanTexts = await page.evaluate(() => {
                const screen = document.getElementById('gacui-screen');
                if (!screen) return [];
                const texts = [];
                for (const el of screen.querySelectorAll('span')) {
                    const t = el.textContent.trim();
                    if (t !== '') texts.push(t);
                }
                return texts;
            });
            fail('Typed text verification', `"${testText}" not found. Span texts: ${spanTexts.join(', ')}`);
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
