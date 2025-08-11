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

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    sendRequest(invoking: ProtocolInvoking): void {
    }

    start(): void {
    }
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function sendConnect(url: string): Promise<ConnectResponse> {
    throw new Error('Not implemented (sendConnect)');
}

export async function connectHttpServer(host: string, requests: IRemoteProtocolRequests): Promise<IRemoteProtocolHttpClient> {
    const urls = await sendConnect(`${host}/GacUIRemoting/Connect`);
    const impl = new HttpClientImpl(requests, urls);
    return impl;
}