import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../GacUIElementManager';
import { 
    IVirtualDom, 
    IVirtualDomProvider, 
    VirtualDomBaseRoot,
    VirtualDomBaseValidArea,
    VirtualDomBaseOrdinary,
    VirtualDomProperties 
} from '../dom/virtualDom';
import { applyBounds, applyCommonStyle, applyTypedStyle, getExtraBorder } from './elementStyles';

type VirtualDomHtmlTypes = VirtualDomHtmlRoot | VirtualDomHtmlValidArea | VirtualDomHtmlOrdinary;

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
        this.htmlElement.replaceChildren(...htmlChildren);
        const border = getExtraBorder(this.htmlElement)
        if (border) {
            this.htmlElement.insertBefore(border, this.htmlElement.firstChild);
        }
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
        this.htmlElement.replaceChildren(...htmlChildren);
        const border = getExtraBorder(this.htmlElement)
        if (border) {
            this.htmlElement.insertBefore(border, this.htmlElement.firstChild);
        }
    }
}

class VirtualDomHtmlOrdinary extends VirtualDomBaseOrdinary<VirtualDomHtmlTypes> {
    public readonly htmlElement: HTMLElement;

    constructor(
        id: SCHEMA.TYPES.Integer,
        props: VirtualDomProperties
    ) {
        super(id, props);
        this.htmlElement = document.createElement('div');

        // Apply initial typed style if provided
        if (props.typedDesc !== undefined) {
            applyTypedStyle(this.htmlElement, props.typedDesc);
        }
    }

    protected getExpectedChildType(): string {
        return 'VirtualDomHtmlValidArea or VirtualDomHtmlOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomHtmlValidArea || 
               child instanceof VirtualDomHtmlOrdinary;
    }

    protected onUpdateTypedDesc(elementId: SCHEMA.TYPES.Integer | undefined, typedDesc: TypedElementDesc | undefined): void {
        void elementId; // elementId parameter added for consistency but not used in this implementation
        // Apply typed style to the HTML element
        if (typedDesc !== undefined) {
            applyTypedStyle(this.htmlElement, typedDesc);
        }
    }

    protected onUpdateChildren(children: VirtualDomHtmlTypes[]): void {
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
        props: VirtualDomProperties
    ): IVirtualDom {
        return new VirtualDomHtmlOrdinary(id, props);
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

        // Apply bounds to all children recursively
        this.fixBoundsRecursive(virtualDom);

        // Configure root element as container
        virtualDom.htmlElement.style.position = 'relative';
        virtualDom.htmlElement.style.boxSizing = 'border-box';
        virtualDom.htmlElement.style.width = `${width}px`;
        virtualDom.htmlElement.style.height = `${height}px`;
        target.replaceChildren(virtualDom.htmlElement);
    }

    private fixBoundsRecursive(virtualDom: IVirtualDom): void {
        // Apply bounds to all children
        for (const child of virtualDom.children) {
            if (child instanceof VirtualDomHtmlRoot || 
                child instanceof VirtualDomHtmlValidArea || 
                child instanceof VirtualDomHtmlOrdinary) {
                if (!child.props.typedDesc) {
                    applyCommonStyle(child.htmlElement);
                }
                applyBounds(child.htmlElement, child.bounds);
                this.fixBoundsRecursive(child);
            }
        }
    }
}
