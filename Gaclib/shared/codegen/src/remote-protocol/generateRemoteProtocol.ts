import * as fs from 'fs';
import * as path from 'path';
import { Schema } from './AST';
import { collectClassNames, fixIndentation, refToString, typeToString } from './shared.js';

const __dirname = import.meta.dirname;

function generateEnums(schema: Schema): string {
    return schema.declarations.filter(decl => decl['$ast'] === 'EnumDecl').map(decl => `
        |
        |export enum ${decl.name} {
        ${decl.members.map(member => `|    ${member.name} = '${member.name}',`).join('\n')}
        |}
    `).join('\n');
}

function generateUnions(schema: Schema, classNames: string[]): string {
    return schema.declarations.filter(decl => decl['$ast'] === 'UnionDecl').map(decl => `
        |
        |export type ${decl.name} =
        ${decl.members.map((member, index) => `|    | [${index}, ${refToString(member.name, classNames)}]`).join('\n')};
    `).join('\n');
}

function generateStructs(schema: Schema, classNames: string[]): string {
    return schema.declarations.filter(decl => decl['$ast'] === 'StructDecl').map(decl => `
        |
        |export interface ${decl.name} {
        ${decl.members.map(member => `|    ${member.name}: ${typeToString(member.type, classNames)};`).join('\n')}
        |}
    `).join('\n');
}

function generateRequests(schema: Schema, classNames: string[]): string {
    return `
|
|export interface IRemoteProtocolRequests {
    ${schema.declarations.filter(decl => decl['$ast'] === 'MessageDecl').map(decl => {
        const params: string[] = [];
        if (decl.response) {
            params.push('id: number');
        }
        if (decl.request) {
            params.push(`requestArgs: ${typeToString(decl.request.type, classNames)}`);
        }
        return `|    Request${decl.name}(${params.join(', ')}): void;`;
    }).join('\n')}
|}`;
}

function generateResponses(schema: Schema, classNames: string[]): string {
    return `
|
|export interface IRemoteProtocolResponses {
    ${schema.declarations.filter(decl => decl['$ast'] === 'MessageDecl').map(decl => {
        return !decl.response ? '' : `|    Respond${decl.name}(id: number, responseArgs: ${typeToString(decl.response.type, classNames)}): void;`;
    }).join('\n')}
|}`;
}

function generateEvents(schema: Schema, classNames: string[]): string {
    return `
|
|export interface IRemoteProtocolEvents {
    ${schema.declarations.filter(decl => decl['$ast'] === 'EventDecl').map(decl => {
        return `|    On${decl.name}(${!decl.request ? '' : `eventArgs: ${typeToString(decl.request.type, classNames)}`}): void;`;
    }).join('\n')}
|}`;
}

function generateSchema(schema: Schema): string {
    const classNames = collectClassNames(schema);
    return fixIndentation(`
|import * as TYPES from './remoteProtocolPrimitiveTypes.js';
|export * as TYPES from './remoteProtocolPrimitiveTypes.js';
${generateEnums(schema)}
${generateUnions(schema, classNames)}
${generateStructs(schema, classNames)}
${generateRequests(schema, classNames)}
${generateResponses(schema, classNames)}
${generateEvents(schema, classNames)}
|
`);
}

export function generateRemoteProtocol() {
    const inputJson = path.resolve(__dirname, '../../../../../Import/Metadata/RemoteProtocol.json');
    const outputTs = path.resolve(__dirname, '../../../../gaclib/remote-protocol/src/remoteProtocolDefinition.ts');

    if (!fs.existsSync(inputJson)) {
        throw new Error(`Input file not found: ${inputJson}`);
    }

    const astString = fs.readFileSync(inputJson, 'utf-8');
    const ast = (<Schema>JSON.parse(astString));
    const code = generateSchema(ast);
    fs.writeFileSync(outputTs, code);
}
