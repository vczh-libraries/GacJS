import { build } from 'esbuild';
import * as path from 'path';

await build({
    entryPoints: [path.resolve(`./lib/index.js`)],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'GacUIHtmlRenderer',
    outfile: path.resolve(`./lib/dist/index.js`),
    platform: 'browser',
    target: 'es2022'
});