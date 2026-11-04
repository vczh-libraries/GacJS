import { afterEach, describe, expect, test } from 'vitest';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const apps = ['FCT', 'RPT', 'RVMT'];
const files = ['app.mjs', 'app.wasm', 'app.worker.js'];
const roots: string[] = [];

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture(separateWorker = true) {
    const root = mkdtempSync(join(tmpdir(), 'gacjs-copy-wasm-'));
    roots.push(root);
    const script = join(root, 'GacJS', 'copy-wasm.sh');
    mkdirSync(join(root, 'GacJS'));
    copyFileSync(new URL('../../../../copy-wasm.sh', import.meta.url), script);
    const source = (app: string, file: string) => join(root, 'GacUI', 'Test', 'Linux', `Wasm${app}`, 'Bin', file);
    const destination = (app: string, file: string) => join(root, 'GacJS', 'Gaclib', 'website', 'entry', 'lib', 'dist', `wasm-${app.toLowerCase()}`, file);
    for (const app of apps) {
        mkdirSync(source(app, ''), { recursive: true });
        mkdirSync(destination(app, ''), { recursive: true });
        writeFileSync(destination(app, 'index.html'), 'page');
        for (const file of files) {
            if (file !== 'app.worker.js' || separateWorker) {
                writeFileSync(source(app, file), file === 'app.mjs'
                    ? `export default function () { return new Worker(new URL('${separateWorker ? 'app.worker.js' : 'app.mjs'}', import.meta.url)); }\n`
                    : `build ${app} ${file}`);
            }
            writeFileSync(destination(app, file), `previous ${app} ${file}`);
        }
    }
    const deployed = () => apps.flatMap(app => files.map(file => readFileSync(destination(app, file), 'utf8')));
    const run = () => spawnSync('bash', [script], { encoding: 'utf8' });
    return { source, destination, deployed, run };
}

describe.skipIf(process.platform === 'win32')('Wasm deployment validation', () => {
    test.each(apps.flatMap(app => files.flatMap(file => ['missing', 'empty'].map(kind => ({ app, file, kind })))))
    ('rejects $kind $app/$file before replacing any app', ({ app, file, kind }) => {
        const f = fixture();
        const previous = f.deployed();
        if (kind === 'missing') rmSync(f.source(app, file));
        else writeFileSync(f.source(app, file), '');
        const result = f.run();
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Warning:');
        expect(f.deployed()).toEqual(previous);
    });

    test.each(apps)('rejects a missing %s destination page before replacing any app', app => {
        const f = fixture();
        const previous = f.deployed();
        rmSync(f.destination(app, 'index.html'));
        expect(f.run().status).toBe(1);
        expect(f.deployed()).toEqual(previous);
    });

    test('copies all nine files unchanged for separate-worker builds', () => {
        const f = fixture();
        expect(f.run().status).toBe(0);
        for (const app of apps) for (const file of files) {
            expect(readFileSync(f.destination(app, file))).toEqual(readFileSync(f.source(app, file)));
        }
    });

    test('supports module workers and removes stale separate workers', () => {
        const f = fixture(false);
        // Transitional SDKs also emitted an unused empty worker file.
        writeFileSync(f.source('RVMT', 'app.worker.js'), '');
        expect(f.run().status).toBe(0);
        for (const app of apps) {
            for (const file of ['app.mjs', 'app.wasm']) {
                expect(readFileSync(f.destination(app, file))).toEqual(readFileSync(f.source(app, file)));
            }
            expect(existsSync(f.destination(app, 'app.worker.js'))).toBe(false);
        }
    });
});
