import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
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
const sentinelFuse = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

function containsSentinel(executable) {
    return readFileSync(executable).includes(Buffer.from(sentinelFuse));
}

async function resolveSeaExecutableSource() {
    if (containsSentinel(process.execPath)) return process.execPath;
    if (process.platform !== 'darwin') {
        throw new Error(`The Node executable does not contain ${sentinelFuse}: ${process.execPath}`);
    }
    if (process.arch !== 'arm64' && process.arch !== 'x64') {
        throw new Error(`The macOS SEA build does not support the Node architecture: ${process.arch}`);
    }

    // Homebrew links its small launcher against libnode, so the executable has no
    // injectable SEA fuse. Cache the matching official standalone Node binary.
    const cacheRoot = join(packageRoot, 'node_modules', '.cache', 'sea-node');
    const cachedExecutable = join(cacheRoot, `node-${process.version}-darwin-${process.arch}`);
    mkdirSync(cacheRoot, { recursive: true });
    if (existsSync(cachedExecutable) && containsSentinel(cachedExecutable)) return cachedExecutable;
    rmSync(cachedExecutable, { force: true });

    const distributionName = `node-${process.version}-darwin-${process.arch}`;
    const archiveName = `${distributionName}.tar.gz`;
    const distributionRoot = `https://nodejs.org/dist/${process.version}`;
    const [archiveResponse, checksumsResponse] = await Promise.all([
        fetch(`${distributionRoot}/${archiveName}`),
        fetch(`${distributionRoot}/SHASUMS256.txt`),
    ]);
    if (!archiveResponse.ok) {
        throw new Error(`Failed to download ${archiveName}: HTTP ${archiveResponse.status}`);
    }
    if (!checksumsResponse.ok) {
        throw new Error(`Failed to download SHASUMS256.txt: HTTP ${checksumsResponse.status}`);
    }

    const archive = Buffer.from(await archiveResponse.arrayBuffer());
    const checksums = await checksumsResponse.text();
    const checksumLine = checksums.split(/\r?\n/).find(line => line.endsWith(`  ${archiveName}`));
    if (checksumLine === undefined) {
        throw new Error(`SHASUMS256.txt does not contain ${archiveName}.`);
    }
    const expectedChecksum = checksumLine.split(/\s+/)[0];
    const actualChecksum = createHash('sha256').update(archive).digest('hex');
    if (actualChecksum !== expectedChecksum) {
        throw new Error(`Checksum mismatch for ${archiveName}.`);
    }

    const archivePath = join(workRoot, archiveName);
    const extractRoot = join(workRoot, 'node-distribution');
    writeFileSync(archivePath, archive);
    mkdirSync(extractRoot, { recursive: true });
    execFileSync('tar', ['-xzf', archivePath, '-C', extractRoot, `${distributionName}/bin/node`], { stdio: 'inherit' });
    const extractedExecutable = join(extractRoot, distributionName, 'bin', 'node');
    if (!containsSentinel(extractedExecutable)) {
        throw new Error(`The official Node executable does not contain ${sentinelFuse}: ${extractedExecutable}`);
    }

    const temporaryCachedExecutable = `${cachedExecutable}.tmp-${process.pid}`;
    rmSync(temporaryCachedExecutable, { force: true });
    copyFileSync(extractedExecutable, temporaryCachedExecutable);
    chmodSync(temporaryCachedExecutable, 0o755);
    renameSync(temporaryCachedExecutable, cachedExecutable);
    rmSync(archivePath, { force: true });
    rmSync(extractRoot, { recursive: true, force: true });
    return cachedExecutable;
}

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
const seaExecutableSource = await resolveSeaExecutableSource();
execFileSync(seaExecutableSource, ['--experimental-sea-config', configPath], { stdio: 'inherit' });
copyFileSync(seaExecutableSource, temporaryExecutablePath);
if (process.platform !== 'win32') chmodSync(temporaryExecutablePath, 0o755);

if (process.platform === 'darwin') {
    execFileSync('codesign', ['--remove-signature', temporaryExecutablePath], { stdio: 'inherit' });
}
await inject(temporaryExecutablePath, 'NODE_SEA_BLOB', readFileSync(blobPath), {
    sentinelFuse,
    machoSegmentName: 'NODE_SEA',
});
if (process.platform === 'darwin') {
    execFileSync('codesign', ['--sign', '-', temporaryExecutablePath], { stdio: 'inherit' });
}
rmSync(executablePath, { force: true });
renameSync(temporaryExecutablePath, executablePath);

// Keep the bundle as a diagnosable build input, but preparation blobs/configs are transient.
rmSync(blobPath, { force: true });
rmSync(configPath, { force: true });
