import * as SCHEMA from '@gaclib/remote-protocol';

export interface IGacUIRenderer {
    get requests(): SCHEMA.IRemoteProtocolRequests;
    start(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void;
    stop(): void;
    requestStopToCore(forceExit: boolean): void;
}

export interface GacUISettings {
    target: HTMLElement;
    fontFamilies?: string[];
    isShortcutReservedForBrowser: (event: KeyboardEvent) => boolean;
}
