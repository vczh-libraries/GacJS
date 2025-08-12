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
    stop(): void;
}

interface ConnectResponse {
    request: string;
    response: string;
}

class HttpClientImpl implements IRemoteProtocolHttpClient {
    public responses: IRemoteProtocolResponses;
    public events: IRemoteProtocolEvents;

    constructor(private requests: IRemoteProtocolRequests, private host: string, private urls: ConnectResponse) {
        const callback: ProtocolInvokingHandler = (invoking => {
            this.sendRequest(invoking).catch(error => { throw error; });
        });
        this.responses = new ResponseToJson(callback);
        this.events = new EventToJson(callback);
    }

    async sendRequest(invoking: ProtocolInvoking): Promise<void> {
        const response = await fetch(`${this.host}${this.urls.response}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf8' },
            body: JSON.stringify([JSON.stringify(invoking)])
        });

        if (response.status !== 200) {
            throw new Error(`[${response.status}: ${response.statusText}]: ${this.host}${this.urls.response}`);
        }
    }

    async start(): Promise<void> {
        this.events.OnControllerConnect();
        while (true) {
            let responseText: string;

            try {
                const response = await fetch(`${this.host}${this.urls.request}`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json; charset=utf8' }
                });

                if (response.status !== 200) {
                    continue;
                }

                responseText = await response.text();
            } catch {
                continue;
            }

            const requests = JSON.parse(responseText) as string[];
            for (const request of requests) {
                const protocolInvoking = JSON.parse(request) as ProtocolInvoking;
                jsonToRequest(protocolInvoking, this.requests);
            }
        }
    }

    stop(): void {
        // TODO: to break start() infinite loop
        throw new Error('Not Implemented (stop)');
    }
}

async function sendConnect(host: string, url: string): Promise<ConnectResponse> {
    const response = await fetch(`${host}${url}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json; charset=utf8' }
    });

    if (response.status !== 200) {
        throw new Error(`[${response.status}: ${response.statusText}]: ${url}`);
    }

    const responseText = await response.text();
    return JSON.parse(responseText) as ConnectResponse;
}

export async function connectHttpServer(host: string, requests: IRemoteProtocolRequests): Promise<IRemoteProtocolHttpClient> {
    const urls = await sendConnect(host, '/GacUIRemoting/Connect');
    const impl = new HttpClientImpl(requests, host, urls);
    return impl;
}