import {
    createRpcCodec,
    rpcBooleanCodec,
    rpcInt32Codec,
    rpcVoidCodec,
    validateReferenceOrNull,
} from './codecs.js';
import { RpcException, RpcProtocolError } from './errors.js';
import { RpcEvent } from './events.js';
import { RpcProxy } from './proxy.js';
import {
    NULL_RPC_REFERENCE,
    RpcCodec,
    RpcDisposable,
    RpcEndpointServices,
    RpcEventId_IValueObservableList_ItemChanged,
    RpcJsonValue,
    RpcMethodDescriptor,
    RpcMethodId_IValueArray_Resize,
    RpcMethodId_IValueDictionary_Clear,
    RpcMethodId_IValueDictionary_Remove,
    RpcMethodId_IValueDictionary_Set,
    RpcMethodId_IValueEnumerable_CreateEnumerator,
    RpcMethodId_IValueEnumerator_GetCurrent,
    RpcMethodId_IValueEnumerator_Next,
    RpcMethodId_IValueList_Add,
    RpcMethodId_IValueList_Clear,
    RpcMethodId_IValueList_Insert,
    RpcMethodId_IValueList_RemoveAt,
    RpcMethodId_IValueList_Set,
    RpcMethodId_IValueReadonlyDictionary_ContainsKey,
    RpcMethodId_IValueReadonlyDictionary_Get,
    RpcMethodId_IValueReadonlyDictionary_GetCount,
    RpcMethodId_IValueReadonlyDictionary_GetKeys,
    RpcMethodId_IValueReadonlyDictionary_GetValues,
    RpcMethodId_IValueReadonlyList_Contains,
    RpcMethodId_IValueReadonlyList_Get,
    RpcMethodId_IValueReadonlyList_GetCount,
    RpcMethodId_IValueReadonlyList_IndexOf,
    RpcProxyContext,
    RpcReferenceFactory,
    RpcTypeId_IValueArray,
    RpcTypeId_IValueDictionary,
    RpcTypeId_IValueEnumerable,
    RpcTypeId_IValueEnumerator,
    RpcTypeId_IValueList,
    RpcTypeId_IValueObservableList,
    RpcTypeId_IValueReadonlyList,
    RpcValueUse,
} from './types.js';
import { expectSafeInteger, readReference } from './validation.js';

const predefinedLocalBrand = Symbol('RpcPredefinedLocalObject');
const predefinedProxyBrand = Symbol('RpcPredefinedProxy');

interface RpcPredefinedLocalObject {
    readonly [predefinedLocalBrand]: true;
    readonly typeId: number;
    invoke(endpoint: RpcEndpointServices, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue>;
    invokeEvent?(eventId: number, arguments_: readonly RpcJsonValue[]): Promise<void>;
    detach?(): void;
}

interface RpcPredefinedProxy {
    readonly [predefinedProxyBrand]: true;
    method(methodId: number): RpcMethodDescriptor;
    invokeEvent(eventId: number, arguments_: readonly RpcJsonValue[]): Promise<void>;
}

export function isPredefinedLocalObject(value: object): value is object & RpcPredefinedLocalObject {
    return predefinedLocalBrand in value;
}

export function getPredefinedLocalTypeId(value: object): number | undefined {
    return isPredefinedLocalObject(value) ? value.typeId : undefined;
}

export function invokePredefinedLocal(
    value: object,
    endpoint: RpcEndpointServices,
    methodId: number,
    arguments_: readonly RpcJsonValue[],
): Promise<RpcJsonValue> {
    if (!isPredefinedLocalObject(value)) {
        return Promise.reject(new RpcProtocolError('The target is not a predefined RPC object.'));
    }
    return value.invoke(endpoint, methodId, arguments_);
}

export function invokePredefinedLocalEvent(
    value: object,
    eventId: number,
    arguments_: readonly RpcJsonValue[],
): Promise<void> {
    if (!isPredefinedLocalObject(value) || value.invokeEvent === undefined) {
        return Promise.reject(new RpcProtocolError('The target does not support predefined RPC events.'));
    }
    return value.invokeEvent(eventId, arguments_);
}

export function detachPredefinedLocal(value: object): void {
    if (isPredefinedLocalObject(value)) {
        value.detach?.();
    }
}

export function attachPredefinedLocal(
    value: object,
    broadcaster: (eventId: number, arguments_: RpcJsonValue[]) => Promise<void>,
): (() => void) | undefined {
    if (!(value instanceof RpcLocalObservableList)) {
        return undefined;
    }
    value.itemChanged.setOutgoing((index, oldCount, newCount) => broadcaster(
        RpcEventId_IValueObservableList_ItemChanged,
        [
            ['Int32', index],
            ['Int32', oldCount],
            ['Int32', newCount],
        ],
    ));
    return () => value.itemChanged.setOutgoing(undefined);
}

function readUnknownInt32(value: RpcJsonValue, description: string): number {
    if (!Array.isArray(value) || value.length !== 2 || value[0] !== 'Int32') {
        throw new RpcProtocolError(`${description} must be an unknown Int32.`);
    }
    return expectSafeInteger(value[1], description);
}

export function getPredefinedProxyMethod(value: object, methodId: number): RpcMethodDescriptor | undefined {
    if (!(predefinedProxyBrand in value)) {
        return undefined;
    }
    return (value as object & RpcPredefinedProxy).method(methodId);
}

export function invokePredefinedProxyEvent(value: object, eventId: number, arguments_: readonly RpcJsonValue[]): Promise<void> {
    if (!(predefinedProxyBrand in value)) {
        return Promise.reject(new RpcProtocolError('The target is not a predefined RPC proxy.'));
    }
    return (value as object & RpcPredefinedProxy).invokeEvent(eventId, arguments_);
}

function unknownUse<T>(codec: RpcCodec<T>): RpcValueUse<T> {
    return { codec };
}

function method(id: number, parameters: readonly RpcValueUse[], result: RpcValueUse): RpcMethodDescriptor {
    return {
        id,
        idString: `predefined:${String(id)}`,
        name: `predefined_${String(id)}`,
        implementationKey: `predefined_${String(id)}`,
        parameters,
        result,
    };
}

export interface RpcEnumerator<T> extends RpcDisposable {
    next(): Promise<boolean>;
    current(): Promise<T>;
}

export interface RpcEnumerable<T> extends RpcDisposable, AsyncIterable<T> {
    createEnumerator(): Promise<RpcEnumerator<T>>;
}

export interface RpcReadonlyList<T> extends RpcEnumerable<T> {
    count(): Promise<number>;
    get(index: number): Promise<T>;
    contains(value: T): Promise<boolean>;
    indexOf(value: T): Promise<number>;
}

export interface RpcList<T> extends RpcReadonlyList<T> {
    set(index: number, value: T): Promise<void>;
    add(value: T): Promise<number>;
    insert(index: number, value: T): Promise<number>;
    removeAt(index: number): Promise<boolean>;
    remove(value: T): Promise<boolean>;
    clear(): Promise<void>;
}

export interface RpcArray<T> extends RpcReadonlyList<T> {
    set(index: number, value: T): Promise<void>;
    resize(size: number): Promise<void>;
}

export interface RpcObservableList<T> extends RpcList<T> {
    readonly itemChanged: RpcEvent<readonly [number, number, number]>;
}

export interface RpcDictionary<K, V> extends RpcDisposable {
    count(): Promise<number>;
    get(key: K): Promise<V>;
    set(key: K, value: V): Promise<void>;
    remove(key: K): Promise<boolean>;
    clear(): Promise<void>;
    containsKey(key: K): Promise<boolean>;
    keys(): Promise<RpcReadonlyList<K>>;
    values(): Promise<RpcReadonlyList<V>>;
}

abstract class PredefinedProxy extends RpcProxy implements RpcPredefinedProxy {
    readonly [predefinedProxyBrand] = true as const;
    protected readonly methods = new Map<number, RpcMethodDescriptor>();

    method(methodId: number): RpcMethodDescriptor {
        const descriptor = this.methods.get(methodId);
        if (descriptor === undefined) {
            throw new RpcProtocolError(`Unknown predefined RPC method id: ${String(methodId)}`);
        }
        return descriptor;
    }

    invokeEvent(eventId: number, arguments_: readonly RpcJsonValue[]): Promise<void> {
        return Promise.reject(new RpcProtocolError(
            `This predefined proxy does not support event ${String(eventId)} with ${String(arguments_.length)} arguments.`,
        ));
    }
}

class EnumeratorProxy<T> extends PredefinedProxy implements RpcEnumerator<T> {
    constructor(context: RpcProxyContext, itemCodec: RpcCodec<T>) {
        super(context);
        this.methods.set(RpcMethodId_IValueEnumerator_Next, method(
            RpcMethodId_IValueEnumerator_Next,
            [],
            unknownUse(rpcBooleanCodec),
        ));
        this.methods.set(RpcMethodId_IValueEnumerator_GetCurrent, method(
            RpcMethodId_IValueEnumerator_GetCurrent,
            [],
            unknownUse(itemCodec),
        ));
    }

    next(): Promise<boolean> {
        return this.invoke(RpcMethodId_IValueEnumerator_Next, []);
    }

    current(): Promise<T> {
        return this.invoke(RpcMethodId_IValueEnumerator_GetCurrent, []);
    }
}

function createEnumeratorFactory<T>(itemCodec: RpcCodec<T>): RpcReferenceFactory<RpcEnumerator<T>> {
    return {
        key: `enumerator<${itemCodec.name}>`,
        create: context => new EnumeratorProxy(context, itemCodec),
    };
}

function createReferenceCodec<T extends object>(typeId: number, factory: RpcReferenceFactory<T>): RpcCodec<T | null> {
    return createRpcCodec(`reference:${factory.key}`, {
        encode: (value, endpoint) => value === null ? { ...NULL_RPC_REFERENCE } : endpoint.objectToReference(value, typeId),
        decode: async (value, endpoint) => {
            const ref = readReference(value);
            validateReferenceOrNull(ref);
            return await endpoint.referenceToObject(ref, factory);
        },
        encodeUnknown: (value, endpoint) => ({
            '$': 'system::RpcObjectReference',
            ...(value === null ? NULL_RPC_REFERENCE : endpoint.objectToReference(value, typeId)),
        }),
        decodeUnknown: async (value, endpoint) => {
            if (typeof value !== 'object' || value === null || Array.isArray(value) || value.$ !== 'system::RpcObjectReference') {
                throw new RpcProtocolError('A tagged RPC object reference is required.');
            }
            const ref = readReference({ clientId: value.clientId, objectId: value.objectId, typeId: value.typeId });
            validateReferenceOrNull(ref);
            return await endpoint.referenceToObject(ref, factory);
        },
    });
}

class EnumerableProxy<T> extends PredefinedProxy implements RpcEnumerable<T> {
    protected readonly enumeratorFactory: RpcReferenceFactory<RpcEnumerator<T>>;

    constructor(context: RpcProxyContext, protected readonly itemCodec: RpcCodec<T>) {
        super(context);
        this.enumeratorFactory = createEnumeratorFactory(itemCodec);
        this.methods.set(RpcMethodId_IValueEnumerable_CreateEnumerator, method(
            RpcMethodId_IValueEnumerable_CreateEnumerator,
            [],
            unknownUse(createReferenceCodec(RpcTypeId_IValueEnumerator, this.enumeratorFactory)),
        ));
    }

    createEnumerator(): Promise<RpcEnumerator<T>> {
        return this.invoke(RpcMethodId_IValueEnumerable_CreateEnumerator, []);
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const enumerator = await this.createEnumerator();
        try {
            while (await enumerator.next()) {
                yield await enumerator.current();
            }
        } finally {
            await enumerator.dispose();
        }
    }
}

class ReadonlyListProxy<T> extends EnumerableProxy<T> implements RpcReadonlyList<T> {
    constructor(context: RpcProxyContext, itemCodec: RpcCodec<T>) {
        super(context, itemCodec);
        const integerUse = unknownUse(rpcInt32Codec);
        this.methods.set(RpcMethodId_IValueReadonlyList_GetCount, method(RpcMethodId_IValueReadonlyList_GetCount, [], integerUse));
        this.methods.set(RpcMethodId_IValueReadonlyList_Get, method(RpcMethodId_IValueReadonlyList_Get, [integerUse], unknownUse(itemCodec)));
        this.methods.set(RpcMethodId_IValueReadonlyList_Contains, method(RpcMethodId_IValueReadonlyList_Contains, [unknownUse(itemCodec)], unknownUse(rpcBooleanCodec)));
        this.methods.set(RpcMethodId_IValueReadonlyList_IndexOf, method(RpcMethodId_IValueReadonlyList_IndexOf, [unknownUse(itemCodec)], integerUse));
    }

    count(): Promise<number> {
        return this.invoke(RpcMethodId_IValueReadonlyList_GetCount, []);
    }

    get(index: number): Promise<T> {
        return this.invoke(RpcMethodId_IValueReadonlyList_Get, [index]);
    }

    contains(value: T): Promise<boolean> {
        return this.invoke(RpcMethodId_IValueReadonlyList_Contains, [value]);
    }

    indexOf(value: T): Promise<number> {
        return this.invoke(RpcMethodId_IValueReadonlyList_IndexOf, [value]);
    }
}

class ListProxy<T> extends ReadonlyListProxy<T> implements RpcList<T> {
    constructor(context: RpcProxyContext, itemCodec: RpcCodec<T>) {
        super(context, itemCodec);
        const integerUse = unknownUse(rpcInt32Codec);
        const itemUse = unknownUse(itemCodec);
        this.methods.set(RpcMethodId_IValueList_Set, method(RpcMethodId_IValueList_Set, [integerUse, itemUse], unknownUse(rpcVoidCodec)));
        this.methods.set(RpcMethodId_IValueList_Add, method(RpcMethodId_IValueList_Add, [itemUse], integerUse));
        this.methods.set(RpcMethodId_IValueList_Insert, method(RpcMethodId_IValueList_Insert, [integerUse, itemUse], integerUse));
        this.methods.set(RpcMethodId_IValueList_RemoveAt, method(RpcMethodId_IValueList_RemoveAt, [integerUse], unknownUse(rpcBooleanCodec)));
        this.methods.set(RpcMethodId_IValueList_Clear, method(RpcMethodId_IValueList_Clear, [], unknownUse(rpcVoidCodec)));
    }

    set(index: number, value: T): Promise<void> {
        return this.invoke(RpcMethodId_IValueList_Set, [index, value]);
    }

    add(value: T): Promise<number> {
        return this.invoke(RpcMethodId_IValueList_Add, [value]);
    }

    insert(index: number, value: T): Promise<number> {
        return this.invoke(RpcMethodId_IValueList_Insert, [index, value]);
    }

    removeAt(index: number): Promise<boolean> {
        return this.invoke(RpcMethodId_IValueList_RemoveAt, [index]);
    }

    async remove(value: T): Promise<boolean> {
        const index = await this.indexOf(value);
        return index === -1 ? false : await this.removeAt(index);
    }

    clear(): Promise<void> {
        return this.invoke(RpcMethodId_IValueList_Clear, []);
    }
}

class ArrayProxy<T> extends ReadonlyListProxy<T> implements RpcArray<T> {
    constructor(context: RpcProxyContext, itemCodec: RpcCodec<T>) {
        super(context, itemCodec);
        const integerUse = unknownUse(rpcInt32Codec);
        this.methods.set(RpcMethodId_IValueList_Set, method(RpcMethodId_IValueList_Set, [integerUse, unknownUse(itemCodec)], unknownUse(rpcVoidCodec)));
        this.methods.set(RpcMethodId_IValueArray_Resize, method(RpcMethodId_IValueArray_Resize, [integerUse], unknownUse(rpcVoidCodec)));
    }

    set(index: number, value: T): Promise<void> {
        return this.invoke(RpcMethodId_IValueList_Set, [index, value]);
    }

    resize(size: number): Promise<void> {
        return this.invoke(RpcMethodId_IValueArray_Resize, [size]);
    }
}

class ObservableListProxy<T> extends ListProxy<T> implements RpcObservableList<T> {
    readonly itemChanged = new RpcEvent<readonly [number, number, number]>();

    constructor(context: RpcProxyContext, itemCodec: RpcCodec<T>) {
        super(context, itemCodec);
        this.itemChanged.setOutgoing((index, oldCount, newCount) => this.raiseEvent(
            RpcEventId_IValueObservableList_ItemChanged,
            [index, oldCount, newCount],
        ));
    }

    async invokeEvent(eventId: number, arguments_: readonly RpcJsonValue[]): Promise<void> {
        if (eventId !== RpcEventId_IValueObservableList_ItemChanged || arguments_.length !== 3) {
            throw new RpcProtocolError(`Unknown observable-list event id: ${String(eventId)}`);
        }
        await this.itemChanged.dispatchRemote(
            readUnknownInt32(arguments_[0], 'ItemChanged.index'),
            readUnknownInt32(arguments_[1], 'ItemChanged.oldCount'),
            readUnknownInt32(arguments_[2], 'ItemChanged.newCount'),
        );
    }

    override async dispose(): Promise<void> {
        this.itemChanged.clear();
        await super.dispose();
    }
}

class DictionaryProxy<K, V> extends PredefinedProxy implements RpcDictionary<K, V> {
    private readonly keysFactory: RpcReferenceFactory<RpcReadonlyList<K>>;
    private readonly valuesFactory: RpcReferenceFactory<RpcReadonlyList<V>>;

    constructor(context: RpcProxyContext, keyCodec: RpcCodec<K>, valueCodec: RpcCodec<V>) {
        super(context);
        this.keysFactory = createReadonlyListFactory(keyCodec);
        this.valuesFactory = createReadonlyListFactory(valueCodec);
        const keyUse = unknownUse(keyCodec);
        this.methods.set(RpcMethodId_IValueReadonlyDictionary_GetCount, method(RpcMethodId_IValueReadonlyDictionary_GetCount, [], unknownUse(rpcInt32Codec)));
        this.methods.set(RpcMethodId_IValueReadonlyDictionary_Get, method(RpcMethodId_IValueReadonlyDictionary_Get, [keyUse], unknownUse(valueCodec)));
        this.methods.set(RpcMethodId_IValueDictionary_Set, method(RpcMethodId_IValueDictionary_Set, [keyUse, unknownUse(valueCodec)], unknownUse(rpcVoidCodec)));
        this.methods.set(RpcMethodId_IValueDictionary_Remove, method(RpcMethodId_IValueDictionary_Remove, [keyUse], unknownUse(rpcBooleanCodec)));
        this.methods.set(RpcMethodId_IValueDictionary_Clear, method(RpcMethodId_IValueDictionary_Clear, [], unknownUse(rpcVoidCodec)));
        this.methods.set(RpcMethodId_IValueReadonlyDictionary_ContainsKey, method(RpcMethodId_IValueReadonlyDictionary_ContainsKey, [keyUse], unknownUse(rpcBooleanCodec)));
        this.methods.set(RpcMethodId_IValueReadonlyDictionary_GetKeys, method(RpcMethodId_IValueReadonlyDictionary_GetKeys, [], unknownUse(createReferenceCodec(RpcTypeId_IValueReadonlyList, this.keysFactory))));
        this.methods.set(RpcMethodId_IValueReadonlyDictionary_GetValues, method(RpcMethodId_IValueReadonlyDictionary_GetValues, [], unknownUse(createReferenceCodec(RpcTypeId_IValueReadonlyList, this.valuesFactory))));
    }

    count(): Promise<number> {
        return this.invoke(RpcMethodId_IValueReadonlyDictionary_GetCount, []);
    }

    get(key: K): Promise<V> {
        return this.invoke(RpcMethodId_IValueReadonlyDictionary_Get, [key]);
    }

    set(key: K, value: V): Promise<void> {
        return this.invoke(RpcMethodId_IValueDictionary_Set, [key, value]);
    }

    remove(key: K): Promise<boolean> {
        return this.invoke(RpcMethodId_IValueDictionary_Remove, [key]);
    }

    clear(): Promise<void> {
        return this.invoke(RpcMethodId_IValueDictionary_Clear, []);
    }

    containsKey(key: K): Promise<boolean> {
        return this.invoke(RpcMethodId_IValueReadonlyDictionary_ContainsKey, [key]);
    }

    keys(): Promise<RpcReadonlyList<K>> {
        return this.invoke(RpcMethodId_IValueReadonlyDictionary_GetKeys, []);
    }

    values(): Promise<RpcReadonlyList<V>> {
        return this.invoke(RpcMethodId_IValueReadonlyDictionary_GetValues, []);
    }
}

function createEnumerableFactory<T>(itemCodec: RpcCodec<T>): RpcReferenceFactory<RpcEnumerable<T>> {
    return { key: `enumerable<${itemCodec.name}>`, create: context => new EnumerableProxy(context, itemCodec) };
}

function createReadonlyListFactory<T>(itemCodec: RpcCodec<T>): RpcReferenceFactory<RpcReadonlyList<T>> {
    return { key: `readonly-list<${itemCodec.name}>`, create: context => new ReadonlyListProxy(context, itemCodec) };
}

function createListFactory<T>(itemCodec: RpcCodec<T>): RpcReferenceFactory<RpcList<T>> {
    return { key: `list<${itemCodec.name}>`, create: context => new ListProxy(context, itemCodec) };
}

function createArrayFactory<T>(itemCodec: RpcCodec<T>): RpcReferenceFactory<RpcArray<T>> {
    return { key: `array<${itemCodec.name}>`, create: context => new ArrayProxy(context, itemCodec) };
}

function createObservableListFactory<T>(itemCodec: RpcCodec<T>): RpcReferenceFactory<RpcObservableList<T>> {
    return { key: `observable-list<${itemCodec.name}>`, create: context => new ObservableListProxy(context, itemCodec) };
}

function createDictionaryFactory<K, V>(keyCodec: RpcCodec<K>, valueCodec: RpcCodec<V>): RpcReferenceFactory<RpcDictionary<K, V>> {
    return { key: `dictionary<${keyCodec.name},${valueCodec.name}>`, create: context => new DictionaryProxy(context, keyCodec, valueCodec) };
}

export function createByReferenceEnumerableCodec<T>(itemCodec: RpcCodec<T>): RpcCodec<RpcEnumerable<T> | null> {
    return createReferenceCodec(RpcTypeId_IValueEnumerable, createEnumerableFactory(itemCodec));
}

export function createByReferenceReadonlyListCodec<T>(itemCodec: RpcCodec<T>): RpcCodec<RpcReadonlyList<T> | null> {
    return createReferenceCodec(RpcTypeId_IValueReadonlyList, createReadonlyListFactory(itemCodec));
}

export function createByReferenceListCodec<T>(itemCodec: RpcCodec<T>): RpcCodec<RpcList<T> | null> {
    return createReferenceCodec(RpcTypeId_IValueList, createListFactory(itemCodec));
}

export function createByReferenceArrayCodec<T>(itemCodec: RpcCodec<T>): RpcCodec<RpcArray<T> | null> {
    return createReferenceCodec(RpcTypeId_IValueArray, createArrayFactory(itemCodec));
}

export function createByReferenceObservableListCodec<T>(itemCodec: RpcCodec<T>): RpcCodec<RpcObservableList<T> | null> {
    return createReferenceCodec(RpcTypeId_IValueObservableList, createObservableListFactory(itemCodec));
}

export function createByReferenceDictionaryCodec<K, V>(keyCodec: RpcCodec<K>, valueCodec: RpcCodec<V>): RpcCodec<RpcDictionary<K, V> | null> {
    return createReferenceCodec(RpcTypeId_IValueDictionary, createDictionaryFactory(keyCodec, valueCodec));
}

abstract class LocalPredefinedObject implements RpcDisposable, RpcPredefinedLocalObject {
    readonly [predefinedLocalBrand] = true as const;
    abstract readonly typeId: number;
    readonly disposed = false;

    dispose(): Promise<void> {
        return Promise.resolve();
    }

    abstract invoke(endpoint: RpcEndpointServices, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue>;
}

class LocalEnumerator<T> extends LocalPredefinedObject implements RpcEnumerator<T> {
    readonly typeId = RpcTypeId_IValueEnumerator;
    private index = -1;

    constructor(private readonly values_: readonly T[], private readonly codec: RpcCodec<T>) {
        super();
    }

    next(): Promise<boolean> {
        this.index++;
        return Promise.resolve(this.index < this.values_.length);
    }

    current(): Promise<T> {
        if (this.index < 0 || this.index >= this.values_.length) {
            return Promise.reject(new RpcProtocolError('The enumerator has no current value.'));
        }
        return Promise.resolve(this.values_[this.index]);
    }

    async invoke(endpoint: RpcEndpointServices, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue> {
        if (arguments_.length !== 0) {
            throw new RpcProtocolError('Enumerator operations do not take arguments.');
        }
        if (methodId === RpcMethodId_IValueEnumerator_Next) {
            return await rpcBooleanCodec.encodeUnknown(endpoint, await this.next());
        }
        if (methodId === RpcMethodId_IValueEnumerator_GetCurrent) {
            return await this.codec.encodeUnknown(endpoint, await this.current());
        }
        throw new RpcProtocolError(`Unknown enumerator method id: ${String(methodId)}`);
    }
}

abstract class LocalEnumerableBase<T> extends LocalPredefinedObject implements RpcEnumerable<T> {
    constructor(protected readonly values_: readonly T[], protected readonly itemCodec: RpcCodec<T>) {
        super();
    }

    createEnumerator(): Promise<RpcEnumerator<T>> {
        return Promise.resolve(new LocalEnumerator(this.values_, this.itemCodec));
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        await Promise.resolve();
        for (const value of this.values_) {
            yield value;
        }
    }

    protected async invokeEnumerable(endpoint: RpcEndpointServices, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue | undefined> {
        if (methodId !== RpcMethodId_IValueEnumerable_CreateEnumerator) {
            return undefined;
        }
        if (arguments_.length !== 0) {
            throw new RpcProtocolError('CreateEnumerator does not take arguments.');
        }
        const enumerator = await this.createEnumerator();
        return {
            '$': 'system::RpcObjectReference',
            ...endpoint.objectToReference(enumerator, RpcTypeId_IValueEnumerator),
        };
    }
}

export class RpcLocalEnumerable<T> extends LocalEnumerableBase<T> {
    readonly typeId = RpcTypeId_IValueEnumerable;

    async invoke(endpoint: RpcEndpointServices, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue> {
        const result = await this.invokeEnumerable(endpoint, methodId, arguments_);
        if (result !== undefined) {
            return result;
        }
        throw new RpcProtocolError(`Unknown enumerable method id: ${String(methodId)}`);
    }
}

export class RpcLocalReadonlyList<T> extends LocalEnumerableBase<T> implements RpcReadonlyList<T> {
    readonly typeId: number = RpcTypeId_IValueReadonlyList;

    count(): Promise<number> {
        return Promise.resolve(this.values_.length);
    }

    get(index: number): Promise<T> {
        if (index < 0 || index >= this.values_.length) {
            return Promise.reject(new RpcException('List index is out of range.'));
        }
        return Promise.resolve(this.values_[index]);
    }

    contains(value: T): Promise<boolean> {
        return Promise.resolve(this.values_.includes(value));
    }

    indexOf(value: T): Promise<number> {
        return Promise.resolve(this.values_.indexOf(value));
    }

    async invoke(endpoint: RpcEndpointServices, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue> {
        const enumerable = await this.invokeEnumerable(endpoint, methodId, arguments_);
        if (enumerable !== undefined) {
            return enumerable;
        }
        if (methodId === RpcMethodId_IValueReadonlyList_GetCount && arguments_.length === 0) {
            return await rpcInt32Codec.encodeUnknown(endpoint, await this.count());
        }
        if (methodId === RpcMethodId_IValueReadonlyList_Get && arguments_.length === 1) {
            return await this.itemCodec.encodeUnknown(endpoint, await this.get(await rpcInt32Codec.decodeUnknown(endpoint, arguments_[0])));
        }
        if (methodId === RpcMethodId_IValueReadonlyList_Contains && arguments_.length === 1) {
            return await rpcBooleanCodec.encodeUnknown(endpoint, await this.contains(await this.itemCodec.decodeUnknown(endpoint, arguments_[0])));
        }
        if (methodId === RpcMethodId_IValueReadonlyList_IndexOf && arguments_.length === 1) {
            return await rpcInt32Codec.encodeUnknown(endpoint, await this.indexOf(await this.itemCodec.decodeUnknown(endpoint, arguments_[0])));
        }
        throw new RpcProtocolError(`Unknown read-only-list method id: ${String(methodId)}`);
    }
}

export class RpcLocalList<T> extends RpcLocalReadonlyList<T> implements RpcList<T> {
    override readonly typeId: number = RpcTypeId_IValueList;

    constructor(protected readonly mutableValues: T[], itemCodec: RpcCodec<T>) {
        super(mutableValues, itemCodec);
    }

    set(index: number, value: T): Promise<void> {
        if (index < 0 || index >= this.mutableValues.length) {
            return Promise.reject(new RpcException('List index is out of range.'));
        }
        this.mutableValues[index] = value;
        return Promise.resolve();
    }

    add(value: T): Promise<number> {
        this.mutableValues.push(value);
        return Promise.resolve(this.mutableValues.length - 1);
    }

    insert(index: number, value: T): Promise<number> {
        if (index < 0 || index > this.mutableValues.length) {
            return Promise.reject(new RpcException('List index is out of range.'));
        }
        this.mutableValues.splice(index, 0, value);
        return Promise.resolve(index);
    }

    removeAt(index: number): Promise<boolean> {
        if (index < 0 || index >= this.mutableValues.length) {
            return Promise.resolve(false);
        }
        this.mutableValues.splice(index, 1);
        return Promise.resolve(true);
    }

    async remove(value: T): Promise<boolean> {
        return await this.removeAt(this.mutableValues.indexOf(value));
    }

    clear(): Promise<void> {
        this.mutableValues.length = 0;
        return Promise.resolve();
    }

    override async invoke(endpoint: RpcEndpointServices, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue> {
        if (methodId === RpcMethodId_IValueList_Set && arguments_.length === 2) {
            await this.set(await rpcInt32Codec.decodeUnknown(endpoint, arguments_[0]), await this.itemCodec.decodeUnknown(endpoint, arguments_[1]));
            return null;
        }
        if (methodId === RpcMethodId_IValueList_Add && arguments_.length === 1) {
            return await rpcInt32Codec.encodeUnknown(endpoint, await this.add(await this.itemCodec.decodeUnknown(endpoint, arguments_[0])));
        }
        if (methodId === RpcMethodId_IValueList_Insert && arguments_.length === 2) {
            return await rpcInt32Codec.encodeUnknown(endpoint, await this.insert(
                await rpcInt32Codec.decodeUnknown(endpoint, arguments_[0]),
                await this.itemCodec.decodeUnknown(endpoint, arguments_[1]),
            ));
        }
        if (methodId === RpcMethodId_IValueList_RemoveAt && arguments_.length === 1) {
            return await rpcBooleanCodec.encodeUnknown(endpoint, await this.removeAt(await rpcInt32Codec.decodeUnknown(endpoint, arguments_[0])));
        }
        if (methodId === RpcMethodId_IValueList_Clear && arguments_.length === 0) {
            await this.clear();
            return null;
        }
        return await super.invoke(endpoint, methodId, arguments_);
    }
}

export class RpcLocalArray<T> extends RpcLocalReadonlyList<T> implements RpcArray<T> {
    override readonly typeId: number = RpcTypeId_IValueArray;

    constructor(private readonly mutableValues: T[], itemCodec: RpcCodec<T>, private readonly defaultValue: () => T) {
        super(mutableValues, itemCodec);
    }

    set(index: number, value: T): Promise<void> {
        if (index < 0 || index >= this.mutableValues.length) {
            return Promise.reject(new RpcException('Array index is out of range.'));
        }
        this.mutableValues[index] = value;
        return Promise.resolve();
    }

    resize(size: number): Promise<void> {
        if (size < 0) {
            return Promise.reject(new RpcException('Array size cannot be negative.'));
        }
        while (this.mutableValues.length < size) {
            this.mutableValues.push(this.defaultValue());
        }
        this.mutableValues.length = size;
        return Promise.resolve();
    }

    override async invoke(endpoint: RpcEndpointServices, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue> {
        if (methodId === RpcMethodId_IValueList_Set && arguments_.length === 2) {
            await this.set(await rpcInt32Codec.decodeUnknown(endpoint, arguments_[0]), await this.itemCodec.decodeUnknown(endpoint, arguments_[1]));
            return null;
        }
        if (methodId === RpcMethodId_IValueArray_Resize && arguments_.length === 1) {
            await this.resize(await rpcInt32Codec.decodeUnknown(endpoint, arguments_[0]));
            return null;
        }
        return await super.invoke(endpoint, methodId, arguments_);
    }
}

export class RpcLocalObservableList<T> extends RpcLocalList<T> implements RpcObservableList<T> {
    override readonly typeId: number = RpcTypeId_IValueObservableList;
    readonly itemChanged = new RpcEvent<readonly [number, number, number]>();

    override async set(index: number, value: T): Promise<void> {
        await super.set(index, value);
        await this.itemChanged.emit(index, 1, 1);
    }

    override async add(value: T): Promise<number> {
        const index = await super.add(value);
        await this.itemChanged.emit(index, 0, 1);
        return index;
    }

    override async insert(index: number, value: T): Promise<number> {
        const result = await super.insert(index, value);
        await this.itemChanged.emit(index, 0, 1);
        return result;
    }

    override async removeAt(index: number): Promise<boolean> {
        const result = await super.removeAt(index);
        if (result) {
            await this.itemChanged.emit(index, 1, 0);
        }
        return result;
    }

    override async clear(): Promise<void> {
        const count = this.mutableValues.length;
        await super.clear();
        if (count > 0) {
            await this.itemChanged.emit(0, count, 0);
        }
    }

    async invokeEvent(eventId: number, arguments_: readonly RpcJsonValue[]): Promise<void> {
        if (eventId !== RpcEventId_IValueObservableList_ItemChanged || arguments_.length !== 3) {
            throw new RpcProtocolError(`Unknown observable-list event id: ${String(eventId)}`);
        }
        await this.itemChanged.dispatchRemote(
            readUnknownInt32(arguments_[0], 'ItemChanged.index'),
            readUnknownInt32(arguments_[1], 'ItemChanged.oldCount'),
            readUnknownInt32(arguments_[2], 'ItemChanged.newCount'),
        );
    }

    detach(): void {
        this.itemChanged.clear();
    }
}

export class RpcLocalDictionary<K, V> extends LocalPredefinedObject implements RpcDictionary<K, V> {
    readonly typeId = RpcTypeId_IValueDictionary;

    constructor(
        private readonly map: Map<K, V>,
        private readonly keyCodec: RpcCodec<K>,
        private readonly valueCodec: RpcCodec<V>,
    ) {
        super();
    }

    count(): Promise<number> { return Promise.resolve(this.map.size); }

    get(key: K): Promise<V> {
        if (!this.map.has(key)) {
            return Promise.reject(new RpcException('Dictionary key does not exist.'));
        }
        return Promise.resolve(this.map.get(key) as V);
    }

    set(key: K, value: V): Promise<void> { this.map.set(key, value); return Promise.resolve(); }
    remove(key: K): Promise<boolean> { return Promise.resolve(this.map.delete(key)); }
    clear(): Promise<void> { this.map.clear(); return Promise.resolve(); }
    containsKey(key: K): Promise<boolean> { return Promise.resolve(this.map.has(key)); }
    keys(): Promise<RpcReadonlyList<K>> { return Promise.resolve(new RpcLocalReadonlyList([...this.map.keys()], this.keyCodec)); }
    values(): Promise<RpcReadonlyList<V>> { return Promise.resolve(new RpcLocalReadonlyList([...this.map.values()], this.valueCodec)); }

    async invoke(endpoint: RpcEndpointServices, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue> {
        if (methodId === RpcMethodId_IValueReadonlyDictionary_GetCount && arguments_.length === 0) {
            return await rpcInt32Codec.encodeUnknown(endpoint, await this.count());
        }
        if (methodId === RpcMethodId_IValueReadonlyDictionary_Get && arguments_.length === 1) {
            return await this.valueCodec.encodeUnknown(endpoint, await this.get(await this.keyCodec.decodeUnknown(endpoint, arguments_[0])));
        }
        if (methodId === RpcMethodId_IValueDictionary_Set && arguments_.length === 2) {
            await this.set(await this.keyCodec.decodeUnknown(endpoint, arguments_[0]), await this.valueCodec.decodeUnknown(endpoint, arguments_[1]));
            return null;
        }
        if (methodId === RpcMethodId_IValueDictionary_Remove && arguments_.length === 1) {
            return await rpcBooleanCodec.encodeUnknown(endpoint, await this.remove(await this.keyCodec.decodeUnknown(endpoint, arguments_[0])));
        }
        if (methodId === RpcMethodId_IValueDictionary_Clear && arguments_.length === 0) {
            await this.clear();
            return null;
        }
        if (methodId === RpcMethodId_IValueReadonlyDictionary_ContainsKey && arguments_.length === 1) {
            return await rpcBooleanCodec.encodeUnknown(endpoint, await this.containsKey(await this.keyCodec.decodeUnknown(endpoint, arguments_[0])));
        }
        if (methodId === RpcMethodId_IValueReadonlyDictionary_GetKeys && arguments_.length === 0) {
            return { '$': 'system::RpcObjectReference', ...endpoint.objectToReference(await this.keys(), RpcTypeId_IValueReadonlyList) };
        }
        if (methodId === RpcMethodId_IValueReadonlyDictionary_GetValues && arguments_.length === 0) {
            return { '$': 'system::RpcObjectReference', ...endpoint.objectToReference(await this.values(), RpcTypeId_IValueReadonlyList) };
        }
        throw new RpcProtocolError(`Unknown dictionary method id: ${String(methodId)}`);
    }
}

export function createPredefinedProxyFactory<T extends object>(
    typeId: number,
    itemCodec: RpcCodec<unknown>,
    valueCodec?: RpcCodec<unknown>,
): RpcReferenceFactory<T> {
    switch (typeId) {
        case RpcTypeId_IValueEnumerable:
            return createEnumerableFactory(itemCodec) as RpcReferenceFactory<T>;
        case RpcTypeId_IValueEnumerator:
            return createEnumeratorFactory(itemCodec) as RpcReferenceFactory<T>;
        case RpcTypeId_IValueReadonlyList:
            return createReadonlyListFactory(itemCodec) as RpcReferenceFactory<T>;
        case RpcTypeId_IValueList:
            return createListFactory(itemCodec) as RpcReferenceFactory<T>;
        case RpcTypeId_IValueArray:
            return createArrayFactory(itemCodec) as RpcReferenceFactory<T>;
        case RpcTypeId_IValueObservableList:
            return createObservableListFactory(itemCodec) as RpcReferenceFactory<T>;
        case RpcTypeId_IValueDictionary:
            if (valueCodec === undefined) {
                throw new RpcProtocolError('A dictionary proxy requires key and value codecs.');
            }
            return createDictionaryFactory(itemCodec, valueCodec) as RpcReferenceFactory<T>;
        default:
            throw new RpcProtocolError(`Unknown predefined RPC type id: ${String(typeId)}`);
    }
}
