import * as SCHEMA from '@gaclib/remote-protocol';
import {
    ElementMap,
    VirtualDomHtmlProvider,
    createVirtualDomFromRenderingDom,
} from '@gaclib/renderer';

export function renderUI(gacuiScreen: HTMLElement, trace: SCHEMA.UnitTest_RenderingTrace, frameIndex: number): void {
    gacuiScreen.replaceChildren();
    const frame = trace.frames![frameIndex];
    const provider = new VirtualDomHtmlProvider();

    const elements: ElementMap = new Map();
    for (const [id, type] of trace.createdElements!) {
        if (type === SCHEMA.RendererType.FocusRectangle || type === SCHEMA.RendererType.Raw) {
            elements.set(id, { type });
        }
    }

    const imageCreations = new Map<SCHEMA.TYPES.Integer, SCHEMA.ImageCreation>();
    for (const ic of trace.imageCreations!) {
        imageCreations.set(ic.id, ic);
    }

    for (const [id, desc] of frame.elements!) {
        switch (desc[0]) {
            case 'ElementDesc_SolidBorder': {
                elements.set(id, { type: SCHEMA.RendererType.SolidBorder, desc: desc[1] });
                break;
            }
            case 'ElementDesc_SinkBorder': {
                elements.set(id, { type: SCHEMA.RendererType.SinkBorder, desc: desc[1] });
                break;
            }
            case 'ElementDesc_SinkSplitter': {
                elements.set(id, { type: SCHEMA.RendererType.SinkSplitter, desc: desc[1] });
                break;
            }
            case 'ElementDesc_SolidBackground': {
                elements.set(id, { type: SCHEMA.RendererType.SolidBackground, desc: desc[1] });
                break;
            }
            case 'ElementDesc_GradientBackground': {
                elements.set(id, { type: SCHEMA.RendererType.GradientBackground, desc: desc[1] });
                break;
            }
            case 'ElementDesc_InnerShadow': {
                elements.set(id, { type: SCHEMA.RendererType.InnerShadow, desc: desc[1] });
                break;
            }
            case 'ElementDesc_Polygon': {
                elements.set(id, { type: SCHEMA.RendererType.Polygon, desc: desc[1] });
                break;
            }
            case 'ElementDesc_SolidLabel': {
                elements.set(id, { type: SCHEMA.RendererType.SolidLabel, desc: desc[1] });
                break;
            }
            case 'ElementDesc_ImageFrame': {
                elements.set(id, { type: SCHEMA.RendererType.ImageFrame, desc: desc[1] });
                break;
            }
        }
    }
    const rootDom = createVirtualDomFromRenderingDom(frame.root!, elements, provider);
}