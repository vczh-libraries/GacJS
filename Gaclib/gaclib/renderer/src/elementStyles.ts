import * as SCHEMA from '@gaclib/remote-protocol';

/* eslint-disable @typescript-eslint/no-unused-vars */

export function getStyle_Bounds(bounds: SCHEMA.Rect): string {
    return `background-color: none; display: block; position:absolute; box-sizing: border-box; overflow:hidden; left:${bounds.x1}px; top:${bounds.y1}px; width:${bounds.x2 - bounds.x1}px; height:${bounds.y2 - bounds.y1}px;`;
}

export function getStyle_FocusRectangle(): string {
    return 'outline:1px dashed white; outline-offset:-1px; mix-blend-mode: difference;';
}

export function getStyle_Raw(): string {
    return '';
}

export function getStyle_SolidBorder(desc: SCHEMA.ElementDesc_SolidBorder): string {
    throw new Error('getStyle_SolidBorder not implemented');
}

export function getStyle_SinkBorder(desc: SCHEMA.ElementDesc_SinkBorder): string {
    throw new Error('getStyle_SinkBorder not implemented');
}

export function getStyle_SinkSplitter(desc: SCHEMA.ElementDesc_SinkSplitter): string {
    throw new Error('getStyle_SinkSplitter not implemented');
}

export function getStyle_SolidBackground(desc: SCHEMA.ElementDesc_SolidBackground): string {
    throw new Error('getStyle_SolidBackground not implemented');
}

export function getStyle_GradientBackground(desc: SCHEMA.ElementDesc_GradientBackground): string {
    throw new Error('getStyle_GradientBackground not implemented');
}

export function getStyle_InnerShadow(desc: SCHEMA.ElementDesc_InnerShadow): string {
    throw new Error('getStyle_InnerShadow not implemented');
}

export function getStyle_SolidLabel(desc: SCHEMA.ElementDesc_SolidLabel): string {
    throw new Error('getStyle_SolidLabel not implemented');
}

export function getStyle_Polygon(desc: SCHEMA.ElementDesc_Polygon): string {
    throw new Error('getStyle_Polygon not implemented');
}

export function getStyle_ImageFrame(desc: SCHEMA.ElementDesc_ImageFrame): string {
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

export function applyTypedStyle(target: HTMLElement, bounds: SCHEMA.Rect, type: SCHEMA.RendererType, desc?: ElementDesc): void {
    const commonStyle = getStyle_Bounds(bounds);

    let kindStyle: string;

    switch (type) {
        case SCHEMA.RendererType.FocusRectangle:
            kindStyle = getStyle_FocusRectangle();
            break;
        case SCHEMA.RendererType.Raw:
            kindStyle = getStyle_Raw();
            break;
        case SCHEMA.RendererType.SolidBorder:
            kindStyle = getStyle_SolidBorder(desc as SCHEMA.ElementDesc_SolidBorder);
            break;
        case SCHEMA.RendererType.SinkBorder:
            kindStyle = getStyle_SinkBorder(desc as SCHEMA.ElementDesc_SinkBorder);
            break;
        case SCHEMA.RendererType.SinkSplitter:
            kindStyle = getStyle_SinkSplitter(desc as SCHEMA.ElementDesc_SinkSplitter);
            break;
        case SCHEMA.RendererType.SolidBackground:
            kindStyle = getStyle_SolidBackground(desc as SCHEMA.ElementDesc_SolidBackground);
            break;
        case SCHEMA.RendererType.GradientBackground:
            kindStyle = getStyle_GradientBackground(desc as SCHEMA.ElementDesc_GradientBackground);
            break;
        case SCHEMA.RendererType.InnerShadow:
            kindStyle = getStyle_InnerShadow(desc as SCHEMA.ElementDesc_InnerShadow);
            break;
        case SCHEMA.RendererType.SolidLabel:
            kindStyle = getStyle_SolidLabel(desc as SCHEMA.ElementDesc_SolidLabel);
            break;
        case SCHEMA.RendererType.Polygon:
            kindStyle = getStyle_Polygon(desc as SCHEMA.ElementDesc_Polygon);
            break;
        case SCHEMA.RendererType.ImageFrame:
            kindStyle = getStyle_ImageFrame(desc as SCHEMA.ElementDesc_ImageFrame);
            break;
        default:
            throw new Error(`Unsupported renderer type: ${type}`);
    }

    target.style.cssText = `${commonStyle} ${kindStyle}`;
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
