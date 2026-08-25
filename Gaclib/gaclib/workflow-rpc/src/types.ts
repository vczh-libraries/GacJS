export const WORKFLOW_RPC_FORMAT_VERSION = 1;
export const DEFAULT_RPC_CHANNEL_NAME = 'ViewModelChannel';

export const RpcTypeId_IValueEnumerable = -1;
export const RpcTypeId_IValueEnumerator = -2;
export const RpcTypeId_IValueArray = -3;
export const RpcTypeId_IValueList = -4;
export const RpcTypeId_IValueObservableList = -5;
export const RpcTypeId_IValueDictionary = -6;
export const RpcTypeId_IValueReadonlyList = -7;
export const RpcTypeId_Null = -100;

export const RpcMethodId_IValueEnumerable_CreateEnumerator = -1;
export const RpcMethodId_IValueEnumerator_Next = -2;
export const RpcMethodId_IValueEnumerator_GetCurrent = -3;
export const RpcMethodId_IValueReadonlyList_GetCount = -4;
export const RpcMethodId_IValueReadonlyList_Get = -5;
export const RpcMethodId_IValueList_Set = -6;
export const RpcMethodId_IValueList_Add = -7;
export const RpcMethodId_IValueList_Insert = -8;
export const RpcMethodId_IValueList_RemoveAt = -9;
export const RpcMethodId_IValueList_Clear = -10;
export const RpcMethodId_IValueReadonlyList_Contains = -11;
export const RpcMethodId_IValueReadonlyList_IndexOf = -12;
export const RpcMethodId_IValueReadonlyDictionary_GetCount = -13;
export const RpcMethodId_IValueReadonlyDictionary_Get = -14;
export const RpcMethodId_IValueDictionary_Set = -15;
export const RpcMethodId_IValueDictionary_Remove = -16;
export const RpcMethodId_IValueDictionary_Clear = -17;
export const RpcMethodId_IValueReadonlyDictionary_ContainsKey = -18;
export const RpcMethodId_IValueReadonlyDictionary_GetKeys = -19;
export const RpcMethodId_IValueReadonlyDictionary_GetValues = -20;
export const RpcMethodId_IValueArray_Resize = -21;

export const RpcEventId_IValueObservableList_ItemChanged = -1;

export type RpcJsonPrimitive = null | boolean | number | string;
export type RpcJsonValue = RpcJsonPrimitive | RpcJsonValue[] | { [key: string]: RpcJsonValue };

export interface RpcObjectReference {
    [key: string]: RpcJsonValue;
    clientId: number;
    objectId: number;
    typeId: number;
}

export const NULL_RPC_REFERENCE: Readonly<RpcObjectReference> = Object.freeze({
    clientId: -1,
    objectId: -1,
    typeId: RpcTypeId_Null,
});

export interface RpcWireException {
    [key: string]: RpcJsonValue;
    message: string;
}

export interface RpcTaggedReference extends RpcObjectReference {
    '$': 'system::RpcObjectReference';
}

export interface RpcTaggedException extends RpcWireException {
    '$': 'system::RpcException';
}

export interface RpcByvalReturnValue<T extends RpcJsonValue = RpcJsonValue> {
    [key: string]: RpcJsonValue;
    value: T;
    slot: number;
}

export type RpcEventExceptionMap = null | [number, RpcWireException][];

export type RpcMethodName =
    | 'Request:IObjectOps_InvokeMethod'
    | 'Response:IObjectOps_InvokeMethod'
    | 'Request:IObjectOps_EndInvokeMethod'
    | 'Response:IObjectOps_EndInvokeMethod'
    | 'Request:IObjectOps_ObjectHold'
    | 'Response:IObjectOps_ObjectHold'
    | 'Request:IObjectEventOps_InvokeEvent'
    | 'Request:IRpcDispatcher_DeclareRemoteService'
    | 'Response:Broadcast_Response';

export interface RpcMessageBase {
    rpcMethod: RpcMethodName;
    rpcRequestId: number;
    sourceClientId: number;
}

export interface RpcDirectMessage extends RpcMessageBase {
    targetClientId: number;
}

export interface RpcInvokeMethodRequest extends RpcDirectMessage {
    rpcMethod: 'Request:IObjectOps_InvokeMethod';
    ref: RpcObjectReference;
    methodId: number;
    arguments: RpcJsonValue[];
}

export interface RpcInvokeMethodResponse extends RpcDirectMessage {
    rpcMethod: 'Response:IObjectOps_InvokeMethod';
    response: RpcJsonValue | RpcByvalReturnValue;
}

export interface RpcEndInvokeMethodRequest extends RpcDirectMessage {
    rpcMethod: 'Request:IObjectOps_EndInvokeMethod';
    slot: number;
}

export interface RpcEndInvokeMethodResponse extends RpcDirectMessage {
    rpcMethod: 'Response:IObjectOps_EndInvokeMethod';
}

export interface RpcObjectHoldRequest extends RpcDirectMessage {
    rpcMethod: 'Request:IObjectOps_ObjectHold';
    ref: RpcObjectReference;
    remoteClientId: number;
    hold: boolean;
}

export interface RpcObjectHoldResponse extends RpcDirectMessage {
    rpcMethod: 'Response:IObjectOps_ObjectHold';
}

export interface RpcInvokeEventRequest extends RpcMessageBase {
    rpcMethod: 'Request:IObjectEventOps_InvokeEvent';
    ref: RpcObjectReference;
    eventId: number;
    arguments: RpcJsonValue[];
}

export interface RpcDeclareRemoteServiceRequest extends RpcMessageBase {
    rpcMethod: 'Request:IRpcDispatcher_DeclareRemoteService';
    ref: RpcObjectReference;
}

export interface RpcBroadcastResponse extends RpcDirectMessage {
    rpcMethod: 'Response:Broadcast_Response';
    response: RpcEventExceptionMap;
}

export type RpcRequest =
    | RpcInvokeMethodRequest
    | RpcEndInvokeMethodRequest
    | RpcObjectHoldRequest
    | RpcInvokeEventRequest
    | RpcDeclareRemoteServiceRequest;

export type RpcResponse =
    | RpcInvokeMethodResponse
    | RpcEndInvokeMethodResponse
    | RpcObjectHoldResponse
    | RpcBroadcastResponse;

export interface RpcLoginMessage {
    rpcChannelingSystem: 'Login';
    serverClientId: number;
}

export interface RpcLogoutMessage {
    rpcChannelingSystem: 'Logout';
}

export interface RpcChannelMessage {
    senderClientId: number;
    channelName: string;
    messageBody: string;
}

export interface RpcChannelCompletion {
    type: 'stopped' | 'failed';
    error?: Error;
}

export interface RpcChannelClient {
    readonly clientId: number | undefined;
    readonly completion?: Promise<RpcChannelCompletion>;
    onMessage(handler: (message: RpcChannelMessage) => void | Promise<void>): () => void;
    sendToClient(receiverClientId: number, channelName: string, messageBody: string): Promise<void>;
}

export type RpcTransferMode = 'value' | 'byValue' | 'byReference';

export interface RpcCodec<T> {
    readonly name: string;
    encode(endpoint: RpcEndpointServices, value: T): RpcJsonValue | Promise<RpcJsonValue>;
    decode(endpoint: RpcEndpointServices, value: RpcJsonValue): T | Promise<T>;
    encodeUnknown(endpoint: RpcEndpointServices, value: T): RpcJsonValue | Promise<RpcJsonValue>;
    decodeUnknown(endpoint: RpcEndpointServices, value: RpcJsonValue): T | Promise<T>;
    copy(endpoint: RpcEndpointServices, value: T, active: Set<object>): T | Promise<T>;
}

export interface RpcReferenceFactory<T extends object> {
    readonly key: string;
    create(context: RpcProxyContext): T;
}

export interface RpcEndpointServices {
    readonly vintCodec: RpcCodec<number>;
    objectToReference<T extends object>(value: T, typeId: number): RpcObjectReference;
    referenceToObject<T extends object>(ref: RpcObjectReference, factory?: RpcReferenceFactory<T>): Promise<T | null>;
}

export interface RpcValueUse<T = unknown> {
    codec: RpcCodec<T>;
    transfer?: RpcTransferMode;
    unknown?: boolean;
}

export interface RpcMethodDescriptor {
    readonly id: number;
    readonly idString: string;
    readonly name: string;
    readonly implementationKey: string;
    readonly parameters: readonly RpcValueUse[];
    readonly result: RpcValueUse;
}

export interface RpcEventDescriptor {
    readonly id: number;
    readonly idString: string;
    readonly name: string;
    readonly propertyKey: string;
    readonly parameters: readonly RpcValueUse[];
}

export interface RpcPropertyDescriptor {
    readonly name: string;
    readonly getterMethodId: number;
    readonly setterMethodId?: number;
    readonly changedEventId?: number;
    readonly cached: boolean;
}

export interface RpcInterfaceDescriptor<TLocal extends object = object, TProxy extends object = object> {
    readonly typeId: number;
    readonly idString: string;
    readonly name: string;
    readonly constructorService: boolean;
    readonly baseTypeIds: readonly number[];
    readonly methods: readonly RpcMethodDescriptor[];
    readonly events: readonly RpcEventDescriptor[];
    readonly properties: readonly RpcPropertyDescriptor[];
    readonly proxyFactory: RpcReferenceFactory<TProxy>;
    readonly localToken?: symbol;
    readonly brandLocal?: (implementation: TLocal) => void;
}

export interface RpcProxyContext {
    readonly endpoint: RpcProxyEndpoint;
    readonly reference: RpcObjectReference;
}

export interface RpcProxyEndpoint extends RpcEndpointServices {
    invokeProxy(proxy: object, methodId: number, arguments_: readonly unknown[]): Promise<unknown>;
    raiseProxyEvent(proxy: object, eventId: number, arguments_: readonly unknown[]): Promise<void>;
    disposeProxy(proxy: object): Promise<void>;
    isProxyDisposed(proxy: object): boolean;
}

export interface RpcDisposable {
    readonly disposed: boolean;
    dispose(): Promise<void>;
}

export interface RpcCleanupScheduler {
    schedule(task: () => Promise<void>): void;
}

export interface RpcFinalizerToken {
    readonly lifecycleGeneration: number;
    readonly referenceKey: string;
    readonly leaseKey: string;
    readonly viewGeneration: number;
    readonly claimId: string;
}

export interface RpcFinalizer {
    register(target: object, token: RpcFinalizerToken, unregisterToken: object): void;
    unregister(unregisterToken: object): void;
}

export type RpcFinalizerFactory = (callback: (token: RpcFinalizerToken) => void) => RpcFinalizer;

export interface RpcLocalHoldNotification {
    readonly reference: RpcObjectReference;
    readonly remoteClientId: number;
    readonly hold: boolean;
}

export interface RpcEndpointDebugState {
    readonly active: boolean;
    readonly pendingRequests: number;
    readonly serviceWaiters: number;
    readonly localObjects: number;
    readonly remoteViews: number;
    readonly remoteLeases: number;
    readonly byValueSlots: number;
    readonly suppressionEntries: number;
}
