import * as fs from 'fs';
import * as path from 'path';
import { Schema } from './AST';
import { collectClassNames, fixIndentation, typeToString } from './shared.js';

const __dirname = import.meta.dirname;

function generateRequests(schema: Schema): string {
    return `
|
|export function jsonToRequest(pi: ProtocolInvoking, receiver: SCHEMA.IRemoteProtocolRequests): void {
|    if (pi.semantic === 'Message') {
|        switch (pi.name) {
    ${schema.declarations.filter(decl => decl['$ast'] === 'MessageDecl').map(decl => {
        return decl.response ? '' : `|            case '${decl.name}': receiver.Request${decl.name}(${!decl.request ? '' : 'pi.arguments'}); break;`
    }).join('\n')}
|            default: throw new Error('Invalid message name: ' + pi.name);
|        }
|    } else if (pi.semantic === 'Request') {
|        switch (pi.name) {
    ${schema.declarations.filter(decl => decl['$ast'] === 'MessageDecl').map(decl => {
        return !decl.response ? '' : `|            case '${decl.name}': receiver.Request${decl.name}(pi.id${!decl.request ? '' : ', pi.arguments'}); break;`
    }).join('\n')}
|            default: throw new Error('Invalid request name: ' + pi.name);
|        }
|    } else {
|        throw new Error('Invalid semantic type for request: ' + pi.semantic);
|    }
|}`;
}

function generateResponses(schema: Schema, classNames: string[]): string {
    return `
|
|export class ResponseToJson implements SCHEMA.IRemoteProtocolResponses {
|    constructor(private callback: ProtocolInvokingHandler) { }
    ${schema.declarations.filter(decl => decl['$ast'] === 'MessageDecl').map(decl => {
        return !decl.response ? '' : `|
            |    Respond${decl.name}(responseArgs: SCHEMA.${typeToString(decl.response.type, classNames)}): void {
            |    }`;
    }).join('\n')}
|}`;
}

function generateEvents(schema: Schema, classNames: string[]): string {
    return `
|
|export class EventToJson implements SCHEMA.IRemoteProtocolEvents {
|    constructor(private callback: ProtocolInvokingHandler) { }
    ${schema.declarations.filter(decl => decl['$ast'] === 'EventDecl').map(decl => {
        return `|
            |    On${decl.name}(${!decl.request ? '' : `eventArgs: SCHEMA.${typeToString(decl.request.type, classNames)}`}): void {
            |    }`;
    }).join('\n')}
|}`;
}

function generateInvoking(schema: Schema): string {
    const classNames = collectClassNames(schema);
    return fixIndentation(`
|import * as SCHEMA from './remoteProtocolDefinition.js';
|
|export interface ProtocolInvoking {
|    semantic: 'Message' | 'Request' | 'Response' | 'Event';
|    id? : number;
|    name: string;
|    arguments?: {};
|}
|
|export type ProtocolInvokingHandler = (invoking: ProtocolInvoking) => void;
${generateRequests(schema)}
${generateResponses(schema, classNames)}
${generateEvents(schema, classNames)}
|
`);
}

export function generateRemoteProtocolInvoking() {
    const inputJson = path.resolve(__dirname, '../../../../../Import/Metadata/RemoteProtocol.json');
    const outputTs = path.resolve(__dirname, '../../../../gaclib/remote-protocol/src/remoteProtocolInvoking.ts');

    if (!fs.existsSync(inputJson)) {
        throw new Error(`Input file not found: ${inputJson}`);
    }

    const astString = fs.readFileSync(inputJson, 'utf-8');
    const ast = (<Schema>JSON.parse(astString));
    const code = generateInvoking(ast);
    fs.writeFileSync(outputTs, code);
}
