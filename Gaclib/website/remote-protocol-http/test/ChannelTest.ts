import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect, test, vi } from 'vitest';
import {
    HttpChannelClient,
    HttpChannelConnectionError,
    parseNetworkPackage,
    serializeNetworkPackage,
} from '../src/index.js';

function response(text: string, status = 200): Response {
    return { status, text: () => Promise.resolve(text) } as Response;
}

test('the public channel subpath imports without renderer, fetch, or Node dependencies', async () => {
    const channel = await import('@gaclib-website/remote-protocol-http/channel');
    expect(channel.parseNetworkPackage(';;')).toEqual({ channelName: '', messageBody: '' });
    const directRoot = path.resolve(import.meta.dirname, '..');
    const packageRoot = fs.existsSync(path.join(directRoot, 'package.json')) ? directRoot : path.resolve(directRoot, '..');
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
        readonly exports: Record<string, unknown>;
    };
    expect(packageJson.exports['./channel']).toBeDefined();
    const emitted = fs.readFileSync(path.join(packageRoot, 'lib', 'src', 'channel.js'), 'utf8');
    expect(emitted).not.toMatch(/renderer|fetch|node:/u);
    expect(emitted).not.toMatch(/^import\s/mu);
});

test('network package codec preserves multi-client fields and rejects malformed or unsafe IDs', () => {
    const value = { clientId: 7, extraClientIds: [8, 9], channelName: 'Channel', messageBody: 'a;b;c' };
    expect(parseNetworkPackage(serializeNetworkPackage(value))).toEqual(value);
    expect(parseNetworkPackage(';;')).toEqual({ channelName: '', messageBody: '' });
    for (const malformed of ['missing', '1;missing', '01;;', '1,;;', '9007199254740992;;']) {
        expect(() => parseNetworkPackage(malformed)).toThrow();
    }
    expect(() => serializeNetworkPackage({ clientId: Number.MAX_SAFE_INTEGER + 1, channelName: '', messageBody: '' })).toThrow();
});

test('two HTTP channel clients have independent assignments, polling, and completion', async () => {
    let nextToken = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        if (url.endsWith('/Connect')) {
            const token = ++nextToken;
            return Promise.resolve(response(`/Request/${String(token)};/Response/${String(token)}`));
        }
        const responseMatch = /\/Response\/(\d+)$/u.exec(url);
        if (responseMatch !== null) return Promise.resolve(response(`${String(Number(responseMatch[1]) + 10)};;`));
        if (/\/Request\/\d+$/u.test(url)) {
            return new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    const first = new HttpChannelClient({ channelNames: ['A'], fetch: fetchMock as typeof fetch });
    const second = new HttpChannelClient({ channelNames: ['B'], fetch: fetchMock as typeof fetch });
    await Promise.all([first.connect(), second.connect()]);
    expect(first.clientId).toBe(11);
    expect(second.clientId).toBe(12);
    const firstReading = first.start();
    const secondReading = second.start();
    first.stop();
    await expect(firstReading).resolves.toBeUndefined();
    expect(second.state).toBe('assigned');
    second.stop();
    await expect(secondReading).resolves.toBeUndefined();
    expect(await first.completion).toEqual({ type: 'stopped' });
    expect(await second.completion).toEqual({ type: 'stopped' });
});

test('pre-assignment failure is distinguishable and assigned write/read races settle once', async () => {
    const rejected = new HttpChannelClient({
        channelNames: ['A'],
        fetch: (() => Promise.resolve(response('', 503))) as typeof fetch,
    });
    await expect(rejected.connect()).rejects.toMatchObject({ assigned: false });
    expect((await rejected.completion).type).toBe('failed');

    let responsePosts = 0;
    const assigned = new HttpChannelClient({
        channelNames: ['A'],
        fetch: ((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const url = String(input);
            if (url.endsWith('/Connect')) return Promise.resolve(response('/Request/race;/Response/race'));
            if (url.endsWith('/Response/race')) {
                responsePosts++;
                return responsePosts === 1
                    ? Promise.resolve(response('3;;'))
                    : Promise.reject(new Error('write failed'));
            }
            return new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
        }) as typeof fetch,
    });
    await assigned.connect();
    const reading = assigned.start();
    await expect(assigned.broadcast('A', 'payload')).rejects.toBeInstanceOf(HttpChannelConnectionError);
    await expect(reading).rejects.toMatchObject({ assigned: true });
    const completion = await assigned.completion;
    expect(completion.type).toBe('failed');
    assigned.stop();
    expect(await assigned.completion).toBe(completion);
});

test('generic HTTP channel joins exact channels, serializes sends, handles piggyback messages, and aborts an idle read', async () => {
    const posts: string[] = [];
    let postCount = 0;
    let readAborted = false;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        if (url.endsWith('/Connect')) return Promise.resolve(response('/Request/token;/Response/token'));
        if (url.endsWith('/Response/token')) {
            posts.push(String(init?.body ?? ''));
            postCount++;
            if (postCount === 1) return Promise.resolve(response('3;;'));
            if (postCount === 2) return Promise.resolve(response('9;A;hello'));
            return Promise.resolve(response(''));
        }
        if (url.endsWith('/Request/token')) {
            return new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    readAborted = true;
                    reject(new DOMException('aborted', 'AbortError'));
                });
            });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    const channel = new HttpChannelClient({
        channelNames: ['A', 'B'],
        fetch: fetchMock as typeof fetch,
    });
    await channel.connect();
    expect(channel.clientId).toBe(3);
    expect(posts[0]).toBe(';;A!B');
    const messages: string[] = [];
    channel.onMessage(message => { messages.push(message.messageBody); });
    await Promise.all([
        channel.sendToClient(9, 'A', 'first'),
        channel.broadcast('B', 'second', [8, 9]),
    ]);
    expect(posts.slice(1)).toEqual(['9;A;first', ',8,9;B;second']);
    expect(messages).toEqual(['hello']);
    const reading = channel.start();
    await Promise.resolve();
    channel.stop();
    await expect(reading).resolves.toBeUndefined();
    expect(await channel.completion).toEqual({ type: 'stopped' });
    expect(readAborted).toBe(true);
});
