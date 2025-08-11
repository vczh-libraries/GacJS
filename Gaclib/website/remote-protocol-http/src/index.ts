import {
    IRemoteProtocolRequests,
    IRemoteProtocolResponses,
    IRemoteProtocolEvents,
    ProtocolInvoking,
    ProtocolInvokingHandler,
    jsonToRequest,
    ResponseToJson,
    EventToJson
} from '@gaclib/remote-protocol';

export interface IRemoteProtocolHttpClient {
    get responses(): IRemoteProtocolResponses;
    get events(): IRemoteProtocolEvents;
    start(): Promise<void>;
}

interface ConnectResponse {
    request: string;
    response: string;
}

class HttpClientImpl implements IRemoteProtocolHttpClient {
    public responses: IRemoteProtocolResponses;
    public events: IRemoteProtocolEvents;

    constructor(private requests: IRemoteProtocolRequests, private host: string, private urls: ConnectResponse) {
        const callback: ProtocolInvokingHandler = (invoking => this.sendRequest(invoking));
        this.responses = new ResponseToJson(callback);
        this.events = new EventToJson(callback);
    }

    sendRequest(invoking: ProtocolInvoking): void {
        throw new Error(JSON.stringify(invoking, undefined, 4));
    }

    async start(): Promise<void> {
        // Start infinite loop to continuously query for requests
        while (true) {
            try {
                const response = await fetch(`${this.host}${this.urls.request}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });

                if (response.status === 200) {
                    const responseText = await response.text();
                    const protocolInvoking = JSON.parse(responseText) as ProtocolInvoking;
                    jsonToRequest(protocolInvoking, this.requests);
                }
                // Ignore HTTP errors and continue the loop
            } catch {
                // Ignore any HTTP-related errors and continue the loop
                continue;
            }
        }
    }
}

async function sendConnect(host: string, url: string): Promise<ConnectResponse> {
    let response: Response;
    try {
        response = await fetch(`${host}${url}`, {
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
            const responseText = await response.text();
            return JSON.parse(responseText) as ConnectResponse;
        } catch (error) {
            throw new Error(`Failed to parse response JSON from ${url}`, { cause: error });
        }
    } else {
        throw new Error(`[${response.status}: ${response.statusText}]: ${url}`);
    }
}

export async function connectHttpServer(host: string, requests: IRemoteProtocolRequests): Promise<IRemoteProtocolHttpClient> {
    const urls = await sendConnect(`http://${host}`, '/GacUIRemoting/Connect');
    const impl = new HttpClientImpl(requests, host, urls);
    return impl;
}