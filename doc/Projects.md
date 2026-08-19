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
│   ├── codegen-remote-protocol/ ← @gaclib/codegen-remote-protocol
│   ├── remote-protocol/    ← @gaclib/remote-protocol
│   └── renderer/           ← @gaclib/renderer
└── website/
    ├── remote-protocol-http/ ← @gaclib-website/remote-protocol-http
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
@gaclib-shared/codegen ─── invokes ──→ @gaclib/codegen-remote-protocol
        │                                      │
        │ generates snapshot data              │ reads its src/Import files
        │                                      │ and generates
        │                                      ▼
        │                           @gaclib/remote-protocol
        │                           (no runtime dependencies)
        └──────────────────────────────────────┐
                                               │
                                               ▼
                                  @gaclib-website/entry snapshots

@gaclib/remote-protocol
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

Snapshot generator and root codegen orchestration package. Its codegen entry
point first invokes `@gaclib/codegen-remote-protocol`, then refreshes the entry
website snapshots and their index.

| Script | Action |
|--------|--------|
| `yarn run import` | Clean → lint → compile the snapshot generator |
| `yarn codegen` | Run remote-protocol codegen → copy snapshots → generate snapshot index |

Key files:
- `src/index.ts` — invokes remote-protocol codegen and snapshot generation
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
- `src/index.ts` — resolves the generated package output directory and runs both generators

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
- Treats an HTTP failure after connection as a terminal disconnect, stops issuing
  requests, and reports `RemoteProtocolHttpDisconnectError`

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
| `yarn codegen` | Run compiled codegen tools and refresh generated sources |
| `yarn build` | Build all non-codegen packages (includes ESLint) |
| `yarn test` | Run portable vitest tests and, on Windows, protocol E2E tests |

Run the phases in table order after changing codegen or imported inputs. Yarn 1
reserves `yarn import` for lockfile conversion, so the repository script requires
the explicit `yarn run import` form. Package order is handled automatically by
Lerna streaming.

**Important:** `yarn build` must complete before `yarn test` — tests run against
compiled output, not source. On non-Windows platforms, the website entry package
prints a skip message without starting Vitest because its checked-in protocol E2E
harness is Windows-specific. This skip is not live-browser verification.

Run `npm run start` from `Gaclib/website/entry/` after the build when a browser
needs the website.
