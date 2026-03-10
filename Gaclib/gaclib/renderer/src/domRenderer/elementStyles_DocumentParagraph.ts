import * as SCHEMA from '@gaclib/remote-protocol';

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

/*
* TEST-NODE:
* After yarn build the website will be automatically hosted
* Open access snapshots.html
* navigates to some random snapshots under the editor folder (a tree view node in that page)
* open some random frames
* and initializeParagraph should be called, make sure no runtime exception happens.
*/
export function initializeParagraph(textDiv: HTMLElement, desc: SCHEMA.ElementDesc_DocumentParagraphFull): ParagraphLayout {
    if (desc.paragraph.text === null) {
        throw new Error('initializeParagraph requires ElementDesc_DocumentParagraph.paragraph.text to exist.');
    }

    const thickness = '3px';
    textDiv.style.cssText = [
        'position: absolute; left: 0; top: 0; width: 100%; height: 100%;',
        `background:`,
        `  linear-gradient(to top right, transparent calc(50% - ${thickness}), red calc(50% - ${thickness}), red calc(50% + ${thickness}), transparent calc(50% + ${thickness})),`,
        `  linear-gradient(to top left, transparent calc(50% - ${thickness}), red calc(50% - ${thickness}), red calc(50% + ${thickness}), transparent calc(50% + ${thickness}));`
    ].join(' ');

    const layout = { ...desc, lines: [] } as unknown as ParagraphLayout;
    return layout;
}
