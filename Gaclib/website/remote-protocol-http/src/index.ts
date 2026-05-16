import {
    IRemoteProtocolRequests,
    IRemoteProtocolResponses,
    IRemoteProtocolEvents,
    ProtocolInvoking,
    ProtocolInvokingHandler,
    jsonToRequest,
    ResponseToJson,
    EventToJson,
    CharacterEncoding
} from '@gaclib/remote-protocol';

const GACUI_REMOTE_PROTOCOL_CORE_CLIENT_ID = 1;
const GACUI_REMOTE_PROTOCOL_CHANNEL_NAME = 'GacUIRemoteProtocol';

export interface IRemoteProtocolHttpClient {
    get responses(): IRemoteProtocolResponses;
    get events(): IRemoteProtocolEvents;
    start(): Promise<void>;
    stop(): void;
}

interface ConnectResponse {
    requestUrl: string;
    responseUrl: string;
}

interface NetworkPackage {
    clientId?: number;
    channelName: string;
    messageBody: string;
}

class HttpClientImpl implements IRemoteProtocolHttpClient {
    public responses: IRemoteProtocolResponses;
    public events: IRemoteProtocolEvents;
    private _stopping = false;
    private _clientId = -1;

    constructor(
        private requests: IRemoteProtocolRequests,
        private host: string,
        private baseUrl: string,
        private urls: ConnectResponse
    ) {
        const callback: ProtocolInvokingHandler = (invoking => {
            this.sendRequest(invoking).catch(error => {
                if (!this._stopping) {
                    throw error;
                }
            });
        });
        this.responses = new ResponseToJson(callback);
        this.events = new EventToJson(callback);
    }

    private getUrl(path: string): string {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        if (path.startsWith(this.baseUrl)) {
            return `${this.host}${path}`;
        }
        return `${this.host}${this.baseUrl}${path}`;
    }

    private parseNetworkPackage(text: string): NetworkPackage {
        const first = text.indexOf(';');
        if (first === -1) {
            throw new Error(`Invalid network package: ${text}`);
        }

        const second = text.indexOf(';', first + 1);
        if (second === -1) {
            throw new Error(`Invalid network package: ${text}`);
        }

        const clientIdText = text.substring(0, first);
        return {
            clientId: clientIdText === '' ? undefined : Number.parseInt(clientIdText, 10),
            channelName: text.substring(first + 1, second),
            messageBody: text.substring(second + 1),
        };
    }

    private async postResponse(message: string): Promise<void> {
        if (this._stopping) {
            return;
        }

        const response = await fetch(this.getUrl(this.urls.responseUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf8' },
            body: message,
        });

        if (response.status !== 200) {
            throw new Error(`[${response.status}: ${response.statusText}]: ${this.getUrl(this.urls.responseUrl)}`);
        }
    }

    private async readRequest(): Promise<string | undefined> {
        const response = await fetch(this.getUrl(this.urls.requestUrl), {
            method: 'POST',
            headers: { 'Accept': 'application/json; charset=utf8' }
        });

        if (response.status !== 200) {
            return undefined;
        }

        return await response.text();
    }

    async connectChannel(): Promise<void> {
        await this.postResponse(`;;${GACUI_REMOTE_PROTOCOL_CHANNEL_NAME}`);

        while (!this._stopping) {
            const responseText = await this.readRequest();
            if (responseText === undefined) {
                continue;
            }

            const networkPackage = this.parseNetworkPackage(responseText);
            if (networkPackage.channelName === '!Error') {
                throw new Error(networkPackage.messageBody);
            }
            if (networkPackage.channelName === '') {
                if (networkPackage.clientId === undefined || networkPackage.clientId <= 0) {
                    throw new Error(`Invalid channel client id: ${responseText}`);
                }
                this._clientId = networkPackage.clientId;
                return;
            }
        }
    }

    async sendRequest(invoking: ProtocolInvoking): Promise<void> {
        await this.postResponse(`${GACUI_REMOTE_PROTOCOL_CORE_CLIENT_ID};${GACUI_REMOTE_PROTOCOL_CHANNEL_NAME};${JSON.stringify([invoking])}`);
    }

    async start(): Promise<void> {
        if (this._clientId === -1) {
            throw new Error('HTTP channel is not connected.');
        }

        this.events.OnControllerConnect({ documentCaretFromEncoding: CharacterEncoding.UTF16 });
        while (!this._stopping) {
            let responseText: string;

            try {
                const text = await this.readRequest();
                if (text === undefined) {
                    continue;
                }

                responseText = text;
                if (this._stopping) {
                    break;
                }
            } catch {
                continue;
            }

            const networkPackage = this.parseNetworkPackage(responseText);
            if (networkPackage.channelName === '!Error') {
                throw new Error(networkPackage.messageBody);
            }
            if (networkPackage.channelName !== GACUI_REMOTE_PROTOCOL_CHANNEL_NAME) {
                continue;
            }

            const requests = JSON.parse(networkPackage.messageBody) as ProtocolInvoking[];
            for (const request of requests) {
                jsonToRequest(request, this.requests);
            }
        }
    }

    stop(): void {
        this._stopping = true;
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
    const separator = responseText.indexOf(';');
    if (separator === -1) {
        throw new Error(`Invalid connect response: ${responseText}`);
    }
    return {
        requestUrl: responseText.substring(0, separator),
        responseUrl: responseText.substring(separator + 1),
    };
}

export async function connectHttpServer(host: string, requests: IRemoteProtocolRequests): Promise<IRemoteProtocolHttpClient> {
    const baseUrl = '/GacUIRemoteProtocolHttp';
    const urls = await sendConnect(host, `${baseUrl}/VlppInterProcess/Connect`);
    const impl = new HttpClientImpl(requests, host, baseUrl, urls);
    await impl.connectChannel();
    return impl;
}
