import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';

test.skipIf(process.platform !== 'win32')('Windows SEA signature removal preserves a runnable copy and leaves the installed Node unchanged', () => {
    const packageRoot = resolve(import.meta.dirname, '..');
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'gacjs sea signature '));
    const executable = join(temporaryRoot, 'node copy.exe');
    const hash = (file: string): string => createHash('sha256').update(readFileSync(file)).digest('hex');
    const originalHash = hash(process.execPath);
    const removeSignature = (): void => {
        execFileSync('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
            '-File', join(packageRoot, 'remove-windows-signature.ps1'),
            '-ExecutablePath', executable,
        ], { timeout: 10000 });
    };

    try {
        copyFileSync(process.execPath, executable);
        removeSignature();
        const signature = execFileSync('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-Command',
            // Node can inherit PowerShell 7's PSModulePath. Load the module that
            // belongs to Windows PowerShell explicitly instead of auto-loading.
            'Import-Module "$PSHOME\\Modules\\Microsoft.PowerShell.Security\\Microsoft.PowerShell.Security.psd1" -ErrorAction Stop; '
            + '(Get-AuthenticodeSignature -LiteralPath $env:GACJS_SEA_SIGNATURE_TEST_EXE).Status',
        ], {
            env: { ...process.env, GACJS_SEA_SIGNATURE_TEST_EXE: executable },
            encoding: 'utf8',
            timeout: 10000,
        });
        expect(signature.trim()).toBe('NotSigned');
        expect(execFileSync(executable, ['--version'], { encoding: 'utf8', timeout: 10000 }).trim()).toBe(process.version);

        const unsignedHash = hash(executable);
        removeSignature();
        expect(hash(executable)).toBe(unsignedHash);
        expect(hash(process.execPath)).toBe(originalHash);
    } finally {
        rmSync(temporaryRoot, { recursive: true, force: true });
    }
});
