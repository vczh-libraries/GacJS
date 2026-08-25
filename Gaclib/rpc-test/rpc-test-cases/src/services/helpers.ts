import * as RPC from '@gaclib/workflow-rpc';
import type {
    RpcTestContractModule,
    RpcTestServiceFactoryContext,
} from '../generated/registry.js';

export type DynamicRpcObject = Record<string, unknown>;

export function constructorDescriptor(context: RpcTestServiceFactoryContext): RPC.RpcInterfaceDescriptor {
    const descriptors = context.contract.AllRpcInterfaceDescriptors.filter(descriptor => descriptor.constructorService);
    if (descriptors.length !== 1) {
        throw new Error(`A Workflow RPC test contract must contain exactly one constructor service, but found ${String(descriptors.length)}.`);
    }
    return descriptors[0];
}

export function valueDescriptor(contract: RpcTestContractModule): RPC.RpcInterfaceDescriptor {
    const descriptor = contract.AllRpcInterfaceDescriptors.find(item => !item.constructorService && item.name.endsWith('::IValue'));
    if (descriptor === undefined) throw new Error('The Workflow RPC test contract does not contain IValue.');
    return descriptor;
}

export function registerService(context: RpcTestServiceFactoryContext, implementation: DynamicRpcObject): RPC.RpcObjectReference {
    return context.endpoint.registerService(constructorDescriptor(context), implementation);
}

export function createInterfaceValueCodec(descriptor: RPC.RpcInterfaceDescriptor): RPC.RpcCodec<object | null> {
    return RPC.createInterfaceCodec<object>(
        descriptor.typeId,
        descriptor.proxyFactory,
    );
}

export function method(object: unknown, name: string): (...arguments_: unknown[]) => unknown {
    if (typeof object !== 'object' || object === null) throw new Error(`${name} needs an RPC object.`);
    const member = (object as DynamicRpcObject)[name];
    if (typeof member !== 'function') throw new Error(`RPC object does not implement ${name}.`);
    return member as (...arguments_: unknown[]) => unknown;
}

export async function invoke(object: unknown, name: string, ...arguments_: unknown[]): Promise<unknown> {
    return await method(object, name).apply(object, arguments_);
}

export function eventFor(descriptor: RPC.RpcInterfaceDescriptor, name: string): RPC.RpcEvent<readonly unknown[]> {
    const event = descriptor.events.find(item => item.name === name);
    if (event === undefined) throw new Error(`${descriptor.name} does not declare event ${name}.`);
    return new RPC.RpcEvent<readonly unknown[]>();
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
