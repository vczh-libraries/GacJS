# Project Structure

This monorepo builds a web-based renderer for [GacUI](https://github.com/vczh-libraries/GacUI)'s
remote protocol — an X-window-like protocol that allows a GacUI application to
render its UI in another process (here, a web browser).

The C++ GacUI repo is expected at `..\GacUI`, next to this GacJS checkout.
Treat it as a separate repository when building or changing the core application.

---

## Monorepo Layout

The monorepo root is `Gaclib/` and uses **Lerna** with **Yarn workspaces**.

```
Gaclib/
├── package.json            ← monorepo root (workspace: shared/*, gaclib/*, website/*)
├── shared/
│   ├── codegen/            ← @gaclib-shared/codegen
│   └── eslint-shared/      ← @gaclib-shared/eslint-shared
├── gaclib/
│   ├── remote-protocol/    ← @gaclib/remote-protocol
│   └── renderer/           ← @gaclib/renderer
└── website/
    ├── remote-protocol-http/ ← @gaclib-website/remote-protocol-http
    └── entry/              ← @gaclib-website/entry
```

External inputs:

```
Import/
└── Metadata/
    └── RemoteProtocol.json   ← protocol schema (consumed by codegen)
..\GacUI\                     ← sibling C++ GacUI repository
```

---

## Dependency Graph

```
@gaclib-shared/codegen ─── reads ──→ Import/Metadata/RemoteProtocol.json
        │
        │ generates
        ▼
@gaclib/remote-protocol            (no runtime dependencies)
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
@gaclib/renderer             @gaclib-website/remote-protocol-http
        │                                      │
        └──────────┬───────────────────────────┘
                   ▼
        @gaclib-website/entry
```

`@gaclib-shared/eslint-shared` is a dev dependency of every other package.

---

## Packages

### @gaclib-shared/codegen

**Path:** `Gaclib/shared/codegen/`

Code generator that reads `Import/Metadata/RemoteProtocol.json` and produces
the TypeScript files for `@gaclib/remote-protocol`. Also generates snapshot
index data for the entry website.

| Script | Action |
|--------|--------|
| `yarn codegen` | Clean → lint → compile → **run generator** |
| `yarn build` | Clean → lint (no execution) |

Key files:
- `src/remote-protocol/generateRemoteProtocol.ts` — generates type definitions and enums
- `src/remote-protocol/generateRemoteProtocolInvoking.ts` — generates protocol invocation/parsing code
- `src/snapshots.ts` — generates snapshot file index

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

### @gaclib-website/remote-protocol-http

**Path:** `Gaclib/website/remote-protocol-http/`

HTTP transport layer for the remote protocol. **This exists for demo/testing only**
and is not part of the protocol design.

Wraps `@gaclib/remote-protocol` with an HTTP client that:
- Sends responses/events via `POST` to the core HTTP server
- Long-polls for requests from the core via `POST`
- Processes a server package piggybacked on a `POST` response when the core produces an immediate reply while handling that event/response
- Negotiates a VlppOS channel connection via `GET /GacUIRemoteProtocolHttp/VlppInterProcess/Connect`

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

---

### @gaclib-website/entry

**Path:** `Gaclib/website/entry/`

The website application that integrates the renderer and HTTP client.
After building, the website is generated in
`Gaclib/website/entry/lib/dist/`. On Windows, IIS normally serves this directory
on `localhost:8896`; if IIS is unavailable, use a local static-file server. On
Linux and macOS, building does not start a server, so serve this directory
explicitly. It must be the document root because the HTML pages use absolute
paths such as `/index.js`.

**HTML pages:**

| Page | Purpose |
|------|---------|
| `/index.html` | Interactive UI — connects to the C++ HTTP server for live rendering |
| `/snapshots.html` | Snapshot viewer — renders saved rendering traces from `assets/snapshots/` |
| `/solidLabel.html` | Standalone test page for SolidLabel element rendering configurations |
| `/elements.html` | Standalone test page for various element type rendering |

**Global variable:** The esbuild bundle exposes a `GacUIHtmlRenderer` IIFE global
containing all exports from `src/index.ts`:

| Export | Description |
|--------|-------------|
| `runGacUI(settings)` | Initialize renderer + HTTP client and start the session |
| `isShortcutReservedForBrowser(event)` | Filter keyboard events that should pass through to the browser |
| `GacUIHtmlRendererExitError` | Error class thrown on graceful exit |
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

---

## Build & Test Commands

All commands run from `Gaclib/`:

| Command | Description |
|---------|-------------|
| `yarn codegen` | Regenerate `@gaclib/remote-protocol` from `RemoteProtocol.json` |
| `yarn build` | Build all packages (includes ESLint) |
| `yarn test` | Run portable vitest tests and, on Windows, protocol E2E tests |

Package build order is handled automatically by Lerna streaming.

**Important:** `yarn build` must complete before `yarn test` — tests run against
compiled output, not source. On non-Windows platforms, the website entry package
prints a skip message without starting Vitest because its checked-in protocol E2E
harness is Windows-specific. This skip is not live-browser verification.
