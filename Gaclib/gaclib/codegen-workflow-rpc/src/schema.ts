import ts from 'typescript';
import { SourceLocation, WorkflowRpcDiagnostic } from './model.js';

export type SchemaSymbolKind = 'enum' | 'interface' | 'type';

export type SchemaValueType =
    | { readonly kind: 'primitive'; readonly name: 'boolean' | 'number' | 'string' }
    | { readonly kind: 'null' }
    | { readonly kind: 'never' }
    | { readonly kind: 'reference'; readonly name: string }
    | { readonly kind: 'array'; readonly item: SchemaValueType }
    | { readonly kind: 'tuple'; readonly items: readonly SchemaValueType[] }
    | { readonly kind: 'union'; readonly items: readonly SchemaValueType[] }
    | { readonly kind: 'nullable'; readonly item: SchemaValueType }
    | { readonly kind: 'literal'; readonly value: string | number | boolean };

export interface SchemaProperty {
    readonly name: string;
    readonly optional: boolean;
    readonly type: SchemaValueType;
    readonly location: SourceLocation;
}

export interface SchemaEnumMember {
    readonly name: string;
    readonly value: number;
    readonly location: SourceLocation;
}

export interface SchemaSymbol {
    readonly name: string;
    readonly kind: SchemaSymbolKind;
    readonly location: SourceLocation;
    readonly properties?: readonly SchemaProperty[];
    readonly enumMembers?: readonly SchemaEnumMember[];
    readonly aliasType?: SchemaValueType;
    readonly bases?: readonly string[];
}

function locationOf(path: string, source: ts.SourceFile, node: ts.Node): SourceLocation {
    const start = node.getStart(source);
    const position = source.getLineAndCharacterOfPosition(start);
    return { path, offset: start, line: position.line + 1, column: position.character + 1 };
}

function schemaValueType(path: string, source: ts.SourceFile, node: ts.TypeNode): SchemaValueType {
    if (ts.isParenthesizedTypeNode(node)) return schemaValueType(path, source, node.type);
    switch (node.kind) {
        case ts.SyntaxKind.BooleanKeyword: return { kind: 'primitive', name: 'boolean' };
        case ts.SyntaxKind.NumberKeyword: return { kind: 'primitive', name: 'number' };
        case ts.SyntaxKind.StringKeyword: return { kind: 'primitive', name: 'string' };
        case ts.SyntaxKind.NeverKeyword: return { kind: 'never' };
    }
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeArguments === undefined) {
        return { kind: 'reference', name: node.typeName.text };
    }
    if (ts.isArrayTypeNode(node)) {
        return { kind: 'array', item: schemaValueType(path, source, node.elementType) };
    }
    if (ts.isTupleTypeNode(node)) {
        return { kind: 'tuple', items: node.elements.map(item => schemaValueType(path, source, item)) };
    }
    if (ts.isUnionTypeNode(node)) {
        const nonNull = node.types.filter(item => !(ts.isLiteralTypeNode(item) && item.literal.kind === ts.SyntaxKind.NullKeyword));
        if (nonNull.length === 1 && nonNull.length + 1 === node.types.length) {
            return { kind: 'nullable', item: schemaValueType(path, source, nonNull[0]) };
        }
        return { kind: 'union', items: node.types.map(item => schemaValueType(path, source, item)) };
    }
    if (ts.isLiteralTypeNode(node)) {
        if (node.literal.kind === ts.SyntaxKind.NullKeyword) return { kind: 'null' };
        if (ts.isStringLiteral(node.literal) || ts.isNumericLiteral(node.literal)) {
            return { kind: 'literal', value: ts.isStringLiteral(node.literal) ? node.literal.text : Number(node.literal.text) };
        }
        if (node.literal.kind === ts.SyntaxKind.TrueKeyword || node.literal.kind === ts.SyntaxKind.FalseKeyword) {
            return { kind: 'literal', value: node.literal.kind === ts.SyntaxKind.TrueKeyword };
        }
    }
    throw new WorkflowRpcDiagnostic(`Unsupported serialization schema type ${node.getText(source)}.`, locationOf(path, source, node));
}

function propertyName(path: string, source: ts.SourceFile, name: ts.PropertyName): string {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
    throw new WorkflowRpcDiagnostic('Computed serialization schema property names are unsupported.', locationOf(path, source, name));
}

function enumValue(path: string, source: ts.SourceFile, member: ts.EnumMember): number {
    const initializer = member.initializer;
    if (initializer !== undefined && ts.isNumericLiteral(initializer)) return Number(initializer.text);
    if (initializer !== undefined && ts.isPrefixUnaryExpression(initializer)
        && initializer.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(initializer.operand)) {
        return -Number(initializer.operand.text);
    }
    throw new WorkflowRpcDiagnostic('Serialization schema enums require explicit numeric values.', locationOf(path, source, member));
}

export function parseSchemaSymbols(path: string, text: string): ReadonlyMap<string, SchemaSymbol> {
    const source = ts.createSourceFile(path, text.replace(/^\uFEFF/u, ''), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    const diagnostics = (source as unknown as { readonly parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
    if (diagnostics.length > 0) {
        const diagnostic = diagnostics[0];
        const start = diagnostic.start ?? 0;
        const position = source.getLineAndCharacterOfPosition(start);
        throw new WorkflowRpcDiagnostic(
            ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
            { path, offset: start, line: position.line + 1, column: position.character + 1 },
        );
    }
    const result = new Map<string, SchemaSymbol>();
    for (const statement of source.statements) {
        let kind: SchemaSymbolKind;
        let name: ts.Identifier | undefined;
        if (ts.isEnumDeclaration(statement)) {
            kind = 'enum';
            name = statement.name;
        } else if (ts.isInterfaceDeclaration(statement)) {
            kind = 'interface';
            name = statement.name;
        } else if (ts.isTypeAliasDeclaration(statement)) {
            kind = 'type';
            name = statement.name;
        } else if (ts.isEmptyStatement(statement)) {
            continue;
        } else {
            const position = source.getLineAndCharacterOfPosition(statement.getStart(source));
            throw new WorkflowRpcDiagnostic(
                `Unsupported declaration in serialization schema: ${ts.SyntaxKind[statement.kind]}.`,
                { path, offset: statement.getStart(source), line: position.line + 1, column: position.character + 1 },
            );
        }
        const textName = name.text;
        const start = name.getStart(source);
        const position = source.getLineAndCharacterOfPosition(start);
        if (result.has(textName)) {
            throw new WorkflowRpcDiagnostic(
                `Duplicate serialization schema symbol ${textName}.`,
                { path, offset: start, line: position.line + 1, column: position.character + 1 },
            );
        }
        let properties: readonly SchemaProperty[] | undefined;
        let enumMembers: readonly SchemaEnumMember[] | undefined;
        let aliasType: SchemaValueType | undefined;
        let bases: readonly string[] | undefined;
        if (ts.isInterfaceDeclaration(statement)) {
            properties = statement.members.map(member => {
                if (!ts.isPropertySignature(member) || member.type === undefined) {
                    throw new WorkflowRpcDiagnostic('Serialization schema interfaces support property signatures only.', locationOf(path, source, member));
                }
                return {
                    name: propertyName(path, source, member.name),
                    optional: member.questionToken !== undefined,
                    type: schemaValueType(path, source, member.type),
                    location: locationOf(path, source, member),
                };
            });
            const parsedBases: string[] = [];
            for (const clause of statement.heritageClauses ?? []) {
                for (const base of clause.types) {
                    if (clause.token !== ts.SyntaxKind.ExtendsKeyword || base.typeArguments !== undefined || !ts.isIdentifier(base.expression)) {
                        throw new WorkflowRpcDiagnostic(
                            'Serialization schema interfaces support non-generic identifier base interfaces only.',
                            locationOf(path, source, base),
                        );
                    }
                    parsedBases.push(base.expression.text);
                }
            }
            bases = parsedBases;
        } else if (ts.isEnumDeclaration(statement)) {
            enumMembers = statement.members.map(member => ({
                name: propertyName(path, source, member.name),
                value: enumValue(path, source, member),
                location: locationOf(path, source, member),
            }));
        } else if (ts.isTypeAliasDeclaration(statement)) {
            aliasType = schemaValueType(path, source, statement.type);
        }
        result.set(textName, {
            name: textName,
            kind,
            location: { path, offset: start, line: position.line + 1, column: position.character + 1 },
            properties,
            enumMembers,
            aliasType,
            bases,
        });
    }
    return result;
}
