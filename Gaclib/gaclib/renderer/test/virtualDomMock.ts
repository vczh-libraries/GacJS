import * as SCHEMA from '@gaclib/remote-protocol';
import { IVirtualDom, IVirtualDomProvider, TypedElementDesc } from '../src/virtualDom';

class VirtualDomMock implements IVirtualDom {
    private _parent: VirtualDomMock | undefined;
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

    private updateParent(child: VirtualDomMock, newParent: VirtualDomMock | undefined): void {
        const oldParent = child._parent;

        if (oldParent !== undefined && oldParent !== newParent) {
            const index = oldParent._children.indexOf(child);
            if (index !== -1) {
                oldParent._children.splice(index, 1);
            }
        }

        child._parent = newParent;
    }

    updateChildren(children: IVirtualDom[]): void {
        for (const child of children) {
            if (!(child instanceof VirtualDomMock)) {
                throw new Error('All children must be VirtualDomMock instances');
            }
            if (child === this) {
                throw new Error('Child cannot be this node itself');
            }
            if (child._parent !== undefined && child._parent !== this) {
                throw new Error('Child already has a different parent');
            }
            if (this.isRootOfSelf(child)) {
                throw new Error('Child cannot be the root of this node');
            }
        }

        for (const child of this._children) {
            this.updateParent(child as VirtualDomMock, undefined);
        }

        this._children = [...children];

        for (const child of this._children) {
            this.updateParent(child as VirtualDomMock, this);
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
