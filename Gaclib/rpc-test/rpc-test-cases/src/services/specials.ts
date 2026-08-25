import * as RPC from '@gaclib/workflow-rpc';
import type {
    RpcTestServiceFactory,
    RpcTestServiceFactoryContext,
} from '../generated/registry.js';
import {
    DynamicRpcObject,
    constructorDescriptor,
    createInterfaceValueCodec,
    errorMessage,
    eventFor,
    invoke,
    registerService,
    valueDescriptor,
} from './helpers.js';

function descriptorEnding(context: RpcTestServiceFactoryContext, suffix: string): RPC.RpcInterfaceDescriptor {
    const descriptor = context.contract.AllRpcInterfaceDescriptors.find(item => item.name.endsWith(suffix));
    if (descriptor === undefined) throw new Error(`The Workflow RPC test contract does not contain ${suffix}.`);
    return descriptor;
}

function eventService(
    context: RpcTestServiceFactoryContext,
    methods: DynamicRpcObject,
    eventNames: readonly string[],
): { readonly implementation: DynamicRpcObject; readonly events: Readonly<Record<string, RPC.RpcEvent<readonly unknown[]>>> } {
    const descriptor = constructorDescriptor(context);
    const implementation: DynamicRpcObject = { ...methods };
    const events: Record<string, RPC.RpcEvent<readonly unknown[]>> = {};
    for (const name of eventNames) {
        const declaration = descriptor.events.find(item => item.name === name);
        if (declaration === undefined) throw new Error(`${descriptor.name} does not declare event ${name}.`);
        const rpcEvent = eventFor(descriptor, name);
        implementation[declaration.propertyKey] = rpcEvent;
        events[name] = rpcEvent;
    }
    return { implementation, events };
}

function requestService(context: RpcTestServiceFactoryContext): void {
    registerService(context, { GetText: (): string => 'Hello' });
}

function primitiveTypes(context: RpcTestServiceFactoryContext): void {
    registerService(context, {
        ProcessInt: (value: unknown): number => Number(value) + 1,
        ProcessUInt: (value: unknown): number => Number(value) + 2,
        ProcessFloat: (value: unknown): number => Number(value) + 0.25,
        ProcessDouble: (value: unknown): number => Number(value) + 0.125,
        ProcessString: (value: unknown): string => `${String(value)}!`,
        ProcessBool: (value: unknown): boolean => value !== true,
        ProcessEnum: (value: unknown): unknown => value,
        ProcessStruct: (value: unknown): DynamicRpcObject => {
            if (typeof value !== 'object' || value === null) throw new Error('ProcessStruct expects a point.');
            const point = value as DynamicRpcObject;
            return { x: Number(point.x) + 10, y: Number(point.y) + 20 };
        },
    });
}

function overloading(context: RpcTestServiceFactoryContext): void {
    registerService(context, {
        ToStringInt: (value: unknown): string => String(value),
        ToString_1: (value: unknown): string => String(value),
        ToString_2: (value: unknown): string => String(value),
        ToString_3: async (value: unknown): Promise<string> => String(await invoke(value, 'GetStringValue')),
        ToString_4: async (value1: unknown, value2: unknown, value3: unknown, value4: unknown): Promise<string> =>
            `${String(value1)},${String(value2)},${String(value3)},${String(await invoke(value4, 'GetStringValue'))}`,
    });
}

function nullable(context: RpcTestServiceFactoryContext): void {
    registerService(context, {
        Print: async (value: unknown, object: unknown): Promise<string> => {
            const valueText = value === null ? 'null' : String(value);
            const objectText = object === null ? 'null' : String(await invoke(object, 'GetValue'));
            return `[${valueText}][${objectText}]`;
        },
    });
}

function localAndWrapper(context: RpcTestServiceFactoryContext): void {
    const serviceObject1: DynamicRpcObject = {};
    const serviceObject2: DynamicRpcObject = {};
    let receivedObject1: unknown = null;
    let receivedObject2: unknown = null;
    registerService(context, {
        GetServiceResult: (): string => `[${String(receivedObject1 === serviceObject1)}][${String(receivedObject2 === serviceObject2)}]`,
        Exchange1: (value: unknown): DynamicRpcObject => {
            receivedObject1 = value;
            return serviceObject2;
        },
        Exchange2: (value: unknown): unknown => {
            receivedObject2 = value;
            return receivedObject1;
        },
    });
}

function serviceWrapper(context: RpcTestServiceFactoryContext): void {
    const service: DynamicRpcObject = {};
    service.Self = (value: unknown): boolean => value === service;
    registerService(context, service);
}

function eventCase(context: RpcTestServiceFactoryContext): void {
    let serviceResult = '';
    const value = eventService(context, {
        GetServiceResult: (): string => serviceResult,
    }, ['SomethingHappened']);
    value.implementation.MakeItHappen = async (): Promise<void> => {
        await value.events.SomethingHappened.emit('A');
    };
    value.implementation.Watch = (): void => {
        value.events.SomethingHappened.subscribe(argument => {
            serviceResult += `[serviceMain:${String(argument)}]`;
        });
    };
    registerService(context, value.implementation);
}

function eventArgs(context: RpcTestServiceFactoryContext): void {
    const xs = [1, 2];
    const ys = new RPC.RpcLocalObservableList([3, 4], RPC.rpcInt64Codec);
    const value = eventService(context, {}, ['SomethingHappened']);
    value.implementation.MakeItHappen = async (): Promise<void> => {
        await value.events.SomethingHappened.emit(xs, ys);
    };
    value.implementation.AddElement = async (): Promise<void> => {
        xs.push(5);
        await ys.add(6);
    };
    registerService(context, value.implementation);
}

async function modifyObservableList(list: RPC.RpcObservableList<number>): Promise<void> {
    await list.add(10);
    await list.insert(1, 20);
    await list.set(0, 30);
    await list.removeAt(1);
    await list.clear();
}

function eventOblist(context: RpcTestServiceFactoryContext): void {
    let serviceResult = '';
    let list: RPC.RpcObservableList<number> | null = null;
    let unsubscribe: (() => void) | undefined;
    registerService(context, {
        GetServiceResult: (): string => {
            unsubscribe?.();
            unsubscribe = undefined;
            return serviceResult;
        },
        SetList: (value: unknown): void => {
            list = value as RPC.RpcObservableList<number>;
        },
        ModifyHeldList: async (): Promise<void> => {
            if (list === null) throw new Error('EventOblist has no held list.');
            await modifyObservableList(list);
        },
        WatchHeldList: (): void => {
            if (list === null) throw new Error('EventOblist has no held list.');
            unsubscribe = list.itemChanged.subscribe((index, oldCount, newCount) => {
                serviceResult += `[serviceMain:${String(index)},${String(oldCount)},${String(newCount)}]`;
            });
        },
    });
}

function listException(context: RpcTestServiceFactoryContext): void {
    registerService(context, {
        DoSomethingWrong: (): never => {
            throw new Error('ArrayBase<T, K>::Get(vint)#Argument index not in range.');
        },
    });
}

function observableListEventException(context: RpcTestServiceFactoryContext): void {
    registerService(context, {
        GetOblist: (): RPC.RpcObservableList<number> => {
            const list = new RPC.RpcLocalObservableList<number>([], RPC.rpcInt64Codec);
            let unsubscribe: (() => void) | undefined;
            unsubscribe = list.itemChanged.subscribe((index, oldCount, newCount) => {
                unsubscribe?.();
                unsubscribe = undefined;
                throw new Error(`${String(index)},${String(oldCount)},${String(newCount)}`);
            });
            return list;
        },
    });
}

function failDoubleRegistration(context: RpcTestServiceFactoryContext): void {
    const descriptor = constructorDescriptor(context);
    let result = '';
    const service: DynamicRpcObject = {
        GetResult: (): string => result,
    };
    context.endpoint.registerService(descriptor, service);
    try {
        context.endpoint.registerService(descriptor, service);
        result = '[no exception]';
    } catch {
        result = '[exception]';
    }
}

function inheritance(context: RpcTestServiceFactoryContext): void {
    function one(): DynamicRpcObject {
        let value = '';
        return {
            GetValue: (): string => value,
            SetOneValue: (): void => { value = 'One'; },
        };
    }
    function two(): DynamicRpcObject {
        let value = '';
        return {
            GetValue: (): string => value,
            SetTwoValue: (): void => { value = 'Two'; },
        };
    }
    function derived(): DynamicRpcObject {
        let value = '';
        return {
            GetValue: (): string => value,
            SetOneValue: (): never => { throw new Error('DoNotSetOneValue'); },
            SetTwoValue: (): never => { throw new Error('DoNotSetTwoValue'); },
            SetDerivedValue: (): void => { value = 'Derived'; },
        };
    }
    registerService(context, {
        CreateOne: one,
        CreateTwo: two,
        CreateDerived: derived,
    });
}

function inheritanceMethodException(context: RpcTestServiceFactoryContext): void {
    registerService(context, {
        CreateDerived: (): DynamicRpcObject => ({
            SetOneValue: (): never => { throw new Error('DoNotSetOneValue'); },
            SetTwoValue: (): never => { throw new Error('DoNotSetTwoValue'); },
        }),
    });
}

function inheritanceEventException(context: RpcTestServiceFactoryContext): void {
    const derivedDescriptor = descriptorEnding(context, '::IDerived');
    const oneDescriptor = descriptorEnding(context, '::IOne');
    const twoDescriptor = descriptorEnding(context, '::ITwo');
    registerService(context, {
        CreateDerived: (): DynamicRpcObject => {
            const crashAtServer = eventFor(oneDescriptor, 'CrashAtServer');
            const crashAtClient = eventFor(twoDescriptor, 'CrashAtClient');
            crashAtServer.subscribe(() => { throw new Error('CrashedAtServer'); });
            const result: DynamicRpcObject = {
                GuardCrashAtClient: async (): Promise<string> => {
                    try {
                        await crashAtClient.emit();
                        return '';
                    } catch (error) {
                        return errorMessage(error);
                    }
                },
            };
            const serverEvent = derivedDescriptor.events.find(item => item.name === 'CrashAtServer') ?? oneDescriptor.events[0];
            const clientEvent = derivedDescriptor.events.find(item => item.name === 'CrashAtClient') ?? twoDescriptor.events[0];
            result[serverEvent.propertyKey] = crashAtServer;
            result[clientEvent.propertyKey] = crashAtClient;
            return result;
        },
    });
}

function stringProperty(context: RpcTestServiceFactoryContext): void {
    let propertyValue = 'A';
    const value = eventService(context, {
        GetValue: (): string => propertyValue,
        SetValue: (next: unknown): void => { propertyValue = String(next); },
    }, ['ValueChanged']);
    value.implementation.Signal = async (): Promise<void> => {
        await value.events.ValueChanged.emit();
    };
    registerService(context, value.implementation);
}

function interfaceProperty(context: RpcTestServiceFactoryContext): void {
    let propertyValue: unknown = { GetValue: (): string => 'A' };
    const value = eventService(context, {
        GetValue: (): unknown => propertyValue,
        SetValue: (next: unknown): void => { propertyValue = next; },
    }, ['ValueChanged']);
    value.implementation.Signal = async (): Promise<void> => {
        await value.events.ValueChanged.emit();
    };
    registerService(context, value.implementation);
}

function interfaceListProperty(context: RpcTestServiceFactoryContext): void {
    const descriptor = valueDescriptor(context.contract);
    let propertyValue: unknown = new RPC.RpcLocalList<object | null>(
        [{ GetValue: (): string => 'A' }],
        createInterfaceValueCodec(descriptor),
    );
    const value = eventService(context, {
        GetValue: (): unknown => propertyValue,
        SetValue: (next: unknown): void => { propertyValue = next; },
    }, ['ValueChanged']);
    value.implementation.Signal = async (): Promise<void> => {
        await value.events.ValueChanged.emit();
    };
    registerService(context, value.implementation);
}

function listProperty(context: RpcTestServiceFactoryContext): void {
    let propertyValue: readonly string[] = ['A'];
    const value = eventService(context, {
        GetValue: (): readonly string[] => propertyValue,
        SetValue: (next: unknown): void => { propertyValue = next as readonly string[]; },
    }, ['ValueChanged']);
    value.implementation.Signal = async (): Promise<void> => {
        await value.events.ValueChanged.emit();
    };
    registerService(context, value.implementation);
}

function destructorLimited(context: RpcTestServiceFactoryContext): void {
    const descriptor = constructorDescriptor(context);
    const implementation: DynamicRpcObject = {};
    for (const declaration of descriptor.methods) {
        implementation[declaration.implementationKey] = (): never => {
            throw new Error('This test depends on deterministic destructor timing, which TypeScript cannot guarantee.');
        };
    }
    for (const declaration of descriptor.events) {
        implementation[declaration.propertyKey] = new RPC.RpcEvent<readonly unknown[]>();
    }
    registerService(context, implementation);
}

export const specialServiceFactories: Readonly<Record<string, RpcTestServiceFactory>> = {
    Dtor: destructorLimited,
    Dtor2: destructorLimited,
    Dtor3: destructorLimited,
    DtorList: destructorLimited,
    DtorList2: destructorLimited,
    DtorPropCached: destructorLimited,
    DtorPropCachedListByval: destructorLimited,
    DtorPropCachedListVByref: destructorLimited,
    Event: eventCase,
    EventArgs: eventArgs,
    EventOblist: eventOblist,
    ListOps_DictionaryException: listException,
    ListOps_ListException: listException,
    ListOps_OblistEventException: observableListEventException,
    FailDoubleRegistration: failDoubleRegistration,
    Inheritance: inheritance,
    Inheritance_MethodException: inheritanceMethodException,
    Inheritance_EventException: inheritanceEventException,
    LocalAndWrapper: localAndWrapper,
    Nullable: nullable,
    Overloading: overloading,
    PrimitiveTypes: primitiveTypes,
    PropCached: stringProperty,
    PropDefault: stringProperty,
    PropDefaultInterface: interfaceProperty,
    PropDefaultInterfaceList: interfaceListProperty,
    PropDefaultList: listProperty,
    PropDynamic: stringProperty,
    RequestService: requestService,
    ServiceWrapper: serviceWrapper,
};

export function specialServiceFactory(name: string): RpcTestServiceFactory {
    const factory = specialServiceFactories[name];
    if (factory === undefined) throw new Error(`Missing special Workflow RPC service translation: ${name}`);
    return factory;
}
