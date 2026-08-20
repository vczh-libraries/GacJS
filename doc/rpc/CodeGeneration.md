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
| Normalized `RpcMetadata.txt` | Interfaces, bases, constructor services, signatures, properties, events, resolved method/property transfer modes, cache modes, string IDs, numeric IDs | TypeScript JSON value declarations, generic envelopes, and explicit transfer annotations for event parameters |
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
- It has resolved `@rpc:Byval` versus `@rpc:Byref` defaults on method returns,
  method parameters, and generated property accessors.
- It has resolved `@rpc:Cached` versus `@rpc:Dynamic` defaults.
- It has linked properties with getter, setter, and change-event operations.
- It has normalized inheritance and overloaded operation identities.
- It has assigned global stable `IdString` and `IdNumber` attributes.

The TypeScript generator consumes those decisions. It must not reimplement the
Workflow analyzer or infer new IDs from declaration order. In particular,
numeric IDs are not target-language enum ordinals.

Event parameters are a narrow exception. Workflow has no syntax for annotating
an individual event parameter, and normalized metadata leaves those parameters
without `Byval`/`Byref`. The generator must apply Workflow's event default: an
outer observable list and collections whose element or dictionary value
recursively contains an RPC interface use by reference; other strongly typed
collections use by value. A nested observable list alone does not force the
outer collection to be by reference. This rule is event-only. Missing transfer
attributes on a strongly typed method result, method parameter, or generated
property accessor are an input error, not permission to infer a mode.

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

Predefined collection support is the complete family: enumerable, enumerator,
read-only list, list, array, observable list, and dictionary, plus the
observable-list `ItemChanged` event. Do not reduce this input to a list/map JSON
codec; by-reference containers also require the predefined negative operation
IDs.

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
- Workflow type expressions, nullable types, and strong collection forms such
  as `T{}`, `T[]`, `const T[]`, `observe T[]`, `V[K]`, and `const V[K]`.
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
- Resolved `@rpc:Byval` or `@rpc:Byref` on strongly typed method results,
  parameters, and property-generated accessor use sites.
- Resolved `@rpc:Cached` or `@rpc:Dynamic`.
- The normalized property/member-link annotations produced by the compiler.

Do not accept a missing ID by assigning one locally. Do not honor a second,
conflicting attribute by “last one wins.”

Transfer mode is attached to a collection use site, not to the collection type
itself. The same `int[]` can be a by-value input and a by-reference output.
Validate that `Byval`/`Byref` occurs only on a strongly typed collection
property, method result, or parameter inside an RPC interface, and never both.
For event parameters, record that the mode came from the event-only default
rule rather than from an attribute.

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
    readonly resultTransfer: TransferMode;
}

type TransferMode = "byValue" | "byReference" | "direct";

interface ParameterIr {
    readonly workflowName: string;
    readonly tsName: string;
    readonly type: TypeRefIr;
    readonly transfer: TransferMode;
    readonly transferSource: "metadata" | "eventDefault" | "notApplicable";
}

interface EventIr {
    readonly workflowName: string;
    readonly idString: string;
    readonly idNumber: number;
    readonly parameters: readonly ParameterIr[];
}
~~~

The actual IR also needs:

- Enum/flags and struct field information.
- Nullable and nested collection type nodes, preserving enumerable/read-only,
  list, array, observable-list, and dictionary kind.
- Event argument transfer/default source and return/exception behavior.
- Property getter/setter/change-event links and cache mode.
- Interface inheritance closure.
- Schema symbol and generated codec names.
- Source spans for diagnostics.
- Generated-name ownership/collision information.

Keep type structure rather than reducing a type to a display string. Transfer
stays on each method/property/event use site, because it recursively governs all
collection nodes below that site. The emitter needs both pieces to decide
between value copying and object-reference conversion.

## Validation Before Emission

Generation should stop with aggregated, actionable diagnostics for:

- Duplicate numeric or string IDs.
- Missing, malformed, negative, or unsafe-integer user IDs.
- Collision with reserved generic IDs.
- Duplicate full names or unresolved type references.
- Unresolved/cyclic-invalid base interfaces.
- An interface used as a service without `@rpc:Ctor`, or malformed constructor
  service metadata.
- Missing or conflicting transfer/cache decisions in normalized input.
- `Byval`/`Byref` on a non-collection use site, outside an RPC interface, or on
  both sides of one use site.
- A strongly typed method/property collection use site without exactly one
  resolved transfer mode; event parameters are checked using their separate
  fixed-default rule.
- A collection whose element, key, or value is not serializable, or a by-value
  type that cannot be represented by the JSON schema.
- A user signature containing reserved transport-only structures.
- Property accessors or change events that do not match their linked property.
- A property getter result and setter value parameter whose transfer modes do
  not agree with the property's selected mode.
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

### Container-facing APIs

Transfer mode changes the honest TypeScript API even when the Workflow type is
spelled the same way.

- A by-value collection is local data. It can use generated local
  array/read-only-array, observable-list, and `Map`-like types, provided the
  codec preserves collection kind and arbitrary dictionary keys.
- A by-reference collection is a disposable remote capability. Count, get,
  mutation, enumeration, dictionary access, and nested-container access may all
  await RPC and must be exposed through explicitly asynchronous interfaces.
- A by-reference parameter received by a service can resolve to either an
  original local container or a remote proxy, depending on reference ownership.
  Normalize both behind the same async collection interface/local adapter; do
  not type the implementation parameter as “remote proxy only.”
- A local service returning by reference can export a local container adapter or
  pass through an existing remote collection proxy. Passing through must retain
  its original reference instead of re-exporting the proxy as a local object.

For example, a generated/runtime interface may resemble:

~~~ts
interface RpcReadonlyList<T> extends RpcDisposable {
    count(): Promise<number>;
    get(index: number): Promise<T>;
    values(): AsyncIterable<T>;
}

interface RpcList<T> extends RpcReadonlyList<T> {
    set(index: number, value: T): Promise<void>;
    add(value: T): Promise<number>;
}
~~~

Names and exact adapter layering are target decisions, but a by-reference list
must not masquerade as native `T[]`, and a remote dictionary must not masquerade
as a synchronously accessed JavaScript `Map`. Generate role- and transfer-aware
method signatures so all four combinations of by-value/by-reference input and
output remain distinct.

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
- Transfer-aware calls into by-value copy and by-reference collection adapters.

Do not choose a collection wire shape from its TypeScript surface type alone:

- At the generic invocation boundary, a by-value collection is a boxed unknown
  value: `{ "$": "list" | "oblist", values: [...] }` or
  `{ "$": "map", values: [[key, value], ...] }`.
- A by-reference argument or result is the tagged unknown
  `system::RpcObjectReference` shape with the appropriate predefined negative
  collection type ID; it is not serialized as collection contents. Null uses
  the tagged sentinel
  `{"$":"system::RpcObjectReference","clientId":-1,"objectId":-1,"typeId":-100}`,
  not JSON `null`, and creates no proxy or hold.
- Values crossing predefined collection operations are unknown values. A
  nested container or RPC interface element/key/value is converted to a
  reference before unknown-value serialization.
- Statically known collection fields elsewhere in a value schema can use the
  schema's untagged arrays or pair arrays. These encodings are not
  interchangeable merely because both represent a collection.

Dictionary codecs must preserve arbitrary serializable keys by using pair
arrays or a real `Map`-like application representation. Encoding keys as
JavaScript object property names is incompatible for numbers, structs,
interfaces, and other non-string key values.

The by-value copier recursively materializes every nested collection shell,
converts interface leaves to references during boxing, rejects cycles, and does
not promise preservation of shared-subcontainer aliases. The by-reference
adapter instead exports the outer shell, then boxes nested shells as references
when generic collection operations expose them.

By-value `T{}` requires eager materialization even though its source is an
enumerable. The current reference analyzer accepts that form while the
reference recursive copier lacks a bare-enumerable branch and dedicated test.
Keep this as a named compatibility case: add a cross-language fixture before
claiming support, or fail generation with an actionable unsupported-feature
diagnostic. Never fall through to reference boxing, which would silently change
the requested by-value semantics.

By-reference `const V[K]` is a second reference gap. The analyzer and by-value
copier accept read-only dictionaries, but the generic protocol/runtime defines
only mutable dictionary type ID `-6` and a mutable proxy. A genuinely read-only
object cannot be identified, while reusing `-6` would advertise mutation. Reject
this transfer mode until a protocol/reference decision and cross-language
fixture define it; do not silently widen the capability.

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

Argument decoding branches by the recorded use-site mode. By-value input
reconstructs a new local container graph; by-reference input converts the
reference to the original local container or an acknowledged remote proxy. The
mode applies recursively to nested collection shells, while RPC interface
leaves always use normal reference conversion.

Result encoding also branches independently:

- Direct values use their normal generated codec.
- A by-reference collection is converted to its original or newly allocated
  reference and serialized as a tagged `RpcObjectReference`.
- For a by-value collection, first recursively copy the implementation's return
  graph. Store that actual unboxed copy strongly in a new slot, box/serialize
  the copy into the tagged unknown collection schema, and return
  `{value, slot}`. Retaining only the JSON node is insufficient when the graph
  contains RPC interface objects.

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

For a by-value response, validate the `{value, slot}` wrapper, reconstruct all
local collection shells, and await required holds for every nested interface
reference before ending the invocation. Once a valid slot-bearing response has
been accepted, send exactly one `EndInvokeMethod` after reconstruction succeeds
or fails. The reference generated C++ calls it only after successful unboxing;
using `finally` in TypeScript is a deliberate stronger cleanup guarantee that
prevents a decode error from stranding the slot until lifecycle finalization.

For a by-reference response, perform ordinary reference conversion and lease
reconciliation; do not send `EndInvokeMethod`. Likewise, by-value arguments and
non-collection results never allocate a return slot.

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
- Recursive by-value collection copy/box/unbox with cycle detection.
- Unknown-value codecs and predefined enumerable/enumerator, read-only-list,
  list, array, observable-list, and dictionary dispatch/proxy support.
- Async iteration and deterministic disposal for enumerators, nested collection
  proxies, and dictionary key/value views.
- Protocol validation and error classes.

Generated code should provide:

- Contract types and stable IDs.
- Contract-specific codecs.
- Interface/type recognition.
- Typed service interfaces and proxy interfaces.
- Method/event/property tables.
- Callee invocation adapters.
- Proxy caller methods and factories.
- Transfer-aware typed collection use sites and local-container adapters.
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
temporary reference claim, remote enumerator/view, or by-value slot—needs a
`try`/`finally` cleanup path.

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
- Enumerable, read-only-list, list/array, observable-list, and
  read-only/mutable-dictionary type forms.
- Interfaces, multiple inheritance, constructor services, and callbacks.
- Methods, overloads, events, and properties.
- Every explicit/default transfer and cache mode, including property
  getter/setter propagation.
- Event collection arguments whose modes are computed by the event-only
  default rule, with an ordinary list resolving by value and an observable list
  resolving by reference.
- Rejection of transfer attributes on non-collections, conflicting attributes,
  and missing normalized method/property modes.
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
does not exercise the generator. For containers, include ordinary list,
observable list, and dictionary fixtures across:

- By-value input/by-value output.
- By-value input/by-reference output.
- By-reference input/by-value output.
- By-reference input/by-reference output.
- Default and explicit modes, properties, nested containers, and containers
  with RPC interface elements or values.

### Codec tests

Round-trip:

- All primitive widths and boundary values.
- Unsafe 64-bit integer rejection.
- Enums and flags.
- Structs and nullable values.
- Nested enumerable/list/array, observable-list, and dictionary values.
- Tagged by-value `list`, `oblist`, and `map` shapes at generic RPC operation
  positions, including arbitrary non-string dictionary keys.
- Known and unknown tagged values.
- Remote object references and RPC exceptions.
- Null collections, repeated nested aliases, and recursive collection cycle
  rejection without leaked partial state.
- Exact by-reference null-sentinel encoding and rejection of malformed partial
  sentinels.
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
- Recursively isolates mutations to by-value input/output containers while
  preserving interface-element object identity.
- Preserves live by-reference mutations and returns an exact local container
  when its reference comes back to its owner.
- Applies the outer transfer mode to nested collection shells.
- Dispatches every predefined collection operation and observable-list
  `ItemChanged` event, including remote operation exceptions.
- Disposes remote enumerators on completed, failed, and early-terminated async
  iteration and disposes dictionary key/value views.
- Establishes nested interface proxy holds before releasing a by-value return
  slot, and releases the slot on success and decode/materialization failure.
- Attaches/detaches events, suppresses replay, and invalidates cached properties.

### Cross-language conformance

Test at least:

- A TypeScript service called by the reference implementation.
- A TypeScript proxy calling a reference service.
- By-reference callbacks in both directions.
- All four by-value/by-reference container input/output combinations, including
  nested containers and interface elements created by both endpoints.
- Observable-list mutation/event propagation by reference and isolation by
  value.
- A dedicated by-value `T{}` enumerable compatibility fixture, or an assertion
  that the generator rejects it until reference behavior is defined and tested.
- A dedicated by-reference `const V[K]` compatibility fixture after the generic
  protocol defines it, or an assertion that generation rejects it.
- Service discovery before and after declaration.
- Event broadcast with multiple endpoints and exception aggregation.
- Disconnect/finalize behavior.

Capture or construct exact generic envelopes in tests. Avoid snapshots that only
assert “some JSON was sent”; verify discriminants, IDs, source/target routing,
reference triples, arguments, response shape, and cleanup operations.

## Completion Checklist

- Both metadata inputs are parsed with source locations.
- Generic protocol definitions come from the runtime.
- Stable IDs and normalized method/property modes are consumed verbatim; only
  unannotated event collection arguments use the specified event-default rule.
- Cross-input type/schema agreement is validated.
- The IR represents all supported interfaces, values, properties, and events.
- TypeScript names are deterministic, legal, and collision checked.
- Service implementation and proxy APIs express different async behavior.
- By-value local containers and by-reference asynchronous container
  capabilities have distinct, transfer-aware APIs.
- Generated dispatch, proxy, codec, event, property, and registration code is
  complete.
- Recursive by-value copying, slot ordering, predefined by-reference collection
  operations, and transient helper-proxy cleanup are covered.
- Runtime and generated responsibilities are cleanly separated.
- Output is self-contained after normal TypeScript compilation.
- Generation is deterministic and removes only manifest-owned stale files.
- Unit, golden, runtime, and cross-language conformance tests cover full
  semantics, not only a minimal service.
