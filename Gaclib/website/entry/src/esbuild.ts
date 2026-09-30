import { build } from 'esbuild';
import * as path from 'path';

const args = process.argv.slice(2);
const isShip = args.includes('--ship');

await build({
    entryPoints: [path.resolve(`./lib/index.js`)],
    bundle: true,
    minify: isShip,
    sourcemap: !isShip,
    keepNames: !isShip,
    format: 'iife',
    globalName: 'GacUIHtmlRenderer',
    outfile: path.resolve(`./lib/dist/index.js`),
    platform: 'browser',
    target: 'es2022'
});

await build({
    entryPoints: { wasm: path.resolve('./lib/wasm.js'), 'wasm-worker': '@gaclib-website/remote-protocol-wasm/worker' },
    bundle: true,
    minify: isShip,
    sourcemap: !isShip,
    keepNames: !isShip,
    format: 'esm',
    outdir: path.resolve('./lib/dist'),
    platform: 'browser',
    target: 'es2022',
});
