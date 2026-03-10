import * as SCHEMA from '@gaclib/remote-protocol';

/**********************************************************************
 * ImageFrame
 **********************************************************************/

export function getImageFormatType(imageData: string): SCHEMA.ImageFormatType {
    const bin = atob(imageData);
    if (bin.substring(0, 2) === 'BM') {
        return SCHEMA.ImageFormatType.Bmp;
    } else if (bin.substring(0, 6) === 'GIF87a' || bin.substring(0, 6) === 'GIF89a') {
        return SCHEMA.ImageFormatType.Gif;
    } else if (bin.substring(0, 4) === '\x89PNG') {
        return SCHEMA.ImageFormatType.Png;
    } else if (bin.substring(0, 2) === 'II' || bin.substring(0, 2) === 'MM') {
        return SCHEMA.ImageFormatType.Tiff;
    } else if (bin.substring(0, 2) === '\xFF\xD8') {
        return SCHEMA.ImageFormatType.Jpeg;
    } else if (bin.substring(0, 4) === '\x00\x00\x01\x00' || bin.substring(0, 4) === '\x00\x00\x02\x00') {
        return SCHEMA.ImageFormatType.Icon;
    } else {
        return SCHEMA.ImageFormatType.Unknown;
    }
}

export function getImageContentType(type: SCHEMA.ImageFormatType): string {
    switch (type) {
        case SCHEMA.ImageFormatType.Bmp:
            return 'image/bmp';
        case SCHEMA.ImageFormatType.Gif:
            return 'image/gif';
        case SCHEMA.ImageFormatType.Png:
            return 'image/png';
        case SCHEMA.ImageFormatType.Tiff:
            return 'image/tiff';
        case SCHEMA.ImageFormatType.Jpeg:
            return 'image/jpeg';
        case SCHEMA.ImageFormatType.Icon:
            return 'image/vnd.microsoft.icon';
        default:
            throw new Error('Unsupported image format');
    }
}

export function getImageDataUrl(contentType: string, imageData: string): string {
    return `data:${contentType};base64,${imageData}`;
}

export function getImageUrl(contentType: string, imageData: string): string {
    return `url(${getImageDataUrl(contentType, imageData)})`;
}

export function getStyle_ImageFrame(desc: SCHEMA.ElementDesc_ImageFrame): string {
    if (desc.imageId === null) {
        return '';
    }
    if (desc.imageCreation === null) {
        throw new Error('getStyle_ImageFrame requires ElementDesc_ImageFrame.imageCreation to exist.');
    }
    if (desc.imageCreation.imageDataOmitted) {
        throw new Error('getStyle_ImageFrame requires ElementDesc_ImageFrame.imageCreation.imageDataOmitted to be false.');
    }

    let positionStyle: string;
    if (desc.stretch) {
        positionStyle = `background-repeat: no-repeat; background-origin: border-box; background-size: 100% 100%;`;
    } else {
        positionStyle = `background-position-x: ${desc.horizontalAlignment.toLowerCase()}; background-position-y: ${desc.verticalAlignment.toLowerCase()}; background-repeat: no-repeat;`;
    }

    let filterStyle = '';
    if (desc.enabled === false) {
        filterStyle = `filter: grayscale(100%);`;
    }

    const imageStyle = `background-image: ${getImageUrl(getImageContentType(getImageFormatType(desc.imageCreation.imageData)), desc.imageCreation.imageData)};`;
    return `${imageStyle} ${positionStyle} ${filterStyle}`;
}
