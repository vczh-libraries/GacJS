// Protocol_GacUIBuild.js
//
// Shared GacUI checkout/build detection for remote protocol tests.

import path from 'path';
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GACUI_BUILT_ENV = 'GACUI_PROTOCOL_TESTS_BUILT';

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
export const GACLIB_ROOT = path.resolve(REPO_ROOT, 'Gaclib');

// GacUI is a sibling repository next to this GacJS checkout.
export const GACUI_ROOT = path.resolve(REPO_ROOT, '..', 'GacUI');

export const GACUI_BUILD_SCRIPT = path.resolve(GACUI_ROOT, '.github', 'Scripts', 'copilotBuild.ps1');
export const GACUI_SOLUTION_DIR = path.resolve(GACUI_ROOT, 'Test', 'GacUISrc');
export const SERVER_EXE = path.resolve(GACUI_ROOT, 'Test', 'GacUISrc', 'x64', 'Debug', 'RemotingTest_Core.exe');
export const PROTOCOL_TEST_SKIP_REASON = process.platform !== 'win32'
    ? `GacUI protocol tests are Windows-only (current platform: ${process.platform}).`
    : !existsSync(GACUI_ROOT)
        ? `GacUI protocol tests require the sibling GacUI repo: ${GACUI_ROOT}`
        : null;

let gacuiBuildPromise = null;

export async function ensureGacUIBuilt() {
    if (PROTOCOL_TEST_SKIP_REASON !== null) {
        return;
    }

    if (process.env[GACUI_BUILT_ENV] === '1' && existsSync(SERVER_EXE)) {
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

            process.env[GACUI_BUILT_ENV] = '1';
        })();
    }

    await gacuiBuildPromise;
}
