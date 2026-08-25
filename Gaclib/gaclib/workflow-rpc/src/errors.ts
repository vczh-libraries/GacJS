import { RpcEventExceptionMap, RpcTaggedException } from './types.js';

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export class RpcException extends Error {
    constructor(message: string) {
        super(message);
    }

    toJSON(): RpcTaggedException {
        return {
            '$': 'system::RpcException',
            message: this.message,
        };
    }

    static from(error: unknown): RpcException {
        return error instanceof RpcException ? error : new RpcException(errorMessage(error));
    }
}

export class RpcRemoteException extends RpcException {
}

export class RpcProtocolError extends Error {
}

export class RpcEndpointClosedError extends Error {
    constructor(message = 'The RPC endpoint is closed.') {
        super(message);
    }
}

export class RpcEventBroadcastError extends RpcException {
    constructor(public readonly exceptions: Exclude<RpcEventExceptionMap, null>) {
        super(exceptions.map(([clientId, exception]) => `${String(clientId)}:${exception.message};`).join(''));
    }
}

export function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}
