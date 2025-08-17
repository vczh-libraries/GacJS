import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from './GacUIElementManager';

/*
 * # Converting from RenderingDom(r) to IVirtualDom(v)
 *   r.id -> v.id
 *   r.content.hitTestResult -> v.hitTestResult
 *   r.content.cursor -> v.cursor
 *   r.content.element -> v.typedDesc
 *   r.content.bounds -> v.bounds
 *   r.children -> v.children
 * 
 * In most cases, r.validArea is the same as r.bounds.
 * Unless the element is clipped by a parent node during rendering.
 * The actual parent is in GacUI Core therefore it may not necessary appeared as a RenderingDom.
 * r.validArea will always equals to or smaller than the intersection of r.bounds and parent.validArea.
 * 
 * In case of smaller, createSimpleDom will be called to make a IVirtualDom whose bounds is r.validArea.
 * And the IVirtualDom created from r becomes it child.
 * In case of equal, such extra IVirtualDom must not exist.
 * 
 * # Converting from RenderingDom_DiffsInOrder to IVirtualDom
 * 
 * Although there is only one diffsInOrder collection but we should read RenderingDom_Diff.diffType and
 *   Process "Created", create IVirtualDom for each of them and maintain necessary mappings
 *     content must be non-null for "Created"
 *   Process "Deleted", remove them from mappings
 *     content and children will be ignored
 *   Process "Updated"
 *     non-null content or children means the updated new value
 *
 * We don't need to keep and update RenderingDom, it will apply to IVirtualDom directly.
 * The updated IVirtualDom must follow the above rule with bounds and validArea.
 */
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
    elementToDoms: VirtualDomMap;
    elements: ElementMap;
}

function processAndUpdateChildren(renderingDom: SCHEMA.RenderingDom, virtualDom: IVirtualDom, record: VirtualDomRecord, provider: IVirtualDomProvider): void {
    // Process children
    const children: IVirtualDom[] = [];
    if (renderingDom.children) {
        for (const child of renderingDom.children) {
            if (child !== null) {
                const childVirtualDom = createVirtualDom(renderingDom, child, record, provider);
                children.push(childVirtualDom);
            }
        }
    }

    // Update children on the target virtual DOM
    virtualDom.updateChildren(children);
}

function createVirtualDom(parentRenderingDom: SCHEMA.RenderingDom, renderingDom: SCHEMA.RenderingDom, record: VirtualDomRecord, provider: IVirtualDomProvider): IVirtualDom {
    // Check for duplicate IDs
    if (record.doms.has(renderingDom.id)) {
        throw new Error(`Duplicate RenderingDom ID found: ${renderingDom.id}. Each RenderingDom must have a unique ID.`);
    }

    // Calculate relative bounds (offset from parent)
    const parentRenderingBounds = parentRenderingDom.content.bounds;
    const relativeBounds: SCHEMA.Rect = {
        x1: renderingDom.content.bounds.x1 - parentRenderingBounds.x1,
        y1: renderingDom.content.bounds.y1 - parentRenderingBounds.y1,
        x2: renderingDom.content.bounds.x2 - parentRenderingBounds.x1,
        y2: renderingDom.content.bounds.y2 - parentRenderingBounds.y1
    };

    // Create TypedElementDesc from element ID if present
    let typedDesc: TypedElementDesc | undefined = undefined;
    if (renderingDom.content.element !== null) {
        // Look up the element in the provided element map with error checking
        typedDesc = record.elements.get(renderingDom.content.element);
        if (typedDesc === undefined) {
            throw new Error(`RenderingDomContent.element ID ${renderingDom.content.element} not found in ElementMap`);
        }
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
    record.doms.set(renderingDom.id, virtualDom);

    // Add to elementToDoms map if this DOM has an element
    if (renderingDom.content.element !== null) {
        // Ensure 1:1 mapping - element should not already exist in elementToDoms
        if (record.elementToDoms.has(renderingDom.content.element)) {
            throw new Error(`RenderingDomContent.element ID ${renderingDom.content.element} is already mapped to another IVirtualDom. Each element must have 1:1 mapping with IVirtualDom.`);
        }
        record.elementToDoms.set(renderingDom.content.element, virtualDom);
    }

    // Process and update children
    processAndUpdateChildren(renderingDom, virtualDom, record, provider);

    return virtualDom;
}

// IMPORTANT: RenderingDomContent.bounds are global but IVirtualDom.bounds is the offset to its parent
export function createVirtualDomFromRenderingDom(renderingDom: SCHEMA.RenderingDom, elements: ElementMap, provider: IVirtualDomProvider): VirtualDomRecord {
    // Verify that this is the screen (root) element
    if (renderingDom.id !== -1 ||
        renderingDom.content.hitTestResult !== null ||
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
        throw new Error('Root RenderingDom does not match expected screen format');
    }

    // Create the VirtualDomRecord with all required maps
    const record: VirtualDomRecord = {
        screen: provider.createSimpleDom(renderingDom.id, renderingDom.content.bounds),
        doms: new Map(),
        elementToDoms: new Map(),
        elements
    };

    // Process and update children on the screen
    processAndUpdateChildren(renderingDom, record.screen, record, provider);

    // Return the result
    return record;
}