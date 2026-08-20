import { IRemoteProtocolRequests } from '@gaclib/remote-protocol';
import { afterEach, expect, test, vi } from 'vitest';
import {
    connectHttpServer,
    RemoteProtocolHttpDisconnectError
} from '../src/index';

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
