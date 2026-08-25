# General Instruction

- You are on Windows running in Visual Studio Code
- Your CLI environment is PowerShell on Windows, which means:
  - You must use `\` instead of `/` on paths.
  - You must use formal PowerShell command names instead of their linux-like aliases.
  - You must use `;` instead of `&&` for executing multiple commands in order.
- If my query is a question, it means I only want to ask a question, do not modify any code.
- GacUI lives in the sibling repository at `(repo-root)\..\GacUI`; always use that checkout for C++ sources, resources, builds, and debugging.
- Before implementing any change, read the relevant documents from the documentation reference below. Understand the design before writing code.
- Whenever an implementation change affects behavior documented in `doc/`, update the corresponding documentation to stay in sync.

## About this repo

This repo contains TypeScript code for building a website,
implementing an HTTP client to communicate with a remote server,
rendering a remote GUI in HTML via DOM.

GacUI uses an X-window-like remote protocol that allows a core application (server)
to render its UI in a separate client process. This repo implements the client side
for web browsers. The protocol is transport-agnostic; the HTTP implementation exists
for demo/testing only.

The sibling `GacUI` repository contains the C++ core application, unit test utilities,
and the HTTP test server. Treat it as a separate repo and commit/push any GacUI changes there.

## Documentation Reference

Read the relevant documents before implementing a change, and update them
whenever documented behavior changes.

- [Project structure](doc/Projects.md): monorepo architecture, packages, dependencies, and build phases.
- [Network protocol](doc/NetworkProtocol.md): HTTP/stdio transport, channel admission, and connection handshakes.
- [Remote Protocol](doc/Protocol.md): GacUI Remote Protocol messages, types, and directionality.
- [DOM rendering](doc/DOM.md): mapping Remote Protocol elements and updates to browser HTML.
- [DocumentParagraph](doc/DocumentParagraph.md): paragraph DOM construction, measurement, caret behavior, and hit-testing.
- [Remote Protocol testing](doc/Testing_Protocol.md): Playwright E2E harness, lifecycle, synchronization, and diagnostics.
- [Snapshot testing](doc/Testing_Snapshot.md): snapshot viewer navigation and rendered-state inspection.
- [Workflow RPC features](doc/rpc/Features.md): transport-independent Workflow RPC behavior and conformance rules.
- [Workflow RPC memory management](doc/rpc/MemoryManagement.md): object identity, holds, proxy lifetime, and disposal.
- [Workflow RPC code generation](doc/rpc/CodeGeneration.md): metadata inputs and TypeScript binding generation.
- [Workflow RPC overview](doc/rpc/README.md): document index and cross-language implementation guidance.
- [Workflow RPC verification](doc/rpc/VerifyRpcWithWorkflow.md): Workflow driver/provider conformance procedure and skip policy.

# Validation after Code Change

- This repo uses `yarn` and `npm` to build.
- The root of the workspace is defined in `(repo-root)/Gaclib/package.json`.
- After changing the code you must:
  - `Set-Location` to `(repo-root)\Gaclib`
  - `yarn build`
  - `yarn test`
- When the sibling GacUI repository has been updated, run these additional synchronization commands before `yarn build` and `yarn test`:
  - `yarn run import`
  - `yarn codegen`
- The root commands represent separate phases and must keep these responsibilities:
  - `import` refreshes files copied from upstream repositories and compiles packages that are code-generation tools. With Yarn 1, invoke this script as `yarn run import` because `yarn import` is a built-in Yarn command.
  - `codegen` runs the already-compiled code-generation tools and updates generated source files.
  - `build` compiles all non-codegen projects. Codegen-tool packages must not define a `build` script; future codegen tools belong in the `import` and `codegen` phases instead.
  - `test` runs tests against the output from the earlier phases.
- `yarn build` will always call `eslint`, do not call `npx eslint`.
- `yarn test` will always call `vitest`, do not call `npx vitest`.
  - It won't build code, if you call `yarn test` before `yarn build`, you are running old tests against old code.
- Playwright is installed with this repo.
  - After a successful build, run `npm run start` from `(repo-root)/Gaclib/website/entry` to serve `(repo-root)/Gaclib/website/entry/lib/dist` at `http://localhost:8896`. Press ENTER to stop it.
  - On Windows, IIS may already host `localhost:8896`. If the port is occupied, `npm run start` prints that IIS may already be serving the website; check the URL directly.

## Project Structure

- Source code of the website is in `(repo-root)/Gaclib/website/entry/assets`.
- After compilation everything will be generated and copied to `(repo-root)/Gaclib/website/entry/lib/dist`; the website starts here.
- `/index.js` is referenced in multiple HTML files:
  - It injects a `GacUIHtmlRenderer` global variable.
  - All members in `GacUIHtmlRenderer` are exported objects from `(repo-root)/Gaclib/website/remote-protocol-http/src/index.ts`.
- Files you absolutely cannot modify whatever happens:
  - `(repo-root)/Gaclib/gaclib/remote-protocol`: all files in this folder.
  - `(repo-root)/Gaclib/website/entry/assets/snapshots`: all files in this folder.
- Packages:
  - `(repo-root)/Gaclib/gaclib/remote-protocol` is completely generated:
    - DO NOT modify anything in this package.
    - If you find anything wrong, update `(repo-root)/Gaclib/gaclib/codegen-remote-protocol/src/**/*.ts` instead of editing generated files.
    - It is generated from `(repo-root)/Gaclib/gaclib/codegen-remote-protocol/src/Import/Protocols.json`.
    - This package serves everything around remote protocol definition and parsing.
  - `(repo-root)/Gaclib/gaclib/renderer`:
    - This package serves HTML rendering by manipulating DOM dynamically.
  - `(repo-root)/Gaclib/gaclib/workflow-rpc`:
    - Browser/Node-neutral Workflow RPC endpoint, codecs, events, proxy lifecycle, and predefined collection adapters.
    - It has `build` and `test` phases only; generic wire IDs and ownership logic belong here rather than generated bindings.
  - `(repo-root)/Gaclib/gaclib/codegen-workflow-rpc`:
    - Location-aware generator for normalized Workflow RPC metadata plus its TypeScript serialization schema.
    - Its `import` phase compiles the generator and its tests cover richer copied fixtures. It intentionally has no `build` or `codegen` script.
    - Never handwrite contract IDs in consumers or edit its committed generated output directly.
  - `(repo-root)/Gaclib/rpc-test/rpc-test-cases`:
    - Generated x64 binding and handwritten service behavior for every indexed Workflow RPC case.
    - Its generated registry is owned by the root `codegen` phase; it has `build` and `test` phases only.
  - `(repo-root)/Gaclib/rpc-test/rpc-test-cli`:
    - Node-only strict stdio provider and Workflow driver integration harness.
    - Its test phase builds Workflow Debug x64 and runs the data-driven conformance suite.
  - `(repo-root)/Gaclib/website/rvm`:
    - Generated RemoteViewModelTest binding owned by `@gaclib/codegen-workflow-rpc` and exported through a stable handwritten package entry.
    - Commit `src/generated/generated.ts` and its manifest; regenerate them through the root `codegen` phase.
  - `(repo-root)/Gaclib/website/rvmhost`:
    - Browser-safe RVM host composition plus the Node network CLI, strict stdio `/Cli` adapter, and platform-native SEA launcher.
    - It has `build` and `test` phases only. Node-only files must stay outside the public browser-safe `.` dependency graph.
    - The normal Node CLI is `lib/src/cli.js`; Core `/Cli:<path>` requires the exact native `lib/bin/gacjs-rvmhost(.exe)` path, never the JavaScript file or npm bin shim.
  - `(repo-root)/Gaclib/website/entry`:
    - The website for testing.
  - `(repo-root)/Gaclib/website/remote-protocol-http`:
    - HTTP transport layer for the remote protocol (demo/testing only).
    - Use `./channel` for the dependency-free channel contract/codec and `./http-channel` for the renderer-free multi-channel HTTP client. The root also exports the renderer adapter; generic transport code must not import that root.
  - `(repo-root)/Gaclib/gaclib/codegen-remote-protocol`:
    - `@gaclib/codegen-remote-protocol` imports the protocol metadata and AST declarations from the sibling GacUI checkout and exports the functions that generate `@gaclib/remote-protocol`; it does not choose the output location.
    - Its `import` script prepares and compiles the generator; it intentionally has no `build` or `codegen` script because the shared codegen package invokes it.
  - `(repo-root)/Gaclib/shared/codegen`:
    - Snapshot/RPC code generator and the entry point for the root `codegen` phase.
    - Its `import` script compiles the shared generator. Its `codegen` entry point generates the remote protocol, generates `website/rvm` from GacUI's x86 `RpcMetadata.txt` and `RpcMetadata.d.ts`, and then refreshes snapshot data.
  - `(repo-root)/Gaclib/shared/eslint-shared`:
    - Shared ESLint configuration used by all packages.

## Hosting the Website

- `/snapshots.html` is to view and render snapshots in `(repo-root)/Gaclib/website/entry/assets/snapshots`.
  - When updating document rendering code, always verify the `InlineObjectWithCaret` snapshot renders correctly.
- `/solidLabel.html` is a test page for rendering SolidLabel elements in different configurations.
- `/elements.html` is a test page for rendering various element types side by side.
- `/index.html` is an interactive UI for testing the remote protocol:
  - It requires an HTTP server to run. The server executable is `RemotingTest_Core` from the GacUI repo.
    - Use `(repo-root)\..\GacUI\Test\GacUISrc\RemotingTest_Core`.
  - Start the server by running `start (repo-root)\..\GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /FCT /Http`.
    - `/FCT` is for FullControlTest (index 0), `/RPT` is for RemoteProtocolTest (index 1), and `/RVMT` is for RemoteViewModelTest (index 2). They are exclusive; if none is given, `/FCT` is assumed.
    - `/Pipe` and `/Http` are exclusive transport options, specified in any order.
    - If anything is not right, close `/index.html`, kill the process and start it again, reopen `/index.html`.
  - You must use `start` as the process will block the powershell forever, until:
    - The "Fatal Error" button is clicked.
    - The exit button or menu is clicked.
    - The http server crashes for any reason.
  - When the server is running, you can open `/index.html` multiple times:
    - All previous unclosed `/index.htm.` will lose connection.
    - UI state is supposed to transfer to the new `/index.htm.`.
  - `/index.html?rvmhost` immediately records a stoppable query session, then starts the generated TypeScript view-model host before connecting a separate renderer client. It requires Core `/RVMT /Http` or `/RVMT /MiniHttp` without a separately started host.

## Debugging with Playwright and index.html

- When running Playwright tests against `index.html`, you can inject `throw new Error('UNIQUE_WORD')` into the TypeScript source to locate where an error occurs.
- When the injected error is thrown, `index.html` shows `#gacui-error-mask` and rethrows it. The Playwright harness records the resulting `pageerror` in its diagnostics.
- Use a unique word in the error message so you can find the matching error mask and diagnostic and confirm which code path triggered.

## Debugging the RemotingTest_Core HTTP Server

- Always start it with the `/FCT /Http` arguments (or just `/Http` — `/FCT` is the default).
- Always start it async, because `RemotingTest_Core` never ends until you kill the process.
- You can temporarily enabled remote protocol message logging:
  - The flag is in `<GacUI>\Test\GacUISrc\RemotingTest_Core\CoreChannel.cpp`.
  - Uncomment `//#define PRINT_PROTOCOL_JSON` to make it work.
    - You should always revert it (aka comment it) after investigation.
  - All messages sending between `RemotingTest_Core` and `index.html` will print on the CLI.
- You are always recommended to run a debugger to launch it, read these documents:
  - `<GacUI>\.github\Guidelines\Building.md.md`
  - `<GacUI>\.github\Guidelines\Running-CLI.md`
  - `<GacUI>\.github\Guidelines\Debugging.md`
  - You are required to always follow the instruction above to launch or debug `RemotingTest_Core`.

## E2E Testing

- [Remote Protocol testing guide](doc/Testing_Protocol.md) owns the Playwright harness, process lifecycle, synchronization, and diagnostics.
- [GacUI end-to-end operation SOP](../GacUI/.github/Jobs/DebugRemoteProtocolSop.md) owns feature operations, error injections, and observable pass/fail criteria. Do not duplicate those test definitions in GacJS.
- `REPO-ROOT\Gaclib\website\entry\test` has E2E test cases that start `RemotingTest_Core` and run `index.html` with Playwright.
- These E2E suites run only on Windows with a sibling `(repo-root)\..\GacUI` checkout. They build GacUI through `copilotBuild.ps1` before launching `RemotingTest_Core`.
- When investigating a renderer regression, add or update an E2E case and keep its operation/pass-fail definition synchronized with the GacUI SOP.
- UI synchronization is event-driven. Follow the helper contracts in the [Remote Protocol testing guide](doc/Testing_Protocol.md); do not add delays in place of renderer signals.

## TypeScript/JavaScript coding guidelines

- Always prefer strict testing, like `===` instead of `==`.
- Do not use `if (x)`, unless `x` is a boolean or nullable type.
  - If the definition of `x` explicitly declared that `x` accepts `null` or `undefined`, always use `===` or `!==` instead.
- With type rich programming utilizing the full ability of TypeScript
- Well organized using design patterns, inversion of dependency, combinators, etc
- Follows open-closed principle and DRY (Don't Repeat Yourself)
- Consistent with the rest of the project in coding style and naming convention
