import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementManager, TypedElementDesc } from '../GacUIElementManager';
import {
    IVirtualDom,
    IVirtualDomProvider,
    VirtualDomBaseRoot,
    VirtualDomBaseValidArea,
    VirtualDomBaseOrdinary,
    VirtualDomProperties
} from '../dom/virtualDom';
import { applyBounds, applyCommonStyle, applyTypedStyle, getExtraBorder, onSolidLabelResized, renderDebugInfo } from './elementStyles';

function mapCursorToCSS(cursor: SCHEMA.WindowSystemCursorType): string | undefined {
    switch (cursor) {
        case SCHEMA.WindowSystemCursorType.SmallWaiting:
        case SCHEMA.WindowSystemCursorType.LargeWaiting:
            return 'wait';
        case SCHEMA.WindowSystemCursorType.Arrow:
            return 'default';
        case SCHEMA.WindowSystemCursorType.Cross:
            return 'crosshair';
        case SCHEMA.WindowSystemCursorType.Hand:
            return 'pointer';
        case SCHEMA.WindowSystemCursorType.Help:
            return 'help';
        case SCHEMA.WindowSystemCursorType.IBeam:
            return 'text';
        case SCHEMA.WindowSystemCursorType.SizeAll:
            return 'move';
        case SCHEMA.WindowSystemCursorType.SizeNESW:
            return 'nesw-resize';
        case SCHEMA.WindowSystemCursorType.SizeNS:
            return 'ns-resize';
        case SCHEMA.WindowSystemCursorType.SizeNWSE:
            return 'nwse-resize';
        case SCHEMA.WindowSystemCursorType.SizeWE:
            return 'ew-resize';
        default:
            return undefined;
    }
}

function mapHitTestToCSS(hitTestResult: SCHEMA.WindowHitTestResult): string | undefined {
    switch (hitTestResult) {
        case SCHEMA.WindowHitTestResult.BorderLeft:
        case SCHEMA.WindowHitTestResult.BorderRight:
            return 'ew-resize';
        case SCHEMA.WindowHitTestResult.BorderTop:
        case SCHEMA.WindowHitTestResult.BorderBottom:
            return 'ns-resize';
        case SCHEMA.WindowHitTestResult.BorderLeftTop:
        case SCHEMA.WindowHitTestResult.BorderRightBottom:
            return 'nwse-resize';
        case SCHEMA.WindowHitTestResult.BorderRightTop:
        case SCHEMA.WindowHitTestResult.BorderLeftBottom:
            return 'nesw-resize';
        default:
            return undefined;
    }
}

type VirtualDomHtmlTypes = VirtualDomHtmlRoot | VirtualDomHtmlValidArea | VirtualDomHtmlOrdinary;

function reconcileChildren(parent: HTMLElement, children: HTMLElement[]): void {
    const expected = new Set(children);
    for (const child of Array.from(parent.childNodes)) {
        if (!expected.has(child as HTMLElement)) child.remove();
    }
    const focused = children.find(child => child.parentNode === parent && child.contains(document.activeElement));
    const focusedIndex = focused === undefined ? -1 : children.indexOf(focused);
    // insertBefore disconnects a moved node. Reorder its siblings instead when
    // that node contains the browser editing host (including at the root).
    let before: Node | undefined = focused;
    for (let i = focusedIndex - 1; i >= 0; i--) {
        const child = children[i];
        if (child.nextSibling !== before) parent.insertBefore(child, before!);
        before = child;
    }
    let next = focused === undefined ? parent.firstChild : focused.nextSibling;
    for (const child of children.slice(focusedIndex + 1)) {
        if (child !== next) parent.insertBefore(child, next);
        next = child.nextSibling;
    }
}

function reconcileRenderingChildren(parent: HTMLElement, children: HTMLElement[]): void {
    const border = getExtraBorder(parent);
    if (border !== undefined) children.unshift(border);
    reconcileChildren(parent, children);
}

class VirtualDomHtmlRoot extends VirtualDomBaseRoot<VirtualDomHtmlTypes> {
    public readonly htmlElement: HTMLElement;

    constructor() {
        super();
        this.htmlElement = document.createElement('div');
    }

    protected getExpectedChildType(): string {
        return 'VirtualDomHtmlValidArea or VirtualDomHtmlOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomHtmlValidArea ||
            child instanceof VirtualDomHtmlOrdinary;
    }

    protected onUpdateChildren(children: VirtualDomHtmlTypes[]): void {
        // Update HTML element children
        const htmlChildren = children.map(child => child.htmlElement);
        reconcileRenderingChildren(this.htmlElement, htmlChildren);
    }
}

class VirtualDomHtmlValidArea extends VirtualDomBaseValidArea<VirtualDomHtmlTypes> {
    public readonly htmlElement: HTMLElement;

    constructor(
        id: SCHEMA.TYPES.Integer,
        validArea: SCHEMA.Rect
    ) {
        super(id, validArea);
        this.htmlElement = document.createElement('div');
        applyCommonStyle(this.htmlElement);
    }

    protected getExpectedChildType(): string {
        return 'VirtualDomHtmlValidArea or VirtualDomHtmlOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomHtmlValidArea ||
            child instanceof VirtualDomHtmlOrdinary;
    }

    protected onUpdateChildren(children: VirtualDomHtmlTypes[]): void {
        // Update HTML element children
        const htmlChildren = children.map(child => child.htmlElement);
        reconcileRenderingChildren(this.htmlElement, htmlChildren);
    }
}

class VirtualDomHtmlOrdinary extends VirtualDomBaseOrdinary<VirtualDomHtmlTypes> {
    public readonly htmlElement: HTMLElement;
    private _rawElement: HTMLDivElement | undefined;

    constructor(
        id: SCHEMA.TYPES.Integer,
        props: VirtualDomProperties,
        private readonly elements: ElementManager,
        pendingElements?: Map<SCHEMA.TYPES.Integer, HTMLElement>
    ) {
        super(id, props);
        const pendingHtml = props.elementId !== undefined && pendingElements !== undefined ? pendingElements.get(props.elementId) : undefined;
        if (pendingHtml !== undefined) {
            this.htmlElement = pendingHtml;
            pendingElements!.delete(props.elementId!);
        } else {
            this.htmlElement = document.createElement('div');
            this.onUpdateTypedDesc(props.elementId, props.typedDesc);
        }
        this.applyCursorStyle(props);
    }

    protected getExpectedChildType(): string {
        return 'VirtualDomHtmlValidArea or VirtualDomHtmlOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomHtmlValidArea ||
            child instanceof VirtualDomHtmlOrdinary;
    }

    protected onUpdateTypedDesc(elementId: SCHEMA.TYPES.Integer | undefined, typedDesc: TypedElementDesc | undefined): void {
        const rawElement = typedDesc?.type === SCHEMA.RendererType.Raw && elementId !== undefined
            ? this.elements.getRawElement(elementId).element
            : undefined;
        if (this._rawElement !== rawElement) {
            if (this._rawElement?.parentElement === this.htmlElement) {
                this._rawElement.remove();
            }
            this._rawElement = rawElement;
        }
        // Apply typed style to the HTML element
        if (typedDesc === undefined) {
            applyCommonStyle(this.htmlElement);
        } else {
            applyTypedStyle(this.htmlElement, typedDesc, this.elements);
        }
        // applyCommonStyle/applyTypedStyle replaces cssText, so re-apply cursor
        this.applyCursorStyle(this.props);
        if (rawElement !== undefined && this.htmlElement.firstChild !== rawElement) {
            this.htmlElement.insertBefore(rawElement, this.htmlElement.firstChild);
        }
    }

    private applyCursorStyle(props: VirtualDomProperties): void {
        let cursorCSS: string | undefined;

        if (props.cursor !== undefined) {
            cursorCSS = mapCursorToCSS(props.cursor);
        } else if (props.hitTestResult !== undefined) {
            cursorCSS = mapHitTestToCSS(props.hitTestResult);
        }

        if (cursorCSS !== undefined) {
            this.htmlElement.style.cursor = cursorCSS;
        } else {
            // Remove the style to use inheritance
            this.htmlElement.style.removeProperty('cursor');
        }
    }

    updateProps(props: VirtualDomProperties): void {
        // Call the base class implementation
        super.updateProps(props);

        // Apply cursor style
        this.applyCursorStyle(props);
    }

    protected onUpdateChildren(children: VirtualDomHtmlTypes[]): void {
        // Raw drawing contents belong to the page. Reconcile only the surrounding
        // renderer node, retaining the lifetime-owned div as its first child.
        const htmlChildren = children.map(child => child.htmlElement);
        if (this._rawElement !== undefined) {
            htmlChildren.unshift(this._rawElement);
        }
        reconcileRenderingChildren(this.htmlElement, htmlChildren);
    }
}

export class VirtualDomHtmlProvider implements IVirtualDomProvider {
    readonly nativeClipping = true;
    constructor(private readonly elements: ElementManager) {
    }

    createDom(
        id: SCHEMA.TYPES.Integer,
        props: VirtualDomProperties,
        pendingElements?: Map<SCHEMA.TYPES.Integer, HTMLElement>
    ): IVirtualDom {
        return new VirtualDomHtmlOrdinary(id, props, this.elements, pendingElements);
    }

    createDomForRoot(): IVirtualDom {
        return new VirtualDomHtmlRoot();
    }

    createDomForValidArea(
        id: SCHEMA.TYPES.Integer,
        validArea: SCHEMA.Rect
    ): IVirtualDom {
        return new VirtualDomHtmlValidArea(id, validArea);
    }

    fixBounds(virtualDom: IVirtualDom, target: HTMLElement, width: number, height: number): void {
        if (!(virtualDom instanceof VirtualDomHtmlRoot ||
            virtualDom instanceof VirtualDomHtmlValidArea ||
            virtualDom instanceof VirtualDomHtmlOrdinary)) {
            throw new Error('VirtualDom must be VirtualDomHtml instance.');
        }

        // Ensure this is a root element (has no parent)
        if (virtualDom.parent !== undefined) {
            throw new Error('fixBounds can only be called on root VirtualDom (with no parent).');
        }

        // Configure root element as container
        virtualDom.htmlElement.style.position = 'relative';
        virtualDom.htmlElement.style.boxSizing = 'border-box';
        virtualDom.htmlElement.style.width = `${width}px`;
        virtualDom.htmlElement.style.height = `${height}px`;
        reconcileChildren(target, [virtualDom.htmlElement]);

        // Apply bounds after mounting so getBoundingClientRect works for measurements
        this.fixBoundsRecursive(virtualDom);
    }

    private fixBoundsRecursive(virtualDom: IVirtualDom): void {
        // Apply bounds to all children
        for (const child of virtualDom.children) {
            if (child instanceof VirtualDomHtmlRoot ||
                child instanceof VirtualDomHtmlValidArea ||
                child instanceof VirtualDomHtmlOrdinary) {
                applyBounds(child.htmlElement, child.bounds);
                const area = child.props.validArea;
                const bounds = child.props.globalBounds;
                child.htmlElement.style.clipPath = area === undefined ? '' :
                    `inset(${Math.max(0, area.y1 - bounds.y1)}px ${Math.max(0, bounds.x2 - area.x2)}px ${Math.max(0, bounds.y2 - area.y2)}px ${Math.max(0, area.x1 - bounds.x1)}px)`;
                if (this.elements.renderDebugInfo) {
                    renderDebugInfo(child.htmlElement);
                }

                if (child.props.typedDesc &&
                    child.props.typedDesc.type === SCHEMA.RendererType.SolidLabel &&
                    child.props.typedDesc.desc.ellipse &&
                    child.props.typedDesc.desc.wrapLine
                ) {
                    onSolidLabelResized(child.htmlElement);
                }
                this.fixBoundsRecursive(child);
            }
        }
    }
}
