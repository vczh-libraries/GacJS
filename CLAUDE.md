# General Instruction

- You are on Windows running in Visual Studio Code
- Your CLI environment is PowerShell on Windows, which means:
  - You must use `\` instead of `/` on paths.
  - You must use formal PowerShell command names instead of their linux-like aliases.
  - You must use `;` instead of `&&` for executing multiple commands in order.
- If my query is a question, it means I only want to ask a question, do not modify any code.
- Before reading any file inside the `GacUI` submodule, always update it to the latest master branch first:
  - `cd (repo-root)\GacUI ; git checkout master ; git pull ; cd ..`
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
- `/solidLabel.html` is a test page for rendering SolidLabel elements in different configurations.
- `/elements.html` is a test page for rendering various element types side by side.
- `/index.html` is an interactive UI for testing the remote protocol:
  - It requires an HTTP server to run. The server executable is built from the GacUI submodule at `(repo-root)/GacUI/Test/GacUISrc/RemotingTest_Core`.
  - Start the server by running `start (repo-root)\GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /Http`.
    - If anything is not right, close `/index.html`, kill the process and start it again, reopen `/index.html`.
  - You must use `start` as the process will block the powershell forever, until:
    - The "Fatal Error" button is clicked.
    - The exit button or menu is clicked.
    - The http server crashes for any reason.
  - When the server is running, you can open `/index.html` multiple times:
    - All previous unclosed `/index.htm.` will lose connection.
    - UI state is supposed to transfer to the new `/index.htm.`.

## TypeScript/JavaScript coding guidelines

- Always prefer strict testing, like `===` instead of `==`.
- Do not use `if (x)`, unless `x` is a boolean or nullable type.
  - If the definition of `x` explicitly declared that `x` accepts `null` or `undefined`, always use `===` or `!==` instead.
- With type rich programming utilizing the full ability of TypeScript
- Well organized using design patterns, inversion of dependency, combinators, etc
- Follows open-closed principle and DRY (Don't Repeat Yourself)
- Consistent with the rest of the project in coding style and naming convention
