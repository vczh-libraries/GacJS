import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GacUIPath = path.join(__dirname, '../../../../GacUI');
const GacJSPath = path.join(__dirname, '../../..');

fs.copyFileSync(
    path.join(GacUIPath, 'Source/PlatformProviders/Remote/Protocol/Metadata/Protocols.json'),
    path.join(GacJSPath, 'Import/Metadata/RemoteProtocol.json')
);
fs.copyFileSync(
    path.join(GacUIPath, 'Source/Compiler/RemoteProtocol/Generated/GuiRemoteProtocolAst_Json.d.ts'),
    path.join(GacJSPath, 'Gaclib/shared/codegen/src/remote-protocol/AST.d.ts')
);
