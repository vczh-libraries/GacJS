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

### Test Strategy

Create Playwright tests that:

1. Start the C++ server process
2. Launch a browser pointing to `index.html`
3. Interact with the UI (click, type, drag)
4. Verify DOM state (screenshots, element queries)
5. Kill the C++ server process

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { exec, execSync } from 'child_process';
import path from 'path';

// Resolve from the repo root (two levels up from Gaclib/tests/)
const SERVER_EXE = path.resolve(__dirname, '../../GacUI/Test/GacUISrc/x64/Debug/RemotingTest_Core.exe');
const WEBSITE_URL = 'http://localhost:8896/index.html';

test.describe('DocumentParagraph live tests', () => {
    let serverProcess: ReturnType<typeof exec>;

    test.beforeAll(async () => {
        // Start the C++ server
        serverProcess = exec(`"${SERVER_EXE}" /Http`);
        // Wait for server to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));
    });

    test.afterAll(async () => {
        // Kill the server
        try {
            execSync('taskkill /F /IM RemotingTest_Core.exe', { stdio: 'ignore' });
        } catch { /* may already be dead */ }
    });

    test('document editor renders text', async ({ page }) => {
        await page.goto(WEBSITE_URL);
        // Wait for GacUI to initialize
        await page.waitForSelector('#gacui-screen div', { timeout: 10000 });
        // Navigate to the Control tab with document editor
        // ... click on tabs ...
        // Verify document content appears
    });

    test('text selection updates styles incrementally', async ({ page }) => {
        await page.goto(WEBSITE_URL);
        // ... navigate to document editor ...
        // Click and drag to select text
        // Verify selection highlighting appears in DOM
    });
});
```

### Running Playwright Tests

```powershell
cd Gaclib
npx playwright test
```

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

A standalone Playwright test script that verifies basic UI rendering and interaction
with the GacUI remote protocol. Located at `doc/Testing_Protocol_SimpleTyping.js`.

**Run:**
```powershell
cd Gaclib
node ..\doc\Testing_Protocol_SimpleTyping.js
```

**The goal of the test plan cannot be changed.** The test must:

1. Launch the application (start the C++ server, open `index.html` in Playwright).
2. Open the "Control" tab, find the text box next to the "Search:" label.
3. Type text into the text box. Typing is implemented by sending IOChar messages.
   The client sends IOChar events and the core side judges which text box is active.
4. Verify that the typed text appears in the text box.
5. Kill the process directly and close the webpage. No elegant exit is needed.
