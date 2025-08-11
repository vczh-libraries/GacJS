import * as SCHEMA from '@gaclib/remote-protocol';

export interface IGacUIHtmlRenderer {
    get requests(): SCHEMA.IRemoteProtocolRequests;
    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void;
}

export interface GacUISettings {
    width: number;
    height: number;
    target: Element;
}

// @ts-expect-error: TS2420
class GacUIHtmlRendererImpl implements IGacUIHtmlRenderer, SCHEMA.IRemoteProtocolRequests {
    // @ts-expect-error: TS6133
    private _responses: SCHEMA.IRemoteProtocolResponses;
    // @ts-expect-error: TS6133
    private _events: SCHEMA.IRemoteProtocolEvents;

    constructor(private settings: GacUISettings) {
        this.settings.target.textContent='Starting GacUI HTML Renderer ...';
    }

    get requests(): SCHEMA.IRemoteProtocolRequests {
        return (<SCHEMA.IRemoteProtocolRequests>(<unknown>this));
    }

    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void {
        this._responses = responses;
        this._events = events;
    }
}

export function createRenderer(settings: GacUISettings): IGacUIHtmlRenderer {
    return new GacUIHtmlRendererImpl(settings);
}