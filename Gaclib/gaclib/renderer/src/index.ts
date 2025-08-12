import * as SCHEMA from '@gaclib/remote-protocol';

export interface IGacUIHtmlRenderer {
    get requests(): SCHEMA.IRemoteProtocolRequests;
    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void;
}

export interface GacUISettings {
    width: number;
    height: number;
    target: HTMLElement;
    fontConfig: SCHEMA.FontConfig;
}

class GacUIHtmlRendererImpl implements IGacUIHtmlRenderer, SCHEMA.IRemoteProtocolRequests {
    private _responses: SCHEMA.IRemoteProtocolResponses;
    // @ts-expect-error: TS6133
    private _events: SCHEMA.IRemoteProtocolEvents;

    private _screenConfig: SCHEMA.ScreenConfig;

    constructor(private _settings: GacUISettings) {
        this._settings.target.innerText = 'Starting GacUI HTML Renderer ...';

        const bounds: SCHEMA.NativeRect = {
            x1: { value: 0 },
            y1: { value: 0 },
            x2: { value: _settings.width },
            y2: { value: _settings.height }
        };

        this._screenConfig = {
            bounds,
            clientBounds: bounds,
            scalingX: 1,
            scalingY: 1
        };
    }

    get requests(): SCHEMA.IRemoteProtocolRequests {
        return (<SCHEMA.IRemoteProtocolRequests>(<unknown>this));
    }

    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void {
        this._responses = responses;
        this._events = events;
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
        // ignored
    }

    RequestControllerConnectionStopped(): void {
        // TODO: report back to the caller
    }

    /****************************************************************************************
     * MainWindow
     ***************************************************************************************/

    RequestWindowGetBounds(id: number): void {
        throw new Error(`Not Implemented (RequestWindowGetBounds)\nID: ${id}`);
    }

    RequestWindowNotifySetTitle(requestArgs: SCHEMA.TYPES.String): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetTitle)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
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
        throw new Error(`Not Implemented (RequestRendererUpdateElement_SolidBorder)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_SinkBorder(requestArgs: SCHEMA.ElementDesc_SinkBorder): void {
        throw new Error(`Not Implemented (RequestRendererUpdateElement_SinkBorder)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_SinkSplitter(requestArgs: SCHEMA.ElementDesc_SinkSplitter): void {
        throw new Error(`Not Implemented (RequestRendererUpdateElement_SinkSplitter)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_SolidBackground(requestArgs: SCHEMA.ElementDesc_SolidBackground): void {
        throw new Error(`Not Implemented (RequestRendererUpdateElement_SolidBackground)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_GradientBackground(requestArgs: SCHEMA.ElementDesc_GradientBackground): void {
        throw new Error(`Not Implemented (RequestRendererUpdateElement_GradientBackground)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_InnerShadow(requestArgs: SCHEMA.ElementDesc_InnerShadow): void {
        throw new Error(`Not Implemented (RequestRendererUpdateElement_InnerShadow)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_Polygon(requestArgs: SCHEMA.ElementDesc_Polygon): void {
        throw new Error(`Not Implemented (RequestRendererUpdateElement_Polygon)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_SolidLabel(requestArgs: SCHEMA.ElementDesc_SolidLabel): void {
        throw new Error(`Not Implemented (RequestRendererUpdateElement_SolidLabel)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    /****************************************************************************************
     * Renderer (ImageElement)
     ***************************************************************************************/

    RequestImageCreated(id: number, requestArgs: SCHEMA.ImageCreation): void {
        throw new Error(`Not Implemented (RequestImageCreated)\nID: ${id}\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestImageDestroyed(requestArgs: SCHEMA.TYPES.Integer): void {
        throw new Error(`Not Implemented (RequestImageDestroyed)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_ImageFrame(requestArgs: SCHEMA.ElementDesc_ImageFrame): void {
        throw new Error(`Not Implemented (RequestRendererUpdateElement_ImageFrame)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    /****************************************************************************************
     * Renderer
     ***************************************************************************************/

    RequestRendererCreated(requestArgs: SCHEMA.TYPES.List<SCHEMA.RendererCreation>): void {
        throw new Error(`Not Implemented (RequestRendererCreated)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererDestroyed(requestArgs: SCHEMA.TYPES.List<SCHEMA.TYPES.Integer>): void {
        throw new Error(`Not Implemented (RequestRendererDestroyed)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
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

    RequestWindowNotifySetBounds(requestArgs: SCHEMA.NativeRect): void {
        // ignored
    }

    RequestWindowNotifySetClientSize(requestArgs: SCHEMA.NativeSize): void {
        // ignored
    }

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

export function generateFontConfig(target: HTMLElement): SCHEMA.FontConfig {
    const styles = window.getComputedStyle(target);

    const defaultFont: SCHEMA.FontProperties = {
        fontFamily: styles.fontFamily,
        size: 12,
        bold: false,
        italic: false,
        underline: false,
        strikeline: false,
        antialias: false,
        verticalAntialias: false,
    };
    return {
        defaultFont,
        supportedFonts: [defaultFont.fontFamily],
    };
}

export function createRenderer(settings: GacUISettings): IGacUIHtmlRenderer {
    return new GacUIHtmlRendererImpl(settings);
}