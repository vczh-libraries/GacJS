import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../GacUIElementManager';
import { IVirtualDom, IVirtualDomProvider } from '../virtualDom';
import { applyBounds, applyTypedStyle } from './elementStyles';

class VirtualDomHtml implements IVirtualDom {
    private _parent: VirtualDomHtml | undefined;
    private _children: VirtualDomHtml[];
    public readonly htmlElement: HTMLElement;

    constructor(
        public readonly id: SCHEMA.TYPES.Integer,
        public globalBounds: SCHEMA.Rect,
        public readonly hitTestResult: SCHEMA.WindowHitTestResult | undefined,
        public readonly cursor: SCHEMA.WindowSystemCursorType | undefined,
        private _typedDesc: TypedElementDesc | undefined
    ) {
        this._parent = undefined;
        this._children = [];
        this.htmlElement = document.createElement('div');
        
        // Apply initial typed style if provided
        if (this._typedDesc !== undefined) {
            applyTypedStyle(this.htmlElement, this._typedDesc);
        }
    }

    get parent(): IVirtualDom | undefined {
        return this._parent;
    }

    get bounds(): SCHEMA.Rect {
        if (!this._parent) {
            // Root node: bounds === globalBounds
            return this.globalBounds;
        }
        // Calculate relative bounds by subtracting parent's global position
        const parentGlobalBounds = this._parent.globalBounds;
        return {
            x1: this.globalBounds.x1 - parentGlobalBounds.x1,
            y1: this.globalBounds.y1 - parentGlobalBounds.y1,
            x2: this.globalBounds.x2 - parentGlobalBounds.x1,
            y2: this.globalBounds.y2 - parentGlobalBounds.y1
        };
    }

    get typedDesc(): TypedElementDesc | undefined {
        return this._typedDesc;
    }

    get children(): ReadonlyArray<IVirtualDom> {
        return this._children;
    }

    updateTypedDesc(typedDesc: TypedElementDesc | undefined): void {
        this._typedDesc = typedDesc;
        
        // Apply typed style to the HTML element
        if (typedDesc !== undefined) {
            applyTypedStyle(this.htmlElement, typedDesc);
        }
    }

    private isRootOfSelf(child: VirtualDomHtml): boolean {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: VirtualDomHtml = this;
        while (true) {
            if (!current._parent) {
                return current === child;
            }
            current = current._parent;
        }
    }

    updateChildren(children: IVirtualDom[]): void {
        for (const child of children) {
            if (!(child instanceof VirtualDomHtml)) {
                throw new Error('All children must be VirtualDomHtml instances.');
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

        this._children = [...children] as VirtualDomHtml[];

        for (const child of this._children) {
            child._parent = this;
        }

        // Update HTML element children
        const htmlChildren = this._children.map(child => child.htmlElement);
        this.htmlElement.replaceChildren(...htmlChildren);
    }
}

export class VirtualDomHtmlProvider implements IVirtualDomProvider {
    createDom(
        id: SCHEMA.TYPES.Integer,
        globalBounds: SCHEMA.Rect,
        hitTestResult: SCHEMA.WindowHitTestResult | undefined,
        cursor: SCHEMA.WindowSystemCursorType | undefined,
        typedDesc: TypedElementDesc | undefined
    ): IVirtualDom {
        return new VirtualDomHtml(id, globalBounds, hitTestResult, cursor, typedDesc);
    }

    createSimpleDom(
        id: SCHEMA.TYPES.Integer,
        globalBounds: SCHEMA.Rect
    ): VirtualDomHtml {
        return new VirtualDomHtml(id, globalBounds, undefined, undefined, undefined);
    }

    fixBounds(virtualDom: IVirtualDom): void {
        if (!(virtualDom instanceof VirtualDomHtml)) {
            throw new Error('VirtualDom must be VirtualDomHtml instance.');
        }

        // Ensure this is a root element (has no parent)
        if (virtualDom.parent !== undefined) {
            throw new Error('fixBounds can only be called on root VirtualDom (with no parent).');
        }

        // Configure root element as container
        virtualDom.htmlElement.style.position = 'relative';
        virtualDom.htmlElement.style.boxSizing = 'border-box';

        // Apply bounds to all children recursively
        this.fixBoundsRecursive(virtualDom);
    }

    private fixBoundsRecursive(virtualDom: VirtualDomHtml): void {
        // Apply bounds to all children
        for (const child of virtualDom.children) {
            if (child instanceof VirtualDomHtml) {
                applyBounds(child.htmlElement, child.bounds);
                this.fixBoundsRecursive(child);
            }
        }
    }
}
