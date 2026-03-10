import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementManager } from '../GacUIElementManager';
import { getImageContentType, getImageDataUrl, getImageFormatType } from './elementStyles_Image.js';

/**********************************************************************
 * DocumentParagraph
 **********************************************************************/

/*
* start (inclusive) and end (exclusive) define the range in ParagraphLayout.paragraph.text
* Inside the range of ParagraphLine, ParagrahBlocks are splitted by:
*   ParagraphLayout.paragraph.runsDiff[index].DocumentRunProperty which is a DocumentInlineObjectRunProperty, it becomes an HTMLSpanElement
*   Other, consecurive DocumentTextRunProperty as well as not-covered text range becomes a single Text node.
* 
* DocumentInlineObjectRunProperty should be interpreted in this way:
*   size: The exact size of the HTML element, this is no arguable. Layout should performed according to this size.
*     HTMLSpanElement should be an inline-block with hardcoded size, and position:relative.
*   baseline: The distance between the top of the layouted element to the bottom of the rendered element.
*     When baseline is -1, it is treated as size.y (normal placement).
*     When baseline === size.y, it places normally.
*     When baseline > size.y, it places lower.
*     When baseline < size.y, it places higher.
*     It could be implemented by child elements with position:absolute to the HTMLSpanElement.
*   breakCondition: ignored
*   backgroundColor: Not necessary the background color. It is a color hint to apply to the content when the element is selected.
*   backgroundElementId: When it is not -1, it represents the key to retrieve an ElementDesc_ImageFrame from ElementManager.
*     An HTMLImageElement with the same hardcoded size becomes the child element of the HTMLSpanElement.
*   callbackId: When it is not -1, it is used to fill ElementHTMLMeasurer._measuring.inlineObjectBounds.
*/
export interface ParagraphBlock {
    start: number;
    end: number;
    element: HTMLSpanElement | Text;
}

/*
* start (inclusive) and end (exclusive) define the range in ParagraphLayout.paragraph.text
* The range does not include the trailing /\r*\n/
* The text will be split by /\r*\n/ into multiple lines, empty lines preserved. If the text ends with \n it means the last line is empty.
*/
export interface ParagraphLine {
    start: number;
    end: number;
    blocks: ParagraphBlock[];
}

export interface ParagraphLayout {
    paragraph: SCHEMA.ElementDesc_DocumentParagraph & { text: string };
    caret: SCHEMA.TYPES.Nullable<SCHEMA.OpenCaretRequest>;
    lines: ParagraphLine[];
}

// TODO: updateParagraph with actual diffs.

/**********************************************************************
 * Inline Object
 **********************************************************************/

function createInlineObjectSpan(props: SCHEMA.DocumentInlineObjectRunProperty, elements: ElementManager): HTMLSpanElement {
    const span = document.createElement('span');
    span.style.cssText = `display: inline-block; width: ${props.size.x}px; height: ${props.size.y}px; position: relative;`;

    if (props.backgroundElementId !== -1) {
        const imageDesc = elements.getDesc(props.backgroundElementId);
        if (imageDesc !== undefined && imageDesc.type === SCHEMA.RendererType.ImageFrame) {
            const imageFrame = imageDesc.desc;
            if (imageFrame.imageCreation !== null && !imageFrame.imageCreation.imageDataOmitted) {
                const contentType = getImageContentType(getImageFormatType(imageFrame.imageCreation.imageData));
                const imgElement = document.createElement('img');
                imgElement.src = getImageDataUrl(contentType, imageFrame.imageCreation.imageData);
                const baseline = props.baseline === -1 ? props.size.y : props.baseline;
                imgElement.style.cssText = `width: ${props.size.x}px; height: ${props.size.y}px; position: absolute; top: ${baseline - props.size.y}px; left: 0;`;
                span.appendChild(imgElement);
            }
        }
    }

    return span;
}

/**********************************************************************
 * Text Run Styling
 **********************************************************************/

function getTextRunStyle(props: SCHEMA.DocumentTextRunProperty): string {
    const font = props.fontProperties;
    const textDecorations: string[] = [];
    if (font.underline) {
        textDecorations.push('underline');
    }
    if (font.strikeline) {
        textDecorations.push('line-through');
    }

    let style = `color: ${props.textColor}; font-family: ${font.fontFamily}; font-size: ${font.size}px; line-height: 1; font-weight: ${font.bold ? 'bold' : 'normal'}; font-style: ${font.italic ? 'italic' : 'normal'};`;
    if (textDecorations.length > 0) {
        style += ` text-decoration: ${textDecorations.join(' ')};`;
    }
    if (props.backgroundColor !== '#00000000' && props.backgroundColor !== '#000000') {
        style += ` background-color: ${props.backgroundColor};`;
    }
    return style;
}

function createStyledTextSpan(text: string, props: SCHEMA.DocumentTextRunProperty): HTMLSpanElement {
    const span = document.createElement('span');
    span.style.cssText = getTextRunStyle(props);
    span.textContent = text;
    return span;
}

/**********************************************************************
 * Line Building
 **********************************************************************/

interface RunOnLine {
    start: number;
    end: number;
    run: SCHEMA.DocumentRun;
}

function buildBlocksForLine(
    text: string,
    lineStart: number,
    lineEnd: number,
    runs: SCHEMA.DocumentRun[],
    elements: ElementManager
): ParagraphBlock[] {
    // Collect all runs overlapping this line, clipped to line bounds
    const runsOnLine: RunOnLine[] = runs
        .filter(r => r.caretBegin < lineEnd && r.caretEnd > lineStart)
        .map(r => ({
            start: Math.max(r.caretBegin, lineStart),
            end: Math.min(r.caretEnd, lineEnd),
            run: r
        }))
        .sort((a, b) => a.start - b.start);

    const blocks: ParagraphBlock[] = [];
    let cursor = lineStart;

    for (const { start, end, run } of runsOnLine) {
        // Gap before this run: plain Text node
        if (cursor < start) {
            blocks.push({
                start: cursor,
                end: start,
                element: document.createTextNode(text.substring(cursor, start))
            });
        }

        if (run.props[0] === 'DocumentInlineObjectRunProperty') {
            blocks.push({
                start,
                end,
                element: createInlineObjectSpan(run.props[1], elements)
            });
        } else {
            blocks.push({
                start,
                end,
                element: createStyledTextSpan(text.substring(start, end), run.props[1])
            });
        }

        cursor = end;
    }

    // Remaining text after the last run
    if (cursor < lineEnd) {
        blocks.push({
            start: cursor,
            end: lineEnd,
            element: document.createTextNode(text.substring(cursor, lineEnd))
        });
    }

    if (blocks.length === 0) {
        blocks.push({
            start: lineStart,
            end: lineEnd,
            element: document.createTextNode('')
        });
    }

    return blocks;
}

/**********************************************************************
 * initializeParagraph
 **********************************************************************/

/*
* TEST-NODE:
* After yarn build the website will be automatically hosted
* Open access snapshots.html
* navigates to some random snapshots under the editor folder (a tree view node in that page)
* open some random frames
* and initializeParagraph should be called, make sure no runtime exception happens.
*/
export function initializeParagraph(textDiv: HTMLElement, desc: SCHEMA.ElementDesc_DocumentParagraphFull, elements: ElementManager): ParagraphLayout {
    if (desc.paragraph.text === null) {
        throw new Error('initializeParagraph requires ElementDesc_DocumentParagraph.paragraph.text to exist.');
    }

    const text = desc.paragraph.text;
    const runs = desc.paragraph.runsDiff ?? [];

    // Split text into lines by /\r*\n/
    const lineBreakRegex = /\r*\n/g;
    const lineRanges: { start: number; end: number }[] = [];
    let lineStart = 0;
    let match: RegExpExecArray | null;

    while ((match = lineBreakRegex.exec(text)) !== null) {
        lineRanges.push({ start: lineStart, end: match.index });
        lineStart = match.index + match[0].length;
    }
    lineRanges.push({ start: lineStart, end: text.length });

    // Style the textDiv
    let alignStyle: string;
    switch (desc.paragraph.alignment) {
        case SCHEMA.ElementHorizontalAlignment.Center:
            alignStyle = 'center';
            break;
        case SCHEMA.ElementHorizontalAlignment.Right:
            alignStyle = 'right';
            break;
        default:
            alignStyle = 'left';
            break;
    }

    const wrapStyle = desc.paragraph.wrapLine ? 'pre-wrap' : 'pre';
    textDiv.style.cssText = `position: absolute; left: 0; top: 0; width: 100%; height: 100%; white-space: ${wrapStyle}; text-align: ${alignStyle};`;

    // Build lines and populate the textDiv
    const lines: ParagraphLine[] = [];
    const defaultFontSize = elements.defaultFontSize;
    textDiv.replaceChildren();

    for (const lineRange of lineRanges) {
        const blocks = buildBlocksForLine(text, lineRange.start, lineRange.end, runs, elements);
        const line: ParagraphLine = {
            start: lineRange.start,
            end: lineRange.end,
            blocks
        };
        lines.push(line);

        const lineDiv = document.createElement('div');
        const isEmpty = lineRange.start === lineRange.end;
        if (isEmpty) {
            lineDiv.style.height = `${defaultFontSize}px`;
        }
        for (const block of blocks) {
            lineDiv.appendChild(block.element);
        }
        textDiv.appendChild(lineDiv);
    }

    const layout: ParagraphLayout = {
        paragraph: desc.paragraph as SCHEMA.ElementDesc_DocumentParagraph & { text: string },
        caret: desc.caret,
        lines
    };
    return layout;
}
