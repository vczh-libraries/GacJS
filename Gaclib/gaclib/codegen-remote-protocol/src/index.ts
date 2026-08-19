import * as path from 'path';
import { generateRemoteProtocol } from './generateRemoteProtocol.js';
import { generateRemoteProtocolInvoking } from './generateRemoteProtocolInvoking.js';

const __dirname = import.meta.dirname;
const outputPath = path.resolve(__dirname, '../../remote-protocol/src');

generateRemoteProtocol(outputPath);
generateRemoteProtocolInvoking(outputPath);
