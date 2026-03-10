import * as SCHEMA from '@gaclib/remote-protocol';

/**********************************************************************
 * DocumentParagraph
 **********************************************************************/

export function initializeParagraph(textDiv: HTMLElement, desc: SCHEMA.ElementDesc_DocumentParagraphFull): void {
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
}
