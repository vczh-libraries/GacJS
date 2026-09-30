import { IRemoteProtocolClient } from '@gaclib-website/remote-protocol-http';
import { connectWasmServer, WasmApplication } from '@gaclib-website/remote-protocol-wasm';
import { RvmHostSession, startRvmHostWithChannel, RVM_CHANNEL_NAME, RVM_READY_CHANNEL_NAME } from '@gaclib-website/rvmhost';
import { createHtmlRenderer, GacUIHtmlRendererExitError, GacUISettings, IGacUIRenderer } from '@gaclib/renderer';
import { isShortcutReservedForBrowser } from './index.js';

interface WasmSession {
    application: WasmApplication;
    renderer?: IGacUIRenderer;
    client?: IRemoteProtocolClient;
    host?: RvmHostSession;
}

declare global {
    interface Window {
        __gacui_wasm_session?: WasmSession;
        __gacui_playwright_idle?: () => void;
        __gacui_playwright_blink?: () => void;
    }
}

const screen = document.getElementById('gacui-screen') as HTMLElement;
const buttons = Array.from(document.querySelectorAll('button'));
const settings: GacUISettings = {
    target: screen,
    isShortcutReservedForBrowser,
    suggestMinSize(x, y): void {
        screen.style.width = `clamp(${String(Math.max(x, 320))}px, calc(100vw - 40px), 1280px)`;
        screen.style.height = `clamp(${String(Math.max(y, 240))}px, calc(100vh - 80px), 960px)`;
    },
    idle: () => { window.__gacui_playwright_idle?.(); },
    blink: () => { window.__gacui_playwright_blink?.(); },
};
screen.addEventListener('contextmenu', event => { event.preventDefault(); });
settings.suggestMinSize?.(0, 0);
screen.focus();

function showMask(success: boolean, message: string): void {
    const kind = success ? 'success' : 'error';
    const mask = document.getElementById(`gacui-${kind}-mask`) as HTMLElement;
    const label = document.getElementById(`gacui-${kind}-message`) as HTMLElement;
    label.textContent = message;
    screen.append(mask);
    mask.classList.add('visible');
    for (const button of buttons) button.disabled = true;
}

async function main(): Promise<void> {
    if (!globalThis.crossOriginIsolated) throw new Error('Serve this page with COOP/COEP headers using npm run start.');
    const application = new WasmApplication({
        moduleUrl: new URL('./app.mjs', location.href),
        workerUrl: new URL('/wasm-worker.js', location.href),
    });
    const session: WasmSession = { application };
    window.__gacui_wasm_session = session;
    window.addEventListener('pagehide', () => { application.stop(); }, { once: true });
    let generation = 0;

    const runRenderer = async (): Promise<void> => {
        const current = ++generation;
        session.renderer?.stop();
        screen.replaceChildren();
        const renderer = createHtmlRenderer(settings);
        const client = await connectWasmServer(application, renderer.requests);
        session.renderer = renderer;
        session.client = client;
        renderer.start(client.responses, client.events);
        screen.focus();
        for (const button of buttons) button.disabled = false;
        try {
            await client.start();
            if (current !== generation) return;
            const result = await application.completion;
            if (result !== 0) throw new Error(`Wasm application exited with code ${String(result)}.`);
            showMask(true, 'GacUI core stopped.');
        } catch (error) {
            if (current !== generation) return;
            if (!(error instanceof GacUIHtmlRendererExitError)) {
                application.stop();
                throw error;
            }
            // Keep RPC alive during normal finalization, including release of the held service.
            await application.completion;
            showMask(true, error.message);
        } finally {
            client.stop();
            renderer.stop();
        }
    };

    const reportError = (error: unknown): void => {
        const message = error instanceof Error ? error.message : String(error);
        showMask(false, message);
        application.stop();
        throw error;
    };

    (document.getElementById('gacui-exit') as HTMLButtonElement).onclick = () => { session.renderer?.requestStopToCore(false); };
    (document.getElementById('gacui-force-exit') as HTMLButtonElement).onclick = () => { session.renderer?.requestStopToCore(true); };
    (document.getElementById('gacui-replace') as HTMLButtonElement).onclick = () => { void runRenderer().catch(reportError); };

    try {
        await application.ready;
        if (document.body.dataset.app === 'rvmt') {
            const channel = application.createChannel([RVM_CHANNEL_NAME, RVM_READY_CHANNEL_NAME]);
            await channel.connect();
            // This browser TypeScript host implements IViewModel.Translate using the generated x86 RPC binding.
            session.host = startRvmHostWithChannel(channel);
            await session.host.startup;
            await session.host.serviceHeld;
        }
        await runRenderer();
    } catch (error) {
        reportError(error);
    }
}

void main().catch(error => {
    showMask(false, error instanceof Error ? error.message : String(error));
    throw error;
});
