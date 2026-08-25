import * as RPC from '@gaclib/workflow-rpc';
import type {
    RpcTestServiceFactory,
    RpcTestServiceFactoryContext,
} from '../generated/registry.js';
import {
    DynamicRpcObject,
    createInterfaceValueCodec,
    invoke,
    registerService,
    valueDescriptor,
} from './helpers.js';

type CollectionFamily = 'list' | 'dictionary' | 'observableList';

interface CollectionCase {
    readonly family: CollectionFamily;
    readonly interfaceItems: boolean;
    readonly nested: boolean;
    readonly property: boolean;
}

function describeCase(name: string): CollectionCase {
    const family: CollectionFamily = name.startsWith('CollectionDict_')
        ? 'dictionary'
        : name.startsWith('CollectionOblist_')
            ? 'observableList'
            : 'list';
    return {
        family,
        interfaceItems: name.includes('_Interface_'),
        nested: name.includes('_Nested_'),
        property: name.includes('_Prop'),
    };
}

function isRpcList(value: unknown): value is RPC.RpcReadonlyList<unknown> {
    return typeof value === 'object'
        && value !== null
        && typeof (value as Partial<RPC.RpcReadonlyList<unknown>>).count === 'function'
        && typeof (value as Partial<RPC.RpcReadonlyList<unknown>>).get === 'function';
}

function isRpcDictionary(value: unknown): value is RPC.RpcDictionary<unknown, unknown> {
    return typeof value === 'object'
        && value !== null
        && typeof (value as Partial<RPC.RpcDictionary<unknown, unknown>>).count === 'function'
        && typeof (value as Partial<RPC.RpcDictionary<unknown, unknown>>).get === 'function'
        && typeof (value as Partial<RPC.RpcDictionary<unknown, unknown>>).keys === 'function'
        && typeof (value as Partial<RPC.RpcDictionary<unknown, unknown>>).set === 'function';
}

async function listValues(value: unknown): Promise<unknown[]> {
    if (Array.isArray(value)) return [...(value as unknown[])];
    if (!isRpcList(value)) throw new Error('Expected a Workflow RPC list.');
    const count = await value.count();
    const result: unknown[] = [];
    for (let index = 0; index < count; index++) result.push(await value.get(index));
    return result;
}

async function dictionaryEntries(value: unknown): Promise<[unknown, unknown][]> {
    if (value instanceof Map) return [...value.entries()];
    if (!isRpcDictionary(value)) throw new Error('Expected a Workflow RPC dictionary.');
    const keys = await value.keys();
    try {
        const count = await keys.count();
        const result: [unknown, unknown][] = [];
        for (let index = 0; index < count; index++) {
            const key = await keys.get(index);
            result.push([key, await value.get(key)]);
        }
        return result;
    } finally {
        await keys.dispose();
    }
}

async function firstNested(description: CollectionCase, value: unknown): Promise<unknown> {
    if (description.interfaceItems) {
        if (value instanceof Map) return value.get(0);
        if (isRpcDictionary(value)) return await value.get(0);
        throw new Error('Expected a nested Workflow RPC dictionary.');
    }
    if (Array.isArray(value)) return value[0];
    if (isRpcList(value)) return await value.get(0);
    throw new Error('Expected a nested Workflow RPC list.');
}

function atomicCodec(description: CollectionCase, context: RpcTestServiceFactoryContext): RPC.RpcCodec<unknown> {
    if (description.interfaceItems) {
        return createInterfaceValueCodec(valueDescriptor(context.contract)) as RPC.RpcCodec<unknown>;
    }
    return description.family === 'dictionary' ? RPC.rpcStringCodec : RPC.rpcInt64Codec;
}

function makeLocalAtomicValue(description: CollectionCase, context: RpcTestServiceFactoryContext): unknown {
    if (!description.interfaceItems) return description.family === 'dictionary' ? 'D' : 4;
    const value = description.family === 'dictionary' ? 'D' : description.nested ? 4 : '4';
    const descriptor = valueDescriptor(context.contract);
    const implementation: DynamicRpcObject = {};
    const getValue = descriptor.methods.find(item => item.name === 'GetValue');
    if (getValue === undefined) throw new Error(`${descriptor.name} does not declare GetValue.`);
    implementation[getValue.implementationKey] = (): unknown => value;
    return implementation;
}

async function mutateAtomicCollection(description: CollectionCase, value: unknown, item: unknown): Promise<void> {
    if (description.family === 'dictionary') {
        if (value instanceof Map) {
            value.set(4, item);
            return;
        }
        if (isRpcDictionary(value)) {
            await value.set(4, item);
            return;
        }
        throw new Error('Expected a mutable Workflow RPC dictionary.');
    }
    if (Array.isArray(value)) {
        value.push(item);
        return;
    }
    if (isRpcList(value) && typeof (value as Partial<RPC.RpcList<unknown>>).add === 'function') {
        await (value as RPC.RpcList<unknown>).add(item);
        return;
    }
    throw new Error('Expected a mutable Workflow RPC list.');
}

async function mutateCollection(description: CollectionCase, value: unknown, context: RpcTestServiceFactoryContext): Promise<void> {
    const target = description.nested ? await firstNested(description, value) : value;
    await mutateAtomicCollection(description, target, makeLocalAtomicValue(description, context));
}

async function formatAtomic(description: CollectionCase, value: unknown): Promise<string> {
    if (!description.interfaceItems) return String(value);
    return String(await invoke(value, 'GetValue'));
}

async function formatAtomicCollection(description: CollectionCase, value: unknown): Promise<string> {
    const items = description.family === 'dictionary'
        ? (await dictionaryEntries(value)).flatMap(([key, item]) => [key, item])
        : await listValues(value);
    let result = '';
    for (let index = 0; index < items.length; index++) {
        result += index % 2 === 0 && description.family === 'dictionary'
            ? String(items[index])
            : await formatAtomic(description, items[index]);
    }
    return result;
}

async function formatCollection(description: CollectionCase, value: unknown): Promise<string> {
    const target = description.nested ? await firstNested(description, value) : value;
    return await formatAtomicCollection(description, target);
}

async function materializeAtomicCollection(description: CollectionCase, value: unknown): Promise<unknown> {
    if (description.family === 'dictionary') return new Map(await dictionaryEntries(value));
    return await listValues(value);
}

async function materializeCollection(description: CollectionCase, value: unknown): Promise<unknown> {
    if (!description.nested) return await materializeAtomicCollection(description, value);
    const inner = await materializeAtomicCollection(description, await firstNested(description, value));
    if (description.interfaceItems) return new Map([[0, inner]]);
    return [inner];
}

function localAtomicCollection(
    description: CollectionCase,
    value: unknown,
    itemCodec: RPC.RpcCodec<unknown>,
): { readonly value: unknown; readonly codec: RPC.RpcCodec<unknown> } {
    if (description.family === 'dictionary') {
        if (!(value instanceof Map)) throw new Error('A local dictionary must be backed by Map.');
        const local = new RPC.RpcLocalDictionary(value, RPC.rpcInt64Codec, itemCodec);
        return {
            value: local,
            codec: RPC.createByReferenceDictionaryCodec(RPC.rpcInt64Codec, itemCodec) as RPC.RpcCodec<unknown>,
        };
    }
    if (!Array.isArray(value)) throw new Error('A local list must be backed by Array.');
    if (description.family === 'observableList') {
        const local = new RPC.RpcLocalObservableList(value, itemCodec);
        return {
            value: local,
            codec: RPC.createByReferenceObservableListCodec(itemCodec) as RPC.RpcCodec<unknown>,
        };
    }
    const local = new RPC.RpcLocalList(value, itemCodec);
    return {
        value: local,
        codec: RPC.createByReferenceListCodec(itemCodec) as RPC.RpcCodec<unknown>,
    };
}

function localizeCollection(description: CollectionCase, value: unknown, context: RpcTestServiceFactoryContext): unknown {
    const atom = atomicCodec(description, context);
    if (!description.nested) return localAtomicCollection(description, value, atom).value;

    const nestedValue = description.interfaceItems
        ? value instanceof Map ? (value as Map<unknown, unknown>).get(0) : undefined
        : Array.isArray(value) ? (value as unknown[])[0] : undefined;
    if (nestedValue === undefined) throw new Error('A local nested collection must contain item zero.');
    const inner = localAtomicCollection(description, nestedValue, atom);
    if (description.interfaceItems) {
        if (!(value instanceof Map)) throw new Error('A local nested dictionary must be backed by Map.');
        value.set(0, inner.value);
        return new RPC.RpcLocalDictionary(value, RPC.rpcInt64Codec, inner.codec);
    }
    if (!Array.isArray(value)) throw new Error('A local nested list must be backed by Array.');
    value[0] = inner.value;
    if (description.family === 'observableList') return new RPC.RpcLocalObservableList(value, inner.codec);
    return new RPC.RpcLocalList(value, inner.codec);
}

async function transferResult(
    description: CollectionCase,
    value: unknown,
    transfer: RPC.RpcTransferMode | undefined,
    context: RpcTestServiceFactoryContext,
): Promise<unknown> {
    if (transfer === 'byReference') {
        if (isRpcList(value) || isRpcDictionary(value)) return value;
        return localizeCollection(description, value, context);
    }
    if (transfer === 'byValue') return await materializeCollection(description, value);
    return value;
}

export function createCollectionServiceFactory(name: string): RpcTestServiceFactory {
    const description = describeCase(name);
    return (context): void => {
        const descriptor = context.contract.AllRpcInterfaceDescriptors.find(item => item.constructorService);
        if (descriptor === undefined) throw new Error(`${name} does not contain a constructor service.`);
        const getResult = descriptor.methods.find(item => item.name === 'GetServiceResult');
        if (getResult === undefined) throw new Error(`${name} does not declare GetServiceResult.`);
        let held: unknown = description.family === 'dictionary' ? new Map() : [];
        let propertyValue: unknown = null;
        const implementation: DynamicRpcObject = {
            [getResult.implementationKey]: async (): Promise<string> => await formatCollection(description, held),
        };

        if (description.property) {
            const getter = descriptor.methods.find(item => item.name === 'GetList');
            const setter = descriptor.methods.find(item => item.name === 'SetList');
            if (getter === undefined || setter === undefined) throw new Error(`${name} does not declare the List property accessors.`);
            implementation[getter.implementationKey] = async (): Promise<unknown> => await transferResult(description, propertyValue, getter.result.transfer, context);
            implementation[setter.implementationKey] = async (value: unknown): Promise<void> => {
                held = value;
                await mutateCollection(description, held, context);
                propertyValue = held;
            };
        } else {
            const operation = descriptor.methods.find(item => item.name === 'DoList');
            if (operation === undefined) throw new Error(`${name} does not declare DoList.`);
            implementation[operation.implementationKey] = async (value: unknown): Promise<unknown> => {
                held = value;
                await mutateCollection(description, held, context);
                return await transferResult(description, held, operation.result.transfer, context);
            };
        }
        registerService(context, implementation);
    };
}
