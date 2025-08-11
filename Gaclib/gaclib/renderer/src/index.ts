import * as SCHEMA from '@gaclib/remote-protocol';

export interface GacUIHtmlRenderer {
    get requests(): SCHEMA.IRemoteProtocolRequests;
    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void;
    install(): void;
}

export function createRenderer(): GacUIHtmlRenderer {
    throw new Error('Not implemented');
}