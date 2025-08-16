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
export type ElementMap = Map<SCHEMA.TYPES.Integer, TypedElementDesc>;

export interface VirtualDomRecord {
    screen: IVirtualDom;
    doms: VirtualDomMap;
}

function collectIds(renderingDom: SCHEMA.RenderingDom, doms: VirtualDomMap): void {
    // Collect all IDs in the tree and verify no duplicates
    if (doms.has(renderingDom.id)) {
        throw new Error(`Duplicate ID found: ${renderingDom.id}`);
    }

    // Note: We don't add to doms here, just verify uniqueness
    // The actual creation happens in createVirtualDom

    // Recursively collect from children
    if (renderingDom.children) {
        for (const child of renderingDom.children) {
            if (child !== null) {
                collectIds(child, doms);
            }
        }
    }
}

function createVirtualDom(parent: IVirtualDom, renderingDom: SCHEMA.RenderingDom, doms: VirtualDomMap, elements: ElementMap, provider: IVirtualDomProvider): IVirtualDom {
    // Calculate relative bounds (offset from parent)
    const parentBounds = parent.bounds;
    const relativeBounds: SCHEMA.Rect = {
        x1: renderingDom.content.bounds.x1 - parentBounds.x1,
        y1: renderingDom.content.bounds.y1 - parentBounds.y1,
        x2: renderingDom.content.bounds.x2 - parentBounds.x1,
        y2: renderingDom.content.bounds.y2 - parentBounds.y1
    };

    // Create TypedElementDesc from element ID if present
    let typedDesc: TypedElementDesc | undefined = undefined;
    if (renderingDom.content.element !== null && renderingDom.content.element !== undefined) {
        // Look up the element in the provided element map
        typedDesc = elements.get(renderingDom.content.element);
    }

    // Create the virtual DOM node
    const virtualDom = provider.createDom(
        renderingDom.id,
        relativeBounds,
        renderingDom.content.hitTestResult || undefined,
        renderingDom.content.cursor || undefined,
        typedDesc
    );

    // Add to the doms map
    doms.set(renderingDom.id, virtualDom);

    // Process children
    const children: IVirtualDom[] = [];
    if (renderingDom.children) {
        for (const child of renderingDom.children) {
            if (child !== null) {
                const childVirtualDom = createVirtualDom(virtualDom, child, doms, elements, provider);
                children.push(childVirtualDom);
            }
        }
    }

    // Update children on the virtual DOM
    virtualDom.updateChildren(children);

    return virtualDom;
}

// IMPORTANT: RenderingDomContent.bounds are global but IVirtualDom.bounds is the offset to its parent
export function createVirtualDomFromRenderingDom(renderingDom: SCHEMA.RenderingDom, elements: ElementMap, provider: IVirtualDomProvider): VirtualDomRecord {
    // Verify that this is the screen (root) element
    if (renderingDom.content.hitTestResult !== null ||
        renderingDom.content.cursor !== null ||
        renderingDom.content.element !== null ||
        renderingDom.content.bounds.x1 !== 0 ||
        renderingDom.content.bounds.y1 !== 0 ||
        renderingDom.content.bounds.x2 !== 0 ||
        renderingDom.content.bounds.y2 !== 0 ||
        renderingDom.content.validArea.x1 !== 0 ||
        renderingDom.content.validArea.y1 !== 0 ||
        renderingDom.content.validArea.x2 !== 0 ||
        renderingDom.content.validArea.y2 !== 0) {
        throw new Error('Root renderingDom does not match expected screen format');
    }

    // Create the doms map and collect all IDs to verify uniqueness
    const doms: VirtualDomMap = new Map();

    // First, traverse the entire tree to verify no duplicate IDs
    // Skip the root itself in the ID collection
    if (renderingDom.children) {
        for (const child of renderingDom.children) {
            if (child !== null) {
                collectIds(child, doms);
            }
        }
    }

    // Create the screen virtual DOM - it has special handling since it's the root
    const screen = provider.createSimpleDom(renderingDom.id, renderingDom.content.bounds);

    // Process all children of the root
    const children: IVirtualDom[] = [];
    if (renderingDom.children) {
        for (const child of renderingDom.children) {
            if (child !== null) {
                const childVirtualDom = createVirtualDom(screen, child, doms, elements, provider);
                children.push(childVirtualDom);
            }
        }
    }

    // Update children on the screen
    screen.updateChildren(children);

    // Return the result
    return {
        screen,
        doms
    };
}