import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../src/GacUIElementManager';
import { IVirtualDom, IVirtualDomProvider } from '../src/virtualDom';
import { assert, test, expect } from 'vitest';

class VirtualDomMock implements IVirtualDom {
    private _parent: VirtualDomMock | undefined;
    private _children: VirtualDomMock[];

    constructor(
        public readonly id: SCHEMA.TYPES.Integer,
        private _bounds: SCHEMA.Rect,
        public readonly hitTestResult: SCHEMA.WindowHitTestResult | undefined,
        public readonly cursor: SCHEMA.WindowSystemCursorType | undefined,
        private _typedDesc: TypedElementDesc | undefined
    ) {
        this._parent = undefined;
        this._children = [];
    }

    get parent(): IVirtualDom | undefined {
        return this._parent;
    }

    get bounds(): SCHEMA.Rect {
        return this._bounds;
    }

    get typedDesc(): TypedElementDesc | undefined {
        return this._typedDesc;
    }

    get children(): ReadonlyArray<IVirtualDom> {
        return this._children;
    }

    updateBounds(bounds: SCHEMA.Rect): void {
        this._bounds = bounds;
    }

    updateTypedDesc(typedDesc: TypedElementDesc | undefined): void {
        // Only allow undefined to undefined, or same type updates
        if (this._typedDesc === undefined && typedDesc !== undefined) {
            throw new Error('Cannot change typedDesc from undefined to defined.');
        }
        if (this._typedDesc !== undefined && typedDesc === undefined) {
            throw new Error('Cannot change typedDesc from defined to undefined.');
        }
        if (typedDesc !== undefined && this._typedDesc !== undefined) {
            // Ensure the type part is not changed, only the desc part can change
            if (typedDesc.type !== this._typedDesc.type) {
                throw new Error('Cannot change the type of typedDesc, only the desc part can be updated.');
            }
            this._typedDesc = typedDesc;
        }
    }

    private isRootOfSelf(child: VirtualDomMock): boolean {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: VirtualDomMock = this;
        while (true) {
            if (!current._parent) {
                return current === child;
            }
            current = current._parent;
        }
    }

    updateChildren(children: IVirtualDom[]): void {
        for (const child of children) {
            if (!(child instanceof VirtualDomMock)) {
                throw new Error('All children must be VirtualDomMock instances.');
            }
            if (child === this) {
                throw new Error('Child cannot be this node itself.');
            }
            if (child._parent !== undefined && child._parent !== this) {
                throw new Error('Child already has a different parent.');
            }
            if (this.isRootOfSelf(child)) {
                throw new Error('Child cannot be the root of this node.');
            }
        }

        for (const child of this._children) {
            child._parent = undefined;
        }

        this._children = [...children] as VirtualDomMock[];

        for (const child of this._children) {
            child._parent = this;
        }
    }
}

export class VirtualDomProviderMock implements IVirtualDomProvider {
    createDom(
        id: SCHEMA.TYPES.Integer,
        bounds: SCHEMA.Rect,
        hitTestResult: SCHEMA.WindowHitTestResult | undefined,
        cursor: SCHEMA.WindowSystemCursorType | undefined,
        typedDesc: TypedElementDesc | undefined
    ): IVirtualDom {
        return new VirtualDomMock(id, bounds, hitTestResult, cursor, typedDesc);
    }

    createSimpleDom(
        id: SCHEMA.TYPES.Integer,
        bounds: SCHEMA.Rect
    ): VirtualDomMock {
        return new VirtualDomMock(id, bounds, undefined, undefined, undefined);
    }
}

test('VirtualDomProviderMock.createDom creates VirtualDomMock with correct arguments', () => {
    const provider = new VirtualDomProviderMock();
    const id = 123;
    const bounds: SCHEMA.Rect = { x1: 10, y1: 20, x2: 30, y2: 40 };
    const hitTestResult = SCHEMA.WindowHitTestResult.Client;
    const cursor = SCHEMA.WindowSystemCursorType.Arrow;
    const typedDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };

    const dom = provider.createDom(id, bounds, hitTestResult, cursor, typedDesc) as VirtualDomMock;

    assert.strictEqual(dom.id, id);
    assert.deepEqual(dom.bounds, bounds);
    assert.strictEqual(dom.hitTestResult, hitTestResult);
    assert.strictEqual(dom.cursor, cursor);
    assert.deepEqual(dom.typedDesc, typedDesc);
    assert.isUndefined(dom.parent);
    expect(dom.children).toEqual([]);
});

test('VirtualDomProviderMock.createDom creates VirtualDomMock with undefined optional parameters', () => {
    const provider = new VirtualDomProviderMock();
    const id = 456;
    const bounds: SCHEMA.Rect = { x1: 0, y1: 0, x2: 100, y2: 100 };

    const dom = provider.createDom(id, bounds, undefined, undefined, undefined) as VirtualDomMock;

    assert.strictEqual(dom.id, id);
    assert.deepEqual(dom.bounds, bounds);
    assert.isUndefined(dom.hitTestResult);
    assert.isUndefined(dom.cursor);
    assert.isUndefined(dom.typedDesc);
    assert.isUndefined(dom.parent);
    expect(dom.children).toEqual([]);
});

test('VirtualDomMock.updateBounds updates bounds correctly', () => {
    const provider = new VirtualDomProviderMock();
    const initialBounds: SCHEMA.Rect = { x1: 0, y1: 0, x2: 10, y2: 10 };
    const newBounds: SCHEMA.Rect = { x1: 5, y1: 5, x2: 15, y2: 15 };

    const dom = provider.createSimpleDom(1, initialBounds);

    assert.deepEqual(dom.bounds, initialBounds);

    dom.updateBounds(newBounds);

    assert.deepEqual(dom.bounds, newBounds);
});

test('VirtualDomMock.updateChildren throws when child is not VirtualDomMock instance', () => {
    const provider = new VirtualDomProviderMock();
    const parent = provider.createSimpleDom(1, { x1: 0, y1: 0, x2: 100, y2: 100 });

    // Create a mock object that implements IVirtualDom but is not VirtualDomMock
    const fakeDom = {} as unknown as IVirtualDom;

    assert.throws(() => {
        parent.updateChildren([fakeDom]);
    }, 'All children must be VirtualDomMock instances.');
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

    const dom = provider.createDom(1, { x1: 0, y1: 0, x2: 10, y2: 10 }, undefined, undefined, initialDesc) as VirtualDomMock;

    assert.deepEqual(dom.typedDesc, initialDesc);

    dom.updateTypedDesc(newDesc);

    assert.deepEqual(dom.typedDesc, newDesc);
});

test('VirtualDomMock.updateTypedDesc allows undefined to undefined', () => {
    const provider = new VirtualDomProviderMock();

    const dom = provider.createDom(1, { x1: 0, y1: 0, x2: 10, y2: 10 }, undefined, undefined, undefined) as VirtualDomMock;

    assert.isUndefined(dom.typedDesc);

    dom.updateTypedDesc(undefined);

    assert.isUndefined(dom.typedDesc);
});

test('VirtualDomMock.updateTypedDesc throws when trying to set from undefined to defined', () => {
    const provider = new VirtualDomProviderMock();
    const newDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.SolidBackground,
        desc: {
            id: 1,
            backgroundColor: '#808080',
            shape: { shapeType: SCHEMA.ElementShapeType.Rectangle, radiusX: 0, radiusY: 0 }
        }
    };

    const dom = provider.createDom(1, { x1: 0, y1: 0, x2: 10, y2: 10 }, undefined, undefined, undefined) as VirtualDomMock;

    assert.isUndefined(dom.typedDesc);

    assert.throws(() => {
        dom.updateTypedDesc(newDesc);
    }, 'Cannot change typedDesc from undefined to defined.');

    // Verify original typedDesc is unchanged
    assert.isUndefined(dom.typedDesc);
});

test('VirtualDomMock.updateTypedDesc throws when trying to set from defined to undefined', () => {
    const provider = new VirtualDomProviderMock();
    const initialDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.FocusRectangle
    };

    const dom = provider.createDom(1, { x1: 0, y1: 0, x2: 10, y2: 10 }, undefined, undefined, initialDesc) as VirtualDomMock;

    assert.deepEqual(dom.typedDesc, initialDesc);

    assert.throws(() => {
        dom.updateTypedDesc(undefined);
    }, 'Cannot change typedDesc from defined to undefined.');

    // Verify original typedDesc is unchanged
    assert.deepEqual(dom.typedDesc, initialDesc);
});

test('VirtualDomMock.updateTypedDesc throws when trying to change type', () => {
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

    const dom = provider.createDom(1, { x1: 0, y1: 0, x2: 10, y2: 10 }, undefined, undefined, initialDesc) as VirtualDomMock;

    assert.throws(() => {
        dom.updateTypedDesc(differentTypeDesc);
    }, 'Cannot change the type of typedDesc, only the desc part can be updated.');

    // Verify original typedDesc is unchanged
    assert.deepEqual(dom.typedDesc, initialDesc);
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

    const dom = provider.createDom(1, { x1: 0, y1: 0, x2: 10, y2: 10 }, undefined, undefined, initialDesc) as VirtualDomMock;

    assert.deepEqual(dom.typedDesc, initialDesc);

    dom.updateTypedDesc(updatedDesc);

    assert.deepEqual(dom.typedDesc, updatedDesc);
});
