import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { build } from 'esbuild';
import { inject } from 'postject';
import { assertSeaToolchain } from './sea-capability.mjs';

const nodeHelp = execFileSync(process.execPath, ['--help'], { encoding: 'utf8' });
assertSeaToolchain(process.version, nodeHelp.includes('--experimental-sea-config'), inject);

const packageRoot = resolve(import.meta.dirname);
const workRoot = join(packageRoot, 'lib', 'sea');
const binRoot = join(packageRoot, 'lib', 'bin');
const bundlePath = join(workRoot, 'gacjs-rvmhost.cjs');
const blobPath = join(workRoot, 'sea-prep.blob');
const configPath = join(workRoot, 'sea-config.json');
const executablePath = join(binRoot, process.platform === 'win32' ? 'gacjs-rvmhost.exe' : 'gacjs-rvmhost');
const temporaryExecutablePath = join(workRoot, process.platform === 'win32' ? 'gacjs-rvmhost.exe' : 'gacjs-rvmhost');
rmSync(workRoot, { recursive: true, force: true });
mkdirSync(workRoot, { recursive: true });
mkdirSync(binRoot, { recursive: true });

await build({
    entryPoints: [join(packageRoot, 'src', 'cli.ts')],
    outfile: join(packageRoot, 'lib', 'src', 'cli.js'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    sourcemap: false,
    external: ['node:*'],
    banner: { js: '#!/usr/bin/env node' },
});
if (process.platform !== 'win32') chmodSync(join(packageRoot, 'lib', 'src', 'cli.js'), 0o755);

await build({
    entryPoints: [join(packageRoot, 'src', 'cli.ts')],
    outfile: bundlePath,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    sourcemap: false,
    external: ['node:*'],
});

writeFileSync(configPath, `${JSON.stringify({
    main: bundlePath,
    output: blobPath,
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    useCodeCache: false,
    execArgvExtension: 'none',
}, undefined, 4)}\n`, 'utf8');
execFileSync(process.execPath, ['--experimental-sea-config', configPath], { stdio: 'inherit' });
copyFileSync(process.execPath, temporaryExecutablePath);

if (process.platform === 'darwin') {
    execFileSync('codesign', ['--remove-signature', temporaryExecutablePath], { stdio: 'inherit' });
}
await inject(temporaryExecutablePath, 'NODE_SEA_BLOB', readFileSync(blobPath), {
    sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
    machoSegmentName: 'NODE_SEA',
});
if (process.platform === 'darwin') {
    execFileSync('codesign', ['--sign', '-', temporaryExecutablePath], { stdio: 'inherit' });
}
if (process.platform !== 'win32') chmodSync(temporaryExecutablePath, 0o755);
rmSync(executablePath, { force: true });
renameSync(temporaryExecutablePath, executablePath);

// Keep the bundle as a diagnosable build input, but preparation blobs/configs are transient.
rmSync(blobPath, { force: true });
rmSync(configPath, { force: true });
