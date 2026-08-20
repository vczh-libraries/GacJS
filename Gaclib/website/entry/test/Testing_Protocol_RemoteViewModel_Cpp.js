import { execFileSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, afterEach, beforeEach, expect, test } from 'vitest';
import {
    GACLIB_ROOT,
    GACUI_SOLUTION_DIR,
    describeProtocolTest,
    ensureGacUIBuilt,
    isProcessLive,
    sleep,
    waitForAutomationControl,
    waitForChildOutputLine,
    waitForChildProcessExit,
    waitForProcessExit,
    waitForTcpPort,
} from './Testing_Protocol.js';

const CPP_EXE = path.join(GACUI_SOLUTION_DIR, 'x64', 'Debug', 'CppTest_Rvm.exe');
const CPP_CONTROLS_URL = 'http://localhost:8888/Automation/CppTest_Rvm/Controls';
const CPP_IO_URL = 'http://localhost:8888/Automation/CppTest_Rvm/IO';
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gacjs cpp rvm '));

function killCppTest() {
    try {
        execFileSync('taskkill.exe', ['/F', '/T', '/IM', 'CppTest_Rvm.exe'], { stdio: 'ignore' });
    } catch {
        // Process may not exist.
    }
}

async function stopCppTest(child) {
    const response = await fetch(CPP_IO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf8' },
        body: '!Exit',
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`CppTest_Rvm automation shutdown failed with HTTP ${response.status}.`);
    await waitForChildProcessExit(child);
}

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

describeProtocolTest('Remote view-model direct C++ requester compatibility', () => {
    beforeEach(async () => {
        await ensureGacUIBuilt();
        killCppTest();
    });

    afterEach(() => {
        killCppTest();
    });

    afterAll(() => {
        fs.rmSync(temporary, { recursive: true, force: true });
    });

    test.each(['/Http', '/MiniHttp'])('independent network service-only host passes both built-in C++ calls over %s', async transport => {
        const cpp = spawn(CPP_EXE, [transport], { cwd: GACUI_SOLUTION_DIR, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
        let host = null;
        try {
            await waitForTcpPort(8888, 'localhost');
            host = spawn(process.execPath, [path.join(GACLIB_ROOT, 'website', 'rvmhost', 'lib', 'src', 'cli.js'), '--service-only'], {
                cwd: path.join(GACLIB_ROOT, 'website', 'rvmhost'),
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true,
            });
            await waitForChildOutputLine(host, 'GACJS_RVMHOST_SERVICE_HELD');
            await waitForAutomationControl(CPP_CONTROLS_URL, 'Remote View Model Test');
            await stopCppTest(cpp);
            expect(cpp.exitCode).toBe(0);
        } finally {
            if (cpp.exitCode === null) cpp.kill();
            if (host !== null && host.exitCode === null) host.kill();
            if (host !== null) await waitForChildProcessExit(host).catch(() => undefined);
        }
    });

    test('Core-compatible native launcher passes both built-in C++ calls and is reaped', async () => {
        const source = path.join(GACLIB_ROOT, 'website', 'rvmhost', 'lib', 'bin', 'gacjs-rvmhost.exe');
        const launcher = path.join(temporary, 'native Cpp host.exe');
        const pidFile = path.join(temporary, 'cpp-cli.pid');
        fs.copyFileSync(source, launcher);
        const cpp = spawn(CPP_EXE, [`/Cli:"${launcher}"`], {
            cwd: GACUI_SOLUTION_DIR,
            env: { ...process.env, GACJS_RVMHOST_PID_FILE: pidFile },
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
        });
        let hostPid = null;
        try {
            await waitForTcpPort(8888, 'localhost');
            await waitForAutomationControl(CPP_CONTROLS_URL, 'Remote View Model Test');
            hostPid = await waitForPidFile(pidFile);
            await stopCppTest(cpp);
            expect(cpp.exitCode).toBe(0);
            await waitForProcessExit(hostPid);
        } finally {
            if (cpp.exitCode === null) cpp.kill();
            if (hostPid !== null && isProcessLive(hostPid)) process.kill(hostPid);
            fs.rmSync(pidFile, { force: true });
        }
    });
});
