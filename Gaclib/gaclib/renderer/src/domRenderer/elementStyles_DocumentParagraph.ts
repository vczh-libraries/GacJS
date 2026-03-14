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
    span: HTMLSpanElement;
    text?: Text;
    image?: HTMLImageElement;
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
    element: HTMLDivElement;
}

/*
* start (inclusive) and end (exclusive) define the range in ParagraphLayout.paragraph.text
* A unit is a minimum range of consecutive code points that can be selected.
*   JavaScript code points should be UTF-16.
*   Most of characters are a unit by itself.
*   Some emojis and Chinese characters may consist of multiple code points.
* An inline object (DocumentInlineObjectRunProperty) is one single unit.
* The line separator /\r*\n/ is one single unit.
* 
* frontCaretBaseline and backCaretBaseline is the bottom point of the caret.
* Both caret should share the same height.
* For LTR text, frontCaretBaseline is the left edge of the caret, otherwise it is the right edge.
* Inline objects and line separators are treated as LTR.
* 
* For text units and inline objects, frontCaretBaseline.y === backCaretBaseline.y, so they combined with caretHeight forms a rectangle.
*   For inline objects with a callbackId !== -1, such rectagle will be copied to ParagraphLayout.inlineObjectBounds.
*   elementId is ParagraphLayout.paragraph.id
*   callbackId is DocumentInlineObjectRunProperty.callbackId
*/
export interface ParagraphEditUnit {
    start: number;
    end: number;
    frontCaretBaseline: SCHEMA.Point;
    backCaretBaseline: SCHEMA.Point;
    caretHeight: SCHEMA.TYPES.Integer;
}

export interface ParagraphLayout {
    paragraph: SCHEMA.ElementDesc_DocumentParagraph & { text: string };
    caret: SCHEMA.TYPES.Nullable<SCHEMA.OpenCaretRequest>;
    caretVisible: boolean;
    lines: ParagraphLine[];
    defaultFontSize: number;

    // All following members will be completed in fillParagraphMeasurements
    units: ParagraphEditUnit[];
    inlineObjectBounds: SCHEMA.ElementMeasurings['inlineObjectBounds'];
}

// TODO: updateParagraph with actual diffs.

/**
 * Patch inline object images that were missing during paragraph initialization.
 * Called when an ImageFrame element is updated after the paragraph was built,
 * so that deferred images get their src set.
 */
export function updateParagraphInlineImages(layout: ParagraphLayout, imageFrameElementId: number, elements: ElementManager): void {
    const runs = layout.paragraph.runsDiff ?? [];
    for (const line of layout.lines) {
        for (const block of line.blocks) {
            if (block.image !== undefined) continue; // already has image
            const run = runs.find(r =>
                r.caretBegin <= block.start && r.caretEnd >= block.end &&
                r.props[0] === 'DocumentInlineObjectRunProperty'
            );
            if (run === undefined || run.props[0] !== 'DocumentInlineObjectRunProperty') continue;
            const props = run.props[1];
            if (props.backgroundElementId !== imageFrameElementId) continue;

            // Check if the span has matching data attribute
            if (block.span.dataset.backgroundElementId !== String(imageFrameElementId)) continue;

            const imageDesc = elements.getDesc(imageFrameElementId);
            if (imageDesc === undefined || imageDesc.type !== SCHEMA.RendererType.ImageFrame) continue;
            const imageFrame = imageDesc.desc;
            if (imageFrame.imageCreation === null || imageFrame.imageCreation.imageDataOmitted) continue;

            const contentType = getImageContentType(getImageFormatType(imageFrame.imageCreation.imageData));
            const image = document.createElement('img');
            image.src = getImageDataUrl(contentType, imageFrame.imageCreation.imageData);
            const baseline = props.baseline === -1 ? props.size.y : props.baseline;
            image.style.cssText = `width: ${props.size.x}px; height: ${props.size.y}px; position: absolute; top: ${baseline - props.size.y}px; left: 0;`;
            // Insert image before any existing overlay div
            block.span.insertBefore(image, block.span.firstChild);
            block.image = image;
        }
    }
}

/**********************************************************************
 * Inline Object
 **********************************************************************/

interface InlineObjectSpanResult {
    span: HTMLSpanElement;
    image?: HTMLImageElement;
}

/**
 * Parse a #RRGGBBAA or #RRGGBB color string into an rgba() CSS value with halved alpha.
 * Used to create a semi-transparent selection overlay on inline objects.
 */
function toSelectionOverlayColor(color: string): string | undefined {
    if (color === '#00000000' || color === '#000000') {
        return undefined;
    }
    const hex = color.startsWith('#') ? color.slice(1) : color;
    if (hex.length < 6) return undefined;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1.0;
    // Halve the alpha to keep the image visible underneath
    const halfAlpha = Math.max(a * 0.5, 0.25);
    return `rgba(${r}, ${g}, ${b}, ${halfAlpha.toFixed(2)})`;
}

function createInlineObjectSpan(props: SCHEMA.DocumentInlineObjectRunProperty, elements: ElementManager): InlineObjectSpanResult {
    const span = document.createElement('span');
    span.style.cssText = `display: inline-block; width: ${props.size.x}px; height: ${props.size.y}px; position: relative;`;
    let image: HTMLImageElement | undefined;

    if (props.backgroundElementId !== -1) {
        // Store the element ID on the span for deferred image patching
        span.dataset.backgroundElementId = String(props.backgroundElementId);

        const imageDesc = elements.getDesc(props.backgroundElementId);
        if (imageDesc !== undefined && imageDesc.type === SCHEMA.RendererType.ImageFrame) {
            const imageFrame = imageDesc.desc;
            if (imageFrame.imageCreation !== null && !imageFrame.imageCreation.imageDataOmitted) {
                const contentType = getImageContentType(getImageFormatType(imageFrame.imageCreation.imageData));
                image = document.createElement('img');
                image.src = getImageDataUrl(contentType, imageFrame.imageCreation.imageData);
                const baseline = props.baseline === -1 ? props.size.y : props.baseline;
                image.style.cssText = `width: ${props.size.x}px; height: ${props.size.y}px; position: absolute; top: ${baseline - props.size.y}px; left: 0;`;
                span.appendChild(image);
            }
        }
    }

    // Apply selection overlay when backgroundColor indicates selection
    const overlayColor = toSelectionOverlayColor(props.backgroundColor);
    if (overlayColor !== undefined) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${overlayColor}; pointer-events: none;`;
        span.appendChild(overlay);
    }

    return { span, image };
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

interface StyledTextSpanResult {
    span: HTMLSpanElement;
    text: Text;
}

function createStyledTextSpan(content: string, props: SCHEMA.DocumentTextRunProperty): StyledTextSpanResult {
    const span = document.createElement('span');
    span.style.cssText = getTextRunStyle(props);
    const text = document.createTextNode(content);
    span.appendChild(text);
    return { span, text };
}

function createPlainTextSpan(content: string): { span: HTMLSpanElement; text: Text } {
    const span = document.createElement('span');
    const text = document.createTextNode(content);
    span.appendChild(text);
    return { span, text };
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
        // Gap before this run: plain text span
        if (cursor < start) {
            const { span, text: textNode } = createPlainTextSpan(text.substring(cursor, start));
            blocks.push({ start: cursor, end: start, span, text: textNode });
        }

        if (run.props[0] === 'DocumentInlineObjectRunProperty') {
            const { span, image } = createInlineObjectSpan(run.props[1], elements);
            blocks.push({ start, end, span, image });
        } else {
            const { span, text: textNode } = createStyledTextSpan(text.substring(start, end), run.props[1]);
            blocks.push({ start, end, span, text: textNode });
        }

        cursor = end;
    }

    // Remaining text after the last run
    if (cursor < lineEnd) {
        const { span, text: textNode } = createPlainTextSpan(text.substring(cursor, lineEnd));
        blocks.push({ start: cursor, end: lineEnd, span, text: textNode });
    }

    if (blocks.length === 0) {
        const { span, text: textNode } = createPlainTextSpan('');
        blocks.push({ start: lineStart, end: lineEnd, span, text: textNode });
    }

    return blocks;
}

/**********************************************************************
 * Measurement Helpers
 **********************************************************************/

const ParagraphMeasurementsNodeName = '$GacUI-ParagraphMeasurementsNodeName';
const ParagraphCaretNodeName = '$GacUI-ParagraphCaretNodeName';

function getCollapsedCaretRect(node: Node, offset: number): DOMRect | null {
    const range = document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset);
    const rects = range.getClientRects();
    if (rects.length > 0) {
        return rects[0];
    }
    const bounding = range.getBoundingClientRect();
    if (bounding.height > 0) {
        return bounding;
    }
    return null;
}

function clientRectsChanged(prev: DOMRect[], curr: DOMRect[]): boolean {
    if (prev.length !== curr.length) return true;
    for (let i = 0; i < prev.length; i++) {
        if (Math.abs(prev[i].left - curr[i].left) > 0.5 ||
            Math.abs(prev[i].top - curr[i].top) > 0.5 ||
            Math.abs(prev[i].right - curr[i].right) > 0.5 ||
            Math.abs(prev[i].bottom - curr[i].bottom) > 0.5) {
            return true;
        }
    }
    return false;
}

function findRunForRange(runs: SCHEMA.DocumentRun[], start: number, end: number): SCHEMA.DocumentRun | undefined {
    return runs.find(r => r.caretBegin <= start && r.caretEnd >= end);
}

function getLineEdgePosition(line: ParagraphLine, atEnd: boolean, divRect: DOMRect): SCHEMA.Point {
    if (line.blocks.length > 0) {
        const block = atEnd ? line.blocks[line.blocks.length - 1] : line.blocks[0];
        if (block.text !== undefined && block.text.length > 0) {
            const rect = getCollapsedCaretRect(block.text, atEnd ? block.text.length : 0);
            if (rect !== null) {
                return {
                    x: Math.round(rect.left - divRect.left),
                    y: Math.round(rect.bottom - divRect.top)
                };
            }
        }
        const rect = block.span.getBoundingClientRect();
        return {
            x: Math.round((atEnd ? rect.right : rect.left) - divRect.left),
            y: Math.round(rect.bottom - divRect.top)
        };
    }
    const lineRect = line.element.getBoundingClientRect();
    return {
        x: Math.round(lineRect.left - divRect.left),
        y: Math.round(lineRect.bottom - divRect.top)
    };
}

/**********************************************************************
 * fillParagraphMeasurements / renderParagraphMeasurements
 **********************************************************************/

export function fillParagraphMeasurements(textDiv: HTMLElement, layout: ParagraphLayout): void {
    const units: ParagraphEditUnit[] = [];
    const inlineObjectBounds: SCHEMA.ElementMeasuring_InlineObjectBounds[] = [];
    const runs = layout.paragraph.runsDiff ?? [];
    const divRect = textDiv.getBoundingClientRect();
    const defaultFontSize = layout.defaultFontSize;

    for (let lineIndex = 0; lineIndex < layout.lines.length; lineIndex++) {
        const line = layout.lines[lineIndex];

        for (const block of line.blocks) {
            if (block.start === block.end) continue;

            const run = findRunForRange(runs, block.start, block.end);

            if (run !== undefined && run.props[0] === 'DocumentInlineObjectRunProperty') {
                // Inline object: one single unit, treated as LTR
                const props = run.props[1];
                const rect = block.span.getBoundingClientRect();
                const frontX = Math.round(rect.left - divRect.left);
                const backX = Math.round(rect.right - divRect.left);
                const y = Math.round(rect.bottom - divRect.top);
                const height = Math.round(rect.height);

                units.push({
                    start: block.start,
                    end: block.end,
                    frontCaretBaseline: { x: frontX, y },
                    backCaretBaseline: { x: backX, y },
                    caretHeight: height
                });

                if (props.callbackId !== -1) {
                    inlineObjectBounds.push({
                        elementId: layout.paragraph.id,
                        callbackId: props.callbackId,
                        bounds: { x1: frontX, y1: y - height, x2: backX, y2: y }
                    });
                }
            } else {
                // Text block: detect glyph clusters using Range.getClientRects
                const textNode = block.text;
                if (textNode === undefined || textNode.length === 0) continue;

                const nodeLength = textNode.length;
                const measureRange = document.createRange();
                let cursor = 0;

                while (cursor < nodeLength) {
                    // Extend range character by character until getClientRects changes
                    measureRange.setStart(textNode, cursor);
                    measureRange.setEnd(textNode, cursor + 1);
                    let prevRects = Array.from(measureRange.getClientRects());
                    let unitEnd = cursor + 1;

                    while (unitEnd < nodeLength) {
                        measureRange.setEnd(textNode, unitEnd + 1);
                        const newRects = Array.from(measureRange.getClientRects());
                        if (clientRectsChanged(prevRects, newRects)) {
                            break;
                        }
                        prevRects = newRects;
                        unitEnd++;
                    }

                    // Use collapsed ranges at unit boundaries for caret positions
                    const frontRect = getCollapsedCaretRect(textNode, cursor);
                    const backRect = getCollapsedCaretRect(textNode, unitEnd);

                    if (frontRect !== null && backRect !== null) {
                        units.push({
                            start: block.start + cursor,
                            end: block.start + unitEnd,
                            frontCaretBaseline: {
                                x: Math.round(frontRect.left - divRect.left),
                                y: Math.round(frontRect.bottom - divRect.top)
                            },
                            backCaretBaseline: {
                                x: Math.round(backRect.left - divRect.left),
                                y: Math.round(backRect.bottom - divRect.top)
                            },
                            caretHeight: Math.round(frontRect.height)
                        });
                    }

                    cursor = unitEnd;
                }
            }
        }

        // Line separator unit between this line and the next
        if (lineIndex < layout.lines.length - 1) {
            const nextLine = layout.lines[lineIndex + 1];
            units.push({
                start: line.end,
                end: nextLine.start,
                frontCaretBaseline: getLineEdgePosition(line, true, divRect),
                backCaretBaseline: getLineEdgePosition(nextLine, false, divRect),
                caretHeight: defaultFontSize
            });
        }
    }

    layout.units = units;
    layout.inlineObjectBounds = inlineObjectBounds.length > 0 ? inlineObjectBounds : null;
}

export function renderParagraphMeasurements(textDiv: HTMLElement, layout: ParagraphLayout): void {
    // Remove previous measurement overlay elements
    const existing = textDiv[ParagraphMeasurementsNodeName] as HTMLElement[] | undefined;
    if (existing !== undefined) {
        for (const el of existing) {
            el.remove();
        }
    }

    const elements: HTMLElement[] = [];
    const runs = layout.paragraph.runsDiff ?? [];

    for (const unit of layout.units) {
        // Only render rectangles for text units and inline objects (same Y line)
        if (unit.frontCaretBaseline.y !== unit.backCaretBaseline.y) continue;

        const run = findRunForRange(runs, unit.start, unit.end);
        let borderColor: string;
        if (run !== undefined && run.props[0] === 'DocumentInlineObjectRunProperty') {
            borderColor = '#606000';
        } else if (unit.frontCaretBaseline.x <= unit.backCaretBaseline.x) {
            borderColor = '#006000';
        } else {
            borderColor = '#600000';
        }

        const x1 = Math.min(unit.frontCaretBaseline.x, unit.backCaretBaseline.x);
        const x2 = Math.max(unit.frontCaretBaseline.x, unit.backCaretBaseline.x);
        const y = unit.frontCaretBaseline.y;
        const h = unit.caretHeight;

        const div = document.createElement('div');
        div.style.cssText = `position: absolute; left: ${x1}px; top: ${y - h}px; width: ${x2 - x1}px; height: ${h}px; border: 1px solid ${borderColor}; box-sizing: border-box; pointer-events: none;`;
        textDiv.appendChild(div);
        elements.push(div);
    }

    textDiv[ParagraphMeasurementsNodeName] = elements;

    if (layout.caret !== null) {
        setCaretVisible(textDiv, layout.caretVisible, layout);
    }
}

export function isCaretVisible(textDiv: HTMLElement): boolean {
    const caretElement = textDiv[ParagraphCaretNodeName] as HTMLElement | undefined;
    if (caretElement === undefined) return false;
    return caretElement.style.display !== 'none';
}

export function setCaretVisible(textDiv: HTMLElement, visible: boolean, layout: ParagraphLayout): void {
    if (layout.caret === null) {
        visible = false;
    }

    layout.caretVisible = visible;

    if (!visible) {
        const caretElement = textDiv[ParagraphCaretNodeName] as HTMLElement | undefined;
        if (caretElement !== undefined) {
            caretElement.style.display = 'none';
        }
        return;
    }

    // Find the caret position from units.
    // frontSide === true  → use *backCaretBaseline* of the unit that ends at the caret position (prior unit).
    // frontSide === false → use *frontCaretBaseline* of the unit that starts at the caret position (next unit).
    const caretPos = layout.caret!.caret;
    const frontSide = layout.caret!.frontSide;
    let caretX: number | undefined;
    let caretY: number | undefined;
    let caretHeight: number | undefined;

    for (const unit of layout.units) {
        if (frontSide && caretPos > unit.start && caretPos <= unit.end) {
            caretX = unit.backCaretBaseline.x;
            caretY = unit.backCaretBaseline.y;
            caretHeight = unit.caretHeight;
            break;
        } else if (!frontSide && caretPos >= unit.start && caretPos < unit.end) {
            caretX = unit.frontCaretBaseline.x;
            caretY = unit.frontCaretBaseline.y;
            caretHeight = unit.caretHeight;
            break;
        }
    }

    if (caretX === undefined || caretY === undefined || caretHeight === undefined) {
        // Fallback: use defaultFontSize at origin if no unit matches
        caretX = 0;
        caretY = layout.defaultFontSize;
        caretHeight = layout.defaultFontSize;
    }

    let caretElement = textDiv[ParagraphCaretNodeName] as HTMLElement | undefined;
    if (caretElement === undefined) {
        caretElement = document.createElement('div');
        caretElement.style.position = 'absolute';
        caretElement.style.pointerEvents = 'none';
        textDiv.appendChild(caretElement);
        textDiv[ParagraphCaretNodeName] = caretElement;
    }

    caretElement.style.display = 'block';
    caretElement.style.left = `${caretX - 1}px`;
    caretElement.style.top = `${caretY - caretHeight}px`;
    caretElement.style.width = '2px';
    caretElement.style.height = `${caretHeight}px`;
    caretElement.style.backgroundColor = layout.caret!.caretColor;
}

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
    const maxWidth = desc.paragraph.maxWidth;
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
            blocks,
            element: document.createElement('div')
        };
        lines.push(line);

        if (desc.paragraph.wrapLine && maxWidth > 0) {
            line.element.style.width = `${maxWidth}px`;
        } else if (!desc.paragraph.wrapLine) {
            line.element.style.whiteSpace = 'nowrap';
        }

        const isEmpty = lineRange.start === lineRange.end;
        if (isEmpty) {
            line.element.style.height = `${defaultFontSize}px`;
        }
        for (const block of blocks) {
            line.element.appendChild(block.span);
        }
        textDiv.appendChild(line.element);
    }

    const layout: ParagraphLayout = {
        paragraph: desc.paragraph as SCHEMA.ElementDesc_DocumentParagraph & { text: string },
        caret: desc.caret,
        caretVisible: false,
        lines,
        defaultFontSize,

        // fillParagraphMeasurements will take care of these
        units: [],
        inlineObjectBounds: null
    };
    return layout;
}
