import * as SCHEMA from '@gaclib/remote-protocol';

export interface RemoteProtocolHttpClient {
    get responses(): SCHEMA.IRemoteProtocolResponses;
    get events(): SCHEMA.IRemoteProtocolEvents;
    start(): void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function connectHttpServer(host: string, requests: SCHEMA.IRemoteProtocolRequests): Promise<RemoteProtocolHttpClient> {
    throw new Error('Not implemented');
}