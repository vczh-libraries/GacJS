import {
    attachPredefinedLocal,
    detachPredefinedLocal,
    getPredefinedLocalTypeId,
    getPredefinedProxyMethod,
    invokePredefinedLocal,
    invokePredefinedLocalEvent,
    invokePredefinedProxyEvent,
} from './collections.js';
import { isNullReference, validateReferenceOrNull } from './codecs.js';
import {
    normalizeError,
    RpcEndpointClosedError,
    RpcEventBroadcastError,
    RpcException,
    RpcProtocolError,
    RpcRemoteException,
} from './errors.js';
import { expectRpcEvent } from './events.js';
import { RpcProxy } from './proxy.js';
import {
    DEFAULT_RPC_CHANNEL_NAME,
    RpcBroadcastResponse,
    RpcByvalReturnValue,
    RpcChannelClient,
    RpcCleanupScheduler,
    RpcDeclareRemoteServiceRequest,
    RpcDirectMessage,
    RpcEndInvokeMethodRequest,
    RpcEndInvokeMethodResponse,
    RpcEndpointDebugState,
    RpcEndpointServices,
    RpcEventId_IValueObservableList_ItemChanged,
    RpcEventDescriptor,
    RpcEventExceptionMap,
    RpcFinalizer,
    RpcFinalizerFactory,
    RpcFinalizerToken,
    RpcInterfaceDescriptor,
    RpcInvokeEventRequest,
    RpcInvokeMethodRequest,
    RpcInvokeMethodResponse,
    RpcJsonValue,
    RpcLocalHoldNotification,
    RpcMethodDescriptor,
    RpcObjectHoldRequest,
    RpcObjectHoldResponse,
    RpcObjectReference,
    RpcProxyContext,
    RpcProxyEndpoint,
    RpcReferenceFactory,
    RpcResponse,
    RpcTransferMode,
    RpcTypeId_IValueObservableList,
    RpcValueUse,
} from './types.js';
import {
    asJsonValue,
    assertExactKeys,
    expectArray,
    expectBoolean,
    expectPositiveClientId,
    expectRecord,
    expectSafeInteger,
    expectString,
    leaseKey,
    readReference,
    readTaggedException,
    referenceKey,
} from './validation.js';

export interface RpcEndpointOptions {
    readonly channelName?: string;
    readonly cleanupScheduler?: RpcCleanupScheduler;
    readonly finalizer?: RpcFinalizerFactory | false;
}

export type RpcEndpointCompletion =
    | { type: 'stopped' }
    | { type: 'failed'; error: Error };

interface PendingRequest {
    readonly expectedMethod: RpcResponse['rpcMethod'];
    readonly targetClientId: number;
    readonly resolve: (response: RpcResponse) => void;
    readonly reject: (error: Error) => void;
}

interface ServiceWaiter {
    readonly resolve: (value: object) => void;
    readonly reject: (error: Error) => void;
}

interface LocalObjectRecord {
    readonly ref: RpcObjectReference;
    readonly value: object;
    readonly declaredTypeId: number;
    readonly interestedClients: Set<number>;
    detach: (() => void) | undefined;
}

interface ProxyRecord {
    readonly ref: RpcObjectReference;
    readonly referenceKey: string;
    readonly leaseKey: string;
    readonly viewGeneration: number;
    readonly claimId: string;
    readonly unregisterToken: object;
    readonly factoryKey: string;
    readonly ready: Promise<void>;
    detach: (() => void) | undefined;
    disposed: boolean;
}

interface ProxyView {
    readonly weak: WeakRef<object>;
    readonly generation: number;
    readonly claimId: string;
    readonly factoryKey: string;
}

interface RemoteLease {
    readonly key: string;
    readonly refForHold: RpcObjectReference;
    readonly claims: Set<string>;
    desiredHeld: boolean;
    acknowledgedHeld: boolean;
    closed: boolean;
    transition: Promise<void>;
}

interface GlobalTracker {
    readonly endpoint: WeakRef<RpcEndpoint>;
    readonly lifecycleGeneration: number;
    readonly ref: RpcObjectReference;
}

const globalLocalTrackers = new WeakMap<object, GlobalTracker>();
const globalProxyTrackers = new WeakMap<object, GlobalTracker>();

function deferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
} {
    let resolve: ((value: T) => void) | undefined;
    let reject: ((error: Error) => void) | undefined;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    if (resolve === undefined || reject === undefined) {
        throw new Error('Failed to create a deferred promise.');
    }
    return { promise, resolve, reject };
}

class DefaultCleanupScheduler implements RpcCleanupScheduler {
    schedule(task: () => Promise<void>): void {
        queueMicrotask(() => {
            void task().catch(() => undefined);
        });
    }
}

class DefaultFinalizer implements RpcFinalizer {
    private readonly registry: FinalizationRegistry<RpcFinalizerToken>;

    constructor(callback: (token: RpcFinalizerToken) => void) {
        this.registry = new FinalizationRegistry(callback);
    }

    register(target: object, token: RpcFinalizerToken, unregisterToken: object): void {
        this.registry.register(target, token, unregisterToken);
    }

    unregister(unregisterToken: object): void {
        this.registry.unregister(unregisterToken);
    }
}

function errorFromCompletion(completion: { type: 'stopped' | 'failed'; error?: Error }): Error {
    if (completion.type === 'failed' && completion.error !== undefined) {
        return completion.error;
    }
    return new RpcEndpointClosedError('The RPC channel stopped.');
}

function methodIsRequest(method: string): boolean {
    return method.startsWith('Request:');
}

function methodIsResponse(method: string): boolean {
    return method.startsWith('Response:');
}

export class RpcEndpoint implements RpcEndpointServices, RpcProxyEndpoint {
    public readonly clientId: number;
    public readonly completion: Promise<RpcEndpointCompletion>;
    private readonly channelName: string;
    private readonly cleanupScheduler: RpcCleanupScheduler;
    private readonly finalizer: RpcFinalizer | undefined;
    private readonly descriptors = new Map<number, RpcInterfaceDescriptor>();
    private readonly localObjects = new Map<number, LocalObjectRecord>();
    private readonly localReferences = new WeakMap<object, RpcObjectReference>();
    private readonly localServices = new Map<number, object>();
    private readonly remoteServices = new Map<number, RpcObjectReference>();
    private readonly serviceWaiters = new Map<number, Set<ServiceWaiter>>();
    private readonly pendingRequests = new Map<number, PendingRequest>();
    private readonly cachedIncomingDeclarations: { senderClientId: number; request: RpcDeclareRemoteServiceRequest }[] = [];
    private readonly cachedOutgoingDeclarations: RpcDeclareRemoteServiceRequest[] = [];
    private readonly proxyRecords = new WeakMap<object, ProxyRecord>();
    private readonly proxyViews = new Map<string, ProxyView>();
    private readonly remoteLeases = new Map<string, RemoteLease>();
    private readonly byValueSlots = new Map<number, unknown>();
    private readonly suppression = new Map<string, number>();
    private readonly localHoldHandlers = new Set<(notification: RpcLocalHoldNotification) => void | Promise<void>>();
    private readonly unsubscribeChannel: () => void;
    private readonly completionResolve: (completion: RpcEndpointCompletion) => void;
    private readonly loginPromise: Promise<number>;
    private readonly resolveLogin: (serverClientId: number) => void;
    private readonly rejectLogin: (error: Error) => void;
    private lifecycleGeneration = 1;
    private nextRequestId = 0;
    private nextObjectId = 0;
    private nextSlotId = 0;
    private nextViewGeneration = 0;
    private nextCallClaim = 0;
    private serverClientId: number | undefined;
    private state: 'created' | 'initializing' | 'active' | 'closed' = 'created';
    private completed = false;

    constructor(private readonly channel: RpcChannelClient, options: RpcEndpointOptions = {}) {
        if (channel.clientId === undefined) {
            throw new Error('An RPC endpoint requires an assigned channel client.');
        }
        this.clientId = expectPositiveClientId(channel.clientId, 'RPC endpoint client id');
        this.channelName = options.channelName ?? DEFAULT_RPC_CHANNEL_NAME;
        if (this.channelName.length === 0) {
            throw new Error('An RPC endpoint requires a channel name.');
        }
        this.cleanupScheduler = options.cleanupScheduler ?? new DefaultCleanupScheduler();

        const login = deferred<number>();
        this.loginPromise = login.promise;
        void this.loginPromise.catch(() => undefined);
        this.resolveLogin = login.resolve;
        this.rejectLogin = login.reject;

        let resolveCompletion: ((completion: RpcEndpointCompletion) => void) | undefined;
        this.completion = new Promise(resolve => {
            resolveCompletion = resolve;
        });
        if (resolveCompletion === undefined) {
            throw new Error('Failed to create the RPC endpoint completion promise.');
        }
        this.completionResolve = resolveCompletion;

        if (options.finalizer === false) {
            this.finalizer = undefined;
        } else {
            const callback = (token: RpcFinalizerToken): void => {
                this.queueFinalizer(token);
            };
            this.finalizer = options.finalizer?.(callback) ?? new DefaultFinalizer(callback);
        }

        this.unsubscribeChannel = channel.onMessage(message => {
            if (message.channelName === this.channelName) {
                this.receiveBatch(message.senderClientId, message.messageBody);
            }
        });
        void channel.completion?.then(completion => {
            if (this.state !== 'closed') {
                this.fail(errorFromCompletion(completion));
            }
        });
    }

    get active(): boolean {
        return this.state !== 'closed';
    }

    registerInterface(descriptor: RpcInterfaceDescriptor): void {
        this.ensureSetupState('register an interface');
        if (!Number.isSafeInteger(descriptor.typeId) || descriptor.typeId < 0) {
            throw new Error(`Invalid RPC interface type id: ${String(descriptor.typeId)}`);
        }
        if (this.descriptors.has(descriptor.typeId)) {
            throw new Error(`Duplicate RPC interface type id: ${String(descriptor.typeId)}`);
        }
        if (descriptor.proxyFactory.key.length === 0) {
            throw new Error(`RPC interface ${descriptor.idString} has an empty proxy factory key.`);
        }
        this.validateOperations(descriptor);
        this.descriptors.set(descriptor.typeId, descriptor);
    }

    private validateOperations(descriptor: RpcInterfaceDescriptor): void {
        const methodIds = new Set<number>();
        for (const method of descriptor.methods) {
            if (!Number.isSafeInteger(method.id) || method.id < 0 || methodIds.has(method.id)) {
                throw new Error(`Invalid or duplicate method id ${String(method.id)} in ${descriptor.idString}.`);
            }
            methodIds.add(method.id);
        }
        const eventIds = new Set<number>();
        for (const event of descriptor.events) {
            if (!Number.isSafeInteger(event.id) || event.id < 0 || eventIds.has(event.id)) {
                throw new Error(`Invalid or duplicate event id ${String(event.id)} in ${descriptor.idString}.`);
            }
            eventIds.add(event.id);
        }
    }

    registerService<TLocal extends object>(descriptor: RpcInterfaceDescriptor<TLocal>, implementation: TLocal): RpcObjectReference {
        this.ensureSetupState('register a service');
        if (!descriptor.constructorService) {
            throw new Error(`${descriptor.idString} is not a constructor service.`);
        }
        if (this.descriptors.get(descriptor.typeId) !== descriptor) {
            throw new Error(`${descriptor.idString} is not registered with this endpoint.`);
        }
        if (this.localServices.has(descriptor.typeId)) {
            throw new Error(`RPC service ${descriptor.idString} is already registered.`);
        }

        descriptor.brandLocal?.(implementation);
        const ref: RpcObjectReference = {
            clientId: this.clientId,
            objectId: descriptor.typeId,
            typeId: descriptor.typeId,
        };
        this.trackLocalObject(implementation, ref, descriptor.typeId);
        this.localObjects.get(ref.objectId)?.interestedClients.add(this.clientId);
        this.localServices.set(descriptor.typeId, implementation);
        const declaration: RpcDeclareRemoteServiceRequest = {
            rpcMethod: 'Request:IRpcDispatcher_DeclareRemoteService',
            rpcRequestId: this.allocateRequestId(),
            sourceClientId: this.clientId,
            ref,
        };
        this.cachedOutgoingDeclarations.push(declaration);
        return ref;
    }

    async initialize(requiredServiceTypeIds: readonly number[] = []): Promise<void> {
        if (this.state !== 'created') {
            throw new Error('The RPC endpoint can only be initialized once.');
        }
        this.validateDescriptorGraph();
        this.state = 'initializing';
        try {
            const serverClientId = await this.loginPromise;
            if (!this.active) {
                throw new RpcEndpointClosedError();
            }
            this.serverClientId = serverClientId;
            for (const declaration of this.cachedIncomingDeclarations.splice(0)) {
                this.processServiceDeclaration(declaration.senderClientId, declaration.request);
            }
            this.state = 'active';
            for (const declaration of this.cachedOutgoingDeclarations.splice(0)) {
                await this.sendToBroker(declaration);
            }
            await Promise.all(requiredServiceTypeIds.map(typeId => this.requestService(typeId)));
        } catch (error) {
            const normalized = normalizeError(error);
            this.fail(normalized);
            throw normalized;
        }
    }

    private validateDescriptorGraph(): void {
        for (const descriptor of this.descriptors.values()) {
            const visited = new Set<number>();
            const visiting = new Set<number>();
            const visit = (typeId: number): void => {
                if (visited.has(typeId)) {
                    return;
                }
                if (visiting.has(typeId)) {
                    throw new Error(`RPC inheritance cycle at type id ${String(typeId)}.`);
                }
                const current = this.descriptors.get(typeId);
                if (current === undefined) {
                    throw new Error(`RPC interface ${descriptor.idString} has unresolved base type id ${String(typeId)}.`);
                }
                visiting.add(typeId);
                for (const baseTypeId of current.baseTypeIds) {
                    visit(baseTypeId);
                }
                visiting.delete(typeId);
                visited.add(typeId);
            };
            visit(descriptor.typeId);
        }
    }

    private ensureSetupState(action: string): void {
        if (this.state !== 'created') {
            throw new Error(`Cannot ${action} after RPC endpoint initialization begins.`);
        }
    }

    private ensureActive(): void {
        if (this.state !== 'active') {
            throw new RpcEndpointClosedError(this.state === 'closed'
                ? 'The RPC endpoint is closed.'
                : 'The RPC endpoint is not initialized.');
        }
    }

    private allocateRequestId(): number {
        if (this.nextRequestId >= Number.MAX_SAFE_INTEGER) {
            throw new RpcProtocolError('RPC request id space is exhausted.');
        }
        return ++this.nextRequestId;
    }

    private receiveBatch(senderClientIdValue: number, messageBody: string): void {
        if (this.state === 'closed') {
            return;
        }
        let values: unknown[];
        try {
            const senderClientId = expectPositiveClientId(senderClientIdValue, 'RPC transport sender client id');
            values = expectArray(JSON.parse(messageBody) as unknown, 'RPC JSON package');
            for (const value of values) {
                void this.dispatchMessage(senderClientId, value).catch(error => {
                    this.fail(normalizeError(error));
                });
            }
        } catch (error) {
            this.fail(normalizeError(error));
        }
    }

    private async dispatchMessage(senderClientId: number, value: unknown): Promise<void> {
        const object = expectRecord(value, 'RPC message');
        if (object.rpcChannelingSystem !== undefined) {
            this.processChannelingMessage(senderClientId, object);
            return;
        }
        const method = expectString(object.rpcMethod, 'RPC method');
        if (method === 'Request:IRpcDispatcher_DeclareRemoteService') {
            const request = this.readServiceDeclaration(object);
            if (this.state === 'created' || this.state === 'initializing') {
                this.cachedIncomingDeclarations.push({ senderClientId, request });
            } else if (this.state === 'active') {
                this.processServiceDeclaration(senderClientId, request);
            } else {
                throw new RpcEndpointClosedError();
            }
            return;
        }
        if (methodIsResponse(method)) {
            this.processResponse(senderClientId, object);
            return;
        }
        if (!methodIsRequest(method)) {
            throw new RpcProtocolError(`Unknown RPC method: ${method}`);
        }
        if (this.state !== 'active') {
            throw new RpcProtocolError('Only service declarations are accepted before endpoint initialization.');
        }
        if (method === 'Request:IObjectEventOps_InvokeEvent') {
            await this.processEventRequest(senderClientId, object);
        } else {
            await this.processDirectRequest(senderClientId, object);
        }
    }

    private processChannelingMessage(senderClientId: number, object: Record<string, unknown>): void {
        const system = expectString(object.rpcChannelingSystem, 'RPC channeling system method');
        if (system === 'Login') {
            assertExactKeys(object, ['rpcChannelingSystem', 'serverClientId'], 'RPC Login');
            const serverClientId = expectPositiveClientId(object.serverClientId, 'RPC broker client id');
            if (senderClientId !== serverClientId) {
                throw new RpcProtocolError('RPC Login sender does not match serverClientId.');
            }
            if (this.serverClientId !== undefined && this.serverClientId !== serverClientId) {
                throw new RpcProtocolError('The RPC endpoint received conflicting Login messages.');
            }
            this.serverClientId = serverClientId;
            this.resolveLogin(serverClientId);
            return;
        }
        if (system === 'Logout') {
            assertExactKeys(object, ['rpcChannelingSystem'], 'RPC Logout');
            if (this.serverClientId !== undefined && senderClientId !== this.serverClientId) {
                throw new RpcProtocolError('RPC Logout came from a non-broker client.');
            }
            throw new RpcEndpointClosedError('The RPC broker logged out.');
        }
        throw new RpcProtocolError(`Unknown RPC channeling system method: ${system}`);
    }

    private readMessageBase(object: Record<string, unknown>): {
        rpcRequestId: number;
        sourceClientId: number;
    } {
        return {
            rpcRequestId: expectSafeInteger(object.rpcRequestId, 'RPC request id'),
            sourceClientId: expectPositiveClientId(object.sourceClientId, 'RPC source client id'),
        };
    }

    private readDirectBase(senderClientId: number, object: Record<string, unknown>): {
        rpcRequestId: number;
        sourceClientId: number;
        targetClientId: number;
    } {
        const base = this.readMessageBase(object);
        const targetClientId = expectPositiveClientId(object.targetClientId, 'RPC target client id');
        if (base.sourceClientId !== senderClientId) {
            throw new RpcProtocolError('RPC direct message source does not match its transport sender.');
        }
        if (targetClientId !== this.clientId) {
            throw new RpcProtocolError('RPC direct message targets another endpoint.');
        }
        return { ...base, targetClientId };
    }

    private readServiceDeclaration(object: Record<string, unknown>): RpcDeclareRemoteServiceRequest {
        assertExactKeys(object, ['rpcMethod', 'rpcRequestId', 'sourceClientId', 'ref'], 'RPC service declaration');
        const base = this.readMessageBase(object);
        const ref = readReference(object.ref, 'RPC service reference');
        validateReferenceOrNull(ref);
        if (ref.clientId !== base.sourceClientId || ref.objectId !== ref.typeId || ref.typeId < 0) {
            throw new RpcProtocolError('RPC service declaration contains an invalid reference.');
        }
        return {
            rpcMethod: 'Request:IRpcDispatcher_DeclareRemoteService',
            ...base,
            ref,
        };
    }

    private processServiceDeclaration(senderClientId: number, request: RpcDeclareRemoteServiceRequest): void {
        if (this.serverClientId === undefined || senderClientId !== this.serverClientId) {
            throw new RpcProtocolError('RPC service declaration did not come from the broker.');
        }
        this.remoteServices.set(request.ref.typeId, request.ref);
        const waiters = this.serviceWaiters.get(request.ref.typeId);
        if (waiters !== undefined) {
            this.serviceWaiters.delete(request.ref.typeId);
            void this.referenceToObject(request.ref).then(value => {
                if (value === null) {
                    throw new RpcProtocolError('A service declaration resolved to null.');
                }
                for (const waiter of waiters) {
                    waiter.resolve(value);
                }
            }).catch(error => {
                for (const waiter of waiters) {
                    waiter.reject(normalizeError(error));
                }
            });
        }
    }

    private processResponse(senderClientId: number, object: Record<string, unknown>): void {
        const method = expectString(object.rpcMethod, 'RPC response method') as RpcResponse['rpcMethod'];
        const base = this.readDirectBase(senderClientId, object);
        const pending = this.pendingRequests.get(base.rpcRequestId);
        if (pending === undefined) {
            throw new RpcProtocolError(`RPC response has no pending request: ${String(base.rpcRequestId)}`);
        }
        if (pending.expectedMethod !== method || pending.targetClientId !== senderClientId) {
            throw new RpcProtocolError('RPC response does not match its pending request.');
        }

        let response: RpcResponse;
        if (method === 'Response:IObjectOps_InvokeMethod') {
            assertExactKeys(object, ['rpcMethod', 'rpcRequestId', 'sourceClientId', 'targetClientId', 'response'], 'InvokeMethod response');
            response = { rpcMethod: method, ...base, response: asJsonValue(object.response, 'InvokeMethod response value') };
        } else if (method === 'Response:Broadcast_Response') {
            assertExactKeys(object, ['rpcMethod', 'rpcRequestId', 'sourceClientId', 'targetClientId', 'response'], 'Broadcast response');
            response = { rpcMethod: method, ...base, response: this.readEventExceptions(object.response) };
        } else if (method === 'Response:IObjectOps_EndInvokeMethod') {
            assertExactKeys(object, ['rpcMethod', 'rpcRequestId', 'sourceClientId', 'targetClientId'], 'EndInvokeMethod response');
            response = { rpcMethod: method, ...base };
        } else if (method === 'Response:IObjectOps_ObjectHold') {
            assertExactKeys(object, ['rpcMethod', 'rpcRequestId', 'sourceClientId', 'targetClientId'], 'ObjectHold response');
            response = { rpcMethod: method, ...base };
        } else {
            throw new RpcProtocolError(`Unknown RPC response method: ${method}`);
        }
        this.pendingRequests.delete(base.rpcRequestId);
        pending.resolve(response);
    }

    private readEventExceptions(value: unknown): RpcEventExceptionMap {
        if (value === null) {
            return null;
        }
        const result: [number, { message: string }][] = [];
        for (const item of expectArray(value, 'RPC event exception map')) {
            const pair = expectArray(item, 'RPC event exception pair');
            if (pair.length !== 2) {
                throw new RpcProtocolError('RPC event exception pair must contain two values.');
            }
            const exception = expectRecord(pair[1], 'RPC event exception');
            assertExactKeys(exception, ['message'], 'RPC event exception');
            result.push([
                expectPositiveClientId(pair[0], 'RPC event exception client id'),
                { message: expectString(exception.message, 'RPC event exception message') },
            ]);
        }
        return result;
    }

    private async processDirectRequest(senderClientId: number, object: Record<string, unknown>): Promise<void> {
        const method = expectString(object.rpcMethod, 'RPC request method');
        const base = this.readDirectBase(senderClientId, object);
        let response: RpcResponse;
        let holdNotification: RpcLocalHoldNotification | undefined;

        if (method === 'Request:IObjectOps_InvokeMethod') {
            assertExactKeys(object, ['rpcMethod', 'rpcRequestId', 'sourceClientId', 'targetClientId', 'ref', 'methodId', 'arguments'], 'InvokeMethod request');
            const ref = readReference(object.ref);
            const methodId = expectSafeInteger(object.methodId, 'RPC method id');
            const arguments_ = expectArray(object.arguments, 'RPC method arguments').map((value, index) => asJsonValue(value, `RPC argument ${String(index)}`));
            const result = await this.invokeLocal(ref, methodId, arguments_);
            response = {
                rpcMethod: 'Response:IObjectOps_InvokeMethod',
                ...this.reverse(base),
                response: result,
            };
        } else if (method === 'Request:IObjectOps_EndInvokeMethod') {
            assertExactKeys(object, ['rpcMethod', 'rpcRequestId', 'sourceClientId', 'targetClientId', 'slot'], 'EndInvokeMethod request');
            const slot = expectSafeInteger(object.slot, 'RPC by-value slot');
            this.byValueSlots.delete(slot);
            response = {
                rpcMethod: 'Response:IObjectOps_EndInvokeMethod',
                ...this.reverse(base),
            };
        } else if (method === 'Request:IObjectOps_ObjectHold') {
            assertExactKeys(object, ['rpcMethod', 'rpcRequestId', 'sourceClientId', 'targetClientId', 'ref', 'remoteClientId', 'hold'], 'ObjectHold request');
            const ref = readReference(object.ref);
            const remoteClientId = expectPositiveClientId(object.remoteClientId, 'RPC hold remote client id');
            const hold = expectBoolean(object.hold, 'RPC hold flag');
            if (remoteClientId !== senderClientId) {
                throw new RpcProtocolError('RPC hold client does not match its sender.');
            }
            this.applyLocalHold(ref, remoteClientId, hold);
            response = {
                rpcMethod: 'Response:IObjectOps_ObjectHold',
                ...this.reverse(base),
            };
            holdNotification = { reference: ref, remoteClientId, hold };
        } else {
            throw new RpcProtocolError(`Unknown direct RPC request method: ${method}`);
        }

        await this.sendResponse(senderClientId, response);
        if (holdNotification !== undefined) {
            for (const handler of this.localHoldHandlers) {
                await handler(holdNotification);
            }
        }
    }

    private reverse(base: { rpcRequestId: number; sourceClientId: number; targetClientId: number }): {
        rpcRequestId: number;
        sourceClientId: number;
        targetClientId: number;
    } {
        return {
            rpcRequestId: base.rpcRequestId,
            sourceClientId: this.clientId,
            targetClientId: base.sourceClientId,
        };
    }

    private async processEventRequest(senderClientId: number, object: Record<string, unknown>): Promise<void> {
        assertExactKeys(object, ['rpcMethod', 'rpcRequestId', 'sourceClientId', 'ref', 'eventId', 'arguments'], 'InvokeEvent request');
        const base = this.readMessageBase(object);
        if (this.serverClientId === undefined || senderClientId !== this.serverClientId || base.sourceClientId !== this.serverClientId) {
            throw new RpcProtocolError('RPC event request did not come from the broker.');
        }
        const ref = readReference(object.ref);
        validateReferenceOrNull(ref);
        if (isNullReference(ref)) {
            throw new RpcProtocolError('Cannot invoke an event on a null reference.');
        }
        const eventId = expectSafeInteger(object.eventId, 'RPC event id');
        const arguments_ = expectArray(object.arguments, 'RPC event arguments').map((value, index) => asJsonValue(value, `RPC event argument ${String(index)}`));
        let responseValue: RpcEventExceptionMap = null;
        try {
            await this.invokeEventLocal(ref, eventId, arguments_);
        } catch (error) {
            if (error instanceof RpcProtocolError) {
                throw error;
            }
            responseValue = [[this.clientId, { message: RpcException.from(error).message }]];
        }
        const response: RpcBroadcastResponse = {
            rpcMethod: 'Response:Broadcast_Response',
            rpcRequestId: base.rpcRequestId,
            sourceClientId: this.clientId,
            targetClientId: base.sourceClientId,
            response: responseValue,
        };
        await this.sendResponse(senderClientId, response);
    }

    private async sendResponse(receiverClientId: number, response: RpcResponse): Promise<void> {
        await this.channel.sendToClient(receiverClientId, this.channelName, JSON.stringify([response]));
    }

    private async sendToBroker(request: RpcDeclareRemoteServiceRequest | RpcInvokeEventRequest): Promise<void> {
        if (this.serverClientId === undefined) {
            throw new RpcProtocolError('The RPC endpoint has not received Login.');
        }
        await this.channel.sendToClient(this.serverClientId, this.channelName, JSON.stringify([request]));
    }

    private sendRequest<TResponse extends RpcResponse>(
        targetClientId: number,
        request: RpcDirectMessage | RpcInvokeEventRequest,
        expectedMethod: TResponse['rpcMethod'],
    ): Promise<TResponse> {
        if (this.pendingRequests.has(request.rpcRequestId)) {
            return Promise.reject(new RpcProtocolError('Duplicate pending RPC request id.'));
        }
        const result = deferred<RpcResponse>();
        this.pendingRequests.set(request.rpcRequestId, {
            expectedMethod,
            targetClientId,
            resolve: result.resolve,
            reject: result.reject,
        });
        void this.channel.sendToClient(targetClientId, this.channelName, JSON.stringify([request])).catch(error => {
            const pending = this.pendingRequests.get(request.rpcRequestId);
            if (pending !== undefined) {
                this.pendingRequests.delete(request.rpcRequestId);
                pending.reject(normalizeError(error));
            }
            this.fail(normalizeError(error));
        });
        return result.promise as Promise<TResponse>;
    }

    private findMethod(typeId: number, methodId: number): RpcMethodDescriptor {
        const result = this.findOperation(typeId, descriptor => descriptor.methods.find(method => method.id === methodId));
        if (result === undefined) {
            throw new RpcProtocolError(`Unknown RPC method id ${String(methodId)} for type ${String(typeId)}.`);
        }
        return result;
    }

    private findEvent(typeId: number, eventId: number): RpcEventDescriptor {
        const result = this.findOperation(typeId, descriptor => descriptor.events.find(event => event.id === eventId));
        if (result === undefined) {
            throw new RpcProtocolError(`Unknown RPC event id ${String(eventId)} for type ${String(typeId)}.`);
        }
        return result;
    }

    private findOperation<T>(typeId: number, find: (descriptor: RpcInterfaceDescriptor) => T | undefined): T | undefined {
        const descriptor = this.descriptors.get(typeId);
        if (descriptor === undefined) {
            throw new RpcProtocolError(`Unknown RPC interface type id: ${String(typeId)}`);
        }
        const direct = find(descriptor);
        if (direct !== undefined) {
            return direct;
        }
        for (const baseTypeId of descriptor.baseTypeIds) {
            const inherited = this.findOperation(baseTypeId, find);
            if (inherited !== undefined) {
                return inherited;
            }
        }
        return undefined;
    }

    private isTypeCompatible(actualTypeId: number, viewTypeId: number): boolean {
        if (actualTypeId === viewTypeId) {
            return true;
        }
        const descriptor = this.descriptors.get(actualTypeId);
        return descriptor !== undefined && descriptor.baseTypeIds.some(baseTypeId => this.isTypeCompatible(baseTypeId, viewTypeId));
    }

    private validateLocalReference(ref: RpcObjectReference): LocalObjectRecord {
        validateReferenceOrNull(ref);
        if (ref.clientId !== this.clientId) {
            throw new RpcProtocolError('RPC target reference is not local.');
        }
        const record = this.localObjects.get(ref.objectId);
        if (record === undefined) {
            throw new RpcProtocolError(`Unknown local RPC object id: ${String(ref.objectId)}`);
        }
        if (record.ref.typeId >= 0 && !this.isTypeCompatible(record.declaredTypeId, ref.typeId)) {
            throw new RpcProtocolError('RPC target reference has an incompatible interface type.');
        }
        if (record.ref.typeId < 0 && record.ref.typeId !== ref.typeId) {
            throw new RpcProtocolError('RPC target reference has an incompatible predefined type.');
        }
        return record;
    }

    private async invokeLocal(ref: RpcObjectReference, methodId: number, arguments_: readonly RpcJsonValue[]): Promise<RpcJsonValue | RpcByvalReturnValue> {
        const record = this.validateLocalReference(ref);
        if (ref.typeId < 0) {
            try {
                return await invokePredefinedLocal(record.value, this, methodId, arguments_);
            } catch (error) {
                if (error instanceof RpcProtocolError) throw error;
                return RpcException.from(error).toJSON();
            }
        }
        const method = this.findMethod(ref.typeId, methodId);
        if (arguments_.length !== method.parameters.length) {
            throw new RpcProtocolError(`${method.idString} received an invalid argument count.`);
        }
        const decoded: unknown[] = [];
        for (let index = 0; index < method.parameters.length; index++) {
            decoded.push(await this.decodeUse(method.parameters[index], arguments_[index]));
        }
        const callable = (record.value as Record<string, unknown>)[method.implementationKey];
        if (typeof callable !== 'function') {
            throw new RpcProtocolError(`${method.idString} has no local implementation.`);
        }
        let result: unknown;
        try {
            result = await callable.apply(record.value, decoded);
        } catch (error) {
            if (error instanceof RpcProtocolError) throw error;
            return RpcException.from(error).toJSON();
        }
        return await this.encodeResult(method.result, result);
    }

    private async invokeEventLocal(ref: RpcObjectReference, eventId: number, arguments_: readonly RpcJsonValue[]): Promise<void> {
        let event: RpcEventDescriptor | undefined;
        if (ref.typeId < 0) {
            if (ref.typeId !== RpcTypeId_IValueObservableList
                || eventId !== RpcEventId_IValueObservableList_ItemChanged
                || arguments_.length !== 3) {
                throw new RpcProtocolError('Unknown predefined RPC event.');
            }
            for (let index = 0; index < arguments_.length; index++) {
                const argument = expectArray(arguments_[index], `Observable-list event argument ${String(index)}`);
                if (argument.length !== 2 || argument[0] !== 'Int32') {
                    throw new RpcProtocolError(`Observable-list event argument ${String(index)} must be an unknown Int32.`);
                }
                expectSafeInteger(argument[1], `Observable-list event argument ${String(index)}`);
            }
        } else {
            event = this.findEvent(ref.typeId, eventId);
            if (arguments_.length !== event.parameters.length) {
                throw new RpcProtocolError(`${event.idString} received an invalid argument count.`);
            }
        }
        let target: object;
        if (ref.clientId === this.clientId) {
            target = this.validateLocalReference(ref).value;
        } else {
            const key = referenceKey(ref);
            const view = this.proxyViews.get(key);
            if (view === undefined) {
                return;
            }
            const resolved = view.weak.deref();
            if (resolved === undefined) {
                this.removeViewClaim(key, view);
                return;
            }
            const record = this.proxyRecords.get(resolved);
            if (record === undefined || record.disposed) {
                return;
            }
            await record.ready;
            target = resolved;
        }
        if (ref.typeId < 0) {
            await invokePredefinedLocalEvent(target, eventId, arguments_).catch(async error => {
                if (this.proxyRecords.has(target)) {
                    await invokePredefinedProxyEvent(target, eventId, arguments_);
                    return;
                }
                throw error;
            });
            return;
        }
        const decoded: unknown[] = [];
        for (let index = 0; index < event!.parameters.length; index++) {
            decoded.push(await this.decodeUse(event!.parameters[index], arguments_[index]));
        }
        const eventObject = expectRpcEvent((target as Record<string, unknown>)[event!.propertyKey], event!.idString);
        const key = this.suppressionKey(ref, eventId);
        this.suppression.set(key, (this.suppression.get(key) ?? 0) + 1);
        try {
            await eventObject.dispatchRemote(...decoded);
        } finally {
            const count = (this.suppression.get(key) ?? 1) - 1;
            if (count === 0) {
                this.suppression.delete(key);
            } else {
                this.suppression.set(key, count);
            }
        }
    }

    private async encodeUse(use: RpcValueUse, value: unknown, retained?: unknown[]): Promise<RpcJsonValue> {
        const mode: RpcTransferMode = use.transfer ?? 'value';
        if (mode === 'byValue') {
            const copy = await use.codec.copy(this, value, new Set<object>());
            retained?.push(copy);
            return await use.codec.encodeUnknown(this, copy);
        }
        return await use.codec.encodeUnknown(this, value);
    }

    private decodeUse(use: RpcValueUse, value: RpcJsonValue): unknown {
        return use.codec.decodeUnknown(this, value);
    }

    private async encodeResult(use: RpcValueUse, value: unknown): Promise<RpcJsonValue | RpcByvalReturnValue> {
        if (use.transfer !== 'byValue') {
            return await this.encodeUse(use, value);
        }
        const copy = await use.codec.copy(this, value, new Set<object>());
        const encoded = await use.codec.encodeUnknown(this, copy);
        if (this.nextSlotId >= Number.MAX_SAFE_INTEGER) {
            throw new RpcProtocolError('RPC by-value slot space is exhausted.');
        }
        const slot = ++this.nextSlotId;
        this.byValueSlots.set(slot, copy);
        return { value: encoded, slot };
    }

    private async endInvokeMethodAt(targetClientId: number, slot: number): Promise<void> {
        const request: RpcEndInvokeMethodRequest = {
            rpcMethod: 'Request:IObjectOps_EndInvokeMethod',
            rpcRequestId: this.allocateRequestId(),
            sourceClientId: this.clientId,
            targetClientId,
            slot,
        };
        await this.sendRequest<RpcEndInvokeMethodResponse>(targetClientId, request, 'Response:IObjectOps_EndInvokeMethod');
    }

    private applyLocalHold(ref: RpcObjectReference, remoteClientId: number, hold: boolean): void {
        const record = this.validateLocalReference(ref);
        if (hold) {
            record.interestedClients.add(remoteClientId);
            return;
        }
        if (!record.interestedClients.delete(remoteClientId)) {
            throw new RpcProtocolError('RPC client does not hold the local object.');
        }
        if (record.interestedClients.size === 0) {
            this.removeLocalObject(record);
        }
    }

    private trackLocalObject(value: object, ref: RpcObjectReference, declaredTypeId: number): void {
        if (this.localObjects.has(ref.objectId)) {
            throw new Error(`Duplicate local RPC object id: ${String(ref.objectId)}`);
        }
        const global = globalLocalTrackers.get(value);
        if (global !== undefined) {
            const endpoint = global.endpoint.deref();
            if (endpoint !== undefined && endpoint.lifecycleGeneration === global.lifecycleGeneration && endpoint.state !== 'closed') {
                throw new Error('The object is already tracked by another active RPC endpoint.');
            }
        }
        const record: LocalObjectRecord = {
            ref,
            value,
            declaredTypeId,
            interestedClients: new Set<number>(),
            detach: undefined,
        };
        this.localObjects.set(ref.objectId, record);
        this.localReferences.set(value, ref);
        globalLocalTrackers.set(value, {
            endpoint: new WeakRef(this),
            lifecycleGeneration: this.lifecycleGeneration,
            ref,
        });
        if (ref.objectId > this.nextObjectId) {
            this.nextObjectId = ref.objectId;
        }
        record.detach = ref.typeId < 0
            ? attachPredefinedLocal(value, (eventId, arguments_) => this.broadcastRawEvent(ref, eventId, arguments_))
            : this.attachEvents(value, ref);
    }

    private removeLocalObject(record: LocalObjectRecord): void {
        record.detach?.();
        detachPredefinedLocal(record.value);
        this.localObjects.delete(record.ref.objectId);
        this.localReferences.delete(record.value);
        const global = globalLocalTrackers.get(record.value);
        if (global?.endpoint.deref() === this && global.lifecycleGeneration === this.lifecycleGeneration) {
            globalLocalTrackers.delete(record.value);
        }
    }

    private attachEvents(value: object, ref: RpcObjectReference): (() => void) | undefined {
        const descriptor = this.descriptors.get(ref.typeId);
        if (descriptor === undefined) {
            return undefined;
        }
        const detach: (() => void)[] = [];
        for (const eventDescriptor of this.allEvents(descriptor)) {
            const event = expectRpcEvent((value as Record<string, unknown>)[eventDescriptor.propertyKey], eventDescriptor.idString);
            event.setOutgoing(async (...arguments_: readonly unknown[]) => {
                if ((this.suppression.get(this.suppressionKey(ref, eventDescriptor.id)) ?? 0) === 0) {
                    await this.broadcastEvent(ref, eventDescriptor.id, arguments_);
                }
            });
            detach.push(() => event.setOutgoing(undefined));
        }
        return detach.length === 0 ? undefined : () => {
            for (const action of detach) {
                action();
            }
        };
    }

    private allEvents(descriptor: RpcInterfaceDescriptor): RpcEventDescriptor[] {
        const result = [...descriptor.events];
        for (const baseTypeId of descriptor.baseTypeIds) {
            const base = this.descriptors.get(baseTypeId);
            if (base !== undefined) {
                result.push(...this.allEvents(base));
            }
        }
        return result;
    }

    private suppressionKey(ref: RpcObjectReference, eventId: number): string {
        return `${referenceKey(ref)}:${String(eventId)}`;
    }

    objectToReference<T extends object>(value: T, typeId: number): RpcObjectReference {
        if (this.state === 'closed') {
            throw new RpcEndpointClosedError();
        }
        const proxyRecord = this.proxyRecords.get(value);
        if (proxyRecord !== undefined) {
            if (proxyRecord.disposed) {
                throw new RpcEndpointClosedError('The RPC proxy is disposed.');
            }
            if (proxyRecord.ref.typeId >= 0 && !this.isTypeCompatible(proxyRecord.ref.typeId, typeId)) {
                throw new RpcProtocolError('The RPC proxy has an incompatible type.');
            }
            return proxyRecord.ref.typeId === typeId ? proxyRecord.ref : { ...proxyRecord.ref, typeId };
        }
        const foreignProxy = globalProxyTrackers.get(value);
        if (foreignProxy !== undefined) {
            throw new RpcProtocolError('An RPC proxy cannot be passed into another lifecycle.');
        }
        const existing = this.localReferences.get(value);
        if (existing !== undefined) {
            if (existing.typeId < 0) {
                if (existing.typeId !== typeId) {
                    throw new RpcProtocolError('The predefined RPC object type does not match the requested type.');
                }
                return existing;
            }
            const record = this.localObjects.get(existing.objectId);
            if (record === undefined || !this.isTypeCompatible(record.declaredTypeId, typeId)) {
                throw new RpcProtocolError('The local RPC object has an incompatible type.');
            }
            return existing.typeId === typeId ? existing : { ...existing, typeId };
        }
        const predefinedTypeId = getPredefinedLocalTypeId(value);
        if (predefinedTypeId !== undefined && predefinedTypeId !== typeId) {
            throw new RpcProtocolError('The predefined RPC object type does not match the requested type.');
        }
        if (typeId >= 0 && !this.descriptors.has(typeId)) {
            throw new RpcProtocolError(`Unknown RPC interface type id: ${String(typeId)}`);
        }
        if (this.nextObjectId >= Number.MAX_SAFE_INTEGER) {
            throw new RpcProtocolError('RPC object id space is exhausted.');
        }
        const ref: RpcObjectReference = {
            clientId: this.clientId,
            objectId: ++this.nextObjectId,
            typeId,
        };
        this.trackLocalObject(value, ref, typeId);
        return ref;
    }

    async referenceToObject<T extends object>(ref: RpcObjectReference, factory?: RpcReferenceFactory<T>): Promise<T | null> {
        if (this.state === 'closed') {
            throw new RpcEndpointClosedError();
        }
        validateReferenceOrNull(ref);
        if (isNullReference(ref)) {
            return null;
        }
        if (ref.clientId === this.clientId) {
            return this.validateLocalReference(ref).value as T;
        }
        const key = referenceKey(ref);
        const existingView = this.proxyViews.get(key);
        if (existingView !== undefined) {
            const existing = existingView.weak.deref();
            if (existing !== undefined) {
                if (factory !== undefined && existingView.factoryKey !== factory.key) {
                    throw new RpcProtocolError('The same RPC reference was requested with incompatible proxy factories.');
                }
                const record = this.proxyRecords.get(existing);
                if (record !== undefined && !record.disposed) {
                    await record.ready;
                    return existing as T;
                }
            }
            this.removeViewClaim(key, existingView);
        }

        let selectedFactory: RpcReferenceFactory<T>;
        if (factory !== undefined) {
            selectedFactory = factory;
        } else {
            const descriptor = this.descriptors.get(ref.typeId);
            if (descriptor === undefined) {
                throw new RpcProtocolError(`No proxy factory for RPC type id: ${String(ref.typeId)}`);
            }
            selectedFactory = descriptor.proxyFactory as RpcReferenceFactory<T>;
        }

        const lease = this.getOrCreateLease(ref);
        const viewGeneration = ++this.nextViewGeneration;
        const claimId = `view:${key}:${String(viewGeneration)}`;
        lease.claims.add(claimId);
        lease.desiredHeld = true;
        const ready = this.reconcileLease(lease);
        const context: RpcProxyContext = { endpoint: this, reference: { ...ref } };
        let proxy: T;
        try {
            proxy = selectedFactory.create(context);
        } catch (error) {
            lease.claims.delete(claimId);
            lease.desiredHeld = lease.claims.size !== 0;
            try {
                await this.reconcileLease(lease);
            } catch {
                // Preserve the factory error; terminal transport errors already finalize the endpoint.
            }
            throw error;
        }
        const unregisterToken = {};
        const record: ProxyRecord = {
            ref: { ...ref },
            referenceKey: key,
            leaseKey: lease.key,
            viewGeneration,
            claimId,
            unregisterToken,
            factoryKey: selectedFactory.key,
            ready,
            detach: undefined,
            disposed: false,
        };
        this.proxyRecords.set(proxy, record);
        this.proxyViews.set(key, {
            weak: new WeakRef(proxy),
            generation: viewGeneration,
            claimId,
            factoryKey: selectedFactory.key,
        });
        globalProxyTrackers.set(proxy, {
            endpoint: new WeakRef(this),
            lifecycleGeneration: this.lifecycleGeneration,
            ref: { ...ref },
        });
        record.detach = ref.typeId < 0 ? undefined : this.attachEvents(proxy, ref);
        this.finalizer?.register(proxy, {
            lifecycleGeneration: this.lifecycleGeneration,
            referenceKey: key,
            leaseKey: lease.key,
            viewGeneration,
            claimId,
        }, unregisterToken);
        try {
            await ready;
        } catch (error) {
            try {
                await this.disposeProxy(proxy);
            } catch {
                // Preserve the hold error; terminal transport errors already finalize the endpoint.
            }
            throw error;
        }
        return proxy;
    }

    private getOrCreateLease(ref: RpcObjectReference): RemoteLease {
        const key = leaseKey(ref);
        let lease = this.remoteLeases.get(key);
        if (lease === undefined) {
            lease = {
                key,
                refForHold: { ...ref },
                claims: new Set<string>(),
                desiredHeld: false,
                acknowledgedHeld: false,
                closed: false,
                transition: Promise.resolve(),
            };
            this.remoteLeases.set(key, lease);
        }
        return lease;
    }

    private reconcileLease(lease: RemoteLease): Promise<void> {
        const transition = lease.transition
            .catch(() => undefined)
            .then(async () => {
                while (!lease.closed && lease.desiredHeld !== lease.acknowledgedHeld) {
                    const requested = lease.desiredHeld;
                    await this.sendObjectHold(lease.refForHold, requested);
                    lease.acknowledgedHeld = requested;
                }
                this.removeLeaseIfQuiescent(lease);
            });
        lease.transition = transition;
        void transition.catch(error => {
            this.fail(normalizeError(error));
        });
        return transition;
    }

    private async sendObjectHold(ref: RpcObjectReference, hold: boolean): Promise<void> {
        const request: RpcObjectHoldRequest = {
            rpcMethod: 'Request:IObjectOps_ObjectHold',
            rpcRequestId: this.allocateRequestId(),
            sourceClientId: this.clientId,
            targetClientId: ref.clientId,
            ref,
            remoteClientId: this.clientId,
            hold,
        };
        await this.sendRequest<RpcObjectHoldResponse>(ref.clientId, request, 'Response:IObjectOps_ObjectHold');
    }

    private removeLeaseIfQuiescent(lease: RemoteLease): void {
        if (!lease.closed && lease.claims.size === 0 && !lease.acknowledgedHeld && !lease.desiredHeld) {
            this.remoteLeases.delete(lease.key);
        }
    }

    private removeViewClaim(key: string, view: ProxyView): void {
        if (this.proxyViews.get(key)?.generation === view.generation) {
            this.proxyViews.delete(key);
        }
        const lease = this.remoteLeases.get(key.substring(0, key.lastIndexOf(':')));
        if (lease !== undefined) {
            lease.claims.delete(view.claimId);
            lease.desiredHeld = lease.claims.size !== 0;
            void this.reconcileLease(lease);
        }
    }

    private queueFinalizer(token: RpcFinalizerToken): void {
        this.cleanupScheduler.schedule(async () => {
            await this.finalizeProxyToken(token);
        });
    }

    async finalizeProxyToken(token: RpcFinalizerToken): Promise<void> {
        if (this.state === 'closed' || token.lifecycleGeneration !== this.lifecycleGeneration) {
            return;
        }
        const view = this.proxyViews.get(token.referenceKey);
        if (view === undefined || view.generation !== token.viewGeneration || view.claimId !== token.claimId) {
            return;
        }
        this.proxyViews.delete(token.referenceKey);
        const lease = this.remoteLeases.get(token.leaseKey);
        if (lease !== undefined) {
            lease.claims.delete(token.claimId);
            lease.desiredHeld = lease.claims.size !== 0;
            await this.reconcileLease(lease);
        }
    }

    async disposeProxy(proxy: object): Promise<void> {
        const record = this.proxyRecords.get(proxy);
        if (record === undefined || record.disposed) {
            return;
        }
        record.disposed = true;
        record.detach?.();
        this.finalizer?.unregister(record.unregisterToken);
        globalProxyTrackers.delete(proxy);
        const view = this.proxyViews.get(record.referenceKey);
        if (view?.generation === record.viewGeneration) {
            this.proxyViews.delete(record.referenceKey);
        }
        const lease = this.remoteLeases.get(record.leaseKey);
        if (lease !== undefined) {
            lease.claims.delete(record.claimId);
            lease.desiredHeld = lease.claims.size !== 0;
            await this.reconcileLease(lease);
        }
    }

    isProxyDisposed(proxy: object): boolean {
        const record = this.proxyRecords.get(proxy);
        return record === undefined || record.disposed || this.state === 'closed';
    }

    async invokeProxy(proxy: object, methodId: number, arguments_: readonly unknown[]): Promise<unknown> {
        this.ensureActive();
        const record = this.proxyRecords.get(proxy);
        if (record === undefined || record.disposed) {
            throw new RpcEndpointClosedError('The RPC proxy is disposed.');
        }
        const method = record.ref.typeId < 0
            ? getPredefinedProxyMethod(proxy, methodId)
            : this.findMethod(record.ref.typeId, methodId);
        if (method === undefined) {
            throw new RpcProtocolError(`Unknown predefined RPC method id: ${String(methodId)}`);
        }
        if (arguments_.length !== method.parameters.length) {
            throw new RpcProtocolError(`${method.idString} received an invalid argument count.`);
        }
        const lease = this.remoteLeases.get(record.leaseKey);
        if (lease === undefined) {
            throw new RpcEndpointClosedError('The RPC proxy lease is unavailable.');
        }
        const callClaim = `call:${String(++this.nextCallClaim)}`;
        lease.claims.add(callClaim);
        lease.desiredHeld = true;
        await this.reconcileLease(lease);
        try {
            const encoded: RpcJsonValue[] = [];
            const retainedArguments: unknown[] = [];
            for (let index = 0; index < method.parameters.length; index++) {
                encoded.push(await this.encodeUse(method.parameters[index], arguments_[index], retainedArguments));
            }
            const request: RpcInvokeMethodRequest = {
                rpcMethod: 'Request:IObjectOps_InvokeMethod',
                rpcRequestId: this.allocateRequestId(),
                sourceClientId: this.clientId,
                targetClientId: record.ref.clientId,
                ref: record.ref,
                methodId,
                arguments: encoded,
            };
            const response = await this.sendRequest<RpcInvokeMethodResponse>(
                record.ref.clientId,
                request,
                'Response:IObjectOps_InvokeMethod',
            );
            // Keep by-value copies (and any relayed proxy holds reachable from them) alive until the callee responds.
            void retainedArguments.length;
            const exception = readTaggedException(response.response as RpcJsonValue);
            if (exception !== undefined) {
                throw new RpcRemoteException(exception.message);
            }
            if (method.result.transfer === 'byValue') {
                const wrapper = expectRecord(response.response, 'RPC by-value return');
                assertExactKeys(wrapper, ['value', 'slot'], 'RPC by-value return');
                const slot = expectSafeInteger(wrapper.slot, 'RPC by-value return slot');
                const encodedResult = asJsonValue(wrapper.value, 'RPC by-value return value');
                try {
                    return await method.result.codec.decodeUnknown(this, encodedResult);
                } finally {
                    await this.endInvokeMethodAt(record.ref.clientId, slot);
                }
            }
            return await method.result.codec.decodeUnknown(this, response.response as RpcJsonValue);
        } finally {
            lease.claims.delete(callClaim);
            lease.desiredHeld = lease.claims.size !== 0;
            await this.reconcileLease(lease);
        }
    }

    async raiseProxyEvent(proxy: object, eventId: number, arguments_: readonly unknown[]): Promise<void> {
        this.ensureActive();
        const record = this.proxyRecords.get(proxy);
        if (record === undefined || record.disposed) {
            throw new RpcEndpointClosedError('The RPC proxy is disposed.');
        }
        if (record.ref.typeId < 0) {
            if (eventId !== -1 || arguments_.length !== 3) {
                throw new RpcProtocolError('Unknown predefined RPC event.');
            }
            await this.broadcastRawEvent(record.ref, eventId, arguments_.map((value, index) => {
                if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
                    throw new RpcProtocolError(`Observable-list event argument ${String(index)} must be a safe integer.`);
                }
                return ['Int32', value];
            }));
            return;
        }
        await this.broadcastEvent(record.ref, eventId, arguments_);
    }

    private async broadcastEvent(ref: RpcObjectReference, eventId: number, arguments_: readonly unknown[]): Promise<void> {
        const event = this.findEvent(ref.typeId, eventId);
        if (arguments_.length !== event.parameters.length) {
            throw new RpcProtocolError(`${event.idString} received an invalid argument count.`);
        }
        const encoded: RpcJsonValue[] = [];
        const retainedArguments: unknown[] = [];
        for (let index = 0; index < event.parameters.length; index++) {
            encoded.push(await this.encodeUse(event.parameters[index], arguments_[index], retainedArguments));
        }
        await this.broadcastRawEvent(ref, eventId, encoded);
        // Event receivers establish their own holds before the broadcast response releases these copies.
        void retainedArguments.length;
    }

    private async broadcastRawEvent(ref: RpcObjectReference, eventId: number, arguments_: RpcJsonValue[]): Promise<void> {
        if (this.serverClientId === undefined) {
            throw new RpcProtocolError('The RPC endpoint has not received Login.');
        }
        const request: RpcInvokeEventRequest = {
            rpcMethod: 'Request:IObjectEventOps_InvokeEvent',
            rpcRequestId: this.allocateRequestId(),
            sourceClientId: this.clientId,
            ref,
            eventId,
            arguments: arguments_,
        };
        const response = await this.sendRequest<RpcBroadcastResponse>(
            this.serverClientId,
            request,
            'Response:Broadcast_Response',
        );
        if (response.response !== null && response.response.length > 0) {
            throw new RpcEventBroadcastError(response.response);
        }
    }

    async requestService<T extends object>(typeId: number): Promise<T> {
        if (this.state === 'closed') {
            throw new RpcEndpointClosedError();
        }
        const local = this.localServices.get(typeId);
        if (local !== undefined) {
            return local as T;
        }
        const remote = this.remoteServices.get(typeId);
        if (remote !== undefined) {
            const value = await this.referenceToObject<T>(remote);
            if (value === null) {
                throw new RpcProtocolError('A remote service resolved to null.');
            }
            return value;
        }
        const waiter = deferred<object>();
        let waiters = this.serviceWaiters.get(typeId);
        if (waiters === undefined) {
            waiters = new Set<ServiceWaiter>();
            this.serviceWaiters.set(typeId, waiters);
        }
        waiters.add({ resolve: waiter.resolve, reject: waiter.reject });
        return await waiter.promise as T;
    }

    onLocalObjectHold(handler: (notification: RpcLocalHoldNotification) => void | Promise<void>): () => void {
        this.localHoldHandlers.add(handler);
        return () => {
            this.localHoldHandlers.delete(handler);
        };
    }

    getDebugState(): RpcEndpointDebugState {
        let waiterCount = 0;
        for (const waiters of this.serviceWaiters.values()) {
            waiterCount += waiters.size;
        }
        return {
            active: this.state !== 'closed',
            pendingRequests: this.pendingRequests.size,
            serviceWaiters: waiterCount,
            localObjects: this.localObjects.size,
            remoteViews: this.proxyViews.size,
            remoteLeases: this.remoteLeases.size,
            byValueSlots: this.byValueSlots.size,
            suppressionEntries: this.suppression.size,
        };
    }

    finalize(error?: Error): void {
        if (this.state === 'closed') {
            return;
        }
        this.state = 'closed';
        const previousGeneration = this.lifecycleGeneration;
        this.lifecycleGeneration++;
        const reason = error ?? new RpcEndpointClosedError();
        this.rejectLogin(reason);
        for (const pending of this.pendingRequests.values()) {
            pending.reject(reason);
        }
        this.pendingRequests.clear();
        for (const waiters of this.serviceWaiters.values()) {
            for (const waiter of waiters) {
                waiter.reject(reason);
            }
        }
        this.serviceWaiters.clear();
        for (const view of this.proxyViews.values()) {
            const proxy = view.weak.deref();
            if (proxy !== undefined) {
                const record = this.proxyRecords.get(proxy);
                if (record !== undefined) {
                    record.disposed = true;
                    record.detach?.();
                    this.finalizer?.unregister(record.unregisterToken);
                    if (proxy instanceof RpcProxy) {
                        proxy.finalizeLocalState();
                    }
                    const global = globalProxyTrackers.get(proxy);
                    if (global?.endpoint.deref() === this && global.lifecycleGeneration === previousGeneration) {
                        globalProxyTrackers.delete(proxy);
                    }
                }
            }
        }
        this.proxyViews.clear();
        for (const lease of this.remoteLeases.values()) {
            lease.closed = true;
            lease.claims.clear();
        }
        this.remoteLeases.clear();
        for (const record of [...this.localObjects.values()]) {
            this.removeLocalObject(record);
        }
        this.localServices.clear();
        this.remoteServices.clear();
        this.cachedIncomingDeclarations.length = 0;
        this.cachedOutgoingDeclarations.length = 0;
        this.byValueSlots.clear();
        this.suppression.clear();
        this.localHoldHandlers.clear();
        this.unsubscribeChannel();
        if (!this.completed) {
            this.completed = true;
            this.completionResolve(error === undefined ? { type: 'stopped' } : { type: 'failed', error });
        }
    }

    private fail(error: Error): void {
        this.finalize(error);
    }
}

export function createRpcEndpoint(channel: RpcChannelClient, options?: RpcEndpointOptions): RpcEndpoint {
    return new RpcEndpoint(channel, options);
}
