import * as SCHEMA from '@gaclib/remote-protocol';
import { IVirtualDom, IVirtualDomProvider, TypedElementDesc } from '../src/virtualDom';

class VirtualDomMock implements IVirtualDom {
    private _parent: IVirtualDom | undefined;
    private _children: IVirtualDom[];

    constructor(
        public readonly id: SCHEMA.TYPES.Integer,
        private _bounds: SCHEMA.Rect,
        public readonly hitTestResult: SCHEMA.WindowHitTestResult | undefined,
        public readonly cursor: SCHEMA.WindowSystemCursorType | undefined,
        public readonly typedDesc: TypedElementDesc | undefined
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

    get children(): ReadonlyArray<IVirtualDom> {
        return this._children;
    }

    updateBounds(bounds: SCHEMA.Rect): void {
        this._bounds = bounds;
    }

    updateChildren(children: IVirtualDom[]): void {
        // Clear existing parent references
        for (const child of this._children) {
            if (child instanceof VirtualDomMock) {
                child._parent = undefined;
            }
        }

        // Create a copy of the children array as required
        this._children = [...children];

        // Set parent references for new children
        for (const child of this._children) {
            if (child instanceof VirtualDomMock) {
                child._parent = this;
            }
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
}
