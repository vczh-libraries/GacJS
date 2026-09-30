import {
    CharacterEncoding,
    EventToJson,
    IRemoteProtocolEvents,
    IRemoteProtocolRequests,
    IRemoteProtocolResponses,
    jsonToRequest,
    ProtocolInvoking,
    ProtocolInvokingHandler,
    ResponseToJson,
} from '@gaclib/remote-protocol';
import { IChannelClient } from './channel.js';
import {
    connectHttpChannel,
    DEFAULT_HTTP_CHANNEL_BASE_PATH,
    HttpChannelConnectionError,
} from './httpChannel.js';

const GACUI_REMOTE_PROTOCOL_CORE_CLIENT_ID = 1;
export const GACUI_REMOTE_PROTOCOL_CHANNEL_NAME = 'GacUIRemoteProtocol';

export class RemoteProtocolHttpDisconnectError extends Error {
    constructor() {
        super('HTTP remote protocol disconnected.');
    }
}

export interface IRemoteProtocolClient {
    readonly responses: IRemoteProtocolResponses;
    readonly events: IRemoteProtocolEvents;
    readonly channelClient: IChannelClient;
    start(): Promise<void>;
    stop(): void;
}

export type IRemoteProtocolHttpClient = IRemoteProtocolClient;

class RemoteProtocolClient implements IRemoteProtocolClient {
    public readonly responses: IRemoteProtocolResponses;
    public readonly events: IRemoteProtocolEvents;
    private readonly unsubscribe: () => void;

    constructor(
        private readonly requests: IRemoteProtocolRequests,
        public readonly channelClient: IChannelClient,
    ) {
        const callback: ProtocolInvokingHandler = invoking => {
            void this.channelClient.sendToClient(
                GACUI_REMOTE_PROTOCOL_CORE_CLIENT_ID,
                GACUI_REMOTE_PROTOCOL_CHANNEL_NAME,
                JSON.stringify([invoking]),
            ).catch(() => undefined);
        };
        this.responses = new ResponseToJson(callback);
        this.events = new EventToJson(callback);
        this.unsubscribe = this.channelClient.onMessage(message => {
            if (message.channelName !== GACUI_REMOTE_PROTOCOL_CHANNEL_NAME) {
                return;
            }
            const requests = JSON.parse(message.messageBody) as ProtocolInvoking[];
            for (const request of requests) {
                jsonToRequest(request, this.requests);
            }
        });
    }

    async start(): Promise<void> {
        if (this.channelClient.clientId === undefined) {
            throw new Error('Renderer channel is not connected.');
        }
        const platform = navigator.platform;
        const osSuperKeyName = platform.startsWith('Mac') ? 'Command' : platform.startsWith('Win') ? 'Win' : 'Super';
        this.events.OnControllerConnect({ documentCaretFromEncoding: CharacterEncoding.UTF16, osSuperKeyName });
        await this.channelClient.start();
    }

    stop(): void {
        this.unsubscribe();
        this.channelClient.stop();
    }
}

class RemoteProtocolHttpClient extends RemoteProtocolClient {
    async start(): Promise<void> {
        try {
            await super.start();
        } catch (error) {
            if (error instanceof HttpChannelConnectionError) {
                if (error.serverError) throw new Error(error.message);
                throw new RemoteProtocolHttpDisconnectError();
            }
            throw error;
        }
    }
}

export function createRemoteProtocolClient(
    requests: IRemoteProtocolRequests,
    channelClient: IChannelClient,
): IRemoteProtocolClient {
    return new RemoteProtocolClient(requests, channelClient);
}

export function createRemoteProtocolHttpClient(
    requests: IRemoteProtocolRequests,
    channelClient: IChannelClient,
): IRemoteProtocolHttpClient {
    return new RemoteProtocolHttpClient(requests, channelClient);
}

export async function connectHttpServer(
    host: string,
    requests: IRemoteProtocolRequests,
    basePath = DEFAULT_HTTP_CHANNEL_BASE_PATH,
): Promise<IRemoteProtocolHttpClient> {
    const channelClient = await connectHttpChannel({
        origin: host,
        basePath,
        channelNames: [GACUI_REMOTE_PROTOCOL_CHANNEL_NAME],
    });
    return createRemoteProtocolHttpClient(requests, channelClient);
}
