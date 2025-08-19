import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../GacUIElementManager';

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
    fixBounds(
        virtualDom: IVirtualDom,
        target: HTMLElement,
        width: number,
        height: number): void;
}

export const RootVirtualDomId: SCHEMA.TYPES.Integer = -1;
export const ClippedVirtualDomId: SCHEMA.TYPES.Integer = -2;

export abstract class VirtualDomBase<T extends VirtualDomBase<T>> implements IVirtualDom {
    private _parent: T | undefined;
    private _children: T[];

    constructor(
        public readonly id: SCHEMA.TYPES.Integer,
        public globalBounds: SCHEMA.Rect,
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
        this.onUpdateTypedDesc(typedDesc);
    }

    private isRootOfSelf(child: T): boolean {

        let current: T = this as unknown as T;
        while (true) {
            if (!current._parent) {
                return current === child;
            }
            current = current._parent;
        }
    }

    updateChildren(children: IVirtualDom[]): void {
        const expectedType = this.getExpectedChildType();

        for (const child of children) {
            if (!this.isExpectedChildType(child)) {
                throw new Error(`All children must be ${expectedType} instances.`);
            }
            if (child === this) {
                throw new Error('Child cannot be this node itself.');
            }
            const typedChild = child as unknown as T;
            if (typedChild._parent !== undefined && typedChild._parent !== (this as unknown as T)) {
                throw new Error('Child already has a different parent.');
            }
            if (this.isRootOfSelf(typedChild)) {
                throw new Error('Child cannot be the root of this node.');
            }
        }

        for (const child of this._children) {
            child._parent = undefined;
        }

        this._children = [...children] as T[];

        for (const child of this._children) {
            child._parent = this as unknown as T;
        }

        this.onUpdateChildren(this._children);
    }

    // Abstract methods that subclasses must implement
    protected abstract getExpectedChildType(): string;
    protected abstract isExpectedChildType(child: IVirtualDom): boolean;
    protected abstract onUpdateTypedDesc(typedDesc: TypedElementDesc | undefined): void;
    protected abstract onUpdateChildren(children: T[]): void;
}