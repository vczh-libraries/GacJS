// Testing_Protocol.js
//
// Shared utilities for the GacUI remote protocol Playwright test scripts.
// Import this module from each Testing_Protocol_*.js file.

const path = require('path');
const { execSync, exec } = require('child_process');
const { existsSync } = require('fs');

// ---------------------------------------------------------------------------
// Path constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');
const GACLIB_ROOT = path.resolve(REPO_ROOT, 'Gaclib');

// Prefer a sibling GacUI clone (always compiled) over the submodule.
// When REPO-ROOT\..\GacUI exists, use that; otherwise fall back to REPO-ROOT\GacUI.
const GACUI_ROOT = existsSync(path.resolve(REPO_ROOT, '..', 'GacUI'))
    ? path.resolve(REPO_ROOT, '..', 'GacUI')
    : path.resolve(REPO_ROOT, 'GacUI');

const SERVER_EXE = path.resolve(GACUI_ROOT, 'Test', 'GacUISrc', 'x64', 'Debug', 'RemotingTest_Core.exe');
const WEBSITE_URL = 'http://localhost:8896/index.html';

// ---------------------------------------------------------------------------
// Basic utilities
// ---------------------------------------------------------------------------

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
// DOM query helpers
// ---------------------------------------------------------------------------

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
// UI element helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

/**
 * Run a protocol test with full server/browser lifecycle management.
 *
 * @param {string} testName - display name for the test
 * @param {(page: any, pass: (name: string) => void, fail: (name: string, detail: string) => void) => Promise<void>} testFn
 * @returns {Promise<{passed: number, failed: number}>}
 */
async function runTest(testName, testFn) {
    const { chromium } = require(path.resolve(GACLIB_ROOT, 'node_modules', '@playwright', 'test'));
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
        if (!existsSync(SERVER_EXE)) {
            console.error(`Server executable not found: ${SERVER_EXE}`);
            console.error('Run: scripts/start-test-server.ps1 to build it.');
            process.exit(1);
        }

        killServer();
        await sleep(1000);

        const serverProcess = exec(`"${SERVER_EXE}" /Http`);
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
        page.on('console', () => {});

        await page.goto(WEBSITE_URL, { timeout: 30000 });
        await page.waitForSelector('#gacui-screen div div', { timeout: 30000 });
        await sleep(8000);

        await testFn(page, pass, fail);

        console.log(`\n${'='.repeat(50)}`);
        console.log(`Results: ${passed} passed, ${failed} failed`);
        return { passed, failed };
    } catch (error) {
        console.error(`[error] ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
        return { passed, failed: failed + 1 };
    } finally {
        if (browser !== null) {
            await browser.close();
        }
        killServer();
    }
}

module.exports = {
    REPO_ROOT,
    GACLIB_ROOT,
    GACUI_ROOT,
    SERVER_EXE,
    WEBSITE_URL,
    killServer,
    sleep,
    getLeafTextPositions,
    findEditorCenter,
    clickAt,
    findAndClick,
    findNewTexts,
    findIconButtonsInArea,
    groupIntoRows,
    runTest
};
