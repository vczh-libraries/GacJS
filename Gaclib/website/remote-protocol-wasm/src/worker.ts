import { normalizeError, WasmCommand, WasmNotification } from './messages.js';

interface WasmModule {
    StartApplication(receiver: (kind: WasmNotification['kind'], connectionId: number, data: string) => string): string;
    ConnectToWasmCore(connectionId: number): string;
    SendDataToWasmCore(connectionId: number, data: string): string;
    DisconnectFromWasmCore(connectionId: number): string;
}

type WasmFactory = (options: { onAbort: (reason: unknown) => void }) => Promise<WasmModule>;
let module: WasmModule | undefined;

function notify(kind: WasmNotification['kind'], connectionId = 0, data = ''): void {
    globalThis.postMessage({ kind, connectionId, data } satisfies WasmNotification);
}

function receive(kind: WasmNotification['kind'], connectionId: number, data: string): string {
    try {
        notify(kind, connectionId, data);
        return '';
    } catch (error) {
        return normalizeError(error).message;
    }
}

function check(error: string): void {
    if (error !== '') throw new Error(error);
}

// Console helpers are installed on this worker before loading the module.
Object.assign(globalThis, {
    vlConsoleWrite(heap: Uint16Array, pointer: number, length: number): number {
        try {
            let text = '';
            for (const code of heap.subarray(pointer / 2, pointer / 2 + length)) text += String.fromCharCode(code);
            console.log(text);
            return 1;
        } catch { return 0; }
    },
    vlConsoleColor(): number { return 1; },
    vlConsoleTitle(): number { return 1; },
    vlConsoleRead(): undefined { return undefined; },
});

globalThis.onmessage = (event: MessageEvent<WasmCommand>): void => {
    void (async () => {
        const command = event.data;
        if (command.kind === 'start') {
            if (module !== undefined) return;
            const loaded = await import(/* @vite-ignore */ command.moduleUrl) as { default: WasmFactory };
            module = await loaded.default({ onAbort: reason => { notify('error', 0, String(reason)); } });
            check(module.StartApplication(receive));
            return;
        }
        if (module === undefined) throw new Error('The Wasm module has not started.');
        switch (command.kind) {
            case 'connect': check(module.ConnectToWasmCore(command.connectionId)); break;
            case 'disconnect': check(module.DisconnectFromWasmCore(command.connectionId)); break;
            case 'data': check(module.SendDataToWasmCore(command.connectionId, command.data)); break;
        }
    })().catch(error => {
        notify('error', 0, normalizeError(error).message);
    });
};
