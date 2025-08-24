import { connectHttpServer, IRemoteProtocolHttpClient } from '@gaclib-website/remote-protocol-http';
import { createRenderer, IGacUIHtmlRenderer, ElementHTMLMeasurer, VirtualDomHtmlProvider, GacUISettings } from '@gaclib/renderer'

export async function runGacUI(settings: GacUISettings): Promise<[IGacUIHtmlRenderer, IRemoteProtocolHttpClient]> {
    const renderer = createRenderer(settings);
    const client = await connectHttpServer('http://localhost:8888', renderer.requests);
    const provider = new VirtualDomHtmlProvider();
    const measurer = new ElementHTMLMeasurer(client.responses);
    renderer.init(client.responses, client.events, provider, measurer);
    return [renderer, client];
}

// for elements.html
export { GacUIHtmlRendererExitError, applyBounds, applyTypedStyle, applyFeatureGates } from '@gaclib/renderer';

// for snapshots.html
export { Snapshot } from './snapshotIndex';
export { createTreeElement, readSnapshot, readFrames } from './snapshotTreeView';
export { renderUI } from './snapshotRendering';