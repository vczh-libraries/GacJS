export type WasmCommand =
    | { kind: 'start'; moduleUrl: string; connectionCount: number }
    | { kind: 'data'; connectionId: number; data: string };

export interface WasmNotification {
    kind: 'ready' | 'renderer-ready' | 'data' | 'closed' | 'exit' | 'error';
    connectionId: number;
    data: string;
}

export function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

export function deferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
} {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    void promise.catch(() => undefined);
    return { promise, resolve, reject };
}
