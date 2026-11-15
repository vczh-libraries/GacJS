import * as SCHEMA from '@gaclib/remote-protocol';

/** A protocol Raw element whose div and record survive changes to the rendering DOM. */
export interface GacUIRawElement {
    readonly element: HTMLDivElement;
    readonly id: string;
    readonly interpretor: string;
    readonly data: string;
}

export interface IGacUIEventSubscription {
    unsubscribe(): void;
}

export interface IRawElementInterpretor {
    initialize(raw: GacUIRawElement): void;
    finalize(): void;
}

export interface IRawElementInterpretorFactory {
    create(): IRawElementInterpretor;
}

export interface IGacUIRenderer {
    get requests(): SCHEMA.IRemoteProtocolRequests;
    start(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void;
    /** Dispose while connected, or pass true after transport teardown to suppress outgoing events. */
    stop(disconnected?: boolean): void;
    requestStopToCore(forceExit: boolean): void;

    getRawElements(): readonly GacUIRawElement[];
    rawElementInstalled(listener: (element: GacUIRawElement) => void): IGacUIEventSubscription;
    rawElementUninstalled(listener: (element: GacUIRawElement) => void): IGacUIEventSubscription;
    rawElementUpdated(listener: (element: GacUIRawElement) => void): IGacUIEventSubscription;
    registerRawElementInterpretorFactory(name: string, factory: IRawElementInterpretorFactory): void;
    getRawElementInterpretorFactory(name: string): IRawElementInterpretorFactory | undefined;
}

export interface GacUISettings {
    target: HTMLElement;
    fontFamilies?: string[];
    isShortcutReservedForBrowser: (event: KeyboardEvent) => boolean;
    suggestMinSize: (x: number, y: number) => void;
    idle?: () => void;
    blink?: () => void;
}
