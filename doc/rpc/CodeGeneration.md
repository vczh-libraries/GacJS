# Generating TypeScript Bindings for Workflow RPC

## Purpose and Scope

This document specifies a TypeScript code generator for normalized Workflow RPC
metadata. The generated bindings must let TypeScript both:

- Consume remote Workflow RPC services and objects through asynchronous proxies.
- Implement local Workflow RPC services and objects that can be invoked by
  endpoints written in another language.

The generator is contract-specific. Request routing, pending-call correlation,
object lifetime, predefined collection operations, and broker behavior belong in
a reusable runtime. The generated output supplies IDs, typed APIs, codecs,
dispatch tables, proxy factories, property/event glue, and registration.

This is not a plan for generating a coordinator or broker. A TypeScript endpoint
can own and declare services while remaining a transport client of an existing
RPC broker.

## Inputs and Sources of Truth

Generation has three logical inputs:

| Input | Authoritative content | Content it does not provide |
| --- | --- | --- |
| Normalized `RpcMetadata.txt` | Interfaces, bases, constructor services, signatures, properties, events, transfer/cache modes, string IDs, numeric IDs | TypeScript JSON value declarations and generic envelopes |
| Generated `RpcMetadata.d.ts` | Contract-specific known/unknown JSON value shapes | Interfaces, operations, inheritance, numeric IDs, routing, lifetime |
| Generic runtime protocol declarations | Common envelopes, predefined negative IDs, object reference/exception/by-value/event structures | Contract-specific types and operations |

The normalized metadata and generated declaration are complementary.
`RpcMetadata.d.ts` must not be treated as a complete RPC contract merely because
its name contains “metadata.” Generic declarations equivalent to Workflow's
`Rpc.d.ts` are part of the reusable runtime and should not be copied into every
contract's generated output.

### Normalized metadata

The Workflow compiler has already performed semantic work before producing
`RpcMetadata.txt`:

- It has collected recursively referenced RPC interfaces, enums, and structs.
- It has resolved `@rpc:Byval` versus `@rpc:Byref` defaults.
- It has resolved `@rpc:Cached` versus `@rpc:Dynamic` defaults.
- It has linked properties with getter, setter, and change-event operations.
- It has normalized inheritance and overloaded operation identities.
- It has assigned global stable `IdString` and `IdNumber` attributes.

The TypeScript generator consumes those decisions. It must not reimplement the
Workflow analyzer or infer new IDs from declaration order. In particular,
numeric IDs are not target-language enum ordinals.

The parser must accept UTF-8 with or without BOM and CRLF or LF line endings.
Diagnostics must retain source file, line, and column information.

### Serialization-schema declaration

The generated declaration describes JSON shapes such as:

- Primitive schemas.
- Enum and struct schemas.
- Nullable/list/observable-list/map schemas.
- Known and tagged unknown values.
- `system_RpcObjectReference`.
- `system_RpcException`.

It can use ambient declarations and flattened Workflow full names. Read it with
the TypeScript compiler API, not regular expressions. The generator needs a
symbol table derived from its AST; it does not need to run arbitrary TypeScript
or resolve application imports.

All integer widths currently appear as TypeScript `number`. Generated codecs
must enforce safe-integer/range rules rather than silently corrupt 64-bit values.
Changing the wire representation to `bigint` or strings is a protocol change,
not a code-generator convenience.

### Generic protocol declarations

The runtime owns:

- Predefined negative collection type, method, and event IDs.
- `RpcObjectReference` and `RpcException`.
- Direct, broadcast, and broadcast-and-drop envelopes.
- Invoke, end-invoke, object-hold, event, service-declaration, and consolidated
  broadcast response messages.
- `RpcByvalReturnValue<T>` and event exception maps.

Generated code should import these definitions and runtime operations through a
small stable public API. It should not reach into runtime-private maps.

## Generator Architecture

Use a staged pipeline:

~~~text
metadata text ──> lexer/parser ──> contract AST ──> validated RPC IR
schema .d.ts  ──> TypeScript AST ─> schema symbols ─┘
generic model ────────────────────────────────────┘
                                                   │
                                                   v
                                      deterministic TS emit
~~~

Each stage should be independently testable. Parsing should have no filesystem
side effects. Emission should produce an in-memory set of relative paths and
contents; a thin driver performs atomic/write-if-changed output.

Do not generate by modifying a preexisting TypeScript source file. Emit complete
owned files from typed models so stale declarations disappear when a contract
changes.

## Parsing the Metadata

### Supported grammar

Parse the normalized subset needed for RPC metadata, including:

- Modules and namespaces.
- Enums and structs needed by serialization.
- Interfaces and base lists.
- Functions, events, and properties.
- Workflow type expressions, nullable types, and strong collection types.
- Attribute lists and literal arguments.
- Escaped Workflow identifiers and fully qualified names.

Fail closed on syntax outside the supported normalized grammar. A partial parser
that skips an unknown declaration can silently emit incompatible bindings.

Keep tokens and source spans on declarations, attributes, type nodes, and member
names. Semantic diagnostics should point to the most relevant original token.

### Required attributes

For every RPC interface, method, event, and generated property operation,
extract and validate:

- `@rpc:IdString("...")`.
- `@rpc:IdNumber(...)`.

Also consume:

- `@rpc:Interface`.
- `@rpc:Ctor`.
- Resolved `@rpc:Byval` or `@rpc:Byref`.
- Resolved `@rpc:Cached` or `@rpc:Dynamic`.
- The normalized property/member-link annotations produced by the compiler.

Do not accept a missing ID by assigning one locally. Do not honor a second,
conflicting attribute by “last one wins.”

### Workflow names versus TypeScript names

Preserve wire/full names exactly in the IR. Separately calculate TypeScript
identifiers for emitted symbols.

Normalized Workflow metadata can contain:

- Namespaces and type separators not valid in TypeScript identifiers.
- Overload suffixes and parameter lists in `IdString`.
- Setter parameters such as `<value>`.
- Names that are TypeScript reserved words.
- Different full names that flatten to the same spelling.

Sanitization must be deterministic and collision checked within every emitted
scope. A suffix based on the explicit numeric ID is preferable to an unstable
encounter-order suffix. Property keys that need not be identifiers can be
emitted as quoted string literals. Never mutate the stored wire name.

## Contract Intermediate Representation

A language-neutral core IR makes validation and future backends easier:

~~~ts
interface ContractIr {
    readonly typesByFullName: ReadonlyMap<string, TypeIr>;
    readonly interfacesById: ReadonlyMap<number, InterfaceIr>;
    readonly operationsById: ReadonlyMap<number, OperationIr>;
    readonly schemaSymbols: ReadonlyMap<string, SchemaSymbolIr>;
}

interface InterfaceIr {
    readonly fullName: string;
    readonly tsName: string;
    readonly idString: string;
    readonly idNumber: number;
    readonly constructorService: boolean;
    readonly bases: readonly InterfaceRefIr[];
    readonly methods: readonly MethodIr[];
    readonly events: readonly EventIr[];
    readonly properties: readonly PropertyIr[];
}

interface MethodIr {
    readonly workflowName: string;
    readonly tsName: string;
    readonly idString: string;
    readonly idNumber: number;
    readonly parameters: readonly ParameterIr[];
    readonly result: TypeRefIr;
}

interface ParameterIr {
    readonly workflowName: string;
    readonly tsName: string;
    readonly type: TypeRefIr;
    readonly transfer: "byValue" | "byReference" | "direct";
}
~~~

The actual IR also needs:

- Enum/flags and struct field information.
- Nullable and nested collection type nodes.
- Event argument and return/exception behavior.
- Property getter/setter/change-event links and cache mode.
- Interface inheritance closure.
- Schema symbol and generated codec names.
- Source spans for diagnostics.
- Generated-name ownership/collision information.

Keep type structure rather than reducing a type to a display string. The emitter
needs to decide recursively between value codec calls and object-reference
conversion.

## Validation Before Emission

Generation should stop with aggregated, actionable diagnostics for:

- Duplicate numeric or string IDs.
- Missing, malformed, negative, or unsafe-integer user IDs.
- Collision with reserved generic IDs.
- Duplicate full names or unresolved type references.
- Unresolved/cyclic-invalid base interfaces.
- An interface used as a service without `@rpc:Ctor`, or malformed constructor
  service metadata.
- Missing transfer/cache decisions in normalized input.
- A by-value type that cannot be serialized.
- A user signature containing reserved transport-only structures.
- Property accessors or change events that do not match their linked property.
- Ambiguous overloads under the selected TypeScript API policy.
- TypeScript identifier/flattened schema-name collisions.
- A metadata value type without the expected schema declaration.
- A schema symbol with a shape incompatible with metadata.
- Unsupported TypeScript declaration constructs in the generated schema file.

Cross-check both directions where practical: every contract-referenced value
type has a schema, and unexpected custom schema declarations are either
explained by recursively collected metadata or reported.

Diagnostics should show the Workflow full name and explicit ID as well as a
source location. Never emit a partially usable output tree after validation
fails.

## Generated/Public API Design

### Separate service and proxy roles

One TypeScript interface cannot accurately describe both roles. For a Workflow
method returning `T`:

- The local implementation accepts `T | Promise<T>`.
- The remote proxy returns `Promise<T>`.

For example:

~~~ts
export interface ICalculatorService {
    calculate(value: number): number | Promise<number>;
}

export interface ICalculatorProxy extends RpcDisposable {
    calculate(value: number): Promise<number>;
}
~~~

Inputs can likewise differ when generated convenience types or disposable
proxies are involved. Keep wire-shape types separate from ergonomic application
types.

Generated registration requires an explicit descriptor/token:

~~~ts
export const CalculatorDescriptor: RpcInterfaceDescriptor<
    ICalculatorService,
    ICalculatorProxy
>;

export function registerCalculator(
    endpoint: RpcEndpoint,
    implementation: ICalculatorService,
): RpcObjectReference;
~~~

The runtime descriptor binds structural TypeScript values to a type ID, callee
table, proxy factory, and codec set. Do not use `instanceof` against an interface
or infer the ID from matching property names.

### Overloads

Wire IDs, not JavaScript argument inspection, select overloaded operations.
Choose and document one deterministic API policy:

1. Emit TypeScript overload signatures only when all signatures share one
   unambiguous implementation/caller entry.
2. Emit stable collision-free method names derived from the Workflow operation
   name plus explicit ID.
3. Expose an operation descriptor selector for ambiguous cases.

An implementation object needs a unique callable target per operation. If
ergonomic overload declarations are emitted, generated dispatch still calls a
known generated implementation key; it must not guess from runtime argument
types or count.

### Properties

JavaScript field access cannot await. Emit explicit async proxy operations such
as `getTitle()` and `setTitle(value)`, even if the service implementation uses a
more natural property adapter.

For cached properties, the generated proxy owns:

- An uninitialized/value cache state.
- The first remote getter call and concurrent-call coalescing.
- A change-event handler that invalidates the cache.
- Cleanup during proxy disposal.

For dynamic properties, every getter goes through the dispatcher. Setters go
through the dispatcher in both cached and dynamic modes. The IR, not
target-language inference, selects getter caching.

### Events

Generated event support needs a typed subscription surface and generated
owner/proxy adapters. The output must identify:

- Event ID and declaring interface.
- Argument codecs.
- Owner-side attach/detach operations.
- Proxy-side handler storage and invocation.
- Replay-suppression key and `finally` cleanup.
- Exception conversion for consolidated broadcast responses.

The runtime should provide generic subscription and suppression primitives.
Generated code supplies the typed calls and event-specific accessors.

## Contract-Specific Output

A practical generated module set includes the following responsibilities.
Names and file boundaries can vary, but ownership must remain clear.

### IDs and descriptors

Emit:

- Interface, method, and event constants. Properties link to their getter/setter
  method IDs and optional change-event ID; they do not have independent IDs.
- Full-name-to-ID and ID-to-descriptor maps.
- Base-interface relationships and type-recognition functions.
- Constructor-service descriptors.
- Precomputed dispatch tables.

Use literal values from metadata. Sort maps by a documented stable key.

### Value types and codecs

Emit:

- Type aliases/interfaces corresponding to contract schemas.
- Known-value serializers and deserializers.
- Unknown-value integration tables.
- Recursive enum, struct, nullable, list, observable-list, and map codecs.
- Reference conversion calls for interface values.
- By-value/by-reference collection adapters.

A declaration file supplied as generator input may be ambient and TypeScript
compilation does not necessarily copy it beside emitted output. Either generate
an owned `.ts` type module from the validated schema AST or explicitly make
copying the declaration a deterministic build step. A generated package must not
work only while its original input file happens to be on a developer's disk.

Codecs validate at runtime. TypeScript types disappear after compilation and
cannot protect a cross-process trust boundary.

### Callee dispatch

For each interface, emit a dispatch table indexed by numeric method ID. A callee
entry:

1. Validates the target object and interface.
2. Validates argument count and shapes.
3. Deserializes arguments, including reference conversion/holds.
4. Calls the unique implementation member.
5. Awaits its value.
6. Serializes the result.
7. Allocates by-value return storage when required.
8. Converts a user-thrown value to `RpcException`.

Unknown IDs and malformed messages are protocol errors. Only exceptions from
the accepted user implementation call become normal RPC exception responses.
Do not catch a generator/runtime bug and mislabel it as an application failure.

### Caller and proxy operations

For each method, emit a typed caller that:

1. Checks that the proxy and lifecycle are active.
2. Awaits the proxy's required remote hold.
3. Serializes arguments.
4. Sends `InvokeMethod` with the exact target reference and method ID.
5. Validates the correlated response.
6. Detects and reconstructs a tagged `RpcException` before result decoding.
7. Deserializes the declared result.
8. Sends `EndInvokeMethod` in `finally` for a by-value return slot.

Proxy factories create generated proxy objects, register them with the runtime's
weak interning/lifetime facilities, and initialize property/event glue. Memory
algorithms are defined in [MemoryManagement.md](MemoryManagement.md).

### Setup and registration

Emit one setup function that registers, in a deterministic order:

- Interface descriptors and inheritance.
- Type-ID recognition.
- Proxy factories.
- Callee method/hold operations.
- Event operations and attachers.
- Value codecs.
- Constructor-service helpers.

Setup should reject duplicate registration and be scoped to an endpoint/runtime
instance. Avoid mutable process-global registration when multiple independent
RPC sessions can run in one JavaScript realm.

## Reusable Runtime Boundary

The reusable runtime should provide:

- Generic message types and reserved IDs.
- Endpoint initialization/login state.
- Request ID allocation and pending-promise correlation.
- Direct/broadcast/broadcast-and-drop routing.
- Incoming request scheduling and nested-call reentrancy.
- Local-object tables and remote-proxy lease management.
- Hold/unhold, service declaration/discovery, and finalization.
- By-value slot allocation/release.
- Event suppression and exception aggregation primitives.
- Unknown-value and predefined collection support.
- Protocol validation and error classes.

Generated code should provide:

- Contract types and stable IDs.
- Contract-specific codecs.
- Interface/type recognition.
- Typed service interfaces and proxy interfaces.
- Method/event/property tables.
- Callee invocation adapters.
- Proxy caller methods and factories.
- Registration helpers.

This boundary allows multiple generated contracts to share one runtime without
copying dispatcher and lifetime logic. It also makes the runtime independently
testable with synthetic descriptors.

## Asynchrony and Reentrancy

All generated remote calls are asynchronous. Generated callee adapters may
`await` user implementations. While they wait, the runtime must continue to
dispatch unrelated and nested incoming requests.

Generated code must not:

- Hold a runtime mutation lock across an `await`.
- Use one global “current request.”
- Assume responses arrive in send order.
- Make transport send serialization double as RPC-call serialization.
- Drop callbacks received while waiting for an outer response.

Every resource acquired before an `await`—pending entry, suppression counter,
temporary reference claim, or by-value slot—needs a `try`/`finally` cleanup
path.

## Deterministic Emission

Generated output is expected to be committed and reviewed. Enforce:

- A fixed generator version/banner without timestamps or machine paths.
- Stable ordering, preferably by explicit numeric ID then full name.
- Fixed newline and encoding policy.
- Deterministic identifier escaping and collision suffixes.
- Stable import and object-property ordering.
- No dependence on map insertion from filesystem enumeration.
- Write-if-content-changed behavior.
- Removal of obsolete generator-owned files.

Deleting stale files must be restricted to a manifest or a dedicated generated
subtree. Never recursively clean a caller-supplied package root whose ownership
has not been validated.

Consider emitting a manifest containing input hashes, generator format version,
and owned relative file list. Do not put absolute paths or build timestamps in
it.

Generation should be idempotent: running it twice from identical bytes produces
no repository diff.

## Diagnostics and Compatibility

Errors should distinguish:

- Metadata parse errors.
- Schema declaration parse errors.
- Cross-input semantic disagreements.
- Unsupported but valid Workflow features.
- Generated TypeScript name collisions.
- Runtime/wire-version incompatibility.
- Filesystem write failures.

Include a short remedy when possible, such as regenerating normalized metadata
with a compatible Workflow compiler. Never continue by guessing a missing ID or
mapping an unknown type to `any`.

The generator and runtime should publish an explicit compatibility/format
version. A newer generator can reject a normalized construct it does not
understand rather than silently emitting incomplete dispatch.

Keep the validated contract IR independent of TypeScript syntax where practical.
Future language backends can share parsing, normalization checks, stable-name
policy, and conformance fixtures while using their own emitter and memory model.

## Verification Strategy

### Parser and IR tests

Cover:

- BOM and non-BOM input.
- CRLF and LF.
- Namespaces and escaped identifiers.
- Primitives, enums/flags, structs, nullable, and nested collections.
- Interfaces, multiple inheritance, constructor services, and callbacks.
- Methods, overloads, events, and properties.
- Every resolved transfer/cache mode.
- Missing/duplicate IDs and unresolved symbols.
- Schema-name and TypeScript-name collisions.
- Source locations in diagnostics.

Use representative normalized fixtures generated by the Workflow compiler.
Copy or version fixtures with the generator tests so tests do not depend on an
unbuilt sibling repository at runtime.

### Golden generation

For each representative contract:

- Compare the complete generated file set to reviewed golden files.
- Type-check the generated sources against the runtime public API.
- Run generation twice and require byte-identical output.
- Change/remove a contract member and verify stale generated output disappears.
- Confirm numeric and string IDs exactly match metadata.

Include inheritance and overload fixtures; a minimal single-method service alone
does not exercise the generator.

### Codec tests

Round-trip:

- All primitive widths and boundary values.
- Unsafe 64-bit integer rejection.
- Enums and flags.
- Structs and nullable values.
- Nested lists, observable lists, and maps.
- Known and unknown tagged values.
- Remote object references and RPC exceptions.
- Malformed and near-miss JSON shapes.

### Runtime-binding tests

Use an in-memory transport to verify generated code:

- Registers a local constructor service before initialization.
- Flushes its declaration after login.
- Dispatches every method ID to the correct implementation member.
- Allows synchronous and asynchronous service implementations.
- Produces asynchronous typed proxies.
- Correlates concurrent calls and accepts nested callbacks.
- Converts user exceptions but preserves protocol errors.
- Interns and explicitly disposes proxies.
- Handles stale-finalizer races deterministically.
- Releases by-value slots on success and error.
- Attaches/detaches events, suppresses replay, and invalidates cached properties.

### Cross-language conformance

Test at least:

- A TypeScript service called by the reference implementation.
- A TypeScript proxy calling a reference service.
- By-reference callbacks in both directions.
- Service discovery before and after declaration.
- Event broadcast with multiple endpoints and exception aggregation.
- Disconnect/finalize behavior.

Capture or construct exact generic envelopes in tests. Avoid snapshots that only
assert “some JSON was sent”; verify discriminants, IDs, source/target routing,
reference triples, arguments, response shape, and cleanup operations.

## Completion Checklist

- Both metadata inputs are parsed with source locations.
- Generic protocol definitions come from the runtime.
- Stable IDs and resolved Workflow semantics are never recomputed.
- Cross-input type/schema agreement is validated.
- The IR represents all supported interfaces, values, properties, and events.
- TypeScript names are deterministic, legal, and collision checked.
- Service implementation and proxy APIs express different async behavior.
- Generated dispatch, proxy, codec, event, property, and registration code is
  complete.
- Runtime and generated responsibilities are cleanly separated.
- Output is self-contained after normal TypeScript compilation.
- Generation is deterministic and removes only manifest-owned stale files.
- Unit, golden, runtime, and cross-language conformance tests cover full
  semantics, not only a minimal service.
