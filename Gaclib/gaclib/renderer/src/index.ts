import * as SCHEMA from '@gaclib/remote-protocol';

export interface IGacUIHtmlRenderer {
    get requests(): SCHEMA.IRemoteProtocolRequests;
    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void;
}

export interface GacUISettings {
    width: number;
    height: number;
    target: Element;
}

class GacUIHtmlRendererImpl implements IGacUIHtmlRenderer, SCHEMA.IRemoteProtocolRequests {
    // @ts-expect-error: TS6133
    private _responses: SCHEMA.IRemoteProtocolResponses;
    // @ts-expect-error: TS6133
    private _events: SCHEMA.IRemoteProtocolEvents;

    constructor(private settings: GacUISettings) {
        this.settings.target.textContent='Starting GacUI HTML Renderer ...';
    }

    get requests(): SCHEMA.IRemoteProtocolRequests {
        return (<SCHEMA.IRemoteProtocolRequests>(<unknown>this));
    }

    init(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void {
        this._responses = responses;
        this._events = events;
    }

    // IRemoteProtocolRequests implementation
    RequestControllerGetFontConfig(id: number): void {
        throw new Error(`Not Implemented (RequestControllerGetFontConfig)\nID: ${id}`);
    }

    RequestControllerGetScreenConfig(id: number): void {
        throw new Error(`Not Implemented (RequestControllerGetScreenConfig)\nID: ${id}`);
    }

    RequestControllerConnectionEstablished(): void {
        throw new Error('Not Implemented (RequestControllerConnectionEstablished)');
    }

    RequestControllerConnectionStopped(): void {
        throw new Error('Not Implemented (RequestControllerConnectionStopped)');
    }

    RequestWindowGetBounds(id: number): void {
        throw new Error(`Not Implemented (RequestWindowGetBounds)\nID: ${id}`);
    }

    RequestWindowNotifySetTitle(requestArgs: SCHEMA.TYPES.String): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetTitle)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetEnabled(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetEnabled)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetTopMost(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetTopMost)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetShowInTaskBar(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetShowInTaskBar)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetCustomFrameMode(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetCustomFrameMode)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetMaximizedBox(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetMaximizedBox)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetMinimizedBox(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetMinimizedBox)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetBorder(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetBorder)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetSizeBox(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetSizeBox)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetIconVisible(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetIconVisible)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetTitleBar(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetTitleBar)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetBounds(requestArgs: SCHEMA.NativeRect): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetBounds)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifySetClientSize(requestArgs: SCHEMA.NativeSize): void {
        throw new Error(`Not Implemented (RequestWindowNotifySetClientSize)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestWindowNotifyActivate(): void {
        throw new Error('Not Implemented (RequestWindowNotifyActivate)');
    }

    RequestWindowNotifyShow(requestArgs: SCHEMA.WindowShowing): void {
        throw new Error(`Not Implemented (RequestWindowNotifyShow)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestIOUpdateGlobalShortcutKey(requestArgs: SCHEMA.TYPES.List<SCHEMA.GlobalShortcutKey>): void {
        throw new Error(`Not Implemented (RequestIOUpdateGlobalShortcutKey)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestIORequireCapture(): void {
        throw new Error('Not Implemented (RequestIORequireCapture)');
    }

    RequestIOReleaseCapture(): void {
        throw new Error('Not Implemented (RequestIOReleaseCapture)');
    }

    RequestIOIsKeyPressing(id: number, requestArgs: SCHEMA.TYPES.Key): void {
        throw new Error(`Not Implemented (RequestIOIsKeyPressing)\nID: ${id}\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestIOIsKeyToggled(id: number, requestArgs: SCHEMA.TYPES.Key): void {
        throw new Error(`Not Implemented (RequestIOIsKeyToggled)\nID: ${id}\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

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

    RequestImageCreated(id: number, requestArgs: SCHEMA.ImageCreation): void {
        throw new Error(`Not Implemented (RequestImageCreated)\nID: ${id}\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestImageDestroyed(requestArgs: SCHEMA.TYPES.Integer): void {
        throw new Error(`Not Implemented (RequestImageDestroyed)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererUpdateElement_ImageFrame(requestArgs: SCHEMA.ElementDesc_ImageFrame): void {
        throw new Error(`Not Implemented (RequestRendererUpdateElement_ImageFrame)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererCreated(requestArgs: SCHEMA.TYPES.List<SCHEMA.RendererCreation>): void {
        throw new Error(`Not Implemented (RequestRendererCreated)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererDestroyed(requestArgs: SCHEMA.TYPES.List<SCHEMA.TYPES.Integer>): void {
        throw new Error(`Not Implemented (RequestRendererDestroyed)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererBeginRendering(requestArgs: SCHEMA.ElementBeginRendering): void {
        throw new Error(`Not Implemented (RequestRendererBeginRendering)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererBeginBoundary(requestArgs: SCHEMA.ElementBoundary): void {
        throw new Error(`Not Implemented (RequestRendererBeginBoundary)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererRenderElement(requestArgs: SCHEMA.ElementRendering): void {
        throw new Error(`Not Implemented (RequestRendererRenderElement)\nArguments: ${JSON.stringify(requestArgs, undefined, 4)}`);
    }

    RequestRendererEndBoundary(): void {
        throw new Error('Not Implemented (RequestRendererEndBoundary)');
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
}

export function createRenderer(settings: GacUISettings): IGacUIHtmlRenderer {
    return new GacUIHtmlRendererImpl(settings);
}