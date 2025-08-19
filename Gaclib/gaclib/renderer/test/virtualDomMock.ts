import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../src/GacUIElementManager';
import {
    IVirtualDom,
    IVirtualDomProvider,
    VirtualDomBaseRoot,
    VirtualDomBaseValidArea,
    VirtualDomBaseOrdinary,
    VirtualDomProperties
} from '../src/dom/virtualDom';
import assert from 'assert';

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

export function assertVirtualDomEquals(v1: IVirtualDom, v2: IVirtualDom): void {
    assert.deepStrictEqual(JsonifyVirtualDom(v1), JsonifyVirtualDom(v2));
}

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
    const flattened1 = flattenRenderingDomInOrder(r1);
    const flattened2 = flattenRenderingDomInOrder(r2);

    const diffs: SCHEMA.RenderingDom_Diff[] = [];

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