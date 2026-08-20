import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable, Writable } from 'node:stream';
import {
    DEFAULT_HTTP_CHANNEL_BASE_PATH,
    DEFAULT_HTTP_CHANNEL_ORIGIN,
    HttpChannelClient,
    HttpChannelConnectionError,
} from '@gaclib-website/remote-protocol-http/http-channel';
import { IChannelClient } from '@gaclib-website/remote-protocol-http/channel';
import {
    RvmHostSession,
    startBrowserRvmHost,
    startRvmHostWithChannel,
} from './index.js';
import { StdioChannelClient } from './stdio.js';

export type RvmHostCliOptions =
    | { readonly mode: 'stdio' }
    | {
        readonly mode: 'network';
        readonly origin: string;
        readonly basePath: string;
        readonly serviceOnly: boolean;
    };

function validateOrigin(origin: string): void {
    const url = new URL(origin);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.pathname !== '/' || url.search !== '' || url.hash !== '') {
        throw new Error(`Invalid --origin value: ${origin}`);
    }
}

function validateBasePath(basePath: string): void {
    if (!basePath.startsWith('/') || basePath.endsWith('/') || basePath.includes('?') || basePath.includes('#')) {
        throw new Error(`Invalid --base-path value: ${basePath}`);
    }
}

export function parseRvmHostArguments(arguments_: readonly string[]): RvmHostCliOptions {
    if (arguments_.length === 1 && arguments_[0] === '/Cli') {
        return { mode: 'stdio' };
    }
    if (arguments_.some(argument => argument === '/Cli')) {
        throw new Error('Exact /Cli must be the sole argument.');
    }
    let origin = DEFAULT_HTTP_CHANNEL_ORIGIN;
    let basePath = DEFAULT_HTTP_CHANNEL_BASE_PATH;
    let serviceOnly = false;
    let originSeen = false;
    let basePathSeen = false;
    for (let index = 0; index < arguments_.length; index++) {
        const argument = arguments_[index];
        if (argument === '--origin' || argument === '--base-path') {
            const value = arguments_[++index];
            if (value === undefined || value.startsWith('--')) {
                throw new Error(`${argument} requires a value.`);
            }
            if (argument === '--origin') {
                if (originSeen) throw new Error('Duplicate --origin option.');
                originSeen = true;
                origin = value;
            } else {
                if (basePathSeen) throw new Error('Duplicate --base-path option.');
                basePathSeen = true;
                basePath = value;
            }
        } else if (argument === '--service-only') {
            if (serviceOnly) throw new Error('Duplicate --service-only option.');
            serviceOnly = true;
        } else {
            throw new Error(`Unknown RVM host argument: ${argument}`);
        }
    }
    validateOrigin(origin);
    validateBasePath(basePath);
    return { mode: 'network', origin, basePath, serviceOnly };
}

export interface RvmHostSignalBarrier {
    readonly promise: Promise<void>;
    readonly dispose: () => void;
}

function waitForSignal(): RvmHostSignalBarrier {
    let resolve: (() => void) | undefined;
    const promise = new Promise<void>(resolvePromise => { resolve = resolvePromise; });
    if (resolve === undefined) throw new Error('Failed to create signal barrier.');
    const handler = (): void => resolve?.();
    process.once('SIGINT', handler);
    process.once('SIGTERM', handler);
    return {
        promise,
        dispose: () => {
            process.off('SIGINT', handler);
            process.off('SIGTERM', handler);
        },
    };
}

export interface NetworkRvmHostCliDependencies {
    readonly startHost: (options: { readonly origin: string; readonly basePath: string }) => RvmHostSession;
    readonly createProbe: (options: { readonly origin: string; readonly basePath: string }) => IChannelClient;
    readonly waitForSignal: () => RvmHostSignalBarrier;
    readonly writeOutput: (line: string) => void;
    readonly retryDelay: () => Promise<void>;
}

const defaultNetworkDependencies: NetworkRvmHostCliDependencies = {
    startHost: options => startBrowserRvmHost(options),
    createProbe: options => new HttpChannelClient({ ...options, channelNames: ['GacUIRemoteProtocol'] }),
    waitForSignal,
    writeOutput: line => { process.stdout.write(line); },
    retryDelay: async () => await new Promise<void>(resolve => setTimeout(resolve, 25)),
};

type NetworkTerminal =
    | { readonly type: 'signal' }
    | { readonly type: 'completion'; readonly completion: Awaited<RvmHostSession['completion']> };

function networkTerminal(session: RvmHostSession, signal: RvmHostSignalBarrier): Promise<NetworkTerminal> {
    return Promise.race([
        session.completion.then(completion => ({ type: 'completion' as const, completion })),
        signal.promise.then(() => ({ type: 'signal' as const })),
    ]);
}

type NetworkStageResult<T> =
    | { readonly completed: true; readonly value: T }
    | { readonly completed: false };

async function waitForNetworkStage<T>(stage: Promise<T>, terminal: Promise<NetworkTerminal>): Promise<NetworkStageResult<T>> {
    const result = await Promise.race([
        stage.then(value => ({ type: 'stage' as const, value })),
        terminal,
    ]);
    if (result.type === 'stage') return { completed: true, value: result.value };
    if (result.type === 'signal') return { completed: false };
    if (result.completion.type === 'failed') throw result.completion.error;
    throw new Error('RVM host stopped during network CLI startup.');
}

async function probeRenderer(
    options: Extract<RvmHostCliOptions, { mode: 'network' }>,
    terminal: Promise<NetworkTerminal>,
    dependencies: NetworkRvmHostCliDependencies,
): Promise<boolean> {
    while (true) {
        const probe = dependencies.createProbe({ origin: options.origin, basePath: options.basePath });
        try {
            const assigned = await waitForNetworkStage(probe.connect(), terminal);
            if (!assigned.completed) {
                probe.stop();
                await probe.completion;
                return false;
            }
            probe.stop();
            await probe.completion;
            return true;
        } catch (error) {
            probe.stop();
            if (!(error instanceof HttpChannelConnectionError) || error.assigned) throw error;
            const retry = await waitForNetworkStage(dependencies.retryDelay(), terminal);
            if (!retry.completed) return false;
        }
    }
}

export async function runNetworkRvmHostCli(
    options: Extract<RvmHostCliOptions, { mode: 'network' }>,
    dependencies: NetworkRvmHostCliDependencies = defaultNetworkDependencies,
): Promise<number> {
    const signal = dependencies.waitForSignal();
    let session: RvmHostSession | undefined;
    try {
        session = dependencies.startHost({ origin: options.origin, basePath: options.basePath });
        const terminal = networkTerminal(session, signal);
        if (!(await waitForNetworkStage(session.startup, terminal)).completed) return 0;
        if (!(await waitForNetworkStage(session.serviceHeld, terminal)).completed) return 0;
        dependencies.writeOutput('GACJS_RVMHOST_SERVICE_HELD\n');
        if (!options.serviceOnly) {
            if (!await probeRenderer(options, terminal, dependencies)) return 0;
            dependencies.writeOutput('GACJS_RVMHOST_READY\n');
        }
        const result = await terminal;
        if (result.type === 'signal') {
            return 0;
        }
        if (result.completion.type === 'failed') throw result.completion.error;
        return 0;
    } finally {
        signal.dispose();
        session?.stop();
    }
}

function writePidFile(): void {
    const pidFile = process.env.GACJS_RVMHOST_PID_FILE;
    if (pidFile === undefined) return;
    if (!path.isAbsolute(pidFile)) throw new Error('GACJS_RVMHOST_PID_FILE must be absolute.');
    fs.writeFileSync(pidFile, String(process.pid), 'utf8');
}

export async function runStdioRvmHostCli(input: Readable = process.stdin, output: Writable = process.stdout): Promise<number> {
    writePidFile();
    const channel = new StdioChannelClient(input, output);
    await channel.connect();
    const session = startRvmHostWithChannel(channel);
    await session.completion;
    session.endpoint.finalize();
    channel.stop();
    return 1;
}

export function runtimeArguments(): string[] {
    return process.argv.slice(2);
}

export async function runRvmHostCli(arguments_: readonly string[]): Promise<number> {
    const options = parseRvmHostArguments(arguments_);
    return options.mode === 'stdio' ? await runStdioRvmHostCli() : await runNetworkRvmHostCli(options);
}
