import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from 'vitest';
import ts from 'typescript';
import {
    RpcChannelClient,
    RpcChannelCompletion,
    RpcChannelMessage,
    RpcCodec,
    RpcEndpoint,
    RpcEvent,
    RpcLocalList,
    RpcLocalObservableList,
} from '@gaclib/workflow-rpc';
import { generateWorkflowRpc } from '../src/index.js';

interface GeneratedFullSurface {
    readonly IServiceTypeId: number;
    readonly ItemCodec: RpcCodec<{ name: string; state: number }>;
    readonly NumericBoundariesCodec: RpcCodec<{ u8: number; i64: number; single: number }>;
    configureRpcEndpoint(endpoint: RpcEndpoint): void;
    registerIServiceService(endpoint: RpcEndpoint, implementation: object): unknown;
}

async function step<T>(name: string, promise: Promise<T>): Promise<T> {
    return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error(`Generated runtime step timed out: ${name}`)), 1000)),
    ]);
}

class GeneratedChannel implements RpcChannelClient {
    private readonly handlers = new Set<(message: RpcChannelMessage) => void | Promise<void>>();
    private resolveCompletion: ((completion: RpcChannelCompletion) => void) | undefined;
    readonly completion = new Promise<RpcChannelCompletion>(resolve => { this.resolveCompletion = resolve; });
    constructor(readonly clientId: number, private readonly broker: GeneratedBroker) { broker.add(this); }
    onMessage(handler: (message: RpcChannelMessage) => void | Promise<void>): () => void {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }
    sendToClient(receiverClientId: number, channelName: string, messageBody: string): Promise<void> {
        return this.broker.send(this.clientId, receiverClientId, channelName, messageBody);
    }
    receive(senderClientId: number, channelName: string, messageBody: string): void {
        for (const handler of this.handlers) void handler({ senderClientId, channelName, messageBody });
    }
    stop(): void { this.resolveCompletion?.({ type: 'stopped' }); }
}

class GeneratedBroker {
    private readonly channels = new Map<number, GeneratedChannel>();
    private readonly broadcasts = new Map<number, { readonly owner: number; remaining: number; readonly errors: [number, { message: string }][] }>();
    add(channel: GeneratedChannel): void { this.channels.set(channel.clientId, channel); }
    login(clientId: number): void {
        this.channels.get(clientId)?.receive(1, 'ViewModelChannel', JSON.stringify([{ rpcChannelingSystem: 'Login', serverClientId: 1 }]));
    }
    send(sender: number, receiver: number, channelName: string, body: string): Promise<void> {
        if (receiver !== 1) {
            this.channels.get(receiver)?.receive(sender, channelName, body);
            return Promise.resolve();
        }
        const messages = JSON.parse(body) as Record<string, unknown>[];
        for (const message of messages) {
            if (message.rpcMethod === 'Request:IRpcDispatcher_DeclareRemoteService') {
                for (const [clientId, channel] of this.channels) {
                    if (clientId !== sender) channel.receive(1, channelName, JSON.stringify([message]));
                }
            } else if (message.rpcMethod === 'Request:IObjectEventOps_InvokeEvent') {
                const requestId = message.rpcRequestId as number;
                const recipients = [...this.channels].filter(([clientId]) => clientId !== sender);
                this.broadcasts.set(requestId, { owner: sender, remaining: recipients.length, errors: [] });
                for (const [, channel] of recipients) {
                    channel.receive(1, channelName, JSON.stringify([{ ...message, sourceClientId: 1 }]));
                }
            } else if (message.rpcMethod === 'Response:Broadcast_Response') {
                const requestId = message.rpcRequestId as number;
                const broadcast = this.broadcasts.get(requestId);
                if (broadcast === undefined) throw new Error('Unexpected generated event response.');
                if (message.response !== null) broadcast.errors.push(...message.response as [number, { message: string }][]);
                if (--broadcast.remaining === 0) {
                    this.broadcasts.delete(requestId);
                    this.channels.get(broadcast.owner)?.receive(1, channelName, JSON.stringify([{
                        rpcMethod: 'Response:Broadcast_Response',
                        rpcRequestId: requestId,
                        sourceClientId: 1,
                        targetClientId: broadcast.owner,
                        response: broadcast.errors.length === 0 ? null : broadcast.errors,
                    }]));
                }
            } else {
                throw new Error(`Unexpected generated broker message: ${String(message.rpcMethod)}`);
            }
        }
        return Promise.resolve();
    }
}

async function loadGeneratedFullSurface(): Promise<GeneratedFullSurface> {
    const fixtures = path.resolve(import.meta.dirname, 'fixtures');
    const metadataPath = path.join(fixtures, 'FullSurface.txt');
    const schemaPath = path.join(fixtures, 'FullSurface.d.ts');
    const source = generateWorkflowRpc({
        metadataPath,
        metadataText: fs.readFileSync(metadataPath, 'utf8'),
        schemaPath,
        schemaText: fs.readFileSync(schemaPath, 'utf8'),
    }).files[0].content;
    const temporary = fs.mkdtempSync(path.join(import.meta.dirname, '.generated-runtime-'));
    const outputPath = path.join(temporary, 'generated.mjs');
    fs.writeFileSync(outputPath, ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText, 'utf8');
    try {
        return await import(`${pathToFileURL(outputPath).href}?test=${String(Date.now())}`) as GeneratedFullSurface;
    } finally {
        fs.rmSync(temporary, { recursive: true, force: true });
    }
}

test('generated full-surface bindings execute overload, property, event, inheritance, callback, collection, and by-value glue', async () => {
    const generated = await loadGeneratedFullSurface();
    const broker = new GeneratedBroker();
    const ownerChannel = new GeneratedChannel(3, broker);
    const callerChannel = new GeneratedChannel(4, broker);
    const owner = new RpcEndpoint(ownerChannel, { finalizer: false });
    const caller = new RpcEndpoint(callerChannel, { finalizer: false });
    generated.configureRpcEndpoint(owner);
    generated.configureRpcEndpoint(caller);
    const changed = new RpcEvent<[number, unknown]>();
    const items = new RpcLocalObservableList([{ name: 'one', state: 1 }], generated.ItemCodec);
    let dynamicGets = 0;
    let cachedGets = 0;
    const implementation = {
        ItemsChanged: changed,
        Convert_1: (value: string) => `string:${value}`,
        Convert_2: (value: number) => `number:${String(value)}`,
        GetName: () => `name:${String(++dynamicGets)}`,
        GetItems: () => { cachedGets++; return items; },
        SetItems: () => undefined,
        Snapshot: async (values: { count(): Promise<number>; get(index: number): Promise<unknown> }) => {
            const result: unknown[] = [];
            for (let index = 0; index < await values.count(); index++) result.push(await values.get(index));
            return result;
        },
        RoundValueValue: (values: { name: string; state: number }[]) => {
            values.push({ name: 'server', state: 0 });
            return values;
        },
        RoundValueReference: (values: readonly { name: string; state: number }[]) => new RpcLocalList([...values], generated.ItemCodec),
        RoundReferenceValue: async (values: { count(): Promise<number>; get(index: number): Promise<unknown> }) => {
            const result: unknown[] = [];
            for (let index = 0; index < await values.count(); index++) result.push(await values.get(index));
            return result;
        },
        UseCallback: async (callback: { Accept(value: unknown): Promise<string> }) => await callback.Accept({ note: null, nested: new Map() }),
        Accept: () => 'owner',
    };
    generated.registerIServiceService(owner, implementation);
    const ownerInitialization = owner.initialize();
    const callerInitialization = caller.initialize([generated.IServiceTypeId]);
    broker.login(3);
    broker.login(4);
    await step('owner initialization', ownerInitialization);
    await step('caller initialization', callerInitialization);
    const service = await step('service resolution', caller.requestService<Record<string, (...arguments_: unknown[]) => Promise<unknown>>>(generated.IServiceTypeId));
    const numericBoundaries = { u8: 255, i64: Number.MAX_SAFE_INTEGER, single: 3.4028234663852886e38 };
    await expect(step('numeric boundary encoding', Promise.resolve().then(() => generated.NumericBoundariesCodec.encodeUnknown(owner, numericBoundaries)))).resolves.toMatchObject({
        '$': 'sample::NumericBoundaries', u8: 255, i64: Number.MAX_SAFE_INTEGER,
    });
    await expect(Promise.resolve().then(() => generated.NumericBoundariesCodec.encodeUnknown(owner, { ...numericBoundaries, u8: 256 }))).rejects.toThrow(/UInt8 is outside/u);
    await expect(step('string overload', service.Convert_1('x'))).resolves.toBe('string:x');
    await expect(step('numeric overload', service.Convert_2(42))).resolves.toBe('number:42');
    await expect(step('first dynamic property', service.GetName())).resolves.toBe('name:1');
    await expect(step('second dynamic property', service.GetName())).resolves.toBe('name:2');
    const source = [{ name: 'client', state: 1 }];
    await expect(step('by-value round trip', service.RoundValueValue(source))).resolves.toEqual([...source, { name: 'server', state: 0 }]);
    expect(source).toHaveLength(1);
    const remoteList = await step('by-reference result', service.RoundValueReference(source)) as { count(): Promise<number>; dispose(): Promise<void> };
    await expect(step('by-reference count', remoteList.count())).resolves.toBe(1);
    await step('by-reference disposal', remoteList.dispose());
    const callback = { Accept: (value: { note: string | null }) => `callback:${String(value.note)}` };
    await expect(step('callback', service.UseCallback(callback))).resolves.toBe('callback:null');
    const firstItems = await step('first cached property', service.getItems());
    expect(await step('second cached property', service.getItems())).toBe(firstItems);
    expect(cachedGets).toBe(1);
    await step('property invalidation event', changed.emit(0, items));
    expect(await step('invalidated cached property', service.getItems())).toBe(firstItems);
    expect(cachedGets).toBe(2);
    expect(owner.getDebugState().byValueSlots).toBe(0);
    const proxyEvent = (service as unknown as { readonly ItemsChanged: RpcEvent<[number, unknown]> }).ItemsChanged;
    let finalizedEventCalls = 0;
    proxyEvent.subscribe(() => { finalizedEventCalls++; });
    caller.finalize();
    await proxyEvent.dispatchRemote(0, firstItems);
    expect(finalizedEventCalls).toBe(0);
    expect(caller.getDebugState()).toMatchObject({ remoteViews: 0, remoteLeases: 0, suppressionEntries: 0 });
    owner.finalize();
    ownerChannel.stop();
    callerChannel.stop();
});
