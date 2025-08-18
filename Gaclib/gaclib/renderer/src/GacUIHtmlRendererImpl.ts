import * as SCHEMA from '@gaclib/remote-protocol';
import { GacUISettings, IGacUIHtmlRenderer } from './interfaces';
import { ElementManager } from './GacUIElementManager';

export class GacUIHtmlRendererImpl implements IGacUIHtmlRenderer, SCHEMA.IRemoteProtocolRequests {
    private _responses: SCHEMA.IRemoteProtocolResponses;
    private _events: SCHEMA.IRemoteProtocolEvents;

    private _screenConfig: SCHEMA.ScreenConfig;
    private _windowConfig: SCHEMA.WindowSizingConfig;
    private _elements: ElementManager = new ElementManager();

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
        this._elements.updateDesc(requestArgs.id, { type: SCHEMA.RendererType.SolidBorder, desc: requestArgs });
    }

    RequestRendererUpdateElement_SinkBorder(requestArgs: SCHEMA.ElementDesc_SinkBorder): void {
        this._elements.updateDesc(requestArgs.id, { type: SCHEMA.RendererType.SinkBorder, desc: requestArgs });
    }

    RequestRendererUpdateElement_SinkSplitter(requestArgs: SCHEMA.ElementDesc_SinkSplitter): void {
        this._elements.updateDesc(requestArgs.id, { type: SCHEMA.RendererType.SinkSplitter, desc: requestArgs });
    }

    RequestRendererUpdateElement_SolidBackground(requestArgs: SCHEMA.ElementDesc_SolidBackground): void {
        this._elements.updateDesc(requestArgs.id, { type: SCHEMA.RendererType.SolidBackground, desc: requestArgs });
    }

    RequestRendererUpdateElement_GradientBackground(requestArgs: SCHEMA.ElementDesc_GradientBackground): void {
        this._elements.updateDesc(requestArgs.id, { type: SCHEMA.RendererType.GradientBackground, desc: requestArgs });
    }

    RequestRendererUpdateElement_InnerShadow(requestArgs: SCHEMA.ElementDesc_InnerShadow): void {
        this._elements.updateDesc(requestArgs.id, { type: SCHEMA.RendererType.InnerShadow, desc: requestArgs });
    }

    RequestRendererUpdateElement_Polygon(requestArgs: SCHEMA.ElementDesc_Polygon): void {
        this._elements.updateDesc(requestArgs.id, { type: SCHEMA.RendererType.Polygon, desc: requestArgs });
    }

    RequestRendererUpdateElement_SolidLabel(requestArgs: SCHEMA.ElementDesc_SolidLabel): void {
        this._elements.updateDesc(requestArgs.id, { type: SCHEMA.RendererType.SolidLabel, desc: requestArgs });
    }

    /****************************************************************************************
     * Renderer (ImageElement)
     ***************************************************************************************/

    RequestImageCreated(id: number, requestArgs: SCHEMA.ImageCreation): void {
        // make sure imageDataOmitted is true, register the image
        throw new Error(`Not Implemented (RequestImageCreated)\nID: ${id}\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestImageDestroyed(requestArgs: SCHEMA.TYPES.Integer): void {
        // unregister the image
        throw new Error(`Not Implemented (RequestImageDestroyed)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_ImageFrame(requestArgs: SCHEMA.ElementDesc_ImageFrame): void {
        // if imageCreation !== null it means a new image is created, otherwise we must ensure the image has already been registered
        // need to record created image accordingly, but it may repeat so only process if imageDataOmitted === false
        // before receiving RequestRendererBeginRendering, we must ensure the imageData has been sent
        // the size respond will sent by RespondRendererEndRendering instead, if RequestImageCreated is not received on that image
        this._elements.updateDesc(requestArgs.id, { type: SCHEMA.RendererType.ImageFrame, desc: requestArgs });
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
                this._elements.updateDesc(creation.id, { type: creation.type });
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

    RequestRendererBeginRendering(requestArgs: SCHEMA.ElementBeginRendering): void {
        throw new Error(`Not Implemented (RequestRendererBeginRendering)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererEndRendering(id: number): void {
        throw new Error(`Not Implemented (RequestRendererEndRendering)\nID: ${id}`);
    }

    RequestRendererRenderDom(requestArgs: SCHEMA.TYPES.Ptr<SCHEMA.RenderingDom>): void {
        throw new Error(`Not Implemented (RequestRendererRenderDom)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererRenderDomDiff(requestArgs: SCHEMA.RenderingDom_DiffsInOrder): void {
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
