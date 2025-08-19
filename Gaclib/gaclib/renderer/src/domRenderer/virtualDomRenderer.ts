import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../GacUIElementManager';
import { IVirtualDom, IVirtualDomProvider, VirtualDomBase } from '../dom/virtualDom';
import { applyBounds, applyCommonStyle, applyTypedStyle, getExtraBorder } from './elementStyles';

class VirtualDomHtml extends VirtualDomBase<VirtualDomHtml> {
    public readonly htmlElement: HTMLElement;

    constructor(
        id: SCHEMA.TYPES.Integer,
        globalBounds: SCHEMA.Rect,
        hitTestResult: SCHEMA.WindowHitTestResult | undefined,
        cursor: SCHEMA.WindowSystemCursorType | undefined,
        typedDesc: TypedElementDesc | undefined
    ) {
        super(id, globalBounds, hitTestResult, cursor, typedDesc);
        this.htmlElement = document.createElement('div');

        // Apply initial typed style if provided
        if (typedDesc !== undefined) {
            applyTypedStyle(this.htmlElement, typedDesc);
        }
    }

    protected getExpectedChildType(): string {
        return 'VirtualDomHtml';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomHtml;
    }

    protected onUpdateTypedDesc(typedDesc: TypedElementDesc | undefined): void {
        // Apply typed style to the HTML element
        if (typedDesc !== undefined) {
            applyTypedStyle(this.htmlElement, typedDesc);
        }
    }

    protected onUpdateChildren(children: VirtualDomHtml[]): void {
        // Update HTML element children
        const htmlChildren = children.map(child => child.htmlElement);
        this.htmlElement.replaceChildren(...htmlChildren);
        const border = getExtraBorder(this.htmlElement)
        if (border) {
            this.htmlElement.insertBefore(border, this.htmlElement.firstChild);
        }
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

    fixBounds(virtualDom: IVirtualDom, target: HTMLElement, width: number, height: number): void {
        if (!(virtualDom instanceof VirtualDomHtml)) {
            throw new Error('VirtualDom must be VirtualDomHtml instance.');
        }

        // Ensure this is a root element (has no parent)
        if (virtualDom.parent !== undefined) {
            throw new Error('fixBounds can only be called on root VirtualDom (with no parent).');
        }

        // Apply bounds to all children recursively
        this.fixBoundsRecursive(virtualDom);

        // Configure root element as container
        virtualDom.htmlElement.style.position = 'relative';
        virtualDom.htmlElement.style.boxSizing = 'border-box';
        virtualDom.htmlElement.style.width = `${width}px`;
        virtualDom.htmlElement.style.height = `${height}px`;
        target.replaceChildren(virtualDom.htmlElement);
    }

    private fixBoundsRecursive(virtualDom: VirtualDomHtml): void {
        // Apply bounds to all children
        for (const child of virtualDom.children) {
            if (child instanceof VirtualDomHtml) {
                if (!child.typedDesc) {
                    applyCommonStyle(child.htmlElement);
                }
                applyBounds(child.htmlElement, child.bounds);
                this.fixBoundsRecursive(child);
            }
        }
    }
}
