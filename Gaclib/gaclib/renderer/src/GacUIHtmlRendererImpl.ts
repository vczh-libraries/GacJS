import * as SCHEMA from '@gaclib/remote-protocol';
import { GacUISettings, IGacUIHtmlRenderer } from './interfaces';
import { ElementManager, TypedElementDesc } from './GacUIElementManager';
import { getImageFormatType, getImageContentType, getImageDataUrl, getFontStyle } from './domRenderer/elementStyles';
import { createVirtualDomFromRenderingDom, VirtualDomRecord } from './virtualDomBuilding';
import { VirtualDomHtmlProvider } from './domRenderer/virtualDomRenderer';

export class GacUIHtmlRendererImpl implements IGacUIHtmlRenderer, SCHEMA.IRemoteProtocolRequests {
    private _responses: SCHEMA.IRemoteProtocolResponses;
    private _events: SCHEMA.IRemoteProtocolEvents;

    private _screenConfig: SCHEMA.ScreenConfig;
    private _windowConfig: SCHEMA.WindowSizingConfig;

    private _provider = new VirtualDomHtmlProvider();
    private _elements: ElementManager = new ElementManager();
    private _images: Map<SCHEMA.TYPES.Integer, SCHEMA.ImageCreation> = new Map();
    private _renderingRecord: VirtualDomRecord | undefined = undefined;

    constructor(private _settings: GacUISettings) {
        this._settings.target.innerText = 'Starting GacUI HTML Renderer ...';

        const bounds: SCHEMA.NativeRect = {
            x1: { value: 0 },
            y1: { value: 0 },
            x2: { value: _settings.width },
            y2: { value: _settings.height }
        };

        const customFramePadding: SCHEMA.NativeMargin = {
            left: { value: 0 },
            top: { value: 0 },
            right: { value: 0 },
            bottom: { value: 0 },
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
    }

    get requests(): SCHEMA.IRemoteProtocolRequests {
        return (<SCHEMA.IRemoteProtocolRequests>(<unknown>this));
    }

    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void {
        this._responses = responses;
        this._events = events;
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
        this._responses.RespondControllerGetFontConfig(id, this._settings.fontConfig);
    }

    RequestControllerGetScreenConfig(id: number): void {
        this._responses.RespondControllerGetScreenConfig(id, this._screenConfig);
    }

    RequestControllerConnectionEstablished(): void {
        this._events.OnWindowActivatedUpdated(true);
    }

    RequestControllerConnectionStopped(): void {
        // TODO: report back to the caller
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

    /****************************************************************************************
     * IO
     ***************************************************************************************/

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
            const typedDesc = this._elements.getDescEnsured(requestArgs.id);
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
        if (fixedRequestArgs.measuringRequest) {
            this._measuringSolidLabels.push(fixedRequestArgs.id);
        }
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
        this._makeImageMetadata(id, requestArgs);
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
            this._makeImageMetadata(undefined, this._images.get(requestArgs.imageId!)!);
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
    }

    /****************************************************************************************
     * Renderer (Element Helpers)
     ***************************************************************************************/

    private _measuring: SCHEMA.ElementMeasurings = { fontHeights: [], minSizes: [], createdImages: [] };
    private _idRespondRendererEndRendering: SCHEMA.TYPES.Integer | undefined = undefined;

    private _textElementForTesting: HTMLElement = document.createElement('div');
    private _measuringSolidLabels: SCHEMA.TYPES.Integer[] = [];
    private _measuredFontHeights: Map<string, SCHEMA.ElementMeasuring_FontHeight> = new Map();
    private _measuredTotalSizes: Map<SCHEMA.TYPES.Integer, SCHEMA.ElementMeasuring_ElementMinSize> = new Map();

    private _imageElementForTesting: HTMLImageElement = document.createElement('img');
    private _measuringImageTasks: [SCHEMA.TYPES.Integer | undefined, SCHEMA.ImageCreation][] = [];
    private _measuringImageTasksExecuted = 0;
    private _measuringImageTasksExecuting = false;

    private _updateElement(id: SCHEMA.TYPES.Integer, typedDesc: TypedElementDesc): void {
        this._elements.updateDesc(id, typedDesc);
    }

    private _measureSolidLabel(id: SCHEMA.TYPES.Integer): void {
        const typedDesc = this._elements.getDescEnsured(id);
        if (typedDesc.type !== SCHEMA.RendererType.SolidLabel) {
            throw new Error(`Element type mismatch: expected ${SCHEMA.RendererType.SolidLabel}, got ${typedDesc.type}`);
        }

        switch (typedDesc.desc.measuringRequest) {
            case SCHEMA.ElementSolidLabelMeasuringRequest.FontHeight:
                {
                    const key = `${typedDesc.desc.font!.size}:${typedDesc.desc.font!.fontFamily}`;
                    if (this._measuredFontHeights.has(key)) {
                        break;
                    }

                    // Set font style on the test element
                    this._textElementForTesting.style.cssText = getFontStyle(typedDesc.desc);

                    // Set a reasonable text to measure font height
                    this._textElementForTesting.textContent = 'Ag';

                    // Temporarily add to DOM to measure
                    document.body.appendChild(this._textElementForTesting);

                    // Get computed style to measure the actual height
                    const computedStyle = window.getComputedStyle(this._textElementForTesting);
                    const lineHeight = parseFloat(computedStyle.lineHeight);

                    // Remove from DOM
                    document.body.removeChild(this._textElementForTesting);

                    // Store the measurement
                    const result: SCHEMA.ElementMeasuring_FontHeight = {
                        fontFamily: typedDesc.desc.font!.fontFamily,
                        fontSize: typedDesc.desc.font!.size,
                        height: Math.round(lineHeight)
                    };
                    this._measuredFontHeights.set(key, result);
                    this._measuring.fontHeights!.push(result);
                }
                break;
            case SCHEMA.ElementSolidLabelMeasuringRequest.TotalSize:
                {
                    const virtualDom = this._renderingRecord?.elementToDoms.get(id);
                    if (virtualDom) {
                        const minSize: SCHEMA.Size;
                        // TODO

                        const result: SCHEMA.ElementMeasuring_ElementMinSize = {
                            id: typedDesc.desc.id,
                            minSize
                        };

                        if (this._measuredTotalSizes.has(typedDesc.desc.id)) {
                            const original = this._measuredTotalSizes.get(typedDesc.desc.id)!;
                            if (original.minSize.x === result.minSize.x && original.minSize.y === result.minSize.y) {
                                break;
                            }
                        }
                        this._measuredTotalSizes.set(typedDesc.desc.id, result);
                        this._measuring.minSizes!.push(result);
                    } else if (!this._measuredTotalSizes.has(typedDesc.desc.id)) {
                        const result: SCHEMA.ElementMeasuring_ElementMinSize = {
                            id: typedDesc.desc.id,
                            minSize: { x: 1, y: 1 }
                        };
                        this._measuredTotalSizes.set(typedDesc.desc.id, result);
                        this._measuring.minSizes!.push(result);
                    }
                }
                break;
        }
    }

    private _fireRespondRendererEndRendering(): void {
        if (this._idRespondRendererEndRendering !== undefined) {
            for (const id of this._measuringSolidLabels) {
                this._measureSolidLabel(id);
            }
            this._responses.RespondRendererEndRendering(this._idRespondRendererEndRendering, this._measuring);
            this._measuring = { fontHeights: [], minSizes: [], createdImages: [] };
            this._measuringSolidLabels = [];
            this._idRespondRendererEndRendering = undefined;
        }
    }

    private async _runMeasuringImageTasks(): Promise<void> {
        if (this._measuringImageTasksExecuting) {
            return;
        }
        this._measuringImageTasksExecuting = true;
        while (this._measuringImageTasksExecuted < this._measuringImageTasks.length) {
            const [id, imageCreation] = this._measuringImageTasks[this._measuringImageTasksExecuted++];
            const formatType = getImageFormatType(imageCreation.imageData);
            const contentType = getImageContentType(formatType);
            const imageUrl = getImageDataUrl(contentType, imageCreation.imageData);

            // Set the source and wait for the image to load
            this._imageElementForTesting.src = imageUrl;
            let imageMetadata: SCHEMA.ImageMetadata;
            try {
                await this._imageElementForTesting.decode();
                imageMetadata = {
                    id: imageCreation.id,
                    format: formatType,
                    frames: [{
                        size: {
                            x: this._imageElementForTesting.naturalWidth,
                            y: this._imageElementForTesting.naturalHeight
                        }
                    }]
                };
            } catch (error) {
                if (error instanceof DOMException) {
                    imageMetadata = {
                        id: imageCreation.id,
                        format: SCHEMA.ImageFormatType.Unknown,
                        frames: [{ size: { x: 1, y: 1 } }]
                    };
                } else {
                    throw error;
                }
            }

            // Submit metadata
            if (id === undefined) {
                this._measuring.createdImages!.push(imageMetadata);
            } else {
                this._responses.RespondImageCreated(id, imageMetadata);
            }
        }
        this._fireRespondRendererEndRendering();

        this._measuringImageTasksExecuting = false;
        this._measuringImageTasks = [];
        this._measuringImageTasksExecuted = 0;
    }

    _makeImageMetadata(id: SCHEMA.TYPES.Integer | undefined, imageCreation: SCHEMA.ImageCreation): void {
        this._measuringImageTasks.push([id, imageCreation]);
        void this._runMeasuringImageTasks();
    }

    /****************************************************************************************
     * Renderer
     ***************************************************************************************/

    RequestRendererCreated(requestArgs: SCHEMA.TYPES.List<SCHEMA.RendererCreation>): void {
        if (requestArgs === null) {
            return;
        }

        for (const creation of requestArgs) {
            this._elements.create(creation.id, creation.type);

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
            this._elements.destroy(id);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    RequestRendererBeginRendering(requestArgs: SCHEMA.ElementBeginRendering): void {
        // nothing needs to be done
    }

    RequestRendererEndRendering(id: number): void {
        this._idRespondRendererEndRendering = id;
        if (this._measuringImageTasksExecuted === this._measuringImageTasks.length) {
            this._fireRespondRendererEndRendering();
        }
    }

    RequestRendererRenderDom(requestArgs: SCHEMA.TYPES.Ptr<SCHEMA.RenderingDom>): void {
        if (this._renderingRecord) {
            this._renderingRecord = undefined;
            this._settings.target.replaceChildren();
        }
        if (requestArgs) {
            this._renderingRecord = createVirtualDomFromRenderingDom(requestArgs, this._elements, this._provider);
            const rootElement = this._provider.fixBounds(this._renderingRecord.screen);
            rootElement.style.width = `${this._windowConfig.bounds.x2.value - this._windowConfig.bounds.x1.value}px`;
            rootElement.style.height = `${this._windowConfig.bounds.y2.value - this._windowConfig.bounds.y1.value}px`;
            this._settings.target.replaceChildren(rootElement);
        }
    }

    RequestRendererRenderDomDiff(requestArgs: SCHEMA.RenderingDom_DiffsInOrder): void {
        // incrementally update HTMLElement
        // Call onSolidLabelResized accordingly
        throw new Error(`Not Implemented (RequestRendererRenderDomDiff)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
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

    RequestIOUpdateGlobalShortcutKey(requestArgs: SCHEMA.TYPES.List<SCHEMA.GlobalShortcutKey>): void {
        // ignored
    }

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
}
