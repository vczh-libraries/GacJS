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

export class RemoteProtocolHttpDisconnectError extends Error {
    constructor() {
        super('HTTP remote protocol disconnected.');
    }
}

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

type ReadResult =
    | { type: 'message'; responseText: string | undefined }
    | { type: 'failure'; error: Error };

class HttpClientImpl implements IRemoteProtocolHttpClient {
    public responses: IRemoteProtocolResponses;
    public events: IRemoteProtocolEvents;
    private _stopping = false;
    private _clientId = -1;
    private _failure: Error | undefined = undefined;
    private _failureNotification: Promise<void>;
    private _failureNotifier: (() => void) | undefined = undefined;
    private _sending: Promise<void> = Promise.resolve();

    constructor(
        private requests: IRemoteProtocolRequests,
        private host: string,
        private baseUrl: string,
        private urls: ConnectResponse
    ) {
        this._failureNotification = new Promise(resolve => {
            this._failureNotifier = resolve;
        });
        const callback: ProtocolInvokingHandler = (invoking => {
            this.enqueueRequest(invoking);
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

    private normalizeError(error: unknown): Error {
        if (error instanceof Error) {
            return error;
        }
        return new Error(String(error));
    }

    private notifyFailure(error: Error): void {
        if (this._failure === undefined) {
            this._failure = error;
            if (this._failureNotifier !== undefined) {
                this._failureNotifier();
            }
        }
    }

    private async waitForFailure(): Promise<Error> {
        await this._failureNotification;
        if (this._failure !== undefined) {
            return this._failure;
        }
        return new Error('HTTP channel failed without an error.');
    }

    private handleNetworkPackageText(responseText: string): void {
        const networkPackage = this.parseNetworkPackage(responseText);
        if (networkPackage.channelName === '!Error') {
            throw new Error(networkPackage.messageBody);
        }
        if (networkPackage.channelName !== GACUI_REMOTE_PROTOCOL_CHANNEL_NAME) {
            return;
        }

        const requests = JSON.parse(networkPackage.messageBody) as ProtocolInvoking[];
        for (const request of requests) {
            jsonToRequest(request, this.requests);
        }
    }

    private tryAcceptClientId(responseText: string): boolean {
        const networkPackage = this.parseNetworkPackage(responseText);
        if (networkPackage.channelName === '!Error') {
            throw new Error(networkPackage.messageBody);
        }
        if (networkPackage.channelName !== '') {
            return false;
        }
        if (networkPackage.clientId === undefined || networkPackage.clientId <= 0) {
            throw new Error(`Invalid channel client id: ${responseText}`);
        }
        this._clientId = networkPackage.clientId;
        return true;
    }

    private disconnect(): RemoteProtocolHttpDisconnectError {
        const error = new RemoteProtocolHttpDisconnectError();
        this._stopping = true;
        this.notifyFailure(error);
        return error;
    }

    private async fetchChannelText(url: string, init: RequestInit): Promise<string> {
        try {
            const response = await fetch(url, init);
            if (response.status !== 200) {
                throw this.disconnect();
            }
            return await response.text();
        }
        catch (error) {
            if (error instanceof RemoteProtocolHttpDisconnectError) {
                throw error;
            }
            throw this.disconnect();
        }
    }

    private async postResponse(message: string): Promise<string | undefined> {
        if (this._stopping) {
            return undefined;
        }

        const responseText = await this.fetchChannelText(this.getUrl(this.urls.responseUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf8' },
            body: message,
        });

        return responseText === '' ? undefined : responseText;
    }

    private async readRequest(): Promise<string | undefined> {
        return await this.fetchChannelText(this.getUrl(this.urls.requestUrl), {
            method: 'POST',
            headers: { 'Accept': 'application/json; charset=utf8' }
        });
    }

    async connectChannel(): Promise<void> {
        const responseText = await this.postResponse(`;;${GACUI_REMOTE_PROTOCOL_CHANNEL_NAME}`);
        if (responseText !== undefined) {
            if (this.tryAcceptClientId(responseText)) {
                return;
            }
            this.handleNetworkPackageText(responseText);
        }

        while (!this._stopping) {
            const responseText = await this.readRequest();
            if (responseText === undefined) {
                continue;
            }

            if (this.tryAcceptClientId(responseText)) {
                return;
            }
        }
    }

    async sendRequest(invoking: ProtocolInvoking): Promise<void> {
        const responseText = await this.postResponse(`${GACUI_REMOTE_PROTOCOL_CORE_CLIENT_ID};${GACUI_REMOTE_PROTOCOL_CHANNEL_NAME};${JSON.stringify([invoking])}`);
        if (responseText !== undefined) {
            this.handleNetworkPackageText(responseText);
        }
    }

    private enqueueRequest(invoking: ProtocolInvoking): void {
        const sending = this._sending
            .catch(() => {})
            .then(() => this.sendRequest(invoking));
        this._sending = sending;
        sending.catch(error => {
            if (!this._stopping) {
                this.notifyFailure(this.normalizeError(error));
            }
        });
    }

    async start(): Promise<void> {
        if (this._clientId === -1) {
            throw new Error('HTTP channel is not connected.');
        }

        this.events.OnControllerConnect({ documentCaretFromEncoding: CharacterEncoding.UTF16 });
        while (true) {
            if (this._failure !== undefined) {
                throw this._failure;
            }
            if (this._stopping) {
                break;
            }

            const reading = this.readRequest()
                .then<ReadResult>(responseText => ({ type: 'message', responseText }))
                .catch<ReadResult>((error: unknown) => ({ type: 'failure', error: this._failure ?? this.normalizeError(error) }));
            const result = await Promise.race<ReadResult>([
                reading,
                this.waitForFailure().then(error => ({ type: 'failure', error }))
            ]);
            if (result.type === 'failure') {
                throw result.error;
            }
            if (result.responseText === undefined) {
                continue;
            }

            try {
                if (this._stopping) {
                    break;
                }
            } catch {
                continue;
            }

            this.handleNetworkPackageText(result.responseText);
        }

        const failure = this._failure;
        if (failure !== undefined) {
            throw this.normalizeError(failure);
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
