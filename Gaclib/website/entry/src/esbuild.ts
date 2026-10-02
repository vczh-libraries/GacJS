import { build, BuildOptions } from 'esbuild';
import * as path from 'path';

const args = process.argv.slice(2);
const isShip = args.includes('--ship');

const options: BuildOptions = {
    bundle: true,
    minify: isShip,
    sourcemap: !isShip,
    keepNames: !isShip,
    format: 'esm',
    outdir: path.resolve('./lib/dist'),
    platform: 'browser',
    target: 'es2022',
};

await build({
    ...options,
    // Each library is self-contained, so other sites can copy just the libraries they use.
    entryPoints: {
        gacui: '@gaclib/renderer',
        wasm: '@gaclib-website/remote-protocol-wasm',
        http: '@gaclib-website/remote-protocol-http',
        rvm: '@gaclib-website/rvm',
        'wasm-worker': '@gaclib-website/remote-protocol-wasm/worker',
    },
});

await build({
    ...options,
    entryPoints: { entry: './lib/index.js', 'wasm-page': './lib/wasmPage.js' },
    plugins: [{
        name: 'browser-libraries',
        setup(builder): void {
            const libraries: Record<string, string> = {
                '@gaclib/renderer': './gacui.js',
                '@gaclib-website/remote-protocol-http': './http.js',
                '@gaclib-website/remote-protocol-http/channel': './http.js',
                '@gaclib-website/remote-protocol-http/http-channel': './http.js',
                '@gaclib-website/remote-protocol-wasm': './wasm.js',
                '@gaclib-website/rvm': './rvm.js',
            };
            builder.onResolve({ filter: /^@gaclib(?:-website)?\// }, args => {
                const library = libraries[args.path];
                return library === undefined ? undefined : { path: library, external: true };
            });
        },
    }],
});
