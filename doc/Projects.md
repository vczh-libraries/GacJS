# Project Structure

This monorepo builds a web-based renderer for [GacUI](https://github.com/vczh-libraries/GacUI)'s
remote protocol — an X-window-like protocol that allows a GacUI application to
render its UI in another process (here, a web browser).

The C++ GacUI repo is expected at `..\GacUI`, next to this GacJS checkout.
Treat it as a separate repository when building or changing the core application.

Workflow RPC documentation starts with [the RPC overview](rpc/README.md). See
[Verifying an RPC Implementation with Workflow](rpc/VerifyRpcWithWorkflow.md)
for the cross-language conformance procedure.

---

## Monorepo Layout

The monorepo root is `Gaclib/` and uses **Lerna** with **Yarn workspaces**.

```
Gaclib/
├── package.json            ← monorepo root (workspace: shared/*, gaclib/*, rpc-test/*, website/*)
├── shared/
│   ├── codegen/            ← @gaclib-shared/codegen
│   └── eslint-shared/      ← @gaclib-shared/eslint-shared
├── gaclib/
│   ├── codegen-remote-protocol/ ← @gaclib/codegen-remote-protocol
│   ├── codegen-workflow-rpc/ ← @gaclib/codegen-workflow-rpc
│   ├── remote-protocol/    ← @gaclib/remote-protocol
│   ├── renderer/           ← @gaclib/renderer
│   └── workflow-rpc/       ← @gaclib/workflow-rpc
├── rpc-test/
│   ├── rpc-test-cases/     ← @gaclib-rpc-test/rpc-test-cases
│   └── rpc-test-cli/       ← @gaclib-rpc-test/rpc-test-cli
└── website/
    ├── remote-protocol-http/ ← @gaclib-website/remote-protocol-http
    ├── rvm/                ← @gaclib-website/rvm
    ├── rvmhost/            ← @gaclib-website/rvmhost
    └── entry/              ← @gaclib-website/entry
```

Remote-protocol import inputs:

```
..\GacUI\Source\PlatformProviders\Remote\Protocol\Metadata\Protocols.json
..\GacUI\Source\Compiler\RemoteProtocol\Generated\GuiRemoteProtocolAst_Json.d.ts
        │
        └── yarn run import
              └── Gaclib/gaclib/codegen-remote-protocol/src/Import/
                    ├── Protocols.json
                    └── GuiRemoteProtocolAst_Json.d.ts
```

The imported files retain their upstream names and are committed with the
generator package.

---

## Dependency Graph

```
@gaclib-shared/codegen
        ├── invokes @gaclib/codegen-remote-protocol
        │       └── generates @gaclib/remote-protocol
        ├── invokes @gaclib/codegen-workflow-rpc
        │       ├── generates @gaclib-website/rvm
        │       └── generates @gaclib-rpc-test/rpc-test-cases bindings/registry
        └── generates @gaclib-website/entry snapshots

@gaclib/remote-protocol
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
@gaclib/renderer             @gaclib-website/remote-protocol-http
        │                                      │
        └──────────┬───────────────────────────┘
                   ▼
        @gaclib-website/entry

@gaclib/workflow-rpc ────────→ @gaclib-website/rvm
        │                              │
        └──────────┬───────────────────┘
                   ▼
        @gaclib-website/rvmhost ──────→ @gaclib-website/remote-protocol-http
                   │
                   └──────────────────→ @gaclib-website/entry

@gaclib/workflow-rpc ────────→ @gaclib-rpc-test/rpc-test-cases
                                          │
                                          ▼
                               @gaclib-rpc-test/rpc-test-cli
                                          ▲
@gaclib-website/remote-protocol-http ─────┘
```

`@gaclib-shared/eslint-shared` is a dev dependency of every other package.

---

## Packages

### @gaclib-shared/codegen

**Path:** `Gaclib/shared/codegen/`

Snapshot generator and root codegen orchestration package. Its codegen entry
point invokes both contract generators, generates every indexed Workflow RPC
conformance binding and its exact registry, then refreshes the entry website
snapshots and their index.

| Script | Action |
|--------|--------|
| `yarn run import` | Clean → lint → compile the snapshot generator |
| `yarn codegen` | Run remote-protocol/RPC codegen → copy snapshots → generate snapshot index |

Key files:
- `src/index.ts` — resolves the `@gaclib/remote-protocol` source directory, invokes both remote-protocol generators, and then runs snapshot generation
- `src/snapshots.ts` — generates snapshot file index

---

### @gaclib/codegen-remote-protocol

**Path:** `Gaclib/gaclib/codegen-remote-protocol/`

Code generator that owns the imported protocol metadata and produces the
TypeScript schema and invocation/parsing files for `@gaclib/remote-protocol`.
The package is compiled during the import phase and is executed by
`@gaclib-shared/codegen` during the codegen phase.

| Script | Action |
|--------|--------|
| `yarn run import` | Run `prepare.js` → clean → lint → compile the generator |

The package deliberately has no `build` or `codegen` script. Key files:

- `prepare.js` — refreshes `src/Import/Protocols.json` and `src/Import/GuiRemoteProtocolAst_Json.d.ts` from GacUI
- `src/generateRemoteProtocol.ts` — generates type definitions and enums
- `src/generateRemoteProtocolInvoking.ts` — generates protocol invocation/parsing code
- `src/index.ts` — exports both generator functions without selecting an output directory or running them

---

### @gaclib/codegen-workflow-rpc

**Path:** `Gaclib/gaclib/codegen-workflow-rpc/`

Parses normalized Workflow `RpcMetadata.txt`, cross-checks the corresponding
serialization `.d.ts`, validates IDs, inheritance, properties, events, transfer
modes, and schema shapes, and emits deterministic TypeScript bindings. The
generator is contract-independent. Its copied fixtures and generated-runtime
tests cover primitives, values, inheritance, overloads, callbacks, properties,
events, and value/reference collections; unsupported by-value `T{}` and
by-reference read-only dictionaries fail with source-located diagnostics.

| Script | Action |
|--------|--------|
| `yarn run import` | Clean → lint → compile the generator source |
| `yarn test` | Lint and run copied-fixture parser, validation, emission, generated-runtime, and type-check tests after the Workflow RPC runtime build |

It deliberately has no `build` or `codegen` script. The shared codegen package
invokes its compiled API and owns the output location.

---

### @gaclib-shared/eslint-shared

**Path:** `Gaclib/shared/eslint-shared/`

Shared ESLint configuration used by all packages. Enforces:
- Strict boolean expressions (no implicit truthy/falsy)
- Single quotes for strings
- TypeScript strict mode with targeted exceptions
- Private (not published to npm)

---

### @gaclib/remote-protocol

**Path:** `Gaclib/gaclib/remote-protocol/`

**Entirely generated** — do not modify directly. Regenerate with `yarn codegen`.

Provides:
- TypeScript types for every protocol struct, enum, and union
- `IRemoteProtocolRequests` — interface for receiving messages/requests from core
- `IRemoteProtocolResponses` — interface for sending responses back to core
- `IRemoteProtocolEvents` — interface for sending events to core
- `jsonToRequest()` — deserializes JSON into request calls
- `ResponseToJson` / `EventToJson` — serializes responses/events to JSON

See [Protocol.md](Protocol.md) for the protocol reference.

| Script | Action |
|--------|--------|
| `yarn build` | Clean → lint → compile (tsc) |
| `yarn test` | Run vitest tests |

---

### @gaclib/renderer

**Path:** `Gaclib/gaclib/renderer/`

The HTML renderer — converts remote protocol messages into DOM manipulation.
This is the main rendering engine of the project.

Key responsibilities:
- Maintains a virtual DOM tree mapped from `RenderingDom`
- Renders each element type (SolidBorder, SolidLabel, ImageFrame, etc.) to HTML/CSS
- Handles mouse/keyboard input events and forwards them as protocol events
- Measures fonts, text sizes, and images and reports measurements back to core
- Manages element lifecycle (create → describe → bind → destroy)

See [DOM.md](DOM.md) for detailed rendering documentation.

| Script | Action |
|--------|--------|
| `yarn build` | Clean → lint → compile (tsc) |
| `yarn test` | Run vitest tests |

Main export: `createHtmlRenderer(settings: GacUISettings): IGacUIRenderer`

---

### @gaclib/workflow-rpc

**Path:** `Gaclib/gaclib/workflow-rpc/`

Browser/Node-neutral Workflow RPC runtime. It owns strict JSON codecs, endpoint
initialization and routing, concurrent request correlation, exceptions, service
declarations, object holds, proxy interning/disposal/finalization, events,
by-value slots, and asynchronous adapters for all predefined collection types.
Contract-specific IDs and call surfaces remain generated.

| Script | Action |
|--------|--------|
| `yarn build` | Clean → lint → compile |
| `yarn test` | Run in-memory routing, callback, event, collection, and lifecycle tests |

See [Workflow RPC features](rpc/Features.md), [memory management](rpc/MemoryManagement.md),
and [code generation](rpc/CodeGeneration.md) for the runtime and binding contracts.

---

### @gaclib-rpc-test/rpc-test-cases

**Path:** `Gaclib/rpc-test/rpc-test-cases/`

Workflow RPC conformance contracts and service behavior. The root codegen phase
reads the authoritative Workflow x64 index, normalized metadata, and serialization
schemas and generates an isolated binding for every case plus an exact ordered
registry. Handwritten factories translate the shared/service Workflow behavior;
the collection families share parameterized helpers while special cases keep
dedicated implementations.

| Script | Action |
|--------|--------|
| `yarn build` | Clean → lint → compile generated bindings and handwritten services |
| `yarn test` | Verify exact index/selector coverage and setup ordering |

The package has no `import` or `codegen` script: generator compilation belongs to
the root import phase, and `@gaclib-shared/codegen` owns its generated output.

---

### @gaclib-rpc-test/rpc-test-cli

**Path:** `Gaclib/rpc-test/rpc-test-cli/`

Node-only Workflow RPC conformance provider. Its CLI accepts one generated case
name and implements strict stdio admission for the `WorkflowRpcStdioTest` channel.
The integration harness builds Workflow's Debug x64 test solution, exercises a
quoted service path containing spaces, launches `RpcStdioTest_Driver`, and checks
the dynamic pass/skip partition against the Workflow index and approved destructor
skip list.

| Script | Action |
|--------|--------|
| `yarn build` | Clean → lint → compile the provider and integration harness |
| `yarn test` / `npm run test` | Run framing/unit tests and the Workflow driver conformance suite |

This package depends on `rpc-test-cases`, the browser-neutral channel codec from
`remote-protocol-http`, and `workflow-rpc`. Node APIs remain outside those reusable
packages. See [Verifying RPC with Workflow](rpc/VerifyRpcWithWorkflow.md).

---

### @gaclib-website/remote-protocol-http

**Path:** `Gaclib/website/remote-protocol-http/`

HTTP transport layer for the remote protocol. **This exists for demo/testing only**
and is not part of the protocol design.

Wraps `@gaclib/remote-protocol` with an HTTP client that:
- Sends responses/events via `POST` to the core HTTP server
- Long-polls for requests from the core via `POST`
- Processes a server package piggybacked on a `POST` response when the core produces an immediate reply while handling that event/response
- Negotiates a VlppOS channel connection via `GET /GacUIRemoteProtocolHttp/VlppInterProcess/Connect`
- Treats an HTTP failure after connection as a terminal disconnect, stops issuing
  requests, and reports `RemoteProtocolHttpDisconnectError`

The `./channel` export contains only the browser/Node-neutral channel contract
and package codec; `./http-channel` adds the reusable `HttpChannelClient`
without importing renderer bindings. Both are renderer-neutral,
support multiple advertised channel names and complete direct/broadcast framing,
and can be used independently by the RVM host. The renderer adapter composes the
channel client rather than inheriting from it.

Main export: `connectHttpServer(host, requests): Promise<IRemoteProtocolHttpClient>`

The corresponding C++ source project is
`..\GacUI\Test\GacUISrc\RemotingTest_Core`. The Windows Debug executable is
`..\GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe` and accepts `/Http` or
`/MiniHttp`. The Linux/macOS output is
`..\GacUI\Test\Linux\RemotingTest_Core\Bin\RemotingTest_Core` and uses
`/MiniHttp`.

| Script | Action |
|--------|--------|
| `yarn build` | Clean → lint → compile (tsc) |
| `yarn test` | Run vitest tests |

---

### @gaclib-website/rvm

**Path:** `Gaclib/website/rvm/`

Stable package boundary for the generated RemoteViewModelTest contract. Its
manifest-owned `src/generated/` subtree is produced from the sibling GacUI x86
RPC metadata and exports local/proxy interfaces, exact IDs, codecs, descriptors,
and service registration/request helpers.

| Script | Action |
|--------|--------|
| `yarn build` | Clean → lint → compile |
| `yarn test` | Verify the generated service through an in-memory RPC broker |

---

### @gaclib-website/rvmhost

**Path:** `Gaclib/website/rvmhost/`

Implements `rvmt::IViewModel.Translate` as `Hello, <name>!`. The public `.`
export is browser-safe and accepts a generic channel client. The Node-only CLI
supports independently started HTTP/MiniHTTP network mode and exact `/Cli`
stdio mode. Its build also creates a stable platform-native Node SEA launcher:
`lib/bin/gacjs-rvmhost.exe` on Windows or `lib/bin/gacjs-rvmhost` on Linux/macOS.
On macOS, Homebrew's dynamically linked Node launcher does not contain the SEA
injection fuse. The build downloads the matching official Node archive from
`nodejs.org`, verifies it against `SHASUMS256.txt`, and caches its standalone
binary under the package's ignored `node_modules/.cache` directory before
injecting the application blob. Injection always uses a writable temporary copy.

| Script | Action |
|--------|--------|
| `yarn build` | Clean → lint → compile → bundle CLI → build/inject native SEA |
| `yarn test` | Verify fake-channel/session ordering, network cancellation, strict/fatal stdio behavior, Core transcript, toolchain capability checks, and the native launcher |

Run `node lib/src/cli.js` for an independently started network host. The package
bin points to that normal Node CLI. It is not a Core launcher. For
`RemotingTest_Core /RVMT <renderer-transport> /Cli:<path>`, pass the absolute SEA
path as the single executable value; Core appends exact ` /Cli`, and stdout is
reserved for protocol frames.

---

### @gaclib-website/entry

**Path:** `Gaclib/website/entry/`

The website application that integrates the renderer and HTTP client.
After building, the website is generated in
`Gaclib/website/entry/lib/dist/`. Run `npm run start` from
`Gaclib/website/entry/` to serve that directory at `http://localhost:8896`;
press ENTER to stop it. The command is portable across Windows, Linux, and
macOS. On Windows, IIS may already own port `8896`; in that case the command
reports that IIS may already be serving the site. The generated directory must
be the document root because the HTML pages use absolute paths such as
`/index.js`.

**HTML pages:**

| Page | Purpose |
|------|---------|
| `/index.html` | Interactive UI — connects to the C++ HTTP server for live rendering |
| `/index.html?rvmhost` | Starts the generated TypeScript RVM host and a separate renderer client in the page |
| `/snapshots.html` | Snapshot viewer — renders saved rendering traces from `assets/snapshots/` |
| `/solidLabel.html` | Standalone test page for SolidLabel element rendering configurations |
| `/elements.html` | Standalone test page for various element type rendering |

**Global variable:** The esbuild bundle exposes a `GacUIHtmlRenderer` IIFE global
containing all exports from `src/index.ts`:

| Export | Description |
|--------|-------------|
| `runGacUI(settings)` | Initialize renderer + HTTP client and start the session |
| `runRvmGacUI(settings)` | Return a stoppable session immediately while a browser RVM host acquires its service and connects a separate renderer |
| `isShortcutReservedForBrowser(event)` | Filter keyboard events that should pass through to the browser |
| `GacUIHtmlRendererExitError` | Error class thrown on graceful exit |
| `RemoteProtocolHttpDisconnectError` | Error class reported when the HTTP core disconnects |
| `applyBounds(element, rect)` | Apply positioning CSS to an HTML element |
| `applyTypedStyle(element, desc)` | Apply element-type-specific CSS |
| `applyFeatureGates(gates)` | Set runtime feature flags |
| `Snapshot` | Snapshot index data |
| `createTreeElement(...)` | Build a tree-view UI component |
| `readSnapshot(...)` | Parse snapshot file structure |
| `readFrames(...)` | Parse rendering trace frames |
| `renderUI(...)` | Render a single snapshot frame |

| Script | Action |
|--------|--------|
| `yarn build` | Compile → copy assets → esbuild (dev mode) |
| `yarn build-ship` | Compile → copy assets → esbuild (minified, no sourcemaps) |
| `npm run start` | Serve `lib/dist` on port 8896 until ENTER is pressed |

---

## Build & Test Commands

All commands run from `Gaclib/`:

| Command | Description |
|---------|-------------|
| `yarn run import` | Refresh upstream imports and compile codegen-tool packages |
| `yarn codegen` | Run compiled codegen tools, including Workflow RPC conformance bindings, and refresh generated sources |
| `yarn build` | Build all non-codegen packages (includes ESLint) |
| `yarn test` | Run portable vitest tests and, on Windows, protocol E2E tests |

For ordinary GacJS changes, run `yarn build` and `yarn test`. Run `yarn run import`
and `yarn codegen` before those commands whenever generator inputs or generated
outputs need synchronization, including Workflow RPC conformance work and sibling
GacUI updates. Yarn 1
reserves `yarn import` for lockfile conversion, so the repository script requires
the explicit `yarn run import` form. Package order is handled automatically by
Lerna streaming.

**Important:** `yarn build` must complete before `yarn test` — tests run against
compiled output, not source. On non-Windows platforms, the website entry package
prints a skip message without starting Vitest because its checked-in protocol E2E
harness is Windows-specific. This skip is not live-browser verification.

Run `npm run start` from `Gaclib/website/entry/` after the build when a browser
needs the website.
