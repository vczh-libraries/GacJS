import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from './GacUIElementManager';

/*
 * # Converting from RenderingDom(r) to IVirtualDom(v)
 *   r.id -> v.id
 *   r.content.hitTestResult -> v.hitTestResult
 *   r.content.cursor -> v.cursor
 *   r.content.element -> v.typedDesc
 *   r.content.bounds -> v.globalBounds
 *   r.children -> v.children
 * 
 * r.content.bounds and r.content.validArea are in global coordinate.
 * v.globalBounds will in global coordinate too, but v.global will be in its parent's coordinate.
 * when v is the root, v.bounds === v.globalBounds.
 * 
 * In most cases, r.content.validArea is the same as r.content.bounds.
 * Unless the element is clipped by a parent node during rendering.
 * The actual parent is in GacUI Core therefore it may not necessary appeared as a RenderingDom.
 * r.content.validArea will always equals to or smaller than the intersection of r.content.bounds and parent.validArea.
 * 
 * In case of smaller, createSimpleDom will be called to make a IVirtualDom whose bounds is r.content.validArea.
 * And the IVirtualDom created from r becomes it child.
 * In case of equal, such extra IVirtualDom must not exist.
 * 
 * The RenderingDom always has a -1 id. All other RenderingDom's id must not be negative.
 * When two IVirtualDom need to be created for one RenderingDom
 *   The outer one reflects r.content.validArea, it would be a simple dom, but it copies RenderingDom.id.
 *   The inner one reflects r.content.bounds, it copies RenderingDom.content, but its id will be -2.
 *   An id of -2 is special and help identify such case, so it is possible to have multiple IVirtualDom using -2.
 *   This allows for more flexible rendering scenarios where elements may need to be represented in different ways.
 *   VirtualDomRecord.doms will not store for id that is negative.
 *
 * RootVirtualDomId and ClippedVirtualDomId are defined for special ids.
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
    get globalBounds(): SCHEMA.Rect;
    get bounds(): SCHEMA.Rect;
    get hitTestResult(): SCHEMA.WindowHitTestResult | undefined;
    get cursor(): SCHEMA.WindowSystemCursorType | undefined;
    get typedDesc(): TypedElementDesc | undefined;
    get children(): ReadonlyArray<IVirtualDom>;
    updateChildren(children: IVirtualDom[]): void;
    updateTypedDesc(typedDesc: TypedElementDesc | undefined): void;
}

export interface IVirtualDomProvider {
    createDom(
        id: SCHEMA.TYPES.Integer,
        globalBounds: SCHEMA.Rect,
        hitTestResult: SCHEMA.WindowHitTestResult | undefined,
        cursor: SCHEMA.WindowSystemCursorType | undefined,
        typedDesc: TypedElementDesc | undefined): IVirtualDom;
    createSimpleDom(
        id: SCHEMA.TYPES.Integer,
        globalBounds: SCHEMA.Rect): IVirtualDom;
}

export type VirtualDomMap = Map<SCHEMA.TYPES.Integer, IVirtualDom>;
export type ElementMap = Map<SCHEMA.TYPES.Integer, TypedElementDesc>;

export const RootVirtualDomId: SCHEMA.TYPES.Integer = -1;
export const ClippedVirtualDomId: SCHEMA.TYPES.Integer = -2;

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
                const childVirtualDom = createVirtualDom(child, record, provider);
                children.push(childVirtualDom);
            }
        }
    }

    // Update children on the target virtual DOM
    virtualDom.updateChildren(children);
}

function areRectsEqual(rect1: SCHEMA.Rect, rect2: SCHEMA.Rect): boolean {
    return rect1.x1 === rect2.x1 && rect1.y1 === rect2.y1 && rect1.x2 === rect2.x2 && rect1.y2 === rect2.y2;
}

function fillVirtualDom(
    renderingDom: SCHEMA.RenderingDom,
    record: VirtualDomRecord,
    provider: IVirtualDomProvider,
    id: SCHEMA.TYPES.Integer,
    typedDesc: TypedElementDesc | undefined
): IVirtualDom {
    // Create the virtual DOM
    const virtualDom = provider.createDom(
        id, 
        renderingDom.content.bounds, 
        renderingDom.content.hitTestResult || undefined,
        renderingDom.content.cursor || undefined,
        typedDesc
    );

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

function createVirtualDom(renderingDom: SCHEMA.RenderingDom, record: VirtualDomRecord, provider: IVirtualDomProvider): IVirtualDom {
    // Check for duplicate IDs
    if (record.doms.has(renderingDom.id)) {
        throw new Error(`Duplicate RenderingDom ID found: ${renderingDom.id}. Each RenderingDom must have a unique ID.`);
    }

    // Create TypedElementDesc from element ID if present
    let typedDesc: TypedElementDesc | undefined = undefined;
    if (renderingDom.content.element !== null) {
        // Look up the element in the provided element map with error checking
        typedDesc = record.elements.get(renderingDom.content.element);
        if (typedDesc === undefined) {
            throw new Error(`RenderingDomContent.element ID ${renderingDom.content.element} not found in ElementMap`);
        }
    }

    // Check if validArea is different from bounds
    if (!areRectsEqual(renderingDom.content.validArea, renderingDom.content.bounds)) {
        // validArea is smaller than bounds, need to create two virtual DOMs
        
        // Create the outer virtual DOM with validArea as bounds, but with the original renderingDom.id
        const outerVirtualDom = provider.createSimpleDom(renderingDom.id, renderingDom.content.validArea);
        
        // Create the inner virtual DOM with original bounds, but with ClippedVirtualDomId
        const innerVirtualDom = fillVirtualDom(
            renderingDom,
            record,
            provider,
            ClippedVirtualDomId,
            typedDesc
        );

        // Add to the doms map only if ID is not negative
        if (renderingDom.id >= 0) {
            record.doms.set(renderingDom.id, outerVirtualDom);
        }
        
        // Set the inner virtual DOM as the only child of the outer virtual DOM
        outerVirtualDom.updateChildren([innerVirtualDom]);

        return outerVirtualDom;
    } else {
        // validArea equals bounds, create single virtual DOM as before
        const virtualDom = fillVirtualDom(
            renderingDom,
            record,
            provider,
            renderingDom.id,
            typedDesc
        );

        // Add to the doms map only if ID is not negative
        if (renderingDom.id >= 0) {
            record.doms.set(renderingDom.id, virtualDom);
        }

        return virtualDom;
    }
}

export function createVirtualDomFromRenderingDom(renderingDom: SCHEMA.RenderingDom, elements: ElementMap, provider: IVirtualDomProvider): VirtualDomRecord {
    // Verify that this is the screen (root) element
    if (renderingDom.id !== RootVirtualDomId ||
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