import * as fs from 'fs';
import * as path from 'path';
import { Schema } from './AST';

const __dirname = import.meta.dirname;

function fixIndentation(code: string): string {
}

function generateTypes(schema: Schema): string {
    return `
${schema.declarations.map(decl => {
        switch (decl['$ast']) {
            case 'EnumDecl':
                return '';
            case 'UnionDecl':
                return '';
            case 'StructDecl':
                return '';
            default:
                return '';
        }
    }).join('\n')
        }
    `;
}

function generateRequests(schema: Schema): string {
    return `
|
|export interface IRemoteProtocolRequests {
${schema.declarations.map(decl => {
        switch (decl['$ast']) {
            case 'MessageDecl':
                return '';
            default:
                return '';
        }
    }).join('\n')
        }
|}
    `;
}

function generateResponses(schema: Schema): string {
    return `
|
|export interface IRemoteProtocolResponses {
${schema.declarations.map(decl => {
        switch (decl['$ast']) {
            case 'MessageDecl':
                return '';
            default:
                return '';
        }
    }).join('\n')
        }
|}
    `;
}

function generateEvents(schema: Schema): string {
    return `
|
|export interface IRemoteProtocolEvents {
${schema.declarations.map(decl => {
        switch (decl['$ast']) {
            case 'EventDecl':
                return '';
            default:
                return '';
        }
    }).join('\n')
        }
|}
    `;
}

function generateSchema(schema: Schema): string {
    return fixIndentation(`
${generateTypes(schema)}
${generateRequests(schema)}
${generateResponses(schema)}
${generateEvents(schema)}
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