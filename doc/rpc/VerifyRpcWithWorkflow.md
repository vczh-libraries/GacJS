# Verifying an RPC Implementation with Workflow

## Purpose

Workflow's stdio RPC suite is a cross-language conformance harness. It verifies a
service provider implemented in another language against the same requester and
result oracle used for Workflow's native implementation. TypeScript is used below
as a concrete example, but the roles and protocol apply to other language ports.

## Driver and Provider Roles

`RpcStdioTest_Driver` is the requester, test orchestrator, and result oracle. It
reads `Workflow/Test/Resources/IndexRpc.txt` in order. For each non-skipped entry it
launches the configured service command with exactly one appended case-name
argument, connects to that child through stdio redirection, runs the Workflow
client behavior, and compares the result with the indexed expectation.

The provider replaces Workflow's `RpcStdioTest_Service`. It accepts exactly one
known case name, hosts that case's service implementation, and does not run the
C++ service alongside the language port. The driver accepts the service command
and an optional skip-list path; the provider does not parse either of those as
its own options.

## Authoritative Artifacts

The ordered case set and expected results come from
`Workflow/Test/Resources/IndexRpc.txt`. Each case is described by shared,
service-side, and client-side Workflow sources in `Workflow/Test/Resources/Rpc`.
The client source explains what the oracle exercises; the shared and service
sources define behavior that the provider must reproduce.

For the Debug x64 driver, generate bindings from both files in
`Workflow/Test/Generated/RpcMetadata64`:

- `Metadata_<case>.txt` contains the normalized RPC contract, resolved transfer
  modes, inheritance, and stable IDs.
- `Serialization_<case>.d.ts` contains the complementary known and unknown JSON
  schemas.

Both inputs are required. The x86 and x64 contracts can differ because `vint`
maps to different integer schemas, so generated bindings and predefined
collection operations must match the driver's ABI.

## Generated and Handwritten Boundary

Generation should produce contract types, codecs, exact IDs, proxy and local
descriptors, registration helpers, and an exact ordered selector for every
indexed case. Generate skipped cases too. Give each contract an isolated output
manifest when the generator uses fixed output names, and remove only stale files
owned by that manifest.

Generation does not replace the behavior in `<case>.txt` and
`<case>_Service.txt`. Translate those shared helpers and service implementations
by hand. Large parameterized families should share language-native helpers, while
special cases such as events, inheritance, properties, exceptions, identity, and
service requests should retain their case-specific semantics. A missing
handwritten registration must fail the build rather than becoming a runtime
fallback.

## Stdio Admission and Lifecycle

The provider implements the client side of Workflow's stdio redirection protocol.
Each line is canonical Base64 containing one complete strict-UTF-8
`NetworkPackage`; input may arrive fragmented and may use LF or CRLF. The provider
must install its reader before advertising exactly the `WorkflowRpcStdioTest`
channel, wait for its assigned client ID, and queue channel traffic that arrives
before the RPC endpoint installs its handler.

After assignment, create the endpoint for the `WorkflowRpcStdioTest` channel.
Configure the selected generated contract and register its local constructor
service or services before endpoint initialization. Initialization waits for the
broker Login message and then declares the registered service.

Stdout is reserved for protocol frames. Diagnostics belong on stderr. Writes must
remain ordered. A normal `!Exit` after a completed case finalizes the endpoint and
exits successfully. Malformed Base64 or UTF-8, invalid envelopes, endpoint
failures, unexpected EOF, and service failures terminate nonzero; the provider
does not retry or add recovery handshakes.

## Skip Policy

A skip is justified only by a semantic guarantee the target language cannot
provide. JavaScript and TypeScript cannot guarantee deterministic finalizer or
destructor timing and ordering, so the eight destructor cases in
`StartRpcStdio_DtorSkipList.txt` are intentional. The two `*_SharedMemsp` cases
are also intentional skips for every external provider because their oracle
compares state shared directly by `clientMain` and `serviceMain`. Difficulty, an
unimplemented feature, or a provider defect is not a valid reason to skip a
case.

Every skip entry must exactly match an indexed name. Tests should derive the index
and skip sets dynamically, require every indexed case to have exactly one terminal
pass or skip result, and reject unexpected skips. With the upstream files present
when this guide was written, the observable result is 118 executed passes and 10
intentional compatibility skips out of 128 indexed cases.

## Verification Procedure

First build Workflow's Debug x64 test solution using its prescribed build script.
Run `Workflow/Test/StartRpcStdio.ps1 Workflow/Test/StartRpcStdio_SharedMemspSkipList.txt`
to establish that the native driver and native service pass every
cross-process-compatible case. The in-memory Workflow UnitTest suite owns the
two `*_SharedMemsp` cases. Confirm the driver, index, and both generated inputs
for every case exist before diagnosing the port.

Then compile the language port's generator, regenerate all bindings, and run
generation a second time to prove that unchanged inputs produce no file or
manifest changes. Build the runtime and provider before testing. Launch the driver
with a correctly quoted provider command and the approved destructor skip list;
include a provider path containing spaces so command construction is exercised.

For the GacJS TypeScript provider, run `Gaclib/StartRpcStdio.ps1` on Windows or
`Gaclib/StartRpcStdio.sh` on Linux and macOS, from the repository root or from
`Gaclib`. The script builds the required Workflow Debug x64 driver, builds
GacJS, and then invokes the driver directly with the TypeScript CLI and
Workflow's approved destructor skip list. Run the import and codegen phases
separately first when their inputs have changed. The direct invocation keeps all
driver output attached to the calling console.

A conforming run exits zero, reports the exact dynamic pass/skip partition, keeps
provider stdout frame-only, and rejects missing, extra, or unknown direct provider
arguments with a nonzero exit and stderr diagnostic.
