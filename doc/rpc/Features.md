# Workflow Interface-Based RPC

## Purpose

This document describes the behavior that an implementation of Workflow
interface-based RPC must preserve. It is intended for runtime and code-generator
authors, especially authors targeting TypeScript. It describes the RPC system
rather than a particular application or transport.

Workflow RPC is not a conventional collection of string-named procedures. It is
an object-capability protocol generated from typed Workflow interfaces. Values
can contain remote object references, remote objects have identity and lifetime,
services are declared dynamically, events travel in both directions, and
by-value collection results have an explicit lifetime. A compatible
implementation therefore needs a dispatcher, an object-lifecycle manager,
generated serializers, generated proxies, and generated local-object dispatch.

## Conceptual Model

### Endpoints, broker, services, and objects

An RPC session contains:

- A broker, which routes messages and remembers declared services.
- Two or more endpoints connected to the broker.
- Local objects owned by an endpoint.
- Remote references that identify objects owned by another endpoint.
- Proxies that present remote references as language-level objects.

The endpoint implementing a service is not necessarily a network server. It can
be a channel client connected to a broker hosted by another process. Use
`endpoint`, `service provider`, and `service consumer` for RPC roles; reserve
`client` and `server` for the underlying transport when that distinction matters.

Every lifecycle endpoint is a peer in the object model. During setup it can
register constructor services; during normal operation the same endpoint can
export ordinary objects and containers, consume services, and call objects owned
by other endpoints. Its physical location does not change these capabilities.
In particular, a process hosting the channel server normally gives a
service-owning local channel client its own `clientId` and lifecycle; the
broker's separate local client is a routing/control-plane participant, not
automatically the owner of that service.

A remote object reference is the triple:

~~~ts
interface RpcObjectReference {
    clientId: number;
    objectId: number;
    typeId: number;
}
~~~

`clientId` identifies the owning endpoint, `objectId` identifies the object
within that endpoint, and `typeId` identifies the interface through which the
object is viewed. The complete triple is part of proxy identity.

A constructor interface, marked `@rpc:Ctor`, can be registered as a named
service. Its initial service reference uses its interface ID as both `objectId`
and `typeId`. The broker distributes service declarations to consumers. Other
remote objects are discovered through arguments, return values, properties, and
events.

### Single ownership and transitive references

Within one RPC session, every exported object has exactly one owning lifecycle.
The reference triple is session-wide routing identity, not identity local to a
connection or process. Local and remote are therefore relative terms: the same
reference is local at its owner and remote at every other endpoint.

References are transitively passable without changing ownership. If endpoint A
owns object X, B can receive X and then pass it to C:

1. B's proxy serializes back to X's unchanged A-owned reference.
2. C resolves that reference to a C-side proxy and establishes C's own hold at A.
3. C invokes X by targeting A's `clientId`; B is neither an ownership hop nor an
   invocation forwarder.
4. If C later passes the reference back to A, A resolves the exact original X.

The rule applies to interface values in arguments, results, properties, and
events; interface leaves in by-value graphs; and by-reference containers and
their helper objects. A proxy must never be wrapped as a newly B-owned export.
Transitive passing is confined to the lifecycle/session that created the proxy;
passing a proxy into an unrelated session is an error even if numeric IDs happen
to collide.

A service declaration is only a named discovery root. Once resolved, the
service is an ordinary passable object reference. Any endpoint may register an
eligible constructor service under the normal setup rules, but this does not
create multi-provider lookup: each lifecycle's remote-service map follows the
protocol's declaration/replacement order for a type ID.

### Five implementation layers

A useful implementation separates these concerns:

1. The physical transport moves channel packages and reports connection
   lifecycle.
2. The JSON channel batches zero or more JSON messages in one package.
3. The dispatcher validates envelopes, routes requests, correlates responses,
   and handles broker login and service declarations.
4. The lifecycle owns local-object records, interns remote proxies, and
   implements hold/unhold and by-value slots.
5. Generated bindings map contract-specific types, IDs, methods, properties,
   and events to the generic runtime.

Transport code must not know application interface IDs. Generated code must not
implement request correlation, broker behavior, or object ownership itself.

## Contract and Stable IDs

The normalized Workflow RPC metadata is authoritative for:

- RPC interfaces and inheritance.
- Constructor/service interfaces.
- Method signatures.
- Events and property accessors.
- Resolved `Byval` versus `Byref` decisions for method returns, parameters, and
  generated property accessors.
- `Cached` versus `Dynamic` property decisions.
- Stable string and numeric IDs.

Every RPC interface and operation has `@rpc:IdString` and `@rpc:IdNumber` after
normalization. Wire messages carry numeric IDs. String IDs are stable
diagnostic/schema identities and are useful for generated symbol names and
validation.

Generated numeric IDs must be consumed verbatim. They must not be recalculated
from declaration order, names, hashes, or the target language's overload rules.
User-defined IDs are separate from reserved negative IDs used by the generic RPC
runtime for built-in collection types and protocol operations.

Event parameters are the one transfer-mode exception. Workflow has no syntax
for attributes on individual event parameters, and normalized metadata does not
add such attributes. Their collection transfer mode is therefore the fixed
default described below, calculated from the normalized parameter type.

## Channel and Package Model

The Workflow JSON dispatcher sends a package containing a JSON array. Each
element is one RPC or channeling-system message. An empty array is valid at the
JSON-channel layer even if a particular transport avoids sending it.

The transport may frame a channel package as:

~~~text
receiverClientId;channelName;messageBody                    // direct to server
;channelName;messageBody                                    // broadcast to server
,blockedId[,blockedId...];channelName;messageBody            // excluding broadcast
senderClientId;channelName;messageBody                      // delivery to client
~~~

The first field is direction dependent. A blocked-only broadcast begins with a
comma because its receiver is absent. The server rewrites a delivery to contain
the server-supplied logical sender and does not forward the blocked list.
Initial channel negotiation can advertise multiple channel names joined by
`!`. These framing rules belong in a reusable channel transport, not in
generated RPC bindings.

A transport adapter presented to the RPC runtime should, at minimum:

- Expose the endpoint's assigned client ID.
- Deliver complete JSON package bodies in order.
- Send a direct package to one target.
- Send a broadcast package, optionally excluding clients.
- Report terminal completion or failure.
- Stop idempotently.

Physical sends may need to be serialized to preserve transport framing.
Logical RPC calls must not be serialized behind an outstanding response.

## Generic Message Envelopes

### Common fields

RPC request and response messages contain:

- `rpcMethod`: a discriminant such as
  `Request:IObjectOps_InvokeMethod`.
- `rpcRequestId`: correlation ID assigned by the requesting endpoint.
- `sourceClientId`: the sender identity defined for the current RPC route or
  broker hop.
- `targetClientId` for direct traffic.

Direct responses use the same request ID and reverse source and target. The
dispatcher must correlate by both the expected operation and request ID, and it
must validate routing fields for the route being processed. Source meaning is
route-specific:

| Route | `sourceClientId` | Destination |
| --- | --- | --- |
| Direct request | Calling endpoint | `targetClientId`, normally the target reference's owner |
| Direct response | Callee endpoint | Original caller |
| Event request arriving at the broker | Event-emitting endpoint | Broker local client |
| Event request redirected by the broker | Broker local client, with a broker request ID | Every connected endpoint except the emitter |
| Event response to the broker | Responding endpoint | Broker local client, with the broker request ID |
| Consolidated event response | Broker local client | Original emitter, with its original request ID |
| Service declaration | Declaring owner, preserved during broker forwarding/replay | Other endpoints |

At coordinator ingress, the original event/declaration source must match the
connected sender. For event fan-out the broker remembers the original emitter
out of band, excludes it, and rewrites the forwarded envelope's source and
request ID. A service declaration instead retains its owner's source even though
the immediate transport sender of a replay or fan-out is the broker.

An object reference inside a payload is not an assertion that the envelope
source owns that object. B can call C while carrying a reference owned by A.
Never require arbitrary references in arguments, results, properties, events,
or collection elements to match the message source. Route-specific constraints
still apply: a direct target-object operation goes to the target reference's
owner, and a service declaration's reference belongs to its declaring source.

### Direct operations

`IObjectOps_InvokeMethod` invokes a contract operation:

~~~ts
interface InvokeMethodRequest {
    rpcMethod: "Request:IObjectOps_InvokeMethod";
    rpcRequestId: number;
    sourceClientId: number;
    targetClientId: number;
    ref: RpcObjectReference;
    methodId: number;
    arguments: unknown[];
}
~~~

The response carries `response`. That value is either the serialized declared
result or a tagged RPC exception. A generated caller must test for the exception
shape before deserializing the declared result.

`IObjectOps_ObjectHold` tells an object's owner that a remote endpoint becomes,
or ceases to be, interested in the object. It is a request/response operation,
not fire-and-forget. Its ownership semantics are described in
[MemoryManagement.md](MemoryManagement.md).

`IObjectOps_EndInvokeMethod` releases a by-value return slot after the caller has
finished reconstructing a recursively copied result.

### Broadcast operations

`IObjectEventOps_InvokeEvent` broadcasts an event invocation. The broker omits
the originating endpoint when required, waits for participating endpoints, and
returns a `Broadcast_Response`. The response can contain an exception map keyed
by endpoint. A caller must not assume that broadcast success is represented by a
normal method response.

Events are peer-originated, not owner-to-consumer-only notifications. An
endpoint can raise an event on a local object or on a proxy. If B raises an event
on a proxy for an A-owned object, A can be one of the receivers while B is
excluded. The event's object reference continues to name A even though the
emitter—and, during fan-out, the broker—is the envelope source.

Generated event adapters maintain suppression state so that applying a remote
event locally does not immediately echo the same event back into the broker.
Suppression is scoped to the object reference and event ID, and collection
events can require additional reference-specific state.

### Broadcast-and-drop operations

`IRpcDispatcher_DeclareRemoteService` announces a service reference. It is
broadcast-and-drop and has no RPC response. The broker caches and forwards the
declaration. Each receiving dispatcher validates that the declared reference's
owner matches the message's logical source before accepting it, including when
the broker replays it to an endpoint that logs in later.

### Login

Broker login is a channeling-system control message rather than an application
method invocation. It supplies the broker's client ID. An endpoint is not ready
to route normal RPC traffic until the dispatcher has processed login and
completed its initialization rules.

## Initialization and Service Discovery

Initialization has a deliberate dependency order:

1. Establish the physical channel and obtain the endpoint client ID.
2. Create the dispatcher, lifecycle, and generated operations.
3. Register local constructor services before dispatcher initialization.
4. Invoke dispatcher initialization; it must keep processing channel traffic
   while waiting for broker control messages.
5. Apply incoming service declarations cached during setup, then initialize the
   lifecycle.
6. Proceed to the outgoing-declaration flush, observing/waiting for broker login
   as required by the dispatcher.
7. Resolve required remote services and begin normal work.

The dispatcher must allow local service declarations to be cached before login
or initialization. It must also cache incoming declarations until lifecycle
initialization can apply them. Requiring immediate transmission during step 3
can create a bootstrap deadlock because routing depends on a later broker login.
Do not wait for login before calling an initialization operation whose job is to
wait for and process that login.

The reference lifecycle's service lookup returns the registered local or remote
service, or null when it is unavailable. Startup can separately wait for a set
of required services. A TypeScript API may present that wait as a promise, but
it is a target-language convenience rather than a new wire request. Repeated
declarations must follow the reference runtime's cache/replay and replacement
order; a target must not invent a new uniqueness rule at this layer.

## Invocation and Concurrency

The reference C++ implementation exposes synchronous calls but remains
reentrant: while waiting for a response it processes incoming requests and
buffers unrelated responses. A TypeScript implementation should express remote
calls as promises and preserve the same observable behavior.

Required rules are:

- Allocate a unique pending request ID before sending.
- Insert the pending operation before a response can arrive.
- Permit multiple concurrent requests.
- Route an incoming response directly to its pending promise.
- Continue dispatching incoming calls, callbacks, events, and declarations while
  any promise is pending.
- Remove pending entries on success, remote exception, transport failure, and
  lifecycle finalization.
- Reject all pending promises when the endpoint terminates.

Do not hold a global dispatcher lock or a single request queue until one call
finishes. A remote method can synchronously call back through another by-reference
object, producing nested traffic before the outer response.

Generated TypeScript APIs should distinguish the two roles:

~~~ts
interface ExampleService {
    calculate(value: number): number | Promise<number>;
}

interface ExampleProxy {
    calculate(value: number): Promise<number>;
}
~~~

A local implementation may be synchronous or asynchronous. A proxy is always
asynchronous. Codegen can choose different names or branded types, but it must
not imply that a network call returns a plain value.

## Serializable Types

### Primitive and structured values

The Workflow JSON schema supports:

- Null, booleans, strings, and numeric primitive schemas.
- Enums.
- Structs with generated field schemas.
- Nullable values.
- Strongly typed enumerable, list, array, observable-list, and dictionary
  containers whose element/key/value types are serializable.
- RPC interface references.
- Tagged unknown values.

The generated serialization-schema declaration describes JSON value shapes. It
does not describe interfaces, operation IDs, dispatcher envelopes, or ownership
rules.

Known contract types use their generated schemas. Values whose exact type is not
known statically use a tagged union. Remote references and RPC exceptions are
tagged with a `$` discriminator so they cannot be confused with an ordinary
struct that happens to have similar fields.

Deserializers must validate the complete shape and report a protocol error with
useful context. They must not coerce arbitrary JavaScript values merely because
the result is assignable under TypeScript's structural type system.

### Numeric limits in TypeScript

Workflow schemas map signed and unsigned 64-bit integers to JSON numbers.
JavaScript numbers cannot exactly represent every 64-bit integer. Until the wire
schema defines a string or other lossless representation, a TypeScript runtime
must reject values outside `Number.MIN_SAFE_INTEGER` through
`Number.MAX_SAFE_INTEGER`. Silently rounding them is not conforming, and
substituting `bigint` is not wire compatible with JSON.

The same validation principle applies to integer range, finite floating-point
values, enum membership where required, and map key encodings.

Predefined collection operations use Workflow's architecture-dependent `vint`
schema for indexes and counts. Configure the endpoint with the codec matching
the peer ABI before initialization: `Int32` for x86 metadata and `Int64` for x64
metadata.

## By-Value and By-Reference Container Semantics

### Eligible use sites and defaults

`@rpc:Byval` and `@rpc:Byref` are collection-transfer attributes. They may be
applied only inside an RPC interface to a strongly typed collection property,
a method whose return type is a strongly typed collection, or a strongly typed
collection parameter. They do not select how an ordinary struct or RPC
interface value is transferred, and the two attributes are mutually exclusive.

Strongly typed collection syntax includes Workflow forms such as `T{}`, `T[]`,
`const T[]`, `observe T[]`, `V[K]`, and `const V[K]`. At runtime these cover
enumerable, read-only list, mutable list, array, observable-list, and dictionary
families; by-reference enumeration additionally creates enumerator helper
objects. Weakly typed interfaces such as a bare `system::Enumerable` are not
made serializable merely by being collection-like.

The return and each input parameter have independent modes. An explicit
annotation can select either mode, including by-value observable lists and
by-reference ordinary lists. When no annotation is written, Workflow chooses:

- By reference when the use site's outer collection is an observable list.
- By reference when the collection element or dictionary value recursively
  contains an RPC interface value through nested strongly typed collections.
- By value for every other strongly typed collection.

For a property, the selected mode is propagated to the getter result and setter
value parameter in normalized metadata. Method parameters, method results, and
generated property accessors have explicit resolved attributes there, so a
target generator consumes those attributes instead of recomputing them. Event
arguments cannot be annotated and use the same default rule directly.

For an echo-style method that mutates and returns its input, the independent
input/output choices produce four observably different cases:

| Input | Output | Service observes | Caller observes |
| --- | --- | --- | --- |
| By value | By value | A local copy of the caller container | A second local snapshot; the original stays isolated |
| By value | By reference | A local copy that becomes service-owned when exported | A proxy to that service-side copy; the original stays isolated |
| By reference | By value | A proxy to and mutations of the caller's original | The mutated original plus an independent returned snapshot |
| By reference | By reference | A proxy to and mutations of the caller's original | The returned reference resolves to the exact original container |

### By-value transfer

By-value transfer recursively snapshots every collection shell. The receiver
gets local containers independent of the sender's containers; later mutations
and observable-list events do not cross the endpoint boundary. The one mode on
the outer use site also controls all nested collection shells.

By value does not clone RPC interface objects stored in the collection. Those
leaves are still converted to `RpcObjectReference` values. They resolve to the
original object at its owning endpoint and to held proxies elsewhere. Thus a
by-value `IObject^[]` copies the list structure while preserving distributed
identity for each element.

The recursive copy does not support collection cycles. Reject a cycle with a
clear serialization error instead of recursing indefinitely. Collection alias
preservation is not part of the by-value contract: two positions that pointed
to one nested container may reconstruct as two copied containers. Code must not
use by-value transfer when container identity or live shared mutation matters.

A by-value enumerable must be materialized to produce this snapshot; laziness
does not cross the RPC boundary. The current reference analyzer accepts the
strongly typed `T{}` form, but the reference recursive copier has no dedicated
bare-enumerable branch or conformance fixture. Treat that as an explicit
cross-language compatibility gap: validate the materialized behavior against
the reference implementation or reject the construct with an unsupported
feature diagnostic, never silently transfer it by reference.

The generic RPC operation boundary boxes by-value collections as dynamically
typed values. Their wire form is therefore the tagged `list`, `oblist`, or
`map` schema, with a map carrying an array of key/value pairs. This preserves
arbitrary non-string keys. The JSON schema also has untagged arrays and pair
arrays for statically known collection fields; a codec must use the form
required at its actual call site rather than treating the two forms as
interchangeable. These are value schemas, not remote-operation messages.

A by-value argument is snapshotted and boxed before the invocation is sent. A
by-value return additionally needs an acknowledgement lifetime because its copy
can contain interface objects needed while the caller establishes proxies. The
callee returns `RpcByvalReturnValue<T>` with `value` and `slot`, retains the
recursive unboxed copy under that slot, and releases it only after
`EndInvokeMethod`. The caller must send `EndInvokeMethod` in a `finally` path
after result reconstruction succeeds or fails.

That `finally` rule is intentional TypeScript hardening. The current generated
C++ caller sends `EndInvokeMethod` only after successful unboxing, so a decode
failure leaves the slot until lifecycle finalization. Compatibility does not
require reproducing that leak window.

### By-reference transfer

By-reference transfer converts the collection to `RpcObjectReference`. The
receiver obtains an interned proxy, and hold/unhold controls the owner's strong
reachability. The outer collection and every nested collection are live remote
objects; accessing a nested collection returns another reference rather than a
snapshot.

A null by-reference collection is JSON `null` at an unknown-value boundary and
creates no proxy or hold. A statically known reference schema can still use the
inner null-reference triple `{clientId: -1, objectId: -1, typeId: -100}`. Do not
confuse `typeId: -100` with a predefined collection type.

Collection proxies dispatch through predefined negative type and operation IDs,
not contract-specific generated method IDs. The generic operations cover
enumerator creation/advance/current value, count/get/search, list and array
mutation, dictionary lookup/mutation/key and value views, and observable-list
change notification. Element, key, and value traffic uses the unknown-value
serializer so nested collections and RPC interface values can become references
as required.

Preserve the capability boundary of each predefined type:

| Predefined type | Type ID | Remote capabilities |
| --- | ---: | --- |
| Enumerable | -1 | Create an enumerator |
| Enumerator | -2 | Advance and get current; the proxy tracks its index locally |
| Array | -3 | Enumerate, count/get/search, set, and resize; not list clear/remove/insert |
| List | -4 | Read-only-list operations plus set/add/insert/remove-at/clear |
| Observable list | -5 | List operations plus the `ItemChanged` event |
| Dictionary | -6 | Count/get/contains-key/key and value views plus set/remove/clear |
| Read-only list | -7 | Enumerate, count/get/contains/index-of |

The convenience operation `Remove(value)` on a list can be implemented as
`IndexOf` followed by `RemoveAt`; it has no separate predefined wire ID.
Dictionary key/value views are live remote read-only lists, and those views and
enumerators are themselves referenced objects with their own holds. Do not
accept a list-only operation as an array shortcut or vice versa.

A read-only dictionary is intentionally absent from the predefined type table.
The analyzer accepts `const V[K]`, and by-value copying supports it, but the
current reference lifecycle has only mutable dictionary type ID `-6` and its
mutable proxy. A mutable dictionary viewed through a read-only type may appear
to work, while a genuinely read-only implementation cannot be identified and
the `-6` capability would expose mutation operations. Treat by-reference
read-only dictionaries as another explicit compatibility gap: reject them until
a protocol/reference decision and cross-language test define the behavior.

Reference conversion is bidirectional:

- A local container is assigned or reuses a stable local reference.
- A remote collection proxy is converted back to its original remote reference.
- A reference returned to its owning endpoint resolves to the original local
  container, not a proxy that calls back into itself.

This round trip preserves container identity and makes mutations visible at the
owner. It also means a TypeScript by-reference collection cannot honestly be a
plain `T[]` or `Map<K, V>`: index access, iteration, reads, and mutations can all
require RPC. The runtime should expose explicitly asynchronous typed collection
interfaces and separate local-container adapters.

## Interfaces, Inheritance, and Overloads

An object can implement an RPC interface with base interfaces. Generated
dispatch and type-recognition tables must honor the complete inheritance graph.
Converting a reference to a supported base interface preserves the owning
client and object ID while using the appropriate type information.

Workflow permits overloaded operations because numeric IDs disambiguate them.
JavaScript has no runtime overload selection based on static parameter types.
Generated TypeScript declarations may expose overload signatures for type
checking only when one implementation can unambiguously route them. Otherwise,
the generator must emit collision-free operation names or require an explicit
operation selector. It must never choose a wire ID by argument-count guessing at
runtime.

TypeScript's structural typing also cannot establish an RPC runtime type ID.
Generated registration and conversion APIs need explicit descriptors, brands,
or tokens that bind a value to a contract interface.

## Properties

RPC properties are compiled to method and event operations.

- A dynamic property's getter always performs a remote call.
- A cached property performs the first getter remotely, stores the result in the
  proxy, and invalidates it when the associated change event arrives.
- A cached by-value collection is a cached snapshot; a cached by-reference
  collection is a cached proxy to the live remote container.
- Setters dispatch remotely in both modes, and a setter and its change event
  must cooperate with event-suppression logic.
- Finalization detaches any generated event handlers and clears cached values.

JavaScript property syntax cannot await. A TypeScript generator should normally
expose asynchronous getter/setter methods, or another explicitly asynchronous
API, rather than return promises from deceptively synchronous fields.

## Events and Observable Collections

Generated bindings need:

- Local event attachment when an object becomes remotely visible.
- Detachment when the local object record is removed.
- Event argument serialization and deserialization.
- Invocation of proxy-side event handlers.
- Echo suppression for remotely applied events.
- Aggregation and propagation of event-handler exceptions.

All by-reference collection families use predefined RPC interface and operation
IDs. They are runtime features, not newly generated application methods.
Observable lists additionally broadcast the predefined `ItemChanged` event.
Generated serializers still need to recognize element/key/value values and
apply the enclosing use site's transfer mode recursively.

Subscriptions can keep application state reachable. They must be released by
explicit proxy disposal and lifecycle finalization, not only by garbage
collection.

## Error Model

Keep these failure classes distinct:

1. A user implementation throws. Convert the value to the serialized
   `RpcException` shape and return it as the invocation response.
2. A remote response contains `RpcException`. Reconstruct and reject with a
   remote-call error that retains the remote message and metadata.
3. An unknown type, method, event, malformed envelope, invalid source, or wrong
   response is a protocol error. It must not be disguised as a user exception.
4. A local serializer, dispatcher invariant, or transport fails. Terminate or
   fail the affected lifecycle according to the host policy and reject pending
   work.

TypeScript catch variables are `unknown`. Exception conversion must safely
derive a message from `Error` and non-`Error` thrown values. Every accepted
direct request must produce either a success response or an exception response;
dropping a response leaves the caller permanently pending.

There is no implicit protocol support for request cancellation, deadlines,
heartbeats, or endpoint reconnection. A higher layer may define such a policy,
but a compatible base runtime must not invent wire messages or silently retry a
non-idempotent RPC operation.

## Validation and Trust Boundaries

Even on a local connection, validate:

- Message discriminants and required fields.
- Safe integer request, client, object, type, method, event, and slot IDs.
- That direct messages target this endpoint and target-object invocation/hold
  references belong to that endpoint.
- At coordinator ingress, that the connected sender matches `sourceClientId`;
  at endpoints, that the claimed source is valid for the specific direct,
  redirected-broadcast, consolidated-response, or declaration route.
- That object references in service declarations belong to the declaration's
  logical source.
- That ordinary payload references are valid triples without requiring their
  owner to equal the envelope source or target.
- That a requested local object exists and supports the requested interface.
- That the operation ID belongs to that interface.
- Argument count and serialized shapes.
- Response kind, source, target, request ID, and payload shape.

Reject duplicate pending request IDs and responses for unknown or already
completed requests. Generated lookup tables should use maps or null-prototype
objects so contract strings cannot affect prototype lookup.

## Required TypeScript Runtime Facilities

A browser- and Node-compatible implementation can target ES2022 and use:

- `Promise` for remote invocation and service discovery.
- `Map` and `Set` for requests, services, local objects, and per-client interest.
- `WeakMap` for local-object-to-reference reverse lookup.
- `WeakRef` for the remote proxy cache.
- `FinalizationRegistry` as a best-effort release fallback.
- `AbortSignal` only as a local lifecycle/transport control unless cancellation
  is explicitly added to the wire protocol.

`WeakRef` and `FinalizationRegistry` are optimization/safety facilities, not a
replacement for deterministic disposal. Their correct use is specified in
[MemoryManagement.md](MemoryManagement.md).

The generic runtime should not depend on DOM types, a particular HTTP library,
Node globals, or generated application modules. Transport adapters and generated
bindings depend on the runtime, not the reverse.

## Conformance Checklist

An implementation is not complete until it demonstrates:

- Exact use of generated numeric IDs.
- Broker login and cached service declaration behavior.
- Direct method request/response correlation with concurrent nested calls.
- User-exception round trips and distinct protocol failures.
- Reference conversion, proxy interning, and per-client hold/unhold.
- Symmetric endpoint ownership and a three-endpoint reference relay that
  preserves the original owner, routes calls/holds directly to it, and survives
  disposal of the intermediate proxy.
- Local service owner holds.
- Default and explicit transfer modes for ordinary, observable, nested, and
  RPC-interface-containing collections.
- Independent input/output modes, by-reference collection operations and
  identity, and by-value recursive snapshot behavior.
- By-value return slot cleanup in success and failure paths.
- Interface inheritance and runtime type recognition.
- Events raised from both owners and proxies, broker source/request rewriting,
  echo suppression, exception aggregation, and detachment.
- Cached-property invalidation and dynamic-property behavior.
- Transport failure rejecting all pending operations.
- Explicit endpoint finalization and proxy disposal.
- Deterministic generated output and strict schema validation.
- Safe handling or rejection of numeric values not exactly representable in the
  target language.

The code-generator responsibilities and input contracts are detailed in
[CodeGeneration.md](CodeGeneration.md).
