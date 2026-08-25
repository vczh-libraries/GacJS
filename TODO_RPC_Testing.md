- Follow `doc/rpc/README.md` to create the test facility.
- Run the tests with `RpcStdioTest_Service` in `Workflow` to make sure `Gaclib/gaclib/(codegen-)?workflow-rpc` works correctly.
- Add `doc/rpc/README.md` to `Project.md` and `AGENTS.md` as part of indexed documents.
- Fix `doc/rpc/README.md` according to comments in it.
- Existing documents in `doc/rpc` describe general implementation details; add `VerifyRpcWithWorkflow` to describe how the testing is done.
  - Just like the other sibling documents, it will be offered as guidance for implementing view models in other languages.
  - You can talk TypeScript related things.
  - No need to talk too much about GacJS details.
- Try your best to make all test cases run. If anything cannot be done purely in `GacJS`, add these cases to `Workflow/Test/StartRpcStdio_DtorSkipList.txt`.
  - Keep this file as a skip list of reasonable test cases to skip.
  - It should contain only test cases that the target programming language (TypeScript in this task) cannot satisfy.
  - For example, the order of calling destructors is already listed in this file.
- You must limit all changes to `GacJS`, except for `Workflow/Test/StartRpcStdio_DtorSkipList.txt`, or fixes to `RpcStdioTest_Driver` if the current code cannot start `rpc-test-cli` properly.
- `npm run test` in `rpc-test-cli` should start `RpcStdioTest_Driver`, assuming `Workflow` is cloned as a sibling folder to `GacJS`.
  - This should work like the E2E tests in `Gaclib/website/entry` that launch GacUI test applications.
- Commit and push all local changes once finished.

## DETAILS

### Scope and terminology

- `Project.md` above means the existing `doc/Projects.md`; there is no `Project.md` at the GacJS repository root.
- Create the new guidance as `doc/rpc/VerifyRpcWithWorkflow.md` and link it from the other RPC document indexes.
- The cross-language topology is:
  - Workflow's `RpcStdioTest_Driver` is the requester, test orchestrator, and result oracle.
  - The new GacJS `rpc-test-cli` replaces Workflow's `RpcStdioTest_Service` as the service provider. Do not launch the C++ service for the TypeScript conformance run.
  - The driver accepts a service command and an optional skip-list path, iterates `Workflow/Test/Resources/IndexRpc.txt`, and appends exactly one case name whenever it launches the service command.
- Keep implementation changes in GacJS. Change the sibling Workflow repository only when adding an intrinsically unsupported TypeScript case to the approved skip list, or when an observed command-line/path quoting problem requires a narrowly scoped `RpcStdioTest_Driver` fix. Commit the two repositories separately if both change.

### Workspace and package layout

- Add `Gaclib/rpc-test/rpc-test-cases` and `Gaclib/rpc-test/rpc-test-cli` as workspace packages, and add `rpc-test/*` to both `Gaclib/package.json` and `Gaclib/lerna.json`. Update `Gaclib/yarn.lock` through Yarn.
- `rpc-test-cases` owns the generated binding for every indexed Workflow case, the handwritten TypeScript translations of each case's shared/service behavior, and an exact case registry. Use shared helpers/factories for the large collection-test families instead of copying equivalent implementations.
- `rpc-test-cli` is Node-only. It owns the executable service entry point and the integration harness that launches Workflow's driver. Keep Node APIs and stdio code out of the browser/Node-neutral dependency graph of `@gaclib/workflow-rpc`.
- Preserve the root phase boundaries: code-generation tools compile during `yarn run import`; `Gaclib/shared/codegen` produces the RPC test bindings and registry during `yarn codegen`; the new runtime packages compile during `yarn build`; conformance execution belongs to `yarn test`/`npm run test`.

### Test-case generation and handwritten services

- Treat `Workflow/Test/Resources/IndexRpc.txt` as the authoritative ordered case set. Parse each nonempty line as one unique `<case>=<expected-result>` entry and fail with an actionable diagnostic for malformed or duplicate names.
- For the default Debug x64 driver, generate each case from the matching files in `Workflow/Test/Generated/RpcMetadata64`:
  - `Metadata_<case>.txt` is the normalized RPC contract.
  - `Serialization_<case>.d.ts` is the complementary serialization schema.
  - Do not use the inaccurately documented `.txt` extension for the serialization schema, and do not treat either input as sufficient by itself.
- Generate all indexed cases, including runtime-skipped cases. Give every case its own output directory/manifest because the current generator emits the same `generated.ts` filename and manifest for every contract; reusing one output root would overwrite a case and delete earlier cases as stale. Emit a deterministic selector/registry, remove only stale manifest-owned files, and make missing handwritten service registrations fail the TypeScript build.
- Translate the behavior in `Workflow/Test/Resources/Rpc/<case>.txt` and `<case>_Service.txt` into TypeScript. The generated contract supplies types, descriptors, and IDs; it does not replace shared helper functions or `serviceMain` behavior.
- Configure the selected generated contract and register its local constructor service or services before calling `RpcEndpoint.initialize()`. Use generated descriptors and registration helpers rather than handwritten wire IDs.
- Generalize the code generator's current GacUI-specific missing-input diagnostic so missing Workflow conformance inputs identify the actual file and required prerequisite.
- Fix generator/runtime/service defects exposed by the conformance suite. A feature that is merely unimplemented or difficult is not a valid reason to skip its cases.

### Stdio service contract

- The CLI accepts exactly the one case-name argument appended by the driver. Reject a missing, extra, or unknown argument with diagnostics on stderr and a nonzero exit code.
- Advertise exactly the `WorkflowRpcStdioTest` channel. This test service does not use the RVM host's `ViewModelChannel`, `ViewModelReadyChannel`, or `Ready` handshake.
- Construct the RPC endpoint with `channelName: 'WorkflowRpcStdioTest'`; its existing default is the unrelated `ViewModelChannel`.
- Implement the `StdioRedirectionClient` side of the existing protocol: canonical Base64 lines containing one complete strict-UTF-8 `NetworkPackage`, buffered LF/CRLF reads, assignment parsing, ordered writes, channel-message queuing, and the existing direct-message envelope validation. Reuse or refactor the checked-in package/framing implementation where practical, but do not reuse its hard-coded RVM channels or shutdown policy unchanged.
- Reserve the service child's stdout exclusively for protocol frames; all diagnostics go to stderr. Install the reader before sending the channel-join package, wait for assignment before constructing the endpoint, and keep dispatching while endpoint initialization waits for the broker login.
- Treat the driver's normal `!Exit`/disconnect after a completed case as orderly endpoint finalization and exit successfully. Malformed decoded packages, protocol failures, unexpected disconnects, and service failures must terminate nonzero without adding recovery, retries, delays, or heartbeat behavior.

### Driver integration and skip policy

- Make `npm run test` in `rpc-test-cli` run the conformance integration test. It must resolve the sibling `Workflow` checkout without depending on the caller's current directory, build the required Debug x64 Workflow test solution with Workflow's prescribed build script, and launch `RpcStdioTest_Driver.exe` with:
  - one correctly quoted service-command argument containing the current Node executable and the built GacJS CLI entry point; and
  - `Workflow/Test/StartRpcStdio_DtorSkipList.txt` as the optional skip-list argument.
- The driver, not the npm test harness, appends each case name to the service command. Exercise paths containing spaces when validating command construction. Attempt the existing driver contract first; modify the driver only after reproducing a quoting/launch failure that cannot be fixed in the GacJS harness.
- Fail the integration test for a nonzero driver exit, a mismatch, a missing/duplicated case, an unexpected skipped case, or a child launch/protocol failure. Capture enough driver output to identify the failing case without writing protocol diagnostics to the child stdout stream.
- Keep `StartRpcStdio_DtorSkipList.txt` limited to semantics TypeScript cannot guarantee, such as deterministic destructor timing/order. Every added entry must be an exact `IndexRpc.txt` name and have its language limitation explained in `VerifyRpcWithWorkflow.md`. Do not add cases merely to make the test pass. At review time the upstream index has 126 cases and the existing destructor list has 8 entries; derive these sets dynamically so later Workflow additions cannot disappear silently.

### Documentation corrections

- In `doc/rpc/README.md`, replace the document-list placeholder with links to `Features.md`, `MemoryManagement.md`, `CodeGeneration.md`, and `VerifyRpcWithWorkflow.md`.
- Preserve the marked text that the embedded comment says not to change unless a factual error is present, but correct these factual errors while completing the task:
  - Use the actual case-sensitive attributes `@rpc:Interface` and `@rpc:Ctor`.
  - GacGen writes the architecture-specific metadata below `Resource.xml.log/x32` and `Resource.xml.log/x64`, rather than placing both files directly in `Resource.xml.log`.
  - x86 and x64 metadata can differ because `vint` resolves to 32-bit or 64-bit schema types. Use metadata matching the tested driver ABI; the required default here is x64.
  - `RpcMetadata.txt` and `RpcMetadata.d.ts` are complementary code-generation inputs.
  - The actual generated serialization filename is `Serialization_<case>.d.ts`.
  - The reusable Workflow sources are the `Workflow/Source/Library/Rpc` and `Workflow/Source/Library/RpcJson` libraries.
  - `StartRpcStdio.ps1` launches `RpcStdioTest_Service`, not `RpcStdioTest_Client`.
  - `RpcStdioTest_Driver` accepts the service command and optional skip list; the service CLI accepts the appended case name.
- Write `VerifyRpcWithWorkflow.md` as language-porting guidance: explain the driver/provider roles, upstream artifacts, generation-versus-hand-translation boundary, stdio admission and lifecycle, service setup order, skip criteria, and observable conformance result. TypeScript can be the concrete example, but keep GacJS package internals to the minimum needed for that example.
- Add both the RPC overview and verification guide to the documentation references in `AGENTS.md` and the relevant package/document indexes in `doc/Projects.md`. Document the two new packages, their dependencies, and their `import`/`codegen`/`build`/`test` responsibilities.

## VERIFICATION

1. Build Workflow's Debug x64 `Test/UnitTest` solution with `Workflow/.github/Scripts/copilotBuild.ps1`, following Workflow's build instructions. Confirm the expected driver, service, `IndexRpc.txt`, metadata, and schema files exist.
2. Before diagnosing GacJS, run `Workflow/Test/StartRpcStdio.ps1` without a skip list and require the native C++ driver/service baseline to pass every indexed case.
3. From `Gaclib`, run `yarn run import`, then `yarn codegen`. Assert that the generated case registry has an exact one-to-one match with `IndexRpc.txt`, including cases present in the destructor skip list, and that all handwritten service registrations compile against it.
4. Run `yarn codegen` again with unchanged inputs and verify that the second run changes no generated file or manifest and leaves no stale case output.
5. From `Gaclib`, run `yarn build` and then `yarn test` in that order. Do not substitute direct ESLint or Vitest commands for the root scripts.
6. From `Gaclib/rpc-test/rpc-test-cli`, run `npm run test` explicitly. Require a zero driver exit, exactly one terminal result for every non-skipped indexed case, and a reported skipped set exactly equal to `StartRpcStdio_DtorSkipList.txt`. With the files present at review time this means 118 passing executions and 8 intentional destructor skips, while the assertions themselves remain data-driven.
7. Exercise the service command from a checkout path containing spaces. Confirm child stdout contains only decodable protocol/control frames, normal driver shutdown exits cleanly, and an unknown direct CLI case exits nonzero with its message on stderr.
8. Add focused tests for canonical Base64/strict UTF-8 framing, fragmented LF/CRLF input, early assignment/Login queuing, exact case selection, missing/extra/unknown arguments, service-registration-before-initialization ordering, and normal `!Exit` finalization.
9. If the Workflow skip list or driver changes, run Workflow's full prescribed build/test verification plus the no-skip native C++ baseline, inspect that repository's diff independently, and do not include unrelated Workflow changes.
10. Check the RPC document index and local links, confirm the placeholder comments were resolved as directed, and verify that `AGENTS.md` and `doc/Projects.md` describe the new packages and phase boundaries consistently.
11. Inspect `git diff --check` and the final diffs. Commit and push GacJS; if Workflow changed, commit and push it separately. Finish with every affected worktree clean and its branch synchronized with its upstream.

## REVIEW COMMENTS
