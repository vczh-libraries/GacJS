import { connectHttpServer, RemoteProtocolHttpClient } from '@gaclib-website/remote-protocol-http';
import { createRenderer, GacUIHtmlRenderer, } from '@gaclib/renderer'

export async function doSomething(): Promise<[GacUIHtmlRenderer, RemoteProtocolHttpClient]> {
    const renderer = createRenderer();
    const client = await connectHttpServer('localhost:8888', renderer.requests);
    renderer.init(client.responses, client.events);
    return [renderer, client];
}