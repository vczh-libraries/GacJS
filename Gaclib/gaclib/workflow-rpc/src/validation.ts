import { RpcJsonValue, RpcObjectReference, RpcTaggedException } from './types.js';
import { RpcProtocolError } from './errors.js';

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function expectRecord(value: unknown, description: string): Record<string, unknown> {
    if (!isRecord(value)) {
        throw new RpcProtocolError(`${description} must be a JSON object.`);
    }
    return value;
}

export function expectArray(value: unknown, description: string): unknown[] {
    if (!Array.isArray(value)) {
        throw new RpcProtocolError(`${description} must be a JSON array.`);
    }
    return value;
}

export function expectString(value: unknown, description: string): string {
    if (typeof value !== 'string') {
        throw new RpcProtocolError(`${description} must be a string.`);
    }
    return value;
}

export function expectBoolean(value: unknown, description: string): boolean {
    if (typeof value !== 'boolean') {
        throw new RpcProtocolError(`${description} must be a boolean.`);
    }
    return value;
}

export function expectSafeInteger(value: unknown, description: string): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
        throw new RpcProtocolError(`${description} must be a safe integer.`);
    }
    return value;
}

export function expectPositiveClientId(value: unknown, description: string): number {
    const result = expectSafeInteger(value, description);
    if (result <= 0) {
        throw new RpcProtocolError(`${description} must be positive.`);
    }
    return result;
}

export function assertExactKeys(value: Record<string, unknown>, keys: readonly string[], description: string): void {
    const actual = Object.keys(value).sort();
    const expected = [...keys].sort();
    if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
        throw new RpcProtocolError(`${description} has unexpected fields.`);
    }
}

export function readReference(value: unknown, description = 'RPC object reference'): RpcObjectReference {
    const object = expectRecord(value, description);
    assertExactKeys(object, ['clientId', 'objectId', 'typeId'], description);
    return {
        clientId: expectSafeInteger(object.clientId, `${description}.clientId`),
        objectId: expectSafeInteger(object.objectId, `${description}.objectId`),
        typeId: expectSafeInteger(object.typeId, `${description}.typeId`),
    };
}

export function readTaggedException(value: RpcJsonValue): RpcTaggedException | undefined {
    if (!isRecord(value) || value.$ !== 'system::RpcException') {
        return undefined;
    }
    assertExactKeys(value, ['$', 'message'], 'RPC exception');
    return {
        '$': 'system::RpcException',
        message: expectString(value.message, 'RPC exception.message'),
    };
}

export function asJsonValue(value: unknown, description: string): RpcJsonValue {
    if (value === null || typeof value === 'boolean' || typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            throw new RpcProtocolError(`${description} contains a non-finite number.`);
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item, index) => asJsonValue(item, `${description}[${String(index)}]`));
    }
    if (isRecord(value)) {
        const result: { [key: string]: RpcJsonValue } = {};
        for (const [key, item] of Object.entries(value)) {
            result[key] = asJsonValue(item, `${description}.${key}`);
        }
        return result;
    }
    throw new RpcProtocolError(`${description} is not a JSON value.`);
}

export function referenceKey(ref: RpcObjectReference): string {
    return `${String(ref.clientId)}:${String(ref.objectId)}:${String(ref.typeId)}`;
}

export function leaseKey(ref: RpcObjectReference): string {
    return `${String(ref.clientId)}:${String(ref.objectId)}`;
}
