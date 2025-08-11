import * as fs from 'fs';
import * as path from 'path';
import { Schema, Type } from './AST';

const __dirname = import.meta.dirname;

function fixIndentation(code: string): string {
    // Break code into lines
    const lines = code.split('\n');

    const processedLines: string[] = [];

    for (const line of lines) {
        // Check if line is only spaces - if so, remove it
        if (line.trim() === '') {
            continue;
        }

        // Check if line begins with zero or more spaces followed by '|'
        const match = line.match(/^(\s*)\|(.*)$/);
        if (match) {
            // Remove the spaces before '|' and keep the content after '|'
            processedLines.push(match[2]);
        } else {
            // Line doesn't match the expected pattern, throw error
            throw new Error(`Invalid line format: "${line}". Expected line to be empty or start with spaces followed by '|'.`);
        }
    }

    // Join them back to a string
    return processedLines.join('\r\n');
}

function collectClassNames(schema: Schema): string[] {
    const classNames: string[] = [];
    schema.declarations.forEach(decl => {
        if (decl['$ast'] === 'StructDecl' && decl.type === 'Class') {
            classNames.push(decl.name);
        }
    });
    return classNames;
}

function refToString(element: string, classNames: string[]): string {
    return classNames.includes(element) ? `TYPES.Ptr<${element}>` : element;
}

function typeToString(t: Type, classNames: string[]): string {
    switch (t['$ast']) {
        case 'PrimitiveType':
            return `<TYPES.${t.type}>`;
        case 'ReferenceType':
            return refToString(t.name, classNames);
        case 'OptionalType':
            return `TYPES.Nullable<${typeToString(t.element, classNames)}>`;
        case 'ArrayType':
            return `TYPES.List<${typeToString(t.element, classNames)}>`;
        case 'ArrayMapType':
            return `TYPES.ArrayMap<${refToString(t.element, classNames)}, ${t.keyField}>`;
        case 'MapType':
            return `TYPES.Dictionary<${typeToString(t.keyType, classNames)}, ${typeToString(t.element, classNames)}>`;
    }
}

function generateEnums(schema: Schema, classNames: string[]): string {
    return `
    ${schema.declarations.filter(decl => decl['$ast'] === 'EnumDecl').map(decl => {
        return ''
    }).join('\n')}
    `;
}

function generateUnions(schema: Schema, classNames: string[]): string {
    return `
    ${schema.declarations.filter(decl => decl['$ast'] === 'UnionDecl').map(decl => {
        return ''
    }).join('\n')}
    `;
}

function generateStructs(schema: Schema, classNames: string[]): string {
    return `
    ${schema.declarations.filter(decl => decl['$ast'] === 'StructDecl').map(decl => {
        return ''
    }).join('\n')}
    `;
}

function generateRequests(schema: Schema, classNames: string[]): string {
    return `
|
|export interface IRemoteProtocolRequests {
    ${schema.declarations.filter(decl => decl['$ast'] === 'MessageDecl').map(decl => {
        return ''
    }).join('\n')}
|}`;
}

function generateResponses(schema: Schema, classNames: string[]): string {
    return `
|
|export interface IRemoteProtocolResponses {
    ${schema.declarations.filter(decl => decl['$ast'] === 'MessageDecl').map(decl => {
        return ''
    }).join('\n')}
|}`;
}

function generateEvents(schema: Schema, classNames: string[]): string {
    return `
|
|export interface IRemoteProtocolEvents {
    ${schema.declarations.filter(decl => decl['$ast'] === 'EventDecl').map(decl => {
        return ''
    }).join('\n')}
|}`;
}

function generateSchema(schema: Schema): string {
    const classNames = collectClassNames(schema);
    return fixIndentation(`
|import * as TYPES from './remoteProtocolPrimitiveTypes.js';
|
${generateEnums(schema, classNames)}
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