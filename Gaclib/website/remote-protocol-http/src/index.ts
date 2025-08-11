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

async function sendConnect(url: string): Promise<ConnectResponse> {
    return new Promise<ConnectResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    try {
                        const parsedResponse = (<ConnectResponse>JSON.parse(xhr.responseText));
                        resolve(parsedResponse);
                    } catch (error) {
                        reject(new Error(`Failed to parse response JSON: ${error}`));
                    }
                } else {
                    reject(new Error(`[${xhr.status}: ${xhr.statusText}]: ${url}`));
                }
            }
        };

        xhr.onerror = function () {
            reject(new Error(`[ERROR]: ${url}`));
        };

        xhr.ontimeout = function () {
            reject(new Error(`[TIMEOUT]: ${url}`));
        };
        
        xhr.open('GET', url, true);
        xhr.timeout = 30000; // 30 second timeout
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send();
    });
}

export async function connectHttpServer(host: string, requests: IRemoteProtocolRequests): Promise<IRemoteProtocolHttpClient> {
    const urls = await sendConnect(`http://${host}/GacUIRemoting/Connect`);
    const impl = new HttpClientImpl(requests, urls);
    return impl;
}