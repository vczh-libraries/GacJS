import {
    IRemoteProtocolRequests,
    IRemoteProtocolResponses,
    IRemoteProtocolEvents,
    ProtocolInvoking,
    ProtocolInvokingHandler,
    ResponseToJson,
    EventToJson
} from '@gaclib/remote-protocol';

export interface IRemoteProtocolHttpClient {
    get responses(): IRemoteProtocolResponses;
    get events(): IRemoteProtocolEvents;
    start(): void;
}

interface ConnectResponse {
    request: string;
    response: string;
}

class HttpClientImpl implements IRemoteProtocolHttpClient {
    public responses: IRemoteProtocolResponses;
    public events: IRemoteProtocolEvents;

    // @ts-expect-error: TS6138
    constructor(private requests: IRemoteProtocolRequests, private urls: ConnectResponse) {
        const callback: ProtocolInvokingHandler = (invoking => this.sendRequest(invoking));
        this.responses = new ResponseToJson(callback);
        this.events = new EventToJson(callback);
    }

    sendRequest(invoking: ProtocolInvoking): void {
        throw new Error(JSON.stringify(invoking, undefined, 4));
    }

    start(): void {
        throw new Error(JSON.stringify(this.urls, undefined, 4));
    }
}

async function sendConnect(url: string): Promise<ConnectResponse> {
    let response: Response;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(`Failed to connect to ${url}`, { cause: error });
        } else {
            throw error;
        }
    }

    if (response.status === 200) {
        try {
            return await response.json() as ConnectResponse;
        } catch (error) {
            throw new Error(`Failed to parse response JSON from ${url}`, { cause: error });
        }
    } else {
        throw new Error(`[${response.status}: ${response.statusText}]: ${url}`);
    }
}

export async function connectHttpServer(host: string, requests: IRemoteProtocolRequests): Promise<IRemoteProtocolHttpClient> {
    const urls = await sendConnect(`http://${host}/GacUIRemoting/Connect`);
    const impl = new HttpClientImpl(requests, urls);
    return impl;
}