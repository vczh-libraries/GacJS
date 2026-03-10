import * as SCHEMA from '@gaclib/remote-protocol';
import { getFeatureGates } from '../featureGates';

/**********************************************************************
 * SolidLabel
 **********************************************************************/

const WebkitElementName = '$GacUI-WebkitElement';

export function onSolidLabelResized(textDiv: HTMLElement): void {
    const webkitElement = textDiv[WebkitElementName] as unknown as HTMLDivElement;
    if (webkitElement !== undefined) {
        const lineHeight = parseFloat(webkitElement.style.lineHeight) * (parseFloat(webkitElement.style.fontSize));
        const lineClamp = Math.floor(textDiv.clientHeight / lineHeight);
        webkitElement.style.webkitLineClamp = `${lineClamp}`;
    }
}

export function getFontStyle(desc: SCHEMA.ElementDesc_SolidLabel): string {
    const textDecorations: string[] = [];
    if (desc.font!.underline) {
        textDecorations.push('underline');
    }
    if (desc.font!.strikeline) {
        textDecorations.push('line-through');
    }

    return `color: ${desc.textColor}; font-family: ${desc.font!.fontFamily}; line-height: 1.4; font-size: ${desc.font!.size}px; font-weight: ${desc.font!.bold ? 'bold' : 'normal'}; font-style: ${desc.font!.italic ? 'italic' : 'normal'};${textDecorations.length > 0 ? ` text-decoration: ${textDecorations.join(' ')};` : ''}`;
}

export function normalizeText(desc: SCHEMA.ElementDesc_SolidLabel): string {
    return desc.multiline ? desc.text! : desc.text!.replaceAll('\r', '').split('\n').join(' ');
}

export function initializeText(textDiv: HTMLElement, desc: SCHEMA.ElementDesc_SolidLabel): void {
    if (desc.font === null) {
        throw new Error('initializeText requires ElementDesc_SolidLabel.font to exist.');
    }
    if (desc.text === null) {
        throw new Error('initializeText requires ElementDesc_SolidLabel.text to exist.');
    }

    const ellipseWithWrapLine = desc.ellipse && desc.wrapLine;
    const useWebkitLineClamp = getFeatureGates().useWebkitLineClamp;

    delete textDiv[WebkitElementName];

    let textElement = textDiv.childNodes[0] as unknown as HTMLDivElement;
    if (textElement === undefined || textDiv.childNodes.length !== 1 || !(textElement instanceof HTMLDivElement)) {
        textElement = document.createElement('div');
        textDiv.replaceChildren(textElement);
    } else {
        textElement.replaceChildren();
    }

    if (ellipseWithWrapLine === false || useWebkitLineClamp === false) {
        textElement.textContent = normalizeText(desc);
    }

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
        const fontStyle = getFontStyle(desc);
        const flexItemStyle = 'flex: 0 1 auto; max-width: 100%; max-height: 100%; min-width: 100%; min-height: 0;';

        if (ellipseWithWrapLine === false || useWebkitLineClamp === false) {
            const formatStyle = `text-overflow: ${desc.ellipse ? 'ellipsis' : 'clip'}; white-space: ${desc.wrapLine ? 'pre-wrap' : 'pre'};`;
            textElement.style.cssText = `overflow:hidden; ${fontStyle} ${formatStyle} ${flexItemStyle}`;
        } else {
            textElement.style.cssText = `overflow:hidden; ${flexItemStyle}`;

            const webkitElement = document.createElement('div');
            textElement.replaceChildren(webkitElement);
            textDiv[WebkitElementName] = webkitElement;

            webkitElement.textContent = normalizeText(desc);

            const formatStyle = `white-space: ${desc.wrapLine ? 'pre-wrap' : 'pre'};`;
            webkitElement.style.cssText = `overflow:hidden; display: -webkit-box; -webkit-box-orient: vertical; ${fontStyle} ${formatStyle}`;

            onSolidLabelResized(textDiv);
        }
    }
}
