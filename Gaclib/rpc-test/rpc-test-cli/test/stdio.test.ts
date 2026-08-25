import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { serializeNetworkPackage } from '@gaclib-website/remote-protocol-http/channel';
import { parseRpcTestServiceArguments } from '../src/service.js';
import {
    WORKFLOW_RPC_STDIO_CHANNEL,
    WORKFLOW_RPC_STDIO_JOIN_PACKAGE,
    WorkflowRpcStdioChannelClient,
    decodeWorkflowRpcStdioFrame,
    encodeWorkflowRpcStdioFrame,
} from '../src/stdio.js';

function flush(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
}

describe('Workflow RPC stdio framing', () => {
    it('requires canonical Base64 and strict UTF-8', () => {
        const message = '1;WorkflowRpcStdioTest;["你好"]';
        expect(decodeWorkflowRpcStdioFrame(encodeWorkflowRpcStdioFrame(message).trimEnd())).toBe(message);
        expect(() => decodeWorkflowRpcStdioFrame('YQ')).toThrow('canonical Base64');
        expect(() => decodeWorkflowRpcStdioFrame('/w==')).toThrow('strict UTF-8');
        expect(() => encodeWorkflowRpcStdioFrame('\uD800')).toThrow('lone UTF-16 surrogate');
    });

    it('buffers fragmented LF/CRLF input and queues Login before handler installation', async () => {
        const input = new PassThrough();
        const output = new PassThrough();
        let written = '';
        output.on('data', chunk => { written += String(chunk); });
        const channel = new WorkflowRpcStdioChannelClient(input, output);
        const connecting = channel.connect();
        await flush();

        expect(decodeWorkflowRpcStdioFrame(written.trimEnd())).toBe(WORKFLOW_RPC_STDIO_JOIN_PACKAGE);

        const assignment = encodeWorkflowRpcStdioFrame('1;;').trimEnd();
        const loginBody = JSON.stringify([{ rpcChannelingSystem: 'Login', serverClientId: 3 }]);
        const login = encodeWorkflowRpcStdioFrame(serializeNetworkPackage({
            clientId: 3,
            channelName: WORKFLOW_RPC_STDIO_CHANNEL,
            messageBody: loginBody,
        })).trimEnd();
        const incoming = `${assignment}\r\n${login}\n`;
        input.write(incoming.substring(0, 7));
        input.write(incoming.substring(7, 19));
        input.write(incoming.substring(19));
        await connecting;

        const messages: string[] = [];
        channel.onMessage(message => { messages.push(message.messageBody); });
        await flush();
        expect(messages).toEqual([loginBody]);
        channel.stop();
    });

    it('treats !Exit as normal parent finalization', async () => {
        const input = new PassThrough();
        const output = new PassThrough();
        const channel = new WorkflowRpcStdioChannelClient(input, output);
        const connecting = channel.connect();
        await flush();
        input.write(`${encodeWorkflowRpcStdioFrame('1;;').trimEnd()}\n`);
        await connecting;
        input.write('!Exit\r\n');
        await expect(channel.completion).resolves.toEqual({ type: 'stopped' });
        expect(channel.parentExited).toBe(true);
    });

    it('fails and stops reading after malformed input', async () => {
        const input = new PassThrough();
        const channel = new WorkflowRpcStdioChannelClient(input, new PassThrough());
        const connecting = channel.connect();
        await flush();
        input.write(`${encodeWorkflowRpcStdioFrame('1;;').trimEnd()}\n`);
        await connecting;
        input.write('not-base64\n');
        const completion = await channel.completion;
        expect(completion.type).toBe('failed');
        if (completion.type !== 'failed') throw new Error('Malformed stdio input did not fail the channel.');
        expect(completion.error.message).toContain('canonical Base64');
        expect(input.isPaused()).toBe(true);
    });

    it('keeps all channel writes as independently decodable protocol frames', async () => {
        const input = new PassThrough();
        const output = new PassThrough();
        let written = '';
        output.on('data', chunk => { written += String(chunk); });
        const channel = new WorkflowRpcStdioChannelClient(input, output);
        const connecting = channel.connect();
        await flush();
        input.write(encodeWorkflowRpcStdioFrame('1;;'));
        await connecting;
        await channel.sendToClient(3, WORKFLOW_RPC_STDIO_CHANNEL, '[]');
        const decoded = written.trimEnd().split('\n').map(decodeWorkflowRpcStdioFrame);
        expect(decoded).toEqual([
            WORKFLOW_RPC_STDIO_JOIN_PACKAGE,
            `3;${WORKFLOW_RPC_STDIO_CHANNEL};[]`,
        ]);
        channel.stop();
    });
});

describe('Workflow RPC service arguments', () => {
    it('accepts exactly one known case', () => {
        expect(parseRpcTestServiceArguments(['RequestService'])).toBe('RequestService');
        expect(() => parseRpcTestServiceArguments([])).toThrow('Usage:');
        expect(() => parseRpcTestServiceArguments(['RequestService', 'extra'])).toThrow('Usage:');
        expect(() => parseRpcTestServiceArguments(['UnknownCase'])).toThrow('Unknown Workflow RPC test case');
    });
});
