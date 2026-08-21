# Testing the Remote Protocol with Playwright

This document describes the checked-in GacJS test harness: how to run it, how
tests manage `RemotingTest_Core`, how browser actions are synchronized, and how
the test files are organized.

For building and operating the Core, serving GacJS, choosing `/Http`,
`/MiniHttp`, `/RVMT`, or `/Cli`, and performing manual browser debugging, see
[Operating GacUI Through GacJS](../../GacUI/DebugRemoteProtocolWithGacJS.md).
For the authoritative feature operations, error injections, and observable
pass/fail results—the definition of what to test—see
[GacUI End-to-End UI Operation SOP](../../GacUI/DebugRemoteProtocolSop.md).
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

All harness and test files live in `Gaclib/website/entry/test/`. These support
files define the shared harness:

| File | Harness role |
|---|---|
| `Protocol_GacUIBuild.js` | Builds the sibling GacUI test projects once for the live suites. |
| `Protocol_GlobalSetup.js` | Performs package-level setup shared by protocol suites. |
| `Testing_Protocol.js` | Provides the Vitest lifecycle, process control, DOM helpers, click helpers, idle/blink tracking, caret helpers, and path constants. |

The live Playwright suite files are:

- `Testing_Protocol_SimpleTyping.js`
- `Testing_Protocol_Caret.js`
- `Testing_Protocol_Caret2.js`
- `Testing_Protocol_Font.js`
- `Testing_Protocol_ImageInText.js`
- `Testing_Protocol_RendererSwitching.js`
- `Testing_Protocol_RemoteViewModel.js`
- `Testing_Protocol_RemoteViewModel_Node.js`
- `Testing_Protocol_RemoteViewModel_Cli.js`
- `Testing_Protocol_RemoteViewModel_Cpp.js`

The portable fake-client unit suite is `RvmQuerySession.test.ts`. This inventory
does not define suite operations or expected results; those belong to the
GacUI SOP linked above.

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
