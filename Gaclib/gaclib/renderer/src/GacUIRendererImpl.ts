import * as SCHEMA from '@gaclib/remote-protocol';
import { GacUISettings, IGacUIRenderer } from './interfaces';
import { ElementManager, TypedElementDesc } from './GacUIElementManager';
import { createVirtualDomFromRenderingDom, IElementMeasurer, updateVirtualDomWithRenderingDomDiff, VirtualDomRecord } from './dom/virtualDomBuilding';
import { IVirtualDomProvider, RootVirtualDomId } from './dom/virtualDom';
import { mapJavaScriptKeyToGacUIKey } from './keyMapping';
import { applyTypedStyle, fillParagraphMeasurements, getExtraBorder, getParagraphLayout, ParagraphEditUnit, ParagraphLayout, ParagraphLine, setCaretVisible, updateParagraphInlineImages } from './domRenderer/elementStyles';

export class GacUIHtmlRendererExitError extends Error {
    constructor() {
        super('IGacUIRenderer exited due to receiving RequestControllerConnectionStopped.');
    }
}

/**
 * Merge incremental `runsDiff` into an accumulated run list.
 * Each diff run "stamps" over the existing runs at its range,
 * preserving existing runs outside the diff range.
 */
function mergeRunsDiff(
    existingRuns: SCHEMA.DocumentRun[],
    diffRuns: SCHEMA.DocumentRun[]
): SCHEMA.DocumentRun[] {
    let result = [...existingRuns];

    for (const diff of diffRuns) {
        const newResult: SCHEMA.DocumentRun[] = [];
        for (const existing of result) {
            if (existing.caretEnd <= diff.caretBegin || existing.caretBegin >= diff.caretEnd) {
                // No overlap — keep existing run as-is
                newResult.push(existing);
            } else {
                // Overlap — keep only the non-overlapping parts of the existing run
                if (existing.caretBegin < diff.caretBegin) {
                    newResult.push({ ...existing, caretEnd: diff.caretBegin });
                }
                if (existing.caretEnd > diff.caretEnd) {
                    newResult.push({ ...existing, caretBegin: diff.caretEnd });
                }
            }
        }
        newResult.push(diff);
        result = newResult;
    }

    result.sort((a, b) => a.caretBegin - b.caretBegin);
    return result;
}

export abstract class GacUIRendererImpl implements IGacUIRenderer, SCHEMA.IRemoteProtocolRequests {
    private _responses: SCHEMA.IRemoteProtocolResponses;
    private _events: SCHEMA.IRemoteProtocolEvents;
    private _stopping = false;

    private _provider: IVirtualDomProvider;
    private _measurer: IElementMeasurer;
    private _renderingRecord: VirtualDomRecord;
    private _images: Map<SCHEMA.TYPES.Integer, SCHEMA.ImageCreation> = new Map();
    private _pendingElements: Map<SCHEMA.TYPES.Integer, HTMLElement> = new Map();

    private _screenConfig: SCHEMA.ScreenConfig;
    private _windowConfig: SCHEMA.WindowSizingConfig;
    private _fontConfig: SCHEMA.FontConfig;
    private _resizeObserver: ResizeObserver;

    /****************************************************************************************
     * Font Configuration
     ***************************************************************************************/

    private static stripFontQuotes(fontFamily: string): string {
        return fontFamily.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }

    private generateFontConfig(): SCHEMA.FontConfig {
        const styles = window.getComputedStyle(this._settings.target);
        const defaultFontFamily = GacUIRendererImpl.stripFontQuotes(styles.fontFamily.split(',')[0].trim());

        const defaultFont: SCHEMA.FontProperties = {
            fontFamily: defaultFontFamily,
            size: 12,
            bold: false,
            italic: false,
            underline: false,
            strikeline: false,
            antialias: false,
            verticalAntialias: false,
        };

        let supportedFonts: string[];
        if (this._settings.fontFamilies !== undefined) {
            supportedFonts = this._settings.fontFamilies.map(f => GacUIRendererImpl.stripFontQuotes(f));
            if (!supportedFonts.includes(defaultFontFamily)) {
                supportedFonts.unshift(defaultFontFamily);
            }
        } else {
            supportedFonts = [defaultFontFamily];
        }

        return {
            defaultFont,
            supportedFonts,
        };
    }

    /****************************************************************************************
     * Size Configuration
     ***************************************************************************************/

    private _getBounds(): SCHEMA.NativeRect {
        return {
            x1: { value: 0 },
            y1: { value: 0 },
            x2: { value: this._settings.target.clientWidth },
            y2: { value: this._settings.target.clientHeight }
        };
    }

    private _onSizeChanged(): void {
        const bounds = this._getBounds();
        this._screenConfig.bounds = bounds;
        this._screenConfig.clientBounds = bounds;
        this._windowConfig.bounds = bounds;
        this._windowConfig.clientBounds = bounds;
        this._events.OnControllerScreenUpdated(this._screenConfig);
        this._events.OnWindowBoundsUpdated(this._windowConfig);
    }

    /****************************************************************************************
     * Constructor
     ***************************************************************************************/

    constructor(private _settings: GacUISettings) {
        this._settings.target.innerText = 'Starting GacUI HTML Renderer ...';

        const bounds = this._getBounds();

        const customFramePadding: SCHEMA.NativeMargin = {
            left: { value: 8 },
            top: { value: 8 },
            right: { value: 8 },
            bottom: { value: 8 },
        }

        this._screenConfig = {
            bounds,
            clientBounds: bounds,
            scalingX: 1,
            scalingY: 1
        };

        this._windowConfig = {
            bounds,
            clientBounds: bounds,
            sizeState: SCHEMA.WindowSizeState.Maximized,
            customFramePadding,
        }

        this._fontConfig = this.generateFontConfig();
    }

    get requests(): SCHEMA.IRemoteProtocolRequests {
        return (<SCHEMA.IRemoteProtocolRequests>(<unknown>this));
    }

    abstract start(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void;

    protected _start(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents, elements: ElementManager, provider: IVirtualDomProvider, measurer: IElementMeasurer): void {
        this._responses = responses;
        this._events = events;
        this._provider = provider;
        this._measurer = measurer;

        elements.defaultFontSize = this._fontConfig.defaultFont.size;

        this._renderingRecord = createVirtualDomFromRenderingDom({
            id: RootVirtualDomId,
            content: {
                hitTestResult: null,
                cursor: null,
                element: null,
                bounds: { x1: 0, y1: 0, x2: 0, y2: 0 },
                validArea: { x1: 0, y1: 0, x2: 0, y2: 0 }
            },
            children: null
        }, elements, this._provider);
        this._installEvents();

        this._resizeObserver = new ResizeObserver(() => this._onSizeChanged());
        this._resizeObserver.observe(this._settings.target);
    }

    stop(): void {
        this._stopping = true;
        this._resizeObserver.disconnect();
        this._uninstallEvents();
    }

    requestStopToCore(forceExit: boolean): void {
        if (forceExit) {
            this._events.OnControllerForceExit();
        }
        else {
            this._events.OnControllerRequestExit();
        }
    }

    private _areBoundsEqual(a: SCHEMA.NativeRect, b: SCHEMA.NativeRect): boolean {
        return a.x1.value === b.x1.value &&
            a.y1.value === b.y1.value &&
            a.x2.value === b.x2.value &&
            a.y2.value === b.y2.value;
    }

    private _areSizeEqual(a: SCHEMA.NativeSize, b: SCHEMA.NativeRect): boolean {
        return a.x.value === (b.x2.value - b.x1.value) &&
            a.y.value === (b.y2.value - b.y1.value);
    }

    /****************************************************************************************
     * Controller
     ***************************************************************************************/

    RequestControllerGetFontConfig(id: number): void {
        this._responses.RespondControllerGetFontConfig(id, this._fontConfig);
    }

    RequestControllerGetScreenConfig(id: number): void {
        this._responses.RespondControllerGetScreenConfig(id, this._screenConfig);
    }

    RequestControllerConnectionEstablished(): void {
        this._events.OnWindowActivatedUpdated(true);
    }

    RequestControllerConnectionStopped(): void {
        this.stop();
        throw new GacUIHtmlRendererExitError();
    }

    /****************************************************************************************
     * MainWindow
     ***************************************************************************************/

    RequestWindowGetBounds(id: number): void {
        this._responses.RespondWindowGetBounds(id, this._windowConfig);
    }

    RequestWindowNotifySetTitle(requestArgs: SCHEMA.TYPES.String): void {
        document.title = requestArgs;
    }

    RequestWindowNotifySetBounds(requestArgs: SCHEMA.NativeRect): void {
        if (!this._areBoundsEqual(requestArgs, this._windowConfig.bounds)) {
            this._events.OnWindowBoundsUpdated(this._windowConfig);
        }
    }

    RequestWindowNotifySetClientSize(requestArgs: SCHEMA.NativeSize): void {
        if (!this._areSizeEqual(requestArgs, this._windowConfig.clientBounds)) {
            this._events.OnWindowBoundsUpdated(this._windowConfig);
        }
    }

    RequestWindowNotifyMinSize(requestArgs: SCHEMA.NativeSize): void {
        this._settings.suggestMinSize(requestArgs.x.value, requestArgs.y.value);
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    RequestWindowNotifySetCaret(requestArgs: SCHEMA.NativePoint): void {
        // to be implemented
    }

    /****************************************************************************************
     * IO
     ***************************************************************************************/

    private _globalShortcutKeys: SCHEMA.GlobalShortcutKey[] = [];

    RequestIOUpdateGlobalShortcutKey(requestArgs: SCHEMA.TYPES.List<SCHEMA.GlobalShortcutKey>): void {
        if (requestArgs) {
            this._globalShortcutKeys = requestArgs;
        }
    }

    RequestIOIsKeyPressing(id: number, requestArgs: SCHEMA.TYPES.Key): void {
        throw new Error(`Not Implemented (RequestIOIsKeyPressing)\nID: ${id}\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestIOIsKeyToggled(id: number, requestArgs: SCHEMA.TYPES.Key): void {
        throw new Error(`Not Implemented (RequestIOIsKeyToggled)\nID: ${id}\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    /****************************************************************************************
     * Renderer (Elements)
     ***************************************************************************************/

    RequestRendererUpdateElement_SolidBorder(requestArgs: SCHEMA.ElementDesc_SolidBorder): void {
        this._updateElement(requestArgs.id, { type: SCHEMA.RendererType.SolidBorder, desc: requestArgs });
    }

    RequestRendererUpdateElement_SinkBorder(requestArgs: SCHEMA.ElementDesc_SinkBorder): void {
        this._updateElement(requestArgs.id, { type: SCHEMA.RendererType.SinkBorder, desc: requestArgs });
    }

    RequestRendererUpdateElement_SinkSplitter(requestArgs: SCHEMA.ElementDesc_SinkSplitter): void {
        this._updateElement(requestArgs.id, { type: SCHEMA.RendererType.SinkSplitter, desc: requestArgs });
    }

    RequestRendererUpdateElement_SolidBackground(requestArgs: SCHEMA.ElementDesc_SolidBackground): void {
        this._updateElement(requestArgs.id, { type: SCHEMA.RendererType.SolidBackground, desc: requestArgs });
    }

    RequestRendererUpdateElement_GradientBackground(requestArgs: SCHEMA.ElementDesc_GradientBackground): void {
        this._updateElement(requestArgs.id, { type: SCHEMA.RendererType.GradientBackground, desc: requestArgs });
    }

    RequestRendererUpdateElement_InnerShadow(requestArgs: SCHEMA.ElementDesc_InnerShadow): void {
        this._updateElement(requestArgs.id, { type: SCHEMA.RendererType.InnerShadow, desc: requestArgs });
    }

    RequestRendererUpdateElement_Polygon(requestArgs: SCHEMA.ElementDesc_Polygon): void {
        this._updateElement(requestArgs.id, { type: SCHEMA.RendererType.Polygon, desc: requestArgs });
    }

    RequestRendererUpdateElement_SolidLabel(requestArgs: SCHEMA.ElementDesc_SolidLabel): void {
        const fixedRequestArgs = requestArgs;
        if (requestArgs.text === null || requestArgs.font === null) {
            const typedDesc = this._renderingRecord.elements.getDescEnsured(requestArgs.id);
            if (typedDesc.type !== SCHEMA.RendererType.SolidLabel) {
                throw new Error(`Element type mismatch: expected ${SCHEMA.RendererType.SolidLabel}, got ${typedDesc.type}`);
            }
            if (fixedRequestArgs.text === null) {
                fixedRequestArgs.text = typedDesc.desc.text;
            }
            if (fixedRequestArgs.font === null) {
                fixedRequestArgs.font = typedDesc.desc.font;
            }
        }

        if (fixedRequestArgs.text === null || fixedRequestArgs.font === null) {
            throw new Error(`In ElementDesc_SolidLabel, text or font should not be omitted if they were not offered before.`);
        }
        this._updateElement(fixedRequestArgs.id, { type: SCHEMA.RendererType.SolidLabel, desc: fixedRequestArgs });
        this._measurer.requestMeasureSolidLabel(fixedRequestArgs);
    }

    /****************************************************************************************
     * Renderer (ImageElement)
     ***************************************************************************************/

    RequestImageCreated(id: number, requestArgs: SCHEMA.ImageCreation): void {
        // make sure imageDataOmitted is true, register the image
        if (this._images.has(requestArgs.id)) {
            throw new Error(`Image ID ${requestArgs.id} is already in use`);
        }
        if (requestArgs.imageDataOmitted) {
            throw new Error(`imageDataOmitted must be false for RequestImageCreated`);
        }

        this._images.set(requestArgs.id, requestArgs);
        this._measurer.requestImageMetadata(id, requestArgs, this._renderingRecord);
    }

    RequestImageDestroyed(requestArgs: SCHEMA.TYPES.Integer): void {
        // unregister the image
        this._images.delete(requestArgs);
    }

    RequestRendererUpdateElement_ImageFrame(requestArgs: SCHEMA.ElementDesc_ImageFrame): void {
        // When imageId is null, ensure imageCreation is null too
        if (requestArgs.imageId === null) {
            if (requestArgs.imageCreation !== null) {
                throw new Error(`When imageId is null, imageCreation must be null too`);
            }
        }

        // When imageId is not null, validate imageCreation
        if (requestArgs.imageId !== null) {
            if (requestArgs.imageCreation === null) {
                // Image must have been registered
                if (!this._images.has(requestArgs.imageId)) {
                    throw new Error(`Image with ID ${requestArgs.imageId} must have been registered`);
                }
            } else if (requestArgs.imageCreation.imageDataOmitted) {
                // Image must have been registered
                if (!this._images.has(requestArgs.imageId)) {
                    throw new Error(`Image with ID ${requestArgs.imageId} must have been registered when imageDataOmitted is true`);
                }
            } else {
                // Image must not have been registered and register it
                if (this._images.has(requestArgs.imageCreation.id)) {
                    throw new Error(`Image with ID ${requestArgs.imageCreation.id} is already registered`);
                }
                this._images.set(requestArgs.imageCreation.id, requestArgs.imageCreation);
                // Don't call RespondImageCreated in this case
            }
        }

        // When imageCreation is not null, handle measuring
        if (requestArgs.imageCreation !== null && !requestArgs.imageCreation.imageDataOmitted) {
            this._measurer.requestImageMetadata(undefined, this._images.get(requestArgs.imageId!)!, this._renderingRecord);
        }

        // Prepare requestArgs for this.updateElement
        let finalRequestArgs = requestArgs;
        if (requestArgs.imageId !== null && (requestArgs.imageCreation === null || requestArgs.imageCreation.imageDataOmitted)) {
            // Get the registered ImageCreation and replace the incomplete imageCreation
            const registeredImage = this._images.get(requestArgs.imageId);
            if (registeredImage === undefined) {
                throw new Error(`Unable to find registered image with ID ${requestArgs.imageId}`);
            }
            finalRequestArgs = {
                ...requestArgs,
                imageCreation: registeredImage
            };
        }

        this._updateElement(finalRequestArgs.id, { type: SCHEMA.RendererType.ImageFrame, desc: finalRequestArgs });

        // Patch inline object images in paragraphs that reference this ImageFrame.
        // This handles the case where the paragraph was built before the ImageFrame desc was available.
        for (const [, data] of this._paragraphElements) {
            const layout = getParagraphLayout(data.htmlElement);
            if (layout !== undefined) {
                updateParagraphInlineImages(layout, finalRequestArgs.id, this._renderingRecord.elements);
            }
        }
    }

    /****************************************************************************************
     * Renderer (DocumentElement)
     ***************************************************************************************/

    // Map from element ID to paragraph tracking data
    private _paragraphElements: Map<number, { htmlElement: HTMLElement; textDiv: HTMLElement }> = new Map();

    private _getParagraphLayout(elementId: number): { layout: ParagraphLayout; textDiv: HTMLElement } {
        const data = this._paragraphElements.get(elementId);
        if (data === undefined) {
            throw new Error(`Paragraph element ${elementId} not found.`);
        }
        const layout = getParagraphLayout(data.htmlElement);
        if (layout === undefined) {
            throw new Error(`Paragraph layout for element ${elementId} not found.`);
        }
        return { layout, textDiv: data.textDiv };
    }

    private _measureParagraphDocumentSize(htmlElement: HTMLElement, textDiv: HTMLElement, layout: ParagraphLayout): SCHEMA.Size {
        const isInDom = htmlElement.isConnected;
        let savedHtmlStyle: string | undefined;

        if (!isInDom) {
            // Attach htmlElement (not textDiv) off-screen so the parent-child relationship is preserved
            savedHtmlStyle = htmlElement.style.cssText;
            htmlElement.style.position = 'absolute';
            htmlElement.style.left = '-9999px';
            htmlElement.style.top = '-9999px';
            htmlElement.style.visibility = 'hidden';
            document.body.appendChild(htmlElement);
        }

        // Override textDiv dimensions to measure natural content size
        const savedHeight = textDiv.style.height;
        const savedWidth = textDiv.style.width;
        textDiv.style.height = 'auto';
        if (!layout.paragraph.wrapLine) {
            textDiv.style.width = 'auto';
        } else if (layout.paragraph.maxWidth > 0) {
            textDiv.style.width = `${layout.paragraph.maxWidth}px`;
        }

        fillParagraphMeasurements(textDiv, layout);
        const documentSize: SCHEMA.Size = {
            x: textDiv.scrollWidth,
            y: textDiv.scrollHeight
        };

        // Restore textDiv styles
        textDiv.style.height = savedHeight;
        textDiv.style.width = savedWidth;

        if (!isInDom) {
            document.body.removeChild(htmlElement);
            htmlElement.style.cssText = savedHtmlStyle!;
        }

        return documentSize;
    }

    RequestRendererUpdateElement_DocumentParagraph(id: number, requestArgs: SCHEMA.ElementDesc_DocumentParagraph): void {
        if (this._stopping) {
            this._responses.RespondRendererUpdateElement_DocumentParagraph(id, { documentSize: { x: 0, y: 0 } });
            return;
        }

        const elementId = requestArgs.id;

        // Build the full desc
        let fullDesc: SCHEMA.ElementDesc_DocumentParagraphFull;
        const existingTypedDesc = this._renderingRecord.elements.getDesc(elementId);

        if (requestArgs.text !== null) {
            // First call: text is the full document
            fullDesc = {
                paragraph: requestArgs,
                caret: null
            };
        } else {
            // Subsequent call: merge with existing desc
            if (existingTypedDesc === undefined || existingTypedDesc.type !== SCHEMA.RendererType.DocumentParagraph) {
                throw new Error(`Element ${elementId} is not a DocumentParagraph or has no previous desc.`);
            }
            const existingDesc = existingTypedDesc.desc;
            const mergedRunsDiff = mergeRunsDiff(
                existingDesc.paragraph.runsDiff ?? [],
                requestArgs.runsDiff ?? []
            );
            fullDesc = {
                paragraph: {
                    ...existingDesc.paragraph,
                    ...requestArgs,
                    text: existingDesc.paragraph.text, // text never changes incrementally
                    runsDiff: mergedRunsDiff
                },
                caret: existingDesc.caret
            };
        }

        // Update via _updateElement which triggers applyTypedStyle → initializeParagraph
        const typedDesc: TypedElementDesc = { type: SCHEMA.RendererType.DocumentParagraph, desc: fullDesc };
        this._updateElement(elementId, typedDesc);

        // After _updateElement, find the htmlElement from the virtual DOM
        const virtualDom = this._renderingRecord.elementToDoms.get(elementId);
        let htmlElement: HTMLElement | undefined = virtualDom !== undefined && 'htmlElement' in virtualDom ? virtualDom.htmlElement as HTMLElement : undefined;

        if (htmlElement === undefined) {
            // Virtual DOM not yet created (RequestRendererRenderDomDiff hasn't run yet).
            // Create a temporary HTML element, apply style, and add to pending list.
            htmlElement = document.createElement('div');
            applyTypedStyle(htmlElement, typedDesc, this._renderingRecord.elements);
            this._pendingElements.set(elementId, htmlElement);
        }

        const textDiv = getExtraBorder(htmlElement);
        if (textDiv !== undefined) {
            this._paragraphElements.set(elementId, { htmlElement, textDiv });
            const layout = getParagraphLayout(htmlElement);
            if (layout !== undefined) {
                const documentSize = this._measureParagraphDocumentSize(htmlElement, textDiv, layout);
                this._responses.RespondRendererUpdateElement_DocumentParagraph(id, { documentSize });
                return;
            }
        }

        // Fallback: respond with zero size
        this._responses.RespondRendererUpdateElement_DocumentParagraph(id, { documentSize: { x: 0, y: 0 } });
    }

    RequestDocumentParagraph_GetCaret(id: number, requestArgs: SCHEMA.GetCaretRequest): void {
        const { layout } = this._getParagraphLayout(requestArgs.id);
        const text = layout.paragraph.text;
        const units = layout.units;
        const caret = requestArgs.caret;

        let newCaret = caret;
        let preferFrontSide = true;

        switch (requestArgs.relativePosition) {
            case SCHEMA.CaretRelativePosition.CaretFirst:
                newCaret = 0;
                preferFrontSide = true;
                break;
            case SCHEMA.CaretRelativePosition.CaretLast:
                newCaret = text.length;
                preferFrontSide = false;
                break;
            case SCHEMA.CaretRelativePosition.CaretMoveLeft:
                {
                    // Find the unit containing or just after the caret, then go to its start
                    let found = false;
                    for (let i = units.length - 1; i >= 0; i--) {
                        if (units[i].end <= caret && units[i].start < caret) {
                            newCaret = units[i].start;
                            preferFrontSide = true;
                            found = true;
                            break;
                        }
                        if (units[i].start < caret) {
                            newCaret = units[i].start;
                            preferFrontSide = true;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        newCaret = 0;
                        preferFrontSide = true;
                    }
                }
                break;
            case SCHEMA.CaretRelativePosition.CaretMoveRight:
                {
                    let found = false;
                    for (const unit of units) {
                        if (unit.start >= caret && unit.end > caret) {
                            newCaret = unit.end;
                            preferFrontSide = false;
                            found = true;
                            break;
                        }
                        if (unit.end > caret) {
                            newCaret = unit.end;
                            preferFrontSide = false;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        newCaret = text.length;
                        preferFrontSide = false;
                    }
                }
                break;
            case SCHEMA.CaretRelativePosition.CaretLineFirst:
                {
                    const line = this._findLineForCaret(layout, caret);
                    newCaret = line !== undefined ? line.start : 0;
                    preferFrontSide = true;
                }
                break;
            case SCHEMA.CaretRelativePosition.CaretLineLast:
                {
                    const line = this._findLineForCaret(layout, caret);
                    newCaret = line !== undefined ? line.end : text.length;
                    preferFrontSide = false;
                }
                break;
            case SCHEMA.CaretRelativePosition.CaretMoveUp:
            case SCHEMA.CaretRelativePosition.CaretMoveDown:
                {
                    // Find current caret X position
                    const currentUnit = this._findUnitForCaret(units, caret);
                    if (currentUnit === undefined) {
                        // Can't navigate, stay at current position
                        break;
                    }
                    const currentX = currentUnit.frontCaretBaseline.x;
                    const currentY = currentUnit.frontCaretBaseline.y;

                    // Find visual lines based on Y positions
                    const isUp = requestArgs.relativePosition === SCHEMA.CaretRelativePosition.CaretMoveUp;
                    let targetUnit: ParagraphEditUnit | undefined;
                    let bestDistance = Infinity;

                    for (const unit of units) {
                        // Skip line separators (different Y for front and back)
                        if (unit.frontCaretBaseline.y !== unit.backCaretBaseline.y) continue;

                        if (isUp && unit.frontCaretBaseline.y < currentY) {
                            // Look for closest unit on lines above
                            const dx = Math.abs(unit.frontCaretBaseline.x - currentX);
                            const dy = currentY - unit.frontCaretBaseline.y;
                            // Prefer same visual line (smallest dy), then closest x
                            const distance = dy * 10000 + dx;
                            if (targetUnit === undefined ||
                                unit.frontCaretBaseline.y > targetUnit.frontCaretBaseline.y ||
                                (unit.frontCaretBaseline.y === targetUnit.frontCaretBaseline.y && dx < bestDistance % 10000)) {
                                targetUnit = unit;
                                bestDistance = distance;
                            }
                        } else if (!isUp && unit.frontCaretBaseline.y > currentY) {
                            // Look for closest unit on lines below
                            const dx = Math.abs(unit.frontCaretBaseline.x - currentX);
                            const dy = unit.frontCaretBaseline.y - currentY;
                            const distance = dy * 10000 + dx;
                            if (targetUnit === undefined ||
                                unit.frontCaretBaseline.y < targetUnit.frontCaretBaseline.y ||
                                (unit.frontCaretBaseline.y === targetUnit.frontCaretBaseline.y && dx < bestDistance % 10000)) {
                                targetUnit = unit;
                                bestDistance = distance;
                            }
                        }
                    }

                    if (targetUnit !== undefined) {
                        // Determine which edge of the target unit is closer to currentX
                        const distFront = Math.abs(targetUnit.frontCaretBaseline.x - currentX);
                        const distBack = Math.abs(targetUnit.backCaretBaseline.x - currentX);
                        if (distFront <= distBack) {
                            newCaret = targetUnit.start;
                            preferFrontSide = true;
                        } else {
                            newCaret = targetUnit.end;
                            preferFrontSide = false;
                        }
                    }
                    // else stay at current position
                }
                break;
        }

        this._responses.RespondDocumentParagraph_GetCaret(id, { newCaret, preferFrontSide });
    }

    private _findLineForCaret(layout: ParagraphLayout, caret: number): ParagraphLine | undefined {
        for (const line of layout.lines) {
            if (caret >= line.start && caret <= line.end) {
                return line;
            }
        }
        // Check if caret is in a line separator
        for (let i = 0; i < layout.lines.length - 1; i++) {
            const line = layout.lines[i];
            const next = layout.lines[i + 1];
            if (caret > line.end && caret < next.start) {
                return line;
            }
        }
        return layout.lines.length > 0 ? layout.lines[layout.lines.length - 1] : undefined;
    }

    private _findUnitForCaret(units: ParagraphEditUnit[], caret: number): ParagraphEditUnit | undefined {
        for (const unit of units) {
            if (caret >= unit.start && caret <= unit.end) {
                return unit;
            }
        }
        return undefined;
    }

    RequestDocumentParagraph_GetCaretBounds(id: number, requestArgs: SCHEMA.GetCaretBoundsRequest): void {
        const { layout } = this._getParagraphLayout(requestArgs.id);
        const units = layout.units;
        const text = layout.paragraph.text;

        // Build bounds for all valid caret positions (0 through text.length)
        const frontSideBounds: SCHEMA.Rect[] = [];
        const backSideBounds: SCHEMA.Rect[] = [];

        for (let pos = 0; pos <= text.length; pos++) {
            let frontRect: SCHEMA.Rect = { x1: 0, y1: 0, x2: 0, y2: 0 };
            let backRect: SCHEMA.Rect = { x1: 0, y1: 0, x2: 0, y2: 0 };

            // Find unit where pos is at the front (start)
            for (const unit of units) {
                if (pos >= unit.start && pos < unit.end) {
                    const x = unit.frontCaretBaseline.x;
                    const y = unit.frontCaretBaseline.y;
                    const h = unit.caretHeight;
                    frontRect = { x1: x, y1: y - h, x2: x + 1, y2: y };
                    break;
                }
            }

            // Find unit where pos is at the back (end)
            for (const unit of units) {
                if (pos > unit.start && pos <= unit.end) {
                    const x = unit.backCaretBaseline.x;
                    const y = unit.backCaretBaseline.y;
                    const h = unit.caretHeight;
                    backRect = { x1: x, y1: y - h, x2: x + 1, y2: y };
                    break;
                }
            }

            frontSideBounds.push(frontRect);
            backSideBounds.push(backRect);
        }

        this._responses.RespondDocumentParagraph_GetCaretBounds(id, { frontSideBounds, backSideBounds });
    }

    RequestDocumentParagraph_GetInlineObjectFromPoint(id: number, requestArgs: SCHEMA.GetInlineObjectFromPointRequest): void {
        const { layout } = this._getParagraphLayout(requestArgs.id);
        const runs = layout.paragraph.runsDiff ?? [];
        const point = requestArgs.point;

        for (const unit of layout.units) {
            // Only check inline objects
            if (unit.frontCaretBaseline.y !== unit.backCaretBaseline.y) continue;

            const x1 = Math.min(unit.frontCaretBaseline.x, unit.backCaretBaseline.x);
            const x2 = Math.max(unit.frontCaretBaseline.x, unit.backCaretBaseline.x);
            const y2 = unit.frontCaretBaseline.y;
            const y1 = y2 - unit.caretHeight;

            if (point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2) {
                // Find the run for this unit
                const run = runs.find(r =>
                    r.caretBegin <= unit.start && r.caretEnd >= unit.end &&
                    r.props[0] === 'DocumentInlineObjectRunProperty'
                );
                if (run !== undefined) {
                    this._responses.RespondDocumentParagraph_GetInlineObjectFromPoint(id, run);
                    return;
                }
            }
        }

        this._responses.RespondDocumentParagraph_GetInlineObjectFromPoint(id, null);
    }

    RequestDocumentParagraph_GetNearestCaretFromTextPos(id: number, requestArgs: SCHEMA.GetNearestCaretFromTextPosRequest): void {
        const { layout } = this._getParagraphLayout(requestArgs.id);
        const units = layout.units;
        const textPos = requestArgs.textPos;

        // Find the unit containing or nearest to the text position
        for (const unit of units) {
            if (textPos >= unit.start && textPos <= unit.end) {
                // Snap to nearest boundary
                const distToStart = textPos - unit.start;
                const distToEnd = unit.end - textPos;
                this._responses.RespondDocumentParagraph_GetNearestCaretFromTextPos(id, distToStart <= distToEnd ? unit.start : unit.end);
                return;
            }
        }

        // Find nearest unit
        let nearestPos = 0;
        let nearestDist = Infinity;
        for (const unit of units) {
            const distToStart = Math.abs(textPos - unit.start);
            const distToEnd = Math.abs(textPos - unit.end);
            if (distToStart < nearestDist) {
                nearestDist = distToStart;
                nearestPos = unit.start;
            }
            if (distToEnd < nearestDist) {
                nearestDist = distToEnd;
                nearestPos = unit.end;
            }
        }

        this._responses.RespondDocumentParagraph_GetNearestCaretFromTextPos(id, nearestPos);
    }

    RequestDocumentParagraph_IsValidCaret(id: number, requestArgs: SCHEMA.IsValidCaretRequest): void {
        const { layout } = this._getParagraphLayout(requestArgs.id);
        const caret = requestArgs.caret;

        // Valid caret positions are at unit boundaries (start or end of any unit)
        let valid = false;
        for (const unit of layout.units) {
            if (caret === unit.start || caret === unit.end) {
                valid = true;
                break;
            }
        }

        this._responses.RespondDocumentParagraph_IsValidCaret(id, valid);
    }

    RequestDocumentParagraph_OpenCaret(requestArgs: SCHEMA.OpenCaretRequest): void {
        const data = this._paragraphElements.get(requestArgs.id);
        if (data === undefined) return;

        const layout = getParagraphLayout(data.htmlElement);
        if (layout === undefined) return;

        layout.caret = requestArgs;
        setCaretVisible(data.textDiv, true, layout);

        // Also update the stored desc
        const typedDesc = this._renderingRecord.elements.getDesc(requestArgs.id);
        if (typedDesc !== undefined && typedDesc.type === SCHEMA.RendererType.DocumentParagraph) {
            typedDesc.desc.caret = requestArgs;
        }
    }

    RequestDocumentParagraph_CloseCaret(requestArgs: SCHEMA.TYPES.Integer): void {
        const data = this._paragraphElements.get(requestArgs);
        if (data === undefined) return;

        const layout = getParagraphLayout(data.htmlElement);
        if (layout === undefined) return;

        layout.caret = null;
        setCaretVisible(data.textDiv, false, layout);

        // Also update the stored desc
        const typedDesc = this._renderingRecord.elements.getDesc(requestArgs);
        if (typedDesc !== undefined && typedDesc.type === SCHEMA.RendererType.DocumentParagraph) {
            typedDesc.desc.caret = null;
        }
    }

    /****************************************************************************************
     * Renderer
     ***************************************************************************************/

    private _updateElement(id: SCHEMA.TYPES.Integer, typedDesc: TypedElementDesc): void {
        if (this._stopping) {
            return;
        }

        this._renderingRecord.elements.updateDesc(id, typedDesc);
        const virtualDom = this._renderingRecord.elementToDoms.get(id);
        if (virtualDom) {
            virtualDom.updateTypedDesc(id, typedDesc);
        }
    }

    RequestRendererCreated(requestArgs: SCHEMA.TYPES.List<SCHEMA.RendererCreation>): void {
        if (requestArgs === null) {
            return;
        }

        for (const creation of requestArgs) {
            this._renderingRecord.elements.create(creation.id, creation.type);

            // For FocusRectangle and Raw, call updateDesc since they have no desc
            if (creation.type === SCHEMA.RendererType.FocusRectangle || creation.type === SCHEMA.RendererType.Raw) {
                this._updateElement(creation.id, { type: creation.type });
            }
        }
    }

    RequestRendererDestroyed(requestArgs: SCHEMA.TYPES.List<SCHEMA.TYPES.Integer>): void {
        if (requestArgs === null) {
            return;
        }

        for (const id of requestArgs) {
            this._renderingRecord.elements.destroy(id);
        }
    }

    RequestRendererBeginRendering(requestArgs: SCHEMA.ElementBeginRendering): void {
        if (requestArgs.updatedElements) {
            for (const elementDesc of requestArgs.updatedElements) {
                switch (elementDesc[0]) {
                    case 'ElementDesc_SolidBorder':
                        this.RequestRendererUpdateElement_SolidBorder(elementDesc[1]);
                        break;
                    case 'ElementDesc_SinkBorder':
                        this.RequestRendererUpdateElement_SinkBorder(elementDesc[1]);
                        break;
                    case 'ElementDesc_SinkSplitter':
                        this.RequestRendererUpdateElement_SinkSplitter(elementDesc[1]);
                        break;
                    case 'ElementDesc_SolidBackground':
                        this.RequestRendererUpdateElement_SolidBackground(elementDesc[1]);
                        break;
                    case 'ElementDesc_GradientBackground':
                        this.RequestRendererUpdateElement_GradientBackground(elementDesc[1]);
                        break;
                    case 'ElementDesc_InnerShadow':
                        this.RequestRendererUpdateElement_InnerShadow(elementDesc[1]);
                        break;
                    case 'ElementDesc_Polygon':
                        this.RequestRendererUpdateElement_Polygon(elementDesc[1]);
                        break;
                    case 'ElementDesc_SolidLabel':
                        this.RequestRendererUpdateElement_SolidLabel(elementDesc[1]);
                        break;
                    case 'ElementDesc_ImageFrame':
                        this.RequestRendererUpdateElement_ImageFrame(elementDesc[1]);
                        break;
                    default: {
                        const _exhaustive: never = elementDesc;
                        throw new Error(`Unknown type in ElementBeginRendering.updatedElements: ${(_exhaustive as SCHEMA.OrdinaryElementDescVariant)[0]}`);
                    }
                }
            }
        }
    }

    RequestRendererEndRendering(id: number): void {
        if (this._stopping) {
            this._responses.RespondRendererEndRendering(id, { fontHeights: [], minSizes: [], createdImages: [], inlineObjectBounds: [] });
            return;
        }
        this._measurer.RequestRendererEndRendering(id, this._renderingRecord);
    }

    RequestRendererRenderDom(requestArgs: SCHEMA.TYPES.Ptr<SCHEMA.RenderingDom>): void {
        if (this._stopping) {
            return;
        }
        if (requestArgs) {
            this._renderingRecord = createVirtualDomFromRenderingDom(requestArgs, this._renderingRecord.elements, this._provider);
            this._provider.fixBounds(
                this._renderingRecord.screen,
                this._settings.target,
                this._windowConfig.bounds.x2.value - this._windowConfig.bounds.x1.value,
                this._windowConfig.bounds.y2.value - this._windowConfig.bounds.y1.value
            );
        }
    }

    RequestRendererRenderDomDiff(requestArgs: SCHEMA.RenderingDom_DiffsInOrder): void {
        if (this._stopping) {
            return;
        }
        const pendingElements = this._pendingElements.size > 0 ? this._pendingElements : undefined;
        updateVirtualDomWithRenderingDomDiff(requestArgs, this._renderingRecord, this._provider, pendingElements);
        this._pendingElements = new Map();
        this._provider.fixBounds(
            this._renderingRecord.screen,
            this._settings.target,
            this._windowConfig.bounds.x2.value - this._windowConfig.bounds.x1.value,
            this._windowConfig.bounds.y2.value - this._windowConfig.bounds.y1.value
        );
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */

    /****************************************************************************************
     * MainWindow (ignored)
     ***************************************************************************************/

    RequestWindowNotifySetEnabled(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifySetTopMost(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifySetShowInTaskBar(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifySetCustomFrameMode(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifySetMaximizedBox(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifySetMinimizedBox(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifySetBorder(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifySetSizeBox(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifySetIconVisible(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifySetTitleBar(requestArgs: SCHEMA.TYPES.Boolean): void {
        // ignored
    }

    RequestWindowNotifyActivate(): void {
        // ignored
    }

    RequestWindowNotifyShow(requestArgs: SCHEMA.WindowShowing): void {
        // ignored
    }

    /****************************************************************************************
     * IO (ignored)
     ***************************************************************************************/

    RequestIORequireCapture(): void {
        // ignored
    }

    RequestIOReleaseCapture(): void {
        // ignored
    }

    /****************************************************************************************
     * Renderer (ignored)
     ***************************************************************************************/

    RequestRendererBeginBoundary(requestArgs: SCHEMA.ElementBoundary): void {
        throw new Error(`Should not be called (RequestRendererBeginBoundary)`);
    }

    RequestRendererRenderElement(requestArgs: SCHEMA.ElementRendering): void {
        throw new Error(`Should not be called (RequestRendererRenderElement)`);
    }

    RequestRendererEndBoundary(): void {
        throw new Error('Should not be called (RequestRendererEndBoundary)');
    }

    /* eslint-enable @typescript-eslint/no-unused-vars */

    /****************************************************************************************
     * IO Events
     ***************************************************************************************/

    // Event handlers map for all types of events
    private _eventHandlers: Map<string, EventListener> = new Map();

    // Key state tracking
    private _pressedKeys: Set<SCHEMA.TYPES.Key> = new Set();

    // Double-click tracking: when mousedown has detail===2, we need to send
    // dblclick before the subsequent mouseup to match GacUI's expected order:
    // down → up → down → dblclick → up
    private _pendingDoubleClick: { button: SCHEMA.IOMouseButton; info: SCHEMA.IOMouseInfo } | undefined = undefined;

    // Helper method to get relative coordinates
    private _ioGetRelativeCoordinates(event: MouseEvent | WheelEvent): { x: number; y: number } {
        const rect = this._settings.target.getBoundingClientRect();
        return {
            x: Math.round(event.clientX - rect.left),
            y: Math.round(event.clientY - rect.top)
        };
    }

    // Helper method to create IOMouseInfo
    private _ioCreateMouseInfo(event: MouseEvent | WheelEvent, wheel: number = 0): SCHEMA.IOMouseInfo {
        const coords = this._ioGetRelativeCoordinates(event);
        return {
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            left: (event.buttons & 0x1) !== 0,
            middle: (event.buttons & 0x4) !== 0,
            right: (event.buttons & 0x2) !== 0,
            x: { value: coords.x },
            y: { value: coords.y },
            wheel: wheel,
            nonClient: false
        };
    }

    // Helper method to get IOMouseButton from mouse event
    private _ioGetMouseButton(event: MouseEvent): SCHEMA.IOMouseButton | undefined {
        switch (event.button) {
            case 0: return SCHEMA.IOMouseButton.Left;
            case 1: return SCHEMA.IOMouseButton.Middle;
            case 2: return SCHEMA.IOMouseButton.Right;
            default: return undefined;
        }
    }

    // Helper method to create IOKeyInfo
    private _ioCreateKeyInfo(event: KeyboardEvent, autoRepeatKeyDown: boolean): SCHEMA.IOKeyInfo | null {
        const keyCode = mapJavaScriptKeyToGacUIKey(event);
        if (keyCode === null) {
            return null;
        }

        return {
            code: keyCode,
            // Cross-platform compatibility: treat both Ctrl (Windows/Linux) and Cmd (Mac) as "ctrl"
            // This allows application logic to work consistently across platforms without platform-specific code
            ctrl: event.ctrlKey || event.metaKey,
            shift: event.shiftKey,
            alt: event.altKey,
            capslock: event.getModifierState('CapsLock'),
            autoRepeatKeyDown: autoRepeatKeyDown
        };
    }

    // Helper method to hook any type of event
    private _ioHookEvent(eventName: string, handler: EventListener): void {
        this._eventHandlers.set(eventName, handler);
        this._settings.target.addEventListener(eventName, handler);
    }

    private _installEvents(): void {
        // Mouse down handler
        this._ioHookEvent('mousedown', (event: Event) => {
            const mouseEvent = event as MouseEvent;
            const button = this._ioGetMouseButton(mouseEvent);
            if (this._events !== undefined && button !== undefined) {
                const info = this._ioCreateMouseInfo(mouseEvent);
                this._events.OnIOButtonDown({ button, info });
                // When detail >= 2, this is the second mousedown of a double-click.
                // Store it so we can send dblclick before the subsequent mouseup.
                if (mouseEvent.detail >= 2) {
                    this._pendingDoubleClick = { button, info };
                }
            }
        });

        // Mouse up handler
        this._ioHookEvent('mouseup', (event: Event) => {
            const mouseEvent = event as MouseEvent;
            const button = this._ioGetMouseButton(mouseEvent);
            if (this._events !== undefined && button !== undefined) {
                // If there's a pending double-click for this button, send it before mouseup
                if (this._pendingDoubleClick !== undefined && this._pendingDoubleClick.button === button) {
                    this._events.OnIOButtonDoubleClick(this._pendingDoubleClick);
                    this._pendingDoubleClick = undefined;
                }
                this._events.OnIOButtonUp({
                    button: button,
                    info: this._ioCreateMouseInfo(mouseEvent)
                });
            }
        });

        // Browser dblclick event is no longer used because we send dblclick
        // from the mouseup handler above to ensure correct ordering:
        // down → up → down → dblclick → up

        // Mouse move handler
        this._ioHookEvent('mousemove', (event: Event) => {
            const mouseEvent = event as MouseEvent;
            if (this._events !== undefined) {
                this._events.OnIOMouseMoving(this._ioCreateMouseInfo(mouseEvent));
            }
        });

        // Mouse enter handler
        this._ioHookEvent('mouseenter', () => {
            if (this._events !== undefined) {
                this._events.OnIOMouseEntered();
            }
        });

        // Mouse leave handler
        this._ioHookEvent('mouseleave', () => {
            if (this._events !== undefined) {
                this._events.OnIOMouseLeaved();
            }
        });

        // Wheel handler
        this._ioHookEvent('wheel', (event: Event) => {
            const wheelEvent = event as WheelEvent;
            if (this._events !== undefined) {
                // Normalize wheel delta to 120/-120 per tick
                let wheel = 0;
                if (wheelEvent.deltaY !== 0) {
                    // Vertical wheel (up/down)
                    wheel = wheelEvent.deltaY > 0 ? -120 : 120;
                    this._events.OnIOVWheel(this._ioCreateMouseInfo(wheelEvent, wheel));
                } else if (wheelEvent.deltaX !== 0) {
                    // Horizontal wheel (left/right)
                    wheel = wheelEvent.deltaX > 0 ? -120 : 120;
                    this._events.OnIOHWheel(this._ioCreateMouseInfo(wheelEvent, wheel));
                }
            }
            wheelEvent.preventDefault(); // Prevent page scrolling
        });

        // Key down handler
        this._ioHookEvent('keydown', (event: Event) => {
            const keyEvent = event as KeyboardEvent;
            const keyCode = mapJavaScriptKeyToGacUIKey(keyEvent);
            if (this._events !== undefined && keyCode !== null) {
                // Check if this is an auto-repeat
                const autoRepeatKeyDown = this._pressedKeys.has(keyCode);

                // Add to pressed keys set
                this._pressedKeys.add(keyCode);

                // Create key info and send event
                const keyInfo = this._ioCreateKeyInfo(keyEvent, autoRepeatKeyDown);
                if (keyInfo !== null) {
                    this._events.OnIOKeyDown(keyInfo);

                    // Check for global shortcut key matches
                    for (let i = 0; i < this._globalShortcutKeys.length; i++) {
                        const shortcut = this._globalShortcutKeys[i];
                        if (shortcut.code === keyInfo.code &&
                            shortcut.ctrl === keyInfo.ctrl &&
                            shortcut.shift === keyInfo.shift &&
                            shortcut.alt === keyInfo.alt) {
                            this._events.OnIOGlobalShortcutKey(shortcut.id);
                            break;
                        }
                    }
                }
            }

            // Send IOChar for printable characters
            if (this._events !== undefined) {
                const key = keyEvent.key;
                let charCode: string | undefined;
                if (key.length === 1) {
                    charCode = key;
                } else if (key === 'Enter') {
                    charCode = '\r';
                } else if (key === 'Tab') {
                    charCode = '\t';
                }
                if (charCode !== undefined) {
                    this._events.OnIOChar({
                        code: charCode,
                        ctrl: keyEvent.ctrlKey || keyEvent.metaKey,
                        shift: keyEvent.shiftKey,
                        alt: keyEvent.altKey,
                        capslock: keyEvent.getModifierState('CapsLock')
                    });
                }
            }

            // Systematically prevent default behavior except for critical browser shortcuts
            if (!this._settings.isShortcutReservedForBrowser(keyEvent)) {
                keyEvent.preventDefault();
            }
        });

        // Key up handler
        this._ioHookEvent('keyup', (event: Event) => {
            const keyEvent = event as KeyboardEvent;
            const keyCode = mapJavaScriptKeyToGacUIKey(keyEvent);
            if (this._events !== undefined && keyCode !== null) {
                // Remove from pressed keys set
                this._pressedKeys.delete(keyCode);

                // KeyUp always has autoRepeatKeyDown = false
                const keyInfo = this._ioCreateKeyInfo(keyEvent, false);
                if (keyInfo !== null) {
                    this._events.OnIOKeyUp(keyInfo);
                }
            }

            // Systematically prevent default behavior except for critical browser shortcuts
            if (!this._settings.isShortcutReservedForBrowser(keyEvent)) {
                keyEvent.preventDefault();
            }
        });

        // Focus lost handler - clear pressed keys to avoid stuck keys
        this._ioHookEvent('blur', () => {
            this._pressedKeys.clear();
        });
    }

    private _uninstallEvents(): void {
        // Remove all event handlers using the map
        for (const [eventName, handler] of this._eventHandlers) {
            this._settings.target.removeEventListener(eventName, handler);
        }
        this._eventHandlers.clear();

        // Clear pressed keys state
        this._pressedKeys.clear();
    }
}
