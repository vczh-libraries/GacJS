import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GacUIPath = path.join(__dirname, '../../../../GacUI');

const jsonContent = fs.readFileSync(
    path.join(GacUIPath, 'Source/PlatformProviders/Remote/Protocol/Metadata/Protocols.json'),
    'utf-8'
).replace(/\r\n/g, '\n');
fs.writeFileSync(
    path.join(__dirname, 'src/Import/Protocols.json'),
    jsonContent
);
const astContent = fs.readFileSync(
    path.join(GacUIPath, 'Source/Compiler/RemoteProtocol/Generated/GuiRemoteProtocolAst_Json.d.ts'),
    'utf-8'
).replace(/\r\n/g, '\n');
fs.writeFileSync(
    path.join(__dirname, 'src/Import/GuiRemoteProtocolAst_Json.d.ts'),
    astContent
);

const tuiTypesContent = fs.readFileSync(
    path.resolve(GacUIPath, '../VlppOS/Source/TUI/TUITypes.h'),
    'utf-8'
).replace(/\r\n/g, '\n');
fs.writeFileSync(path.join(__dirname, 'src/Import/TUITypes.h'), tuiTypesContent);
