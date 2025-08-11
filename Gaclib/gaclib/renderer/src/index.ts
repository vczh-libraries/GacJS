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
    /* eslint-disable @typescript-eslint/no-unused-vars */
    RequestControllerGetFontConfig(id: number): void {
        throw new Error('Not Implemented (RequestControllerGetFontConfig)');
    }

    RequestControllerGetScreenConfig(id: number): void {
        throw new Error('Not Implemented (RequestControllerGetScreenConfig)');
    }

    RequestControllerConnectionEstablished(): void {
        throw new Error('Not Implemented (RequestControllerConnectionEstablished)');
    }

    RequestControllerConnectionStopped(): void {
        throw new Error('Not Implemented (RequestControllerConnectionStopped)');
    }

    RequestWindowGetBounds(id: number): void {
        throw new Error('Not Implemented (RequestWindowGetBounds)');
    }

    RequestWindowNotifySetTitle(requestArgs: SCHEMA.TYPES.String): void {
        throw new Error('Not Implemented (RequestWindowNotifySetTitle)');
    }

    RequestWindowNotifySetEnabled(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetEnabled)');
    }

    RequestWindowNotifySetTopMost(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetTopMost)');
    }

    RequestWindowNotifySetShowInTaskBar(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetShowInTaskBar)');
    }

    RequestWindowNotifySetCustomFrameMode(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetCustomFrameMode)');
    }

    RequestWindowNotifySetMaximizedBox(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetMaximizedBox)');
    }

    RequestWindowNotifySetMinimizedBox(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetMinimizedBox)');
    }

    RequestWindowNotifySetBorder(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetBorder)');
    }

    RequestWindowNotifySetSizeBox(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetSizeBox)');
    }

    RequestWindowNotifySetIconVisible(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetIconVisible)');
    }

    RequestWindowNotifySetTitleBar(requestArgs: SCHEMA.TYPES.Boolean): void {
        throw new Error('Not Implemented (RequestWindowNotifySetTitleBar)');
    }

    RequestWindowNotifySetBounds(requestArgs: SCHEMA.NativeRect): void {
        throw new Error('Not Implemented (RequestWindowNotifySetBounds)');
    }

    RequestWindowNotifySetClientSize(requestArgs: SCHEMA.NativeSize): void {
        throw new Error('Not Implemented (RequestWindowNotifySetClientSize)');
    }

    RequestWindowNotifyActivate(): void {
        throw new Error('Not Implemented (RequestWindowNotifyActivate)');
    }

    RequestWindowNotifyShow(requestArgs: SCHEMA.WindowShowing): void {
        throw new Error('Not Implemented (RequestWindowNotifyShow)');
    }

    RequestIOUpdateGlobalShortcutKey(requestArgs: SCHEMA.TYPES.List<SCHEMA.GlobalShortcutKey>): void {
        throw new Error('Not Implemented (RequestIOUpdateGlobalShortcutKey)');
    }

    RequestIORequireCapture(): void {
        throw new Error('Not Implemented (RequestIORequireCapture)');
    }

    RequestIOReleaseCapture(): void {
        throw new Error('Not Implemented (RequestIOReleaseCapture)');
    }

    RequestIOIsKeyPressing(id: number, requestArgs: SCHEMA.TYPES.Key): void {
        throw new Error('Not Implemented (RequestIOIsKeyPressing)');
    }

    RequestIOIsKeyToggled(id: number, requestArgs: SCHEMA.TYPES.Key): void {
        throw new Error('Not Implemented (RequestIOIsKeyToggled)');
    }

    RequestRendererUpdateElement_SolidBorder(requestArgs: SCHEMA.ElementDesc_SolidBorder): void {
        throw new Error('Not Implemented (RequestRendererUpdateElement_SolidBorder)');
    }

    RequestRendererUpdateElement_SinkBorder(requestArgs: SCHEMA.ElementDesc_SinkBorder): void {
        throw new Error('Not Implemented (RequestRendererUpdateElement_SinkBorder)');
    }

    RequestRendererUpdateElement_SinkSplitter(requestArgs: SCHEMA.ElementDesc_SinkSplitter): void {
        throw new Error('Not Implemented (RequestRendererUpdateElement_SinkSplitter)');
    }

    RequestRendererUpdateElement_SolidBackground(requestArgs: SCHEMA.ElementDesc_SolidBackground): void {
        throw new Error('Not Implemented (RequestRendererUpdateElement_SolidBackground)');
    }

    RequestRendererUpdateElement_GradientBackground(requestArgs: SCHEMA.ElementDesc_GradientBackground): void {
        throw new Error('Not Implemented (RequestRendererUpdateElement_GradientBackground)');
    }

    RequestRendererUpdateElement_InnerShadow(requestArgs: SCHEMA.ElementDesc_InnerShadow): void {
        throw new Error('Not Implemented (RequestRendererUpdateElement_InnerShadow)');
    }

    RequestRendererUpdateElement_Polygon(requestArgs: SCHEMA.ElementDesc_Polygon): void {
        throw new Error('Not Implemented (RequestRendererUpdateElement_Polygon)');
    }

    RequestRendererUpdateElement_SolidLabel(requestArgs: SCHEMA.ElementDesc_SolidLabel): void {
        throw new Error('Not Implemented (RequestRendererUpdateElement_SolidLabel)');
    }

    RequestImageCreated(id: number, requestArgs: SCHEMA.ImageCreation): void {
        throw new Error('Not Implemented (RequestImageCreated)');
    }

    RequestImageDestroyed(requestArgs: SCHEMA.TYPES.Integer): void {
        throw new Error('Not Implemented (RequestImageDestroyed)');
    }

    RequestRendererUpdateElement_ImageFrame(requestArgs: SCHEMA.ElementDesc_ImageFrame): void {
        throw new Error('Not Implemented (RequestRendererUpdateElement_ImageFrame)');
    }

    RequestRendererCreated(requestArgs: SCHEMA.TYPES.List<SCHEMA.RendererCreation>): void {
        throw new Error('Not Implemented (RequestRendererCreated)');
    }

    RequestRendererDestroyed(requestArgs: SCHEMA.TYPES.List<SCHEMA.TYPES.Integer>): void {
        throw new Error('Not Implemented (RequestRendererDestroyed)');
    }

    RequestRendererBeginRendering(requestArgs: SCHEMA.ElementBeginRendering): void {
        throw new Error('Not Implemented (RequestRendererBeginRendering)');
    }

    RequestRendererBeginBoundary(requestArgs: SCHEMA.ElementBoundary): void {
        throw new Error('Not Implemented (RequestRendererBeginBoundary)');
    }

    RequestRendererRenderElement(requestArgs: SCHEMA.ElementRendering): void {
        throw new Error('Not Implemented (RequestRendererRenderElement)');
    }

    RequestRendererEndBoundary(): void {
        throw new Error('Not Implemented (RequestRendererEndBoundary)');
    }

    RequestRendererEndRendering(id: number): void {
        throw new Error('Not Implemented (RequestRendererEndRendering)');
    }

    RequestRendererRenderDom(requestArgs: SCHEMA.TYPES.Ptr<SCHEMA.RenderingDom>): void {
        throw new Error('Not Implemented (RequestRendererRenderDom)');
    }

    RequestRendererRenderDomDiff(requestArgs: SCHEMA.RenderingDom_DiffsInOrder): void {
        throw new Error('Not Implemented (RequestRendererRenderDomDiff)');
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */
}

export function createRenderer(settings: GacUISettings): IGacUIHtmlRenderer {
    return new GacUIHtmlRendererImpl(settings);
}