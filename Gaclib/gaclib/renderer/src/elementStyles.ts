import * as SCHEMA from '@gaclib/remote-protocol';

const CommonStyle = 'background-color: none; display: block; position:absolute; box-sizing: border-box; overflow:hidden;';
const ExtraBorderNodeName = '$GacUI-FocusRectangle-Border';
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
 * ImageFrame
 **********************************************************************/

function getStyle_ImageFrame(desc: SCHEMA.ElementDesc_ImageFrame): string {
    if (!desc.imageCreation) {
        throw new Error('getStyle_ImageFrame requires ElementDesc_ImageFrame.imageCreation to exist.');
    }
    if (desc.imageCreation.imageDataOmitted) {
        throw new Error('getStyle_ImageFrame requires ElementDesc_ImageFrame.imageCreation.imageDataOmitted to be false.');
    }

    let contentType: string;
    const bin = atob(desc.imageCreation.imageData);
    if (bin.substring(0, 2) === 'BM') {
        contentType = 'image/bmp';
    } else if (bin.substring(0, 6) === 'GIF87a' || bin.substring(0, 6) === 'GIF89a') {
        contentType = 'image/gif';
    } else if (bin.substring(0, 4) === '\x89PNG') {
        contentType = 'image/png';
    } else if (bin.substring(0, 2) === 'II' || bin.substring(0, 2) === 'MM') {
        contentType = 'image/tiff';
    } else if (bin.substring(0, 2) === '\xFF\xD8') {
        contentType = 'image/jpeg';
    } else if (bin.substring(0, 4) === '\x00\x00\x01\x00' || bin.substring(0, 4) === '\x00\x00\x02\x00') {
        contentType = 'image/vnd.microsoft.icon';
    } else {
        throw new Error('Unsupported image format');
    }

    let positionStyle: string;
    if (desc.stretch) {
        positionStyle = `background-repeat: no-repeat; background-origin: border-box; background-size: 100% 100%;`;
    } else {
        positionStyle = `background-position-x: ${desc.horizontalAlignment.toLowerCase()}; background-position-y: ${desc.verticalAlignment.toLowerCase()}; background-repeat: no-repeat;`;
    }

    let filterStyle = '';
    if (desc.enabled === false) {
        filterStyle = `filter: grayscale(100%);`;
    }

    return `background-image: url(data:${contentType};base64,${desc.imageCreation.imageData}); ${positionStyle} ${filterStyle}`;
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
    if (!polygonElement || svgElement.childNodes.length !== 1 || !(polygonElement instanceof SVGPolygonElement)) {
        polygonElement = document.createElementNS(SvgNS, 'polygon');
        svgElement.replaceChildren(polygonElement);
    }

    polygonElement.setAttribute('fill', desc.backgroundColor);
    polygonElement.setAttribute('stroke', desc.borderColor);
    polygonElement.setAttribute('stroke-width', '1');
    polygonElement.setAttribute('points', (<SCHEMA.Point[]>desc.points).map(p => `${p.x},${p.y}`).join(' '));
}

/**********************************************************************
 * SolidLabel
 **********************************************************************/

function initializeText(textDiv: HTMLElement, desc: SCHEMA.ElementDesc_SolidLabel): void {
    if (!desc.font) {
        throw new Error('getStyle_SolidLabel_Border requires ElementDesc_SolidLabel.font to exist.');
    }
    if (!desc.text) {
        throw new Error('getStyle_SolidLabel_Border requires ElementDesc_SolidLabel.text to exist.');
    }

    const textContent = desc.multiline ? desc.text : desc.text.replaceAll('\r', '').split('\n').join(' ');
    let textElement = textDiv.childNodes[0] as unknown as HTMLDivElement;
    if (!textElement || textDiv.childNodes.length !== 1 || !(textElement instanceof HTMLDivElement)) {
        textElement = document.createElement('div');
        textDiv.replaceChildren(textElement);
    } else {
        textElement.replaceChildren();
    }
    textElement.textContent = textContent;

    {
        let verticalAlignStyle: string;
        switch (desc.verticalAlignment) {
            case SCHEMA.ElementVerticalAlignment.Center:
                verticalAlignStyle = 'align-items: center;';
                break;
            case SCHEMA.ElementVerticalAlignment.Bottom:
                verticalAlignStyle = 'align-items: flex-end;';
                break;
            default:
                verticalAlignStyle = 'align-items: flex-start;';
                break;
        }

        let horizontalAlignStyle: string;
        switch (desc.horizontalAlignment) {
            case SCHEMA.ElementHorizontalAlignment.Center:
                horizontalAlignStyle = 'text-align: center;';
                break;
            case SCHEMA.ElementHorizontalAlignment.Right:
                horizontalAlignStyle = 'text-align: right;';
                break;
            default:
                horizontalAlignStyle = 'text-align: left;';
                break;
        }

        const alignmentStyle = `display: flex; ${verticalAlignStyle} ${horizontalAlignStyle}`;
        const sizeStyle = 'left: 0px; top: 0px; width: 100%; height: 100%;';

        textDiv.style.cssText = `overflow:hidden; ${alignmentStyle} ${sizeStyle}`;
    }

    {
        const textDecorations: string[] = [];
        if (desc.font.underline) {
            textDecorations.push('underline');
        }
        if (desc.font.strikeline) {
            textDecorations.push('line-through');
        }
        const fontStyle = `color: ${desc.textColor}; font-family: ${desc.font.fontFamily}; font-size: ${desc.font.size}px; font-weight: ${desc.font.bold ? 'bold' : 'normal'}; font-style: ${desc.font.italic ? 'italic' : 'normal'};${textDecorations.length > 0 ? ` text-decoration: ${textDecorations.join(' ')};` : ''}`;

        const formatStyle = `text-overflow: ${desc.ellipse ? 'ellipsis' : 'clip'}; white-space: ${desc.wrapLine ? 'pre-wrap' : 'pre'};`;
        const flexItemStyle = 'flex: 0 1 auto; max-width: 100%; max-height: 100%; min-width: 100%; min-height: 0;';
        textElement.style.cssText = `overflow:hidden; ${fontStyle} ${formatStyle} ${flexItemStyle}`;
    }
}

/**********************************************************************
 * ExtraBorder Element Operations
 **********************************************************************/

export function hasExtraBorder(target: HTMLElement): boolean {
    return !!target[ExtraBorderNodeName];
}

function ensureNoExtraBorder(target: HTMLElement): void {
    const element = target[ExtraBorderNodeName] as unknown as Element;
    if (element) {
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

export type TypedElementDesc =
    | { type: SCHEMA.RendererType.Raw }
    | { type: SCHEMA.RendererType.FocusRectangle }
    | { type: SCHEMA.RendererType.SolidBorder; desc: SCHEMA.ElementDesc_SolidBorder }
    | { type: SCHEMA.RendererType.SolidBackground; desc: SCHEMA.ElementDesc_SolidBackground }
    | { type: SCHEMA.RendererType.GradientBackground; desc: SCHEMA.ElementDesc_GradientBackground }
    | { type: SCHEMA.RendererType.SinkBorder; desc: SCHEMA.ElementDesc_SinkBorder }
    | { type: SCHEMA.RendererType.SinkSplitter; desc: SCHEMA.ElementDesc_SinkSplitter }
    | { type: SCHEMA.RendererType.InnerShadow; desc: SCHEMA.ElementDesc_InnerShadow }
    | { type: SCHEMA.RendererType.ImageFrame; desc: SCHEMA.ElementDesc_ImageFrame }
    | { type: SCHEMA.RendererType.Polygon; desc: SCHEMA.ElementDesc_Polygon }
    | { type: SCHEMA.RendererType.SolidLabel; desc: SCHEMA.ElementDesc_SolidLabel };

export function applyTypedStyle(target: HTMLElement, typedDesc: TypedElementDesc): void {
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
 * applyTypedStyle
 **********************************************************************/

export function applyBounds(target: HTMLElement, bounds: SCHEMA.Rect): void {
    target.style.left = `${bounds.x1}px`;
    target.style.top = `${bounds.y1}px`;
    target.style.width = `${bounds.x2 - bounds.x1}px`;
    target.style.height = `${bounds.y2 - bounds.y1}px`;
}
