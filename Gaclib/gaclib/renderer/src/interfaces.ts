import * as SCHEMA from '@gaclib/remote-protocol';

export interface IGacUIHtmlRenderer {
    get requests(): SCHEMA.IRemoteProtocolRequests;
    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void;
}

export interface GacUISettings {
    width: number;
    height: number;
    target: HTMLElement;
    fontConfig: SCHEMA.FontConfig;
}
