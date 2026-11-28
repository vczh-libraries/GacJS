import type { InjectionClipboard } from '@gaclib/remote-protocol';
import { bytesToBase64 } from './injectFileSystem';

const textType = 'text/plain';
const imageType = 'image/png';
const documentType = 'web application/x-gacui-document';

export function browserClipboardAvailable(): boolean {
    return globalThis.isSecureContext === true && typeof navigator.clipboard?.read === 'function' &&
        typeof navigator.clipboard?.write === 'function' && typeof ClipboardItem === 'function';
}

function binaryBlob(encoded: string, type: string): Blob {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    return new Blob([bytes], { type });
}

export class BrowserClipboard {
    private subscription?: { changed: (value: InjectionClipboard) => void; listeners: AbortController };
    private reads = Promise.resolve();
    private writes = Promise.resolve();
    private previous?: InjectionClipboard;

    get active(): boolean { return this.subscription !== undefined; }

    start(changed: (value: InjectionClipboard) => void): void {
        if (this.active || !browserClipboardAvailable()) return;
        const listeners = new AbortController();
        this.subscription = { changed, listeners };
        const options = { signal: listeners.signal };
        navigator.clipboard.addEventListener('clipboardchange', () => this.refresh(true), options);
        window.addEventListener('focus', () => this.refresh(false), options);
        if (!('onclipboardchange' in navigator.clipboard)) {
            const onGesture = (event: Event) => { if (event.isTrusted) this.refresh(false); };
            window.addEventListener('pointerup', onGesture, options);
            window.addEventListener('keyup', onGesture, options);
        }
        this.refresh(true);
    }

    stop(): void {
        this.subscription?.listeners.abort();
        this.subscription = undefined;
        this.previous = undefined;
    }

    private async read(): Promise<InjectionClipboard | undefined> {
        try {
            const items = await navigator.clipboard.read();
            const value: InjectionClipboard = { text: null, document: null, image: null };
            for (const item of items) {
                if (item.types.includes(textType)) value.text = await (await item.getType(textType)).text();
                if (item.types.includes(imageType)) value.image = bytesToBase64(new Uint8Array(await (await item.getType(imageType)).arrayBuffer()));
                if (item.types.includes(documentType)) value.document = bytesToBase64(new Uint8Array(await (await item.getType(documentType)).arrayBuffer()));
                if (value.text !== null || value.image !== null || value.document !== null) break;
            }
            return value;
        } catch {
            // A permission or focus failure gives no information about current contents.
            return undefined;
        }
    }

    private refresh(observedChange: boolean): void {
        const session = this.subscription;
        if (!session) return;
        // Start the read in its event or user gesture. Deliver completed reads in observation order.
        const observation = this.read();
        this.reads = this.reads.then(async () => {
            const value = await observation;
            if (!value || session !== this.subscription) return;
            if (observedChange || !this.previous || this.previous.text !== value.text ||
                this.previous.document !== value.document || this.previous.image !== value.image) {
                this.previous = value;
                session.changed(value);
            }
        });
    }

    write(value: InjectionClipboard, respond: (success: boolean) => void): void {
        const session = this.subscription;
        if (!session) { respond(false); return; }
        this.writes = this.writes.then(async () => {
            if (session !== this.subscription) return;
            let success = false;
            try {
                const formats: Record<string, Blob> = {};
                if (value.text !== null) formats[textType] = new Blob([value.text], { type: textType });
                if (value.image !== null) formats[imageType] = binaryBlob(value.image, imageType);
                if (value.document !== null && (typeof ClipboardItem.supports !== 'function' || ClipboardItem.supports(documentType))) {
                    formats[documentType] = binaryBlob(value.document, documentType.slice(4));
                }
                const types = Object.keys(formats);
                if (types.length !== 0 || value.document === null) {
                    await navigator.clipboard.write(types.length !== 0 ? [new ClipboardItem(formats)] : []);
                    success = true;
                }
            } catch { /* The Core receives the actual write result. */ }
            if (session !== this.subscription) return;
            respond(success);
            if (success && !('onclipboardchange' in navigator.clipboard)) this.refresh(false);
        });
    }
}
