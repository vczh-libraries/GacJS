export const CHANNEL_ERROR_NAME = '!Error';

export interface NetworkPackage {
    clientId?: number;
    extraClientIds?: readonly number[];
    channelName: string;
    messageBody: string;
}

export interface ChannelMessage {
    senderClientId: number;
    channelName: string;
    messageBody: string;
}

export type ChannelClientState = 'connecting' | 'assigned' | 'stopped' | 'failed';

export type ChannelCompletion =
    | { type: 'stopped' }
    | { type: 'failed'; error: Error };

export type ChannelMessageHandler = (message: ChannelMessage) => void | Promise<void>;

export interface IChannelClient {
    readonly clientId: number | undefined;
    readonly state: ChannelClientState;
    readonly completion: Promise<ChannelCompletion>;
    connect(): Promise<void>;
    start(): Promise<void>;
    onMessage(handler: ChannelMessageHandler): () => void;
    sendToClient(receiverClientId: number, channelName: string, messageBody: string): Promise<void>;
    broadcast(channelName: string, messageBody: string, blockedReceivers?: readonly number[]): Promise<void>;
    stop(): void;
}

function parseInteger(text: string, description: string): number {
    if (!/^-?(?:0|[1-9][0-9]*)$/.test(text)) {
        throw new Error(`Invalid ${description}: ${text}`);
    }

    const value = Number(text);
    if (!Number.isSafeInteger(value)) {
        throw new Error(`Unsafe ${description}: ${text}`);
    }
    return value;
}

function validateInteger(value: number, description: string): void {
    if (!Number.isSafeInteger(value)) {
        throw new Error(`Invalid ${description}: ${String(value)}`);
    }
}

export function parseNetworkPackage(text: string): NetworkPackage {
    const firstSeparator = text.indexOf(';');
    if (firstSeparator === -1) {
        throw new Error(`Invalid network package: ${text}`);
    }

    const secondSeparator = text.indexOf(';', firstSeparator + 1);
    if (secondSeparator === -1) {
        throw new Error(`Invalid network package: ${text}`);
    }

    const ids = text.substring(0, firstSeparator);
    const parts = ids.split(',');
    const result: NetworkPackage = {
        channelName: text.substring(firstSeparator + 1, secondSeparator),
        messageBody: text.substring(secondSeparator + 1),
    };

    if (parts[0] !== '') {
        result.clientId = parseInteger(parts[0], 'network package client id');
    }

    if (parts.length > 1) {
        const extraClientIds: number[] = [];
        for (let index = 1; index < parts.length; index++) {
            if (parts[index] === '') {
                throw new Error(`Invalid network package extra client id: ${text}`);
            }
            extraClientIds.push(parseInteger(parts[index], 'network package extra client id'));
        }
        result.extraClientIds = extraClientIds;
    }

    return result;
}

export function serializeNetworkPackage(networkPackage: NetworkPackage): string {
    let ids = '';
    if (networkPackage.clientId !== undefined) {
        validateInteger(networkPackage.clientId, 'network package client id');
        ids = String(networkPackage.clientId);
    }

    if (networkPackage.extraClientIds !== undefined) {
        for (const clientId of networkPackage.extraClientIds) {
            validateInteger(clientId, 'network package extra client id');
            ids += `,${String(clientId)}`;
        }
    }

    return `${ids};${networkPackage.channelName};${networkPackage.messageBody}`;
}

export function validatePositiveClientId(clientId: number, description = 'client id'): void {
    if (!Number.isSafeInteger(clientId) || clientId <= 0) {
        throw new Error(`Invalid ${description}: ${String(clientId)}`);
    }
}

export function validateChannelName(channelName: string): void {
    if (channelName.length === 0 || channelName.includes('!') || channelName.includes(';')) {
        throw new Error(`Invalid channel name: ${channelName}`);
    }
}
