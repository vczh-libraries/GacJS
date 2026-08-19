import * as path from 'path';
import { generateRemoteProtocol, generateRemoteProtocolInvoking } from '@gaclib/codegen-remote-protocol';
import { generateSnapshotIndex, prepareSnapshots } from './snapshots.js';

const __dirname = import.meta.dirname;
const outputPath = path.resolve(__dirname, '../../../gaclib/remote-protocol/src');

generateRemoteProtocol(outputPath);
generateRemoteProtocolInvoking(outputPath);
prepareSnapshots();
generateSnapshotIndex();
