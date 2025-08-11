import * as SCHEMA from './remoteProtocolDefinition.js';

export interface ProtocolInvoking {
    semantic: 'Message' | 'Request' | 'Response' | 'Event';
    id? : number;
    name: string;
    arguments?: {};
}

export type ProtocolInvokingHandler = (invoking: ProtocolInvoking) => void;

export function jsonToRequest(pi: ProtocolInvoking, receiver: SCHEMA.IRemoteProtocolRequests): void {
    if (pi.semantic === 'Message') {
        switch (pi.name) {
            case 'ControllerConnectionEstablished': receiver.RequestControllerConnectionEstablished(); break;
            case 'ControllerConnectionStopped': receiver.RequestControllerConnectionStopped(); break;
            case 'WindowNotifySetTitle': receiver.RequestWindowNotifySetTitle(pi.arguments); break;
            case 'WindowNotifySetEnabled': receiver.RequestWindowNotifySetEnabled(pi.arguments); break;
            case 'WindowNotifySetTopMost': receiver.RequestWindowNotifySetTopMost(pi.arguments); break;
            case 'WindowNotifySetShowInTaskBar': receiver.RequestWindowNotifySetShowInTaskBar(pi.arguments); break;
            case 'WindowNotifySetCustomFrameMode': receiver.RequestWindowNotifySetCustomFrameMode(pi.arguments); break;
            case 'WindowNotifySetMaximizedBox': receiver.RequestWindowNotifySetMaximizedBox(pi.arguments); break;
            case 'WindowNotifySetMinimizedBox': receiver.RequestWindowNotifySetMinimizedBox(pi.arguments); break;
            case 'WindowNotifySetBorder': receiver.RequestWindowNotifySetBorder(pi.arguments); break;
            case 'WindowNotifySetSizeBox': receiver.RequestWindowNotifySetSizeBox(pi.arguments); break;
            case 'WindowNotifySetIconVisible': receiver.RequestWindowNotifySetIconVisible(pi.arguments); break;
            case 'WindowNotifySetTitleBar': receiver.RequestWindowNotifySetTitleBar(pi.arguments); break;
            case 'WindowNotifySetBounds': receiver.RequestWindowNotifySetBounds(pi.arguments); break;
            case 'WindowNotifySetClientSize': receiver.RequestWindowNotifySetClientSize(pi.arguments); break;
            case 'WindowNotifyActivate': receiver.RequestWindowNotifyActivate(); break;
            case 'WindowNotifyShow': receiver.RequestWindowNotifyShow(pi.arguments); break;
            case 'IOUpdateGlobalShortcutKey': receiver.RequestIOUpdateGlobalShortcutKey(pi.arguments); break;
            case 'IORequireCapture': receiver.RequestIORequireCapture(); break;
            case 'IOReleaseCapture': receiver.RequestIOReleaseCapture(); break;
            case 'RendererUpdateElement_SolidBorder': receiver.RequestRendererUpdateElement_SolidBorder(pi.arguments); break;
            case 'RendererUpdateElement_SinkBorder': receiver.RequestRendererUpdateElement_SinkBorder(pi.arguments); break;
            case 'RendererUpdateElement_SinkSplitter': receiver.RequestRendererUpdateElement_SinkSplitter(pi.arguments); break;
            case 'RendererUpdateElement_SolidBackground': receiver.RequestRendererUpdateElement_SolidBackground(pi.arguments); break;
            case 'RendererUpdateElement_GradientBackground': receiver.RequestRendererUpdateElement_GradientBackground(pi.arguments); break;
            case 'RendererUpdateElement_InnerShadow': receiver.RequestRendererUpdateElement_InnerShadow(pi.arguments); break;
            case 'RendererUpdateElement_Polygon': receiver.RequestRendererUpdateElement_Polygon(pi.arguments); break;
            case 'RendererUpdateElement_SolidLabel': receiver.RequestRendererUpdateElement_SolidLabel(pi.arguments); break;
            case 'ImageDestroyed': receiver.RequestImageDestroyed(pi.arguments); break;
            case 'RendererUpdateElement_ImageFrame': receiver.RequestRendererUpdateElement_ImageFrame(pi.arguments); break;
            case 'RendererCreated': receiver.RequestRendererCreated(pi.arguments); break;
            case 'RendererDestroyed': receiver.RequestRendererDestroyed(pi.arguments); break;
            case 'RendererBeginRendering': receiver.RequestRendererBeginRendering(pi.arguments); break;
            case 'RendererBeginBoundary': receiver.RequestRendererBeginBoundary(pi.arguments); break;
            case 'RendererRenderElement': receiver.RequestRendererRenderElement(pi.arguments); break;
            case 'RendererEndBoundary': receiver.RequestRendererEndBoundary(); break;
            case 'RendererRenderDom': receiver.RequestRendererRenderDom(pi.arguments); break;
            case 'RendererRenderDomDiff': receiver.RequestRendererRenderDomDiff(pi.arguments); break;
            default: throw new Error('Invalid message name: ' + pi.name);
        }
    } else if (pi.semantic === 'Request') {
        switch (pi.name) {
            case 'ControllerGetFontConfig': receiver.RequestControllerGetFontConfig(pi.id); break;
            case 'ControllerGetScreenConfig': receiver.RequestControllerGetScreenConfig(pi.id); break;
            case 'WindowGetBounds': receiver.RequestWindowGetBounds(pi.id); break;
            case 'IOIsKeyPressing': receiver.RequestIOIsKeyPressing(pi.id, pi.arguments); break;
            case 'IOIsKeyToggled': receiver.RequestIOIsKeyToggled(pi.id, pi.arguments); break;
            case 'ImageCreated': receiver.RequestImageCreated(pi.id, pi.arguments); break;
            case 'RendererEndRendering': receiver.RequestRendererEndRendering(pi.id); break;
            default: throw new Error('Invalid request name: ' + pi.name);
        }
    } else {
        throw new Error('Invalid semantic type for request: ' + pi.semantic);
    }
}

export class ResponseToJson implements SCHEMA.IRemoteProtocolResponses {
    constructor(private callback: ProtocolInvokingHandler) { }

    RespondControllerGetFontConfig(responseArgs: SCHEMA.FontConfig): void {
    }

    RespondControllerGetScreenConfig(responseArgs: SCHEMA.ScreenConfig): void {
    }

    RespondWindowGetBounds(responseArgs: SCHEMA.WindowSizingConfig): void {
    }

    RespondIOIsKeyPressing(responseArgs: SCHEMA.TYPES.Boolean): void {
    }

    RespondIOIsKeyToggled(responseArgs: SCHEMA.TYPES.Boolean): void {
    }

    RespondImageCreated(responseArgs: SCHEMA.ImageMetadata): void {
    }

    RespondRendererEndRendering(responseArgs: SCHEMA.ElementMeasurings): void {
    }
}

export class EventToJson implements SCHEMA.IRemoteProtocolEvents {
    constructor(private callback: ProtocolInvokingHandler) { }

    OnControllerConnect(): void {
    }

    OnControllerDisconnect(): void {
    }

    OnControllerRequestExit(): void {
    }

    OnControllerForceExit(): void {
    }

    OnControllerScreenUpdated(eventArgs: SCHEMA.ScreenConfig): void {
    }

    OnWindowBoundsUpdated(eventArgs: SCHEMA.WindowSizingConfig): void {
    }

    OnWindowActivatedUpdated(eventArgs: SCHEMA.TYPES.Boolean): void {
    }

    OnIOGlobalShortcutKey(eventArgs: SCHEMA.TYPES.Integer): void {
    }

    OnIOButtonDown(eventArgs: SCHEMA.IOMouseInfoWithButton): void {
    }

    OnIOButtonDoubleClick(eventArgs: SCHEMA.IOMouseInfoWithButton): void {
    }

    OnIOButtonUp(eventArgs: SCHEMA.IOMouseInfoWithButton): void {
    }

    OnIOHWheel(eventArgs: SCHEMA.IOMouseInfo): void {
    }

    OnIOVWheel(eventArgs: SCHEMA.IOMouseInfo): void {
    }

    OnIOMouseMoving(eventArgs: SCHEMA.IOMouseInfo): void {
    }

    OnIOMouseEntered(): void {
    }

    OnIOMouseLeaved(): void {
    }

    OnIOKeyDown(eventArgs: SCHEMA.IOKeyInfo): void {
    }

    OnIOKeyUp(eventArgs: SCHEMA.IOKeyInfo): void {
    }

    OnIOChar(eventArgs: SCHEMA.IOCharInfo): void {
    }
}
