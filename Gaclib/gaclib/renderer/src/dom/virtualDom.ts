import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../GacUIElementManager';

/*
 * # Converting from RenderingDom(r) to IVirtualDom(v)
 *   r.id -> v.id
 *   r.content.hitTestResult -> v.props.hitTestResult
 *   r.content.cursor -> v.props.cursor
 *   r.content.element -> v.props.typedDesc
 *   r.content.bounds -> v.props.globalBounds
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

export interface VirtualDomProperties {
    readonly globalBounds: SCHEMA.Rect;
    readonly hitTestResult?: SCHEMA.WindowHitTestResult;
    readonly cursor?: SCHEMA.WindowSystemCursorType;
    readonly typedDesc?: TypedElementDesc;
    readonly elementId?: SCHEMA.TYPES.Integer;
}

export interface IVirtualDom {
    get parent(): IVirtualDom | undefined;
    get id(): SCHEMA.TYPES.Integer;
    get bounds(): SCHEMA.Rect;
    get props(): VirtualDomProperties;
    get children(): ReadonlyArray<IVirtualDom>;
    updateChildren(children: IVirtualDom[]): void;
    updateTypedDesc(elementId: SCHEMA.TYPES.Integer | undefined, typedDesc: TypedElementDesc | undefined): void;
    updateProps(props: VirtualDomProperties): void;
}

export interface IVirtualDomProvider {
    createDom(
        id: SCHEMA.TYPES.Integer,
        props: VirtualDomProperties): IVirtualDom;
    createDomForRoot(): IVirtualDom;
    createDomForValidArea(
        id: SCHEMA.TYPES.Integer,
        validArea: SCHEMA.Rect): IVirtualDom;
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
        protected _props: VirtualDomProperties
    ) {
        this._parent = undefined;
        this._children = [];
    }

    get parent(): IVirtualDom | undefined {
        return this._parent;
    }

    get children(): ReadonlyArray<IVirtualDom> {
        return this._children;
    }

    get bounds(): SCHEMA.Rect {
        if (!this.parent) {
            // Root node: bounds === globalBounds
            return this._props.globalBounds;
        }
        // Calculate relative bounds by subtracting parent's global position
        const parentProps = this.parent.props;
        return {
            x1: this._props.globalBounds.x1 - parentProps.globalBounds.x1,
            y1: this._props.globalBounds.y1 - parentProps.globalBounds.y1,
            x2: this._props.globalBounds.x2 - parentProps.globalBounds.x1,
            y2: this._props.globalBounds.y2 - parentProps.globalBounds.y1
        };
    }

    get props(): VirtualDomProperties {
        return this._props;
    }

    updateTypedDesc(elementId: SCHEMA.TYPES.Integer | undefined, typedDesc: TypedElementDesc | undefined): void {
        void elementId;
        void typedDesc;
        throw new Error('updateTypedDesc is not supported for this virtual DOM type.');
    }

    updateProps(props: VirtualDomProperties): void {
        void props;
        throw new Error('updateProps is not supported for this virtual DOM type.');
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

    updateChildren(children: T[]): void {
        const expectedType = this.getExpectedChildType();
        const self = this as unknown as T;

        for (const child of children) {
            if (!this.isExpectedChildType(child)) {
                throw new Error(`All children must be ${expectedType} instances.`);
            }
            if (child === self) {
                throw new Error('Child cannot be this node itself.');
            }
            if (child._parent !== undefined && child._parent !== self) {
                throw new Error('Child already has a different parent.');
            }
            if (this.isRootOfSelf(child)) {
                throw new Error('Child cannot be the root of this node.');
            }
        }

        for (const child of this._children) {
            child._parent = undefined;
        }

        this._children = [...children];

        for (const child of this._children) {
            child._parent = self;
        }

        this.onUpdateChildren(this._children);
    }

    // Abstract methods that subclasses must implement
    protected abstract getExpectedChildType(): string;
    protected abstract isExpectedChildType(child: IVirtualDom): boolean;
    protected abstract onUpdateChildren(children: T[]): void;
}

export abstract class VirtualDomBaseRoot<T extends VirtualDomBase<T>> extends VirtualDomBase<T> {
    constructor() {
        super(RootVirtualDomId, {
            globalBounds: { x1: 0, y1: 0, x2: 0, y2: 0 },
            hitTestResult: undefined,
            cursor: undefined,
            typedDesc: undefined,
            elementId: undefined
        });
    }
}

export abstract class VirtualDomBaseValidArea<T extends VirtualDomBase<T>> extends VirtualDomBase<T> {
    constructor(
        id: SCHEMA.TYPES.Integer,
        validArea: SCHEMA.Rect
    ) {
        super(id, {
            globalBounds: validArea,
            hitTestResult: undefined,
            cursor: undefined,
            typedDesc: undefined,
            elementId: undefined
        });
    }
}

export abstract class VirtualDomBaseOrdinary<T extends VirtualDomBase<T>> extends VirtualDomBase<T> {
    constructor(
        id: SCHEMA.TYPES.Integer,
        props: VirtualDomProperties
    ) {
        super(id, props);
    }

    updateTypedDesc(elementId: SCHEMA.TYPES.Integer | undefined, typedDesc: TypedElementDesc | undefined): void {
        // Validation: elementId and typedDesc must be both undefined or not undefined
        if ((elementId === undefined) !== (typedDesc === undefined)) {
            throw new Error('elementId and typedDesc must be both undefined or not undefined');
        }
        
        this._props = {
            ...this._props,
            elementId,
            typedDesc
        };
        this.onUpdateTypedDesc(elementId, typedDesc);
    }

    updateProps(props: VirtualDomProperties): void {
        this.updateTypedDesc(props.elementId, props.typedDesc);
        this._props = {
            ...props
        };
    }

    // Abstract method that subclasses must implement
    protected abstract onUpdateTypedDesc(elementId: SCHEMA.TYPES.Integer | undefined, typedDesc: TypedElementDesc | undefined): void;
}