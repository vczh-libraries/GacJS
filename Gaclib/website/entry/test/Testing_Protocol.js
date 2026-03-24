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
// Idle helpers – bridge to RequestRendererIdle via page.exposeFunction
// ---------------------------------------------------------------------------

/**
 * Set up idle and blink tracking for a Playwright page.
 * Must be called BEFORE page.goto() so CDP bindings exist when page JS runs.
 */
export async function setupIdleTracking(page) {
    const idleState = { pending: false, resolve: null };
    const blinkState = { pending: false, resolve: null };

    await page.exposeFunction('__gacui_playwright_idle', () => {
        if (idleState.resolve !== null) {
            const r = idleState.resolve;
            idleState.resolve = null;
            r();
        } else {
            idleState.pending = true;
        }
    });

    await page.exposeFunction('__gacui_playwright_blink', () => {
        if (blinkState.resolve !== null) {
            const r = blinkState.resolve;
            blinkState.resolve = null;
            r();
        } else {
            blinkState.pending = true;
        }
    });

    page.__idleState = idleState;
    page.__blinkState = blinkState;
}

/**
 * Wait for the next RequestRendererIdle signal (UI stable after interaction).
 * Uses the Node.js-side pending-flag mechanism fed by page.exposeFunction.
 * If idle already fired before this call, returns immediately.
 * Falls back to sleep(250) if idle tracking is not set up.
 */
export async function waitForIdle(page, timeout = 5000) {
    const state = page.__idleState;
    if (state === undefined || state === null) {
        throw new Error('waitForIdle: idle tracking not set up — call setupIdleTracking(page) first');
    }
    if (state.pending) {
        state.pending = false;
        return;
    }
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            state.resolve = null;
            resolve();
        }, timeout);
        state.resolve = () => {
            clearTimeout(timer);
            resolve();
        };
    });
}

/**
 * Wait until at least one idle has ever fired.
 * Use for initial page load instead of sleep(1200).
 */
export async function waitUntilIdle(page, timeout = 30000) {
    const state = page.__idleState;
    if (state === undefined || state === null) {
        throw new Error('waitUntilIdle: idle tracking not set up — call setupIdleTracking(page) first');
    }
    if (state.pending) {
        state.pending = false;
        return;
    }
    return new Promise(resolve => {
        const timer = setTimeout(resolve, timeout);
        state.resolve = () => {
            clearTimeout(timer);
            resolve();
        };
    });
}

// ---------------------------------------------------------------------------
// Click helpers
// ---------------------------------------------------------------------------

export async function clickAt(page, x, y) {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();
    await waitForIdle(page);
}

export async function findAndClick(page, textToFind, positions) {
    const pos = (positions || await getLeafTextPositions(page)).find(p => p.text === textToFind);
    if (!pos) return false;
    await clickAt(page, pos.cx, pos.cy);
    return true;
}

// ---------------------------------------------------------------------------
// Caret helpers
// ---------------------------------------------------------------------------

/**
 * Find all visible caret divs in the screen.
 * A caret is a narrow (width <= 4px) absolutely positioned div with a
 * background color and display !== 'none', inside a pre-wrap container.
 */
export async function findCarets(page) {
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

/**
 * Wait for exactly one blink event (caret visibility toggle).
 * Returns immediately if a blink fired since the last wait.
 * Falls back to sleep(500) if blink tracking is not set up.
 */
export async function waitForBlink(page, timeout = 1200) {
    const state = page.__blinkState;
    if (state === undefined || state === null) {
        throw new Error('waitForBlink: blink tracking not set up — call setupIdleTracking(page) first');
    }
    if (state.pending) {
        state.pending = false;
        return;
    }
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            state.resolve = null;
            resolve();
        }, timeout);
        state.resolve = () => {
            clearTimeout(timer);
            resolve();
        };
    });
}

/**
 * Event-driven caret visibility check.
 * Since each blink toggles visibility, at most one blink event is needed:
 *   1. Check DOM — if already satisfied, return immediately.
 *   2. Wait for one blink event (visibility toggled).
 *   3. Check DOM again and return the result.
 *
 * visible=true (default): returns carets[] (may be empty on timeout).
 * visible=false: returns true if no carets found, false otherwise.
 */
export async function waitForCarets(page, { visible = true, timeout = 1200 } = {}) {
    const blinkState = page.__blinkState;
    if (blinkState !== undefined && blinkState !== null) {
        blinkState.pending = false;
    }

    const carets = await findCarets(page);
    if (visible && carets.length >= 1) return carets;
    if (!visible && carets.length === 0) return true;

    await waitForBlink(page, timeout);

    const caretsAfter = await findCarets(page);
    if (visible) return caretsAfter;
    return caretsAfter.length === 0;
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
    let context = null;
    let page = null;

    async function openPage() {
        const p = await context.newPage();
        await setupIdleTracking(p);
        p.on('dialog', async dialog => {
            console.error(`  [CRASH] Dialog: ${dialog.message()}`);
            await dialog.dismiss();
        });
        p.on('console', () => {});
        await p.goto(WEBSITE_URL, { timeout: 30000 });
        await p.waitForSelector('#gacui-screen div div', { timeout: 30000 });
        await waitUntilIdle(p);
        return p;
    }

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
        await sleep(1200);

        browser = await chromium.launch({ headless: true });
        context = await browser.newContext();
        page = await openPage();
    });

    afterAll(async () => {
        if (browser !== null) {
            await browser.close();
        }
        killServer();
    });

    return {
        get page() { return page; },
        openPage
    };
}
