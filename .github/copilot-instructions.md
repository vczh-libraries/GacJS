# General Instruction

- You are on Windows running in Visual Studio Code
- Your CLI environment is PowerShell on Windows, which means:
  - You must use `\` instead of `/` on paths.
  - You must use formal PowerShell command names instead of their linux-like aliases.
  - You must use `;` instead of `&&` for executing multiple commands in order.
- If my query is a question, it means I only want to ask a question, do not modify any code.

## About this repo

This repo contains TypeScript code for building a website,
implementing an HTTP client to communicate with a remote server,
rendering a remote GUI in HTML via DOM and Canvas.

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
  - `(repo-root)/Gaclib/gaclib/remote-protocol` is completedly generated:
    - DO NOT modify anything in this package.
    - If you find anything wrong, update `(repo-root)/Gaclib/shared/codegen/src/**/*.ts` and run `yarn codegen`.
    - It consumes `(repo-root)/Import/Metadata/RemoteProtocol.json` to generate remote protocol schema and parsing code.
    - This package serves everything around remote protocol definition and parsing.
  - `(repo-root)/Gaclib/gaclib/renderer`:
    - This package serves HTML rendering by manipulating DOM dynamically.
  - `(repo-root)/Gaclib/website/entry`:
    - The website for testing.
  - `(repo-root)/Gaclib/website/remote-protocol-http`:
    - A bundle to support the website, wrapping all packages in `(repo-root)/Gaclib/gaclib/` with a simple API design.

## Hosting the Website

- `/snapshots.html` is to view and render snapshots in `(repo-root)/Gaclib/website/entry/assets/snapshots`.
- `/solidLabel.html` is a test page for rendering labels in different configuration.
- `/index.html` is an interactive UI for testing the remote protocol:
  - It requires an http server to run, which is not in this repo.
  - Start the server by running `start (repo-root)\..\GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /Http`.
  - You must use `start` as the process will block the powershell forever, until:
    - The "Fetal Error" button is clicked.
    - The exit button or menu is clicked.
    - The http server crashes for any reason.
  - When the server is running, you can open `/index.html` multiple times:
    - All previous unclosed `/index.htm.` will lose connection.
    - UI state is supposed to transfer to the new `/index.htm.`.

## TypeScript/JavaScript coding guidelines

- Always prefer strict testing, like `===` instead of `==`.
- Do not use `if (x)`, unless `x` is a boolean or nullable type.
  - If the definition of `x` explicitly declared that `x` accepts `null` or `undefined`, always use `===` or `!==` instead.
- With type rich programming ultilizing the full ability of TypeScript
- Well organized using design patterns, invers of dependency, combinators, etc
- Follows open-closed principle and DRY (Don't Repeat Yourself)
- Consistent with the rest of the project in coding style and naming convention

### ASCII Art in Test Cases

- Add ASCII art for all `IVirtualDom` building test cases except:
  - The test case is designed for testing exceptions.
  - The test case builds only one `IVirtualDom` from the root `RenderingDom`, no child nodes added.
- Rectangles represents all `IVirtualDom` instances in a tree.
- Each rectangle must be smaller but big enough to print the ID path.
- When there are multiple `IVirtualDom`, the shapes don't have to maintain ratios of values.
- Each rectangle prints the full path of IDs from the first child of the root all the way to itself.
- When two `IVirtualDom` are created from one `RenderingDom`:
  - The outer one prints the full path of IDs.
  - The inner one prints the full path of IDs following a 'v' character, no space is needed.
- A rectangle consists of multiple `+`, `-` and `|` characters.
  - In the same graph, save value of `x1` and `x2` across multiple rectangles must be in the same column.
  - Different values must be in different columns.
  - Same for `y1` and `y2` about rows.
