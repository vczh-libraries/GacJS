import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc, ElementManager } from '../src/GacUIElementManager';
import {
    IVirtualDom,
    IVirtualDomProvider,
    VirtualDomBaseRoot,
    VirtualDomBaseValidArea,
    VirtualDomBaseOrdinary,
    VirtualDomProperties,
    RootVirtualDomId,
    ClippedVirtualDomId
} from '../src/dom/virtualDom';
import { updateVirtualDomWithRenderingDomDiff, createVirtualDomFromRenderingDom } from '../src/dom/virtualDomBuilding';
import { assert } from 'vitest';

/****************************************************************************************
 * VirtualDomProviderMock
 ***************************************************************************************/

type VirtualDomMockTypes = VirtualDomMockRoot | VirtualDomMockValidArea | VirtualDomMockOrdinary;

class VirtualDomMockRoot extends VirtualDomBaseRoot<VirtualDomMockTypes> {
    protected getExpectedChildType(): string {
        return 'VirtualDomMockValidArea or VirtualDomMockOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomMockValidArea ||
            child instanceof VirtualDomMockOrdinary;
    }

    protected onUpdateChildren(children: VirtualDomMockTypes[]): void {

        void children;
        // Mock implementation - no additional logic needed
    }
}

class VirtualDomMockValidArea extends VirtualDomBaseValidArea<VirtualDomMockTypes> {
    constructor(
        id: SCHEMA.TYPES.Integer,
        validArea: SCHEMA.Rect
    ) {
        super(id, validArea);
    }

    protected getExpectedChildType(): string {
        return 'VirtualDomMockValidArea or VirtualDomMockOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomMockValidArea ||
            child instanceof VirtualDomMockOrdinary;
    }

    protected onUpdateChildren(children: VirtualDomMockTypes[]): void {
        void children;
        // Mock implementation - no additional logic needed
    }
}

class VirtualDomMockOrdinary extends VirtualDomBaseOrdinary<VirtualDomMockTypes> {
    constructor(
        id: SCHEMA.TYPES.Integer,
        props: VirtualDomProperties
    ) {
        super(id, props);
    }

    protected getExpectedChildType(): string {
        return 'VirtualDomMockValidArea or VirtualDomMockOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomMockValidArea ||
            child instanceof VirtualDomMockOrdinary;
    }

    protected onUpdateTypedDesc(elementId: SCHEMA.TYPES.Integer | undefined, typedDesc: TypedElementDesc | undefined): void {
        void elementId;
        void typedDesc;
        // Mock implementation - no additional logic needed
    }

    protected onUpdateChildren(children: VirtualDomMockTypes[]): void {
        void children;
        // Mock implementation - no additional logic needed
    }
}

export class VirtualDomProviderMock implements IVirtualDomProvider {
    createDom(
        id: SCHEMA.TYPES.Integer,
        props: VirtualDomProperties
    ): IVirtualDom {
        return new VirtualDomMockOrdinary(id, props);
    }

    createDomForRoot(): IVirtualDom {
        return new VirtualDomMockRoot();
    }

    createDomForValidArea(
        id: SCHEMA.TYPES.Integer,
        validArea: SCHEMA.Rect
    ): IVirtualDom {
        return new VirtualDomMockValidArea(id, validArea);
    }

    createSimpleDom(
        id: SCHEMA.TYPES.Integer,
        globalBounds: SCHEMA.Rect
    ): IVirtualDom {
        return new VirtualDomMockValidArea(id, globalBounds);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fixBounds(virtualDom: IVirtualDom, target: HTMLElement, width: number, height: number): void {
        throw new Error('Not Implemented');
    }
}

/****************************************************************************************
 * JsonifyVirtualDom
 ***************************************************************************************/

export interface JsonifiedVirtualDom {
    id: SCHEMA.TYPES.Integer;
    bounds: SCHEMA.Rect;
    props: VirtualDomProperties;
    children: JsonifiedVirtualDom[];
}

export function JsonifyVirtualDom(virtualDom: IVirtualDom): JsonifiedVirtualDom {
    return {
        id: virtualDom.id,
        bounds: virtualDom.bounds,
        props: virtualDom.props,
        children: virtualDom.children.map(JsonifyVirtualDom)
    };
}

/****************************************************************************************
 * diffRenderingDom
 ***************************************************************************************/

function iterateRenderingDomInOrder(renderingDom: SCHEMA.RenderingDom, flattened: [SCHEMA.TYPES.Integer, SCHEMA.RenderingDom][]): void {
    flattened.push([renderingDom.id, renderingDom]);

    if (renderingDom.children !== null) {
        for (const child of renderingDom.children) {
            if (child !== null) {
                iterateRenderingDomInOrder(child, flattened);
            }
        }
    }
}

function flattenRenderingDomInOrder(renderingDom: SCHEMA.RenderingDom): [SCHEMA.TYPES.Integer, SCHEMA.RenderingDom][] {
    const flattened: [SCHEMA.TYPES.Integer, SCHEMA.RenderingDom][] = [];
    iterateRenderingDomInOrder(renderingDom, flattened);
    // Sort by id to ensure consistent ordering
    flattened.sort((a, b) => a[0] - b[0]);
    return flattened;
}

function getIdFromList(xs: SCHEMA.TYPES.List<SCHEMA.TYPES.Ptr<SCHEMA.RenderingDom>>): SCHEMA.TYPES.Integer[] {
    return xs === null ? [] : xs.map(x => x!.id);
}

function areChildrenEqual(children1: SCHEMA.TYPES.List<SCHEMA.TYPES.Ptr<SCHEMA.RenderingDom>>, children2: SCHEMA.TYPES.List<SCHEMA.TYPES.Ptr<SCHEMA.RenderingDom>>): boolean {
    const ids1 = getIdFromList(children1);
    const ids2 = getIdFromList(children2);
    return JSON.stringify(ids1) === JSON.stringify(ids2);
}

export function diffRenderingDom(r1: SCHEMA.RenderingDom, r2: SCHEMA.RenderingDom): SCHEMA.RenderingDom_DiffsInOrder {
    if (r1.id !== RootVirtualDomId) {
        throw new Error(`The old RenderingDom should be given a root node.`);
    }
    if (r2.id !== RootVirtualDomId) {
        throw new Error(`The new RenderingDom should be given a root node.`);
    }

    const diffs: SCHEMA.RenderingDom_Diff[] = [];
    const flattened1 = flattenRenderingDomInOrder(r1);
    const flattened2 = flattenRenderingDomInOrder(r2);
    let index1 = 0;
    let index2 = 0;

    while (index1 < flattened1.length || index2 < flattened2.length) {
        const item1 = index1 < flattened1.length ? flattened1[index1][1] : undefined;
        const item2 = index2 < flattened2.length ? flattened2[index2][1] : undefined;

        if ((!item1 && item2) || (item1 && item2 && item1.id > item2.id)) {
            // Created: r2 has something r1 doesn't have
            diffs.push({
                id: item2.id,
                diffType: SCHEMA.RenderingDom_DiffType.Created,
                content: item2.content,
                children: getIdFromList(item2.children)
            });
            index2++;
        } else if ((item1 && !item2) || (item1 && item2 && item1.id < item2.id)) {
            // Deleted: r1 has something r2 doesn't have
            diffs.push({
                id: item1.id,
                diffType: SCHEMA.RenderingDom_DiffType.Deleted,
                content: null,
                children: null
            });
            index1++;
        } else if (item1 && item2) {
            // Same ID, check if modified
            const contentChanged = JSON.stringify(item1.content) !== JSON.stringify(item2.content);
            const childrenChanged = !areChildrenEqual(item1.children, item2.children);

            if (contentChanged || childrenChanged) {
                diffs.push({
                    id: item2.id,
                    diffType: SCHEMA.RenderingDom_DiffType.Modified,
                    content: contentChanged ? item2.content : null,
                    children: childrenChanged ? getIdFromList(item2.children) : null
                });
            }
            index1++;
            index2++;
        }
    }

    return {
        diffsInOrder: diffs
    };
}

/****************************************************************************************
 * Unit Test Helpers
 ***************************************************************************************/

// Helper function to create a valid root RenderingDom with zero bounds
export function createRootRenderingDom(): SCHEMA.RenderingDom {
    return {
        id: RootVirtualDomId,
        content: {
            hitTestResult: null,
            cursor: null,
            element: null,
            bounds: { x1: 0, y1: 0, x2: 0, y2: 0 },
            validArea: { x1: 0, y1: 0, x2: 0, y2: 0 }
        },
        children: null
    };
}

// Helper function to create RenderingDomContent
export function createRenderingDomContent(
    bounds: SCHEMA.Rect,
    hitTestResult: SCHEMA.WindowHitTestResult | null = null,
    cursor: SCHEMA.WindowSystemCursorType | null = null,
    element: SCHEMA.TYPES.Integer | null = null,
    validArea?: SCHEMA.Rect
): SCHEMA.RenderingDomContent {
    return {
        hitTestResult,
        cursor,
        element,
        bounds,
        validArea: validArea ?? bounds // If validArea is not provided, use bounds
    };
}

// Helper function to create simple RenderingDomContent (for cases with mostly null parameters)
export function createSimpleRenderingDomContent(
    bounds: SCHEMA.Rect,
    validArea?: SCHEMA.Rect
): SCHEMA.RenderingDomContent {
    return createRenderingDomContent(bounds, null, null, null, validArea);
}

// Helper function to create a child RenderingDom
export function createChildRenderingDom(
    id: SCHEMA.TYPES.Integer,
    content: SCHEMA.RenderingDomContent,
    children: SCHEMA.RenderingDom[] | null = null
): SCHEMA.RenderingDom {
    return {
        id,
        content,
        children
    };
}

function assertDomDesc(renderingDom: SCHEMA.RenderingDom, elements: ElementManager, dom: IVirtualDom): void {
    // Check typedDesc based on element mapping
    if (renderingDom.content.element !== null) {
        const expectedTypedDesc = elements.getDesc(renderingDom.content.element);
        assert.deepEqual(dom.props.typedDesc, expectedTypedDesc);
        assert.strictEqual(dom.props.elementId, renderingDom.content.element);
    } else {
        assert.isUndefined(dom.props.typedDesc);
        assert.isUndefined(dom.props.elementId);
    }
}

export function assertDomAttributes(renderingDom: SCHEMA.RenderingDom, elements: ElementManager, dom: IVirtualDom, domv?: IVirtualDom): void {
    console.log(`Asserting attributes for RenderingDom ID: ${renderingDom.id}`);
    if (domv === undefined) {
        // Single DOM case: dom should have the original ID and inherit bounds as globalBounds
        assert.strictEqual(dom.id, renderingDom.id);
        assert.deepEqual(dom.props.globalBounds, renderingDom.content.bounds);
        assert.strictEqual(dom.props.hitTestResult, renderingDom.content.hitTestResult ?? undefined);
        assert.strictEqual(dom.props.cursor, renderingDom.content.cursor ?? undefined);

        assertDomDesc(renderingDom, elements, dom);
    } else {
        // Clipped DOM case: dom is outer (with validArea), domv is inner (with bounds and content)
        assert.strictEqual(dom.id, renderingDom.id);
        assert.deepEqual(dom.props.globalBounds, renderingDom.content.validArea);
        assert.isUndefined(dom.props.hitTestResult); // Simple DOM has no properties
        assert.isUndefined(dom.props.cursor);
        assert.isUndefined(dom.props.typedDesc);
        assert.isUndefined(dom.props.elementId);

        assert.strictEqual(domv.id, ClippedVirtualDomId);
        assert.deepEqual(domv.props.globalBounds, renderingDom.content.bounds);
        assert.strictEqual(domv.props.hitTestResult, renderingDom.content.hitTestResult ?? undefined);
        assert.strictEqual(domv.props.cursor, renderingDom.content.cursor ?? undefined);

        assertDomDesc(renderingDom, elements, domv);
    }
}

export function createTestRecord() {
    const elements = new ElementManager();
    const provider = new VirtualDomProviderMock();
    return { elements, provider };
}

export function assertVirtualDomEquality(r1: SCHEMA.RenderingDom, r2: SCHEMA.RenderingDom, diff: SCHEMA.RenderingDom_DiffsInOrder, elements: ElementManager, provider: VirtualDomProviderMock): void {
    const record1 = createVirtualDomFromRenderingDom(r1, elements, provider);
    updateVirtualDomWithRenderingDomDiff(diff, record1, provider);
    const j1 = JsonifyVirtualDom(record1.screen);

    const record2 = createVirtualDomFromRenderingDom(r2, elements, provider);
    const j2 = JsonifyVirtualDom(record2.screen);

    try {
        assert.deepEqual(j1, j2);
    } catch (error) {
        console.log('j1:', JSON.stringify(j1, null, 2));
        console.log('j2:', JSON.stringify(j2, null, 2));
        throw error;
    }
}
