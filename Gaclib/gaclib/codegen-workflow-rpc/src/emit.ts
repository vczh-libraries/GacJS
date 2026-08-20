import {
    ContractIr,
    InterfaceIr,
    MethodIr,
    TransferMode,
    TypeAst,
} from './model.js';
import { flattenFullName, sanitizeIdentifier } from './validate.js';

export interface GeneratedFile {
    readonly path: string;
    readonly content: string;
}

function quote(value: string): string {
    let content = '';
    for (const character of value) {
        switch (character) {
            case '\\': content += '\\\\'; break;
            case "'": content += "\\'"; break;
            case '\b': content += '\\b'; break;
            case '\f': content += '\\f'; break;
            case '\n': content += '\\n'; break;
            case '\r': content += '\\r'; break;
            case '\t': content += '\\t'; break;
            case '\u2028': content += '\\u2028'; break;
            case '\u2029': content += '\\u2029'; break;
            default: {
                const code = character.codePointAt(0)!;
                content += code < 0x20 ? `\\u${code.toString(16).padStart(4, '0')}` : character;
                break;
            }
        }
    }
    return `'${content}'`;
}

function lowerFirst(value: string): string {
    return value.length === 0 ? value : `${value[0].toLowerCase()}${value.slice(1)}`;
}

function primitiveType(fullName: string): string | undefined {
    switch (fullName) {
        case 'system::Void': return 'void';
        case 'system::Boolean': return 'boolean';
        case 'system::String':
        case 'system::Char':
        case 'system::DateTime':
        case 'system::Locale': return 'string';
        case 'system::UInt8':
        case 'system::UInt16':
        case 'system::UInt32':
        case 'system::UInt64':
        case 'system::Int8':
        case 'system::Int16':
        case 'system::Int32':
        case 'system::Int64':
        case 'system::Single':
        case 'system::Double': return 'number';
        default: return undefined;
    }
}

function namedApplicationType(ir: ContractIr, fullName: string): string {
    const primitive = primitiveType(fullName);
    if (primitive !== undefined) {
        return primitive;
    }
    const declaration = ir.declarationsByFullName.get(fullName);
    const name = ir.interfaces.find(item => item.fullName === fullName)?.tsName
        ?? ir.enums.find(item => item.fullName === fullName)?.tsName
        ?? ir.structs.find(item => item.fullName === fullName)?.tsName
        ?? flattenFullName(fullName);
    return declaration?.kind === 'interface' ? `${name}Object | null` : name;
}

function applicationType(ir: ContractIr, type: TypeAst, transfer: TransferMode): string {
    if (type.kind === 'named') {
        return namedApplicationType(ir, type.fullName);
    }
    if (type.kind === 'nullable') {
        return `${applicationType(ir, type.item, transfer)} | null`;
    }
    const item = applicationType(ir, type.item, transfer);
    if (transfer === 'byReference') {
        switch (type.collectionKind) {
            case 'enumerable': return `RPC.RpcEnumerable<${item}> | null`;
            case 'readonlyList': return `RPC.RpcReadonlyList<${item}> | null`;
            case 'list': return `RPC.RpcList<${item}> | null`;
            case 'array': return `RPC.RpcArray<${item}> | null`;
            case 'observableList': return `RPC.RpcObservableList<${item}> | null`;
            case 'readonlyDictionary': throw new Error('A read-only dictionary cannot be transferred by reference.');
            case 'dictionary': return `RPC.RpcDictionary<${applicationType(ir, type.key!, transfer)}, ${item}> | null`;
        }
    }
    if (type.collectionKind === 'dictionary' || type.collectionKind === 'readonlyDictionary') {
        return `ReadonlyMap<${applicationType(ir, type.key!, transfer)}, ${item}>`;
    }
    return `ReadonlyArray<${item}>`;
}

function primitiveCodec(fullName: string): string | undefined {
    const suffix = fullName.startsWith('system::') ? fullName.substring('system::'.length) : '';
    const codecs: Record<string, string> = {
        Void: 'rpcVoidCodec',
        Boolean: 'rpcBooleanCodec',
        String: 'rpcStringCodec',
        Char: 'rpcCharCodec',
        DateTime: 'rpcDateTimeCodec',
        Locale: 'rpcLocaleCodec',
        UInt8: 'rpcUInt8Codec',
        UInt16: 'rpcUInt16Codec',
        UInt32: 'rpcUInt32Codec',
        UInt64: 'rpcUInt64Codec',
        Int8: 'rpcInt8Codec',
        Int16: 'rpcInt16Codec',
        Int32: 'rpcInt32Codec',
        Int64: 'rpcInt64Codec',
        Single: 'rpcSingleCodec',
        Double: 'rpcDoubleCodec',
    };
    return codecs[suffix] === undefined ? undefined : `RPC.${codecs[suffix]}`;
}

function codecExpression(ir: ContractIr, type: TypeAst, transfer: TransferMode): string {
    if (type.kind === 'named') {
        const primitive = primitiveCodec(type.fullName);
        if (primitive !== undefined) {
            return primitive;
        }
        const declaration = ir.declarationsByFullName.get(type.fullName);
        const name = ir.interfaces.find(item => item.fullName === type.fullName)?.tsName
            ?? ir.enums.find(item => item.fullName === type.fullName)?.tsName
            ?? ir.structs.find(item => item.fullName === type.fullName)?.tsName
            ?? flattenFullName(type.fullName);
        return declaration?.kind === 'interface' ? `${name}Codec` : `${name}Codec`;
    }
    if (type.kind === 'nullable') {
        return `RPC.createNullableCodec(${codecExpression(ir, type.item, transfer)})`;
    }
    const item = codecExpression(ir, type.item, transfer);
    if (transfer === 'byReference') {
        switch (type.collectionKind) {
            case 'enumerable': return `RPC.createByReferenceEnumerableCodec(${item})`;
            case 'readonlyList': return `RPC.createByReferenceReadonlyListCodec(${item})`;
            case 'list': return `RPC.createByReferenceListCodec(${item})`;
            case 'array': return `RPC.createByReferenceArrayCodec(${item})`;
            case 'observableList': return `RPC.createByReferenceObservableListCodec(${item})`;
            case 'readonlyDictionary': throw new Error('A read-only dictionary cannot be transferred by reference.');
            case 'dictionary': return `RPC.createByReferenceDictionaryCodec(${codecExpression(ir, type.key!, transfer)}, ${item})`;
        }
    }
    if (type.collectionKind === 'dictionary' || type.collectionKind === 'readonlyDictionary') {
        return `RPC.createMapCodec(${codecExpression(ir, type.key!, transfer)}, ${item})`;
    }
    return `RPC.createListCodec(${item}, ${quote(type.collectionKind === 'observableList' ? 'oblist' : 'list')})`;
}

function operationConstant(owner: InterfaceIr, operation: MethodIr | InterfaceIr['events'][number]): string {
    return `${owner.tsName}_${sanitizeIdentifier(operation.name)}_${String(operation.idNumber)}Id`;
}

function parameterName(name: string, index: number, used: Set<string>): string {
    const base = sanitizeIdentifier(name);
    let result = base;
    if (used.has(result)) {
        result = `${base}_${String(index + 1)}`;
    }
    used.add(result);
    return result;
}

function methodParameters(ir: ContractIr, method: MethodIr): { declaration: string; arguments: string } {
    const used = new Set<string>();
    const names: string[] = [];
    const declaration = method.parameters.map((parameter, index) => {
        const name = parameterName(parameter.name, index, used);
        names.push(name);
        return `${name}: ${applicationType(ir, parameter.type, parameter.transfer)}`;
    }).join(', ');
    return { declaration, arguments: names.join(', ') };
}

function collectInterfaceClosure(ir: ContractIr, descriptor: InterfaceIr): InterfaceIr[] {
    const byId = new Map(ir.interfaces.map(item => [item.idNumber, item]));
    return [descriptor, ...descriptor.inheritanceClosure.map(id => byId.get(id)!).filter(value => value !== undefined)];
}

function uniqueOperations<T extends { idNumber: number }>(values: readonly T[]): T[] {
    return [...new Map(values.map(value => [value.idNumber, value])).values()];
}

function emitTypeDeclarations(ir: ContractIr): string {
    const lines: string[] = [];
    for (const item of ir.enums) {
        lines.push(`export enum ${item.tsName} {`);
        for (const value of item.items) {
            lines.push(`    ${sanitizeIdentifier(value.name)} = ${String(value.value)},`);
        }
        lines.push('}', '');
    }
    for (const item of ir.structs) {
        lines.push(`export interface ${item.tsName} {`);
        for (const field of item.fields) {
            lines.push(`    ${quote(field.name)}: ${applicationType(ir, field.type, 'value')};`);
        }
        lines.push('}', '');
    }
    for (const descriptor of ir.interfaces) {
        const bases = descriptor.baseTypeIds.map(id => ir.interfaces.find(item => item.idNumber === id)!).filter(value => value !== undefined);
        const localExtends = bases.length === 0 ? '' : ` extends ${bases.map(base => `${base.tsName}Local`).join(', ')}`;
        lines.push(`export const ${descriptor.tsName}LocalToken = Symbol(${quote(descriptor.idString)});`);
        lines.push(`export interface ${descriptor.tsName}Local${localExtends} {`);
        for (const method of descriptor.methods) {
            const parameters = methodParameters(ir, method);
            const result = applicationType(ir, method.result.type, method.result.transfer);
            lines.push(`    ${method.implementationKey}(${parameters.declaration}): ${result} | Promise<${result}>;`);
        }
        for (const event of descriptor.events) {
            const arguments_ = event.parameters.map(parameter => applicationType(ir, parameter.type, parameter.transfer)).join(', ');
            lines.push(`    readonly ${event.propertyKey}: RPC.RpcEvent<[${arguments_}]>;`);
        }
        lines.push('}', '');
        const proxyExtends = bases.length === 0
            ? 'RPC.RpcDisposable'
            : `RPC.RpcDisposable, ${bases.map(base => `${base.tsName}Proxy`).join(', ')}`;
        lines.push(`export interface ${descriptor.tsName}Proxy extends ${proxyExtends} {`);
        const closure = collectInterfaceClosure(ir, descriptor);
        for (const method of uniqueOperations(closure.flatMap(item => item.methods))) {
            const parameters = methodParameters(ir, method);
            const result = applicationType(ir, method.result.type, method.result.transfer);
            lines.push(`    ${method.implementationKey}(${parameters.declaration}): Promise<${result}>;`);
        }
        for (const event of uniqueOperations(closure.flatMap(item => item.events))) {
            const arguments_ = event.parameters.map(parameter => applicationType(ir, parameter.type, parameter.transfer)).join(', ');
            lines.push(`    readonly ${event.propertyKey}: RPC.RpcEvent<[${arguments_}]>;`);
        }
        for (const property of uniqueOperations(closure.flatMap(item => item.properties.map(value => ({ ...value, idNumber: value.getterMethodId }))))) {
            const type = applicationType(ir, property.type, property.transfer);
            lines.push(`    ${sanitizeIdentifier(lowerFirst(`Get${property.name}`))}(): Promise<${type}>;`);
            if (property.setterMethodId !== undefined) {
                lines.push(`    ${sanitizeIdentifier(lowerFirst(`Set${property.name}`))}(value: ${type}): Promise<void>;`);
            }
        }
        lines.push('}', `export type ${descriptor.tsName}Object = ${descriptor.tsName}Local | ${descriptor.tsName}Proxy;`, '');
    }
    return lines.join('\n');
}

function emitConstants(ir: ContractIr): string {
    const lines: string[] = [];
    for (const descriptor of ir.interfaces) {
        lines.push(`export const ${descriptor.tsName}TypeId = ${String(descriptor.idNumber)};`);
        for (const method of descriptor.methods) {
            lines.push(`export const ${operationConstant(descriptor, method)} = ${String(method.idNumber)};`);
        }
        for (const event of descriptor.events) {
            lines.push(`export const ${operationConstant(descriptor, event)} = ${String(event.idNumber)};`);
        }
    }
    return `${lines.join('\n')}\n`;
}

function emitProxyClasses(ir: ContractIr): string {
    const lines: string[] = [];
    for (const descriptor of ir.interfaces) {
        const closure = collectInterfaceClosure(ir, descriptor);
        const methods = uniqueOperations(closure.flatMap(item => item.methods));
        const events = uniqueOperations(closure.flatMap(item => item.events));
        const properties = uniqueOperations(closure.flatMap(item => item.properties.map(value => ({ owner: item, ...value, idNumber: value.getterMethodId }))));
        lines.push(`class ${descriptor.tsName}ProxyImpl extends RPC.RpcProxy implements ${descriptor.tsName}Proxy {`);
        for (const event of events) {
            const arguments_ = event.parameters.map(parameter => applicationType(ir, parameter.type, parameter.transfer)).join(', ');
            lines.push(`    readonly ${event.propertyKey} = new RPC.RpcEvent<[${arguments_}]>();`);
        }
        if (events.length > 0) {
            lines.push('');
        }
        const invalidations = properties.flatMap(property => {
            if (property.changedEventId === undefined) return [];
            const event = events.find(value => value.idNumber === property.changedEventId);
            if (event === undefined) {
                throw new Error(`Missing changed event ${String(property.changedEventId)} for ${property.owner.fullName}.${property.name}.`);
            }
            return [{ property, event }];
        });
        if (events.length > 0) {
            lines.push('    constructor(context: RPC.RpcProxyContext) {', '        super(context);');
            for (const event of events) {
                const owner = closure.find(item => item.events.some(itemEvent => itemEvent.idNumber === event.idNumber))!;
                lines.push(`        this.${event.propertyKey}.setOutgoing((...arguments_) => this.raiseEvent(${operationConstant(owner, event)}, arguments_));`);
            }
            for (const { property, event } of invalidations) {
                const key = `${property.owner.tsName}.${property.name}`;
                lines.push(`        this.${event.propertyKey}.subscribe(() => this.invalidateProperty(${quote(key)}));`);
            }
            lines.push('    }', '');
        }
        for (const method of methods) {
            const owner = closure.find(item => item.methods.some(itemMethod => itemMethod.idNumber === method.idNumber))!;
            const parameters = methodParameters(ir, method);
            const result = applicationType(ir, method.result.type, method.result.transfer);
            lines.push(`    ${method.implementationKey}(${parameters.declaration}): Promise<${result}> {`);
            lines.push(`        return this.invoke<${result}>(${operationConstant(owner, method)}, [${parameters.arguments}]);`);
            lines.push('    }', '');
        }
        for (const property of properties) {
            const type = applicationType(ir, property.type, property.transfer);
            const getterName = sanitizeIdentifier(lowerFirst(`Get${property.name}`));
            const key = `${property.owner.tsName}.${property.name}`;
            lines.push(`    ${getterName}(): Promise<${type}> {`);
            if (property.cached) {
                lines.push(`        return this.getCachedProperty<${type}>(${quote(key)}, () => this.invoke<${type}>(${String(property.getterMethodId)}, []));`);
            } else {
                lines.push(`        return this.invoke<${type}>(${String(property.getterMethodId)}, []);`);
            }
            lines.push('    }', '');
            if (property.setterMethodId !== undefined) {
                const setterName = sanitizeIdentifier(lowerFirst(`Set${property.name}`));
                lines.push(`    async ${setterName}(value: ${type}): Promise<void> {`);
                lines.push(`        await this.invoke<void>(${String(property.setterMethodId)}, [value]);`);
                lines.push(`        this.invalidateProperty(${quote(key)});`);
                lines.push('    }', '');
            }
        }
        if (events.length > 0) {
            lines.push('    protected override onFinalize(): void {');
            for (const event of events) {
                lines.push(`        this.${event.propertyKey}.clear();`);
            }
            lines.push('        super.onFinalize();', '    }', '');
        }
        lines.push('}', '');
        lines.push(`export const ${descriptor.tsName}ProxyFactory: RPC.RpcReferenceFactory<${descriptor.tsName}Proxy> = {`);
        lines.push(`    key: ${quote(descriptor.idString)},`);
        lines.push(`    create: context => new ${descriptor.tsName}ProxyImpl(context),`);
        lines.push('};', '');
    }
    return lines.join('\n');
}

function structDependencies(type: TypeAst, structs: ReadonlySet<string>, result: Set<string>): void {
    if (type.kind === 'named') {
        if (structs.has(type.fullName)) {
            result.add(type.fullName);
        }
        return;
    }
    structDependencies(type.item, structs, result);
    if (type.kind === 'collection' && type.key !== undefined) {
        structDependencies(type.key, structs, result);
    }
}

function orderedStructs(ir: ContractIr): ContractIr['structs'][number][] {
    const byName = new Map(ir.structs.map(item => [item.fullName, item]));
    const result: ContractIr['structs'][number][] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (name: string): void => {
        if (visited.has(name)) return;
        if (visiting.has(name)) throw new Error(`Recursive value struct: ${name}`);
        visiting.add(name);
        const item = byName.get(name)!;
        const dependencies = new Set<string>();
        for (const field of item.fields) structDependencies(field.type, new Set(byName.keys()), dependencies);
        dependencies.delete(name);
        for (const dependency of [...dependencies].sort()) visit(dependency);
        visiting.delete(name);
        visited.add(name);
        result.push(item);
    };
    for (const name of [...byName.keys()].sort()) visit(name);
    return result;
}

function emitCodecs(ir: ContractIr): string {
    const lines: string[] = [];
    for (const item of ir.enums) {
        const values = item.flags ? 'undefined' : `new Set([${item.items.map(value => String(value.value)).join(', ')}])`;
        lines.push(`export const ${item.tsName}Codec = RPC.createEnumCodec<${item.tsName}>(${quote(item.fullName)}, ${values});`);
    }
    if (ir.enums.length > 0) lines.push('');
    for (const descriptor of ir.interfaces) {
        lines.push(`export const ${descriptor.tsName}Codec = RPC.createInterfaceCodec<${descriptor.tsName}Object>(`);
        lines.push(`    ${descriptor.tsName}TypeId,`);
        lines.push(`    ${descriptor.tsName}ProxyFactory as RPC.RpcReferenceFactory<${descriptor.tsName}Object>,`);
        lines.push(');');
    }
    if (ir.interfaces.length > 0) lines.push('');
    for (const item of orderedStructs(ir)) {
        lines.push(`export const ${item.tsName}Codec = RPC.createStructCodec<${item.tsName}>(${quote(item.fullName)}, [`);
        for (const field of item.fields) {
            lines.push(`    { key: ${quote(field.name)}, codec: ${codecExpression(ir, field.type, 'value')} },`);
        }
        lines.push(']);', '');
    }
    return lines.join('\n');
}

function emitDescriptors(ir: ContractIr): string {
    const lines: string[] = [];
    for (const descriptor of ir.interfaces) {
        lines.push(`export const ${descriptor.tsName}Descriptor: RPC.RpcInterfaceDescriptor<${descriptor.tsName}Local, ${descriptor.tsName}Proxy> = {`);
        lines.push(`    typeId: ${descriptor.tsName}TypeId,`);
        lines.push(`    idString: ${quote(descriptor.idString)},`);
        lines.push(`    name: ${quote(descriptor.fullName)},`);
        lines.push(`    constructorService: ${String(descriptor.constructorService)},`);
        lines.push(`    baseTypeIds: [${descriptor.baseTypeIds.join(', ')}],`);
        lines.push('    methods: [');
        for (const method of descriptor.methods) {
            lines.push('        {');
            lines.push(`            id: ${operationConstant(descriptor, method)},`);
            lines.push(`            idString: ${quote(method.idString)},`);
            lines.push(`            name: ${quote(method.name)},`);
            lines.push(`            implementationKey: ${quote(method.implementationKey)},`);
            lines.push('            parameters: [');
            for (const parameter of method.parameters) {
                lines.push(`                { codec: ${codecExpression(ir, parameter.type, parameter.transfer)}, transfer: ${quote(parameter.transfer)} },`);
            }
            lines.push('            ],');
            lines.push(`            result: { codec: ${codecExpression(ir, method.result.type, method.result.transfer)}, transfer: ${quote(method.result.transfer)} },`);
            lines.push('        },');
        }
        lines.push('    ],', '    events: [');
        for (const event of descriptor.events) {
            lines.push('        {');
            lines.push(`            id: ${operationConstant(descriptor, event)},`);
            lines.push(`            idString: ${quote(event.idString)},`);
            lines.push(`            name: ${quote(event.name)},`);
            lines.push(`            propertyKey: ${quote(event.propertyKey)},`);
            lines.push('            parameters: [');
            for (const parameter of event.parameters) {
                lines.push(`                { codec: ${codecExpression(ir, parameter.type, parameter.transfer)}, transfer: ${quote(parameter.transfer)} },`);
            }
            lines.push('            ],', '        },');
        }
        lines.push('    ],', '    properties: [');
        for (const property of descriptor.properties) {
            lines.push('        {');
            lines.push(`            name: ${quote(property.name)},`);
            lines.push(`            getterMethodId: ${String(property.getterMethodId)},`);
            if (property.setterMethodId !== undefined) lines.push(`            setterMethodId: ${String(property.setterMethodId)},`);
            if (property.changedEventId !== undefined) lines.push(`            changedEventId: ${String(property.changedEventId)},`);
            lines.push(`            cached: ${String(property.cached)},`, '        },');
        }
        lines.push('    ],');
        lines.push(`    proxyFactory: ${descriptor.tsName}ProxyFactory,`);
        lines.push(`    localToken: ${descriptor.tsName}LocalToken,`);
        lines.push('};', '');
    }
    lines.push('export const AllRpcInterfaceDescriptors: readonly RPC.RpcInterfaceDescriptor[] = [');
    for (const descriptor of ir.interfaces) lines.push(`    ${descriptor.tsName}Descriptor as unknown as RPC.RpcInterfaceDescriptor,`);
    lines.push('];', '');
    lines.push('export function configureRpcEndpoint(endpoint: RPC.RpcEndpoint): void {');
    lines.push('    for (const descriptor of AllRpcInterfaceDescriptors) endpoint.registerInterface(descriptor);');
    lines.push('}', '');
    for (const descriptor of ir.interfaces.filter(item => item.constructorService)) {
        lines.push(`export function register${descriptor.tsName}Service(endpoint: RPC.RpcEndpoint, implementation: ${descriptor.tsName}Local): RPC.RpcObjectReference {`);
        lines.push(`    return endpoint.registerService(${descriptor.tsName}Descriptor, implementation);`);
        lines.push('}', '');
        lines.push(`export function request${descriptor.tsName}Service(endpoint: RPC.RpcEndpoint): Promise<${descriptor.tsName}Object> {`);
        lines.push(`    return endpoint.requestService<${descriptor.tsName}Object>(${descriptor.tsName}TypeId);`);
        lines.push('}', '');
    }
    return lines.join('\n');
}

export function emitWorkflowRpcContract(ir: ContractIr): readonly GeneratedFile[] {
    const generated = [
        '// This file is generated by @gaclib/codegen-workflow-rpc. Do not edit.',
        "import * as RPC from '@gaclib/workflow-rpc';",
        '',
        emitTypeDeclarations(ir),
        emitConstants(ir),
        emitProxyClasses(ir),
        emitCodecs(ir),
        emitDescriptors(ir),
    ].join('\n').replaceAll('\r\n', '\n').replace(/\n{3,}/gu, '\n\n').trimEnd() + '\n';
    return [{ path: 'generated.ts', content: generated }];
}
