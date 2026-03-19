# General Instruction

- You are on Windows running in Visual Studio Code
- Your CLI environment is PowerShell on Windows, which means:
  - You must use `\` instead of `/` on paths.
  - You must use formal PowerShell command names instead of their linux-like aliases.
  - You must use `;` instead of `&&` for executing multiple commands in order.
- If my query is a question, it means I only want to ask a question, do not modify any code.
- Before reading any file inside the `GacUI` submodule, always ensure it is initialized first:
  - `git submodule update --init --remote GacUI`
- Before implementing any change, read the relevant documentation in `doc/` first (`Protocol.md`, `DOM.md`, `Projects.md`). Understand the design before writing code.
- Whenever an implementation change affects behavior documented in `doc/`, update the corresponding documentation to stay in sync.

## About this repo

This repo contains TypeScript code for building a website,
implementing an HTTP client to communicate with a remote server,
rendering a remote GUI in HTML via DOM.

GacUI uses an X-window-like remote protocol that allows a core application (server)
to render its UI in a separate client process. This repo implements the client side
for web browsers. The protocol is transport-agnostic; the HTTP implementation exists
for demo/testing only.

The GacUI folder is a submodule containing the C++ core application, unit test utilities,
and an HTTP test server. DO NOT modify anything in the GacUI folder.

See `doc/Protocol.md` for the remote protocol reference.
See `doc/DOM.md` for how elements are rendered to HTML.
See `doc/Projects.md` for the full package structure.
See `doc/Testing_Snapshot.md` for how to navigate and inspect snapshots.

# Validation after Code Change

- This repo uses `yarn` and `npm` to build.
- The root of the workspace is defined in `(repo-root)/Gaclib/package.json`.
- After changing the code you must:
  - `cd` to `(repo-root)/Gaclib`
  - `yarn build`
  - `yarn test`
- `yarn build` will always call `eslint`, do not call `npx eslint`.
- `yarn test` will always call `vitest`, do not call `npx vitest`.
  - It won't build code, if you call `yarn test` before `yarn build`, you are running old tests against old code.
- Playwright is installed with this repo.
  - After a successful build, the website is accessible by `localhost:8896` automatically.
  - If this host is unreachable, you can also host by yourself, and the root folder should be `(repo-root)/Gaclib/website/entry/lib/dest`, otherwise resources won't resolve correctly.

## Project Structure

- Source code of the website is in `(repo-root)/Gaclib/website/entry/assets`.
- After compiled everything will be generated and copied to `(repo-root)/Gaclib/website/entry/lib/dest`, the website starts here.
- `/index.js` is referenced in multiple HTML files:
  - It injects a `GacUIHtmlRenderer` global variable.
  - All members in `GacUIHtmlRenderer` are exported objects from `(repo-root)/Gaclib/website/remote-protocol-http/src/index.ts`.
- Files you absolutely cannot modify whatever happens:
  - `(repo-root)/Import/Metadata/RemoteProtocol.json`
  - `(repo-root)/Gaclib/gaclib/remote-protocol`: all files in this folder.
  - `(repo-root)/Gaclib/website/entry/assets/snapshots`: all files in this folder.
- Packages:
  - `(repo-root)/Gaclib/gaclib/remote-protocol` is completely generated:
    - DO NOT modify anything in this package.
    - If you find anything wrong, update `(repo-root)/Gaclib/shared/codegen/src/**/*.ts` and run `yarn codegen`.
    - It consumes `(repo-root)/Import/Metadata/RemoteProtocol.json` to generate remote protocol schema and parsing code.
    - This package serves everything around remote protocol definition and parsing.
  - `(repo-root)/Gaclib/gaclib/renderer`:
    - This package serves HTML rendering by manipulating DOM dynamically.
  - `(repo-root)/Gaclib/website/entry`:
    - The website for testing.
  - `(repo-root)/Gaclib/website/remote-protocol-http`:
    - HTTP transport layer for the remote protocol (demo/testing only).
    - Wraps `@gaclib/remote-protocol` with fetch-based HTTP client.
  - `(repo-root)/Gaclib/shared/codegen`:
    - Code generator that reads `(repo-root)/Import/Metadata/RemoteProtocol.json` and produces `@gaclib/remote-protocol`.
    - Run `yarn codegen` to regenerate.
  - `(repo-root)/Gaclib/shared/eslint-shared`:
    - Shared ESLint configuration used by all packages.

## Hosting the Website

- `/snapshots.html` is to view and render snapshots in `(repo-root)/Gaclib/website/entry/assets/snapshots`.
  - When updating document rendering code, always verify the `InlineObjectWithCaret` snapshot renders correctly.
- `/solidLabel.html` is a test page for rendering SolidLabel elements in different configurations.
- `/elements.html` is a test page for rendering various element types side by side.
- `/index.html` is an interactive UI for testing the remote protocol:
  - It requires an HTTP server to run. The server executable is `RemotingTest_Core` from the GacUI repo.
    - If `(repo-root)\..\GacUI` exists (a sibling clone), use that: `(repo-root)\..\GacUI\Test\GacUISrc\RemotingTest_Core`.
    - Otherwise fall back to the submodule: `(repo-root)\GacUI\Test\GacUISrc\RemotingTest_Core`.
  - Start the server by running `start <GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /Http` (where `<GacUI>` is the resolved path above).
    - If anything is not right, close `/index.html`, kill the process and start it again, reopen `/index.html`.
  - You must use `start` as the process will block the powershell forever, until:
    - The "Fatal Error" button is clicked.
    - The exit button or menu is clicked.
    - The http server crashes for any reason.
  - When the server is running, you can open `/index.html` multiple times:
    - All previous unclosed `/index.htm.` will lose connection.
    - UI state is supposed to transfer to the new `/index.htm.`.

## Debugging with Playwright and index.html

- When running Playwright tests against `index.html`, you can inject `throw new Error('UNIQUE_WORD')` into the TypeScript source to locate where an error occurs.
- When the injected error is thrown, the browser will show a dialog box (from the unhandled error), and Playwright will see it. This tells you exactly where the error happens.
- Use a unique word in the error message so you can search for it and confirm which code path triggered.

## Debugging the RemotingTest_Core HTTP Server

- Always start it with the `/Http` argument.
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

- `REPO-ROOT\doc\Testing_Protocol.md` describes how the implementation of remote protocol is testing.
- `REPO-ROOT\Gaclib\website\entry\test` has many E2E test cases that start `RemotingTest_Core` and run `index.html` with playwright.
- During investigation of a bug that involves many part of the renderer, you are recommended to create a new test case like these to confirm the regression, which is also a good measurement to see if the bug is properly fixed.
- Wait time standard:
  - All tests are running against a local HTTP server, the latency is very low.
  - Starting up could take a little bit longer, 1200ms is enough.
  - 200ms is the minimum stable wait for UI refresh (tab switch, dialog open/close, post-typing settle, click). 150ms causes failures in dialog operations.
  - Keep the number small with your best effort.
  - The caret blinks in the focused text box every 500ms.
  - Before testing caret blink on/off phases, wait 1000ms (2 full blink cycles) so the caret synchronizes to a known phase. Then use 600ms intervals to capture each blink state.
  - Mouse interactions in `clickAt` use 200ms after move and 100ms after mouse-down; do not reduce these.

## TypeScript/JavaScript coding guidelines

- Always prefer strict testing, like `===` instead of `==`.
- Do not use `if (x)`, unless `x` is a boolean or nullable type.
  - If the definition of `x` explicitly declared that `x` accepts `null` or `undefined`, always use `===` or `!==` instead.
- With type rich programming utilizing the full ability of TypeScript
- Well organized using design patterns, inversion of dependency, combinators, etc
- Follows open-closed principle and DRY (Don't Repeat Yourself)
- Consistent with the rest of the project in coding style and naming convention
