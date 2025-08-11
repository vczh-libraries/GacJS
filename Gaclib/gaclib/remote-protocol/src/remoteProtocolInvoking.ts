import * as SCHEMA from './remoteProtocolDefinition.js';

export interface ProtocolInvoking {
    semantic: 'Message' | 'Request' | 'Response' | 'Event';
    id?: number;
    name: string;
    arguments?: {};
}

export type ProtocolInvokingHandler = (invoking: ProtocolInvoking) => void;

export function jsonToRequest(pi: ProtocolInvoking, receiver: SCHEMA.IRemoteProtocolRequests): void {
    if (pi.semantic === 'Message') {
        switch (pi.name) {
            case 'ControllerConnectionEstablished':
                receiver.RequestControllerConnectionEstablished();
                break;
            case 'ControllerConnectionStopped':
                receiver.RequestControllerConnectionStopped();
                break;
            case 'WindowNotifySetTitle':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetTitle((<SCHEMA.TYPES.String>pi.arguments));
                break;
            case 'WindowNotifySetEnabled':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetEnabled((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetTopMost':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetTopMost((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetShowInTaskBar':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetShowInTaskBar((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetCustomFrameMode':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetCustomFrameMode((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetMaximizedBox':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetMaximizedBox((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetMinimizedBox':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetMinimizedBox((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetBorder':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetBorder((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetSizeBox':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetSizeBox((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetIconVisible':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetIconVisible((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetTitleBar':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetTitleBar((<SCHEMA.TYPES.Boolean>pi.arguments));
                break;
            case 'WindowNotifySetBounds':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetBounds((<SCHEMA.NativeRect>pi.arguments));
                break;
            case 'WindowNotifySetClientSize':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifySetClientSize((<SCHEMA.NativeSize>pi.arguments));
                break;
            case 'WindowNotifyActivate':
                receiver.RequestWindowNotifyActivate();
                break;
            case 'WindowNotifyShow':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestWindowNotifyShow((<SCHEMA.WindowShowing>pi.arguments));
                break;
            case 'IOUpdateGlobalShortcutKey':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestIOUpdateGlobalShortcutKey((<SCHEMA.TYPES.List<SCHEMA.GlobalShortcutKey>>pi.arguments));
                break;
            case 'IORequireCapture':
                receiver.RequestIORequireCapture();
                break;
            case 'IOReleaseCapture':
                receiver.RequestIOReleaseCapture();
                break;
            case 'RendererUpdateElement_SolidBorder':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererUpdateElement_SolidBorder((<SCHEMA.ElementDesc_SolidBorder>pi.arguments));
                break;
            case 'RendererUpdateElement_SinkBorder':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererUpdateElement_SinkBorder((<SCHEMA.ElementDesc_SinkBorder>pi.arguments));
                break;
            case 'RendererUpdateElement_SinkSplitter':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererUpdateElement_SinkSplitter((<SCHEMA.ElementDesc_SinkSplitter>pi.arguments));
                break;
            case 'RendererUpdateElement_SolidBackground':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererUpdateElement_SolidBackground((<SCHEMA.ElementDesc_SolidBackground>pi.arguments));
                break;
            case 'RendererUpdateElement_GradientBackground':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererUpdateElement_GradientBackground((<SCHEMA.ElementDesc_GradientBackground>pi.arguments));
                break;
            case 'RendererUpdateElement_InnerShadow':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererUpdateElement_InnerShadow((<SCHEMA.ElementDesc_InnerShadow>pi.arguments));
                break;
            case 'RendererUpdateElement_Polygon':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererUpdateElement_Polygon((<SCHEMA.ElementDesc_Polygon>pi.arguments));
                break;
            case 'RendererUpdateElement_SolidLabel':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererUpdateElement_SolidLabel((<SCHEMA.ElementDesc_SolidLabel>pi.arguments));
                break;
            case 'ImageDestroyed':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestImageDestroyed((<SCHEMA.TYPES.Integer>pi.arguments));
                break;
            case 'RendererUpdateElement_ImageFrame':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererUpdateElement_ImageFrame((<SCHEMA.ElementDesc_ImageFrame>pi.arguments));
                break;
            case 'RendererCreated':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererCreated((<SCHEMA.TYPES.List<SCHEMA.RendererCreation>>pi.arguments));
                break;
            case 'RendererDestroyed':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererDestroyed((<SCHEMA.TYPES.List<SCHEMA.TYPES.Integer>>pi.arguments));
                break;
            case 'RendererBeginRendering':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererBeginRendering((<SCHEMA.ElementBeginRendering>pi.arguments));
                break;
            case 'RendererBeginBoundary':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererBeginBoundary((<SCHEMA.ElementBoundary>pi.arguments));
                break;
            case 'RendererRenderElement':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererRenderElement((<SCHEMA.ElementRendering>pi.arguments));
                break;
            case 'RendererEndBoundary':
                receiver.RequestRendererEndBoundary();
                break;
            case 'RendererRenderDom':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererRenderDom((<SCHEMA.TYPES.Ptr<SCHEMA.RenderingDom>>pi.arguments));
                break;
            case 'RendererRenderDomDiff':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestRendererRenderDomDiff((<SCHEMA.RenderingDom_DiffsInOrder>pi.arguments));
                break;
            default: throw new Error('Invalid message name: ' + pi.name);
        }
    } else if (pi.semantic === 'Request') {
        if (!pi.id) {
            throw new Error('Missing id for request: ' + pi.name);
        }
        switch (pi.name) {
            case 'ControllerGetFontConfig':
                receiver.RequestControllerGetFontConfig(pi.id);
                break;
            case 'ControllerGetScreenConfig':
                receiver.RequestControllerGetScreenConfig(pi.id);
                break;
            case 'WindowGetBounds':
                receiver.RequestWindowGetBounds(pi.id);
                break;
            case 'IOIsKeyPressing':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestIOIsKeyPressing(pi.id, (<SCHEMA.TYPES.Key>pi.arguments));
                break;
            case 'IOIsKeyToggled':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestIOIsKeyToggled(pi.id, (<SCHEMA.TYPES.Key>pi.arguments));
                break;
            case 'ImageCreated':
                if (!pi.arguments) {
                    throw new Error('Missing arguments for request: ' + pi.name);
                }
                receiver.RequestImageCreated(pi.id, (<SCHEMA.ImageCreation>pi.arguments));
                break;
            case 'RendererEndRendering':
                receiver.RequestRendererEndRendering(pi.id);
                break;
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
