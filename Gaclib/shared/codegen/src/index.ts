import { generateRemoteProtocol } from './remote-protocol/generateRemoteProtocol.js';
import { generateRemoteProtocolInvoking } from './remote-protocol/generateRemoteProtocolInvoking.js';
import { generateSnapshotIndex, prepareSnapshots } from './snapshots.js';

generateRemoteProtocol();
generateRemoteProtocolInvoking();
prepareSnapshots();
generateSnapshotIndex();
