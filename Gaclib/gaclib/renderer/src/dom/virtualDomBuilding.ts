import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementManager, TypedElementDesc } from '../GacUIElementManager';
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

/****************************************************************************************
 * createVirtualDomFromRenderingDom
 ***************************************************************************************/

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

    // Create props for the virtual DOM
    const props = {
        globalBounds: renderingDom.content.bounds,
        hitTestResult: renderingDom.content.hitTestResult || undefined,
        cursor: renderingDom.content.cursor || undefined,
        typedDesc
    };

    // Create the virtual DOM
    const virtualDom = provider.createDom(id, props);

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
        const outerVirtualDom = provider.createDomForValidArea(renderingDom.id, renderingDom.content.validArea);

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
        screen: provider.createDomForRoot(),
        doms: new Map(),
        elementToDoms: new Map(),
        elements
    };

    // Process and update children on the screen
    processAndUpdateChildren(renderingDom, record.screen, record, provider);

    // Return the result
    return record;
}

/****************************************************************************************
 * updateVirtualDomWithRenderingDomDiff
 ***************************************************************************************/

interface PropsAfterDiff {
    bounds: SCHEMA.Rect;
    validArea: SCHEMA.Rect;
    parentId: SCHEMA.TYPES.Integer;
    outerDom?: IVirtualDom;
    innerDom?: IVirtualDom;
}

function collectPropsBeforeDiff(
    virtualDom: IVirtualDom,
    parentValidArea: SCHEMA.Rect | undefined,
    props: Map<SCHEMA.TYPES.Integer, PropsAfterDiff>
): void {
    let validArea: SCHEMA.Rect | undefined;
    if (virtualDom.id >= 0) {
        validArea = parentValidArea ? intersectRects(parentValidArea, virtualDom.props.globalBounds) : virtualDom.props.globalBounds;

        let parent = virtualDom.parent!;
        if (parent.id === ClippedVirtualDomId) {
            parent = parent.parent!;
        }

        const isValidAreaDom = virtualDom.id >= 0 && virtualDom.children.length === 1 && virtualDom.children[0].id === ClippedVirtualDomId;
        props.set(virtualDom.id, {
            bounds: isValidAreaDom ? virtualDom.children[0].props.globalBounds : virtualDom.props.globalBounds,
            validArea,
            parentId: parent.id,
            outerDom: virtualDom,
            innerDom: isValidAreaDom ? virtualDom.children[0] : virtualDom
        });
    }

    for (const child of virtualDom.children) {
        collectPropsBeforeDiff(child, validArea, props);
    }
}

function collectPropsAfterDiff(
    diffsInOrder: SCHEMA.RenderingDom_DiffsInOrder,
    props: Map<SCHEMA.TYPES.Integer, PropsAfterDiff>
): void {
    if (!diffsInOrder.diffsInOrder) {
        return;
    }

    for (const diff of diffsInOrder.diffsInOrder) {
        if (diff.diffType == SCHEMA.RenderingDom_DiffType.Created) {
            if (!diff.content || !diff.children) {
                throw new Error(`RenderingDom_Diff with Created must have content or children available: ${JSON.stringify(diff, undefined, 4)}`);
            }
            if (props.has(diff.id)) {
                throw new Error(`RenderingDom_Diff with Created must use unused ID: ${JSON.stringify(diff, undefined, 4)}`);
            }
            props.set(diff.id, {
                bounds: diff.content.bounds,
                validArea: diff.content.validArea,
                parentId: -2
            });
        }
    }

    for (const diff of diffsInOrder.diffsInOrder) {
        if (diff.diffType == SCHEMA.RenderingDom_DiffType.Modified) {
            if (!props.has(diff.id)) {
                throw new Error(`RenderingDom_Diff with Modified must use existing ID: ${JSON.stringify(diff, undefined, 4)}`);
            }
            if (diff.content) {
                const propsBeforeDiff = props.get(diff.id)!;
                propsBeforeDiff.bounds = diff.content.bounds;
                propsBeforeDiff.validArea = diff.content.validArea;
            }
        }
    }

    for (const diff of diffsInOrder.diffsInOrder) {
        if (diff.diffType == SCHEMA.RenderingDom_DiffType.Deleted) {
            if (!props.has(diff.id)) {
                throw new Error(`RenderingDom_Diff with Deleted must use existing ID: ${JSON.stringify(diff, undefined, 4)}`);
            }
            props.delete(diff.id);
        }
    }

    for (const diff of diffsInOrder.diffsInOrder) {
        switch (diff.diffType) {
            case SCHEMA.RenderingDom_DiffType.Created:
            case SCHEMA.RenderingDom_DiffType.Modified:
                if (diff.children) {
                    for (const child of diff.children) {
                        if (!props.has(child)) {
                            throw new Error(`RenderingDom_Diff should not use invalid child id ${diff.diffType}: ${JSON.stringify(diff, undefined, 4)}`);
                        }
                        props.get(child)!.parentId = diff.id;
                    }
                }
                break;
        }
    }

    for (const diff of diffsInOrder.diffsInOrder) {
        if (diff.diffType == SCHEMA.RenderingDom_DiffType.Created) {
            if (props.get(diff.id)!.parentId === -2) {
                throw new Error(`RenderingDom_Diff should not be dangling: ${JSON.stringify(diff, undefined, 4)}`);
            }
        }
    }
}

 
function ensureVirtualDomForNewRenderingDom(
    diffsInOrder: SCHEMA.RenderingDom_DiffsInOrder,
    record: VirtualDomRecord,
    provider: IVirtualDomProvider,
    props: Map<SCHEMA.TYPES.Integer, PropsAfterDiff>
): void {
}

export function updateVirtualDomWithRenderingDomDiff(diffsInOrder: SCHEMA.RenderingDom_DiffsInOrder, record: VirtualDomRecord, provider: IVirtualDomProvider): void {
    const props: Map<SCHEMA.TYPES.Integer, PropsAfterDiff> = new Map();
    collectPropsBeforeDiff(record.screen, undefined, props);
    collectPropsAfterDiff(diffsInOrder, props);
    ensureVirtualDomForNewRenderingDom(diffsInOrder, record, provider, props);
    throw new Error(`Not Implemented (updateVirtualDomWithRenderingDomDiff)\nArguments: ${JSON.stringify(diffsInOrder, undefined, 4)}`);
}
