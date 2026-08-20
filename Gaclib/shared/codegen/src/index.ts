import * as path from 'path';
import { generateRemoteProtocol, generateRemoteProtocolInvoking } from '@gaclib/codegen-remote-protocol';
import { generateWorkflowRpcFromFiles } from '@gaclib/codegen-workflow-rpc';
import { generateSnapshotIndex, prepareSnapshots } from './snapshots.js';

const __dirname = import.meta.dirname;
const outputPath = path.resolve(__dirname, '../../../gaclib/remote-protocol/src');

generateRemoteProtocol(outputPath);
generateRemoteProtocolInvoking(outputPath);
const rpcMetadataPath = path.resolve(__dirname, '../../../../../GacUI/Test/GacUISrc/Generated_RemoteViewModelTest/Resource_x86/RpcMetadata.txt');
const rpcSchemaPath = path.resolve(__dirname, '../../../../../GacUI/Test/GacUISrc/Generated_RemoteViewModelTest/Resource_x86/RpcMetadata.d.ts');
const rpcOutputPath = path.resolve(__dirname, '../../../website/rvm/src/generated');
const rvmPackagePath = path.resolve(__dirname, '../../../website/rvm');
if (rpcOutputPath !== rvmPackagePath && !rpcOutputPath.startsWith(`${rvmPackagePath}${path.sep}`)) {
    throw new Error(`Workflow RPC output escapes website/rvm: ${rpcOutputPath}`);
}
generateWorkflowRpcFromFiles(rpcMetadataPath, rpcSchemaPath, rpcOutputPath);
prepareSnapshots();
generateSnapshotIndex();
