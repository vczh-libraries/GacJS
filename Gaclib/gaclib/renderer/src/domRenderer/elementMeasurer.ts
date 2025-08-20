import * as SCHEMA from '@gaclib/remote-protocol';
import { getImageFormatType, getImageContentType, getImageDataUrl, getFontStyle, normalizeText } from './elementStyles';
import { IElementMeasurer, VirtualDomRecord } from '../dom/virtualDomBuilding';

export class ElementHTMLMeasurer implements IElementMeasurer {
    private _measuring: SCHEMA.ElementMeasurings = { fontHeights: [], minSizes: [], createdImages: [] };
    private _idRespondRendererEndRendering: SCHEMA.TYPES.Integer | undefined = undefined;

    private _textElementForTesting: HTMLElement = document.createElement('div');
    private _measuringSolidLabels: [SCHEMA.TYPES.Integer, SCHEMA.ElementSolidLabelMeasuringRequest][] = [];
    private _measuredFontHeights: Map<string, SCHEMA.ElementMeasuring_FontHeight> = new Map();
    private _measuredTotalSizes: Map<SCHEMA.TYPES.Integer, SCHEMA.ElementMeasuring_ElementMinSize> = new Map();

    private _imageElementForTesting: HTMLImageElement = document.createElement('img');
    private _measuringImageTasks: [SCHEMA.TYPES.Integer | undefined, SCHEMA.ImageCreation][] = [];
    private _measuringImageTasksExecuted = 0;
    private _measuringImageTasksExecuting = false;

    constructor(private _responses: SCHEMA.IRemoteProtocolResponses) {
    }

    requestMeasureSolidLabel(desc: SCHEMA.ElementDesc_SolidLabel): void {
        if (desc.measuringRequest !== null) {
            this._measuringSolidLabels.push([desc.id, desc.measuringRequest]);
        }
    }

    requestImageMetadata(id: SCHEMA.TYPES.Integer | undefined, imageCreation: SCHEMA.ImageCreation, renderingRecord: VirtualDomRecord): void {
        this._measuringImageTasks.push([id, imageCreation]);
        void this._runMeasuringImageTasks(renderingRecord);
    }

    RequestRendererEndRendering(id: number, renderingRecord: VirtualDomRecord): void {
        this._idRespondRendererEndRendering = id;
        if (this._measuringImageTasksExecuted === this._measuringImageTasks.length) {
            this._fireRespondRendererEndRendering(renderingRecord);
        }
    }

    private _measureSolidLabel(id: SCHEMA.TYPES.Integer, request: SCHEMA.ElementSolidLabelMeasuringRequest, renderingRecord: VirtualDomRecord): SCHEMA.ElementSolidLabelMeasuringRequest | undefined {
        const typedDesc = renderingRecord.elements.getDescEnsured(id);
        if (typedDesc.type !== SCHEMA.RendererType.SolidLabel) {
            throw new Error(`Element type mismatch: expected ${SCHEMA.RendererType.SolidLabel}, got ${typedDesc.type}`);
        }

        const actualRequest = typedDesc.desc.measuringRequest ?? request;
        switch (actualRequest) {
            case SCHEMA.ElementSolidLabelMeasuringRequest.FontHeight:
                {
                    const key = `${typedDesc.desc.font!.size}:${typedDesc.desc.font!.fontFamily}`;
                    if (this._measuredFontHeights.has(key)) {
                        return undefined;
                    }

                    // Set font style on the test element
                    this._textElementForTesting.style.cssText = `box-sizing: border-box; width: max-content; height: max-content; ${getFontStyle(typedDesc.desc)}`;

                    // Set a reasonable text to measure font height
                    this._textElementForTesting.textContent = 'Ag';

                    // Temporarily add to DOM to measure
                    document.body.appendChild(this._textElementForTesting);

                    // Get computed style to measure the actual height
                    const computedStyle = window.getComputedStyle(this._textElementForTesting);
                    const lineHeight = parseFloat(computedStyle.lineHeight);

                    // Remove from DOM
                    document.body.removeChild(this._textElementForTesting);

                    // Store the measurement
                    const result: SCHEMA.ElementMeasuring_FontHeight = {
                        fontFamily: typedDesc.desc.font!.fontFamily,
                        fontSize: typedDesc.desc.font!.size,
                        height: Math.round(lineHeight)
                    };
                    this._measuredFontHeights.set(key, result);
                    this._measuring.fontHeights!.push(result);
                }
                break;
            case SCHEMA.ElementSolidLabelMeasuringRequest.TotalSize:
                {
                    const virtualDom = renderingRecord.elementToDoms.get(id);

                    if (!virtualDom) {
                        return actualRequest;
                    }
                    // Set font style on the test element
                    this._textElementForTesting.style.cssText = `box-sizing: border-box; width: max-content; height: max-content; ${getFontStyle(typedDesc.desc)} white-space: ${typedDesc.desc.wrapLine ? 'pre-wrap' : 'pre'};`;

                    // Set width from virtualDom.bounds if wrapLine is enabled
                    if (typedDesc.desc.wrapLine) {
                        const width = virtualDom.bounds.x2 - virtualDom.bounds.x1;
                        this._textElementForTesting.style.width = `${width}px`;
                    }

                    // Set the text content to measure
                    this._textElementForTesting.textContent = normalizeText(typedDesc.desc);
                    if (this._textElementForTesting.textContent === '') {
                        this._textElementForTesting.textContent = ' ';
                    }

                    // Temporarily add to DOM to measure
                    document.body.appendChild(this._textElementForTesting);

                    // Get the measured size using offsetWidth/offsetHeight
                    const minSize: SCHEMA.Size = {
                        x: this._textElementForTesting.offsetWidth,
                        y: this._textElementForTesting.offsetHeight
                    };

                    // Remove from DOM
                    document.body.removeChild(this._textElementForTesting);

                    if (this._measuredTotalSizes.has(typedDesc.desc.id)) {
                        const original = this._measuredTotalSizes.get(typedDesc.desc.id)!;
                        if (original.minSize.x === minSize.x && original.minSize.y === minSize.y) {
                            return undefined;
                        }
                    }

                    const result: SCHEMA.ElementMeasuring_ElementMinSize = {
                        id: typedDesc.desc.id,
                        minSize
                    };
                    this._measuredTotalSizes.set(typedDesc.desc.id, result);
                    this._measuring.minSizes!.push(result);
                }
                break;
        }
        return undefined;
    }

    private _fireRespondRendererEndRendering(renderingRecord: VirtualDomRecord): void {
        if (this._idRespondRendererEndRendering !== undefined) {
            const remaining: [SCHEMA.TYPES.Integer, SCHEMA.ElementSolidLabelMeasuringRequest][] = [];
            for (const [id, request] of this._measuringSolidLabels) {
                const nextRequest = this._measureSolidLabel(id, request, renderingRecord);
                if (nextRequest !== undefined) {
                    remaining.push([id, nextRequest]);
                }
            }
            this._measuringSolidLabels = remaining;

            this._responses.RespondRendererEndRendering(this._idRespondRendererEndRendering, this._measuring);
            this._measuring = { fontHeights: [], minSizes: [], createdImages: [] };
            this._idRespondRendererEndRendering = undefined;
        }
    }

    private async _runMeasuringImageTasks(renderingRecord: VirtualDomRecord): Promise<void> {
        if (this._measuringImageTasksExecuting) {
            return;
        }
        this._measuringImageTasksExecuting = true;
        while (this._measuringImageTasksExecuted < this._measuringImageTasks.length) {
            const [id, imageCreation] = this._measuringImageTasks[this._measuringImageTasksExecuted++];
            const formatType = getImageFormatType(imageCreation.imageData);
            const contentType = getImageContentType(formatType);
            const imageUrl = getImageDataUrl(contentType, imageCreation.imageData);

            // Set the source and wait for the image to load
            this._imageElementForTesting.src = imageUrl;
            let imageMetadata: SCHEMA.ImageMetadata;
            try {
                await this._imageElementForTesting.decode();
                imageMetadata = {
                    id: imageCreation.id,
                    format: formatType,
                    frames: [{
                        size: {
                            x: this._imageElementForTesting.naturalWidth,
                            y: this._imageElementForTesting.naturalHeight
                        }
                    }]
                };
            } catch (error) {
                if (error instanceof DOMException) {
                    imageMetadata = {
                        id: imageCreation.id,
                        format: SCHEMA.ImageFormatType.Unknown,
                        frames: [{ size: { x: 1, y: 1 } }]
                    };
                } else {
                    throw error;
                }
            }

            // Submit metadata
            if (id === undefined) {
                this._measuring.createdImages!.push(imageMetadata);
            } else {
                this._responses.RespondImageCreated(id, imageMetadata);
            }
        }
        this._fireRespondRendererEndRendering(renderingRecord);

        this._measuringImageTasksExecuting = false;
        this._measuringImageTasks = [];
        this._measuringImageTasksExecuted = 0;
    }
}