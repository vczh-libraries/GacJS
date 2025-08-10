import * as fs from 'fs';
import * as path from 'path';
import { Schema } from './AST';

const __dirname = import.meta.dirname;

function verifySchema<T>(obj: {}) {
    throw new Error('verifySchema<T> not implemented.');
}

export function generateRemoteProtocol() {
    const inputJson = path.resolve(__dirname, '../../../../../Import/Metadata/RemoteProtocol.json');

    if (!fs.existsSync(inputJson)) {
        throw new Error(`Input file not found: ${inputJson}`);
    }

    const astString = fs.readFileSync(inputJson, 'utf-8');
    const ast = JSON.parse(astString);
    verifySchema<Schema>(ast);
}