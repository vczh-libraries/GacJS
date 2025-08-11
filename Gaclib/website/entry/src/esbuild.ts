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