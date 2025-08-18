import * as SCHEMA from '@gaclib/remote-protocol';
import { GacUIHtmlRendererImpl } from './GacUIHtmlRendererImpl';
import { GacUISettings, IGacUIHtmlRenderer } from './interfaces';

export function generateFontConfig(target: HTMLElement): SCHEMA.FontConfig {
    const styles = window.getComputedStyle(target);

    const defaultFont: SCHEMA.FontProperties = {
        fontFamily: styles.fontFamily,
        size: 12,
        bold: false,
        italic: false,
        underline: false,
        strikeline: false,
        antialias: false,
        verticalAntialias: false,
    };
    return {
        defaultFont,
        supportedFonts: [defaultFont.fontFamily],
    };
}

export function createRenderer(settings: GacUISettings): IGacUIHtmlRenderer {
    return new GacUIHtmlRendererImpl(settings);
}

export * from './interfaces';
export * from './featureGates';
export * from './GacUIHtmlRendererImpl';
export * from './domRenderer/elementStyles';
export * from './domRenderer/virtualDomRenderer';