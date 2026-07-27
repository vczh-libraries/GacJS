# Testing with the C++ Test Server and Playwright

This document describes how to build, run, and test against the C++ `RemotingTest_Core`
HTTP server, and how to use Playwright to automate browser-based testing of `index.html`.

Throughout this document, **GACUI-ROOT** refers to the sibling GacUI repository
at `..\GacUI`, next to this GacJS checkout.

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
| `RemotingTest_Core.exe /FCT /Http` | 8888 | GacUI remote protocol API server (JSON/HTTP) |
| Static file server | 8896 (or any) | Serves `index.html`, `index.js`, CSS, etc. |

The C++ server is **not** a static file server. It serves VlppOS HTTP channel endpoints:
- `GET /GacUIRemoteProtocolHttp/VlppInterProcess/Connect` — client handshake, returns unique session URLs
- `POST /GacUIRemoteProtocolHttp/VlppInterProcess/Request/{GUID}` — long-poll for core-to-client messages
- `POST /GacUIRemoteProtocolHttp/VlppInterProcess/Response/{GUID}` — client-to-core events/responses

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

The `RemotingTest_Core` project is part of the `GacUISrc.sln` solution in the sibling GacUI repo.

### Using copilotBuild.ps1

The GacUI repo provides `GACUI-ROOT\.github\Scripts\copilotBuild.ps1` for building.
Follow the guidelines in `GACUI-ROOT\.github\Guidelines\Building.md`.

```powershell
cd GACUI-ROOT\Test\GacUISrc
& GACUI-ROOT\.github\Scripts\copilotBuild.ps1
```

This builds in **Debug x64** by default. Pass `-Configuration` and `-Platform` to override.
The build log is saved to `GACUI-ROOT\.github\Scripts\Build.log`.

### Using Visual Studio IDE

1. Open `GACUI-ROOT\Test\GacUISrc\GacUISrc.sln`
2. Set Solution Configuration to **Debug** and Platform to **x64**
3. Right-click `RemotingTest_Core` → Build

### Output Location

The built executable is at:
```
GACUI-ROOT\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe
```

---

## Running the C++ Server

The server accepts two categories of command-line arguments (in any order):

| Argument | Description | Default |
|----------|-------------|---------|
| `/FCT` | Run the **FullControlTest** application (index 0) | Yes (if neither `/FCT` nor `/RPT` is specified) |
| `/RPT` | Run the **RemoteProtocolTest** application (index 1) | No |
| `/Pipe` | Use named-pipe transport | — |
| `/Http` | Use HTTP transport | — |

- `/FCT` and `/RPT` are **exclusive** — specify at most one. If neither is given, `/FCT` is assumed.
- `/Pipe` and `/Http` are **exclusive** — exactly one must be specified.
- Arguments can appear in any order.

The server **blocks the terminal**, so always launch it with `start`:

```powershell
start GACUI-ROOT\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /FCT /Http
```

The server prints:
```
> HTTP server created, waiting on: http://localhost:8888/GacUIRemoteProtocolHttp
```

**Important notes:**
- The E2E test cases in `Gaclib/website/entry/test` use `/FCT` (FullControlTest).
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

Start the checked-in static server:

```text
cd Gaclib\website\entry
npm run start
```

It serves `lib\dist` at `http://localhost:8896` and waits for ENTER to stop.
The command works on Windows, Linux, and macOS. If port `8896` is already in
use on Windows, it reports that IIS may already be hosting the website; check
the URL directly. Other startup failures are reported as errors and exit with a
nonzero status.

**IMPORTANT:** The root folder MUST be `lib\dist\` — HTML files reference `/index.js`
which is in the dist root.

---

## Manual Testing

### Testing the Remote Protocol (index.html)

1. Build the TypeScript code: `cd Gaclib; yarn build`
2. Start the C++ server: `start RemotingTest_Core.exe /FCT /Http`
3. In another terminal, run `cd Gaclib\website\entry; npm run start`
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

The main window is defined in `..\GacUI\Test\Resources\App\FullControlTest\Resource.xml`.
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
  DOM helpers, click helpers, idle/blink tracking, caret helpers, path constants).
- `Testing_Protocol_SimpleTyping.js` — Basic UI rendering and keyboard input test.
- `Testing_Protocol_Caret.js` — Caret rendering, blinking, and positioning test.
- `Testing_Protocol_Caret2.js` — Cursor style after tab switch, caret blinking after tab switch,
  and end-of-line caret positioning test.
- `Testing_Protocol_Font.js` — Font/color formatting and incremental selection test.
- `Testing_Protocol_ImageInText.js` — Inline image insertion and rendering test.
- `Testing_Protocol_RendererSwitching.js` — Renderer switching (reconnection) test.

Each test file is a vitest suite wrapped by `describeProtocolTest()` from the shared
module. The checked-in harness is Windows-specific: it builds GacUI with
`GACUI-ROOT\.github\Scripts\copilotBuild.ps1`, launches the Windows core
executable with `/Http`, and uses headless Chromium. The website entry package
does not start Vitest on non-Windows platforms, so the root test command can
continue running the portable package tests without loading this E2E harness.
The internal suite guard remains as a fallback for a missing sibling GacUI repo.

### Example Test Structure

```javascript
import { test, expect } from 'vitest';
import {
    getLeafTextPositions,
    clickAt,
    waitForIdle,
    waitForCarets,
    findCarets,
    setupProtocolTest,
    describeProtocolTest
} from './Testing_Protocol.js';

describeProtocolTest('MyTest', () => {
    const ctx = setupProtocolTest();

    test('Step 1: Page rendering', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        expect(positions.length).toBeGreaterThanOrEqual(20);
    });

    test('Step 2: Interact with UI', async () => {
        // Click a tab, waitForIdle handles synchronization
        await clickAt(ctx.page, tabPos.cx, tabPos.cy);
        // Type a key, then wait for idle
        await ctx.page.keyboard.press('A');
        await waitForIdle(ctx.page);
        // Check caret visibility (event-driven, no sleep)
        const carets = await waitForCarets(ctx.page);
        expect(carets.length).toBe(1);
    });
});
```

### Running Tests

```powershell
cd Gaclib
yarn test
```

On Windows, this runs all vitest suites across all packages, including the
protocol tests. Protocol tests build the sibling GacUI repo once before launching
any `RemotingTest_Core` test process. On Linux and macOS, the portable suites run
but the website entry package prints `Skipping Windows-only protocol E2E tests.`
and exits successfully. That skip does not verify a live MiniHTTP core or browser;
perform cross-platform browser verification separately.
Test files run sequentially (`fileParallelism: false`) since they share the
same stateful HTTP server.

### Synchronization: Event-Driven, Not Sleep-Based

Tests use **no** `sleep()` for UI synchronization. The only remaining `sleep()` calls
are for server startup/shutdown (OS-level process delays), not for waiting on UI state.

The renderer exposes two optional callbacks in `GacUISettings`: `idle` and `blink`.

- **`idle`** fires after `RequestRendererIdle` — the renderer has finished processing
  all pending messages.
- **`blink`** fires after each `setCaretVisible` toggle in the 500ms caret blink timer.

`index.html` bridges these callbacks to CDP (Chrome DevTools Protocol) functions
(`__gacui_playwright_idle`, `__gacui_playwright_blink`). On the Node.js/Playwright side,
`setupIdleTracking(page)` exposes these functions **before** `page.goto()` via
`page.exposeFunction`, ensuring no events are missed.

#### Key synchronization functions

| Function | Purpose | Typical Use |
|----------|---------|-------------|
| `setupIdleTracking(page)` | Register CDP bindings for idle + blink | Call **before** `page.goto()` |
| `waitForIdle(page)` | Wait for next `RequestRendererIdle` | After click, keypress, any interaction |
| `waitUntilIdle(page)` | Wait for first-ever idle signal | Initial page load |
| `waitForBlink(page)` | Wait for exactly one caret blink toggle | Caret blink testing |
| `waitForCarets(page)` | Event-driven caret visibility check | Verify caret shown / hidden |
| `findCarets(page)` | Immediate DOM query for caret divs | One-time snapshot of caret state |

`waitForCarets` works by checking the DOM once; if not satisfied, it waits for one
blink event (since each blink toggles caret visibility) and checks again. No loop,
no polling, no sleep.

`clickAt(page, x, y)` performs mouse move → down → up → `waitForIdle` in sequence.
All synchronization is handled internally; callers need no additional waits.

All synchronization functions **throw** if `setupIdleTracking(page)` was not called.
`setupProtocolTest()` handles this automatically for most test files.

**Rule:** Never add `sleep()` for UI synchronization. If something needs waiting,
there should be a renderer event for it.

### Important Playwright Notes

- `index.html` expects the C++ server on `localhost:8888` — this is hardcoded.
- Only one browser connection is active at a time — previous connections lose state.
- If the C++ server crashes (which happens on unhandled protocol errors), restart it.
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

- GacUI renders dynamically — use `waitUntilIdle(page)` for initial page load.
- The DOM structure is deeply nested `<div>` elements — use broad selectors.
- Check `page.content()` to see what's actually rendered.

---

## Test Scripts

**Prerequisites:**
- `yarn build` in `Gaclib/`
- Sibling `..\GacUI` repo available on Windows; protocol tests build `RemotingTest_Core.exe` automatically
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
   dialog opens with two lists and a text box at the bottom. Type
   `GACUI-ROOT\Test\Resources` into the filename text box and press Enter, double-click
   `App`, then type `Gaclib.png` and press Enter. An image is inserted after `ABC` on
   the same line.
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

This test uses `setupProtocolTest()` and opens multiple pages through the shared browser
context to verify renderer switching.

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
