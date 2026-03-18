# Testing with the C++ Test Server and Playwright

This document describes how to build, run, and test against the C++ `RemotingTest_Core`
HTTP server, and how to use Playwright to automate browser-based testing of `index.html`.

Throughout this document, **REPO-ROOT** refers to the root of the GacUI repository
(the `GacUI` submodule folder).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Building the C++ Server](#building-the-c-server)
- [Running the C++ Server](#running-the-c-server)
- [Hosting the Website](#hosting-the-website)
- [Manual Testing](#manual-testing)
- [Automated Testing with Playwright](#automated-testing-with-playwright)
- [PowerShell Scripts](#powershell-scripts)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────┐     HTTP (port 8888)     ┌──────────────────────────┐
│  Browser (index.html)   │ ◄──────────────────────► │  RemotingTest_Core.exe   │
│  served on port 8896    │   Remote Protocol JSON    │  C++ GacUI application   │
│  (static file server)   │                           │  /Http mode              │
└─────────────────────────┘                           └──────────────────────────┘
```

| Component | Port | Purpose |
|-----------|------|---------|
| `RemotingTest_Core.exe /Http` | 8888 | GacUI remote protocol API server (JSON/HTTP) |
| Static file server | 8896 (or any) | Serves `index.html`, `index.js`, CSS, etc. |

The C++ server is **not** a static file server. It only serves three API endpoints:
- `GET /GacUIRemoting/Connect` — client handshake, returns unique session URLs
- `POST /GacUIRemoting/Request/{GUID}` — long-poll for core-to-client messages
- `POST /GacUIRemoting/Response/{GUID}` — client-to-core events/responses

The JavaScript client (`index.ts`) connects to `http://localhost:8888` (hardcoded).

---

## Prerequisites

1. **Visual Studio 2022** (or later) with C++ desktop development workload.
   - The project uses platform toolset `v145` and C++20.
   - The `VLPP_VSDEVCMD_PATH` environment variable must point to `VsDevCmd.bat`,
     e.g. `C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat`.
2. **Node.js + Yarn** for building the TypeScript/website code.
3. **Playwright** (installed with this repo via `@playwright/test`).

---

## Building the C++ Server

The `RemotingTest_Core` project is part of the `GacUISrc.sln` solution in the GacUI repo.

### Using copilotBuild.ps1

The GacUI repo provides `REPO-ROOT\.github\Scripts\copilotBuild.ps1` for building.
Follow the guidelines in `REPO-ROOT\.github\Guidelines\Building.md`.

```powershell
cd REPO-ROOT\Test\GacUISrc
& REPO-ROOT\.github\Scripts\copilotBuild.ps1
```

This builds in **Debug x64** by default. Pass `-Configuration` and `-Platform` to override.
The build log is saved to `REPO-ROOT\.github\Scripts\Build.log`.

### Using Visual Studio IDE

1. Open `REPO-ROOT\Test\GacUISrc\GacUISrc.sln`
2. Set Solution Configuration to **Debug** and Platform to **x64**
3. Right-click `RemotingTest_Core` → Build

### Output Location

The built executable is at:
```
REPO-ROOT\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe
```

---

## Running the C++ Server

The server **blocks the terminal**, so always launch it with `start`:

```powershell
start REPO-ROOT\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /Http
```

The server prints:
```
> HTTP server created, waiting on: localhost:8888
```

**Important notes:**
- The process blocks until the UI exits or the connection is terminated.
- Always use `start` so it runs in a separate window.
- Only one client connection is active at a time. Opening `index.html` again takes over.
- The server uses Windows HTTP Server API (`http.sys`), which may require admin privileges
  on first run to register the URL reservation.

### Stopping the Server

Kill the process:
```powershell
Stop-Process -Name "RemotingTest_Core" -Force -ErrorAction SilentlyContinue
```

Or from the browser:
- Click the **Exit** button on `index.html`
- Click the **Force Exit** button (immediate shutdown)
- Navigate to the Exit tab in the GacUI UI and click a close button

---

## Hosting the Website

### After `yarn build`

After running `yarn build` in the `Gaclib` directory, the built website files are at:
```
Gaclib\website\entry\lib\dist\
```

The CLAUDE.md says the website is accessible at `localhost:8896` automatically.
If not, host the files yourself:

```powershell
# Option 1: Using npx serve
cd Gaclib\website\entry\lib\dist
npx serve -l 8896

# Option 2: Using Python
cd Gaclib\website\entry\lib\dist
python -m http.server 8896

# Option 3: VS Code Live Server extension pointed at lib\dist\
```

**IMPORTANT:** The root folder MUST be `lib\dist\` — HTML files reference `/index.js`
which is in the dist root.

---

## Manual Testing

### Testing the Remote Protocol (index.html)

1. Build the TypeScript code: `cd Gaclib; yarn build`
2. Start the C++ server: `start RemotingTest_Core.exe /Http`
3. Start the static file server (if not already running)
4. Open `http://localhost:8896/index.html`
5. The GacUI application UI renders in the browser

**What to test:**
- Window renders with the FullControlTest UI (tabs: List, Control, Misc, etc.)
- Click interactions work (tab switching, button clicks)
- Keyboard input works
- Navigate to **Control > Document Editor Ribbon** tab for rich text
- Type, select, format text
- Verify caret movement with arrow keys

### Testing DocumentParagraph Specifically

1. Navigate to **Control > Document Editor Ribbon** or **Document Editor Toolstrip** tab.
2. The document editor contains rich text with:
   - Styled text (bold, italic, colored)
   - Inline objects (embedded elements)
   - Multiple paragraphs
3. Test operations:
   - Click to place caret → `OpenCaret` → `GetCaretBounds`
   - Drag to select → rapid `UpdateElement_DocumentParagraph` with style changes
   - Arrow keys → `GetCaret` with various `CaretRelativePosition` values
   - Ctrl+A → `GetCaret(CaretFirst)` + `GetCaret(CaretLast)` for full selection

### The Main Window

The main window is defined in `GacUI/Test/Resources/App/FullControlTest/Resource.xml`.
It contains:
- **List tab**: TextList, ListView, TreeView, DataGrid
- **Refresh List tab**: Refreshable variants of list controls
- **Layout tab**: Repeat, Responsive layouts
- **Control tab**: Document Editor (Ribbon), Document Editor (Toolstrip), TextBox
- **Misc tab**: Elements, Animation, Localization, Date Picker
- **Window Manager tab**: Sub-window management
- **Exit tab**: Various exit methods

---

## Automated Testing with Playwright

### Setup

Playwright is installed with this repo. Install browsers if needed:

```powershell
npx playwright install chromium
```

### Test File Structure

All protocol tests live under `Gaclib/website/entry/test/`:

- `Testing_Protocol.js` — Shared utilities and vitest lifecycle (`setupProtocolTest`,
  DOM helpers, click helpers, path constants).
- `Testing_Protocol_SimpleTyping.js` — Basic UI rendering and keyboard input test.
- `Testing_Protocol_Caret.js` — Caret rendering, blinking, and positioning test.
- `Testing_Protocol_Caret2.js` — Cursor style after tab switch, caret blinking after tab switch,
  and end-of-line caret positioning test.
- `Testing_Protocol_Font.js` — Font/color formatting and incremental selection test.
- `Testing_Protocol_ImageInText.js` — Inline image insertion and rendering test.
- `Testing_Protocol_RendererSwitching.js` — Renderer switching (reconnection) test.

Each test file is a vitest suite. Most use `setupProtocolTest()` from the shared
module, which registers `beforeAll`/`afterAll` hooks to start/stop the C++ server
and launch/close the headless Chromium browser. `Testing_Protocol_RendererSwitching.js`
manages its own lifecycle because it opens multiple pages in the same browser context.

### Example Test Structure

```javascript
import { describe, test, expect } from 'vitest';
import {
    sleep,
    getLeafTextPositions,
    clickAt,
    setupProtocolTest
} from './Testing_Protocol.js';

describe('MyTest', () => {
    const ctx = setupProtocolTest();

    test('Step 1: Page rendering', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        expect(positions.length).toBeGreaterThanOrEqual(20);
    });

    test('Step 2: Interact with UI', async () => {
        // Click, type, verify using ctx.page ...
    });
});
```

### Running Tests

```powershell
cd Gaclib
yarn test
```

This runs all vitest suites across all packages, including the protocol tests.
Test files run sequentially (`fileParallelism: false`) since they share the
same stateful HTTP server.

### Important Playwright Notes

- `index.html` expects the C++ server on `localhost:8888` — this is hardcoded.
- Only one browser connection is active at a time — previous connections lose state.
- If the C++ server crashes (which happens on unhandled protocol errors), restart it.
- Use `page.waitForTimeout()` sparingly — prefer `page.waitForSelector()` or
  `page.waitForFunction()` for reliable synchronization.
- Take screenshots for visual comparison: `await page.screenshot({ path: 'test.png' })`.

---

## PowerShell Scripts

Two PowerShell scripts are provided for convenience:

### `scripts/start-test-server.ps1`

Builds (if needed) and starts the C++ HTTP test server.

### `scripts/stop-test-server.ps1`

Kills the `RemotingTest_Core.exe` process.

See the scripts in the `scripts/` directory for details.

---

## Troubleshooting

### Server won't start / Access denied

The Windows HTTP Server API requires URL reservation. Run once as Administrator:
```powershell
netsh http add urlacl url=http://localhost:8888/ user=Everyone
```

### "Fatal Error" on index.html

The server encountered an unhandled protocol error. Check the C++ server console
for the error message.

### Connection drops / No response

- Ensure only one `index.html` tab is open.
- Close all tabs, kill the server, restart, reopen `index.html`.
- Check that port 8888 is not in use by another process:
  `netstat -ano | findstr :8888`

### Website doesn't load

- Verify `yarn build` completed successfully.
- Check that the static file server is running on the expected port.
- Verify `lib/dist/index.js` exists after build.

### Playwright can't find elements

- GacUI renders dynamically — use longer timeouts for initial load.
- The DOM structure is deeply nested `<div>` elements — use broad selectors.
- Check `page.content()` to see what's actually rendered.

---

## Test Scripts

**Prerequisites:**
- `yarn build` in `Gaclib/`
- `RemotingTest_Core.exe` built (via `scripts/start-test-server.ps1` or Visual Studio)
- `npx playwright install chromium` (first time only)

**Crash detection:**
`index.html` calls `alert(error.message)` when any exception occurs during the
remote protocol session. In Playwright, this triggers a `dialog` event. The test
script listens for this event via `page.on('dialog', ...)` and logs the dialog
message as `[CRASH]`. If a dialog appears, it means a JavaScript error was thrown
and the test will report a failure. When debugging manually, you can also inject
`throw new Error('UNIQUE_WORD')` in the TypeScript source to locate where an error
occurs — the browser will show an alert with the error message, and Playwright will
capture it via the dialog event.

### Testing_Protocol_SimpleTyping.js

A vitest suite that verifies basic UI rendering and interaction with the GacUI
remote protocol. Located at `Gaclib/website/entry/test/Testing_Protocol_SimpleTyping.js`.

**Run:**
```powershell
cd Gaclib
yarn test
```

**The goal of the test plan cannot be changed.** The test must:

1. Launch the application (start the C++ server, open `index.html` in Playwright).
2. Open the "Control" tab, find the text box next to the "Search:" label.
3. Type text into the text box. Typing is implemented by sending IOChar messages.
   The client sends IOChar events and the core side judges which text box is active.
4. Verify that the typed text appears in the text box.
5. Kill the process directly and close the webpage. No elegant exit is needed.

### Testing_Protocol_Font.js

A vitest suite that verifies font/color formatting and incremental selection
rendering in the GacUI rich-text document editor. Located at
`Gaclib/website/entry/test/Testing_Protocol_Font.js`.

**Run:**
```powershell
cd Gaclib
yarn test
```

**The goal of the test plan cannot be changed.** The test must:

1. Launch the application (start the C++ server, open `index.html` in Playwright).
2. Open the "Control" tab, click the rich-text document editor (the large area at the
   bottom).
3. Type `ABCDEFGHIJKLMN` into the editor.
4. Select the range `C..K` (characters C through K). Open the font dialog from the
   toolbar. **[VERIFY]** The first font name in the font list is not quoted (no `"`
   around it). Select the only available font, pick a bigger text size so the OK button
   becomes enabled, then click OK.
5. Select the range `H..M`. Open the text-color dialog from the toolbar (not the
   background-color button), change the first of the three text boxes to `0`, then
   click OK.
6. **[VERIFY]** Confirm that `C..K` renders at a bigger font size and `H..M` renders
   with color `#00FFFF`.
7. Click the rich editor again and press Home so the cursor jumps to position 0.
   **[VERIFY]** Same size/color checks as step 6.
8. Press Shift+Right 14 times. After each keypress:
   **[VERIFY]** The selected text turns white; in the non-selected region, `C..K` still
   has a bigger size and `H..M` still has color `#00FFFF`.
9. Kill the process directly and close the webpage. No elegant exit is needed.

### Testing_Protocol_ImageInText.js

A vitest suite that verifies inline image insertion and rendering in the GacUI
rich-text document editor. Located at
`Gaclib/website/entry/test/Testing_Protocol_ImageInText.js`.

**Run:**
```powershell
cd Gaclib
yarn test
```

**The goal of the test plan cannot be changed.** The test must:

1. Launch the application (start the C++ server, open `index.html` in Playwright).
2. Open the "Control" tab, click the rich-text document editor (the large area at the
   bottom).
3. Type `ABC` into the editor.
4. Click the "Insert" tab in the ribbon, then click the "Insert Image" button. A file
   dialog opens with two lists and a text box at the bottom. Double-click `C:` on the
   right list to navigate into the `C:` drive. Then click the text box, type
   `5900.png`, then click OK. An image is inserted after `ABC` on the same line.
5. Press Home, then type `X`.
   **[VERIFY]** The content is `XABC` followed by an inline image that is visible.
6. Press Ctrl+A to select all content.
   **[VERIFY]** The content is `XABC` followed by an inline image, and the image has a
   visible selection indicator (background overlay).
7. Kill the process directly and close the webpage. No elegant exit is needed.

### Testing_Protocol_Caret2.js

A vitest suite that verifies cursor style preservation after tab switching, caret
blinking after tab switching, and end-of-line caret positioning. Located at
`Gaclib/website/entry/test/Testing_Protocol_Caret2.js`.

**Run:**
```powershell
cd Gaclib
yarn test
```

**The goal of the test plan cannot be changed.** The test must:

1. Launch the application (start the C++ server, open `index.html` in Playwright).
2. Open the "Control" tab. Click the text box next to "Search:" so the caret
   becomes active. Type "Hello" into the text box.
3. Switch to the "List" tab, wait, then switch back to the "Control" tab.
   **[VERIFY]** The cursor CSS on the text box area is `text` (IBeam), not `default`.
4. Click the text box again.
   **[VERIFY]** A caret is visible. Wait 0.6 seconds.
   **[VERIFY]** The caret blinks off. Wait 0.6 seconds.
   **[VERIFY]** The caret blinks on again.
5. Click the rich-text document editor. Type `ABCDEF`.
6. Press Home to move the caret to position 0.
   **[VERIFY]** The caret is at the leftmost position of the text.
7. Press End to move the caret to the end of the line.
   **[VERIFY]** The caret is at the rightmost position (after the last character),
   not before the last character. The End-key caret position matches the position
   reached by pressing Right arrow 6 times from Home.
8. Press Home, then click with the mouse to the right of the last character.
   **[VERIFY]** The caret jumps to the end of the line (same position as End key),
   not before the last character.
9. Kill the process directly and close the webpage. No elegant exit is needed.

### Testing_Protocol_RendererSwitching.js

A vitest suite that verifies renderer switching (reconnection). When a new browser
tab opens `index.html`, it connects to the C++ server, taking over the session from
any previous tab. The new tab should see the same UI state (typed text, selection,
etc.). Located at `Gaclib/website/entry/test/Testing_Protocol_RendererSwitching.js`.

This test does **not** use `setupProtocolTest()` — it manages its own browser context
(multiple pages in the same context) and server lifecycle.

**Run:**
```powershell
cd Gaclib
yarn test
```

**The goal of the test plan cannot be changed.** The test must:

1. Launch the application (start the C++ server, open `index.html` in Playwright).
2. Open the "Control" tab, find the text box next to the "Search:" label.
3. Type "Hello" into the text box.
4. Open a second browser tab with `index.html` (renderer switching).
   The second tab should take over and display the same UI state.
5. Verify the second tab renders and contains the typed text "Hello".
6. Select part of the text in the text box.
7. Open a third browser tab with `index.html` (another renderer switch).
8. Verify the third tab renders and contains the typed text with selection.
9. Kill the process directly and close all webpages. No elegant exit is needed.

### Testing_Protocol_Caret.js

A vitest suite that verifies caret rendering, blinking, positioning, and size
in the GacUI rich-text document editor and text boxes. Located at
`Gaclib/website/entry/test/Testing_Protocol_Caret.js`.

**Run:**
```powershell
cd Gaclib
yarn test
```

**The goal of the test plan cannot be changed.** The test must:

1. Launch the application (start the C++ server, open `index.html` in Playwright).
2. Open the "Control" tab. Click the text box next to the "Search:" label so the
   text box caret becomes active.
   **[VERIFY]** A caret is visible in the Search text box.
3. Click the rich-text document editor (the large area at the bottom).
   **[VERIFY]** The caret in the Search text box disappears, and a caret appears
   in the rich-text editor.
4. Test caret blinking: after the caret is shown in the rich-text editor, wait 0.6
   seconds.
   **[VERIFY]** The caret is now invisible (blinked off). Wait another 0.6 seconds.
   **[VERIFY]** The caret is now visible again (blinked on).
5. Type `ABCD` into the editor.
6. Select `BC` (press Home, Right 1, Shift+Right 2). Open the font dialog from the
   toolbar, select the only available font, pick a bigger text size (24), then click
   OK.
7. Press Home so the caret is at position 0 (before `A`). Then press Right 4 times
   to reach the end. After each Right press (5 caret positions total: before A,
   after A, after B, after C, after D):
   **[VERIFY]** The caret is visible (OpenCaret resets blink). The 3rd position
   (after B) and 4th position (after C) have a taller caret matching the bigger
   font size. The 1st, 2nd, and 5th positions have a shorter (default-size) caret.
8. Press Left 4 times back to position 0. After each Left press (4 positions:
   before D, before C, before B, before A):
   **[VERIFY]** The caret is visible. The 2nd position (before C) and 3rd position
   (before B) have a taller caret. The 1st and 4th positions have a shorter caret.
9. Press Ctrl+A to select all, then press Home.
   **[VERIFY]** A caret is visible at the expected position (matching the
   position-0 caret from step 7).
10. Press End.
    **[VERIFY]** A caret is visible at the expected position (matching the
    position-4 caret from step 7).
11. Kill the process directly and close the webpage. No elegant exit is needed.
