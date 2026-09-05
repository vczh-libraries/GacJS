import * as fs from 'fs';
import * as path from 'path';
import { Schema } from './Import/GuiRemoteProtocolAst_Json';
import { collectClassNames, fixIndentation, refToString, typeToString } from './shared.js';

const __dirname = import.meta.dirname;

function generateEnums(schema: Schema): string {
    return schema.declarations.filter(decl => !!decl).filter(decl => decl['$ast'] === 'EnumDecl').map(decl => `
        |
        |export enum ${decl.name} {
        ${decl.members.filter(member => !!member).map(member => `|    ${member.name} = '${member.name}',`).join('\n')}
        |}
    `).join('\n');
}

function generateUnions(schema: Schema, classNames: string[]): string {
    return schema.declarations.filter(decl => !!decl).filter(decl => decl['$ast'] === 'UnionDecl').map(decl => `
        |
        |export type ${decl.name} =
        ${decl.members.filter(member => !!member).map((member) => `|    | ['${member.name}', ${refToString(member.name, classNames)}]`).join('\n')};
    `).join('\n');
}

function generateStructs(schema: Schema, classNames: string[]): string {
    return schema.declarations.filter(decl => !!decl).filter(decl => decl['$ast'] === 'StructDecl').map(decl => `
        |
        |export interface ${decl.name} {
        ${decl.members.filter(member => !!member).map(member => `|    ${member.name}: ${typeToString(member.type, classNames)};`).join('\n')}
        |}
    `).join('\n');
}

function generateRequests(schema: Schema, classNames: string[]): string {
    return `
|
|export interface IRemoteProtocolRequests {
    ${schema.declarations.filter(decl => !!decl).filter(decl => decl['$ast'] === 'MessageDecl').map(decl => {
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
    ${schema.declarations.filter(decl => !!decl).filter(decl => decl['$ast'] === 'MessageDecl').map(decl => {
        return !decl.response ? '' : `|    Respond${decl.name}(id: number, responseArgs: ${typeToString(decl.response.type, classNames)}): void;`;
    }).join('\n')}
|}`;
}

function generateEvents(schema: Schema, classNames: string[]): string {
    return `
|
|export interface IRemoteProtocolEvents {
    ${schema.declarations.filter(decl => !!decl).filter(decl => decl['$ast'] === 'EventDecl').map(decl => {
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


function generatePrimitiveTypes(): string {
    const input = fs.readFileSync(path.resolve(__dirname, '../src/Import/TUITypes.h'), 'utf-8');
    const macroBegin = input.indexOf('#define GUI_DEFINE_KEYBOARD_CODE_BASIC');
    const macroEnd = input.indexOf('#define GUI_DEFINE_KEYBOARD_CODE(ITEM)');
    if (macroBegin === -1 || macroEnd <= macroBegin) {
        throw new Error('The imported TUITypes.h keyboard macro chain is missing.');
    }
    const constants = [...input.matchAll(/KEY_(UNKNOWN|MAXIMUM)\s*=\s*(-?\d+)/gu)];
    const keys = [...input.substring(macroBegin, macroEnd).matchAll(/^ITEM\(([A-Z0-9_]+),\s*(0x[0-9A-Fa-f]+)\)/gmu)];
    if (constants.length !== 2 || keys.length === 0) {
        throw new Error('The imported TUITypes.h keyboard declarations are incomplete.');
    }
    const names = [...constants, ...keys].map(match => match[1]);
    if (new Set(names).size !== names.length) {
        throw new Error('The imported TUITypes.h contains duplicate key names.');
    }
    return [
        '// Generated from VlppOS/Source/TUI/TUITypes.h. Do not edit.',
        'export type Boolean = boolean;\nexport type Integer = number;\nexport type Float = number;\nexport type Double = number;\nexport type String = string;\nexport type Char = string;\nexport type Color = string; // #FFFFFF\nexport type Binary = string; // base64 encoded\n\nexport type Ptr<T> = T | null;\nexport type Nullable<T> = T | null;\nexport type List<T> = T[] | null;\nexport type ArrayMap<T, Key extends string> = (T extends Record<Key, {}> ? T[] : never) | null;\nexport type Dictionary<K, T> = [[K, T]] | null;',
        '',
        '/* eslint-disable @typescript-eslint/no-duplicate-enum-values */',
        'export enum Key {',
        ...[...constants, ...keys].map(match => '    KEY_' + match[1] + ' = ' + match[2] + ','),
        '}',
        '/* eslint-enable @typescript-eslint/no-duplicate-enum-values */',
        '',
    ].join('\n');
}

export function generateRemoteProtocol(outputPath: string): void {
    fs.writeFileSync(path.resolve(outputPath, 'remoteProtocolPrimitiveTypes.ts'), generatePrimitiveTypes());
    const inputJson = path.resolve(__dirname, '../src/Import/Protocols.json');
    const outputTs = path.resolve(outputPath, 'remoteProtocolDefinition.ts');

    if (!fs.existsSync(inputJson)) {
        throw new Error(`Input file not found: ${inputJson}`);
    }

    const astString = fs.readFileSync(inputJson, 'utf-8');
    const ast = (<Schema>JSON.parse(astString));
    const code = generateSchema(ast);
    fs.writeFileSync(outputTs, code);
}
