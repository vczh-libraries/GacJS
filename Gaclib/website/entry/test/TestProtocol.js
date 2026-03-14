import { test } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOC_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'doc');

const scripts = [
    'Testing_Protocol_SimpleTyping.js',
    'Testing_Protocol_Caret.js',
    'Testing_Protocol_Font.js',
    'Testing_Protocol_ImageInText.js'
];

for (const script of scripts) {
    const name = script.replace('Testing_Protocol_', '').replace('.js', '');
    test(name, () => {
        execFileSync('node', [path.resolve(DOC_DIR, script)], {
            stdio: 'inherit',
            timeout: 300000
        });
    });
}
