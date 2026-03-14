// Testing_Protocol.js
//
// Shared utilities and vitest lifecycle for GacUI remote protocol test scripts.
// Used by Testing_Protocol_*.js test files in this directory.

import path from 'path';
import { execSync, exec } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';
import { beforeAll, afterAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Path constants
// ---------------------------------------------------------------------------

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
export const GACLIB_ROOT = path.resolve(REPO_ROOT, 'Gaclib');

// Prefer a sibling GacUI clone (always compiled) over the submodule.
// When REPO-ROOT\..\GacUI exists, use that; otherwise fall back to REPO-ROOT\GacUI.
export const GACUI_ROOT = existsSync(path.resolve(REPO_ROOT, '..', 'GacUI'))
    ? path.resolve(REPO_ROOT, '..', 'GacUI')
    : path.resolve(REPO_ROOT, 'GacUI');

export const SERVER_EXE = path.resolve(GACUI_ROOT, 'Test', 'GacUISrc', 'x64', 'Debug', 'RemotingTest_Core.exe');
export const WEBSITE_URL = 'http://localhost:8896/index.html';

// ---------------------------------------------------------------------------
// Basic utilities
// ---------------------------------------------------------------------------

export function killServer() {
    try {
        execSync('taskkill /F /IM RemotingTest_Core.exe', { stdio: 'ignore' });
    } catch {
        // Process may not exist
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// DOM query helpers
// ---------------------------------------------------------------------------

export async function getLeafTextPositions(page) {
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
export async function findEditorCenter(page) {
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

export async function clickAt(page, x, y) {
    await page.mouse.move(x, y);
    await sleep(200);
    await page.mouse.down();
    await sleep(100);
    await page.mouse.up();
}

export async function findAndClick(page, textToFind, positions) {
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
export function findNewTexts(before, after) {
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
export async function findIconButtonsInArea(page, xMin, xMax, yMin, yMax) {
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
export function groupIntoRows(icons, tolerance) {
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
// Vitest lifecycle: server + browser setup/teardown
// ---------------------------------------------------------------------------

/**
 * Register vitest beforeAll/afterAll hooks that start the C++ server,
 * launch a headless Chromium browser, and navigate to the test page.
 *
 * Call this inside a describe() block. Returns an object with a `page`
 * getter that provides the Playwright page once beforeAll completes.
 */
export function setupProtocolTest() {
    let browser = null;
    let page = null;

    beforeAll(async () => {
        if (!existsSync(SERVER_EXE)) {
            throw new Error(
                `Server executable not found: ${SERVER_EXE}\n` +
                'Run: scripts/start-test-server.ps1 to build it.'
            );
        }

        killServer();
        await sleep(1000);

        const serverProcess = exec(`"${SERVER_EXE}" /Http`);
        serverProcess.stdout?.on('data', () => {});
        serverProcess.stderr?.on('data', () => {});
        await sleep(3000);

        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();

        page.on('dialog', async dialog => {
            console.error(`  [CRASH] Dialog: ${dialog.message()}`);
            await dialog.dismiss();
        });
        page.on('console', () => {});

        await page.goto(WEBSITE_URL, { timeout: 30000 });
        await page.waitForSelector('#gacui-screen div div', { timeout: 30000 });
        await sleep(8000);
    });

    afterAll(async () => {
        if (browser !== null) {
            await browser.close();
        }
        killServer();
    });

    return {
        get page() { return page; }
    };
}
