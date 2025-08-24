import { GacUIHtmlRendererImpl } from './GacUIHtmlRendererImpl';
import { GacUISettings, IGacUIHtmlRenderer } from './interfaces';

export function createRenderer(settings: GacUISettings): IGacUIHtmlRenderer {
    return new GacUIHtmlRendererImpl(settings);
}

export * from './interfaces';
export * from './featureGates';
export * from './GacUIElementManager';
export * from './GacUIHtmlRendererImpl';
export * from './domRenderer/elementStyles';
export * from './domRenderer/elementMeasurer';
export * from './domRenderer/virtualDomRenderer';
export { IVirtualDom, IVirtualDomProvider, RootVirtualDomId, ClippedVirtualDomId } from './dom/virtualDom';
export * from './dom/virtualDomBuilding';