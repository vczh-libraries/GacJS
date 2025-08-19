import * as SCHEMA from '@gaclib/remote-protocol';
import { IVirtualDomProvider } from './virtualDom';
import { IElementMeasurer } from './virtualDomBuilding';

export interface IGacUIHtmlRenderer {
    get requests(): SCHEMA.IRemoteProtocolRequests;
    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents, provider: IVirtualDomProvider, measurer: IElementMeasurer): void;
}

export interface GacUISettings {
    width: number;
    height: number;
    target: HTMLElement;
    fontConfig: SCHEMA.FontConfig;
}
