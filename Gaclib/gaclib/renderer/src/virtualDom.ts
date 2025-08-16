import * as SCHEMA from '@gaclib/remote-protocol';

export type TypedElementDesc =
    | { type: SCHEMA.RendererType.Raw }
    | { type: SCHEMA.RendererType.FocusRectangle }
    | { type: SCHEMA.RendererType.SolidBorder; desc: SCHEMA.ElementDesc_SolidBorder }
    | { type: SCHEMA.RendererType.SolidBackground; desc: SCHEMA.ElementDesc_SolidBackground }
    | { type: SCHEMA.RendererType.GradientBackground; desc: SCHEMA.ElementDesc_GradientBackground }
    | { type: SCHEMA.RendererType.SinkBorder; desc: SCHEMA.ElementDesc_SinkBorder }
    | { type: SCHEMA.RendererType.SinkSplitter; desc: SCHEMA.ElementDesc_SinkSplitter }
    | { type: SCHEMA.RendererType.InnerShadow; desc: SCHEMA.ElementDesc_InnerShadow }
    | { type: SCHEMA.RendererType.ImageFrame; desc: SCHEMA.ElementDesc_ImageFrame }
    | { type: SCHEMA.RendererType.Polygon; desc: SCHEMA.ElementDesc_Polygon }
    | { type: SCHEMA.RendererType.SolidLabel; desc: SCHEMA.ElementDesc_SolidLabel };

export interface IVirtualDom {
    get parent(): IVirtualDom | undefined;
    get id(): SCHEMA.TYPES.Integer;
    get bounds(): SCHEMA.Rect;
    get hitTestResult(): SCHEMA.WindowHitTestResult | undefined;
    get cursor(): SCHEMA.WindowSystemCursorType | undefined;
    get typedDesc(): TypedElementDesc | undefined;
    get children(): ReadonlyArray<IVirtualDom>;
    updateBounds(bounds: SCHEMA.Rect): void;
    updateChildren(children: IVirtualDom[]): void;
    updateTypedDesc(typedDesc: TypedElementDesc | undefined): void;
}

export interface IVirtualDomProvider {
    createDom(
        id: SCHEMA.TYPES.Integer,
        bounds: SCHEMA.Rect,
        hitTestResult: SCHEMA.WindowHitTestResult | undefined,
        cursor: SCHEMA.WindowSystemCursorType | undefined,
        typedDesc: TypedElementDesc | undefined): IVirtualDom;
    createSimpleDom(
        id: SCHEMA.TYPES.Integer,
        bounds: SCHEMA.Rect): IVirtualDom;
}

export type VirtualDomMap = Map<SCHEMA.TYPES.Integer, IVirtualDom>;

export interface VirtualDomRecord {
    screen: IVirtualDom;
    doms: VirtualDomMap;
}

function collectIds(renderingDom: SCHEMA.RenderingDom, doms: VirtualDomMap): void {
    throw new Error('Not implemented');
}

function createVirtualDom(parent: IVirtualDom, renderingDom: SCHEMA.RenderingDom, doms: VirtualDomMap, provider: IVirtualDomProvider): IVirtualDom {
    throw new Error('Not implemented');
}

// IMPORTANT: RenderingDomContent.bounds are global but IVirtualDom.bounds is the offset to its parent
export function createVirtualDomFromRenderingDom(renderingDom: SCHEMA.RenderingDom, provider: IVirtualDomProvider): VirtualDomRecord {
    throw new Error('Not implemented');
}