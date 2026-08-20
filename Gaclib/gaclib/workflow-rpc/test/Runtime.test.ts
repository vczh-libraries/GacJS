import { expect, test } from 'vitest';
import {
    RpcChannelClient,
    RpcChannelCompletion,
    RpcChannelMessage,
    RpcCleanupScheduler,
    RpcEndpoint,
    RpcEvent,
    RpcEventBroadcastError,
    RpcFinalizer,
    RpcFinalizerToken,
    RpcInterfaceDescriptor,
    RpcList,
    RpcLocalList,
    RpcLocalObservableList,
    RpcObjectReference,
    RpcObservableList,
    RpcProxy,
    RpcProxyContext,
    RpcProtocolError,
    RpcReferenceFactory,
    createByReferenceListCodec,
    createByReferenceObservableListCodec,
    createEnumCodec,
    createInterfaceCodec,
    createListCodec,
    createMapCodec,
    createNullableCodec,
    createStructCodec,
    rpcInt32Codec,
    rpcInt64Codec,
    rpcSingleCodec,
    rpcStringCodec,
} from '../src/index.js';

class MemoryChannel implements RpcChannelClient {
    private readonly handlers = new Set<(message: RpcChannelMessage) => void | Promise<void>>();
    private completionResolve: ((value: RpcChannelCompletion) => void) | undefined;
    readonly completion = new Promise<RpcChannelCompletion>(resolve => { this.completionResolve = resolve; });

    constructor(readonly clientId: number, private readonly broker: MemoryBroker) { broker.add(this); }
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
    stop(): void { this.completionResolve?.({ type: 'stopped' }); }
}

class MemoryBroker {
    private readonly channels = new Map<number, MemoryChannel>();
    private readonly eventOwners = new Map<number, { owner: number; expected: number; responses: [number, { message: string }][] }>();
    private readonly delayedUnholdIds = new Set<number>();
    private readonly delayedDeliveries: { sender: number; receiver: number; channelName: string; body: string; resolve: () => void }[] = [];
    private pauseUnhold = false;
    add(channel: MemoryChannel): void { this.channels.set(channel.clientId, channel); }
    login(clientId: number): void {
        this.channels.get(clientId)?.receive(1, 'ViewModelChannel', JSON.stringify([{ rpcChannelingSystem: 'Login', serverClientId: 1 }]));
    }
    pauseNextUnholdResponse(): void { this.pauseUnhold = true; }
    get delayedUnholdResponses(): number { return this.delayedDeliveries.length; }
    releaseUnholdResponses(): void {
        for (const delivery of this.delayedDeliveries.splice(0)) {
            this.channels.get(delivery.receiver)?.receive(delivery.sender, delivery.channelName, delivery.body);
            delivery.resolve();
        }
    }
    send(sender: number, receiver: number, channelName: string, body: string): Promise<void> {
        const messages = JSON.parse(body) as Record<string, unknown>[];
        if (receiver !== 1) {
            for (const message of messages) {
                if (message.rpcMethod === 'Request:IObjectOps_ObjectHold' && message.hold === false && this.pauseUnhold) {
                    this.pauseUnhold = false;
                    this.delayedUnholdIds.add(message.rpcRequestId as number);
                }
                if (message.rpcMethod === 'Response:IObjectOps_ObjectHold'
                    && this.delayedUnholdIds.delete(message.rpcRequestId as number)) {
                    return new Promise(resolve => {
                        this.delayedDeliveries.push({ sender, receiver, channelName, body, resolve });
                    });
                }
            }
            this.channels.get(receiver)?.receive(sender, channelName, body);
            return Promise.resolve();
        }
        for (const message of messages) {
            if (message.rpcMethod === 'Request:IRpcDispatcher_DeclareRemoteService') {
                for (const [id, channel] of this.channels) {
                    if (id !== sender) channel.receive(1, channelName, JSON.stringify([message]));
                }
            } else if (message.rpcMethod === 'Request:IObjectEventOps_InvokeEvent') {
                const requestId = message.rpcRequestId as number;
                const recipients = [...this.channels].filter(([id]) => id !== sender);
                this.eventOwners.set(requestId, { owner: sender, expected: recipients.length, responses: [] });
                for (const [, channel] of recipients) {
                    channel.receive(1, channelName, JSON.stringify([{ ...message, sourceClientId: 1 }]));
                }
                if (recipients.length === 0) {
                    this.eventOwners.delete(requestId);
                    this.channels.get(sender)?.receive(1, channelName, JSON.stringify([{
                        rpcMethod: 'Response:Broadcast_Response',
                        rpcRequestId: requestId,
                        sourceClientId: 1,
                        targetClientId: sender,
                        response: null,
                    }]));
                }
            } else if (message.rpcMethod === 'Response:Broadcast_Response') {
                const requestId = message.rpcRequestId as number;
                const broadcast = this.eventOwners.get(requestId);
                if (broadcast === undefined) throw new Error('Unexpected event response.');
                if (message.response !== null) {
                    broadcast.responses.push(...message.response as [number, { message: string }][]);
                }
                broadcast.expected--;
                if (broadcast.expected === 0) {
                    this.eventOwners.delete(requestId);
                    this.channels.get(broadcast.owner)?.receive(1, channelName, JSON.stringify([{
                        rpcMethod: 'Response:Broadcast_Response',
                        rpcRequestId: requestId,
                        sourceClientId: 1,
                        targetClientId: broadcast.owner,
                        response: broadcast.responses.length === 0 ? null : broadcast.responses,
                    }]));
                }
            } else {
                throw new Error(`Unsupported broker message: ${String(message.rpcMethod)}`);
            }
        }
        return Promise.resolve();
    }
}

class ManualCleanupScheduler implements RpcCleanupScheduler {
    private readonly tasks: (() => Promise<void>)[] = [];
    schedule(task: () => Promise<void>): void { this.tasks.push(task); }
    async flush(): Promise<void> {
        for (const task of this.tasks.splice(0)) await task();
    }
}

class ManualFinalizer implements RpcFinalizer {
    readonly tokens: RpcFinalizerToken[] = [];
    constructor(private readonly callback: (token: RpcFinalizerToken) => void) {}
    register(target: object, token: RpcFinalizerToken): void { void target; this.tokens.push(token); }
    unregister(): void {}
    trigger(token: RpcFinalizerToken): void { this.callback(token); }
}

interface CallbackLocal { Call(value: string): string | Promise<string>; }
interface CallbackProxy { readonly disposed: boolean; Call(value: string): Promise<string>; dispose(): Promise<void>; }
type CallbackObject = CallbackLocal | CallbackProxy;

class CallbackProxyImpl extends RpcProxy implements CallbackProxy {
    constructor(context: RpcProxyContext) { super(context); }
    Call(value: string): Promise<string> { return this.invoke(3, [value]); }
}
const callbackFactory: RpcReferenceFactory<CallbackProxy> = { key: 'test::ICallback', create: context => new CallbackProxyImpl(context) };
const callbackCodec = createInterfaceCodec<CallbackObject>(2, callbackFactory as RpcReferenceFactory<CallbackObject>);
const callbackDescriptor: RpcInterfaceDescriptor<CallbackLocal, CallbackProxy> = {
    typeId: 2, idString: 'test::ICallback', name: 'test::ICallback', constructorService: false,
    baseTypeIds: [], proxyFactory: callbackFactory, properties: [], events: [],
    methods: [{
        id: 3, idString: 'test::ICallback.Call', name: 'Call', implementationKey: 'Call',
        parameters: [{ codec: rpcStringCodec, transfer: 'value' }],
        result: { codec: rpcStringCodec, transfer: 'value' },
    }],
};

interface ServiceLocal {
    readonly Changed: RpcEvent<[number]>;
    EchoValue(values: readonly number[]): readonly number[] | Promise<readonly number[]>;
    EchoReference(values: RpcList<number> | null): RpcList<number> | null | Promise<RpcList<number> | null>;
    EchoObservable(values: RpcObservableList<number> | null): RpcObservableList<number> | null | Promise<RpcObservableList<number> | null>;
    UseCallback(callback: CallbackObject | null): string | Promise<string>;
}
interface ServiceProxy {
    readonly disposed: boolean;
    readonly Changed: RpcEvent<[number]>;
    EchoValue(values: readonly number[]): Promise<readonly number[]>;
    EchoReference(values: RpcList<number> | null): Promise<RpcList<number> | null>;
    EchoObservable(values: RpcObservableList<number> | null): Promise<RpcObservableList<number> | null>;
    UseCallback(callback: CallbackObject | null): Promise<string>;
    dispose(): Promise<void>;
}

class ServiceProxyImpl extends RpcProxy implements ServiceProxy {
    readonly Changed = new RpcEvent<[number]>();
    constructor(context: RpcProxyContext) {
        super(context);
        this.Changed.setOutgoing((...arguments_) => this.raiseEvent(6, arguments_));
    }
    EchoValue(values: readonly number[]): Promise<readonly number[]> { return this.invoke(1, [values]); }
    EchoReference(values: RpcList<number> | null): Promise<RpcList<number> | null> { return this.invoke(4, [values]); }
    EchoObservable(values: RpcObservableList<number> | null): Promise<RpcObservableList<number> | null> { return this.invoke(7, [values]); }
    UseCallback(callback: CallbackObject | null): Promise<string> { return this.invoke(5, [callback]); }
    override async dispose(): Promise<void> { this.Changed.clear(); await super.dispose(); }
}
const serviceFactory: RpcReferenceFactory<ServiceProxy> = { key: 'test::IService', create: context => new ServiceProxyImpl(context) };
const byValueListCodec = createListCodec(rpcInt32Codec);
const byReferenceListCodec = createByReferenceListCodec(rpcInt32Codec);
const byReferenceObservableListCodec = createByReferenceObservableListCodec(rpcInt32Codec);
const serviceDescriptor: RpcInterfaceDescriptor<ServiceLocal, ServiceProxy> = {
    typeId: 0, idString: 'test::IService', name: 'test::IService', constructorService: true,
    baseTypeIds: [], proxyFactory: serviceFactory, properties: [],
    methods: [
        {
            id: 1, idString: 'test::IService.EchoValue', name: 'EchoValue', implementationKey: 'EchoValue',
            parameters: [{ codec: byValueListCodec, transfer: 'byValue' }],
            result: { codec: byValueListCodec, transfer: 'byValue' },
        },
        {
            id: 4, idString: 'test::IService.EchoReference', name: 'EchoReference', implementationKey: 'EchoReference',
            parameters: [{ codec: byReferenceListCodec, transfer: 'byReference' }],
            result: { codec: byReferenceListCodec, transfer: 'byReference' },
        },
        {
            id: 5, idString: 'test::IService.UseCallback', name: 'UseCallback', implementationKey: 'UseCallback',
            parameters: [{ codec: callbackCodec, transfer: 'value' }],
            result: { codec: rpcStringCodec, transfer: 'value' },
        },
        {
            id: 7, idString: 'test::IService.EchoObservable', name: 'EchoObservable', implementationKey: 'EchoObservable',
            parameters: [{ codec: byReferenceObservableListCodec, transfer: 'byReference' }],
            result: { codec: byReferenceObservableListCodec, transfer: 'byReference' },
        },
    ],
    events: [{
        id: 6, idString: 'test::IService.Changed', name: 'Changed', propertyKey: 'Changed',
        parameters: [{ codec: rpcInt32Codec, transfer: 'value' }],
    }],
};

function createEndpoint(channel: MemoryChannel): RpcEndpoint {
    const endpoint = new RpcEndpoint(channel, { finalizer: false });
    endpoint.registerInterface(serviceDescriptor);
    endpoint.registerInterface(callbackDescriptor);
    return endpoint;
}

function serviceImplementation(overrides: Partial<ServiceLocal> = {}): ServiceLocal {
    return {
        Changed: new RpcEvent<[number]>(),
        EchoValue: values => values,
        EchoReference: values => values,
        EchoObservable: values => values,
        UseCallback: callback => callback === null ? 'null' : callback.Call('default'),
        ...overrides,
    };
}

async function waitUntil(predicate: () => boolean): Promise<void> {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    throw new Error('Timed out waiting for the in-memory RPC condition.');
}

test('strict codecs enforce numeric, enum, nullable, struct, list, and map shapes', async () => {
    const broker = new MemoryBroker();
    const endpoint = createEndpoint(new MemoryChannel(3, broker));
    await expect(Promise.resolve(rpcInt64Codec.encodeUnknown(endpoint, Number.MAX_SAFE_INTEGER))).resolves.toEqual(['Int64', Number.MAX_SAFE_INTEGER]);
    expect(() => rpcInt64Codec.encodeUnknown(endpoint, Number.MAX_SAFE_INTEGER + 1)).toThrow(/safe range/u);
    expect(() => rpcSingleCodec.encodeUnknown(endpoint, 3.5e38)).toThrow(/finite range/u);
    const enumCodec = createEnumCodec<0 | 1>('State', new Set([0, 1]));
    expect(() => enumCodec.decodeUnknown(endpoint, ['State', 2])).toThrow(/unknown enum/u);
    const nullable = createNullableCodec(rpcStringCodec);
    await expect(Promise.resolve(nullable.decodeUnknown(endpoint, null))).resolves.toBeNull();
    const pointCodec = createStructCodec<{ x: number; y: number }>('Point', [
        { key: 'x', codec: rpcInt32Codec }, { key: 'y', codec: rpcInt32Codec },
    ]);
    await expect(Promise.resolve(pointCodec.decodeUnknown(endpoint, { '$': 'Point', x: 1, y: 2 }))).resolves.toEqual({ x: 1, y: 2 });
    await expect(Promise.resolve(createMapCodec(rpcStringCodec, rpcInt32Codec).decodeUnknown(endpoint, {
        '$': 'map', values: [['a', ['Int32', 1]]],
    }))).resolves.toEqual(new Map([['a', 1]]));
    const nestedListCodec = createListCodec(createListCodec(rpcInt32Codec));
    const cyclic: unknown[] = [];
    cyclic.push(cyclic);
    await expect(Promise.resolve(nestedListCodec.copy(endpoint, cyclic as readonly (readonly number[])[], new Set<object>())))
        .rejects.toThrow(/cycle was found/u);
    const repeated = [1, 2];
    const repeatedCopy = await nestedListCodec.copy(endpoint, [repeated, repeated], new Set<object>());
    expect(repeatedCopy).toEqual([[1, 2], [1, 2]]);
    expect(repeatedCopy[0]).not.toBe(repeatedCopy[1]);
    endpoint.finalize();
});

test('interface inheritance preserves object identity while changing the reference view type', () => {
    const broker = new MemoryBroker();
    const endpoint = new RpcEndpoint(new MemoryChannel(3, broker), { finalizer: false });
    const descriptor = (typeId: number, baseTypeIds: readonly number[]): RpcInterfaceDescriptor => ({
        typeId,
        idString: `test::I${String(typeId)}`,
        name: `test::I${String(typeId)}`,
        constructorService: false,
        baseTypeIds,
        methods: [],
        events: [],
        properties: [],
        proxyFactory: { key: `test::I${String(typeId)}`, create: () => ({}) },
    });
    endpoint.registerInterface(descriptor(1, []));
    endpoint.registerInterface(descriptor(2, [1]));
    endpoint.registerInterface(descriptor(3, []));
    const implementation = {};
    const derived = endpoint.objectToReference(implementation, 2);
    const base = endpoint.objectToReference(implementation, 1);
    expect(base).toEqual({ ...derived, typeId: 1 });
    expect(base.objectId).toBe(derived.objectId);
    expect(() => endpoint.objectToReference(implementation, 3)).toThrow(RpcProtocolError);
    endpoint.finalize();
});

test('endpoint supports nested callbacks, event delivery, by-value slots, and by-reference identity', async () => {
    const broker = new MemoryBroker();
    const ownerChannel = new MemoryChannel(3, broker);
    const callerChannel = new MemoryChannel(4, broker);
    const spectatorChannel = new MemoryChannel(5, broker);
    const owner = createEndpoint(ownerChannel);
    const caller = createEndpoint(callerChannel);
    const spectator = createEndpoint(spectatorChannel);
    const changed = new RpcEvent<[number]>();
    const observedChanges: [number, number, number][] = [];
    const implementation: ServiceLocal = {
        Changed: changed,
        EchoValue: values => [...values, 99],
        async EchoReference(values) {
            if (values === null) return new RpcLocalList([7, 8], rpcInt32Codec);
            await values.add(99);
            return values;
        },
        async EchoObservable(values) {
            if (values === null) return null;
            values.itemChanged.subscribe((index, oldCount, newCount) => {
                observedChanges.push([index, oldCount, newCount]);
            });
            await values.add(99);
            return values;
        },
        async UseCallback(callback) {
            if (callback === null) return 'null';
            const result = await callback.Call('nested');
            if ('dispose' in callback) await callback.dispose();
            return result;
        },
    };
    const reference: RpcObjectReference = owner.registerService(serviceDescriptor, implementation);
    expect(reference).toEqual({ clientId: 3, objectId: 0, typeId: 0 });
    const ownerInitialization = owner.initialize();
    const callerInitialization = caller.initialize([0]);
    const spectatorInitialization = spectator.initialize();
    broker.login(3);
    broker.login(4);
    broker.login(5);
    await ownerInitialization;
    await callerInitialization;
    await spectatorInitialization;
    const service = await caller.requestService<ServiceProxy>(0);

    const original = [1, 2];
    await expect(service.EchoValue(original)).resolves.toEqual([1, 2, 99]);
    expect(original).toEqual([1, 2]);
    expect(owner.getDebugState().byValueSlots).toBe(0);

    const localList = new RpcLocalList([1, 2], rpcInt32Codec);
    const returned = await service.EchoReference(localList);
    expect(returned).toBe(localList);
    await expect(localList.count()).resolves.toBe(3);
    await expect(localList.get(2)).resolves.toBe(99);
    const remoteList = (await service.EchoReference(null))!;
    await expect(remoteList.get(0)).resolves.toBe(7);
    const viewsBeforeEnumeration = caller.getDebugState().remoteViews;
    for await (const item of remoteList) {
        expect(item).toBe(7);
        break;
    }
    expect(caller.getDebugState().remoteViews).toBe(viewsBeforeEnumeration);
    await remoteList.dispose();

    const observable = new RpcLocalObservableList([10], rpcInt32Codec);
    const returnedObservable = await service.EchoObservable(observable);
    expect(returnedObservable).toBe(observable);
    expect(observedChanges).toEqual([[1, 0, 1]]);
    await expect(observable.get(1)).resolves.toBe(99);
    expect(owner.getDebugState().active).toBe(true);
    expect(caller.getDebugState().active).toBe(true);

    const callback: CallbackLocal = { Call: value => `callback:${value}` };
    await expect(service.UseCallback(callback)).resolves.toBe('callback:nested');

    const received: number[] = [];
    const ownerReceived: number[] = [];
    changed.subscribe(value => { ownerReceived.push(value); });
    service.Changed.subscribe(value => { received.push(value); });
    await changed.emit(42);
    expect(received).toEqual([42]);
    await service.Changed.emit(43);
    expect(received).toEqual([42, 43]);
    expect(ownerReceived).toEqual([42, 43]);
    expect(spectator.getDebugState()).toMatchObject({ remoteViews: 0, remoteLeases: 0 });

    await service.dispose();
    owner.finalize();
    caller.finalize();
    spectator.finalize();
    ownerChannel.stop();
    callerChannel.stop();
    spectatorChannel.stop();
    expect(owner.getDebugState()).toMatchObject({ active: false, pendingRequests: 0, byValueSlots: 0 });
    expect(caller.getDebugState()).toMatchObject({ active: false, pendingRequests: 0, remoteViews: 0 });
});

test('pending calls correlate out of order while the read loop remains reentrant', async () => {
    const broker = new MemoryBroker();
    const ownerChannel = new MemoryChannel(3, broker);
    const callerChannel = new MemoryChannel(4, broker);
    const owner = createEndpoint(ownerChannel);
    const caller = createEndpoint(callerChannel);
    const resolvers = new Map<number, (value: readonly number[]) => void>();
    owner.registerService(serviceDescriptor, serviceImplementation({
        EchoValue: values => new Promise(resolve => { resolvers.set(values[0], resolve); }),
    }));
    const ownerInitialization = owner.initialize();
    const callerInitialization = caller.initialize([0]);
    broker.login(3);
    broker.login(4);
    await Promise.all([ownerInitialization, callerInitialization]);
    const service = await caller.requestService<ServiceProxy>(0);
    const first = service.EchoValue([1]);
    const second = service.EchoValue([2]);
    await waitUntil(() => resolvers.size === 2);
    resolvers.get(2)!([2, 20]);
    await expect(second).resolves.toEqual([2, 20]);
    resolvers.get(1)!([1, 10]);
    await expect(first).resolves.toEqual([1, 10]);
    await service.dispose();
    owner.finalize();
    caller.finalize();
});

test('third-party interface references relay their original owner and remain callable', async () => {
    const broker = new MemoryBroker();
    const callbackOwner = createEndpoint(new MemoryChannel(3, broker));
    const relay = createEndpoint(new MemoryChannel(4, broker));
    const serviceOwner = createEndpoint(new MemoryChannel(5, broker));
    serviceOwner.registerService(serviceDescriptor, serviceImplementation({
        async UseCallback(callback) {
            if (callback === null) return 'null';
            const result = await callback.Call('relayed');
            if ('dispose' in callback) await callback.dispose();
            return result;
        },
    }));
    const callback: CallbackLocal = { Call: value => `owner:${value}` };
    const callbackReference = callbackOwner.objectToReference(callback, callbackDescriptor.typeId);
    const initializations = [callbackOwner.initialize(), relay.initialize([0]), serviceOwner.initialize()];
    broker.login(3);
    broker.login(4);
    broker.login(5);
    await Promise.all(initializations);
    const relayedCallback = (await relay.referenceToObject(callbackReference, callbackFactory))!;
    expect(relay.objectToReference(relayedCallback, callbackDescriptor.typeId)).toEqual(callbackReference);
    const service = await relay.requestService<ServiceProxy>(0);
    await expect(service.UseCallback(relayedCallback)).resolves.toBe('owner:relayed');
    await relayedCallback.dispose();
    await service.dispose();
    callbackOwner.finalize();
    relay.finalize();
    serviceOwner.finalize();
});

test('event broadcasts aggregate receiver errors and suppress reflected outgoing events', async () => {
    const broker = new MemoryBroker();
    const owner = createEndpoint(new MemoryChannel(3, broker));
    const firstCaller = createEndpoint(new MemoryChannel(4, broker));
    const secondCaller = createEndpoint(new MemoryChannel(5, broker));
    const changed = new RpcEvent<[number]>();
    owner.registerService(serviceDescriptor, serviceImplementation({ Changed: changed }));
    const initializations = [owner.initialize(), firstCaller.initialize([0]), secondCaller.initialize([0])];
    broker.login(3);
    broker.login(4);
    broker.login(5);
    await Promise.all(initializations);
    const first = await firstCaller.requestService<ServiceProxy>(0);
    const second = await secondCaller.requestService<ServiceProxy>(0);
    first.Changed.subscribe(() => { throw new Error('first failed'); });
    second.Changed.subscribe(() => { throw new Error('second failed'); });
    let error: unknown;
    try {
        await changed.emit(9);
    } catch (caught: unknown) {
        error = caught;
    }
    expect(error).toBeInstanceOf(RpcEventBroadcastError);
    expect((error as RpcEventBroadcastError).exceptions).toEqual([
        [4, { message: 'first failed' }],
        [5, { message: 'second failed' }],
    ]);
    expect(firstCaller.getDebugState().suppressionEntries).toBe(0);
    expect(secondCaller.getDebugState().suppressionEntries).toBe(0);
    await first.dispose();
    await second.dispose();
    owner.finalize();
    firstCaller.finalize();
    secondCaller.finalize();
});

test('stale finalizers and an in-flight unhold cannot release a replacement proxy', async () => {
    const broker = new MemoryBroker();
    const owner = createEndpoint(new MemoryChannel(3, broker));
    const callerChannel = new MemoryChannel(4, broker);
    const scheduler = new ManualCleanupScheduler();
    let manualFinalizer: ManualFinalizer | undefined;
    const caller = new RpcEndpoint(callerChannel, {
        cleanupScheduler: scheduler,
        finalizer: callback => {
            manualFinalizer = new ManualFinalizer(callback);
            return manualFinalizer;
        },
    });
    caller.registerInterface(serviceDescriptor);
    caller.registerInterface(callbackDescriptor);
    const holds: boolean[] = [];
    owner.onLocalObjectHold(notification => { holds.push(notification.hold); });
    owner.registerService(serviceDescriptor, serviceImplementation());
    const initializations = [owner.initialize(), caller.initialize([0])];
    broker.login(3);
    broker.login(4);
    await Promise.all(initializations);
    const first = await caller.requestService<ServiceProxy>(0);
    const staleToken = manualFinalizer!.tokens[0];
    manualFinalizer!.trigger(staleToken);
    broker.pauseNextUnholdResponse();
    const disposing = first.dispose();
    await waitUntil(() => broker.delayedUnholdResponses === 1);
    const replacementPromise = caller.requestService<ServiceProxy>(0);
    broker.releaseUnholdResponses();
    const replacement = await replacementPromise;
    await disposing;
    expect(replacement).not.toBe(first);
    await scheduler.flush();
    expect(caller.getDebugState()).toMatchObject({ remoteViews: 1, remoteLeases: 1 });
    await expect(replacement.EchoValue([5])).resolves.toEqual([5]);
    expect(holds).toEqual([true, false, true]);
    await replacement.dispose();
    expect(holds).toEqual([true, false, true, false]);
    owner.finalize();
    caller.finalize();
});

async function expectDirectProtocolFailure(
    mutate: (message: Record<string, unknown>) => void,
    expected: RegExp,
): Promise<void> {
    const broker = new MemoryBroker();
    const channel = new MemoryChannel(3, broker);
    const endpoint = createEndpoint(channel);
    endpoint.registerService(serviceDescriptor, serviceImplementation());
    const initializing = endpoint.initialize();
    broker.login(3);
    await initializing;
    const message: Record<string, unknown> = {
        rpcMethod: 'Request:IObjectOps_InvokeMethod',
        rpcRequestId: 10,
        sourceClientId: 2,
        targetClientId: 3,
        ref: { clientId: 3, objectId: 0, typeId: 0 },
        methodId: 1,
        arguments: [{ '$': 'list', values: [] }],
    };
    mutate(message);
    channel.receive(2, 'ViewModelChannel', JSON.stringify([message]));
    const completion = await endpoint.completion;
    expect(completion.type).toBe('failed');
    if (completion.type === 'failed') {
        expect(completion.error).toBeInstanceOf(RpcProtocolError);
        expect(completion.error.message).toMatch(expected);
    }
}

test('direct envelopes reject wrong source, target, request, reference, and extra fields', async () => {
    await expectDirectProtocolFailure(message => { message.sourceClientId = 4; }, /source does not match/u);
    await expectDirectProtocolFailure(message => { message.targetClientId = 4; }, /targets another endpoint/u);
    await expectDirectProtocolFailure(message => { message.rpcRequestId = Number.MAX_SAFE_INTEGER + 1; }, /request id/u);
    await expectDirectProtocolFailure(message => {
        message.ref = { clientId: 4, objectId: 0, typeId: 0 };
    }, /target reference is not local/u);
    await expectDirectProtocolFailure(message => { message.unexpected = true; }, /unexpected field/u);
});

test('external hold notifications run only after the hold response write completes', async () => {
    let receive: ((message: RpcChannelMessage) => void | Promise<void>) | undefined;
    let resolveWrite: (() => void) | undefined;
    const sent: Record<string, unknown>[] = [];
    const channel: RpcChannelClient = {
        clientId: 3,
        completion: new Promise<RpcChannelCompletion>(() => undefined),
        onMessage(handler) {
            receive = handler;
            return () => { receive = undefined; };
        },
        sendToClient(_receiverClientId, _channelName, body) {
            const message = (JSON.parse(body) as Record<string, unknown>[])[0];
            sent.push(message);
            if (message.rpcMethod === 'Response:IObjectOps_ObjectHold') {
                return new Promise<void>(resolve => { resolveWrite = resolve; });
            }
            return Promise.resolve();
        },
    };
    const endpoint = createEndpoint(channel as MemoryChannel);
    endpoint.registerService(serviceDescriptor, serviceImplementation());
    const initializing = endpoint.initialize();
    await receive?.({
        senderClientId: 1,
        channelName: 'ViewModelChannel',
        messageBody: JSON.stringify([{ rpcChannelingSystem: 'Login', serverClientId: 1 }]),
    });
    await initializing;
    let notifications = 0;
    endpoint.onLocalObjectHold(() => { notifications++; });
    await receive?.({
        senderClientId: 2,
        channelName: 'ViewModelChannel',
        messageBody: JSON.stringify([{
            rpcMethod: 'Request:IObjectOps_ObjectHold', rpcRequestId: 20,
            sourceClientId: 2, targetClientId: 3,
            ref: { clientId: 3, objectId: 0, typeId: 0 }, remoteClientId: 2, hold: true,
        }]),
    });
    await waitUntil(() => resolveWrite !== undefined);
    expect(notifications).toBe(0);
    resolveWrite?.();
    await waitUntil(() => notifications === 1);
    expect(sent.at(-1)?.rpcMethod).toBe('Response:IObjectOps_ObjectHold');
    endpoint.finalize();
});
