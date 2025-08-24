import * as SCHEMA from '@gaclib/remote-protocol';
import { IVirtualDomProvider } from './dom/virtualDom';
import { IElementMeasurer } from './dom/virtualDomBuilding';

export interface IGacUIHtmlRenderer {
    get requests(): SCHEMA.IRemoteProtocolRequests;
    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents, provider: IVirtualDomProvider, measurer: IElementMeasurer): void;
    stop(): void;
    requestStopToCore(forceExit: boolean): void;
}

export interface GacUISettings {
    target: HTMLElement;
    fontFamilies?: string[];
}
