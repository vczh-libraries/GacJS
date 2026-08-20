import {
    AttributeAst,
    ContractAst,
    ContractIr,
    EventIr,
    InterfaceAst,
    InterfaceIr,
    MethodIr,
    PropertyIr,
    TransferMode,
    TypeAst,
    TypeDeclarationAst,
    WorkflowRpcDiagnostic,
} from './model.js';
import { SchemaSymbol, SchemaValueType } from './schema.js';

const primitiveNames = new Set([
    'system::Void',
    'system::Boolean',
    'system::String',
    'system::Char',
    'system::DateTime',
    'system::Locale',
    'system::UInt8',
    'system::UInt16',
    'system::UInt32',
    'system::UInt64',
    'system::Int8',
    'system::Int16',
    'system::Int32',
    'system::Int64',
    'system::Single',
    'system::Double',
]);

const reservedIdentifiers = new Set([
    'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else',
    'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'implements', 'import', 'in', 'instanceof',
    'interface', 'let', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'static', 'super', 'switch',
    'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield',
]);

export function sanitizeIdentifier(name: string): string {
    let result = name.replace(/[^A-Za-z0-9_$]/gu, '_');
    if (!/^[A-Za-z_$]/u.test(result)) {
        result = `_${result}`;
    }
    if (reservedIdentifiers.has(result)) {
        result = `${result}_`;
    }
    return result;
}

export function flattenFullName(fullName: string): string {
    return sanitizeIdentifier(fullName.replaceAll('::', '_'));
}

function propertyMethodName(prefix: 'Get' | 'Set', name: string): string {
    const combined = `${prefix}${name}`;
    return sanitizeIdentifier(`${combined[0].toLowerCase()}${combined.slice(1)}`);
}

function attributes(attributes: readonly AttributeAst[], name: string): AttributeAst[] {
    return attributes.filter(attribute => attribute.name === name);
}

function validateAttributes(attributes_: readonly AttributeAst[], allowed: ReadonlySet<string>, fullName: string): void {
    for (const attribute of attributes_) {
        if (!allowed.has(attribute.name)) {
            throw new WorkflowRpcDiagnostic(`Unsupported @${attribute.name} attribute.`, attribute.location, fullName);
        }
    }
}

function flag(attributes_: readonly AttributeAst[], name: string, fullName: string): boolean {
    const matches = attributes(attributes_, name);
    if (matches.length > 1) {
        throw new WorkflowRpcDiagnostic(`Duplicate @${name} attribute.`, matches[1].location, fullName);
    }
    if (matches.length === 1 && matches[0].arguments.length !== 0) {
        throw new WorkflowRpcDiagnostic(`@${name} does not take arguments.`, matches[0].location, fullName);
    }
    return matches.length === 1;
}

function idAttribute(attributes_: readonly AttributeAst[], name: string, expected: 'string' | 'number', fullName: string): string | number {
    const matches = attributes(attributes_, name);
    if (matches.length !== 1) {
        const location = matches[0]?.location ?? attributes_[0]?.location;
        if (location === undefined) {
            throw new Error(`Missing source location for ${fullName}.`);
        }
        throw new WorkflowRpcDiagnostic(`Exactly one @${name} attribute is required.`, location, fullName);
    }
    const values = matches[0].arguments;
    if (values.length !== 1 || typeof values[0] !== expected) {
        throw new WorkflowRpcDiagnostic(`@${name} requires one ${expected} argument.`, matches[0].location, fullName);
    }
    if (expected === 'number' && (!Number.isSafeInteger(values[0]) || (values[0] as number) < 0)) {
        throw new WorkflowRpcDiagnostic(`@${name} must be a nonnegative safe integer.`, matches[0].location, fullName, values[0]);
    }
    if (expected === 'string' && (values[0] as string).length === 0) {
        throw new WorkflowRpcDiagnostic(`@${name} cannot be empty.`, matches[0].location, fullName);
    }
    return values[0];
}

function isCollection(type: TypeAst): type is Extract<TypeAst, { kind: 'collection' }> {
    return type.kind === 'collection';
}

function containsInterface(type: TypeAst, declarations: ReadonlyMap<string, TypeDeclarationAst>): boolean {
    if (type.kind === 'named') {
        return declarations.get(type.fullName)?.kind === 'interface';
    }
    if (type.kind === 'nullable') {
        return containsInterface(type.item, declarations);
    }
    return containsInterface(type.item, declarations);
}

function eventTransfer(type: TypeAst, declarations: ReadonlyMap<string, TypeDeclarationAst>): TransferMode {
    if (!isCollection(type)) {
        return 'value';
    }
    return type.collectionKind === 'observableList' || containsInterface(type.item, declarations)
        ? 'byReference'
        : 'byValue';
}

function transfer(
    attributes_: readonly AttributeAst[],
    type: TypeAst,
    fullName: string,
    event: boolean,
    declarations: ReadonlyMap<string, TypeDeclarationAst>,
): TransferMode {
    const byValue = flag(attributes_, 'rpc:Byval', fullName);
    const byReference = flag(attributes_, 'rpc:Byref', fullName);
    if (byValue && byReference) {
        throw new WorkflowRpcDiagnostic('A use site cannot be both @rpc:Byval and @rpc:Byref.', attributes_[0].location, fullName);
    }
    if (!isCollection(type)) {
        if (byValue || byReference) {
            throw new WorkflowRpcDiagnostic('Collection transfer attributes require a strongly typed collection.', attributes_[0].location, fullName);
        }
        return 'value';
    }
    if (event) {
        if (byValue || byReference) {
            throw new WorkflowRpcDiagnostic('Event parameters cannot specify collection transfer attributes.', attributes_[0].location, fullName);
        }
        const mode = eventTransfer(type, declarations);
        if (mode === 'byValue' && type.collectionKind === 'enumerable') {
            throw new WorkflowRpcDiagnostic(
                'By-value enumerable T{} is unsupported until cross-language materialization behavior is defined.',
                type.location,
                fullName,
            );
        }
        return mode;
    }
    if (byValue === byReference) {
        const location = attributes_[0]?.location ?? type.location;
        throw new WorkflowRpcDiagnostic('A normalized collection use site requires exactly one @rpc:Byval or @rpc:Byref.', location, fullName);
    }
    if (byReference && type.collectionKind === 'readonlyDictionary') {
        throw new WorkflowRpcDiagnostic(
            'A read-only dictionary cannot be transferred by reference because Workflow RPC defines no read-only-dictionary object type.',
            type.location,
            fullName,
        );
    }
    const mode = byValue ? 'byValue' : 'byReference';
    if (mode === 'byValue' && type.collectionKind === 'enumerable') {
        throw new WorkflowRpcDiagnostic(
            'By-value enumerable T{} is unsupported until cross-language materialization behavior is defined.',
            type.location,
            fullName,
        );
    }
    return mode;
}

function typeKey(type: TypeAst): string {
    if (type.kind === 'named') {
        return `${type.fullName}${type.interfaceReference ? '^' : ''}`;
    }
    if (type.kind === 'nullable') {
        return `${typeKey(type.item)}?`;
    }
    return `${type.collectionKind}<${typeKey(type.item)}${type.key === undefined ? '' : `,${typeKey(type.key)}`}>`;
}

function validateType(type: TypeAst, declarations: ReadonlyMap<string, TypeDeclarationAst>, owner: string): void {
    if (type.kind === 'named') {
        if (primitiveNames.has(type.fullName)) {
            if (type.interfaceReference) {
                throw new WorkflowRpcDiagnostic('A primitive type cannot use the interface-reference marker.', type.location, owner);
            }
            return;
        }
        const declaration = declarations.get(type.fullName);
        if (declaration === undefined) {
            throw new WorkflowRpcDiagnostic(`Unresolved RPC type ${type.fullName}.`, type.location, owner);
        }
        if ((declaration.kind === 'interface') !== type.interfaceReference) {
            throw new WorkflowRpcDiagnostic(
                declaration.kind === 'interface'
                    ? `Interface type ${type.fullName} requires ^.`
                    : `Value type ${type.fullName} cannot use ^.`,
                type.location,
                owner,
            );
        }
        return;
    }
    validateType(type.item, declarations, owner);
    if (type.kind === 'collection' && type.key !== undefined) {
        validateType(type.key, declarations, owner);
    }
}

function validateStructRecursion(declarations: ReadonlyMap<string, TypeDeclarationAst>): void {
    const state = new Map<string, 'visiting' | 'visited'>();
    const structDependencies = (type: TypeAst, result: Set<string>): void => {
        if (type.kind === 'named') {
            if (declarations.get(type.fullName)?.kind === 'struct') result.add(type.fullName);
            return;
        }
        structDependencies(type.item, result);
        if (type.kind === 'collection' && type.key !== undefined) structDependencies(type.key, result);
    };
    const visit = (declaration: Extract<TypeDeclarationAst, { kind: 'struct' }>): void => {
        if (state.get(declaration.fullName) === 'visited') return;
        state.set(declaration.fullName, 'visiting');
        for (const field of declaration.fields) {
            const dependencies = new Set<string>();
            structDependencies(field.type, dependencies);
            for (const dependency of dependencies) {
                if (state.get(dependency) === 'visiting') {
                    throw new WorkflowRpcDiagnostic(
                        `Recursive value struct dependency through ${dependency} is unsupported.`,
                        field.location,
                        declaration.fullName,
                    );
                }
                const target = declarations.get(dependency);
                if (target?.kind === 'struct') visit(target);
            }
        }
        state.set(declaration.fullName, 'visited');
    };
    for (const declaration of declarations.values()) {
        if (declaration.kind === 'struct') visit(declaration);
    }
}

function expectedSchemaType(type: TypeAst, declarations: ReadonlyMap<string, TypeDeclarationAst>): SchemaValueType {
    if (type.kind === 'named') {
        if (type.fullName === 'system::Boolean') return { kind: 'primitive', name: 'boolean' };
        if (type.fullName === 'system::String' || type.fullName === 'system::Char'
            || type.fullName === 'system::DateTime' || type.fullName === 'system::Locale') {
            return { kind: 'primitive', name: 'string' };
        }
        if (primitiveNames.has(type.fullName)) return { kind: 'primitive', name: 'number' };
        const declaration = declarations.get(type.fullName);
        return {
            kind: 'reference',
            name: declaration?.kind === 'interface' ? 'system_RpcObjectReference' : flattenFullName(type.fullName),
        };
    }
    if (type.kind === 'nullable') {
        return { kind: 'nullable', item: expectedSchemaType(type.item, declarations) };
    }
    if (type.collectionKind === 'dictionary' || type.collectionKind === 'readonlyDictionary') {
        return {
            kind: 'array',
            item: {
                kind: 'tuple',
                items: [expectedSchemaType(type.key!, declarations), expectedSchemaType(type.item, declarations)],
            },
        };
    }
    return { kind: 'array', item: expectedSchemaType(type.item, declarations) };
}

function equalSchemaType(left: SchemaValueType, right: SchemaValueType): boolean {
    if (left.kind !== right.kind) return false;
    switch (left.kind) {
        case 'null':
        case 'never': return true;
        case 'primitive': return left.name === (right as typeof left).name;
        case 'reference': return left.name === (right as typeof left).name;
        case 'literal': return left.value === (right as typeof left).value;
        case 'array': return equalSchemaType(left.item, (right as typeof left).item);
        case 'nullable': return equalSchemaType(left.item, (right as typeof left).item);
        case 'union': {
            const items = (right as typeof left).items;
            return left.items.length === items.length && left.items.every((item, index) => equalSchemaType(item, items[index]));
        }
        case 'tuple': {
            const items = (right as typeof left).items;
            return left.items.length === items.length && left.items.every((item, index) => equalSchemaType(item, items[index]));
        }
    }
}

function displaySchemaType(type: SchemaValueType): string {
    switch (type.kind) {
        case 'null': return 'null';
        case 'never': return 'never';
        case 'primitive': return type.name;
        case 'reference': return type.name;
        case 'literal': return JSON.stringify(type.value);
        case 'array': return `Array<${displaySchemaType(type.item)}>`;
        case 'nullable': return `${displaySchemaType(type.item)} | null`;
        case 'union': return type.items.map(displaySchemaType).join(' | ');
        case 'tuple': return `[${type.items.map(displaySchemaType).join(', ')}]`;
    }
}

function unionItems(type: SchemaValueType, symbolName: string, location: SchemaSymbol['location']): readonly SchemaValueType[] {
    if (type.kind !== 'union') {
        throw new WorkflowRpcDiagnostic(`Serialization schema alias ${symbolName} must be a union.`, location);
    }
    return type.items;
}

function hasDirectReference(items: readonly SchemaValueType[], name: string): boolean {
    return items.some(item => item.kind === 'reference' && item.name === name);
}

function validateSchemaReferences(schemaSymbols: ReadonlyMap<string, SchemaSymbol>): void {
    const visitType = (type: SchemaValueType, owner: SchemaSymbol): void => {
        if (type.kind === 'reference') {
            if (!schemaSymbols.has(type.name)) {
                throw new WorkflowRpcDiagnostic(
                    `Serialization schema symbol ${owner.name} references missing symbol ${type.name}.`,
                    owner.location,
                );
            }
            return;
        }
        if (type.kind === 'array' || type.kind === 'nullable') {
            visitType(type.item, owner);
        } else if (type.kind === 'tuple' || type.kind === 'union') {
            for (const item of type.items) visitType(item, owner);
        }
    };
    for (const symbol of schemaSymbols.values()) {
        if (symbol.aliasType !== undefined) visitType(symbol.aliasType, symbol);
        for (const property of symbol.properties ?? []) visitType(property.type, symbol);
        for (const base of symbol.bases ?? []) {
            if (!schemaSymbols.has(base)) {
                throw new WorkflowRpcDiagnostic(
                    `Serialization schema interface ${symbol.name} extends missing symbol ${base}.`,
                    symbol.location,
                );
            }
        }
    }
}

function validateSchema(
    declarations: readonly TypeDeclarationAst[],
    schemaSymbols: ReadonlyMap<string, SchemaSymbol>,
): void {
    const declarationMap = new Map(declarations.map(declaration => [declaration.fullName, declaration]));
    validateSchemaReferences(schemaSymbols);
    const expectedSymbols = new Set<string>();
    for (const declaration of declarations) {
        if (declaration.kind === 'interface') {
            continue;
        }
        const name = flattenFullName(declaration.fullName);
        expectedSymbols.add(name);
        const symbol = schemaSymbols.get(name);
        if (symbol === undefined) {
            throw new WorkflowRpcDiagnostic(`Serialization schema is missing ${name}.`, declaration.location, declaration.fullName);
        }
        if (declaration.kind === 'enum' && symbol.kind !== 'enum') {
            throw new WorkflowRpcDiagnostic(`Serialization schema symbol ${name} must be an enum.`, symbol.location, declaration.fullName);
        }
        if (declaration.kind === 'struct' && symbol.kind !== 'interface') {
            throw new WorkflowRpcDiagnostic(`Serialization schema symbol ${name} must be an interface.`, symbol.location, declaration.fullName);
        }
        if (declaration.kind === 'enum') {
            const members = symbol.enumMembers ?? [];
            if (members.length !== declaration.items.length) {
                throw new WorkflowRpcDiagnostic(`Serialization enum ${name} has an incompatible member count.`, symbol.location, declaration.fullName);
            }
            for (let i = 0; i < declaration.items.length; i++) {
                const expected = declaration.items[i];
                const actual = members[i];
                if (actual.name !== expected.name || actual.value !== expected.value) {
                    throw new WorkflowRpcDiagnostic(`Serialization enum ${name} member ${actual.name} is incompatible with ${expected.name} = ${String(expected.value)}.`, actual.location, declaration.fullName);
                }
            }
        } else {
            const properties = symbol.properties ?? [];
            const expectedFields = new Map(declaration.fields.map(field => [field.name, field]));
            if (properties.length !== expectedFields.size) {
                throw new WorkflowRpcDiagnostic(`Serialization struct ${name} has an incompatible field count.`, symbol.location, declaration.fullName);
            }
            for (const property of properties) {
                const field = expectedFields.get(property.name);
                if (field === undefined || property.optional) {
                    throw new WorkflowRpcDiagnostic(`Serialization struct ${name} has incompatible field ${property.name}.`, property.location, declaration.fullName);
                }
                const expected = expectedSchemaType(field.type, declarationMap);
                if (!equalSchemaType(property.type, expected)) {
                    throw new WorkflowRpcDiagnostic(
                        `Serialization field ${name}.${property.name} must be ${displaySchemaType(expected)}, not ${displaySchemaType(property.type)}.`,
                        property.location,
                        declaration.fullName,
                    );
                }
            }
        }
    }
    for (const required of ['system_RpcObjectReference', 'system_RpcException', 'UnknownTypeSchema', 'KnownTypeSchema']) {
        if (!schemaSymbols.has(required)) {
            const fallback = declarations[0]?.location;
            if (fallback === undefined) {
                throw new Error(`Serialization schema is missing ${required}.`);
            }
            throw new WorkflowRpcDiagnostic(`Serialization schema is missing required symbol ${required}.`, fallback);
        }
    }
    const validateSystemInterface = (name: string, fields: ReadonlyMap<string, SchemaValueType>): void => {
        const symbol = schemaSymbols.get(name)!;
        if (symbol.kind !== 'interface') {
            throw new WorkflowRpcDiagnostic(`Serialization schema symbol ${name} must be an interface.`, symbol.location);
        }
        const properties = symbol.properties ?? [];
        if (properties.length !== fields.size) {
            throw new WorkflowRpcDiagnostic(`Serialization schema interface ${name} has an incompatible field count.`, symbol.location);
        }
        for (const property of properties) {
            const expected = fields.get(property.name);
            if (expected === undefined || property.optional || !equalSchemaType(property.type, expected)) {
                throw new WorkflowRpcDiagnostic(`Serialization schema interface ${name} has incompatible field ${property.name}.`, property.location);
            }
        }
    };
    validateSystemInterface('system_RpcObjectReference', new Map([
        ['clientId', { kind: 'primitive', name: 'number' }],
        ['objectId', { kind: 'primitive', name: 'number' }],
        ['typeId', { kind: 'primitive', name: 'number' }],
    ] as const));
    validateSystemInterface('system_RpcException', new Map([
        ['message', { kind: 'primitive', name: 'string' }],
    ] as const));

    const requiredAliasUnion = (name: string): readonly SchemaValueType[] => {
        const symbol = schemaSymbols.get(name)!;
        if (symbol.kind !== 'type' || symbol.aliasType === undefined) {
            throw new WorkflowRpcDiagnostic(`Serialization schema symbol ${name} must be a type alias.`, symbol.location);
        }
        return unionItems(symbol.aliasType, name, symbol.location);
    };
    const unknownItems = requiredAliasUnion('UnknownTypeSchema');
    const knownItems = requiredAliasUnion('KnownTypeSchema');
    const expectedTaggedTypes = new Map<string, string>([
        ['system_RpcObjectReference', 'system::RpcObjectReference'],
        ['system_RpcException', 'system::RpcException'],
    ]);
    for (const declaration of declarations) {
        if (declaration.kind === 'struct') {
            expectedTaggedTypes.set(flattenFullName(declaration.fullName), declaration.fullName);
        }
    }
    for (const [baseName, wireName] of expectedTaggedTypes) {
        const taggedName = `UnknownType_${baseName}`;
        const tagged = schemaSymbols.get(taggedName);
        if (tagged === undefined || tagged.kind !== 'interface') {
            const fallback = schemaSymbols.get('UnknownTypeSchema')!;
            throw new WorkflowRpcDiagnostic(`Serialization schema is missing tagged interface ${taggedName}.`, fallback.location);
        }
        if (tagged.bases?.length !== 1 || tagged.bases[0] !== baseName) {
            throw new WorkflowRpcDiagnostic(
                `Serialization schema interface ${taggedName} must extend ${baseName}.`,
                tagged.location,
            );
        }
        const properties = tagged.properties ?? [];
        const tag = properties.find(property => property.name === '$');
        if (properties.length !== 1 || tag === undefined || tag.optional
            || tag.type.kind !== 'literal' || tag.type.value !== wireName) {
            throw new WorkflowRpcDiagnostic(
                `Serialization schema interface ${taggedName} must declare the discriminator "$": ${JSON.stringify(wireName)}.`,
                tag?.location ?? tagged.location,
            );
        }
        if (!hasDirectReference(unknownItems, taggedName)) {
            throw new WorkflowRpcDiagnostic(
                `UnknownTypeSchema must include ${taggedName}.`,
                schemaSymbols.get('UnknownTypeSchema')!.location,
            );
        }
        if (!hasDirectReference(knownItems, baseName)) {
            throw new WorkflowRpcDiagnostic(
                `KnownTypeSchema must include ${baseName}.`,
                schemaSymbols.get('KnownTypeSchema')!.location,
            );
        }
    }

    const typeListEnum = schemaSymbols.get('TypeList_Enum');
    if (typeListEnum !== undefined) {
        if (typeListEnum.kind !== 'type' || typeListEnum.aliasType === undefined) {
            throw new WorkflowRpcDiagnostic('TypeList_Enum must be a type alias.', typeListEnum.location);
        }
        const expectedEnumNames = declarations.filter(declaration => declaration.kind === 'enum').map(declaration => declaration.fullName).sort();
        const actualEnumNames = typeListEnum.aliasType.kind === 'never'
            ? []
            : unionItems(typeListEnum.aliasType, typeListEnum.name, typeListEnum.location).map(item => {
                if (item.kind !== 'literal' || typeof item.value !== 'string') {
                    throw new WorkflowRpcDiagnostic('TypeList_Enum must contain string literal enum names.', typeListEnum.location);
                }
                return item.value;
            }).sort();
        if (expectedEnumNames.length !== actualEnumNames.length
            || expectedEnumNames.some((name, index) => name !== actualEnumNames[index])) {
            throw new WorkflowRpcDiagnostic(
                `TypeList_Enum must contain exactly: ${expectedEnumNames.length === 0 ? 'never' : expectedEnumNames.join(', ')}.`,
                typeListEnum.location,
            );
        }
    }
    for (const symbol of schemaSymbols.values()) {
        const generic = symbol.name.startsWith('UnknownType_')
            || symbol.name === 'UnknownTypeSchema'
            || symbol.name === 'KnownTypeSchema'
            || symbol.name === 'TypeList_Enum'
            || symbol.name === 'system_RpcObjectReference'
            || symbol.name === 'system_RpcException';
        if (!generic && !expectedSymbols.has(symbol.name)) {
            throw new WorkflowRpcDiagnostic(`Unexpected custom serialization schema symbol ${symbol.name}.`, symbol.location);
        }
    }
}

export function validateWorkflowRpcContract(
    ast: ContractAst,
    schemaSymbols: ReadonlyMap<string, SchemaSymbol>,
): ContractIr {
    const declarations = new Map<string, TypeDeclarationAst>();
    const tsNames = new Map<string, string>();
    for (const declaration of ast.declarations) {
        if (declarations.has(declaration.fullName)) {
            throw new WorkflowRpcDiagnostic(`Duplicate declaration ${declaration.fullName}.`, declaration.location, declaration.fullName);
        }
        declarations.set(declaration.fullName, declaration);
        const tsName = flattenFullName(declaration.fullName);
        const previous = tsNames.get(tsName);
        if (previous !== undefined) {
            throw new WorkflowRpcDiagnostic(`Flattened TypeScript name ${tsName} collides with ${previous}.`, declaration.location, declaration.fullName);
        }
        tsNames.set(tsName, declaration.fullName);
    }
    for (const declaration of ast.declarations) {
        if (declaration.kind !== 'enum') continue;
        const itemNames = new Set<string>();
        for (const item of declaration.items) {
            if (!Number.isSafeInteger(item.value)) {
                throw new WorkflowRpcDiagnostic('Enum values must be safe integers.', item.location, declaration.fullName, item.value);
            }
            const itemName = sanitizeIdentifier(item.name);
            if (itemNames.has(itemName)) {
                throw new WorkflowRpcDiagnostic(`Enum item TypeScript name collision: ${itemName}.`, item.location, declaration.fullName);
            }
            itemNames.add(itemName);
        }
    }
    validateSchema(ast.declarations, schemaSymbols);
    const simpleNameCounts = new Map<string, number>();
    for (const declaration of ast.declarations) {
        const simple = sanitizeIdentifier(declaration.name);
        simpleNameCounts.set(simple, (simpleNameCounts.get(simple) ?? 0) + 1);
    }
    const emittedName = (declaration: TypeDeclarationAst): string => {
        const simple = sanitizeIdentifier(declaration.name);
        return simpleNameCounts.get(simple) === 1 ? simple : flattenFullName(declaration.fullName);
    };

    for (const declaration of ast.declarations) {
        if (declaration.kind === 'struct') {
            const fieldNames = new Set<string>();
            for (const field of declaration.fields) {
                validateType(field.type, declarations, declaration.fullName);
                const fieldName = sanitizeIdentifier(field.name);
                if (fieldNames.has(fieldName)) {
                    throw new WorkflowRpcDiagnostic(`Struct field TypeScript name collision: ${fieldName}.`, field.location, declaration.fullName);
                }
                fieldNames.add(fieldName);
            }
        }
    }
    validateStructRecursion(declarations);

    const interfacesByName = new Map<string, InterfaceIr>();
    const globalIds = new Map<number, string>();
    const globalStrings = new Map<string, string>();

    const claimId = (id: number, idString: string, fullName: string, location: InterfaceAst['location']): void => {
        const existingId = globalIds.get(id);
        if (existingId !== undefined) {
            throw new WorkflowRpcDiagnostic(`Numeric RPC ID ${String(id)} collides with ${existingId}.`, location, fullName, id);
        }
        const existingString = globalStrings.get(idString);
        if (existingString !== undefined) {
            throw new WorkflowRpcDiagnostic(`String RPC ID ${idString} collides with ${existingString}.`, location, fullName, idString);
        }
        globalIds.set(id, fullName);
        globalStrings.set(idString, fullName);
    };

    for (const declaration of ast.declarations) {
        if (declaration.kind !== 'interface') {
            continue;
        }
        validateAttributes(declaration.attributes, new Set(['rpc:Interface', 'rpc:Ctor', 'rpc:IdString', 'rpc:IdNumber']), declaration.fullName);
        if (!flag(declaration.attributes, 'rpc:Interface', declaration.fullName)) {
            throw new WorkflowRpcDiagnostic('RPC interface is missing @rpc:Interface.', declaration.location, declaration.fullName);
        }
        const idString = idAttribute(declaration.attributes, 'rpc:IdString', 'string', declaration.fullName) as string;
        const idNumber = idAttribute(declaration.attributes, 'rpc:IdNumber', 'number', declaration.fullName) as number;
        claimId(idNumber, idString, declaration.fullName, declaration.location);

        const overloadCounts = new Map<string, number>();
        for (const method of declaration.methods) {
            overloadCounts.set(method.name, (overloadCounts.get(method.name) ?? 0) + 1);
        }
        const methods: MethodIr[] = declaration.methods.map(method => {
            const operationName = `${declaration.fullName}.${method.name}`;
            validateAttributes(method.attributes, new Set(['rpc:IdString', 'rpc:IdNumber', 'rpc:Byval', 'rpc:Byref']), operationName);
            const methodIdString = idAttribute(method.attributes, 'rpc:IdString', 'string', operationName) as string;
            const methodIdNumber = idAttribute(method.attributes, 'rpc:IdNumber', 'number', operationName) as number;
            claimId(methodIdNumber, methodIdString, operationName, method.location);
            validateType(method.result, declarations, operationName);
            const resultTransfer = transfer(method.attributes, method.result, operationName, false, declarations);
            const parameters = method.parameters.map(parameter => {
                validateAttributes(parameter.attributes, new Set(['rpc:Byval', 'rpc:Byref']), operationName);
                validateType(parameter.type, declarations, operationName);
                return {
                    ...parameter,
                    type: parameter.type,
                    transfer: transfer(parameter.attributes, parameter.type, operationName, false, declarations),
                };
            });
            const implementationKey = overloadCounts.get(method.name) === 1
                ? sanitizeIdentifier(method.name)
                : `${sanitizeIdentifier(method.name)}_${String(methodIdNumber)}`;
            return {
                ...method,
                idString: methodIdString,
                idNumber: methodIdNumber,
                implementationKey,
                parameters,
                result: { type: method.result, transfer: resultTransfer },
            };
        });
        const events: EventIr[] = declaration.events.map(event => {
            const operationName = `${declaration.fullName}.${event.name}`;
            validateAttributes(event.attributes, new Set(['rpc:IdString', 'rpc:IdNumber']), operationName);
            const eventIdString = idAttribute(event.attributes, 'rpc:IdString', 'string', operationName) as string;
            const eventIdNumber = idAttribute(event.attributes, 'rpc:IdNumber', 'number', operationName) as number;
            claimId(eventIdNumber, eventIdString, operationName, event.location);
            return {
                ...event,
                idString: eventIdString,
                idNumber: eventIdNumber,
                propertyKey: sanitizeIdentifier(event.name),
                parameters: event.parameters.map(parameter => {
                    validateAttributes(parameter.attributes, new Set(['rpc:Byval', 'rpc:Byref']), operationName);
                    validateType(parameter.type, declarations, operationName);
                    return {
                        ...parameter,
                        type: parameter.type,
                        transfer: transfer(parameter.attributes, parameter.type, operationName, true, declarations),
                    };
                }),
            };
        });
        const methodByName = new Map<string, MethodIr[]>();
        for (const method of methods) {
            const list = methodByName.get(method.name) ?? [];
            list.push(method);
            methodByName.set(method.name, list);
        }
        const eventByName = new Map(events.map(event => [event.name, event]));
        const properties: PropertyIr[] = declaration.properties.map(property => {
            const propertyName = `${declaration.fullName}.${property.name}`;
            validateAttributes(property.attributes, new Set(['rpc:Cached', 'rpc:Dynamic', 'rpc:Byval', 'rpc:Byref']), propertyName);
            validateType(property.type, declarations, propertyName);
            const cached = flag(property.attributes, 'rpc:Cached', propertyName);
            const dynamic = flag(property.attributes, 'rpc:Dynamic', propertyName);
            if (cached === dynamic) {
                throw new WorkflowRpcDiagnostic('A property requires exactly one @rpc:Cached or @rpc:Dynamic.', property.location, propertyName);
            }
            const getters = methodByName.get(property.getter) ?? [];
            if (getters.length !== 1 || getters[0].parameters.length !== 0 || typeKey(getters[0].result.type) !== typeKey(property.type)) {
                throw new WorkflowRpcDiagnostic(`Invalid getter link ${property.getter}.`, property.location, propertyName);
            }
            const hasExplicitTransfer = property.attributes.some(attribute => attribute.name === 'rpc:Byval' || attribute.name === 'rpc:Byref');
            const propertyTransfer = property.type.kind === 'collection' && !hasExplicitTransfer
                ? getters[0].result.transfer
                : transfer(property.attributes, property.type, propertyName, false, declarations);
            if (getters[0].result.transfer !== propertyTransfer) {
                throw new WorkflowRpcDiagnostic(`Getter transfer mode disagrees with property ${property.name}.`, property.location, propertyName);
            }
            let setterMethodId: number | undefined;
            if (property.setter !== undefined) {
                const setters = methodByName.get(property.setter) ?? [];
                if (setters.length !== 1 || setters[0].parameters.length !== 1
                    || typeKey(setters[0].parameters[0].type) !== typeKey(property.type)
                    || typeKey(setters[0].result.type) !== 'system::Void') {
                    throw new WorkflowRpcDiagnostic(`Invalid setter link ${property.setter}.`, property.location, propertyName);
                }
                if (setters[0].parameters[0].transfer !== propertyTransfer) {
                    throw new WorkflowRpcDiagnostic(`Setter transfer mode disagrees with property ${property.name}.`, property.location, propertyName);
                }
                setterMethodId = setters[0].idNumber;
            }
            let changedEventId: number | undefined;
            if (property.changedEvent !== undefined) {
                const event = eventByName.get(property.changedEvent);
                if (event === undefined) {
                    throw new WorkflowRpcDiagnostic(`Invalid changed-event link ${property.changedEvent}.`, property.location, propertyName);
                }
                changedEventId = event.idNumber;
            }
            return {
                ...property,
                cached,
                transfer: propertyTransfer,
                getterMethodId: getters[0].idNumber,
                setterMethodId,
                changedEventId,
            };
        });
        interfacesByName.set(declaration.fullName, {
            ...declaration,
            idString,
            idNumber,
            constructorService: flag(declaration.attributes, 'rpc:Ctor', declaration.fullName),
            baseTypeIds: [],
            inheritanceClosure: [],
            methods,
            events,
            properties,
            tsName: emittedName(declaration),
        });
    }

    const resolveBases = (current: InterfaceIr, visiting: Set<string>): number[] => {
        if (visiting.has(current.fullName)) {
            throw new WorkflowRpcDiagnostic('RPC interface inheritance cycle.', current.location, current.fullName, current.idNumber);
        }
        visiting.add(current.fullName);
        const result: number[] = [];
        for (const baseType of current.bases) {
            if (baseType.kind !== 'named' || baseType.interfaceReference) {
                throw new WorkflowRpcDiagnostic('An RPC base must be an interface name without ^.', baseType.location, current.fullName);
            }
            const base = interfacesByName.get(baseType.fullName);
            if (base === undefined) {
                throw new WorkflowRpcDiagnostic(`Unresolved RPC base ${baseType.fullName}.`, baseType.location, current.fullName);
            }
            result.push(base.idNumber, ...resolveBases(base, new Set(visiting)));
        }
        return [...new Set(result)];
    };

    const interfaces = [...interfacesByName.values()].map(current => {
        const baseTypeIds = current.bases.map(base => {
            if (base.kind !== 'named') {
                throw new WorkflowRpcDiagnostic('An RPC base must be a named interface.', base.location, current.fullName);
            }
            const resolved = interfacesByName.get(base.fullName);
            if (resolved === undefined) {
                throw new WorkflowRpcDiagnostic(`Unresolved RPC base ${base.fullName}.`, base.location, current.fullName);
            }
            return resolved.idNumber;
        });
        return { ...current, baseTypeIds, inheritanceClosure: resolveBases(current, new Set()) };
    }).sort((left, right) => left.idNumber - right.idNumber);

    const interfacesById = new Map(interfaces.map(item => [item.idNumber, item]));
    const reservedProxyMembers = new Set([
        'disposed', 'dispose', 'reference', 'endpoint', 'invoke', 'raiseEvent',
        'getCachedProperty', 'invalidateProperty', 'clearPropertyCache', 'finalizeLocalState', 'onFinalize',
    ]);
    for (const descriptor of interfaces) {
        const closure = [descriptor, ...descriptor.inheritanceClosure.map(id => interfacesById.get(id)!).filter(item => item !== undefined)];
        const claimed = new Map<string, string>();
        const claimMember = (name: string, identity: string, location: InterfaceAst['location']): void => {
            if (reservedProxyMembers.has(name)) {
                throw new WorkflowRpcDiagnostic(`Generated RPC member ${name} collides with the proxy runtime.`, location, descriptor.fullName);
            }
            const previous = claimed.get(name);
            if (previous !== undefined && previous !== identity) {
                throw new WorkflowRpcDiagnostic(`Generated RPC member name collision: ${name}.`, location, descriptor.fullName);
            }
            claimed.set(name, identity);
        };
        for (const owner of closure) {
            for (const method of owner.methods) {
                claimMember(method.implementationKey, `method:${String(method.idNumber)}`, method.location);
            }
            for (const event of owner.events) {
                claimMember(event.propertyKey, `event:${String(event.idNumber)}`, event.location);
            }
            for (const property of owner.properties) {
                claimMember(
                    propertyMethodName('Get', property.name),
                    `getter:${String(property.getterMethodId)}`,
                    property.location,
                );
                if (property.setterMethodId !== undefined) {
                    claimMember(
                        propertyMethodName('Set', property.name),
                        `setter:${String(property.setterMethodId)}`,
                        property.location,
                    );
                }
            }
        }
    }

    const enums = ast.declarations.filter(declaration => declaration.kind === 'enum').map(declaration => ({ ...declaration, tsName: emittedName(declaration) }));
    const structs = ast.declarations.filter(declaration => declaration.kind === 'struct').map(declaration => ({ ...declaration, tsName: emittedName(declaration) }));
    const generatedNames = new Map<string, string>();
    const claimGeneratedName = (name: string, identity: string, location: InterfaceAst['location'], fullName?: string): void => {
        const previous = generatedNames.get(name);
        if (previous !== undefined && previous !== identity) {
            throw new WorkflowRpcDiagnostic(`Generated TypeScript name ${name} collides with ${previous}.`, location, fullName);
        }
        generatedNames.set(name, identity);
    };
    const fallbackLocation = ast.declarations[0]?.location;
    if (fallbackLocation !== undefined) {
        claimGeneratedName('RPC', 'the workflow-rpc namespace import', fallbackLocation);
        claimGeneratedName('AllRpcInterfaceDescriptors', 'the descriptor registry', fallbackLocation);
        claimGeneratedName('configureRpcEndpoint', 'the endpoint configuration helper', fallbackLocation);
    }
    for (const declaration of enums) {
        claimGeneratedName(declaration.tsName, declaration.fullName, declaration.location, declaration.fullName);
        claimGeneratedName(`${declaration.tsName}Codec`, `${declaration.fullName} codec`, declaration.location, declaration.fullName);
    }
    for (const declaration of structs) {
        claimGeneratedName(declaration.tsName, declaration.fullName, declaration.location, declaration.fullName);
        claimGeneratedName(`${declaration.tsName}Codec`, `${declaration.fullName} codec`, declaration.location, declaration.fullName);
    }
    for (const descriptor of interfaces) {
        const names = [
            `${descriptor.tsName}LocalToken`, `${descriptor.tsName}Local`, `${descriptor.tsName}Proxy`,
            `${descriptor.tsName}Object`, `${descriptor.tsName}TypeId`, `${descriptor.tsName}ProxyImpl`,
            `${descriptor.tsName}ProxyFactory`, `${descriptor.tsName}Codec`, `${descriptor.tsName}Descriptor`,
        ];
        for (const name of names) claimGeneratedName(name, descriptor.fullName, descriptor.location, descriptor.fullName);
        if (descriptor.constructorService) {
            claimGeneratedName(`register${descriptor.tsName}Service`, `${descriptor.fullName} registration helper`, descriptor.location, descriptor.fullName);
            claimGeneratedName(`request${descriptor.tsName}Service`, `${descriptor.fullName} request helper`, descriptor.location, descriptor.fullName);
        }
        for (const operation of [...descriptor.methods, ...descriptor.events]) {
            claimGeneratedName(
                `${descriptor.tsName}_${sanitizeIdentifier(operation.name)}_${String(operation.idNumber)}Id`,
                operation.idString,
                operation.location,
                descriptor.fullName,
            );
        }
    }

    return {
        moduleName: ast.moduleName,
        enums,
        structs,
        interfaces,
        declarationsByFullName: declarations,
    };
}
