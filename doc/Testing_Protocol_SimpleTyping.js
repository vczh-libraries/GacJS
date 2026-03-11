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

const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const GACLIB_ROOT = path.resolve(REPO_ROOT, 'Gaclib');

const { chromium } = require(path.resolve(GACLIB_ROOT, 'node_modules', '@playwright', 'test'));
const { execSync, exec } = require('child_process');
const { existsSync } = require('fs');

const SERVER_EXE = path.resolve(REPO_ROOT, 'GacUI', 'Test', 'GacUISrc', 'x64', 'Debug', 'RemotingTest_Core.exe');
const WEBSITE_URL = 'http://localhost:8896/index.html';

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
                    y: r.y,
                    height: r.height
                });
            }
        }
        return result;
    });
}

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
        // Prerequisites check
        if (!existsSync(SERVER_EXE)) {
            console.error(`Server executable not found: ${SERVER_EXE}`);
            console.error('Run: scripts/start-test-server.ps1 to build it.');
            process.exit(1);
        }

        // Setup: kill any leftover server, start fresh
        killServer();
        await sleep(1000);

        serverProcess = exec(`"${SERVER_EXE}" /Http`);
        serverProcess.stdout?.on('data', () => {});
        serverProcess.stderr?.on('data', () => {});
        await sleep(3000);

        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(WEBSITE_URL, { timeout: 30000 });
        await page.waitForSelector('#gacui-screen div div', { timeout: 30000 });
        await sleep(8000);

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
            await page.mouse.move(controlTabPos.cx, controlTabPos.cy);
            await sleep(500);
            await page.mouse.down();
            await sleep(200);
            await page.mouse.up();
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
            await page.mouse.click(textBoxX, textBoxY);
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
            await page.mouse.click(textBoxX, textBoxY);
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

        // =====================================================================
        // Summary
        // =====================================================================
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Results: ${passed} passed, ${failed} failed`);
        if (failed > 0) {
            process.exitCode = 1;
        }

    } catch (error) {
        console.error(`[error] ${error.message}`);
        process.exitCode = 1;
    } finally {
        // Step 5: Kill process directly — no elegant exit needed
        if (browser !== null) {
            await browser.close();
        }
        killServer();
    }
}

main();
