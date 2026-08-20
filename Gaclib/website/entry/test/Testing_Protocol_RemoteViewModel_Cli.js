import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, expect, test } from 'vitest';
import {
    GACLIB_ROOT,
    WEBSITE_URL,
    clickAt,
    describeProtocolTest,
    getLeafTextPositions,
    isProcessLive,
    setupProtocolTest,
    sleep,
    waitForIdle,
    waitForChildProcessExit,
    waitForProcessExit,
    waitForRemoteViewModelReady,
} from './Testing_Protocol.js';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gacjs cli e2e '));
const sourceLauncher = path.join(GACLIB_ROOT, 'website', 'rvmhost', 'lib', 'bin', process.platform === 'win32' ? 'gacjs-rvmhost.exe' : 'gacjs-rvmhost');
const launcher = path.join(temporary, process.platform === 'win32' ? 'native host with spaces.exe' : 'native host with spaces');
fs.copyFileSync(sourceLauncher, launcher);
if (process.platform !== 'win32') fs.chmodSync(launcher, 0o755);

afterAll(() => {
    fs.rmSync(temporary, { recursive: true, force: true });
});

async function waitForPidFile(pidFile, timeout = 30000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
        if (fs.existsSync(pidFile)) {
            const pid = Number(fs.readFileSync(pidFile, 'utf8'));
            if (Number.isSafeInteger(pid) && pid > 0 && isProcessLive(pid)) return pid;
        }
        await sleep(100);
    }
    throw new Error(`Timed out waiting for live RVM host PID in ${pidFile}.`);
}

function parentProcessId(pid) {
    const output = execFileSync('powershell.exe', [
        '-NoProfile',
        '-Command',
        `(Get-CimInstance Win32_Process -Filter 'ProcessId = ${String(pid)}').ParentProcessId`,
    ], { encoding: 'utf8', windowsHide: true }).trim();
    const parent = Number(output);
    if (!Number.isSafeInteger(parent) || parent <= 0) throw new Error(`Invalid parent PID for ${String(pid)}: ${output}`);
    return parent;
}

function tcpConnectionOwners(remotePort) {
    const output = execFileSync('powershell.exe', [
        '-NoProfile',
        '-Command',
        `Get-NetTCPConnection -RemotePort ${String(remotePort)} -State Established -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess`,
    ], { encoding: 'utf8', windowsHide: true }).trim();
    return output === '' ? [] : output.split(/\r?\n/u).map(line => Number(line.trim())).filter(Number.isSafeInteger);
}

async function inputPosition(page) {
    const position = await page.evaluate(() => {
        const screen = document.getElementById('gacui-screen');
        if (screen === null) return null;
        const rectangles = [...screen.querySelectorAll('div')]
            .filter(element => getComputedStyle(element).cursor === 'text')
            .map(element => element.getBoundingClientRect())
            .filter(rect => rect.width > 20 && rect.height > 10)
            .sort((a, b) => b.width * b.height - a.width * a.height);
        const rect = rectangles[0];
        return rect === undefined ? null : { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    expect(position).not.toBeNull();
    return position;
}

function configureCliTest(pidFile, rendererTransport = '/Http') {
    let hostPid = null;
    let connectRequests = 0;
    let connectBodies = [];
    const ctx = setupProtocolTest({
        serverArguments: ['/RVMT', rendererTransport, `/Cli:"${launcher}"`],
        websiteUrl: WEBSITE_URL,
        gracefulTeardown: true,
        serverEnvironment: { GACJS_RVMHOST_PID_FILE: pidFile },
        async startupReadiness() {
            await waitForRemoteViewModelReady();
            hostPid = await waitForPidFile(pidFile);
        },
        setupPage(page) {
            page.on('request', request => {
                if (request.method() === 'GET' && request.url().endsWith('/VlppInterProcess/Connect')) {
                    connectRequests++;
                }
                if (request.method() === 'POST' && request.url().includes('/GacUIRemoteProtocolHttp/')) {
                    connectBodies.push(request.postData() ?? '');
                }
            });
        },
        async cleanupChildProcesses() {
            if (hostPid !== null) await waitForProcessExit(hostPid);
            hostPid = null;
            connectRequests = 0;
            connectBodies = [];
            fs.rmSync(pidFile, { force: true });
        },
    });
    return {
        ctx,
        get hostPid() { return hostPid; },
        get connectRequests() { return connectRequests; },
        get connectBodies() { return connectBodies; },
    };
}

describeProtocolTest('Remote view-model Core-launched native CLI', () => {
    const state = configureCliTest(path.join(temporary, 'graceful.pid'), '/MiniHttp');

    test('uses one quoted executable argument, keeps RVM off HTTP, and reaps on graceful Core exit', async () => {
        expect(state.hostPid).not.toBeNull();
        expect(state.hostPid).not.toBe(state.ctx.serverProcess.pid);
        expect(parentProcessId(state.hostPid)).toBe(state.ctx.serverProcess.pid);
        expect(tcpConnectionOwners(8888)).not.toContain(state.hostPid);
        expect(state.connectRequests).toBeGreaterThanOrEqual(1);
        expect(state.connectBodies).toContain(';;GacUIRemoteProtocol');
        expect(state.connectBodies.every(body => !body.includes('ViewModelChannel'))).toBe(true);
        let positions = await getLeafTextPositions(state.ctx.page);
        expect(positions.some(position => position.text === 'Hello, !')).toBe(true);
        const input = await inputPosition(state.ctx.page);
        await clickAt(state.ctx.page, input.x, input.y);
        await state.ctx.page.keyboard.type('Alice');
        await waitForIdle(state.ctx.page);
        positions = await getLeafTextPositions(state.ctx.page);
        expect(positions.some(position => position.text === 'Hello, Alice!')).toBe(true);
    });
});

describeProtocolTest('Remote view-model Core-launched native CLI failure', () => {
    const state = configureCliTest(path.join(temporary, 'failure.pid'));

    test('retains the renderer and reports exact accepted-host loss', async () => {
        const input = await inputPosition(state.ctx.page);
        await clickAt(state.ctx.page, input.x, input.y);
        await state.ctx.page.keyboard.type('Alice');
        await waitForIdle(state.ctx.page);
        let positions = await getLeafTextPositions(state.ctx.page);
        expect(positions.some(position => position.text === 'Hello, Alice!')).toBe(true);

        process.kill(state.hostPid);
        await waitForProcessExit(state.hostPid);
        await clickAt(state.ctx.page, input.x, input.y);
        await state.ctx.page.keyboard.press('Control+A');
        await state.ctx.page.keyboard.type('Bob');
        await state.ctx.page.waitForFunction(() => document.getElementById('gacui-error-message')?.textContent === 'RemotingTest_RvmHost disconnected.', undefined, { timeout: 30000 });
        expect(await state.ctx.page.locator('#gacui-error-message').textContent()).toBe('RemotingTest_RvmHost disconnected.');
        const core = state.ctx.serverProcess;
        await waitForChildProcessExit(core, 30000);
        expect(core.signalCode).toBeNull();
        expect(core.exitCode).not.toBe(0);
    });
});
