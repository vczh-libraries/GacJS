import * as SCHEMA from '@gaclib/remote-protocol';

const CommonStyle = 'background-color: none; display: block; position:absolute; box-sizing: border-box; overflow:hidden;';
const ExtraBorderNodeName = '$GacUI-FocusRectangle-Border';

export function getStyle_Bounds(bounds: SCHEMA.Rect): string {
    return `${CommonStyle} left:${bounds.x1}px; top:${bounds.y1}px; width:${bounds.x2 - bounds.x1}px; height:${bounds.y2 - bounds.y1}px;`;
}

function getStyle_FocusRectangle_Border(): string {
    return 'outline:1px dashed white; outline-offset:-1px; mix-blend-mode: difference;';
}

function getStyle_BorderRadius(shape: SCHEMA.ElementShape): string {
    switch (shape.shapeType) {
        case SCHEMA.ElementShapeType.Rectangle:
            return '';
        case SCHEMA.ElementShapeType.Ellipse:
            return ` border-radius: 50%;`;
        case SCHEMA.ElementShapeType.RoundRect:
            return ` border-radius: ${shape.radiusX}px / ${shape.radiusY}px;`;
        default:
            throw new Error(`Unsupported ElementShapeType: ${shape.shapeType}`);
    }
}

function getStyle_SolidBorder_Border(desc: SCHEMA.ElementDesc_SolidBorder): string {
    return `outline:1px solid ${desc.borderColor}; outline-offset:-1px;${getStyle_BorderRadius(desc.shape)}`;
}

function getStyle_SolidBackground_Border(desc: SCHEMA.ElementDesc_SolidBackground): string {
    return `background-color: ${desc.backgroundColor};${getStyle_BorderRadius(desc.shape)}`;
}

function getStyle_GradientBackground_Border(desc: SCHEMA.ElementDesc_GradientBackground): string {
    let side: string;
    switch (desc.direction) {
        case SCHEMA.ElementGradientrDirection.Horizontal:
            side = 'right';
            break;
        case SCHEMA.ElementGradientrDirection.Vertical:
            side = 'bottom';
            break;
        case SCHEMA.ElementGradientrDirection.Slash:
            side = 'left bottom';
            break;
        case SCHEMA.ElementGradientrDirection.Backslash:
            side = 'right bottom';
            break;
        default:
            throw new Error(`Unsupported ElementGradientrDirection: ${desc.direction}`);
    }
    return `background: linear-gradient(to ${side}, ${desc.leftTopColor} 0%, ${desc.rightBottomColor} 100%);${getStyle_BorderRadius(desc.shape)}`;
}

function getStyle_SinkBorder(desc: SCHEMA.ElementDesc_SinkBorder): string {
    return `border-style: solid; border-left-color: ${desc.leftTopColor}; border-top-color: ${desc.leftTopColor}; border-right-color: ${desc.rightBottomColor}; border-bottom-color: ${desc.rightBottomColor};`;
}

function getStyle_InnerShadow(desc: SCHEMA.ElementDesc_InnerShadow): string {
    const dirs = ['left', 'top', 'right', 'bottom'];
    const background = `${dirs.map((_dir, i) => `linear-gradient(to ${dirs[(i + 2) % 4]}, ${desc.shadowColor} 0px, transparent ${desc.thickness}px), `).join('')}transparent`;
    const position = `${dirs.map(dir => `${dir} center`).join(', ')}`;
    return `background: ${background}; position: ${position};`;
}

 
function getStyle_Polygon_Border(desc: SCHEMA.ElementDesc_Polygon): string {
    return `width: ${desc.size.x}px; height: ${desc.size.y}px; border: 1px solid ${desc.borderColor}; background-color: ${desc.backgroundColor}; clip-path: polygon(${(<SCHEMA.Point[]>desc.points).map(point => `${point.x}px ${point.y}px`).join(', ')});`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getStyle_ImageFrame(desc: SCHEMA.ElementDesc_ImageFrame): string {
    throw new Error('getStyle_ImageFrame not implemented');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    element.style.cssText = `${CommonStyle} left: 0px; top: 0px; width: 100%; height: 100%; ${getStyle(desc)}`;
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
            {
                target.style.cssText = getStyle_Bounds(bounds);
                const element: HTMLElement = ensureExtraBorderElement(target);
                switch (typedDesc.desc.direction) {
                    case SCHEMA.ElementSplitterDirection.Horizontal:
                        element.style.cssText = `${CommonStyle} width: 100%; height: 2px; top: 0; bottom: 0; margin: auto; border-top: 1px solid ${typedDesc.desc.leftTopColor}; border-bottom: 1px solid ${typedDesc.desc.rightBottomColor};`;
                        break;
                    case SCHEMA.ElementSplitterDirection.Vertical:
                        element.style.cssText = `${CommonStyle} width: 2px; height: 100%; left: 0; right: 0; margin: auto; border-left: 1px solid ${typedDesc.desc.leftTopColor}; border-right: 1px solid ${typedDesc.desc.rightBottomColor};`;
                        break;
                    default:
                        throw new Error(`Unsupported ElementSplitterDirection: ${typedDesc.desc.direction}`);
                }
            }
            break;
        case SCHEMA.RendererType.InnerShadow:
            applyTypedStyle_WithoutExtraBorder(target, bounds, typedDesc.desc, getStyle_InnerShadow);
            break;
        case SCHEMA.RendererType.Polygon:
            {
                target.style.cssText = getStyle_Bounds(bounds);
                if (typedDesc.desc.points) {
                    const element: HTMLElement = ensureExtraBorderElement(target);
                    element.style.cssText = `${CommonStyle} left: 0; top: 0; right: 0; bottom: 0; margin: auto; ${getStyle_Polygon_Border(typedDesc.desc)}`;
                } else {
                    ensureNoExtraBorderElement(target);
                }
            }
            break;
        case SCHEMA.RendererType.ImageFrame:
            applyTypedStyle_WithoutExtraBorder(target, bounds, typedDesc.desc, getStyle_ImageFrame);
            break;
        case SCHEMA.RendererType.SolidLabel:
            applyTypedStyle_WithoutExtraBorder(target, bounds, typedDesc.desc, getStyle_SolidLabel_Border);
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
