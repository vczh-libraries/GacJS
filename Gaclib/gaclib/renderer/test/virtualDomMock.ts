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
import { assert, test, expect } from 'vitest';

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

    protected onUpdateTypedDesc(typedDesc: TypedElementDesc | undefined): void {
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
    ): VirtualDomMockTypes {
        return new VirtualDomMockValidArea(id, globalBounds);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fixBounds(virtualDom: IVirtualDom, target: HTMLElement, width: number, height: number): void {
        throw new Error('Not Implemented');
    }
}

test('VirtualDomProviderMock.createDom creates VirtualDomMock with correct arguments', () => {
    const provider = new VirtualDomProviderMock();
    const id = 123;
    const globalBounds: SCHEMA.Rect = { x1: 10, y1: 20, x2: 30, y2: 40 };
    const hitTestResult = SCHEMA.WindowHitTestResult.Client;
    const cursor = SCHEMA.WindowSystemCursorType.Arrow;
    const typedDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };

    const props: VirtualDomProperties = {
        globalBounds,
        hitTestResult,
        cursor,
        typedDesc
    };

    const dom = provider.createDom(id, props) as VirtualDomMockTypes;

    assert.strictEqual(dom.id, id);
    assert.deepEqual(dom.props.globalBounds, globalBounds);
    assert.deepEqual(dom.bounds, globalBounds); // Root node: bounds === globalBounds
    assert.strictEqual(dom.props.hitTestResult, hitTestResult);
    assert.strictEqual(dom.props.cursor, cursor);
    assert.deepEqual(dom.props.typedDesc, typedDesc);
    assert.isUndefined(dom.parent);
    expect(dom.children).toEqual([]);
});

test('VirtualDomProviderMock.createDom creates VirtualDomMock with undefined optional parameters', () => {
    const provider = new VirtualDomProviderMock();
    const id = 456;
    const globalBounds: SCHEMA.Rect = { x1: 0, y1: 0, x2: 100, y2: 100 };

    const props: VirtualDomProperties = {
        globalBounds,
        hitTestResult: undefined,
        cursor: undefined,
        typedDesc: undefined
    };

    const dom = provider.createDom(id, props) as VirtualDomMockTypes;

    assert.strictEqual(dom.id, id);
    assert.deepEqual(dom.props.globalBounds, globalBounds);
    assert.deepEqual(dom.bounds, globalBounds); // Root node: bounds === globalBounds
    assert.isUndefined(dom.props.hitTestResult);
    assert.isUndefined(dom.props.cursor);
    assert.isUndefined(dom.props.typedDesc);
    assert.isUndefined(dom.parent);
    expect(dom.children).toEqual([]);
});

test('VirtualDomMock.updateChildren throws when child is not VirtualDomMockValidArea or VirtualDomMockOrdinary instance', () => {
    const provider = new VirtualDomProviderMock();
    const parent = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });

    // Create a mock object that implements IVirtualDom but is not VirtualDomMock
    const fakeDom = {} as unknown as IVirtualDom;

    assert.throws(() => {
        parent.updateChildren([fakeDom]);
    }, 'All children must be VirtualDomMockValidArea or VirtualDomMockOrdinary instances.');

    assert.throws(() => {
        parent.updateChildren([provider.createDomForRoot()]);
    }, 'All children must be VirtualDomMockValidArea or VirtualDomMockOrdinary instances.');
});

test('VirtualDomMock.updateChildren throws when child is this node itself', () => {
    const provider = new VirtualDomProviderMock();
    const dom = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });

    assert.throws(() => {
        dom.updateChildren([dom]);
    }, 'Child cannot be this node itself.');
});

test('VirtualDomMock.updateChildren throws when child already has a different parent', () => {
    const provider = new VirtualDomProviderMock();
    const parent1 = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });
    const parent2 = provider.createSimpleDom(2, { x1: 0, y1: 0, x2: 100, y2: 100 });
    const child = provider.createSimpleDom(3, { x1: 0, y1: 0, x2: 50, y2: 50 });

    parent1.updateChildren([child]);

    assert.throws(() => {
        parent2.updateChildren([child]);
    }, 'Child already has a different parent.');
});

test('VirtualDomMock.updateChildren throws when child is the root of this node', () => {
    const provider = new VirtualDomProviderMock();
    const root = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });
    const parent = provider.createSimpleDom(2, { x1: 0, y1: 0, x2: 80, y2: 80 });
    const child = provider.createSimpleDom(3, { x1: 0, y1: 0, x2: 60, y2: 60 });

    // Create hierarchy: root -> parent -> child
    root.updateChildren([parent]);
    parent.updateChildren([child]);

    // Try to make parent a child of child (circular dependency)
    assert.throws(() => {
        child.updateChildren([root]);
    }, 'Child cannot be the root of this node.');
});

test('VirtualDomMock.updateChildren correctly sets parent and children relationships', () => {
    const provider = new VirtualDomProviderMock();
    const parent = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });
    const child1 = provider.createSimpleDom(2, { x1: 0, y1: 0, x2: 40, y2: 40 });
    const child2 = provider.createSimpleDom(3, { x1: 50, y1: 50, x2: 90, y2: 90 });

    // Initially all nodes have no parent and no children
    assert.isUndefined(parent.parent);
    assert.isUndefined(child1.parent);
    assert.isUndefined(child2.parent);
    expect(parent.children).toEqual([]);
    expect(child1.children).toEqual([]);
    expect(child2.children).toEqual([]);

    // Add children to parent
    parent.updateChildren([child1, child2]);

    // Verify parent-child relationships
    assert.isUndefined(parent.parent);
    assert.strictEqual(child1.parent, parent);
    assert.strictEqual(child2.parent, parent);
    expect(parent.children).toEqual([child1, child2]);
    expect(child1.children).toEqual([]);
    expect(child2.children).toEqual([]);
});

test('VirtualDomMock bounds computation - root node', () => {
    const provider = new VirtualDomProviderMock();
    const globalBounds: SCHEMA.Rect = { x1: 100, y1: 200, x2: 300, y2: 400 };
    const root = provider.createSimpleDom(1, globalBounds);

    // Root node: bounds should equal globalBounds
    assert.deepEqual(root.props.globalBounds, globalBounds);
    assert.deepEqual(root.bounds, globalBounds);
});

test('VirtualDomMock bounds computation - child nodes', () => {
    const provider = new VirtualDomProviderMock();
    const parentGlobalBounds: SCHEMA.Rect = { x1: 100, y1: 200, x2: 400, y2: 500 };
    const childGlobalBounds: SCHEMA.Rect = { x1: 150, y1: 250, x2: 250, y2: 350 };

    const parent = provider.createSimpleDom(1, parentGlobalBounds);
    const child = provider.createSimpleDom(2, childGlobalBounds);

    // Before establishing parent-child relationship
    assert.deepEqual(child.props.globalBounds, childGlobalBounds);
    assert.deepEqual(child.bounds, childGlobalBounds); // Still root, so bounds === globalBounds

    // Establish parent-child relationship
    parent.updateChildren([child]);

    // After establishing relationship
    assert.deepEqual(child.props.globalBounds, childGlobalBounds); // globalBounds should not change
    // bounds should be relative to parent: (150-100, 250-200, 250-100, 350-200) = (50, 50, 150, 150)
    assert.deepEqual(child.bounds, { x1: 50, y1: 50, x2: 150, y2: 150 });
});

test('VirtualDomMock bounds computation - nested hierarchy', () => {
    const provider = new VirtualDomProviderMock();
    const rootGlobalBounds: SCHEMA.Rect = { x1: 0, y1: 0, x2: 1000, y2: 1000 };
    const level1GlobalBounds: SCHEMA.Rect = { x1: 100, y1: 200, x2: 600, y2: 700 };
    const level2GlobalBounds: SCHEMA.Rect = { x1: 150, y1: 250, x2: 550, y2: 650 };

    const root = provider.createSimpleDom(1, rootGlobalBounds);
    const level1 = provider.createSimpleDom(2, level1GlobalBounds);
    const level2 = provider.createSimpleDom(3, level2GlobalBounds);

    // Create hierarchy: root -> level1 -> level2
    root.updateChildren([level1]);
    level1.updateChildren([level2]);

    // Verify bounds calculations
    // Root: bounds === globalBounds
    assert.deepEqual(root.bounds, rootGlobalBounds);

    // Level 1: relative to root (0,0) = (100,200,600,700)
    assert.deepEqual(level1.bounds, { x1: 100, y1: 200, x2: 600, y2: 700 });

    // Level 2: relative to level1 (100,200) = (150-100, 250-200, 550-100, 650-200) = (50,50,450,450)
    assert.deepEqual(level2.bounds, { x1: 50, y1: 50, x2: 450, y2: 450 });
});

test('VirtualDomMock.updateChildren correctly reorders children', () => {
    const provider = new VirtualDomProviderMock();
    const parent = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });
    const child1 = provider.createSimpleDom(2, { x1: 0, y1: 0, x2: 30, y2: 30 });
    const child2 = provider.createSimpleDom(3, { x1: 40, y1: 40, x2: 70, y2: 70 });
    const child3 = provider.createSimpleDom(4, { x1: 80, y1: 80, x2: 100, y2: 100 });

    // Set initial order
    parent.updateChildren([child1, child2, child3]);
    expect(parent.children).toEqual([child1, child2, child3]);

    // Reorder children
    parent.updateChildren([child3, child1, child2]);
    expect(parent.children).toEqual([child3, child1, child2]);

    // Verify all children still have the correct parent
    assert.strictEqual(child1.parent, parent);
    assert.strictEqual(child2.parent, parent);
    assert.strictEqual(child3.parent, parent);
});

test('VirtualDomMock.updateChildren works with mixed root nodes and original children', () => {
    const provider = new VirtualDomProviderMock();
    const parent = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });
    const child1 = provider.createSimpleDom(2, { x1: 0, y1: 0, x2: 25, y2: 25 });
    const child2 = provider.createSimpleDom(3, { x1: 30, y1: 30, x2: 55, y2: 55 });
    const newChild1 = provider.createSimpleDom(4, { x1: 60, y1: 60, x2: 85, y2: 85 });
    const newChild2 = provider.createSimpleDom(5, { x1: 90, y1: 90, x2: 100, y2: 100 });

    // Set initial children
    parent.updateChildren([child1, child2]);
    expect(parent.children).toEqual([child1, child2]);

    // Mix original children with new children
    parent.updateChildren([newChild1, child1, newChild2]);

    // Verify the new arrangement
    expect(parent.children).toEqual([newChild1, child1, newChild2]);

    // Verify parent relationships
    assert.strictEqual(newChild1.parent, parent);
    assert.strictEqual(child1.parent, parent);
    assert.strictEqual(newChild2.parent, parent);

    // child2 should no longer have this parent
    assert.isUndefined(child2.parent);
});

test('VirtualDomMock.updateChildren removes old children when setting new ones', () => {
    const provider = new VirtualDomProviderMock();
    const parent = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });
    const oldChild1 = provider.createSimpleDom(2, { x1: 0, y1: 0, x2: 30, y2: 30 });
    const oldChild2 = provider.createSimpleDom(3, { x1: 40, y1: 40, x2: 70, y2: 70 });
    const newChild = provider.createSimpleDom(4, { x1: 80, y1: 80, x2: 100, y2: 100 });

    // Set initial children
    parent.updateChildren([oldChild1, oldChild2]);
    assert.strictEqual(oldChild1.parent, parent);
    assert.strictEqual(oldChild2.parent, parent);

    // Replace with new child
    parent.updateChildren([newChild]);

    // Verify old children are removed
    assert.isUndefined(oldChild1.parent);
    assert.isUndefined(oldChild2.parent);

    // Verify new child is added
    assert.strictEqual(newChild.parent, parent);
    expect(parent.children).toEqual([newChild]);
});

test('VirtualDomMock.updateChildren works with empty array', () => {
    const provider = new VirtualDomProviderMock();
    const parent = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });
    const child = provider.createSimpleDom(2, { x1: 0, y1: 0, x2: 50, y2: 50 });

    // Add a child first
    parent.updateChildren([child]);
    assert.strictEqual(child.parent, parent);
    expect(parent.children).toEqual([child]);

    // Remove all children
    parent.updateChildren([]);
    assert.isUndefined(child.parent);
    expect(parent.children).toEqual([]);
});

test('VirtualDomMock.updateTypedDesc updates typedDesc correctly', () => {
    const provider = new VirtualDomProviderMock();
    const initialDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.SolidBorder,
        desc: {
            id: 1,
            borderColor: '#FF0000',
            shape: { shapeType: SCHEMA.ElementShapeType.Rectangle, radiusX: 0, radiusY: 0 }
        }
    };
    const newDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.SolidBorder,
        desc: {
            id: 1,
            borderColor: '#00FF00',
            shape: { shapeType: SCHEMA.ElementShapeType.Rectangle, radiusX: 5, radiusY: 5 }
        }
    };

    const props: VirtualDomProperties = {
        globalBounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
        hitTestResult: undefined,
        cursor: undefined,
        typedDesc: initialDesc
    };

    const dom = provider.createDom(1, props) as VirtualDomMockTypes;

    assert.deepEqual(dom.props.typedDesc, initialDesc);

    dom.updateTypedDesc(newDesc);

    assert.deepEqual(dom.props.typedDesc, newDesc);
});

test('VirtualDomMock.updateTypedDesc allows undefined to undefined', () => {
    const provider = new VirtualDomProviderMock();

    const props: VirtualDomProperties = {
        globalBounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
        hitTestResult: undefined,
        cursor: undefined,
        typedDesc: undefined
    };

    const dom = provider.createDom(1, props) as VirtualDomMockTypes;

    assert.isUndefined(dom.props.typedDesc);

    dom.updateTypedDesc(undefined);

    assert.isUndefined(dom.props.typedDesc);
});

test('VirtualDomMock.updateTypedDesc allows setting from undefined to defined', () => {
    const provider = new VirtualDomProviderMock();
    const newDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.SolidBackground,
        desc: {
            id: 1,
            backgroundColor: '#808080',
            shape: { shapeType: SCHEMA.ElementShapeType.Rectangle, radiusX: 0, radiusY: 0 }
        }
    };

    const props: VirtualDomProperties = {
        globalBounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
        hitTestResult: undefined,
        cursor: undefined,
        typedDesc: undefined
    };

    const dom = provider.createDom(1, props) as VirtualDomMockTypes;

    assert.isUndefined(dom.props.typedDesc);

    dom.updateTypedDesc(newDesc);

    assert.deepEqual(dom.props.typedDesc, newDesc);
});

test('VirtualDomMock.updateTypedDesc allows setting from defined to undefined', () => {
    const provider = new VirtualDomProviderMock();
    const initialDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.FocusRectangle
    };

    const props: VirtualDomProperties = {
        globalBounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
        hitTestResult: undefined,
        cursor: undefined,
        typedDesc: initialDesc
    };

    const dom = provider.createDom(1, props) as VirtualDomMockTypes;

    assert.deepEqual(dom.props.typedDesc, initialDesc);

    dom.updateTypedDesc(undefined);

    assert.isUndefined(dom.props.typedDesc);
});

test('VirtualDomMock.updateTypedDesc allows changing type', () => {
    const provider = new VirtualDomProviderMock();
    const initialDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.SolidBorder,
        desc: {
            id: 1,
            borderColor: '#FF0000',
            shape: { shapeType: SCHEMA.ElementShapeType.Rectangle, radiusX: 0, radiusY: 0 }
        }
    };
    const differentTypeDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.SolidBackground,
        desc: {
            id: 1,
            backgroundColor: '#00FF00',
            shape: { shapeType: SCHEMA.ElementShapeType.Rectangle, radiusX: 0, radiusY: 0 }
        }
    };

    const props: VirtualDomProperties = {
        globalBounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
        hitTestResult: undefined,
        cursor: undefined,
        typedDesc: initialDesc
    };

    const dom = provider.createDom(1, props) as VirtualDomMockTypes;

    dom.updateTypedDesc(differentTypeDesc);

    assert.deepEqual(dom.props.typedDesc, differentTypeDesc);
});

test('VirtualDomMock.updateTypedDesc allows updating desc part with same type', () => {
    const provider = new VirtualDomProviderMock();
    const initialDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.SolidBorder,
        desc: {
            id: 1,
            borderColor: '#FF0000',
            shape: { shapeType: SCHEMA.ElementShapeType.Rectangle, radiusX: 0, radiusY: 0 }
        }
    };
    const updatedDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.SolidBorder,
        desc: {
            id: 1,
            borderColor: '#00FF00',
            shape: { shapeType: SCHEMA.ElementShapeType.Ellipse, radiusX: 5, radiusY: 10 }
        }
    };

    const props: VirtualDomProperties = {
        globalBounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
        hitTestResult: undefined,
        cursor: undefined,
        typedDesc: initialDesc
    };

    const dom = provider.createDom(1, props) as VirtualDomMockTypes;

    assert.deepEqual(dom.props.typedDesc, initialDesc);

    dom.updateTypedDesc(updatedDesc);

    assert.deepEqual(dom.props.typedDesc, updatedDesc);
});
