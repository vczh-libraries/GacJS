import * as SCHEMA from './remoteProtocolDefinition.js';

export interface ProtocolInvoking {
    semantic: 'Message' | 'Request' | 'Response' | 'Event';
    id? : number;
    name: string;
    arguments?: {};
}

export type ProtocolInvokingHandler = (invoking: ProtocolInvoking) => void;

export function jsonToRequest(pi: ProtocolInvoking, receiver: SCHEMA.IRemoteProtocolRequests): void {
}

export class ResponseToJson implements SCHEMA.IRemoteProtocolResponses {
    constructor(private callback: ProtocolInvokingHandler) {}

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
    constructor(private callback: ProtocolInvokingHandler) {}

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
