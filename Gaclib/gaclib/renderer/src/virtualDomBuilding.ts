import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementManager, TypedElementDesc } from './GacUIElementManager';
import { IVirtualDom, IVirtualDomProvider, RootVirtualDomId, ClippedVirtualDomId } from './virtualDom';

export type VirtualDomMap = Map<SCHEMA.TYPES.Integer, IVirtualDom>;

export interface VirtualDomRecord {
    screen: IVirtualDom;
    doms: VirtualDomMap;
    elementToDoms: VirtualDomMap;
    elements: ElementManager;
}

export interface IElementMeasurer {
    requestMeasureSolidLabel(desc: SCHEMA.ElementDesc_SolidLabel): void;
    requestImageMetadata(id: SCHEMA.TYPES.Integer | undefined, imageCreation: SCHEMA.ImageCreation, renderingRecord: VirtualDomRecord): void;
    RequestRendererEndRendering(id: number, renderingRecord: VirtualDomRecord): void;
}

function intersectRects(rect1: SCHEMA.Rect, rect2: SCHEMA.Rect): SCHEMA.Rect {
    return {
        x1: Math.max(rect1.x1, rect2.x1),
        y1: Math.max(rect1.y1, rect2.y1),
        x2: Math.min(rect1.x2, rect2.x2),
        y2: Math.min(rect1.y2, rect2.y2)
    };
}

function areRectsEqual(rect1: SCHEMA.Rect, rect2: SCHEMA.Rect): boolean {
    return rect1.x1 === rect2.x1 && rect1.y1 === rect2.y1 && rect1.x2 === rect2.x2 && rect1.y2 === rect2.y2;
}

function processAndUpdateChildren(renderingDom: SCHEMA.RenderingDom, virtualDom: IVirtualDom, record: VirtualDomRecord, provider: IVirtualDomProvider): void {
    // Process children
    const parentValidArea = renderingDom.id === RootVirtualDomId ? undefined : renderingDom.content.validArea;
    const children: IVirtualDom[] = [];
    if (renderingDom.children) {
        for (const child of renderingDom.children) {
            if (child !== null) {
                const childVirtualDom = createVirtualDom(child, record, provider, parentValidArea);
                children.push(childVirtualDom);
            }
        }
    }

    // Update children on the target virtual DOM
    virtualDom.updateChildren(children);
}

function fillVirtualDom(
    renderingDom: SCHEMA.RenderingDom,
    record: VirtualDomRecord,
    provider: IVirtualDomProvider,
    id: SCHEMA.TYPES.Integer,
): IVirtualDom {
    // Create TypedElementDesc from element ID if present
    let typedDesc: TypedElementDesc | undefined = undefined;
    if (renderingDom.content.element !== null) {
        // Look up the element in the provided element manager with error checking
        typedDesc = record.elements.getDescEnsured(renderingDom.content.element);
    }

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

function createVirtualDom(renderingDom: SCHEMA.RenderingDom, record: VirtualDomRecord, provider: IVirtualDomProvider, parentValidArea?: SCHEMA.Rect): IVirtualDom {
    // Check for duplicate IDs
    if (record.doms.has(renderingDom.id)) {
        throw new Error(`Duplicate RenderingDom ID found: ${renderingDom.id}. Each RenderingDom must have a unique ID.`);
    }

    // Calculate the natural intersection of this element's bounds with parent's validArea
    const naturalValidArea = parentValidArea ? intersectRects(renderingDom.content.bounds, parentValidArea) : renderingDom.content.bounds;

    // Check if validArea does not provide new information
    if (areRectsEqual(renderingDom.content.validArea, naturalValidArea)) {
        // validArea equals natural intersection, create single virtual DOM
        // Children should be processed with this element's validArea as their parent validArea
        const virtualDom = fillVirtualDom(
            renderingDom,
            record,
            provider,
            renderingDom.id,
        );

        // Add to the doms map only if ID is not negative
        if (renderingDom.id >= 0) {
            record.doms.set(renderingDom.id, virtualDom);
        }

        return virtualDom;
    } else {
        // validArea is smaller than natural intersection, need to create two virtual DOMs
        // Create the outer virtual DOM with validArea as bounds, but with the original renderingDom.id
        const outerVirtualDom = provider.createSimpleDom(renderingDom.id, renderingDom.content.validArea);

        // Create the inner virtual DOM with original bounds, but with ClippedVirtualDomId
        // Children should be processed with the outer DOM's validArea as their parent validArea
        const innerVirtualDom = fillVirtualDom(
            renderingDom,
            record,
            provider,
            ClippedVirtualDomId,
        );

        // Add to the doms map only if ID is not negative
        if (renderingDom.id >= 0) {
            record.doms.set(renderingDom.id, outerVirtualDom);
        }

        // Set the inner virtual DOM as the only child of the outer virtual DOM
        outerVirtualDom.updateChildren([innerVirtualDom]);

        return outerVirtualDom;
    }
}

export function createVirtualDomFromRenderingDom(renderingDom: SCHEMA.RenderingDom, elements: ElementManager, provider: IVirtualDomProvider): VirtualDomRecord {
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
