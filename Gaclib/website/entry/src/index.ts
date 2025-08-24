import { connectHttpServer, IRemoteProtocolHttpClient } from '@gaclib-website/remote-protocol-http';
import { createHtmlRenderer, IGacUIHtmlRenderer, GacUISettings } from '@gaclib/renderer'

/**
 * Determines if a key event should be allowed to pass through to the browser
 * 
 * SYSTEMATIC APPROACH TO BROWSER KEY INTERCEPTION:
 * This function implements a whitelist approach - we block all keys by default
 * and only allow specific browser shortcuts that are either:
 * 1. Too dangerous to block (e.g., Ctrl+W could close the tab)
 * 2. Essential for user experience (e.g., F5 refresh, F11 fullscreen)
 * 3. System-level shortcuts that should work regardless of our app
 *
 * This approach ensures our application gets maximum control over keyboard input
 * while still respecting critical browser and system functionality.
 * 
 * ABOUT metaKey:
 * The metaKey property indicates whether the "meta" key was pressed during the event:
 * - On Windows: metaKey corresponds to the Windows key (⊞)
 * - On Mac: metaKey corresponds to the Command key (⌘)
 * - On Linux: metaKey typically corresponds to the Super key
 * 
 * In web development, we often check both ctrlKey and metaKey to handle cross-platform
 * keyboard shortcuts properly:
 * - Windows/Linux users expect Ctrl+C for copy
 * - Mac users expect Cmd+C for copy
 * By checking (event.ctrlKey || event.metaKey), we support both platforms.
 * 
 * CROSS-PLATFORM IOKeyInfo.ctrl MAPPING:
 * Our IOKeyInfo.ctrl field is set to true when either ctrlKey OR metaKey is pressed,
 * providing a unified interface for application logic. This means:
 * - On Windows/Linux: Ctrl+C sets IOKeyInfo.ctrl = true
 * - On Mac: Cmd+C also sets IOKeyInfo.ctrl = true
 * This allows GacUI application code to handle keyboard shortcuts consistently
 * without needing platform-specific logic.
 */
export function isShortcutReservedForBrowser(event: KeyboardEvent): boolean {
    // Allow specific browser shortcuts that users expect to work
    if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
            case 'w': // Close tab - too dangerous to block
            case 'q': // Quit browser
            case 'n': // New window
            case 'r': // Refresh (also covered by F5)
            case 't': // New tab
            case 'shift+t': // Reopen closed tab
            case 'l': // Focus address bar
            case 'd': // Bookmark
            case 'j': // Downloads
            case 'u': // View source
            case 'shift+i': // Developer tools
            case 'shift+j': // Developer console
            case 'shift+delete': // Clear browsing data
                return true;
        }
    }

    // Allow function keys that are commonly used for browser functions
    switch (event.key) {
        case 'F5': // Refresh
        case 'F11': // Fullscreen
        case 'F12': // Developer tools
            return true;
    }

    // Allow Alt+Tab (window switching) and other system shortcuts
    if (event.altKey) {
        switch (event.key) {
            case 'Tab': // Alt+Tab window switching
            case 'F4': // Alt+F4 close window
                return true;
        }
    }

    // Block all other keys to prevent browser shortcuts
    return false;
}

export async function runGacUI(settings: GacUISettings): Promise<[IGacUIHtmlRenderer, IRemoteProtocolHttpClient]> {
    const renderer = createHtmlRenderer(settings);
    const client = await connectHttpServer('http://localhost:8888', renderer.requests);
    renderer.start(client.responses, client.events);
    return [renderer, client];
}

// for elements.html
export { GacUIHtmlRendererExitError, applyBounds, applyTypedStyle, applyFeatureGates } from '@gaclib/renderer';

// for snapshots.html
export { Snapshot } from './snapshotIndex';
export { createTreeElement, readSnapshot, readFrames } from './snapshotTreeView';
export { renderUI } from './snapshotRendering';
