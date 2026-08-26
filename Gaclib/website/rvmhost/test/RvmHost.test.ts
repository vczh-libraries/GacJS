import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { PassThrough, Writable } from 'node:stream';
import { expect, test } from 'vitest';
import { build } from 'esbuild';
import { parseNetworkPackage, serializeNetworkPackage } from '@gaclib-website/remote-protocol-http/channel';
import { HttpChannelConnectionError } from '@gaclib-website/remote-protocol-http/http-channel';
import { ChannelCompletion, ChannelMessage, ChannelMessageHandler, IChannelClient } from '@gaclib-website/remote-protocol-http/channel';
import {
    NetworkRvmHostCliDependencies,
    RvmHostSignalBarrier,
    parseRvmHostArguments,
    runNetworkRvmHostCli,
    runStdioRvmHostCli,
} from '../src/cliMain.js';
import { RvmHostSession, startRvmHostWithChannel } from '../src/index.js';
import { assertSeaToolchain, assertSupportedNodeVersion } from '../sea-capability.mjs';
import {
    STDIO_JOIN_GOLDEN,
    STDIO_JOIN_PACKAGE,
    STDIO_READY_GOLDEN,
    StdioChannelClient,
    decodeStdioBase64,
    encodeStdioMessage,
} from '../src/stdio.js';

function deferred<T>(): { readonly promise: Promise<T>; readonly resolve: (value: T) => void; readonly reject: (error: Error) => void } {
    let resolve: ((value: T) => void) | undefined;
    let reject: ((error: Error) => void) | undefined;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    if (resolve === undefined || reject === undefined) throw new Error('Failed to create a test barrier.');
    return { promise, resolve, reject };
}

async function waitUntil(predicate: () => boolean): Promise<void> {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    throw new Error('Timed out waiting for the RVM host test condition.');
}

class FakeAssignedChannel implements IChannelClient {
    readonly clientId = 3;
    state = 'assigned' as const;
    private readonly handlers = new Set<ChannelMessageHandler>();
    private readonly terminal = deferred<ChannelCompletion>();
    readonly completion = this.terminal.promise;
    readonly operations: string[] = [];
    readonly sent: Record<string, unknown>[] = [];
    holdWrite: ReturnType<typeof deferred<void>> | undefined;
    stopCount = 0;

    connect(): Promise<void> { return Promise.resolve(); }
    start(): Promise<void> {
        this.operations.push('start-read');
        return this.completion.then(completion => {
            if (completion.type === 'failed') throw completion.error;
        });
    }
    onMessage(handler: ChannelMessageHandler): () => void {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }
    sendToClient(_receiverClientId: number, _channelName: string, messageBody: string): Promise<void> {
        const message = (JSON.parse(messageBody) as Record<string, unknown>[])[0];
        this.sent.push(message);
        this.operations.push(`send:${String(message.rpcMethod)}`);
        if (message.rpcMethod === 'Response:IObjectOps_ObjectHold' && this.holdWrite !== undefined) {
            return this.holdWrite.promise;
        }
        return Promise.resolve();
    }
    broadcast(channelName: string, messageBody: string): Promise<void> {
        this.operations.push(`broadcast:${channelName}:${messageBody}`);
        return Promise.resolve();
    }
    receive(message: ChannelMessage): void {
        for (const handler of this.handlers) void handler(message);
    }
    stop(): void {
        if (this.stopCount++ === 0) this.terminal.resolve({ type: 'stopped' });
    }
}

test('CLI grammar selects exact /Cli and rejects mixed, duplicate, and Core-only flags', () => {
    expect(parseRvmHostArguments([])).toEqual({
        mode: 'network',
        origin: 'http://localhost:8888',
        basePath: '/GacUIRemoteProtocolHttp',
        serviceOnly: false,
    });
    expect(parseRvmHostArguments(['/Cli'])).toEqual({ mode: 'stdio' });
    expect(parseRvmHostArguments(['--service-only', '--base-path', '/x', '--origin', 'https://example.com'])).toEqual({
        mode: 'network', origin: 'https://example.com', basePath: '/x', serviceOnly: true,
    });
    for (const arguments_ of [
        ['/Cli', '--service-only'], ['/cli'], ['/Http'], ['/MiniHttp'], ['value'],
        ['--origin'], ['--base-path'], ['--origin', 'http://a', '--origin', 'http://b'],
        ['--service-only', '--service-only'],
    ]) {
        expect(() => parseRvmHostArguments(arguments_)).toThrow();
    }
});

test('native launcher capability checks fail actionably before publishing an artifact', () => {
    expect(() => assertSupportedNodeVersion('v22.19.9')).toThrow(/requires Node >=22\.20/u);
    expect(() => assertSupportedNodeVersion('v23.1.0')).toThrow(/requires Node/u);
    expect(() => assertSupportedNodeVersion('v25.1.0')).toThrow(/requires Node/u);
    expect(() => assertSupportedNodeVersion('v27.1.0')).toThrow(/requires Node/u);
    expect(() => assertSupportedNodeVersion('not-node')).toThrow(/cannot parse/u);
    expect(() => assertSeaToolchain('v24.0.0', false, () => undefined)).toThrow(/experimental-sea-config is unavailable/u);
    expect(() => assertSeaToolchain('v24.0.0', true, undefined)).toThrow(/postject tool is unavailable/u);
    expect(() => assertSeaToolchain('v22.20.0', true, () => undefined)).not.toThrow();
    expect(() => assertSeaToolchain('v26.0.0', true, () => undefined)).not.toThrow();
});

test('stdio codec is canonical, strict UTF-8, and rejects lone surrogates', () => {
    expect(encodeStdioMessage(STDIO_JOIN_PACKAGE)).toBe(`${STDIO_JOIN_GOLDEN}\n`);
    expect(decodeStdioBase64(STDIO_JOIN_GOLDEN)).toBe(STDIO_JOIN_PACKAGE);
    expect(decodeStdioBase64('')).toBe('');
    expect(decodeStdioBase64('YQ==')).toBe('a');
    expect(decodeStdioBase64('YQ')).toBeUndefined();
    expect(decodeStdioBase64('YR==')).toBeUndefined();
    expect(decodeStdioBase64('/w==')).toBeUndefined();
    expect(() => encodeStdioMessage('\uD800')).toThrow(/surrogate/u);
    expect(decodeStdioBase64(Buffer.from('你好', 'utf8').toString('base64'))).toBe('你好');
});

test('stdio channel handles fragmented LF/CRLF frames, ignores invalid controls, and processes a final fragment once', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    let written = '';
    output.on('data', chunk => { written += String(chunk); });
    const channel = new StdioChannelClient(input, output);
    const connecting = channel.connect();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(written).toBe(`${STDIO_JOIN_GOLDEN}\n`);
    const assignment = encodeStdioMessage('7;;');
    input.write(assignment.substring(0, 3));
    input.write(`${assignment.substring(3).trimEnd()}\r\n`);
    await connecting;
    const messages: string[] = [];
    channel.onMessage(message => { messages.push(message.messageBody); });
    input.write('!Unknown\nnot base64\n');
    const message = encodeStdioMessage('2;ViewModelChannel;["one"]');
    input.write(message);
    input.end(encodeStdioMessage('2;ViewModelChannel;["two"]').trimEnd());
    const completion = await channel.completion;
    expect(completion.type).toBe('failed');
    expect(messages).toEqual(['["one"]', '["two"]']);
    expect(input.listenerCount('data')).toBe(0);
    expect(input.listenerCount('end')).toBe(0);
    expect(input.listenerCount('error')).toBe(0);
    expect(output.listenerCount('error')).toBe(0);
});

test('stdio serializes whole lines across backpressure and stop rejects an unassigned connection', async () => {
    class DeferredWritable extends Writable {
        readonly lines: string[] = [];
        readonly callbacks: (() => void)[] = [];

        override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
            this.lines.push(String(chunk));
            this.callbacks.push(() => callback());
        }

        release(): void {
            const callback = this.callbacks.shift();
            if (callback === undefined) throw new Error('No deferred write is available.');
            callback();
        }
    }

    const input = new PassThrough();
    const output = new DeferredWritable();
    const channel = new StdioChannelClient(input, output);
    const connecting = channel.connect();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(output.lines).toEqual([`${STDIO_JOIN_GOLDEN}\n`]);
    input.write(encodeStdioMessage('7;;'));
    output.release();
    await connecting;
    const first = channel.sendToClient(1, 'ViewModelChannel', '["first"]');
    const second = channel.broadcast('ViewModelReadyChannel', '["second"]');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(output.lines).toHaveLength(2);
    output.release();
    await first;
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(output.lines).toHaveLength(3);
    output.release();
    await second;
    expect(output.lines.slice(1).map(line => decodeStdioBase64(line.trimEnd()))).toEqual([
        '1;ViewModelChannel;["first"]',
        ';ViewModelReadyChannel;["second"]',
    ]);
    channel.stop();
    expect(await channel.completion).toEqual({ type: 'stopped' });
    expect(input.listenerCount('data')).toBe(0);
    expect(output.listenerCount('error')).toBe(0);

    const stoppedInput = new PassThrough();
    const stoppedOutput = new PassThrough();
    const stopped = new StdioChannelClient(stoppedInput, stoppedOutput);
    const stoppedConnecting = stopped.connect();
    stopped.stop();
    await expect(stoppedConnecting).rejects.toThrow(/stopped before assignment/u);
    expect(await stopped.completion).toEqual({ type: 'stopped' });
});

test('stdio input and output failures settle once and remove every stream listener', async () => {
    for (const source of ['stdin', 'stdout'] as const) {
        const input = new PassThrough();
        const output = new PassThrough();
        const channel = new StdioChannelClient(input, output);
        const connecting = channel.connect();
        await new Promise(resolve => setTimeout(resolve, 0));
        input.write(encodeStdioMessage('7;;'));
        await connecting;
        const failure = Object.assign(new Error(`${source} failed`), source === 'stdout' ? { code: 'EPIPE' } : {});
        if (source === 'stdin') input.emit('error', failure);
        else output.emit('error', failure);
        const first = await channel.completion;
        expect(first).toEqual({ type: 'failed', error: failure });
        input.emit('end');
        expect(await channel.completion).toBe(first);
        expect(input.listenerCount('data')).toBe(0);
        expect(input.listenerCount('end')).toBe(0);
        expect(input.listenerCount('error')).toBe(0);
        expect(output.listenerCount('error')).toBe(0);
    }
});

test('stdio CLI returns status 1 after fatal stdin and stdout failures', async () => {
    for (const source of ['stdin', 'stdout'] as const) {
        const input = new PassThrough();
        const output = new PassThrough();
        let stdout = '';
        output.on('data', chunk => { stdout += String(chunk); });
        const running = runStdioRvmHostCli(input, output);
        await waitUntil(() => stdout.includes('\n'));
        input.write(encodeStdioMessage('7;;'));
        await waitUntil(() => stdout.split(/\r?\n/u).filter(line => line !== '').length >= 2);
        const failure = Object.assign(new Error(`${source} failed`), source === 'stdout' ? { code: 'EPIPE' } : {});
        if (source === 'stdin') input.emit('error', failure);
        else output.emit('error', failure);
        await expect(running).resolves.toBe(1);
    }
});

test('common host composition starts reading, sends Ready, initializes, declares, holds, and invokes in exact order', async () => {
    const channel = new FakeAssignedChannel();
    const session = startRvmHostWithChannel(channel);
    await waitUntil(() => channel.operations.includes('broadcast:ViewModelReadyChannel:["Ready"]'));
    expect(channel.operations.slice(0, 2)).toEqual([
        'start-read',
        'broadcast:ViewModelReadyChannel:["Ready"]',
    ]);
    channel.receive({
        senderClientId: 1,
        channelName: 'ViewModelChannel',
        messageBody: JSON.stringify([{ rpcChannelingSystem: 'Login', serverClientId: 1 }]),
    });
    await session.startup;
    expect(channel.sent[0]).toMatchObject({
        rpcMethod: 'Request:IRpcDispatcher_DeclareRemoteService',
        sourceClientId: 3,
        ref: { clientId: 3, objectId: 0, typeId: 0 },
    });

    channel.holdWrite = deferred<void>();
    let held = false;
    void session.serviceHeld.then(() => { held = true; });
    channel.receive({
        senderClientId: 2,
        channelName: 'ViewModelChannel',
        messageBody: JSON.stringify([{
            rpcMethod: 'Request:IObjectOps_ObjectHold', rpcRequestId: 100,
            sourceClientId: 2, targetClientId: 3,
            ref: { clientId: 3, objectId: 0, typeId: 0 }, remoteClientId: 2, hold: true,
        }]),
    });
    await waitUntil(() => channel.sent.some(message => message.rpcMethod === 'Response:IObjectOps_ObjectHold'));
    expect(held).toBe(false);
    channel.holdWrite.resolve();
    await session.serviceHeld;
    expect(held).toBe(true);

    channel.receive({
        senderClientId: 2,
        channelName: 'ViewModelChannel',
        messageBody: JSON.stringify([{
            rpcMethod: 'Request:IObjectOps_InvokeMethod', rpcRequestId: 101,
            sourceClientId: 2, targetClientId: 3,
            ref: { clientId: 3, objectId: 0, typeId: 0 }, methodId: 1, arguments: ['Alice'],
        }]),
    });
    await waitUntil(() => channel.sent.some(message => message.rpcMethod === 'Response:IObjectOps_InvokeMethod'));
    expect(channel.sent.find(message => message.rpcMethod === 'Response:IObjectOps_InvokeMethod')).toMatchObject({
        rpcRequestId: 101,
        response: 'Hello, Alice!',
    });
    session.stop();
    expect(await session.completion).toEqual({ type: 'stopped' });
    expect(channel.stopCount).toBe(1);
});

function fakeSignal(): RvmHostSignalBarrier & { readonly fire: () => void; readonly disposed: () => boolean } {
    const barrier = deferred<void>();
    let isDisposed = false;
    return {
        promise: barrier.promise,
        fire: () => barrier.resolve(),
        dispose: () => { isDisposed = true; },
        disposed: () => isDisposed,
    };
}

function fakeHostSession(): RvmHostSession & {
    readonly resolveStartup: () => void;
    readonly resolveHeld: () => void;
    readonly fail: (error: Error) => void;
    readonly stopCount: () => number;
} {
    const startup = deferred<void>();
    const held = deferred<void>();
    const completion = deferred<Awaited<RvmHostSession['completion']>>();
    let stops = 0;
    return {
        channel: {} as IChannelClient,
        endpoint: {} as RvmHostSession['endpoint'],
        startup: startup.promise,
        serviceHeld: held.promise,
        completion: completion.promise,
        resolveStartup: () => startup.resolve(),
        resolveHeld: () => held.resolve(),
        fail: error => completion.resolve({ type: 'failed', error }),
        stopCount: () => stops,
        stop: () => { stops++; },
    };
}

class FakeProbe implements IChannelClient {
    readonly clientId = undefined;
    readonly state = 'connecting' as const;
    private readonly terminal = deferred<ChannelCompletion>();
    readonly completion = this.terminal.promise;
    stopCount = 0;
    constructor(private readonly connecting: Promise<void>) {}
    connect(): Promise<void> { return this.connecting; }
    start(): Promise<void> { return Promise.resolve(); }
    onMessage(): () => void { return () => undefined; }
    sendToClient(): Promise<void> { return Promise.resolve(); }
    broadcast(): Promise<void> { return Promise.resolve(); }
    stop(): void {
        if (this.stopCount++ === 0) this.terminal.resolve({ type: 'stopped' });
    }
}

test('network CLI service-only mode emits only the held marker and signal cancels every startup stage', async () => {
    for (const stage of ['startup', 'held', 'running'] as const) {
        const host = fakeHostSession();
        const signal = fakeSignal();
        const output: string[] = [];
        let probes = 0;
        const dependencies: NetworkRvmHostCliDependencies = {
            startHost: () => host,
            createProbe: () => { probes++; return new FakeProbe(new Promise<void>(() => undefined)); },
            waitForSignal: () => signal,
            writeOutput: line => output.push(line),
            retryDelay: () => Promise.resolve(),
        };
        const running = runNetworkRvmHostCli({
            mode: 'network', origin: 'http://localhost:8888', basePath: '/test', serviceOnly: true,
        }, dependencies);
        if (stage !== 'startup') host.resolveStartup();
        if (stage === 'running') host.resolveHeld();
        if (stage === 'running') await waitUntil(() => output.length === 1);
        else await Promise.resolve();
        signal.fire();
        await expect(running).resolves.toBe(0);
        expect(probes).toBe(0);
        expect(output).toEqual(stage === 'running' ? ['GACJS_RVMHOST_SERVICE_HELD\n'] : []);
        expect(host.stopCount()).toBe(1);
        expect(signal.disposed()).toBe(true);
    }
});

test('network CLI retries a rejected pre-assignment probe and cancels the outstanding replacement on signal or host failure', async () => {
    for (const terminal of ['signal', 'failure'] as const) {
        const host = fakeHostSession();
        host.resolveStartup();
        host.resolveHeld();
        const signal = fakeSignal();
        const output: string[] = [];
        const probes: FakeProbe[] = [];
        const pending = new Promise<void>(() => undefined);
        const dependencies: NetworkRvmHostCliDependencies = {
            startHost: () => host,
            createProbe: () => {
                const probe = new FakeProbe(probes.length === 0
                    ? Promise.reject(new HttpChannelConnectionError(false))
                    : pending);
                probes.push(probe);
                return probe;
            },
            waitForSignal: () => signal,
            writeOutput: line => output.push(line),
            retryDelay: () => Promise.resolve(),
        };
        const running = runNetworkRvmHostCli({
            mode: 'network', origin: 'http://localhost:8888', basePath: '/test', serviceOnly: false,
        }, dependencies);
        await waitUntil(() => probes.length === 2);
        if (terminal === 'signal') {
            signal.fire();
            await expect(running).resolves.toBe(0);
        } else {
            const failure = new Error('host failed');
            host.fail(failure);
            await expect(running).rejects.toBe(failure);
        }
        expect(probes[0].stopCount).toBe(1);
        expect(probes[1].stopCount).toBe(1);
        expect(output).toEqual(['GACJS_RVMHOST_SERVICE_HELD\n']);
        expect(signal.disposed()).toBe(true);
    }
});

test('network CLI accepts a fresh probe and emits Ready only after probe cleanup', async () => {
    const host = fakeHostSession();
    host.resolveStartup();
    host.resolveHeld();
    const signal = fakeSignal();
    const output: string[] = [];
    const probes: FakeProbe[] = [];
    let readyAfterProbeCleanup = false;
    const dependencies: NetworkRvmHostCliDependencies = {
        startHost: () => host,
        createProbe: () => {
            const probe = new FakeProbe(probes.length === 0
                ? Promise.reject(new HttpChannelConnectionError(false))
                : Promise.resolve());
            probes.push(probe);
            return probe;
        },
        waitForSignal: () => signal,
        writeOutput: line => {
            if (line === 'GACJS_RVMHOST_READY\n') readyAfterProbeCleanup = probes[1]?.stopCount === 1;
            output.push(line);
        },
        retryDelay: () => Promise.resolve(),
    };
    const running = runNetworkRvmHostCli({
        mode: 'network', origin: 'http://localhost:8888', basePath: '/test', serviceOnly: false,
    }, dependencies);
    await waitUntil(() => output.length === 2);
    expect(output).toEqual(['GACJS_RVMHOST_SERVICE_HELD\n', 'GACJS_RVMHOST_READY\n']);
    expect(probes).toHaveLength(2);
    expect(probes.map(probe => probe.stopCount)).toEqual([1, 1]);
    expect(readyAfterProbeCleanup).toBe(true);
    signal.fire();
    await expect(running).resolves.toBe(0);
    expect(host.stopCount()).toBe(1);
    expect(signal.disposed()).toBe(true);
});

interface TranscriptProcess {
    readonly command: string;
    readonly arguments: readonly string[];
    readonly name: string;
}

async function runTranscript(specification: TranscriptProcess): Promise<void> {
    const child = spawn(specification.command, specification.arguments, {
        cwd: path.resolve(import.meta.dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    const lines: string[] = [];
    const waiters: ((line: string) => void)[] = [];
    child.stdout.on('data', chunk => {
        stdout += String(chunk);
        while (true) {
            const newline = stdout.indexOf('\n');
            if (newline < 0) break;
            const line = stdout.substring(0, newline).replace(/\r$/u, '');
            stdout = stdout.substring(newline + 1);
            const waiter = waiters.shift();
            if (waiter === undefined) lines.push(line);
            else waiter(line);
        }
    });
    child.stderr.on('data', chunk => { stderr += String(chunk); });
    const nextLine = async (): Promise<string> => {
        const existing = lines.shift();
        if (existing !== undefined) return existing;
        return await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`${specification.name} stdout timeout; stderr=${stderr}`)), 5000);
            waiters.push(line => {
                clearTimeout(timeout);
                resolve(line);
            });
        });
    };
    const sendPackage = (networkPackage: string): void => {
        child.stdin.write(encodeStdioMessage(networkPackage), 'ascii');
    };
    const readPackage = async () => {
        const encoded = await nextLine();
        const decoded = decodeStdioBase64(encoded);
        if (decoded === undefined) throw new Error(`${specification.name} emitted nonprotocol stdout: ${encoded}`);
        return parseNetworkPackage(decoded);
    };

    expect(await nextLine()).toBe(STDIO_JOIN_GOLDEN);
    sendPackage('3;;');
    expect(await nextLine()).toBe(STDIO_READY_GOLDEN);
    sendPackage(serializeNetworkPackage({
        clientId: 1,
        channelName: 'ViewModelChannel',
        messageBody: JSON.stringify([{ rpcChannelingSystem: 'Login', serverClientId: 1 }]),
    }));
    const declaration = await readPackage();
    expect(declaration.clientId).toBe(1);
    expect(JSON.parse(declaration.messageBody)).toMatchObject([{
        rpcMethod: 'Request:IRpcDispatcher_DeclareRemoteService',
        sourceClientId: 3,
        ref: { clientId: 3, objectId: 0, typeId: 0 },
    }]);

    sendPackage(serializeNetworkPackage({
        clientId: 2,
        channelName: 'ViewModelChannel',
        messageBody: JSON.stringify([{
            rpcMethod: 'Request:IObjectOps_ObjectHold', rpcRequestId: 100,
            sourceClientId: 2, targetClientId: 3,
            ref: { clientId: 3, objectId: 0, typeId: 0 }, remoteClientId: 2, hold: true,
        }]),
    }));
    const hold = await readPackage();
    expect(JSON.parse(hold.messageBody)).toMatchObject([{
        rpcMethod: 'Response:IObjectOps_ObjectHold', rpcRequestId: 100,
        sourceClientId: 3, targetClientId: 2,
    }]);

    sendPackage(serializeNetworkPackage({
        clientId: 2,
        channelName: 'ViewModelChannel',
        messageBody: JSON.stringify([{
            rpcMethod: 'Request:IObjectOps_InvokeMethod', rpcRequestId: 101,
            sourceClientId: 2, targetClientId: 3,
            ref: { clientId: 3, objectId: 0, typeId: 0 }, methodId: 1, arguments: ['Alice'],
        }]),
    }));
    const invocation = await readPackage();
    expect(JSON.parse(invocation.messageBody)).toMatchObject([{
        rpcMethod: 'Response:IObjectOps_InvokeMethod', rpcRequestId: 101,
        sourceClientId: 3, targetClientId: 2, response: 'Hello, Alice!',
    }]);

    child.stdin.write('!Exit\n', 'ascii');
    const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
        const timeout = setTimeout(() => {
            child.kill();
            reject(new Error(`${specification.name} did not exit after !Exit; stderr=${stderr}`));
        }, 5000);
        child.once('exit', (code, signal) => {
            clearTimeout(timeout);
            resolve({ code, signal });
        });
    });
    expect(exit).toEqual({ code: 1, signal: null });
    expect(stdout).toBe('');
}

async function runUnexpectedEof(specification: TranscriptProcess): Promise<void> {
    const child = spawn(specification.command, specification.arguments, {
        cwd: path.resolve(import.meta.dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += String(chunk); });
    child.stderr.on('data', chunk => { stderr += String(chunk); });
    await waitUntil(() => stdout.includes('\n'));
    const lines = stdout.split(/\r?\n/u);
    expect(lines.shift()).toBe(STDIO_JOIN_GOLDEN);
    stdout = lines.join('\n');
    child.stdin.write(encodeStdioMessage('3;;'), 'ascii');
    await waitUntil(() => stdout.includes('\n'));
    expect(stdout.split(/\r?\n/u)[0]).toBe(STDIO_READY_GOLDEN);
    child.stdin.end();
    const exit = await new Promise<{ readonly code: number | null; readonly signal: NodeJS.Signals | null }>((resolve, reject) => {
        const timeout = setTimeout(() => {
            child.kill();
            reject(new Error(`${specification.name} did not exit after stdin EOF; stderr=${stderr}`));
        }, 5000);
        child.once('exit', (code, signal) => {
            clearTimeout(timeout);
            resolve({ code, signal });
        });
    });
    expect(exit).toEqual({ code: 1, signal: null });
}

test('Node ESM CLI and native SEA both match the Core stdio transcript and exit 1 on !Exit', async () => {
    const packageRoot = path.resolve(import.meta.dirname, '..');
    const executable = path.join(packageRoot, 'lib', 'bin', process.platform === 'win32' ? 'gacjs-rvmhost.exe' : 'gacjs-rvmhost');
    await runTranscript({
        name: 'Node CLI',
        command: process.execPath,
        arguments: [path.join(packageRoot, 'lib', 'src', 'cli.js'), '/Cli'],
    });
    await runTranscript({ name: 'SEA', command: executable, arguments: ['/Cli'] });

    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gacjs rvmhost path '));
    try {
        const copiedExecutable = path.join(temporary, process.platform === 'win32' ? 'native launcher.exe' : 'native launcher');
        fs.copyFileSync(executable, copiedExecutable);
        if (process.platform !== 'win32') fs.chmodSync(copiedExecutable, 0o755);
        await runTranscript({ name: 'SEA in path containing spaces', command: copiedExecutable, arguments: ['/Cli'] });
    } finally {
        fs.rmSync(temporary, { recursive: true, force: true });
    }
});

test('Node ESM CLI and native SEA both exit 1 on unexpected stdin EOF', async () => {
    const packageRoot = path.resolve(import.meta.dirname, '..');
    const executable = path.join(packageRoot, 'lib', 'bin', process.platform === 'win32' ? 'gacjs-rvmhost.exe' : 'gacjs-rvmhost');
    await runUnexpectedEof({
        name: 'Node CLI',
        command: process.execPath,
        arguments: [path.join(packageRoot, 'lib', 'src', 'cli.js'), '/Cli'],
    });
    await runUnexpectedEof({ name: 'SEA', command: executable, arguments: ['/Cli'] });
});

test('native SEA accepts exact /Cli exclusively', async () => {
    const packageRoot = path.resolve(import.meta.dirname, '..');
    const executable = path.join(packageRoot, 'lib', 'bin', process.platform === 'win32' ? 'gacjs-rvmhost.exe' : 'gacjs-rvmhost');
    const result = await new Promise<{ readonly code: number | null; readonly stdout: string; readonly stderr: string }>((resolve, reject) => {
        const child = spawn(executable, ['/Cli', '--service-only'], {
            cwd: packageRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', chunk => { stdout += String(chunk); });
        child.stderr.on('data', chunk => { stderr += String(chunk); });
        child.once('error', reject);
        child.once('exit', code => resolve({ code, stdout, stderr }));
    });
    expect(result.code).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Exact /Cli must be the sole argument.');
});

test('the public browser export bundles without Node-only modules', async () => {
    const packageRoot = path.resolve(import.meta.dirname, '..');
    const result = await build({
        stdin: {
            contents: 'import { startBrowserRvmHost } from "@gaclib-website/rvmhost"; globalThis.startBrowserRvmHost = startBrowserRvmHost;',
            resolveDir: packageRoot,
        },
        bundle: true,
        platform: 'browser',
        format: 'esm',
        target: 'es2022',
        write: false,
        logLevel: 'silent',
    });
    expect(result.outputFiles).toHaveLength(1);
    expect(result.outputFiles[0].text).not.toContain('node:fs');
    expect(result.outputFiles[0].text).not.toContain('node:stream');
    expect(result.outputFiles[0].text).not.toContain('child_process');
});
