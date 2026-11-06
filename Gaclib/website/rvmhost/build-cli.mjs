import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { build } from 'esbuild';

const cliPath = join(import.meta.dirname, 'lib', 'src', 'cli.js');
await build({
    entryPoints: [join(import.meta.dirname, 'src', 'cli.ts')],
    outfile: cliPath,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    sourcemap: false,
    external: ['node:*'],
    banner: { js: '#!/usr/bin/env node' },
});
if (process.platform !== 'win32') chmodSync(cliPath, 0o755);
