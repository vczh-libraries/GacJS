import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementManager, TypedElementDesc } from '../GacUIElementManager';

const CommonStyle = 'background-color: none; display: block; position:absolute; box-sizing: border-box; overflow:hidden;';
const ExtraBorderNodeName = '$GacUI-ExtraBorder';
const ParagraphLayoutNodeName = '$GacUI-ParagraphLayout';
const SvgNS = 'http://www.w3.org/2000/svg';

/**********************************************************************
 * FocusRectangle
 **********************************************************************/

function getStyle_FocusRectangle_Border(): string {
    return 'outline:1px dashed white; outline-offset:-1px; mix-blend-mode: difference;';
}

/**********************************************************************
 * Element with Shape
 **********************************************************************/

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

/**********************************************************************
 * SinkBorder
 **********************************************************************/

function getStyle_SinkBorder(desc: SCHEMA.ElementDesc_SinkBorder): string {
    return `border-style: solid; border-left-color: ${desc.leftTopColor}; border-top-color: ${desc.leftTopColor}; border-right-color: ${desc.rightBottomColor}; border-bottom-color: ${desc.rightBottomColor};`;
}

/**********************************************************************
 * SinkSplitter
 **********************************************************************/

function getStyle_SinkSplitter_Extra(desc: SCHEMA.ElementDesc_SinkSplitter): string {
    switch (desc.direction) {
        case SCHEMA.ElementSplitterDirection.Horizontal:
            return `${CommonStyle} width: 100%; height: 2px; top: 0; bottom: 0; margin: auto; border-top: 1px solid ${desc.leftTopColor}; border-bottom: 1px solid ${desc.rightBottomColor};`;
        case SCHEMA.ElementSplitterDirection.Vertical:
            return `${CommonStyle} width: 2px; height: 100%; left: 0; right: 0; margin: auto; border-left: 1px solid ${desc.leftTopColor}; border-right: 1px solid ${desc.rightBottomColor};`;
        default:
            throw new Error(`Unsupported ElementSplitterDirection: ${desc.direction}`);
    }
}

/**********************************************************************
 * InnerShadow
 **********************************************************************/

function getStyle_InnerShadow(desc: SCHEMA.ElementDesc_InnerShadow): string {
    const dirs = ['left', 'top', 'right', 'bottom'];
    const background = `${dirs.map((_dir, i) => `linear-gradient(to ${dirs[(i + 2) % 4]}, ${desc.shadowColor} 0px, transparent ${desc.thickness}px), `).join('')}transparent`;
    const position = `${dirs.map(dir => `${dir} center`).join(', ')}`;
    return `background: ${background}; position: ${position};`;
}

/**********************************************************************
 * Polygon
 **********************************************************************/

function initializePolygon(svgElement: SVGSVGElement, desc: SCHEMA.ElementDesc_Polygon): void {
    svgElement.setAttribute('width', `${desc.size.x}`);
    svgElement.setAttribute('height', `${desc.size.y}`);
    svgElement.setAttribute('viewBox', `0 0 ${desc.size.x} ${desc.size.y}`);
    svgElement.style.cssText = `${CommonStyle} inset: 0; margin: auto; width: ${desc.size.x}px; height: ${desc.size.y}px;`;

    let polygonElement = svgElement.childNodes[0] as unknown as SVGPolygonElement;
    if (polygonElement === undefined || svgElement.childNodes.length !== 1 || !(polygonElement instanceof SVGPolygonElement)) {
        polygonElement = document.createElementNS(SvgNS, 'polygon');
        svgElement.replaceChildren(polygonElement);
    }

    polygonElement.setAttribute('fill', desc.backgroundColor);
    polygonElement.setAttribute('stroke', desc.borderColor);
    polygonElement.setAttribute('stroke-width', '1');
    polygonElement.setAttribute('points', (<SCHEMA.Point[]>desc.points).map(p => `${p.x},${p.y}`).join(' '));
}

/**********************************************************************
 * Others
 **********************************************************************/

import { getStyle_ImageFrame } from './elementStyles_Image.js';
import { initializeText } from './elementStyles_SolidLabel.js';
import { fillParagraphMeasurements, initializeParagraph, ParagraphLayout, renderParagraphMeasurements } from './elementStyles_DocumentParagraph.js';

export * from './elementStyles_Image.js';
export * from './elementStyles_SolidLabel.js';
export * from './elementStyles_DocumentParagraph.js';

/**********************************************************************
 * ExtraBorder Element Operations
 **********************************************************************/

export function hasExtraBorder(target: HTMLElement): boolean {
    return target[ExtraBorderNodeName] !== undefined;
}

export function getExtraBorder(target: HTMLElement): HTMLElement | undefined {
    return target[ExtraBorderNodeName] as unknown as HTMLElement | undefined;
}

function ensureNoExtraBorder(target: HTMLElement): void {
    const element = target[ExtraBorderNodeName] as unknown as Element;
    if (element !== undefined) {
        target.removeChild(element);
        delete target[ExtraBorderNodeName];
    }
}

function setExtraBorder(target: HTMLElement, element: Node): void {
    if (hasExtraBorder(target)) {
        throw new Error('setExtraBorder cannot be called when an extra border element already exists');
    }
    target.insertBefore(element, target.firstChild);
    target[ExtraBorderNodeName] = element;
}

function ensureExtraBorderDiv(target: HTMLElement): HTMLElement {
    let element: HTMLDivElement = target[ExtraBorderNodeName] as unknown as HTMLDivElement;
    if (!(element instanceof HTMLDivElement)) {
        ensureNoExtraBorder(target);
        element = document.createElement('div');
        setExtraBorder(target, element);
    }
    return element;
}

/**********************************************************************
 * ExtraBorder Style Operations
 **********************************************************************/

function applyTypedStyle_WithoutExtraBorder<TDesc>(target: HTMLElement, desc: TDesc, getStyle: (desc: TDesc) => string): void {
    target.style.cssText = `${CommonStyle} ${getStyle(desc)}`;
}

function applyTypedStyle_WithExtraBorder<TDesc>(target: HTMLElement, desc: TDesc, getStyle: (desc: TDesc) => string): void {
    target.style.cssText = CommonStyle;
    const element: HTMLElement = ensureExtraBorderDiv(target);
    element.style.cssText = `${CommonStyle} left: 0px; top: 0px; width: 100%; height: 100%; ${getStyle(desc)}`;
}

interface ElementDescWithShape {
    shape: SCHEMA.ElementShape;
};

function applyTypedStyle_WithShapedBorder<TDesc extends ElementDescWithShape>(target: HTMLElement, desc: TDesc, getStyle: (desc: TDesc) => string): void {
    if (desc.shape.shapeType === SCHEMA.ElementShapeType.Rectangle) {
        ensureNoExtraBorder(target);
        applyTypedStyle_WithoutExtraBorder(target, desc, getStyle);
    } else {
        applyTypedStyle_WithExtraBorder(target, desc, getStyle);
    }
}

/**********************************************************************
 * applyTypedStyle
 **********************************************************************/

/*
* If a HTMLElement is created for a DocumentParagraph element:
*   Call getParagraphLayout to get the layout information.
*   Call getExtraBorder to get the direct container for each ParagraphLine HTMLDivElement.
*/
export function getParagraphLayout(target: HTMLElement): ParagraphLayout | undefined {
    if (!(target as unknown as HTMLElement | undefined)) {
        throw new Error('getParagraphLayout: target is undefined');
    }
    return target[ParagraphLayoutNodeName] as unknown as ParagraphLayout | undefined;
}

export function setParagraphLayout(target: HTMLElement, element: ParagraphLayout): void {
    target[ParagraphLayoutNodeName] = element;
}

export function applyTypedStyle(target: HTMLElement, typedDesc: TypedElementDesc, elements: ElementManager): void {
    const savedLeft = target.style.left;
    const savedTop = target.style.top;
    const savedWidth = target.style.width;
    const savedHeight = target.style.height;

    const elementType: string = typedDesc.type;
    switch (typedDesc.type) {
        case SCHEMA.RendererType.Raw:
            target.style.cssText = CommonStyle;
            break;
        case SCHEMA.RendererType.FocusRectangle:
            applyTypedStyle_WithExtraBorder(target, undefined, getStyle_FocusRectangle_Border);
            break;
        case SCHEMA.RendererType.SolidBorder:
            applyTypedStyle_WithShapedBorder(target, typedDesc.desc, getStyle_SolidBorder_Border);
            break;
        case SCHEMA.RendererType.SolidBackground:
            applyTypedStyle_WithShapedBorder(target, typedDesc.desc, getStyle_SolidBackground_Border);
            break;
        case SCHEMA.RendererType.GradientBackground:
            applyTypedStyle_WithShapedBorder(target, typedDesc.desc, getStyle_GradientBackground_Border);
            break;
        case SCHEMA.RendererType.SinkBorder:
            applyTypedStyle_WithExtraBorder(target, typedDesc.desc, getStyle_SinkBorder);
            break;
        case SCHEMA.RendererType.SinkSplitter:
            {
                target.style.cssText = CommonStyle;
                const element: HTMLElement = ensureExtraBorderDiv(target);
                element.style.cssText = getStyle_SinkSplitter_Extra(typedDesc.desc);
            }
            break;
        case SCHEMA.RendererType.InnerShadow:
            applyTypedStyle_WithoutExtraBorder(target, typedDesc.desc, getStyle_InnerShadow);
            break;
        case SCHEMA.RendererType.ImageFrame:
            applyTypedStyle_WithoutExtraBorder(target, typedDesc.desc, getStyle_ImageFrame);
            break;
        case SCHEMA.RendererType.Polygon:
            {
                target.style.cssText = CommonStyle;
                if (typedDesc.desc.points) {
                    let svgElement = target[ExtraBorderNodeName] as unknown as SVGSVGElement;
                    if (!(svgElement instanceof SVGSVGElement)) {
                        ensureNoExtraBorder(target);
                        svgElement = document.createElementNS(SvgNS, 'svg');
                        setExtraBorder(target, svgElement);
                    }
                    initializePolygon(svgElement, typedDesc.desc);
                } else {
                    ensureNoExtraBorder(target);
                }
            }
            break;
        case SCHEMA.RendererType.SolidLabel:
            {
                target.style.cssText = CommonStyle;
                const textDiv = ensureExtraBorderDiv(target);
                initializeText(textDiv, typedDesc.desc);
            }
            break;
        case SCHEMA.RendererType.DocumentParagraph:
            {
                target.style.cssText = CommonStyle;
                const textDiv = ensureExtraBorderDiv(target);
                const existingLayout = getParagraphLayout(target);
                if (existingLayout === undefined) {
                    const layout = initializeParagraph(textDiv, typedDesc.desc, elements);
                    setParagraphLayout(target, layout);
                } else {
                    // Subsequent update: rebuild with new desc
                    const layout = initializeParagraph(textDiv, typedDesc.desc, elements);
                    setParagraphLayout(target, layout);
                }
            }
            break;
        default:
            throw new Error(`Unsupported renderer type: ${elementType}`);
    }

    if (savedLeft !== '') {
        target.style.left = savedLeft;
    }
    if (savedTop !== '') {
        target.style.top = savedTop;
    }
    if (savedWidth !== '') {
        target.style.width = savedWidth;
    }
    if (savedHeight !== '') {
        target.style.height = savedHeight;
    }
}

/**********************************************************************
 * applyBounds
 **********************************************************************/

export function applyCommonStyle(target: HTMLElement): void {
    target.style.cssText = CommonStyle;
}

export function applyBounds(target: HTMLElement, bounds: SCHEMA.Rect): void {
    target.style.left = `${bounds.x1}px`;
    target.style.top = `${bounds.y1}px`;
    target.style.width = `${bounds.x2 - bounds.x1}px`;
    target.style.height = `${bounds.y2 - bounds.y1}px`;

    const paragraphLayout = getParagraphLayout(target);
    if (paragraphLayout) {
        fillParagraphMeasurements(getExtraBorder(target)!, paragraphLayout);
    }
}

export function renderDebugInfo(target: HTMLElement): void {
    const paragraphLayout = getParagraphLayout(target);
    if (paragraphLayout) {
        renderParagraphMeasurements(getExtraBorder(target)!, paragraphLayout);
    }
}
