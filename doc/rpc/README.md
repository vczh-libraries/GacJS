# Working with Workflow RPC

## Index of RPC Documents

Documents in this folder is also part of the release.
It offers a guidance for implementing view models in other programming languages.
So do not mention GacJS details, but how things work with TypeScript could be mentions, which serves as an example for similar languages.

<!-- replace this comment with a list of documents in the same folder -->

## Implementing View Models in Another Programming Language

<!-- MARK BEGIN -->
<!-- Agent should not change this part unless there is any mistake in fact -->

This is a guidance describing how to create view model implementation in another programming language other than C++,
which requires `@rpc:interface` with or without `@rpc:ctor` is marked on the view model interface.

After calling `GacGen.exe` on, for example, a `Resource.xml`,
we will get a `Resource.xml.log`, containing `RpcMetadata.txt` and `RpcMetadata.d.ts`.
They are created separatedly for x86 and x64,
in C++ there differences happen mostly around the `vint` data type,
which could be either `int32_t` and `int64_t`.
But for TypeScript there should be no difference,
so we can always read the x64 version.

`RpcMetadata.txt` extracts definition of the complete Workflow RPC view model definition long as all its dependencies.
`RpcMetadata.d.ts` has definitions of schema for data exchanged running with Workflow RPC's JSON protocol.
Create view models in another programming language needs a code generator to be developed.

## Creating a Codegen

`Workflow` repo in the same github organization has a lot of reusable materials for verifying a new codegen:
- Test cases entry is defined in `Test/Resources/IndexRpc.txt.
- Each test case is located in `Test/Resources/Rpc/<SAMPLE>*.txt`:
  - `<SAMPLE>.txt` defines rpc interfaces and shared code.
  - `<SAMPLE>_Service.txt` defines the service side code, containing implementation of rpc interfaces for the test case.
  - `<SAMPLE>_Client.txt` defines the client side code, containing expectation of the test case.
- Each test case generates in `Test/Generated/RpcMetadata(32|64)`:
  - `Metadata_<SAMPLE>.txt`: The "RpcMetadata.txt".
  - `Serialization_<SAMPLE>.txt`: The "RpcMetadata.d.ts".
  - `Wrapper_<SAMPLE>(_Json)?.txt`: Generated Workflow script to support the RPC. It will be compiled into C++ and be utilized in both client and service side of Workflow RPC.

Here is what we need to manually do:
- `Workflow/Source/Library/Rpc(Json)?` needs to be translated as a library, generated code could use them.
  - "The RPC library" means the translated version of this.

Here is what a codegen is expected to do:
- Read the generated `RpcMetadata.txt` as a source of truth, which is enough as input of codegen.
- If the target programming language could use types, an equivalence of `RpcMetadata.txt` and `RpcMetadata.d.ts` needs to be generated.
- Equivalence of `Wrapper_<SAMPLE>(_Json)?.txt` needs to be generated, it connects the view model implementation and the RPC library.
  - The RPC library doesn't necessarily like the C++ one, so wrappers might also look different.
  - It depends on what is the best way to implement RPC in the target programming language.

### Verifying the Codegen

`Workflow/Test/StartRpcStdio_DtorSkipList.txt` is a skip list of a subset of test cases that depend on destructors.
The target programming might not have destructors, or it has (e.g. `FinalizationRegistry` in TypeScript, or C#) but there is no guarantee about when to run the destructor.
In this case, we should still generated code from all test cases, but offering this file to `RpcStdioTest_Driver` will skip this part of test cases.

`RpcStdioTest_Driver` is a test app in `Workflow`, which keep launching a given CLI command for each test case, run it and compare the result to `IndexRpc.txt`.
The CLI command starts a view model implementation as a CLI application, `RpcStdioTest_Driver` connects to it using stdio redirection.
The CLI application should implement a compatible protocol, which should be compatible with the stdio redirection implementation of `INetworkProtocolServer`.

`Workflow/Test/StartRpcStdio.(ps1|sh)` is an example of how to start `RpcStdioTest_Driver`.
It starts `RpcStdioTest_Client`, which is also written in C++, to verify the C++ implementation of RPC interface implementation supporting code.

Besides of code that could be generated, shared functions in `<SAMPLE>.txt` as well as the whole `<SAMPLE>_Service.txt` needs to be manually translated into the target programming language.
If any test case fail, aligning this part of code should be considered as test samples in `Workflow` might change.

<!-- MARK END -->

### Verifying GacJS against Workflow

- `Gaclib/shared/codegen` should read `IndexRpc.txt` and generate each test case, which could be compiled with `Gaclib/rpc-test/rpc-test-cases/package.json`.
- `Gaclib/rpc-test/rpc-test-cli/package.json` is prepared to work with `RpcStdioTest_Driver`.
  - To verify, run `RpcStdioTest_Driver`, accepting a test case name, host a specific test case from `rpc-test-cases`, make sure `RpcStdioTest_Driver` doesn't report any error.
  - The name selection could also be generated by `Gaclib/shared/codegen`.
  - It hosts the manually translated `<SAMPLE>_Service.txt`, just like how `RpcStdioTest_Service` in `Workflow` does.
- `Gaclib/gaclib/codegen-workflow-rpc` is the RPC codegen under testing.
- `Gaclib/gaclib/workflow-rpc` is the TypeScript implementation of the RPC library under testing.
- `Gaclib/website/entry` has a RPC enabled demo working with `GacUI/Test/GacUISrc/RemotingTest_Core`, render the UI with a view model implemented in TypeScript.
  - `GacUI/.github/Jobs/DebugRemoteProtocolWithGacJS.md` describes how to use it, triggered by `GacUI/.github/Jobs/job.rp(Windows|XPlat).prompt.md`.
