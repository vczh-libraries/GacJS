import * as SCHEMA from '@gaclib/remote-protocol';
import { GacUISettings, IGacUIHtmlRenderer } from './interfaces';
import { ElementManager, TypedElementDesc } from './GacUIElementManager';
import { createVirtualDomFromRenderingDom, IElementMeasurer, VirtualDomRecord } from './dom/virtualDomBuilding';
import { IVirtualDomProvider, RootVirtualDomId } from './dom/virtualDom';

export class GacUIHtmlRendererImpl implements IGacUIHtmlRenderer, SCHEMA.IRemoteProtocolRequests {
    private _responses: SCHEMA.IRemoteProtocolResponses;
    private _events: SCHEMA.IRemoteProtocolEvents;

    private _provider: IVirtualDomProvider;
    private _measurer: IElementMeasurer;
    private _renderingRecord: VirtualDomRecord;
    private _images: Map<SCHEMA.TYPES.Integer, SCHEMA.ImageCreation> = new Map();

    private _screenConfig: SCHEMA.ScreenConfig;
    private _windowConfig: SCHEMA.WindowSizingConfig;

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

    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents, provider: IVirtualDomProvider, measurer: IElementMeasurer): void {
        this._responses = responses;
        this._events = events;
        this._provider = provider;
        this._measurer = measurer;

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
        }, new ElementManager(), this._provider);
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
    }

    /****************************************************************************************
     * Renderer
     ***************************************************************************************/

    private _updateElement(id: SCHEMA.TYPES.Integer, typedDesc: TypedElementDesc): void {
        this._renderingRecord.elements.updateDesc(id, typedDesc);
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    RequestRendererBeginRendering(requestArgs: SCHEMA.ElementBeginRendering): void {
        // nothing needs to be done
    }

    RequestRendererEndRendering(id: number): void {
        this._measurer.RequestRendererEndRendering(id, this._renderingRecord);
    }

    RequestRendererRenderDom(requestArgs: SCHEMA.TYPES.Ptr<SCHEMA.RenderingDom>): void {
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
