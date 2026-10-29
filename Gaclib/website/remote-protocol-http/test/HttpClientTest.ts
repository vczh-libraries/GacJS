import { IRemoteProtocolRequests } from '@gaclib/remote-protocol';
import { afterEach, expect, test, vi } from 'vitest';
import {
    connectHttpServer,
    createRemoteProtocolClient,
    RemoteProtocolHttpDisconnectError
} from '../src/index';
import { IChannelClient } from '../src/channel';

const host = 'http://localhost:8888';
const baseUrl = '/GacUIRemoteProtocolHttp/VlppInterProcess';
const requestUrl = `${baseUrl}/Request/test-token`;
const responseUrl = `${baseUrl}/Response/test-token`;

function createResponse(status: number, text: string): Response {
    return {
        status,
        statusText: status === 200 ? 'OK' : 'Not Found',
        text: () => Promise.resolve(text),
    } as Response;
}

async function connectWithRequest(
    request: () => Promise<Response>,
    response: () => Promise<Response> = () => Promise.resolve(createResponse(200, ''))
): Promise<{
    client: Awaited<ReturnType<typeof connectHttpServer>>,
    requestCount: () => number,
    responseCount: () => number
}> {
    let responseCount = 0;
    let requestCount = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        const url = String(input);
        if (url === `${host}${baseUrl}/Connect`) {
            return createResponse(200, `${requestUrl};${responseUrl}`);
        }
        if (url === `${host}${responseUrl}`) {
            responseCount++;
            if (responseCount === 1) {
                return createResponse(200, '2;;');
            }
            return await response();
        }
        if (url === `${host}${requestUrl}`) {
            requestCount++;
            return await request();
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const requests = {} as IRemoteProtocolRequests;
    const client = await connectHttpServer(host, requests);
    return {
        client,
        requestCount: () => requestCount,
        responseCount: () => responseCount
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
});

test('renderer handshake defaults capabilities off and advertises each selected capability', async () => {
    vi.stubGlobal('navigator', { platform: 'Win32' });
    for (let mask = 0; mask < 8; mask++) {
        const sent: { name: string; arguments: Record<string, unknown> }[] = [];
        const channel = {
            clientId: 2,
            onMessage: () => () => undefined,
            sendToClient: (_id: number, _name: string, body: string) => { sent.push(...JSON.parse(body) as typeof sent); return Promise.resolve(); },
            start: () => Promise.resolve(),
            stop: () => undefined,
        } as unknown as IChannelClient;
        const options = mask === 0 ? undefined : {
            injectDateTime: (mask & 1) !== 0, injectLocale: (mask & 2) !== 0, injectFileSystem: (mask & 4) !== 0,
        };
        const client = createRemoteProtocolClient({} as IRemoteProtocolRequests, channel, options);
        await client.start();
        expect(sent[0].name).toBe('ControllerConnect');
        expect(sent[0].arguments).toMatchObject({
            injectDateTime: (mask & 1) !== 0, injectLocale: (mask & 2) !== 0, injectFileSystem: (mask & 4) !== 0,
        });
        client.stop();
        client.responses.RespondInjectionLocale(42, ['late response']);
        expect(sent).toHaveLength(1);
    }
});

test('a failed long-poll request is a terminal disconnect without retrying', async () => {
    const { client, requestCount } = await connectWithRequest(
        () => Promise.reject(new TypeError('fetch failed'))
    );

    await expect(client.start()).rejects.toBeInstanceOf(RemoteProtocolHttpDisconnectError);
    await Promise.resolve();

    expect(requestCount()).toBe(1);
});

test('a non-success long-poll response is a terminal disconnect without retrying', async () => {
    const { client, requestCount } = await connectWithRequest(
        () => Promise.resolve(createResponse(404, ''))
    );

    await expect(client.start()).rejects.toBeInstanceOf(RemoteProtocolHttpDisconnectError);
    await Promise.resolve();

    expect(requestCount()).toBe(1);
});

test('a failed long-poll response body is a terminal disconnect without retrying', async () => {
    const { client, requestCount } = await connectWithRequest(
        () => Promise.resolve({
            status: 200,
            statusText: 'OK',
            text: () => Promise.reject(new TypeError('response body failed')),
        } as Response)
    );

    await expect(client.start()).rejects.toBeInstanceOf(RemoteProtocolHttpDisconnectError);
    await Promise.resolve();

    expect(requestCount()).toBe(1);
});

test('a failed response POST interrupts an outstanding long poll', async () => {
    const longPoll = new Promise<Response>(() => {});
    const { client, requestCount, responseCount } = await connectWithRequest(
        () => longPoll,
        () => Promise.reject(new TypeError('fetch failed'))
    );

    await expect(client.start()).rejects.toBeInstanceOf(RemoteProtocolHttpDisconnectError);
    await Promise.resolve();

    expect(requestCount()).toBe(1);
    expect(responseCount()).toBe(2);
});

test('a Core ErrorChannel payload is preserved instead of becoming a transport disconnect', async () => {
    const { client } = await connectWithRequest(
        () => Promise.resolve(createResponse(200, '1;!Error;RemotingTest_RvmHost disconnected.'))
    );

    const failure = await client.start().catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect(failure).not.toBeInstanceOf(RemoteProtocolHttpDisconnectError);
    expect((failure as Error).message).toBe('RemotingTest_RvmHost disconnected.');
});
