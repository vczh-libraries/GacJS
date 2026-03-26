# MonoRepo Guide: Debugging and Changing RemotingTest_Core.exe from GacJS

This document guides you through building, running, debugging, and testing
`RemotingTest_Core.exe` using facilities available in the GacJS repository.

**Note:** This document is most useful when your working directory is the **parent
folder** of GacJS (the mono-repo root), so that both `GacJS/` and `GacUI/` are
accessible as siblings.

---

## Which GacUI to Use

There are **two** copies of GacUI in this workspace:

| Path | Role |
|------|------|
| `../GacUI/` | **Primary** — the sibling clone. Always use this when it exists. |
| `GacUI/` | **Fallback submodule** — use only when `../GacUI` is not available. **DO NOT modify files in this submodule.** |

**Rule:** If `(repo-root)\..\GacUI` exists, always use it. All build, run, and debug
commands below assume the sibling `../GacUI`. The submodule `GacUI/` is a read-only
fallback.

Throughout this document, `<GacUI>` refers to the resolved path (sibling first,
submodule second).

---

## Essential References

Read these documents before starting any work:

| Document | Description |
|----------|-------------|
| [`<GacUI>/.github/copilot-instructions.md`](../GacUI/.github/copilot-instructions.md) | General instructions for working with the GacUI repository: environment setup, coding guidelines, and references to Building/Running/Debugging guidelines. |
| [`<GacUI>/Project.md`](../GacUI/Project.md) | GacUI project structure: the working solution (`<GacUI>/Test/GacUISrc/GacUISrc.sln`), files you must not modify, and generated folder conventions. |
| [CLAUDE.md](CLAUDE.md) | GacJS repository instructions: website build/test workflow, hosting pages, remote protocol testing, and E2E test conventions. |

---

## Building RemotingTest_Core.exe

Follow the guidelines in `<GacUI>/.github/Guidelines/Building.md`.

1. Stop any running debugger first:
   ```powershell
   & <GacUI>\.github\Scripts\copilotDebug_Stop.ps1
   ```

2. Build the solution:
   ```powershell
   cd <GacUI>\Test\GacUISrc
   & <GacUI>\.github\Scripts\copilotBuild.ps1
   ```
   This builds **Debug x64** by default. Override with `-Configuration` and `-Platform`.

3. Check the build log at `<GacUI>/.github/Scripts/Build.log`. Look for:
   ```
   Build succeeded.
       0 Error(s)
   ```

4. The built executable is at:
   ```
   <GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe
   ```

**Important:** Only use `copilotBuild.ps1` — do NOT call `msbuild` directly.

---

## Running RemotingTest_Core.exe

Follow the guidelines in `<GacUI>/.github/Guidelines/Running-CLI.md`.

### Command-Line Arguments

`RemotingTest_Core.exe` accepts two categories of arguments (in any order):

| Argument | Description | Required |
|----------|-------------|----------|
| `/Http` | Use HTTP transport (port 8888) | **Yes** — `/Http` is required for GacJS testing |
| `/Pipe` | Use named-pipe transport | Not used by GacJS |
| `/FCT` | Run **FullControlTest** (index 0) — loads `<GacUI>/Test/Resources/App/FullControlTest` | Optional (default if neither is specified) |
| `/RPT` | Run **RemoteProtocolTest** (index 1) — loads `<GacUI>/Test/Resources/App/RemoteProtocolTest` | Optional |

- `/Http` and `/Pipe` are **exclusive** — exactly one must be specified. For GacJS, always use `/Http`.
- `/FCT` and `/RPT` are **exclusive** — specify at most one. If neither is given, `/FCT` is assumed.

**Changing XML resources:** If you modify any `.xml` files under `<GacUI>/Test/Resources/App/FullControlTest`
or `<GacUI>/Test/Resources/App/RemoteProtocolTest`, you must recompile them with **GacUICompiler**
before rebuilding `RemotingTest_Core`. See [`<GacUI>/Project.md`](../GacUI/Project.md) for details.

### Starting the Server

The server blocks the terminal, so launch it with `start`:

```powershell
start <GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /FCT /Http
```

The server prints:
```
> HTTP server created, waiting on: localhost:8888
```

### Stopping the Server

```powershell
Stop-Process -Name "RemotingTest_Core" -Force -ErrorAction SilentlyContinue
```

Or use the provided script:
```powershell
& (Join-Path $PSScriptRoot "scripts\stop-test-server.ps1")
```

---

## Debugging RemotingTest_Core.exe

Follow the guidelines in `<GacUI>/.github/Guidelines/Debugging.md`.

1. Start the debugger (opens in a new PowerShell window):
   ```powershell
   cd <GacUI>\Test\GacUISrc
   start powershell {& <GacUI>\.github\Scripts\copilotDebug_Start.ps1 -Executable RemotingTest_Core}
   ```

2. Send debugger commands:
   ```powershell
   & <GacUI>\.github\Scripts\copilotDebug_RunCommand.ps1 -Command "g"
   ```

3. Useful debugger commands: `g` (continue), `kn` (call stack), `dv` (variables),
   `bp FILE:LINE` (breakpoint), `p` (step over), `t` (step in), `pt` (step out).

4. Stop the debugger:
   ```powershell
   & <GacUI>\.github\Scripts\copilotDebug_Stop.ps1
   ```

**Important:** Never use `q`/`qd`/`qq` — always use `copilotDebug_Stop.ps1`.

---

## Building and Running the GacJS Website

The website connects to `RemotingTest_Core.exe /Http` on `localhost:8888`.

### Build

```powershell
cd Gaclib
yarn build
```

This compiles TypeScript, copies assets, and bundles with esbuild. After a successful
build the website is accessible at `http://localhost:8896`.

If the dev server is not running, host the files manually:
```powershell
cd Gaclib\website\entry\lib\dist
npx serve -l 8896
```

### Connect to RemotingTest_Core

1. Start the C++ server: `start <GacUI>\...\RemotingTest_Core.exe /FCT /Http`
2. Open `http://localhost:8896/index.html` in a browser.
3. The GacUI application UI renders in the browser via the remote protocol.

### Run E2E Tests

The E2E tests automatically start and stop `RemotingTest_Core.exe /FCT /Http` — you
do NOT need to start the server manually.

```powershell
cd Gaclib\website\entry
npx vitest run
```

Or run a specific test:
```powershell
cd Gaclib\website\entry
npx vitest run Testing_Protocol_SimpleTyping.js
```

Test files are in `Gaclib/website/entry/test/Testing_Protocol_*.js`. The shared
lifecycle (`setupProtocolTest()` in `Testing_Protocol.js`) handles server startup,
browser launch, and teardown.

---

## Git Workflow

After every piece of work, **git commit and git push to the current branch** in both
repos are required.

### Repository Layout

| Path | Type |
|------|------|
| `../GacUI/` | Normal git repository (sibling clone) |
| `./` (GacJS) | Normal git repository |
| `GacUI/` | **Git submodule** inside GacJS, pointing at a specific commit of the GacUI repo |

### Working with the Sibling `../GacUI`

This is a normal repository. The standard workflow applies:

```powershell
cd ../GacUI
git add -A
git commit -m "your message"
git push origin <current-branch-name-for-GacUI>
```

### Working with the Submodule `GacUI/`

**WARNING**: You should not work on this submodule when `../GacUI` is available.

The submodule `GacUI/` tracks a specific commit. After cloning or pulling GacJS,
bring it up to date with the latest `master` of the remote GacUI repo:

```powershell
cd GacJS
git submodule update --init --remote
```

- `--init` initializes the submodule if it hasn't been set up yet.
- `--remote` fetches the latest commit from the remote tracking branch (typically `master`).

**Detached HEAD warning:** After `git submodule update`, the submodule is always in
**detached HEAD** state — it checks out a specific commit, not a branch. If you need
to make changes inside the submodule, you must checkout `master` first:

```powershell
cd GacUI                          # enter the submodule
git checkout master               # attach to the master branch
# ... make your changes ...
git add -A
git commit -m "your message"
git push origin master            # push to the remote GacUI repo
```

Then go back to GacJS and record the updated submodule commit:

```powershell
cd ..                             # back to GacJS root
git add GacUI                     # record the new submodule commit
git commit -m "update GacUI submodule"
git push origin <current-branch-name-for-GacJS>
```

**Important:** If you commit while in detached HEAD without checking out a branch
first, your commits will be orphaned and eventually garbage-collected. Always
`git checkout master` inside the submodule before committing.
