import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementHTMLMeasurer } from './domRenderer/elementMeasurer';
import { VirtualDomHtmlProvider } from './domRenderer/virtualDomRenderer';
import { GacUIRendererImpl } from './GacUIRendererImpl';
import { GacUISettings, IGacUIHtmlRenderer } from './interfaces';

export class GacUIHtmlRendererImpl extends GacUIRendererImpl {
    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void {
        this._init(responses, events, new VirtualDomHtmlProvider(), new ElementHTMLMeasurer(responses));
    }
}

export function createHtmlRenderer(settings: GacUISettings): IGacUIHtmlRenderer {
    return new GacUIHtmlRendererImpl(settings);
}

export * from './interfaces';
export * from './featureGates';
export * from './GacUIElementManager';
export * from './GacUIRendererImpl';
export * from './domRenderer/elementStyles';
export * from './domRenderer/elementMeasurer';
export * from './domRenderer/virtualDomRenderer';
export { IVirtualDom, IVirtualDomProvider, RootVirtualDomId, ClippedVirtualDomId } from './dom/virtualDom';
export * from './dom/virtualDomBuilding';