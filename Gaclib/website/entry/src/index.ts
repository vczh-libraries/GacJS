import { connectHttpServer, IRemoteProtocolHttpClient } from '@gaclib-website/remote-protocol-http';
import { createRenderer, generateFontConfig, IGacUIHtmlRenderer, } from '@gaclib/renderer'

export async function runGacUI(target: HTMLElement): Promise<[IGacUIHtmlRenderer, IRemoteProtocolHttpClient]> {
    const renderer = createRenderer({
        width: target.clientWidth,
        height: target.clientHeight,
        target,
        fontConfig: generateFontConfig(target),
    });
    const client = await connectHttpServer('http://localhost:8888', renderer.requests);
    renderer.init(client.responses, client.events);
    return [renderer, client];
}

// for testing in elements.html
export { applyTypedStyle, } from '@gaclib/renderer';