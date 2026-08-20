import { RpcProtocolError } from './errors.js';
import {
    NULL_RPC_REFERENCE,
    RpcCodec,
    RpcEndpointServices,
    RpcJsonValue,
    RpcObjectReference,
    RpcReferenceFactory,
    RpcTaggedReference,
    RpcTypeId_Null,
} from './types.js';
import {
    assertExactKeys,
    expectArray,
    expectBoolean,
    expectRecord,
    expectSafeInteger,
    expectString,
    isRecord,
    readReference,
} from './validation.js';

type MaybePromise<T> = T | Promise<T>;

interface CodecFunctions<T> {
    encode(value: T, endpoint: RpcEndpointServices): MaybePromise<RpcJsonValue>;
    decode(value: RpcJsonValue, endpoint: RpcEndpointServices): MaybePromise<T>;
    encodeUnknown?(value: T, endpoint: RpcEndpointServices): MaybePromise<RpcJsonValue>;
    decodeUnknown?(value: RpcJsonValue, endpoint: RpcEndpointServices): MaybePromise<T>;
    copy?(value: T, endpoint: RpcEndpointServices, active: Set<object>): MaybePromise<T>;
}

export function createRpcCodec<T>(name: string, functions: CodecFunctions<T>): RpcCodec<T> {
    return {
        name,
        encode: (endpoint, value) => functions.encode(value, endpoint),
        decode: (endpoint, value) => functions.decode(value, endpoint),
        encodeUnknown: (endpoint, value) => (functions.encodeUnknown ?? functions.encode)(value, endpoint),
        decodeUnknown: (endpoint, value) => (functions.decodeUnknown ?? functions.decode)(value, endpoint),
        copy: (endpoint, value, active) => functions.copy === undefined ? value : functions.copy(value, endpoint, active),
    };
}

export const rpcVoidCodec: RpcCodec<void> = createRpcCodec('Void', {
    encode: () => null,
    decode: value => {
        if (value !== null) {
            throw new RpcProtocolError('Void must be encoded as null.');
        }
    },
});

export const rpcBooleanCodec = createRpcCodec<boolean>('Boolean', {
    encode: value => value,
    decode: value => expectBoolean(value, 'Boolean'),
});

export const rpcStringCodec = createRpcCodec<string>('String', {
    encode: value => value,
    decode: value => expectString(value, 'String'),
});

export const rpcCharCodec = createRpcCodec<string>('Char', {
    encode: value => {
        if (value.length !== 1) {
            throw new RpcProtocolError('Char must contain one UTF-16 code unit.');
        }
        return value;
    },
    decode: value => {
        const result = expectString(value, 'Char');
        if (result.length !== 1) {
            throw new RpcProtocolError('Char must contain one UTF-16 code unit.');
        }
        return result;
    },
    encodeUnknown: value => ['Char', value],
    decodeUnknown: value => {
        const pair = expectArray(value, 'Unknown Char');
        if (pair.length !== 2 || pair[0] !== 'Char') {
            throw new RpcProtocolError('Unknown Char must be ["Char", value].');
        }
        const result = expectString(pair[1], 'Unknown Char value');
        if (result.length !== 1) {
            throw new RpcProtocolError('Unknown Char must contain one UTF-16 code unit.');
        }
        return result;
    },
});

export type RpcNumberKind =
    | 'UInt8'
    | 'UInt16'
    | 'UInt32'
    | 'UInt64'
    | 'Int8'
    | 'Int16'
    | 'Int32'
    | 'Int64'
    | 'Single'
    | 'Double';

const integerRanges: Partial<Record<RpcNumberKind, readonly [number, number]>> = {
    UInt8: [0, 255],
    UInt16: [0, 65535],
    UInt32: [0, 4294967295],
    UInt64: [0, Number.MAX_SAFE_INTEGER],
    Int8: [-128, 127],
    Int16: [-32768, 32767],
    Int32: [-2147483648, 2147483647],
    Int64: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
};

function validateNumber(value: unknown, kind: RpcNumberKind): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new RpcProtocolError(`${kind} must be a finite number.`);
    }
    const range = integerRanges[kind];
    if (range !== undefined) {
        if (!Number.isSafeInteger(value) || value < range[0] || value > range[1]) {
            throw new RpcProtocolError(`${kind} is outside its safe range.`);
        }
    }
    if (kind === 'Single' && Math.abs(value) > 3.4028234663852886e38) {
        throw new RpcProtocolError('Single is outside its finite range.');
    }
    return value;
}

export function createNumberCodec(kind: RpcNumberKind): RpcCodec<number> {
    return createRpcCodec(kind, {
        encode: value => validateNumber(value, kind),
        decode: value => validateNumber(value, kind),
        encodeUnknown: value => [kind, validateNumber(value, kind)],
        decodeUnknown: value => {
            const pair = expectArray(value, `Unknown ${kind}`);
            if (pair.length !== 2 || pair[0] !== kind) {
                throw new RpcProtocolError(`Unknown ${kind} has an invalid tag.`);
            }
            return validateNumber(pair[1], kind);
        },
    });
}

export const rpcUInt8Codec = createNumberCodec('UInt8');
export const rpcUInt16Codec = createNumberCodec('UInt16');
export const rpcUInt32Codec = createNumberCodec('UInt32');
export const rpcUInt64Codec = createNumberCodec('UInt64');
export const rpcInt8Codec = createNumberCodec('Int8');
export const rpcInt16Codec = createNumberCodec('Int16');
export const rpcInt32Codec = createNumberCodec('Int32');
export const rpcInt64Codec = createNumberCodec('Int64');
export const rpcSingleCodec = createNumberCodec('Single');
export const rpcDoubleCodec = createNumberCodec('Double');

export function createTaggedStringCodec(kind: 'DateTime' | 'Locale'): RpcCodec<string> {
    return createRpcCodec(kind, {
        encode: value => expectString(value, kind),
        decode: value => expectString(value, kind),
        encodeUnknown: value => [kind, expectString(value, kind)],
        decodeUnknown: value => {
            const pair = expectArray(value, `Unknown ${kind}`);
            if (pair.length !== 2 || pair[0] !== kind) {
                throw new RpcProtocolError(`Unknown ${kind} has an invalid tag.`);
            }
            return expectString(pair[1], kind);
        },
    });
}

export const rpcDateTimeCodec = createTaggedStringCodec('DateTime');
export const rpcLocaleCodec = createTaggedStringCodec('Locale');

export function createEnumCodec<T extends number>(fullName: string, values?: ReadonlySet<number>): RpcCodec<T> {
    const validate = (value: unknown): T => {
        const result = expectSafeInteger(value, fullName);
        if (values !== undefined && !values.has(result)) {
            throw new RpcProtocolError(`${fullName} contains an unknown enum value.`);
        }
        return result as T;
    };
    return createRpcCodec<T>(fullName, {
        encode: validate,
        decode: validate,
        encodeUnknown: value => [fullName, validate(value)],
        decodeUnknown: value => {
            const pair = expectArray(value, `Unknown ${fullName}`);
            if (pair.length !== 2 || pair[0] !== fullName) {
                throw new RpcProtocolError(`Unknown ${fullName} has an invalid tag.`);
            }
            return validate(pair[1]);
        },
    });
}

export interface RpcStructField<T extends object> {
    readonly key: keyof T & string;
    readonly codec: RpcCodec<T[keyof T]>;
}

export function createStructCodec<T extends object>(fullName: string, fields: readonly RpcStructField<T>[]): RpcCodec<T> {
    const encode = async (value: T, endpoint: RpcEndpointServices, unknown: boolean): Promise<RpcJsonValue> => {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new RpcProtocolError(`${fullName} must be an object.`);
        }
        const result: { [key: string]: RpcJsonValue } = {};
        if (unknown) {
            result.$ = fullName;
        }
        for (const field of fields) {
            const item = value[field.key] as T[keyof T];
            result[field.key] = await field.codec.encode(endpoint, item);
        }
        return result;
    };
    const decode = async (value: RpcJsonValue, endpoint: RpcEndpointServices, unknown: boolean): Promise<T> => {
        const object = expectRecord(value, fullName);
        const expectedKeys = fields.map(field => field.key);
        if (unknown) {
            expectedKeys.push('$' as keyof T & string);
            if (object.$ !== fullName) {
                throw new RpcProtocolError(`Unknown ${fullName} has an invalid tag.`);
            }
        }
        assertExactKeys(object, expectedKeys, fullName);
        const result: Record<string, unknown> = {};
        for (const field of fields) {
            result[field.key] = await field.codec.decode(endpoint, object[field.key] as RpcJsonValue);
        }
        return result as T;
    };
    return createRpcCodec(fullName, {
        encode: (value, endpoint) => encode(value, endpoint, false),
        decode: (value, endpoint) => decode(value, endpoint, false),
        encodeUnknown: (value, endpoint) => encode(value, endpoint, true),
        decodeUnknown: (value, endpoint) => decode(value, endpoint, true),
        copy: async (value, endpoint, active) => {
            if (active.has(value)) {
                throw new RpcProtocolError(`A cycle was found while copying ${fullName}.`);
            }
            active.add(value);
            try {
                const result: Record<string, unknown> = {};
                for (const field of fields) {
                    result[field.key] = await field.codec.copy(endpoint, value[field.key] as T[keyof T], active);
                }
                return result as T;
            } finally {
                active.delete(value);
            }
        },
    });
}

export function createNullableCodec<T>(itemCodec: RpcCodec<T>): RpcCodec<T | null> {
    return createRpcCodec(`${itemCodec.name}?`, {
        encode: (value, endpoint) => value === null ? null : itemCodec.encode(endpoint, value),
        decode: (value, endpoint) => value === null ? null : itemCodec.decode(endpoint, value),
        encodeUnknown: (value, endpoint) => value === null ? null : itemCodec.encodeUnknown(endpoint, value),
        decodeUnknown: (value, endpoint) => value === null ? null : itemCodec.decodeUnknown(endpoint, value),
        copy: (value, endpoint, active) => value === null ? null : itemCodec.copy(endpoint, value, active),
    });
}

export type RpcListKind = 'list' | 'oblist';

export function createListCodec<T>(itemCodec: RpcCodec<T>, kind: RpcListKind = 'list'): RpcCodec<readonly T[]> {
    const encodeItems = async (value: readonly T[], endpoint: RpcEndpointServices, unknown: boolean): Promise<RpcJsonValue[]> => {
        if (!Array.isArray(value)) {
            throw new RpcProtocolError(`${kind} must be an array.`);
        }
        const items: readonly T[] = value;
        return await Promise.all(items.map(item => unknown
            ? itemCodec.encodeUnknown(endpoint, item)
            : itemCodec.encode(endpoint, item)));
    };
    const decodeItems = async (value: unknown, endpoint: RpcEndpointServices, unknown: boolean): Promise<T[]> => {
        const array = expectArray(value, kind);
        return await Promise.all(array.map(item => unknown
            ? itemCodec.decodeUnknown(endpoint, item as RpcJsonValue)
            : itemCodec.decode(endpoint, item as RpcJsonValue)));
    };
    return createRpcCodec(`${kind}<${itemCodec.name}>`, {
        encode: (value, endpoint) => encodeItems(value, endpoint, false),
        decode: (value, endpoint) => decodeItems(value, endpoint, false),
        encodeUnknown: async (value, endpoint) => ({
            '$': kind,
            values: await encodeItems(value, endpoint, true),
        }),
        decodeUnknown: (value, endpoint) => {
            const object = expectRecord(value, kind);
            assertExactKeys(object, ['$', 'values'], kind);
            if (object.$ !== kind) {
                throw new RpcProtocolError(`${kind} has an invalid tag.`);
            }
            return decodeItems(object.values, endpoint, true);
        },
        copy: async (value, endpoint, active) => {
            if (active.has(value)) {
                throw new RpcProtocolError(`A cycle was found while copying ${kind}.`);
            }
            active.add(value);
            try {
                const result: T[] = [];
                for (const item of value) {
                    result.push(await itemCodec.copy(endpoint, item, active));
                }
                return result;
            } finally {
                active.delete(value);
            }
        },
    });
}

export function createMapCodec<K, V>(keyCodec: RpcCodec<K>, valueCodec: RpcCodec<V>): RpcCodec<ReadonlyMap<K, V>> {
    const encodePairs = async (value: ReadonlyMap<K, V>, endpoint: RpcEndpointServices, unknown: boolean): Promise<RpcJsonValue[]> => {
        if (!((value as unknown) instanceof Map)) {
            throw new RpcProtocolError('Map value must be a Map.');
        }
        const result: RpcJsonValue[] = [];
        for (const [key, item] of value) {
            const encodedKey = unknown
                ? await keyCodec.encodeUnknown(endpoint, key)
                : await keyCodec.encode(endpoint, key);
            const encodedValue = unknown
                ? await valueCodec.encodeUnknown(endpoint, item)
                : await valueCodec.encode(endpoint, item);
            result.push([
                encodedKey,
                encodedValue,
            ]);
        }
        return result;
    };
    const decodePairs = async (value: unknown, endpoint: RpcEndpointServices, unknown: boolean): Promise<Map<K, V>> => {
        const array = expectArray(value, 'Map values');
        const result = new Map<K, V>();
        for (const item of array) {
            const pair = expectArray(item, 'Map pair');
            if (pair.length !== 2) {
                throw new RpcProtocolError('Map pair must contain two values.');
            }
            const key = await (unknown
                ? keyCodec.decodeUnknown(endpoint, pair[0] as RpcJsonValue)
                : keyCodec.decode(endpoint, pair[0] as RpcJsonValue));
            const pairValue = await (unknown
                ? valueCodec.decodeUnknown(endpoint, pair[1] as RpcJsonValue)
                : valueCodec.decode(endpoint, pair[1] as RpcJsonValue));
            result.set(key, pairValue);
        }
        return result;
    };
    return createRpcCodec(`map<${keyCodec.name},${valueCodec.name}>`, {
        encode: (value, endpoint) => encodePairs(value, endpoint, false),
        decode: (value, endpoint) => decodePairs(value, endpoint, false),
        encodeUnknown: async (value, endpoint) => ({
            '$': 'map',
            values: await encodePairs(value, endpoint, true),
        }),
        decodeUnknown: (value, endpoint) => {
            const object = expectRecord(value, 'Map');
            assertExactKeys(object, ['$', 'values'], 'Map');
            if (object.$ !== 'map') {
                throw new RpcProtocolError('Map has an invalid tag.');
            }
            return decodePairs(object.values, endpoint, true);
        },
        copy: async (value, endpoint, active) => {
            if (active.has(value)) {
                throw new RpcProtocolError('A cycle was found while copying a map.');
            }
            active.add(value);
            try {
                const result = new Map<K, V>();
                for (const [key, item] of value) {
                    result.set(
                        await keyCodec.copy(endpoint, key, active),
                        await valueCodec.copy(endpoint, item, active),
                    );
                }
                return result;
            } finally {
                active.delete(value);
            }
        },
    });
}

function taggedReference(ref: RpcObjectReference): RpcTaggedReference {
    return {
        '$': 'system::RpcObjectReference',
        ...ref,
    };
}

function readTaggedReference(value: RpcJsonValue): RpcObjectReference {
    const object = expectRecord(value, 'Tagged RPC object reference');
    assertExactKeys(object, ['$', 'clientId', 'objectId', 'typeId'], 'Tagged RPC object reference');
    if (object.$ !== 'system::RpcObjectReference') {
        throw new RpcProtocolError('Tagged RPC object reference has an invalid tag.');
    }
    return readReference({
        clientId: object.clientId,
        objectId: object.objectId,
        typeId: object.typeId,
    });
}

export function createInterfaceCodec<T extends object>(typeId: number, factory: RpcReferenceFactory<T>): RpcCodec<T | null> {
    return createRpcCodec(`interface:${String(typeId)}`, {
        encode: (value, endpoint) => value === null ? { ...NULL_RPC_REFERENCE } : endpoint.objectToReference(value, typeId),
        decode: (value, endpoint) => endpoint.referenceToObject(readReference(value), factory),
        encodeUnknown: (value, endpoint) => taggedReference(value === null
            ? { ...NULL_RPC_REFERENCE }
            : endpoint.objectToReference(value, typeId)),
        decodeUnknown: (value, endpoint) => endpoint.referenceToObject(readTaggedReference(value), factory),
    });
}

export function isNullReference(ref: RpcObjectReference): boolean {
    return ref.clientId === -1 && ref.objectId === -1 && ref.typeId === RpcTypeId_Null;
}

export function validateReferenceOrNull(ref: RpcObjectReference): void {
    if (isNullReference(ref)) {
        return;
    }
    if (!Number.isSafeInteger(ref.clientId) || ref.clientId <= 0 ||
        !Number.isSafeInteger(ref.objectId) || !Number.isSafeInteger(ref.typeId) || ref.typeId === RpcTypeId_Null) {
        throw new RpcProtocolError('Invalid RPC object reference.');
    }
}

export function isTaggedReference(value: RpcJsonValue): boolean {
    return isRecord(value) && value.$ === 'system::RpcObjectReference';
}
