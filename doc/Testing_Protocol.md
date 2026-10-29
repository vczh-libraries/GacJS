# Testing the Remote Protocol with Playwright

This document describes the checked-in GacJS test harness: how to run it, how
tests manage `RemotingTest_Core`, how browser actions are synchronized, and how
the test files are organized.

For building and operating the Core, serving GacJS, choosing `/Http`,
`/MiniHttp`, `/RVMT`, or `/Cli`, and performing manual browser debugging, see
[Operating GacUI Through GacJS](../../GacUI/.github/Jobs/DebugRemoteProtocolWithGacJS.md).
For the authoritative feature operations, error injections, and observable
pass/fail results—the definition of what to test—see
[GacUI End-to-End UI Operation SOP](../../GacUI/.github/Jobs/DebugRemoteProtocolSop.md).
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

### Linux WebAssembly apps

The Wasm browser suite is separate from the Windows process harness. Follow the
[Linux Wasm job](../../GacUI/.github/Jobs/job.rpWasm.prompt.md) to build all three
apps, build GacJS, run `copy-wasm.sh`, and start the entry server. Then run
`npm run test-wasm` from `Gaclib/website/entry`. `vitest.wasm.config.js` runs
`test/Testing_Wasm.js` against the deployed modules without building or launching
a native Core. The root `yarn test` also runs the portable channel tests in
`remote-protocol-wasm`.

The live Chromium and Firefox suites inspect each actual `ControllerConnect` payload, requiring `injectDateTime`, `injectLocale` and `injectFileSystem` to be present and false. They also reject injection requests during the exercised application operations and after Reload. Verify the shared Core startup configuration independently; renderer capability checks alone do not establish Core policy.

The current three-file contract requires Emscripten 3.1.51; see the
[SDK compatibility note](Projects.md#running-the-wasm-demos-on-linux) before
building, especially when replacing objects made by a different SDK.

Deploy the matching `app.mjs`, `app.wasm` and `app.worker.js` beside every demo
page. Verify Chromium and Firefox load the separate pthread script and its
module imports without worker errors. `wasm-worker.js` is GacJS's application
host, distinct from Emscripten's generated `app.worker.js`. The existing
regression suite uses Chromium CDP for mouse input and worker lifetime checks.
`Testing_Wasm_Firefox.js` also runs through `test-wasm` and checks all three
pages' module/pthread requests, startup, input, Exit cancellation and shutdown/reload.
It checks the live FCT clock, DOM-synthetic Touching/TouchingList gestures and RVMT Unicode RPC; the Unicode keystrokes use
DOM keyboard events because Firefox has no CDP input endpoint.

Each page owns its Core worker and pthreads. The suite verifies Exit cancellation,
Exit and Force Exit followed by Reload, fresh UI state, and recreated RVMT hosts.
Reload stays disabled until normal Core completion; RVMT keeps its host alive
through Core's service release. Fatal errors leave Reload disabled. The fixed
startup connections have no separate host-disconnection or replacement-renderer
operation. The suite also covers the linked SOP's feature operations, RPT fatal
errors and live-page closure, using renderer idle signals and visible DOM for
synchronization and checking actual worker termination.
Native OS global hot keys are outside browser coverage.

The real Wasm FCT suite also selects Misc / Raw Clock and checks received
`FullControlTest.Clock` state, nonempty canvas pixels and changing hands without
input. It verifies record/canvas identity across tab hide/show, pixel-buffer
resizing, palette refresh and fresh drawing after both Exit and Force Exit followed
by Reload. Fixed-time and ID-transition cases remain in the controlled Raw browser
suite; live wall-clock values are not snapshot baselines.

The Wasm touch suite observes the real worker channel without a native HTTP Core. Chromium CDP drives acquisition, overlapping/reused contacts, cancellation, capture across resize, manipulation pixels and identity-safe list swipes. Firefox uses explicitly synthetic PointerEvents with capture stubs, so it verifies adapter/Core/rendering behavior without claiming native browser capture. The portable Wasm channel test separately preserves full-width decimal sequence, timestamp and frame fields.

Set `GACUI_PUBLIC_DEMO_URL` to the public launcher route and run `npm run test-wasm -- test/Testing_Wasm_Public.js` to exercise WebsiteSource's launcher through its scoped service worker in Chromium and Firefox. The test checks download progress, isolation, separate workers, Raw Clock, Touching, TouchingList, painter cleanup and fresh state after browser refresh. Set `GACUI_PUBLIC_HOME` as well to follow the homepage's Web demo link. The public suite is skipped when no destination is supplied. Build and stage final artifacts first; it does not publish or rebuild the site.

## Test Harness

### Injection coverage

After import/codegen and `yarn build`, renderer unit tests cover calendar conversions, all locale operations and unavailable storage. `ConnectionOptions.test.ts` checks defaults, case-insensitive presence, host validation and idempotent URL rebuilding. `RawBrowser.test.ts` exercises the real renderer in Chromium: timezone offsets for winter/summer, milliseconds, OPFS operations, ordered binary commits, empty files, metadata, Unicode rename and persistence across refresh, plus checkbox/host controls. These controlled transport tests do not substitute for live Core routing checks.

For live checks, launch FCT with each Core/renderer option combination, using `/remoteDT /remoteLocale /remoteFS` and `?remoteDT&remoteLocale&remoteFS`. Inspect actual injection requests and fresh Core queries; cached localization labels alone cannot establish routing. Use an origin-private fixture such as `<GacUI repo>/Test/TestDocument.bin` for document save/reload/export and inspect the persisted OPFS bytes. Core off must retain its predecessor; Core on with a missing renderer capability must use the DateTime/Locale predecessor or empty filesystem. Observe transport loss before asserting fallback, then reconnect with capabilities off/on. Close an old stream only in a separate expected-failure run.

`corehost` must reach both renderer and optional RVM host on port 8888. REFRESH preserves OPFS, but with `rvmhost` it destroys the accepted host and requires restarting RVMT Core. Use FCT or a separately hosted RVMT session for renderer-only lifecycle checks. These HTTP flags do not enable injection in the Wasm demo startup path; report native/Wasm platform coverage separately. Temporary provider overrides used to distinguish routing must be removed before rebuilding and the final real-browser smoke check.

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
- `Testing_Protocol_RawClock.js`

The portable unit suites include `RvmQuerySession.test.ts`,
`RawBrowser.test.ts` and the controlled Wasm page composition tests. The Raw
browser suite serves built assets on an ephemeral port and sends controlled JSON
protocol messages through the real adapter and renderer. It checks clock pixels,
data-only updates, resizing/DPI, raw div lifetime across DOM reconstruction,
retained completion/error pictures and recorded snapshot playback. It also checks
that renderer takeover preserves a page's accepted RVM host while disposing its
renderer subscriptions; host completion, fatal failure and page teardown clean
up the remaining session. Teardown during bootstrap does not stop an unstarted
renderer; a rejected second host must retain its original connection error
without a ResizeObserver cleanup error. These tests run through
`yarn workspace @gaclib-website/entry test-unit` after building.

The focused live Raw Clock suite additionally checks the existing FCT Core's
time updates and tab hide/show. `GACUI_PROTOCOL_TESTS_BUILT=1` can reuse an
existing compatible Core executable; verify its provenance and availability
before invoking the suite because the existing harness builds if it is absent.
This focused clock coverage leaves the general showcase SOP unchanged. The other
suite operations and expected results belong to the GacUI SOP linked above.

The browser-host suite covers both idle loss and loss during an RPC whose reply
is held at the browser request boundary. The latter leaves a Core automation
Controls read pending while stopping the host, then requires fatal delivery and
Core termination. This guards endpoint shutdown from waiting on UI work after
the UI event loop has exited.

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
  the [operating guide](../../GacUI/.github/Jobs/DebugRemoteProtocolWithGacJS.md).

## Point input verification

The controlled RawBrowser suite distinguishes synthetic PointerEvent adapter checks from Chromium CDP touch injection. It checks sparse slots, normal Up/lostcapture ordering, reused pointer IDs, cancellation draining, stable capture across child replacement, descendant touch-action, mouse suppression and independent mouse input. The Touching painter test checks actual rectangle/contact pixels, changed transforms and Clock/Touching ID transitions.

`<GacJS repo>/Gaclib/website/entry/test/Testing_Protocol_Touching.js` drives browser input against real /Http and /MiniHttp FCT Core processes. It compares Core raw state with browser drawing for one/two/three contacts, membership rebasing, cancellation, and rejected-tab fallback. Post-rebase translation checks allow the gesture contract's half-logical-pixel residual while checking that pure translation preserves rotation and scale. It uses the ordinary protocol lifecycle and its existing server. Run from `<GacJS repo>/Gaclib`: yarn run import, yarn codegen, yarn build, yarn test. Repeated codegen must leave generated output unchanged. The native counterpart uses the GacUI JSON/filter harness and Win32/x64 decimal round trips.

Follow `<GacUI repo>/.github/Jobs/DebugRemoteProtocolSop.md` for the complete operation matrix, native renderer automation and Windows injection. Listener automation, synthetic browser events, browser input injection, Windows injection and physical hardware are different evidence categories. A shared renderer or schema build does not establish a WASM runtime result; that coverage remains separate.

TouchingList removal updates row identities before the subsequent measured layout closes the gap. The browser check waits for the expected row position using the existing observable-state helper and keeps the half-pixel position tolerance.
