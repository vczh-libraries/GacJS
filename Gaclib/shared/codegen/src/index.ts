import '@gaclib/codegen-remote-protocol';
import { generateSnapshotIndex, prepareSnapshots } from './snapshots.js';

prepareSnapshots();
generateSnapshotIndex();
