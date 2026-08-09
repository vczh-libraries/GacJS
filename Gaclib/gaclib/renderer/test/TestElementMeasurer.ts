import { afterEach, describe, expect, it, vi } from 'vitest';
import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementHTMLMeasurer } from '../src/domRenderer/elementMeasurer';
import { VirtualDomRecord } from '../src/dom/virtualDomBuilding';

const PNG_HEADER = 'iVBORw==';

class FakeImageElement {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 0;
    naturalHeight = 0;
    decodeCalled = false;

    constructor(
        private _loads: boolean,
        width: number,
        height: number
    ) {
        this.naturalWidth = width;
        this.naturalHeight = height;
    }

    set src(_value: string) {
        queueMicrotask(() => {
            if (this._loads) {
                this.onload?.();
            } else {
                this.onerror?.();
            }
        });
    }

    decode(): Promise<void> {
        this.decodeCalled = true;
        return Promise.reject(new DOMException('Invalid image request.', 'EncodingError'));
    }
}

function requestImageMetadata(loads: boolean, width: number, height: number): {
    metadata: Promise<SCHEMA.ImageMetadata>;
    images: FakeImageElement[];
} {
    const images: FakeImageElement[] = [];
    vi.stubGlobal('document', {
        createElement: (tagName: string) => {
            if (tagName === 'img') {
                const image = new FakeImageElement(loads, width, height);
                images.push(image);
                return image as unknown as HTMLImageElement;
            }
            return {} as HTMLElement;
        }
    });

    const metadata = new Promise<SCHEMA.ImageMetadata>(resolve => {
        const responses = {
            RespondImageCreated: (id: number, response: SCHEMA.ImageMetadata) => {
                expect(id).toBe(7);
                resolve(response);
            }
        } as unknown as SCHEMA.IRemoteProtocolResponses;
        const measurer = new ElementHTMLMeasurer(responses);
        measurer.requestImageMetadata(7, {
            id: 55,
            imageData: PNG_HEADER,
            imageDataOmitted: false
        }, {} as VirtualDomRecord);
    });

    return { metadata, images };
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('ElementHTMLMeasurer image metadata', () => {
    it('waits for the matching load event instead of relying on decode', async () => {
        const { metadata, images } = requestImageMetadata(true, 32, 24);

        await expect(metadata).resolves.toEqual({
            id: 55,
            format: SCHEMA.ImageFormatType.Png,
            frames: [{ size: { x: 32, y: 24 } }]
        });
        expect(images).toHaveLength(1);
        expect(images[0].decodeCalled).toBe(false);
    });

    it('uses fallback metadata after the matching error event', async () => {
        const { metadata, images } = requestImageMetadata(false, 32, 24);

        await expect(metadata).resolves.toEqual({
            id: 55,
            format: SCHEMA.ImageFormatType.Unknown,
            frames: [{ size: { x: 1, y: 1 } }]
        });
        expect(images).toHaveLength(1);
        expect(images[0].decodeCalled).toBe(false);
    });
});
