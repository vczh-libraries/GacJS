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
- `Byval` versus `Byref` decisions.
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
- `sourceClientId`: logical originating RPC endpoint.
- `targetClientId` for direct traffic.

Direct responses use the same request ID and reverse source and target. The
dispatcher must correlate by both the expected operation and request ID, and it
must validate routing fields for the route being processed. At coordinator
ingress, the claimed source must match the connected sender. A broker-forwarded
broadcast or service declaration can retain its logical origin even though the
immediate transport sender is the broker.

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
- Lists, observable lists, and maps.
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

## By-Value and By-Reference Semantics

`@rpc:Byval` recursively serializes the logical value. The receiver obtains an
independent copy. A collection returned by value can contain references needed
while reconstruction is in progress; the owner therefore returns a
`RpcByvalReturnValue<T>` containing both `value` and a `slot`. The caller sends
`EndInvokeMethod` in a `finally` path after deserialization succeeds or fails.
The callee keeps slot storage strongly reachable until then.

`@rpc:Byref` sends an object reference. The receiver obtains an interned proxy,
and hold/unhold controls the owner's strong reachability. Observable collections
and values containing RPC interfaces normally require by-reference behavior.
Plain serializable values normally use by-value behavior. The normalized
metadata resolves the final decision; target implementations must not repeat
the inference heuristics.

For a reference parameter, conversion is bidirectional:

- A local object is assigned or reuses a stable local reference.
- A remote proxy is converted back to its original remote reference.
- A reference owned by the current endpoint resolves directly to the local
  object, not to a proxy that calls back into itself.

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

Observable collection operations use predefined RPC interface and operation IDs.
They are runtime features, not newly generated application methods. Generated
serializers still need to recognize the collection's element/key/value types and
its by-reference semantics.

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
- That direct messages target this endpoint.
- At coordinator ingress, that the connected sender matches `sourceClientId`;
  at endpoints, that the claimed source is valid for the direct or
  broker-forwarded route.
- That object references in service declarations belong to the declaration's
  logical source.
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
- Local service owner holds.
- By-value return slot cleanup in success and failure paths.
- Interface inheritance and runtime type recognition.
- Event broadcast, echo suppression, exception aggregation, and detachment.
- Cached-property invalidation and dynamic-property behavior.
- Transport failure rejecting all pending operations.
- Explicit endpoint finalization and proxy disposal.
- Deterministic generated output and strict schema validation.
- Safe handling or rejection of numeric values not exactly representable in the
  target language.

The code-generator responsibilities and input contracts are detailed in
[CodeGeneration.md](CodeGeneration.md).
