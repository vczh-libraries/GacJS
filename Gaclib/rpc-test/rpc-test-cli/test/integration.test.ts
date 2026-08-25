import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

interface ChildResult {
    readonly exitCode: number | null;
    readonly stdout: string;
    readonly stderr: string;
}

interface WorkflowDriverBuild {
    readonly executable: string;
    readonly arguments_: readonly string[];
    readonly cwd: string;
    readonly driver: string;
}

const temporaryDirectories: string[] = [];

function runChild(executable: string, arguments_: readonly string[], cwd: string, timeout = 600_000): Promise<ChildResult> {
    return new Promise((resolve, reject) => {
        const child = childProcess.spawn(executable, arguments_, { cwd, windowsHide: true });
        let stdout = '';
        let stderr = '';
        const timer = setTimeout(() => {
            child.kill();
            reject(new Error(`Timed out running ${executable}.\nstdout:\n${stdout}\nstderr:\n${stderr}`));
        }, timeout);
        child.stdout.on('data', chunk => { stdout += String(chunk); });
        child.stderr.on('data', chunk => { stderr += String(chunk); });
        child.once('error', error => {
            clearTimeout(timer);
            reject(error);
        });
        child.once('exit', exitCode => {
            clearTimeout(timer);
            resolve({ exitCode, stdout, stderr });
        });
    });
}

export function quoteWindowsCommandArgument(argument: string): string {
    if (argument.length === 0) return '""';
    if (!/[\s"]/u.test(argument)) return argument;
    let result = '"';
    let backslashes = 0;
    for (const character of argument) {
        if (character === '\\') {
            backslashes++;
        } else if (character === '"') {
            result += `${'\\'.repeat(backslashes * 2 + 1)}"`;
            backslashes = 0;
        } else {
            result += `${'\\'.repeat(backslashes)}${character}`;
            backslashes = 0;
        }
    }
    return `${result}${'\\'.repeat(backslashes * 2)}"`;
}

export function quotePosixShellCommandArgument(argument: string): string {
    if (/^[A-Za-z0-9_@%+=:,./-]+$/u.test(argument)) return argument;
    return `'${argument.replaceAll("'", "'\\''")}'`;
}

function getWorkflowDriverBuild(workflowRoot: string, workflowTestRoot: string): WorkflowDriverBuild {
    if (process.platform === 'win32') {
        const buildScript = path.join(workflowRoot, '.github/Scripts/copilotBuild.ps1');
        return {
            executable: 'powershell.exe',
            arguments_: ['-NoProfile', '-Command', `& '${buildScript.replaceAll("'", "''")}'`],
            cwd: path.join(workflowTestRoot, 'UnitTest'),
            driver: path.join(workflowTestRoot, 'UnitTest/x64/Debug/RpcStdioTest_Driver.exe'),
        };
    }

    const driverRoot = path.join(workflowTestRoot, 'Linux/RpcStdioTest_Driver');
    return {
        executable: path.join(workflowRoot, '.github/Ubuntu/build.sh'),
        arguments_: [],
        cwd: driverRoot,
        driver: path.join(driverRoot, 'Bin/RpcStdioTest_Driver'),
    };
}

function readNames(filePath: string, index: boolean): string[] {
    return fs.readFileSync(filePath, 'utf8')
        .split(/\r?\n/u)
        .filter(line => line.length > 0)
        .map(line => index ? line.substring(0, line.indexOf('=')) : line);
}

afterAll(() => {
    for (const directory of temporaryDirectories) fs.rmSync(directory, { recursive: true, force: true });
});

describe('Workflow RpcStdioTest_Driver integration', () => {
    it('passes every non-skipped indexed case from a service path containing spaces', async () => {
        const packageRoot = path.resolve(import.meta.dirname, '../..');
        const gacjsRoot = path.resolve(packageRoot, '../../..');
        const workflowRoot = path.resolve(gacjsRoot, '../Workflow');
        const workflowTestRoot = path.join(workflowRoot, 'Test');
        const workflowBuild = getWorkflowDriverBuild(workflowRoot, workflowTestRoot);
        const build = await runChild(workflowBuild.executable, workflowBuild.arguments_, workflowBuild.cwd);
        expect(build.exitCode, `${build.stdout}\n${build.stderr}`).toBe(0);

        const driver = workflowBuild.driver;
        const skipList = path.join(workflowTestRoot, 'StartRpcStdio_DtorSkipList.txt');
        const cliEntry = path.join(packageRoot, 'lib/src/cli.js');
        for (const required of [driver, skipList, cliEntry]) expect(fs.existsSync(required), required).toBe(true);

        const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'gacjs rpc conformance '));
        temporaryDirectories.push(temporaryDirectory);
        const wrapper = path.join(temporaryDirectory, 'service wrapper.mjs');
        fs.writeFileSync(wrapper, `import ${JSON.stringify(pathToFileURL(cliEntry).href)};\n`, 'utf8');
        const quoteCommandArgument = process.platform === 'win32'
            ? quoteWindowsCommandArgument
            : quotePosixShellCommandArgument;
        const serviceCommand = `${quoteCommandArgument(process.execPath)} ${quoteCommandArgument(wrapper)}`;
        expect(serviceCommand).toContain('service wrapper.mjs');

        const result = await runChild(driver, [serviceCommand, skipList], workflowTestRoot);
        expect(result.exitCode, `${result.stdout}\n${result.stderr}`).toBe(0);

        const indexed = readNames(path.join(workflowTestRoot, 'Resources/IndexRpc.txt'), true);
        const skipped = readNames(skipList, false);
        const expectedPassed = indexed.filter(name => !skipped.includes(name));
        const passed = [...result.stdout.matchAll(/^Rpc:([^\r\n]+)$/gmu)].map(match => match[1]);
        const reportedSkipped = [...result.stdout.matchAll(/^\[SKIPPED\] Rpc:([^\r\n]+)$/gmu)].map(match => match[1]);
        expect(passed).toEqual(expectedPassed);
        expect(reportedSkipped).toEqual(skipped);
        expect(new Set([...passed, ...reportedSkipped]).size).toBe(indexed.length);

        const unknown = await runChild(process.execPath, [cliEntry, 'UnknownCase'], packageRoot);
        expect(unknown.exitCode).not.toBe(0);
        expect(unknown.stdout).toBe('');
        expect(unknown.stderr).toContain('Unknown Workflow RPC test case');
    }, 720_000);

    it('quotes Windows command arguments without losing spaces or trailing slashes', () => {
        expect(quoteWindowsCommandArgument('C:\\Program Files\\node.exe')).toBe('"C:\\Program Files\\node.exe"');
        expect(quoteWindowsCommandArgument('C:\\path with spaces\\')).toBe('"C:\\path with spaces\\\\"');
        expect(quoteWindowsCommandArgument('plain')).toBe('plain');
    });

    it('quotes POSIX shell command arguments without losing spaces or apostrophes', () => {
        expect(quotePosixShellCommandArgument('/path with spaces/node')).toBe("'/path with spaces/node'");
        expect(quotePosixShellCommandArgument("it's")).toBe("'it'\\''s'");
        expect(quotePosixShellCommandArgument('plain')).toBe('plain');
    });
});
