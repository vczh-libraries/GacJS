// Testing_Protocol.js
//
// Shared utilities and vitest lifecycle for GacUI remote protocol test scripts.
// Used by Testing_Protocol_*.js test files in this directory.

import path from 'path';
import { execSync, spawn, execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import net from 'node:net';
import { chromium } from '@playwright/test';
import { beforeAll, afterAll, describe } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Path constants
// ---------------------------------------------------------------------------

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
export const GACLIB_ROOT = path.resolve(REPO_ROOT, 'Gaclib');

// GacUI is a sibling repository next to this GacJS checkout.
export const GACUI_ROOT = path.resolve(REPO_ROOT, '..', 'GacUI');

export const GACUI_BUILD_SCRIPT = path.resolve(GACUI_ROOT, '.github', 'Scripts', 'copilotBuild.ps1');
export const GACUI_SOLUTION_DIR = path.resolve(GACUI_ROOT, 'Test', 'GacUISrc');
export const SERVER_EXE = path.resolve(GACUI_ROOT, 'Test', 'GacUISrc', 'x64', 'Debug', 'RemotingTest_Core.exe');
export const WEBSITE_URL = 'http://localhost:8896/index.html';
export const PROTOCOL_HOST = 'localhost';
export const PROTOCOL_PORT = 8888;
export const PROTOCOL_TEST_SKIP_REASON = process.platform !== 'win32'
    ? `GacUI protocol tests are Windows-only (current platform: ${process.platform}).`
    : !existsSync(GACUI_ROOT)
        ? `GacUI protocol tests require the sibling GacUI repo: ${GACUI_ROOT}`
        : null;

let gacuiBuildPromise = null;

export function describeProtocolTest(name, fn) {
    const suite = PROTOCOL_TEST_SKIP_REASON === null ? describe : describe.skip;
    return suite(name, fn);
}

export async function ensureGacUIBuilt() {
    if (PROTOCOL_TEST_SKIP_REASON !== null) {
        return;
    }

    if (gacuiBuildPromise === null) {
        gacuiBuildPromise = (async () => {
            if (!existsSync(GACUI_BUILD_SCRIPT)) {
                throw new Error(`GacUI build script not found: ${GACUI_BUILD_SCRIPT}`);
            }
            if (!existsSync(GACUI_SOLUTION_DIR)) {
                throw new Error(`GacUI solution directory not found: ${GACUI_SOLUTION_DIR}`);
            }

            execFileSync(
                'powershell.exe',
                [
                    '-NoProfile',
                    '-ExecutionPolicy',
                    'Bypass',
                    '-File',
                    GACUI_BUILD_SCRIPT,
                    '-Configuration',
                    'Debug',
                    '-Platform',
                    'x64'
                ],
                {
                    cwd: GACUI_SOLUTION_DIR,
                    stdio: 'inherit'
                }
            );

            if (!existsSync(SERVER_EXE)) {
                throw new Error(`GacUI build completed but server executable was not found: ${SERVER_EXE}`);
            }
        })();
    }

    await gacuiBuildPromise;
}

// ---------------------------------------------------------------------------
// Basic utilities
// ---------------------------------------------------------------------------

export function killServer() {
    try {
        execSync('taskkill /F /T /IM RemotingTest_Core.exe', { stdio: 'ignore' });
    } catch {
        // Process may not exist
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function isServerRunning() {
    try {
        const output = execSync('tasklist /FI "IMAGENAME eq RemotingTest_Core.exe" /NH', {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
        return output.includes('RemotingTest_Core.exe');
    } catch {
        return false;
    }
}

export async function waitForServerExit(timeout = 10000) {
    const end = Date.now() + timeout;

    while (Date.now() < end) {
        if (!isServerRunning()) return;
        await sleep(100);
    }

    throw new Error('Timed out waiting for RemotingTest_Core.exe to exit');
}

async function tryConnectTcpPort(port, host, timeout = 1000) {
    return new Promise(resolve => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.once('connect', () => {
            socket.destroy();
            resolve({ connected: true, error: null });
        });
        socket.once('timeout', () => {
            socket.destroy();
            resolve({ connected: false, error: null });
        });
        socket.once('error', e => {
            resolve({ connected: false, error: e });
        });
        socket.connect(port, host);
    });
}

export async function waitForTcpPort(port, host, timeout = 30000) {
    const end = Date.now() + timeout;
    let lastError = null;

    while (Date.now() < end) {
        const result = await tryConnectTcpPort(port, host);
        lastError = result.error || lastError;

        if (result.connected) return;
        await sleep(100);
    }

    const errorMessage = lastError !== null ? ` (${lastError.message})` : '';
    throw new Error(`Timed out waiting for ${host}:${port}${errorMessage}`);
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

async function getScreenState(page) {
    return page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (!screen) {
            return { leafCount: 0, text: '' };
        }

        let leafCount = 0;
        for (const d of screen.querySelectorAll('div')) {
            if (d.childElementCount === 0 && d.textContent.trim() !== '') {
                leafCount++;
            }
        }

        return {
            leafCount,
            text: screen.textContent || ''
        };
    });
}

async function waitForApplicationRendered(page, timeout = 60000, getDiagnostics = () => []) {
    const end = Date.now() + timeout;
    let lastState = null;
    let nextStartupReload = Date.now() + 15000;

    while (Date.now() < end) {
        lastState = await getScreenState(page);
        const hasAppContent = lastState.leafCount >= 20 ||
            lastState.text.includes('Remote Protocol Test');
        const hasFetchError = lastState.text.includes('Failed to fetch');
        const isStarting = lastState.text.includes('Starting GacUI HTML Renderer');

        if (hasAppContent && !hasFetchError) {
            await waitForIdle(page, 3000);
            return;
        }

        if (hasFetchError || (isStarting && Date.now() >= nextStartupReload)) {
            await sleep(500);
            await page.reload({ timeout: 30000, waitUntil: 'domcontentloaded' });
            await page.waitForSelector('#gacui-screen', { timeout: 30000 });
            nextStartupReload = Date.now() + 15000;
        } else {
            const remaining = end - Date.now();
            await waitForIdle(page, Math.min(1000, Math.max(100, remaining)));
        }
    }

    const text = lastState !== null ? lastState.text.trim().replace(/\s+/g, ' ').slice(0, 200) : '';
    const leafCount = lastState !== null ? lastState.leafCount : 0;
    const diagnostics = getDiagnostics();
    const diagnosticText = diagnostics.length === 0 ? '' : `\nDiagnostics:\n${diagnostics.join('\n')}`;
    throw new Error(`GacUI page did not render app content: leafCount=${leafCount}, text="${text}"${diagnosticText}`);
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
    const state = page.__idleState;
    if (state !== undefined && state !== null) {
        state.pending = false;
    }
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

export function hasControlTabContent(positions) {
    return positions.some(p =>
        p.text.startsWith('Search') ||
        p.text === 'Document Editor (Ribbon)' ||
        p.text === 'TextBox'
    );
}

export async function openControlTab(page) {
    for (let attempt = 0; attempt < 3; attempt++) {
        let positions = await getLeafTextPositions(page);
        if (hasControlTabContent(positions)) {
            return true;
        }

        const controlTabs = positions
            .filter(p => p.text === 'Control')
            .sort((a, b) => a.top - b.top || a.left - b.left);
        if (controlTabs.length === 0) {
            return false;
        }

        for (const controlTab of controlTabs) {
            await clickAt(page, controlTab.cx, controlTab.cy);
            positions = await getLeafTextPositions(page);
            if (hasControlTabContent(positions)) {
                return true;
            }
        }
    }

    return false;
}

export async function findTextInputPointRightOfLabel(page, labelPos, { maxDistance = 360 } = {}) {
    return page.evaluate(({ labelPos, maxDistance }) => {
        const y = labelPos.cy;
        const xStart = Math.ceil(labelPos.right + 4);
        const xEnd = Math.min(window.innerWidth - 4, Math.ceil(labelPos.right + maxDistance));
        const segments = [];
        let current = null;

        for (let x = xStart; x <= xEnd; x += 4) {
            const el = document.elementFromPoint(x, y);
            const cursor = el ? window.getComputedStyle(el).cursor : '';
            if (cursor === 'text') {
                if (current === null) {
                    current = { start: x, end: x };
                } else {
                    current.end = x;
                }
            } else if (current !== null) {
                segments.push(current);
                current = null;
            }
        }

        if (current !== null) {
            segments.push(current);
        }

        if (segments.length > 0) {
            const best = segments.reduce((a, b) =>
                (b.end - b.start) > (a.end - a.start) ? b : a
            );
            return { x: (best.start + best.end) / 2, y };
        }

        return { x: labelPos.right + 60, y };
    }, { labelPos, maxDistance });
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
 * Event-driven caret visibility check. The first sample may land during the
 * invisible half of a blink, so keep checking across a full blink window.
 *
 * visible=true (default): returns carets[] (may be empty on timeout).
 * visible=false: returns true if no carets found before timeout.
 */
export async function waitForCarets(page, { visible = true, timeout = 2400 } = {}) {
    const blinkState = page.__blinkState;
    if (blinkState !== undefined && blinkState !== null) {
        blinkState.pending = false;
    }

    const end = Date.now() + timeout;
    let carets = [];

    do {
        carets = await findCarets(page);
        if (visible && carets.length >= 1) return carets;
        if (!visible && carets.length === 0) return true;

        const remaining = end - Date.now();
        if (remaining <= 0) break;
        await waitForBlink(page, Math.min(600, remaining));
    } while (Date.now() < end);

    return visible ? carets : false;
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

export const UI_TEXT = {
    chooseFont: ['Choose Font', '选择字体'],
    font: ['Font:', '字体:', '字体：'],
    size: ['Size:', '尺寸:', '尺寸：'],
    preview: ['Preview:', '预览:', '预览：'],
    ok: ['OK', '确定'],
    cancel: ['Cancel', '取消'],
    red: ['Red:', 'Red', '红:', '红：', '红色:', '红色：'],
    fileName: ['File name:', 'File name：', '文件名:', '文件名：'],
    open: ['OK', 'Open', '打开', '确定']
};

export function textMatchesAny(text, variants) {
    return variants.includes(text);
}

export function findTextPosition(positions, variants) {
    return positions.find(p => textMatchesAny(p.text, variants));
}

export function hasTextPosition(positions, variants) {
    return findTextPosition(positions, variants) !== undefined;
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
export function setupProtocolTest(serverArgs = '/FCT /Http') {
    let browser = null;
    let context = null;
    let page = null;
    let serverProcess = null;
    let serverExit = null;
    const diagnostics = [];
    const STARTUP_ATTEMPTS = 3;

    function addDiagnostic(message) {
        diagnostics.push(message);
        while (diagnostics.length > 80) {
            diagnostics.shift();
        }
    }

    async function openPage() {
        const p = await context.newPage();
        try {
            await setupIdleTracking(p);
            p.on('dialog', async dialog => {
                console.error(`  [CRASH] Dialog: ${dialog.message()}`);
                await dialog.dismiss();
            });
            p.on('console', msg => {
                if (msg.type() === 'error' || msg.type() === 'warning') {
                    addDiagnostic(`console ${msg.type()}: ${msg.text()}`);
                }
            });
            p.on('pageerror', error => {
                addDiagnostic(`pageerror: ${error.message}`);
            });
            p.on('requestfailed', request => {
                if (request.url().includes(':8888')) {
                    addDiagnostic(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
                }
            });
            p.on('response', response => {
                if (response.url().includes(':8888') && response.status() >= 400) {
                    addDiagnostic(`response: ${response.status()} ${response.url()}`);
                }
            });
            await p.goto(WEBSITE_URL, { timeout: 30000, waitUntil: 'domcontentloaded' });
            await p.waitForSelector('#gacui-screen', { timeout: 30000 });
            await waitForApplicationRendered(p, 60000, () => diagnostics);
            return p;
        } catch (e) {
            await p.close().catch(() => {});
            throw e;
        }
    }

    async function closeBrowser() {
        if (browser !== null) {
            await browser.close().catch(() => {});
        }
        browser = null;
        context = null;
        page = null;
    }

    async function stopServer() {
        if (serverProcess !== null && serverProcess.exitCode === null) {
            serverProcess.kill();
        }
        killServer();
        await waitForServerExit();
        serverProcess = null;
        serverExit = null;
    }

    async function startServer() {
        serverExit = null;
        serverProcess = spawn(SERVER_EXE, serverArgs.trim().split(/\s+/).filter(Boolean), {
            cwd: GACUI_SOLUTION_DIR,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });
        serverProcess.stdout.on('data', data => {
            const text = data.toString().trim();
            if (text !== '') {
                addDiagnostic(`server stdout: ${text}`);
            }
        });
        serverProcess.stderr.on('data', data => {
            const text = data.toString().trim();
            if (text !== '') {
                addDiagnostic(`server stderr: ${text}`);
            }
        });
        serverProcess.once('exit', (code, signal) => {
            serverExit = { code, signal };
            addDiagnostic(`server exit: code=${code}, signal=${signal}`);
        });
        await sleep(500);
        if (serverExit !== null) {
            throw new Error(`RemotingTest_Core.exe exited early: code=${serverExit.code}, signal=${serverExit.signal}`);
        }
        await waitForTcpPort(PROTOCOL_PORT, PROTOCOL_HOST);
    }

    beforeAll(async () => {
        await ensureGacUIBuilt();

        let lastError = null;
        for (let attempt = 1; attempt <= STARTUP_ATTEMPTS; attempt++) {
            addDiagnostic(`startup attempt ${attempt}`);
            await closeBrowser();
            await stopServer();

            try {
                await startServer();
                browser = await chromium.launch({ headless: true });
                context = await browser.newContext();
                page = await openPage();
                return;
            } catch (e) {
                lastError = e;
                addDiagnostic(`startup attempt ${attempt} failed: ${e.message}`);
                await closeBrowser();
                await stopServer();
                if (attempt < STARTUP_ATTEMPTS) {
                    await sleep(1000);
                }
            }
        }

        const diagnosticText = diagnostics.length === 0 ? '' : `\nDiagnostics:\n${diagnostics.join('\n')}`;
        const message = lastError !== null ? lastError.message : 'unknown startup error';
        throw new Error(`Protocol test startup failed after ${STARTUP_ATTEMPTS} attempts: ${message}${diagnosticText}`);
    });

    afterAll(async () => {
        await closeBrowser();
        await stopServer();
    });

    return {
        get page() { return page; },
        openPage
    };
}
