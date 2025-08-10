import * as fs from 'fs';
import * as path from 'path';

const __dirname = import.meta.dirname;

export function generateRemoteProtocol() {
    const inputJson = path.resolve(__dirname, '../../../../../Import/Metadata/RemoteProtocol.json');

    if (!fs.existsSync(inputJson)) {
        throw new Error(`Input file not found: ${inputJson}`);
    }

    const jsonData = fs.readFileSync(inputJson, 'utf-8');
    JSON.parse(jsonData);

    throw new Error('Remote protocol generation is not implemented yet.');
}