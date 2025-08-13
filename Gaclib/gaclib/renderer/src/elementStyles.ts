import * as SCHEMA from '@gaclib/remote-protocol';

/* eslint-disable @typescript-eslint/no-unused-vars */

export function getStyle_Bounds(bounds: SCHEMA.Rect): string {
    return `background-color: none; display: block; position:absolute; box-sizing: border-box; overflow:hidden; left:${bounds.x1}px; top:${bounds.y1}px; width:${bounds.x2 - bounds.x1}px; height:${bounds.y2 - bounds.y1}px;`;
}

function getStyle_FocusRectangle_Border(): string {
    return 'outline:1px dashed white; outline-offset:-1px; mix-blend-mode: difference;';
}

function getStyle_SolidBorder_Border(desc: SCHEMA.ElementDesc_SolidBorder): string {
    switch (desc.shape.shapeType) {
        case SCHEMA.ElementShapeType.Rectangle:
            return `outline:1px solid ${desc.borderColor}; outline-offset:-1px;`;
        case SCHEMA.ElementShapeType.Ellipse:
            return `outline:1px solid ${desc.borderColor}; outline-offset:-1px; border-radius: 50%;`;
        case SCHEMA.ElementShapeType.RoundRect:
            return `outline:1px solid ${desc.borderColor}; outline-offset:-1px; border-radius: ${desc.shape.radiusX}px ${desc.shape.radiusY}px;`;
        default:
            throw new Error(`Unsupported shape type: ${desc.shape.shapeType}`);
    }
}

function getStyle_SolidBackground_Border(desc: SCHEMA.ElementDesc_SolidBackground): string {
    throw new Error('getStyle_SolidBackground not implemented');
}

function getStyle_GradientBackground_Border(desc: SCHEMA.ElementDesc_GradientBackground): string {
    throw new Error('getStyle_GradientBackground not implemented');
}

function getStyle_SinkBorder(desc: SCHEMA.ElementDesc_SinkBorder): string {
    throw new Error('getStyle_SinkBorder not implemented');
}

function getStyle_SinkSplitter(desc: SCHEMA.ElementDesc_SinkSplitter): string {
    throw new Error('getStyle_SinkSplitter not implemented');
}

function getStyle_InnerShadow(desc: SCHEMA.ElementDesc_InnerShadow): string {
    throw new Error('getStyle_InnerShadow not implemented');
}

function getStyle_Polygon(desc: SCHEMA.ElementDesc_Polygon): string {
    throw new Error('getStyle_Polygon not implemented');
}

function getStyle_ImageFrame(desc: SCHEMA.ElementDesc_ImageFrame): string {
    throw new Error('getStyle_ImageFrame not implemented');
}

function getStyle_SolidLabel_Border(desc: SCHEMA.ElementDesc_SolidLabel): string {
    throw new Error('getStyle_SolidLabel not implemented');
}

export type TypedElementDesc =
    | { type: SCHEMA.RendererType.Raw }
    | { type: SCHEMA.RendererType.FocusRectangle }
    | { type: SCHEMA.RendererType.SolidBorder; desc: SCHEMA.ElementDesc_SolidBorder }
    | { type: SCHEMA.RendererType.SinkBorder; desc: SCHEMA.ElementDesc_SinkBorder }
    | { type: SCHEMA.RendererType.SinkSplitter; desc: SCHEMA.ElementDesc_SinkSplitter }
    | { type: SCHEMA.RendererType.SolidBackground; desc: SCHEMA.ElementDesc_SolidBackground }
    | { type: SCHEMA.RendererType.GradientBackground; desc: SCHEMA.ElementDesc_GradientBackground }
    | { type: SCHEMA.RendererType.InnerShadow; desc: SCHEMA.ElementDesc_InnerShadow }
    | { type: SCHEMA.RendererType.SolidLabel; desc: SCHEMA.ElementDesc_SolidLabel }
    | { type: SCHEMA.RendererType.Polygon; desc: SCHEMA.ElementDesc_Polygon }
    | { type: SCHEMA.RendererType.ImageFrame; desc: SCHEMA.ElementDesc_ImageFrame };

const ExtraBorderNodeName = '$GacUI-FocusRectangle-Border';

function ensureExtraBorderElement(target: HTMLElement): HTMLElement {
    let element: HTMLElement = target[ExtraBorderNodeName] as unknown as HTMLElement;
    if (!element) {
        element = document.createElement('div');
        target.insertBefore(element, target.firstChild);
        target[ExtraBorderNodeName] = element;
    }
    return element;
}

function ensureNoExtraBorderElement(target: HTMLElement): void {
    const element: HTMLElement = target[ExtraBorderNodeName] as unknown as HTMLElement;
    if (element) {
        target.removeChild(element);
        delete target[ExtraBorderNodeName];
    }
}

export function hasExtraBorderElement(target: HTMLElement): boolean {
    return !!target[ExtraBorderNodeName];
}

interface ElementDescWithShape {
    shape: SCHEMA.ElementShape;
};

function applyTypedStyle_WithoutExtraBorder<TDesc>(target: HTMLElement, bounds: SCHEMA.Rect, desc: TDesc, getStyle: (desc: TDesc) => string): void {
    target.style.cssText = `${getStyle_Bounds(bounds)} ${getStyle(desc)}`;
}

function applyTypedStyle_WithExtraBorder<TDesc>(target: HTMLElement, bounds: SCHEMA.Rect, desc: TDesc, getStyle: (desc: TDesc) => string): void {
    target.style.cssText = getStyle_Bounds(bounds);
    const element: HTMLElement = ensureExtraBorderElement(target);
    const elementBounds: SCHEMA.Rect = { x1: 0, y1: 0, x2: bounds.x2 - bounds.x1, y2: bounds.y2 - bounds.y1 };
    element.style.cssText = `${getStyle_Bounds(elementBounds)} ${getStyle(desc)}`;
}

function applyTypedStyle_WithShapedBorder<TDesc extends ElementDescWithShape>(target: HTMLElement, bounds: SCHEMA.Rect, desc: TDesc, getStyle: (desc: TDesc) => string): void {
    if (desc.shape.shapeType === SCHEMA.ElementShapeType.Rectangle) {
        ensureNoExtraBorderElement(target);
        applyTypedStyle_WithoutExtraBorder(target, bounds, desc, getStyle);
    } else {
        applyTypedStyle_WithExtraBorder(target, bounds, desc, getStyle);
    }
}

export function applyTypedStyle(target: HTMLElement, bounds: SCHEMA.Rect, typedDesc: TypedElementDesc): void {
    const elementType: string = typedDesc.type;
    switch (typedDesc.type) {
        case SCHEMA.RendererType.Raw:
            target.style.cssText = getStyle_Bounds(bounds);
            return;
        case SCHEMA.RendererType.FocusRectangle:
            applyTypedStyle_WithExtraBorder(target, bounds, undefined, getStyle_FocusRectangle_Border);
            return;
        case SCHEMA.RendererType.SolidBorder:
            applyTypedStyle_WithShapedBorder(target, bounds, typedDesc.desc, getStyle_SolidBorder_Border);
            break;
        case SCHEMA.RendererType.SolidBackground:
            applyTypedStyle_WithShapedBorder(target, bounds, typedDesc.desc, getStyle_SolidBackground_Border);
            break;
        case SCHEMA.RendererType.GradientBackground:
            applyTypedStyle_WithShapedBorder(target, bounds, typedDesc.desc, getStyle_GradientBackground_Border);
            break;
        case SCHEMA.RendererType.SinkBorder:
            applyTypedStyle_WithExtraBorder(target, bounds, typedDesc.desc, getStyle_SinkBorder);
            break;
        case SCHEMA.RendererType.SinkSplitter:
            applyTypedStyle_WithExtraBorder(target, bounds, typedDesc.desc, getStyle_SinkSplitter);
            break;
        case SCHEMA.RendererType.InnerShadow:
            applyTypedStyle_WithoutExtraBorder(target, bounds, typedDesc.desc, getStyle_InnerShadow);
            break;
        case SCHEMA.RendererType.Polygon:
            applyTypedStyle_WithoutExtraBorder(target, bounds, typedDesc.desc, getStyle_Polygon);
            break;
        case SCHEMA.RendererType.ImageFrame:
            applyTypedStyle_WithoutExtraBorder(target, bounds, typedDesc.desc, getStyle_ImageFrame);
            break;
        case SCHEMA.RendererType.SolidLabel:
            applyTypedStyle_WithExtraBorder(target, bounds, typedDesc.desc, getStyle_SolidLabel_Border);
            break;
        default:
            throw new Error(`Unsupported renderer type: ${elementType}`);
    }
}

export function applyStyle(target: HTMLElement, node: SCHEMA.RenderingDom, descOfElements: Map<number, TypedElementDesc>): void {
    if (node.content.element !== null) {
        const elementId = node.content.element;
        const elementDesc = descOfElements.get(elementId);

        if (!elementDesc) {
            throw new Error(`Element of the specified id does not exist: ${elementId}`);
        }

        applyTypedStyle(target, node.content.bounds, elementDesc);
    } else {
        // Apply only bounds style when there's no element
        const commonStyle = getStyle_Bounds(node.content.bounds);
        target.style.cssText = commonStyle;
    }
}
