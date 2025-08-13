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

function getStyle_SolidLabel(desc: SCHEMA.ElementDesc_SolidLabel): string {
    throw new Error('getStyle_SolidLabel not implemented');
}

function getStyle_Polygon(desc: SCHEMA.ElementDesc_Polygon): string {
    throw new Error('getStyle_Polygon not implemented');
}

function getStyle_ImageFrame(desc: SCHEMA.ElementDesc_ImageFrame): string {
    throw new Error('getStyle_ImageFrame not implemented');
}

export type ElementDesc =
    | SCHEMA.ElementDesc_SolidBorder
    | SCHEMA.ElementDesc_SinkBorder
    | SCHEMA.ElementDesc_SinkSplitter
    | SCHEMA.ElementDesc_SolidBackground
    | SCHEMA.ElementDesc_GradientBackground
    | SCHEMA.ElementDesc_InnerShadow
    | SCHEMA.ElementDesc_Polygon
    | SCHEMA.ElementDesc_SolidLabel
    | SCHEMA.ElementDesc_ImageFrame

export interface TypedElementDesc {
    type: SCHEMA.RendererType;
    desc?: ElementDesc;
}

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

export function hasExtraBorderElement(target: HTMLElement): boolean {
    return !!target[ExtraBorderNodeName];
}

function applyTypedStyle_WithExtraBorder<TDesc>(target: HTMLElement, bounds: SCHEMA.Rect, type: SCHEMA.RendererType, desc: TDesc, getStyle: (desc: TDesc) => string): void {
    target.style.cssText = getStyle_Bounds(bounds);
    const element: HTMLElement = ensureExtraBorderElement(target);
    const elementBounds: SCHEMA.Rect = { x1: 0, y1: 0, x2: bounds.x2 - bounds.x1, y2: bounds.y2 - bounds.y1 };
    element.style.cssText = `${getStyle_Bounds(elementBounds)} ${getStyle(desc)}`;
}

export function applyTypedStyle(target: HTMLElement, bounds: SCHEMA.Rect, type: SCHEMA.RendererType, desc?: ElementDesc): void {
    switch (type) {
        case SCHEMA.RendererType.Raw:
            target.style.cssText = getStyle_Bounds(bounds);
            return;
        case SCHEMA.RendererType.FocusRectangle:
            applyTypedStyle_WithExtraBorder(target, bounds, type, undefined, getStyle_FocusRectangle_Border);
            return;
        case SCHEMA.RendererType.SolidBorder:
            applyTypedStyle_WithExtraBorder(target, bounds, type, desc as SCHEMA.ElementDesc_SolidBorder, getStyle_SolidBorder_Border);
            break;
        case SCHEMA.RendererType.SolidBackground:
            applyTypedStyle_WithExtraBorder(target, bounds, type, desc as SCHEMA.ElementDesc_SolidBackground, getStyle_SolidBackground_Border);
            break;
        case SCHEMA.RendererType.GradientBackground:
            applyTypedStyle_WithExtraBorder(target, bounds, type, desc as SCHEMA.ElementDesc_GradientBackground, getStyle_GradientBackground_Border);
            break;
        case SCHEMA.RendererType.SinkBorder:
            target.style.cssText = `${getStyle_Bounds(bounds)} ${getStyle_SinkBorder(desc as SCHEMA.ElementDesc_SinkBorder)}`;
            break;
        case SCHEMA.RendererType.SinkSplitter:
            target.style.cssText = `${getStyle_Bounds(bounds)} ${getStyle_SinkSplitter(desc as SCHEMA.ElementDesc_SinkSplitter)}`;
            break;
        case SCHEMA.RendererType.InnerShadow:
            target.style.cssText = `${getStyle_Bounds(bounds)} ${getStyle_InnerShadow(desc as SCHEMA.ElementDesc_InnerShadow)}`;
            break;
        case SCHEMA.RendererType.SolidLabel:
            target.style.cssText = `${getStyle_Bounds(bounds)} ${getStyle_SolidLabel(desc as SCHEMA.ElementDesc_SolidLabel)}`;
            break;
        case SCHEMA.RendererType.Polygon:
            target.style.cssText = `${getStyle_Bounds(bounds)} ${getStyle_Polygon(desc as SCHEMA.ElementDesc_Polygon)}`;
            break;
        case SCHEMA.RendererType.ImageFrame:
            target.style.cssText = `${getStyle_Bounds(bounds)} ${getStyle_ImageFrame(desc as SCHEMA.ElementDesc_ImageFrame)}`;
            break;
        default:
            throw new Error(`Unsupported renderer type: ${type}`);
    }
}

export function applyStyle(target: HTMLElement, node: SCHEMA.RenderingDom, descOfElements: Map<number, TypedElementDesc>): void {
    if (node.content.element !== null) {
        const elementId = node.content.element;
        const elementDesc = descOfElements.get(elementId);

        if (!elementDesc) {
            throw new Error(`Element of the specified id does not exist: ${elementId}`);
        }

        applyTypedStyle(target, node.content.bounds, elementDesc.type, elementDesc.desc);
    } else {
        // Apply only bounds style when there's no element
        const commonStyle = getStyle_Bounds(node.content.bounds);
        target.style.cssText = commonStyle;
    }
}
