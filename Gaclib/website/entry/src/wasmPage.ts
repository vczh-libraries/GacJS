import { GACUI_REMOTE_PROTOCOL_CHANNEL_NAME, IRemoteProtocolClient } from '@gaclib-website/remote-protocol-http';
import { connectWasmServer, WasmApplication } from '@gaclib-website/remote-protocol-wasm';
import { RvmHostSession, startRvmHostWithChannel, RVM_CHANNEL_NAME, RVM_READY_CHANNEL_NAME } from '@gaclib-website/rvmhost';
import { createHtmlRenderer, GacUIHtmlRendererExitError, GacUISettings, IGacUIRenderer } from '@gaclib/renderer';
import { isShortcutReservedForBrowser } from '@gaclib/renderer';

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

export type WasmRendererSetup = (renderer: IGacUIRenderer) => (() => void) | void;

/** Runs one page-owned application; setup runs before renderer protocol delivery. */
export async function startWasmPage(setupRenderer?: WasmRendererSetup): Promise<void> {
    const screen = document.getElementById('gacui-screen') as HTMLElement;
    const buttons = Array.from(document.querySelectorAll('button'));
    const reload = document.getElementById('gacui-reload') as HTMLButtonElement;
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

    const showMask = (success: boolean, message: string): void => {
        const kind = success ? 'success' : 'error';
        const mask = document.getElementById(`gacui-${kind}-mask`) as HTMLElement;
        const label = document.getElementById(`gacui-${kind}-message`) as HTMLElement;
        label.textContent = message;
        screen.append(mask);
        mask.classList.add('visible');
        for (const button of buttons) button.disabled = true;
        reload.disabled = !success;
    };

    let session: WasmSession | undefined;
    let disposeSetup: (() => void) | undefined;
    let rendererStarted = false;
    let rendererStopped = false;
    let applicationStopped = false;
    let hostStopped = false;
    let pageHidden = false;
    const cleanupSetup = (): void => {
        const cleanup = disposeSetup;
        disposeSetup = undefined;
        cleanup?.();
    };
    const stopRenderer = (): void => {
        cleanupSetup();
        if (rendererStopped) return;
        rendererStopped = true;
        session?.client?.stop();
        if (rendererStarted) session?.renderer?.stop();
    };
    const stopApplication = (): void => {
        if (applicationStopped || session === undefined) return;
        applicationStopped = true;
        session.application.stop();
    };
    const stopHost = (): void => {
        if (hostStopped || session?.host === undefined) return;
        hostStopped = true;
        session.host.stop();
    };
    const onPageHide = (): void => {
        pageHidden = true;
        stopRenderer();
        stopApplication();
        stopHost();
    };
    window.addEventListener('pagehide', onPageHide, { once: true });

    try {
        if (!globalThis.crossOriginIsolated) throw new Error('Serve this page with COOP/COEP headers using npm run start.');
        const hasViewModel = document.body.dataset.app === 'rvmt';
        const application = new WasmApplication({
            moduleUrl: new URL('./app.mjs', location.href),
            workerUrl: new URL('/wasm-worker.js', location.href),
            channels: [
                [GACUI_REMOTE_PROTOCOL_CHANNEL_NAME],
                ...(hasViewModel ? [[RVM_CHANNEL_NAME, RVM_READY_CHANNEL_NAME]] : []),
            ],
        });
        session = { application };
        window.__gacui_wasm_session = session;

        (document.getElementById('gacui-exit') as HTMLButtonElement).onclick = () => { session?.renderer?.requestStopToCore(false); };
        (document.getElementById('gacui-force-exit') as HTMLButtonElement).onclick = () => { session?.renderer?.requestStopToCore(true); };
        reload.onclick = () => {
            reload.disabled = true;
            location.reload();
        };

        await application.ready;
        if (pageHidden) return;
        if (hasViewModel) {
            const channel = application.channels[1];
            await channel.connect();
            if (pageHidden) return;
            // Keep the host alive through Core's service release and application completion.
            session.host = startRvmHostWithChannel(channel);
            await session.host.startup;
            if (pageHidden) return;
            await session.host.serviceHeld;
        }
        if (pageHidden) return;
        screen.replaceChildren();
        const renderer = createHtmlRenderer(settings);
        session.renderer = renderer;
        disposeSetup = setupRenderer?.(renderer) ?? undefined;
        const client = await connectWasmServer(application, renderer.requests);
        session.client = client;
        if (pageHidden) {
            client.stop();
            return;
        }
        renderer.start(client.responses, client.events);
        rendererStarted = true;
        screen.focus();
        for (const button of buttons) button.disabled = button === reload;
        try {
            await client.start();
        } catch (error) {
            if (!(error instanceof GacUIHtmlRendererExitError)) throw error;
        }
        const result = await application.completion;
        if (result !== 0) throw new Error(`Wasm application exited with code ${String(result)}.`);
        if (!pageHidden) showMask(true, 'GacUI core stopped.');
    } catch (error) {
        stopApplication();
        if (!pageHidden) {
            showMask(false, error instanceof Error ? error.message : String(error));
            throw error;
        }
    } finally {
        stopRenderer();
        stopHost();
        window.removeEventListener('pagehide', onPageHide);
    }
}
