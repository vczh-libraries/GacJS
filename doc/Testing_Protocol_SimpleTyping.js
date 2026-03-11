// Testing_Protocol_SimpleTyping.js
//
// Standalone Playwright test script that verifies basic UI rendering and interaction
// with the GacUI remote protocol.
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
// What it tests:
//   1. Page loads and GacUI UI renders correctly (23 leaf text elements)
//   2. Sub-tab switching works (click "ListView" inner tab, verify content changes)
//   3. Button click works (click "Add 10 items", verify new items appear)
//   4. Keyboard events are sent to server (IOKeyDown/IOKeyUp/IOChar dispatched)
//
// Known limitation:
//   Main tab switching (List/Control/Misc/etc.) does not work due to a server-side
//   GacUI issue. The server acknowledges clicks on main tab headers (sends
//   IORequireCapture, IOReleaseCapture, and visual style updates) but does not
//   switch the tab page content. Sub-tab switching works correctly.
//   This prevents testing typing in the Control > TextBox tab.

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
                    cy: r.y + r.height / 2
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

        // Setup
        killServer();
        await sleep(1000);

        serverProcess = exec(`"${SERVER_EXE}" /Http`);
        serverProcess.stdout?.on('data', () => {});
        serverProcess.stderr?.on('data', () => {});
        await sleep(3000);

        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // Track IO events sent to server
        // Protocol event names: IOKeyDown, IOKeyUp, IOChar, IOButtonDown, etc.
        const ioEventNames = new Set();
        page.on('request', req => {
            if (req.url().includes(':8888')) {
                const body = req.postData();
                if (body !== null && body !== undefined) {
                    for (const name of ['IOKeyDown', 'IOKeyUp', 'IOChar', 'IOButtonDown', 'IOButtonUp', 'IOMouseMoving', 'IOMouseEntered', 'IOMouseLeaved']) {
                        if (body.includes(name)) {
                            ioEventNames.add(name);
                        }
                    }
                }
            }
        });

        await page.goto(WEBSITE_URL, { timeout: 30000 });
        await page.waitForSelector('#gacui-screen div div', { timeout: 30000 });
        await sleep(8000);

        // =====================================================================
        // Test 1: Page renders correctly
        // =====================================================================
        console.log('\nTest 1: Page rendering');
        const initial = await getLeafTexts(page);

        if (initial.length >= 20) {
            pass(`Rendered ${initial.length} leaf text elements`);
        } else {
            fail('Rendering', `Expected >=20 leaf texts, got ${initial.length}`);
        }

        if (initial.includes('Complete Control Showcase')) {
            pass('Window title visible');
        } else {
            fail('Window title', 'Expected "Complete Control Showcase"');
        }

        const expectedTabs = ['List', 'Refresh List', 'Layout', 'Control', 'Misc', 'Window Manager', 'Exit'];
        const missingTabs = expectedTabs.filter(t => !initial.includes(t));
        if (missingTabs.length === 0) {
            pass('All main tab headers visible');
        } else {
            fail('Tab headers', `Missing: ${missingTabs.join(', ')}`);
        }

        if (initial.includes('TextList') && initial.includes('ListView')) {
            pass('Sub-tab headers visible (TextList, ListView)');
        } else {
            fail('Sub-tab headers', 'Expected TextList and ListView');
        }

        // =====================================================================
        // Test 2: Button click (Add 10 items)
        // =====================================================================
        console.log('\nTest 2: Button click');
        const beforeBtn = await getLeafTexts(page);
        const btnPositions = await getLeafTextPositions(page);
        const addBtnPos = btnPositions.find(p => p.text === 'Add 10 items');

        if (addBtnPos !== undefined) {
            await page.mouse.move(addBtnPos.cx, addBtnPos.cy);
            await sleep(500);
            await page.mouse.down();
            await sleep(200);
            await page.mouse.up();
            await sleep(5000);

            const afterBtn = await getLeafTexts(page);
            if (afterBtn.length > beforeBtn.length) {
                pass(`Button click worked: ${beforeBtn.length} -> ${afterBtn.length} leaf texts`);
            } else {
                fail('Button click', `Leaf count unchanged: ${afterBtn.length}`);
            }
        } else {
            fail('Button position', 'Could not find "Add 10 items" element');
        }

        // =====================================================================
        // Test 3: Sub-tab switching (ListView)
        // =====================================================================
        console.log('\nTest 3: Sub-tab switching');

        const positions = await getLeafTextPositions(page);
        const currentTexts = await getLeafTexts(page);
        const listViewPos = positions.find(p => p.text === 'ListView');

        if (listViewPos !== undefined) {
            await page.mouse.move(listViewPos.cx, listViewPos.cy);
            await sleep(1000);
            await page.mouse.down();
            await sleep(500);
            await page.mouse.up();
            await sleep(5000);

            const afterLV = await getLeafTexts(page);
            if (afterLV.length > currentTexts.length) {
                pass(`Sub-tab switched: ${currentTexts.length} -> ${afterLV.length} leaf texts`);
            } else {
                fail('Sub-tab switch', `Leaf count unchanged: ${afterLV.length}`);
            }

            // Verify ListView content appeared
            if (afterLV.includes('Detail')) {
                pass('ListView content visible ("Detail" text found)');
            } else {
                fail('ListView content', 'Expected "Detail" in content');
            }
        } else {
            fail('ListView position', 'Could not find ListView element');
        }

        // =====================================================================
        // Test 4: Keyboard events dispatched
        // =====================================================================
        console.log('\nTest 4: Keyboard events');
        // Click on the screen div to ensure it has focus for keyboard events
        await page.click('#gacui-screen');
        await sleep(1000);
        ioEventNames.clear();

        // Type a few keys
        await page.keyboard.press('a');
        await sleep(500);
        await page.keyboard.press('b');
        await sleep(500);
        await page.keyboard.press('Enter');
        await sleep(1000);

        const hasKeyDown = ioEventNames.has('IOKeyDown');
        const hasKeyUp = ioEventNames.has('IOKeyUp');
        const hasChar = ioEventNames.has('IOChar');

        if (hasKeyDown) {
            pass('IOKeyDown events sent');
        } else {
            fail('IOKeyDown', `No IOKeyDown events detected (events: ${[...ioEventNames].join(', ')})`);
        }

        if (hasKeyUp) {
            pass('IOKeyUp events sent');
        } else {
            fail('IOKeyUp', `No IOKeyUp events detected`);
        }

        if (hasChar) {
            pass('IOChar events sent');
        } else {
            fail('IOChar', `No IOChar events detected`);
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
        if (browser !== null) {
            await browser.close();
        }
        killServer();
    }
}

main();
