# Testing the Remote Protocol with Playwright

This document describes the checked-in GacJS test harness: how to run it, how
tests manage `RemotingTest_Core`, how browser actions are synchronized, and what
each end-to-end suite verifies.

For building and operating the Core, serving GacJS, choosing `/Http`,
`/MiniHttp`, `/RVMT`, or `/Cli`, and performing manual browser debugging, see
[Operating GacUI Through GacJS](../../GacUI/DebugRemoteProtocolWithGacJS.md).
For the transport, channel-admission, Remote Protocol, and Workflow RPC wire
handshakes, see [NetworkProtocol.md](NetworkProtocol.md).

## Running the Tests

Install the Playwright Chromium build once:

```powershell
Set-Location Gaclib
npx playwright install chromium
```

Build GacJS and run all Vitest suites:

```powershell
Set-Location Gaclib
yarn build
yarn test
```

On Windows, the website entry tests build the sibling GacUI repository once,
start the required `RemotingTest_Core` processes, and drive headless Chromium.

On Linux and macOS, the portable fake-client suites still run, while the live
C++/browser harness prints `Skipping Windows-only protocol E2E tests.` and
exits successfully. That skip is not a live MiniHTTP or browser compatibility
test; use the platform commands in the operating guide for those checks.

Protocol test files execute sequentially (`fileParallelism: false`) because
they share a stateful server and fixed ports.

## Test Harness

All harness files live in `Gaclib/website/entry/test/`.

| File | Responsibility |
|---|---|
| `Protocol_GacUIBuild.js` | Builds the sibling GacUI test projects once for the live suites. |
| `Protocol_GlobalSetup.js` | Performs package-level setup shared by protocol suites. |
| `Testing_Protocol.js` | Provides the Vitest lifecycle, process control, DOM helpers, click helpers, idle/blink tracking, caret helpers, and path constants. |
| `Testing_Protocol_SimpleTyping.js` | Verifies basic rendering and keyboard input. |
| `Testing_Protocol_Caret.js` | Verifies caret rendering, blinking, positioning, and size. |
| `Testing_Protocol_Caret2.js` | Verifies cursor restoration after a tab switch and end-of-line caret placement. |
| `Testing_Protocol_Font.js` | Verifies font/color formatting and incremental selection. |
| `Testing_Protocol_ImageInText.js` | Verifies inline image insertion and selection rendering. |
| `Testing_Protocol_RendererSwitching.js` | Verifies renderer replacement while preserving Core UI state. |
| `Testing_Protocol_RemoteViewModel.js` | Covers a browser RVM host over `/Http` and `/MiniHttp`, second-host rejection, renderer replacement, and accepted-host loss. |
| `Testing_Protocol_RemoteViewModel_Node.js` | Covers an independently started Node network host and fatal host loss. |
| `Testing_Protocol_RemoteViewModel_Cli.js` | Covers a Core-launched native SEA host over stdio, quoted paths, PID/TCP isolation, graceful reap, and fatal child loss. |
| `Testing_Protocol_RemoteViewModel_Cpp.js` | Checks `CppTest_Rvm` compatibility over HTTP, MiniHTTP, and Core-launched stdio. |
| `RvmQuerySession.test.ts` | Uses fake clients to cover bootstrap cancellation, renderer replacement, independent failures, and idempotent teardown on every platform. |

Each live suite is wrapped by `describeProtocolTest()` and normally creates its
lifecycle with `setupProtocolTest(options)`.

### Lifecycle and configuration

`setupProtocolTest(options)` accepts:

- An exact `serverArguments` array.
- A `websiteUrl`, including query parameters such as `?rvmhost`.
- An optional `startupReadiness` callback.
- Page setup and optional child-process cleanup callbacks.
- Opt-in graceful Core teardown.
- A `serverEnvironment` merged into the Core environment for isolated
  black-box hooks such as the native host PID file.

Keep `/Cli:<absolute path>` as one array element so paths containing spaces are
passed as one argument. Use `openPage(url, false)` when a test intentionally
expects application startup to be rejected and therefore must skip the normal
rendered-page barrier.

For RVM startup, `waitForRemoteViewModelReady()` waits until the Core automation
JSON contains the exact text `Remote View Model Test`. A listening port alone
does not prove that the RVM host completed its Workflow RPC handshake.

`gracefullyStopCore()` posts the exact body `!Exit` with the automation
endpoint's required content type and waits for normal process exit. Tests that
verify stdio-child shutdown use this route. For a test intended to prove
graceful shutdown, a fallback process-tree force kill is cleanup and does not
count as graceful-shutdown coverage.

The optional `scripts/start-test-server.ps1` and
`scripts/stop-test-server.ps1` helpers are convenient for focused local
debugging. The operating guide remains authoritative for supported launch
topologies and platform-specific commands.

## Writing a Test

```javascript
import { test, expect } from 'vitest';
import {
    getLeafTextPositions,
    findTextInputPointRightOfLabel,
    clickAt,
    waitForIdle,
    waitForCarets,
    setupProtocolTest,
    describeProtocolTest
} from './Testing_Protocol.js';

describeProtocolTest('MyTest', () => {
    const ctx = setupProtocolTest();

    test('the page renders', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        expect(positions.length).toBeGreaterThanOrEqual(20);
    });

    test('an interaction updates the UI', async () => {
        const positions = await getLeafTextPositions(ctx.page);
        const controlTab = positions.find(({ text }) => text === 'Control');
        expect(controlTab).toBeDefined();

        await clickAt(ctx.page, controlTab.cx, controlTab.cy);

        const controlPositions = await getLeafTextPositions(ctx.page);
        const searchLabel = controlPositions.find(({ text }) =>
            text.startsWith('Search:')
        );
        expect(searchLabel).toBeDefined();
        const inputPoint = await findTextInputPointRightOfLabel(
            ctx.page,
            searchLabel
        );
        expect(inputPoint).toBeTruthy();

        await clickAt(ctx.page, inputPoint.x, inputPoint.y);
        const carets = await waitForCarets(ctx.page);
        expect(carets.length).toBe(1);

        await ctx.page.keyboard.type('SAMPLE_INPUT');
        await waitForIdle(ctx.page);
        const screenText = await ctx.page.locator('#gacui-screen').innerText();
        expect(screenText).toContain('SAMPLE_INPUT');
    });
});
```

Suites share one Core lifetime across their ordered test cases. Express a
scenario as small, named steps when later assertions depend on earlier UI state.

## Event-Driven Synchronization

UI synchronization is intended to be event-driven. Do not add a `sleep()` to
wait for UI state; use the renderer's idle or blink signal.

The renderer exposes two optional `GacUISettings` callbacks:

- `idle` fires after `RequestRendererIdle`, when pending renderer work has
  completed.
- `blink` fires after every `setCaretVisible` toggle from the caret timer.

`index.html` forwards these callbacks to the Playwright bindings
`__gacui_playwright_idle` and `__gacui_playwright_blink`.
`setupIdleTracking(page)` exposes the bindings before `page.goto()`, so the
initial events cannot be missed. `setupProtocolTest()` performs this setup for
normal pages.

| Function | Contract |
|---|---|
| `setupIdleTracking(page)` | Register the idle and blink bindings before navigation. |
| `waitUntilIdle(page)` | Wait for the first idle signal during initial page load. |
| `waitForIdle(page)` | Wait for the next idle signal after an interaction. |
| `waitForBlink(page)` | Wait for one caret visibility toggle. |
| `waitForCarets(page)` | Check immediately, then recheck after blink signals until the requested visibility is observed or the timeout expires. |
| `findCarets(page)` | Take an immediate snapshot of the caret elements. |
| `clickAt(page, x, y)` | Move, press, release, and wait for idle. |

`waitForIdle()`, `waitUntilIdle()`, and `waitForBlink()` throw when tracking has
not been installed; `clickAt()` requires it through `waitForIdle()`.
`findCarets()` is an immediate DOM query. `waitForCarets()` can return from its
initial query, but requires blink tracking when it needs to wait. If a state
transition cannot be observed with an existing signal, add an explicit
renderer signal instead of polling or delaying the test.

## Diagnosing a Playwright Failure

- GacUI renders a dynamic tree of nested `div` elements. Wait for an idle
  signal, use broad selectors, and inspect `page.content()` when a selector no
  longer matches.
- `index.html` shows `#gacui-error-mask` and rethrows an unhandled session
  exception. The harness records the resulting Playwright `pageerror` with its
  other diagnostics. An unexpected dialog is logged as `[CRASH]` and dismissed.
- Capture a visual snapshot when geometry matters:
  `await page.screenshot({ path: 'test.png' })`.
- Core launch, endpoint, port, browser, and manual-operation problems belong to
  the [operating guide](../../GacUI/DebugRemoteProtocolWithGacJS.md).

## Test Suite Intent

The goals below are the compatibility contract for the existing suites. Change
their implementation when necessary, but do not weaken or silently change the
stated goal. Each of the six renderer-interaction suites below begins by
verifying that the rendered page has at least 20 leaf-text positions.

### Simple typing

`Testing_Protocol_SimpleTyping.js` must:

1. Launch the Core and open `index.html`.
2. Open the **Control** tab and locate the text box beside **Search:**.
3. Type through `IOChar` messages, allowing the Core to decide which control is
   active.
4. Verify that the typed text appears.
5. Terminate the process directly and close the page; graceful exit is not part
   of this suite.

### Font and color formatting

`Testing_Protocol_Font.js` must:

1. Open the rich-text editor on the **Control** tab and type
   `ABCDEFGHIJKLMN`.
2. Select `C..K`, open the font dialog, verify that the first font name is not
   quoted, choose the available font and a larger size, and accept the dialog.
3. Select `H..M`, open the foreground text-color dialog, set the first component
   to `0`, and accept the dialog.
4. Verify that `C..K` is larger and `H..M` is `#00FFFF`.
5. Move to position zero and verify that formatting is unchanged.
6. Extend the selection with Shift+Right fourteen times. At every step, verify
   that selected text is white and unselected text retains both formatting
   ranges.
7. Terminate the process directly and close the page.

### Inline image in text

`Testing_Protocol_ImageInText.js` must:

1. Type `ABC` in the rich-text editor.
2. Use **Insert Image** and the remote file dialog to choose
   `GACUI-ROOT\Test\Resources\App\Gaclib.png`.
3. Move Home and type `X`.
4. Verify `XABC` followed by a visible inline image.
5. Select all and verify that the image has a visible selection overlay.
6. Terminate the process directly and close the page.

### Cursor restoration and end-of-line placement

`Testing_Protocol_Caret2.js` must:

1. Activate the Search text box and type `Hello`.
2. Switch to the **List** tab and back to **Control**.
3. Verify that the text-box area has the CSS cursor `text`, not `default`.
4. Reactivate the box and use successive blink signals to verify the caret
   visible, hidden, and visible states.
5. Type `ABCDEF` in the rich-text editor.
6. Verify the Home position, then verify that End places the caret after the
   final character at the same position reached by six Right presses.
7. From Home, click to the right of the last character and verify the same
   end-of-line position.
8. Terminate the process directly and close the page.

### Renderer switching

`Testing_Protocol_RendererSwitching.js` must:

1. Type `Hello` in the Search box in the first renderer page.
2. Open a second `index.html` page and verify that it takes over the renderer
   connection while preserving the text.
3. Select part of the text.
4. Open a third page and verify that both the text and selection are preserved.
5. Terminate the process directly and close all pages.

### Caret geometry and blinking

`Testing_Protocol_Caret.js` must:

1. Verify a visible caret in the Search box.
2. Focus the rich-text editor and verify that the Search caret disappears and
   the editor caret appears.
3. Use successive blink signals to verify visible, hidden, and visible states.
4. Type `ABCD`, format `BC` at size 24, and return to position zero.
5. Move Right through all five caret positions. Verify that every movement
   reopens the caret and that the positions beside the larger `BC` glyphs have
   the taller caret.
6. Move Left through the four preceding positions and verify the corresponding
   tall and default-height carets.
7. Select all, press Home, and verify the position-zero caret.
8. Press End and verify the position-four caret.
9. Terminate the process directly and close the page.

### Remote view model topologies

The four `Testing_Protocol_RemoteViewModel*.js` suites together must preserve
coverage for:

- Browser and independent Node hosts over both `/Http` and `/MiniHttp`.
- Rejection of a second RVM host and replacement of a renderer.
- Fatal loss of the accepted network host.
- A Core-launched `/Cli` host over both renderer transports, including a host
  path containing spaces.
- Parent/child PID ownership, absence of an unintended host TCP connection,
  graceful child reap, and fatal child loss with nonzero Core exit.
- Native `CppTest_Rvm` interoperability across HTTP, MiniHTTP, and stdio.

`RvmQuerySession.test.ts` supplies the platform-independent failure and teardown
coverage; it does not replace the live Windows topology checks.
