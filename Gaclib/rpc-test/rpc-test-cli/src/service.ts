import { Readable, Writable } from 'node:stream';
import { selectRpcTestCase } from '@gaclib-rpc-test/rpc-test-cases';
import {
    RpcEndpointCompletion,
    createRpcEndpoint,
    rpcInt64Codec,
} from '@gaclib/workflow-rpc';
import {
    WORKFLOW_RPC_STDIO_CHANNEL,
    WorkflowRpcStdioChannelClient,
} from './stdio.js';

export function parseRpcTestServiceArguments(arguments_: readonly string[]): string {
    if (arguments_.length !== 1) {
        throw new Error('Usage: gacjs-rpc-test <rpc-test-case-name>');
    }
    const name = arguments_[0];
    selectRpcTestCase(name);
    return name;
}

type TerminalResult =
    | { readonly source: 'channel'; readonly completion: Awaited<WorkflowRpcStdioChannelClient['completion']> }
    | { readonly source: 'endpoint'; readonly completion: RpcEndpointCompletion };

export async function runRpcTestService(
    arguments_: readonly string[],
    input: Readable = process.stdin,
    output: Writable = process.stdout,
): Promise<number> {
    const name = parseRpcTestServiceArguments(arguments_);
    const definition = selectRpcTestCase(name);
    const channel = new WorkflowRpcStdioChannelClient(input, output);
    await channel.connect();
    const endpoint = createRpcEndpoint(channel, { channelName: WORKFLOW_RPC_STDIO_CHANNEL });
    endpoint.setVintCodec(rpcInt64Codec);
    definition.prepare(endpoint);
    await endpoint.initialize();

    const terminal = await Promise.race<TerminalResult>([
        channel.completion.then(completion => ({ source: 'channel', completion })),
        endpoint.completion.then(completion => ({ source: 'endpoint', completion })),
    ]);
    if (terminal.source === 'channel') {
        if (terminal.completion.type === 'failed') throw terminal.completion.error;
        endpoint.finalize();
        return channel.parentExited ? 0 : 1;
    }
    if (terminal.completion.type === 'failed') throw terminal.completion.error;
    const channelCompletion = await channel.completion;
    if (channelCompletion.type === 'failed') throw channelCompletion.error;
    return channel.parentExited ? 0 : 1;
}

export function runtimeArguments(): string[] {
    return process.argv.slice(2);
}
