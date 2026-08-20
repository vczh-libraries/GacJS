import { expect, test } from 'vitest';
import {
    RpcChannelCompletion,
    RpcChannelMessage,
    RpcChannelClient,
} from '@gaclib/workflow-rpc';
import {
    IViewModelDescriptor,
    IViewModelLocal,
    IViewModelProxy,
    IViewModelTypeId,
    IViewModel_Translate_1Id,
    configureRpcEndpoint,
    registerIViewModelService,
} from '../src/index.js';
import { RpcEndpoint, RpcProtocolError, RpcRemoteException } from '@gaclib/workflow-rpc';

class MemoryChannel implements RpcChannelClient {
    private readonly handlers = new Set<(message: RpcChannelMessage) => void | Promise<void>>();
    private completionResolve: ((value: RpcChannelCompletion) => void) | undefined;
    readonly completion = new Promise<RpcChannelCompletion>(resolve => { this.completionResolve = resolve; });

    constructor(readonly clientId: number, private readonly broker: MemoryBroker) {
        broker.add(this);
    }

    onMessage(handler: (message: RpcChannelMessage) => void | Promise<void>): () => void {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }

    async sendToClient(receiverClientId: number, channelName: string, messageBody: string): Promise<void> {
        await this.broker.send(this.clientId, receiverClientId, channelName, messageBody);
    }

    receive(senderClientId: number, channelName: string, messageBody: string): void {
        for (const handler of this.handlers) void handler({ senderClientId, channelName, messageBody });
    }

    stop(): void {
        this.completionResolve?.({ type: 'stopped' });
    }
}

class MemoryBroker {
    private readonly channels = new Map<number, MemoryChannel>();
    add(channel: MemoryChannel): void { this.channels.set(channel.clientId, channel); }

    login(clientId: number): void {
        this.channels.get(clientId)?.receive(1, 'ViewModelChannel', JSON.stringify([{ rpcChannelingSystem: 'Login', serverClientId: 1 }]));
    }

    send(sender: number, receiver: number, channelName: string, messageBody: string): Promise<void> {
        if (receiver !== 1) {
            this.channels.get(receiver)?.receive(sender, channelName, messageBody);
            return Promise.resolve();
        }
        const messages = JSON.parse(messageBody) as { rpcMethod: string }[];
        for (const message of messages) {
            if (message.rpcMethod !== 'Request:IRpcDispatcher_DeclareRemoteService') {
                throw new Error(`Unsupported broker message: ${message.rpcMethod}`);
            }
            for (const [clientId, channel] of this.channels) {
                if (clientId !== sender) channel.receive(1, channelName, JSON.stringify([message]));
            }
        }
        return Promise.resolve();
    }
}

function endpoint(channel: MemoryChannel): RpcEndpoint {
    const result = new RpcEndpoint(channel, { finalizer: false });
    configureRpcEndpoint(result);
    return result;
}

test('generated IDs, deterministic service identity, invocation, holds, and exceptions interoperate', async () => {
    expect(IViewModelTypeId).toBe(0);
    expect(IViewModel_Translate_1Id).toBe(1);
    expect(IViewModelDescriptor.idString).toBe('rvmt::IViewModel');

    const broker = new MemoryBroker();
    const ownerChannel = new MemoryChannel(3, broker);
    const callerChannel = new MemoryChannel(4, broker);
    const owner = endpoint(ownerChannel);
    const caller = endpoint(callerChannel);
    const implementation: IViewModelLocal = {
        Translate: name => name === 'Throw' ? Promise.reject(new Error('expected failure')) : `Hello, ${name}!`,
    };
    const reference = registerIViewModelService(owner, implementation);
    expect(reference).toEqual({ clientId: 3, objectId: 0, typeId: 0 });

    const ownerInitializing = owner.initialize();
    const callerInitializing = caller.initialize([IViewModelTypeId]);
    broker.login(3);
    broker.login(4);
    await ownerInitializing;
    await callerInitializing;

    const service = await caller.requestService<IViewModelProxy>(IViewModelTypeId);
    await expect(service.Translate('Alice')).resolves.toBe('Hello, Alice!');
    await expect(service.Translate('Throw')).rejects.toBeInstanceOf(RpcRemoteException);
    expect(owner.getDebugState().localObjects).toBe(1);
    expect(caller.getDebugState().remoteViews).toBe(1);

    await service.dispose();
    expect(caller.getDebugState().remoteViews).toBe(0);
    owner.finalize();
    caller.finalize();
    expect(owner.getDebugState().localObjects).toBe(0);
    expect(caller.getDebugState().pendingRequests).toBe(0);
    ownerChannel.stop();
    callerChannel.stop();
});

async function expectBindingProtocolFailure(methodId: number, arguments_: readonly unknown[], expected: RegExp): Promise<void> {
    const broker = new MemoryBroker();
    const channel = new MemoryChannel(3, broker);
    const owner = endpoint(channel);
    registerIViewModelService(owner, { Translate: name => `Hello, ${name}!` });
    const initializing = owner.initialize();
    broker.login(3);
    await initializing;
    channel.receive(2, 'ViewModelChannel', JSON.stringify([{
        rpcMethod: 'Request:IObjectOps_InvokeMethod', rpcRequestId: 10,
        sourceClientId: 2, targetClientId: 3,
        ref: { clientId: 3, objectId: 0, typeId: 0 }, methodId, arguments: arguments_,
    }]));
    const completion = await owner.completion;
    expect(completion.type).toBe('failed');
    if (completion.type === 'failed') {
        expect(completion.error).toBeInstanceOf(RpcProtocolError);
        expect(completion.error.message).toMatch(expected);
    }
}

test('generated dispatch rejects malformed arguments and unknown method IDs as protocol errors', async () => {
    await expectBindingProtocolFailure(IViewModel_Translate_1Id, [], /invalid argument count/u);
    await expectBindingProtocolFailure(IViewModel_Translate_1Id, [42], /string/u);
    await expectBindingProtocolFailure(999, ['Alice'], /Unknown RPC method id 999/u);
});
