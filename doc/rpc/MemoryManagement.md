# Memory Management for Workflow RPC in TypeScript

## Purpose

Workflow RPC gives remote objects identity and an explicit distributed
ownership protocol. The reference implementation is written for a
reference-counted object model, while TypeScript runs on a tracing garbage
collector with nondeterministic finalization. This document defines the state
and algorithms needed to bridge that difference without changing the wire
protocol.

`FinalizationRegistry` is useful as a best-effort fallback, but it cannot be the
primary ownership mechanism. Correctness requires remote-proxy interning,
explicit asynchronous disposal, generation-safe lease state, and deterministic
lifecycle finalization.

## The Ownership Rule

The RPC owner does not maintain an ordinary count of proxy instances. Each local
object has a set of interested client IDs:

~~~ts
interface LocalObjectEntry {
    readonly ref: RpcObjectReference;
    readonly object: object;
    readonly interestedClients: Set<number>;
}
~~~

`ObjectHold(ref, true)` inserts the sending client ID into the set.
`ObjectHold(ref, false)` removes it. Duplicate holds are idempotent, but an
unhold without a matching interest is a protocol error. When the set becomes
empty, the owner can detach listeners, remove the entry, and release its strong
reference.

This gives three essential invariants:

1. There is at most one logical interest for a particular
   `(remote reference, interested client)` pair.
2. All proxies for the same reference in one endpoint must behave as one logical
   lease.
3. A stale unhold is dangerous: it can remove the only logical interest even if
   a newer proxy is alive.

Calling the mechanism “reference counting” is convenient, but treating it as a
wrapper-instance counter produces incorrect TypeScript implementations.

## Object Identity

### Reference keys

Proxy-view identity contains all three fields, while the logical hold is scoped
to the owning endpoint and object:

~~~ts
function proxyKey(ref: RpcObjectReference): string {
    return [ref.clientId, ref.objectId, ref.typeId].join(":");
}

function leaseKey(ref: RpcObjectReference): string {
    return [ref.clientId, ref.objectId].join(":");
}
~~~

Use a structured key or a canonical encoding that cannot collide. Validate all
IDs as safe integers before constructing it.

Two references with the same owner and object ID but different interface type
IDs can denote different typed views. They must share one logical hold lease,
because the owner records interest per client and object rather than per type
view. Generated proxies and lookup tables still preserve the full reference.
The simplest generator preserves the original `typeId` and implements base
interfaces on that proxy instead of synthesizing alternate references. A runtime
that accepts alternate views must use the shared `leaseKey` rule.

### Conversion invariants

`refToObject` and `objectToRef` must obey:

- A reference owned by the local endpoint resolves to the tracked local object.
- A remote reference resolves to the existing live proxy when one exists.
- Otherwise, it creates one proxy and establishes one logical remote lease.
- A local object reuses its existing local reference.
- A remote proxy converts back to its original reference.
- A proxy must never be re-exported as a newly owned local object.

TypeScript structural typing is insufficient to recognize a remote proxy.
Generated wrappers should carry a private runtime record or brand stored in a
runtime-owned `WeakMap`. Do not trust a public property that application code
can forge.

### Transitive handoff between peers

Object ownership does not follow the path by which a reference travels. For an
A-owned object relayed from B to C:

1. `objectToRef` on B's branded proxy returns the unchanged A-owned reference.
   It creates no B-owned local entry and no forwarding record.
2. `refToObject` at C creates or interns a C-side proxy and sends C's hold
   directly to A.
3. A records B and C as independent members of `interestedClients` while both
   endpoints have live claims.
4. Disposing B's proxy removes only B. C remains able to invoke A.
5. Passing the reference back to A resolves A's exact local object without a
   proxy or remote hold.

A reference transfer is not a transfer or delegation of B's existing interest.
The receiver establishes its own interest at the original owner; B remains a
separate holder until B releases its own proxy. By-value return slots provide an
explicit acknowledgement lifetime for interface leaves in copied graphs.

This rule is session-scoped. A proxy record includes its originating lifecycle;
serializing it through a different lifecycle must fail instead of treating it as
a local implementation. Multiple endpoints in one process still have separate
local-object, proxy, service, request, and lease tables. Process co-location is
not permission to bypass dispatcher routing, and one language object must not be
simultaneously claimed as local by two active lifecycles.

## Runtime State

A lifecycle can use the following conceptual state:

~~~ts
interface RpcLifecycleState {
    active: boolean;
    localClientId: number;
    nextObjectId: number;

    localById: Map<number, LocalObjectEntry>;
    localByObject: WeakMap<object, LocalObjectEntry>;
    localServices: Map<number, LocalObjectEntry>;
    remoteServices: Map<number, RpcObjectReference>;

    remoteLeases: Map<string, RemoteLease>;
    remoteViews: Map<string, RemoteProxyView>;
    proxyRecords: WeakMap<object, ProxyRecord>;
    finalizers: FinalizationRegistry<FinalizerToken>;

    byValueSlots: Map<number, unknown>;
    pendingRequests: Map<number, PendingRequest>;
}
~~~

The exact class split is an implementation decision. The ownership direction
is:

- `localById` strongly owns local entries and their objects for the entire time
  they are tracked, including the zero-interest interval before a first hold.
- `localByObject` is only reverse identity lookup.
- `remoteLeases` owns lease bookkeeping but must not strongly own proxy targets.
- Proxy targets can strongly own immutable proxy metadata.
- `FinalizationRegistry` held values must not own their targets.
- In-flight calls and active event subscriptions may deliberately retain proxy
  state until their work finishes.

## Local Objects

### First export

When a plain local implementation is converted to a reference:

1. Return the existing entry from `localByObject` if present.
2. Determine and validate its generated RPC interface descriptor.
3. Allocate an object ID unique for the active lifecycle.
4. Create `{clientId: localClientId, objectId, typeId}`.
5. Add the entry to `localById` and `localByObject`.
6. Attach generated event and observable-collection listeners.
7. Retain the object strongly in the entry.

Creating the record does not invent a remote interest. An interest is added when
the relevant remote endpoint successfully performs `ObjectHold(true)`, or when
the runtime establishes a defined owner hold for a service.

Object IDs must not be reused during a lifecycle. After an entry is removed, a
later export of the same still-live language object can receive a new ID because
the old distributed identity no longer exists.

For a supported by-reference strongly typed collection, step 2 selects the most
specific predefined negative collection type ID rather than an application
interface ID. Enumerable, read-only list, list, array, observable-list, and
mutable dictionary objects otherwise enter the same local tables and ownership
protocol as generated application objects. Runtime-created enumerators do the
same under their own predefined type ID. Only an observable list needs an
owner-side item-change listener. The current protocol/reference runtime has no
safe type ID or proxy for a genuinely read-only dictionary; generation must
reject that by-reference case until its capability is defined.

### Holds

For an incoming hold request:

1. Validate the request's `remoteClientId` and require it to equal the
   dispatcher-validated logical `sourceClientId`.
2. Validate that `ref.clientId` is the local endpoint.
3. Locate `ref.objectId`.
4. Validate that the object supports `ref.typeId`.
5. For hold, add `remoteClientId`.
6. For unhold, require and remove `remoteClientId`.
7. Return the required protocol response.
8. If no interests remain, remove the entry.

The coordinator/dispatcher is responsible for authenticating the logical
source according to the route. Never trust an arbitrary `remoteClientId` from
the payload, and never silently substitute another sender without validating
that the two values agree.

Removing an entry is ordered:

1. Mark it unavailable to new dispatch.
2. Detach all generated event and collection listeners.
3. Remove service/reverse/ID mappings that point to it.
4. Clear caches or retained helper objects.
5. Drop the strong reference last.

Incoming method dispatch should take a strong local copy of the entry before
awaiting an implementation method, so a concurrent unhold cannot invalidate an
already accepted invocation.

### Service owner holds

Registering a constructor service creates a deterministic service reference with
`objectId === typeId`. It also adds a local owner interest, normally represented
by the local endpoint's own client ID. The service remains alive independent of
remote consumers.

Registration is allowed only in the lifecycle's setup phase. Service
unregistration, if exposed, must first prevent new service resolutions and then
follow an explicit protocol/application policy; it is not equivalent to a
remote client's unhold.

## Remote Proxies

### Weak interning

One endpoint must normally return the same live proxy for repeated conversions
of one remote reference. Typed proxy views share the owner/object lease:

~~~ts
interface RemoteLease {
    readonly key: string;
    refForHold: RpcObjectReference;
    readonly claims: Map<string, number>;
    desiredHeld: boolean;
    acknowledgedHeld: boolean;
    transition: Promise<void>;
    closed: boolean;
}

interface RemoteProxyView {
    readonly key: string;
    readonly ref: RpcObjectReference;
    generation: number;
    proxy: WeakRef<object> | undefined;
}

interface ProxyRecord {
    readonly lease: RemoteLease;
    readonly view: RemoteProxyView;
    readonly generation: number;
    disposed: boolean;
}

interface FinalizerToken {
    readonly leaseKey: string;
    readonly viewKey: string;
    readonly generation: number;
    readonly lifecycleGeneration: number;
}
~~~

`refToObject` first checks the full-reference `RemoteProxyView` and its
`proxy?.deref()`. If it returns a live, non-disposed proxy, reuse it. Otherwise
create a new view generation, add `claims.set(view.key, generation)` on the
shared owner/object lease, construct the proxy, store its `WeakRef`, register a
finalizer token, and reconcile the logical hold before the proxy can send calls.

The maps own lease/view bookkeeping, not proxy targets. Neither record may
contain a closure that captures a proxy. Generated methods can retrieve their
`ProxyRecord` from the runtime `WeakMap`.

### Why a naive finalizer is wrong

This implementation is unsafe:

~~~ts
registry.register(proxy, ref);
// Later:
void sendObjectHold(ref, false);
~~~

The failure sequence is:

1. Proxy A sent hold(true).
2. A becomes unreachable and its `WeakRef` clears.
3. Before A's finalizer runs, conversion creates proxy B.
4. B sends hold(true), which is an idempotent insertion at the owner.
5. A's delayed finalizer sends hold(false).
6. The owner removes this client's only interest while B is live.

The same problem exists even if B does not send a duplicate hold: a finalizer
cannot know that a newer wrapper inherited the lease unless the runtime tracks
generations.

### Lease reconciliation

All hold transitions for one remote owner/object must be serialized. Treat
`desiredHeld` as current local intent and `acknowledgedHeld` as the last
successfully acknowledged remote state.

Conceptually:

~~~ts
function scheduleReconcile(lease: RemoteLease): Promise<void> {
    lease.transition = lease.transition.then(async () => {
        while (!lease.closed && lease.desiredHeld !== lease.acknowledgedHeld) {
            const requested = lease.desiredHeld;
            await dispatcher.objectHold(lease.refForHold, requested);
            lease.acknowledgedHeld = requested;
        }
    });
    return lease.transition;
}
~~~

Production code must also consume failures, avoid a permanently rejected promise
chain, and coordinate endpoint termination. The important properties are:

- Only one hold operation per remote owner/object is in flight.
- A proxy cannot invoke methods until its required hold is acknowledged.
- A finalizer removes only its matching current view generation, then derives
  `desiredHeld` from whether any view/call claims remain.
- If a replacement appears while unhold is in flight, unhold may finish, but a
  new hold must finish before the replacement invokes a method.
- Removing a lease record is allowed only when it has no claims, no transition
  is running, and the acknowledged state is unheld.

The runtime can optimize duplicate holds away. It cannot optimize away the
unhold-then-rehold ordering when an unhold has already been sent.

### Finalizer callback

A `FinalizationRegistry` callback is synchronous and cannot await network work.
It should:

1. Find the lifecycle and lease indirectly from the plain token.
2. Return immediately if the lifecycle generation is no longer active.
3. Find the proxy view and return if the token's generation is stale.
4. Clear/remove that view and its matching lease claim.
5. Set `desiredHeld = (claims.size !== 0)`.
6. Enqueue lease reconciliation.
7. Attach rejection handling so no unhandled promise rejection escapes.

The callback's held value must contain IDs and generation numbers only. It must
not contain the proxy, a bound proxy method, or another object that retains the
proxy. Be equally careful that an unregister token is not stored only through a
cycle that defeats collection.

Garbage collection and finalization can be skipped entirely at process exit.
They can be delayed indefinitely while an event loop is idle. Remote correctness
must never depend on a finalizer running promptly.

## Explicit Disposal

Every generated remote proxy should offer, directly or through a runtime helper,
an explicit asynchronous release operation:

~~~ts
interface RpcDisposable {
    dispose(): Promise<void>;
    readonly disposed: boolean;
}
~~~

Disposal should be idempotent:

1. Mark the proxy record disposed so new calls fail locally.
2. Unregister its finalizer token.
3. If this is still the current view generation, clear/remove the view and its
   matching lease claim, then derive `desiredHeld` from remaining claims.
4. Await serialized reconciliation.
5. Remove the lease if it is now quiescent.

If another live typed view deliberately shares the same underlying logical
lease, disposal must release only that view's local claim and unhold only when
no local claim remains. This is an internal local counter/set; it must not be
confused with the owner's per-client interest set.

The API should support an explicit structured pattern:

~~~ts
const proxy = await services.getExample();
try {
    await proxy.doWork();
} finally {
    await proxy.dispose();
}
~~~

ECMAScript explicit resource management can be added when the runtime target
supports asynchronous disposers, but a normal `dispose()` method remains useful
across browser and Node versions.

## Calls, Callbacks, and Retention

A generated proxy call must capture enough immutable state to finish even if
application code drops or disposes the proxy immediately afterward. Define one
of these policies explicitly:

- Disposal waits for all calls already accepted by that proxy, then unholds.
- Each accepted call acquires a short-lived local lease claim released in
  `finally`.

Do not allow an unhold to overtake an already accepted invocation. New calls
after disposal fail before allocating a request ID.

Pending-request entries strongly retain only what is needed to deserialize and
settle the result. They are removed in every terminal path. A transport failure
or lifecycle finalization rejects all pending promises and releases their local
claims.

By-reference callback arguments are normal remote proxies and follow the same
lease rules. Nested callbacks must be dispatchable while an outer invocation is
pending; memory bookkeeping must not hold a non-reentrant global lock across an
`await`.

## Events, Properties, and Collections

Remote event subscriptions and generated cached properties add reachability:

- A proxy-side event subscription can retain user callbacks and cached values.
- Owner-side event adapters can retain the local object and dispatcher.
- Observable-collection wrappers can attach multiple listeners.
- Cached property values can themselves contain remote references.

Explicit proxy disposal must detach proxy-side listeners, clear cached property
values, release any nested runtime-managed references, and prevent future event
delivery. Local object removal must detach owner-side listeners before dropping
the object.

Event-suppression counters must be decremented in `finally` even if a handler
throws. A leaked suppression entry is a semantic leak: it can keep state alive
and permanently suppress future events.

Generated wrappers for predefined enumerable, enumerator, read-only list, list,
array, observable-list, and dictionary interfaces use the same proxy lease
machinery as application interfaces. Do not implement a second ownership
algorithm for collections.

## Container Ownership

### By-reference containers

A by-reference container is a normal distributed object with a predefined
negative `typeId`. Its proxy's count, element access, search, mutation,
enumeration, and dictionary operations are RPC calls. The use site's transfer
mode applies recursively: a nested collection obtained from an element, key, or
value is exported as another reference rather than copied.

The null reference sentinel has the inner triple
`{clientId: -1, objectId: -1, typeId: -100}`. At an unknown-value boundary it is
wrapped with `$: "system::RpcObjectReference"`. It resolves to null and creates
no local entry, proxy view, hold, finalizer token, or lease.

Those helper objects have real lifetimes. In particular:

- A nested collection proxy has its own reference, proxy view, and lease claim.
- Creating a remote enumerator returns a separate enumerator reference and
  establishes another claim.
- Dictionary key and value views are separate remote read-only-list objects.
- An observable-list proxy uses the same object lease and additionally owns
  local subscription state for `ItemChanged`.

Transient access can therefore allocate remotely held objects. Async iteration
must dispose its enumerator in `finally`, including early `break`, exceptions,
and cancellation at the local API layer. Dictionary key/value views and nested
collection proxies need the same explicit disposal and generation-safe
finalizer fallback as any application proxy. Endpoint finalization invalidates
and clears all of them without trying to walk the network sending unholds.

When a by-reference result comes back to the endpoint that owns the reference,
`refToObject` returns the original local container. It must not allocate a local
proxy or a second hold. This is what lets a service return a by-reference input
and preserve identity at the caller.

### By-value containers

A by-value transfer creates no distributed identity or lease for its collection
shells. Boxing and unboxing recursively create local outer and nested
containers. Mutating either side, including raising an observable-list event,
does not affect the copy on the other side.

RPC interface objects found inside that copied graph are different: they remain
object references and reconstruct as local objects or ordinary held proxies.
Those caller-side proxies follow the normal lease/disposal rules after
reconstruction. A container retaining such a proxy keeps that proxy reachable,
but the by-value return slot described below does not become its long-term
owner.

The reference by-value copy/box/unbox runtime rejects cycles in a recursively
transferred collection graph. Shared subcontainer aliasing is not a by-value
identity guarantee; an implementation may materialize repeated occurrences as
separate copies. Cycle detection must use temporary traversal state and must not
leave a failed partial copy or slot reachable.

## By-Value Return Slots

By-value collection returns have a separate, deterministic lifetime:

1. The callee recursively copies/boxes the return value.
2. References reachable from that copy must stay valid during deserialization.
3. The callee stores the copied value in a numbered slot.
4. The response contains `{value, slot}`.
5. The caller deserializes and establishes required proxy holds.
6. The caller sends `EndInvokeMethod(slot)` in a `finally` block.
7. The callee removes the slot and releases its retained copy.

The retained value is the callee-side recursive unboxed copy, not merely the
JSON node. This keeps actual RPC interface elements alive until the caller has
converted their references and established holds. After `EndInvokeMethod`, any
interface proxies inside the caller's reconstructed local containers are owned
by normal caller reachability and remote lease claims; the slot has no further
role in their lifetime.

An interface element can itself be a proxy owned by a third endpoint. Retaining
the copied graph also retains that forwarding endpoint's claim until the caller
has established its own hold directly at the original owner; the slot never
changes the reference's owner to the callee.

`byValueSlots` strongly owns its values. Slot IDs are lifecycle-local, unique
while active, and validated as safe integers. The reference generated
`EndInvokeMethod` ignores removal of an unknown or already released slot, so
repeated cleanup is an idempotent no-op there. A TypeScript implementation may
diagnose this more strictly only as an intentional, documented validation
policy; prefer the reference no-op behavior for wire compatibility and keep any
strict duplicate diagnostic local. Code must not depend on remote rejection for
reference interoperability.

The caller must send `EndInvokeMethod` even if value deserialization, proxy
creation, or user conversion fails. The callee must release all remaining slots
during lifecycle finalization because a disconnected caller cannot send
cleanup. By-value arguments do not allocate return slots; their collection
shells are snapshotted before sending and the accepted call retains whatever is
needed until the invocation completes.

This `finally` cleanup is deliberately stronger than the current generated C++
caller, which ends an invocation only after successful unboxing. It preserves
the same wire protocol while preventing a failed TypeScript decode from keeping
the slot until endpoint finalization.

## Lifecycle Finalization

Endpoint finalization is the authoritative cleanup operation. It is separate
from individual proxy disposal and should be idempotent.

Recommended order:

1. Atomically mark the lifecycle inactive and advance its generation.
2. Stop accepting new calls, exports, services, holds, and events.
3. Reject all pending service waits and invocation promises.
4. Disconnect/invalidate generated proxies so their later methods fail locally.
5. Unregister known finalizer tokens.
6. Mark leases closed and consume/stop queued transition errors.
7. Detach every local event and collection listener.
8. Clear by-value slots, services, local-object tables, caches, and suppression
   state.
9. Release transport/dispatcher references.

The reference behavior disconnects wrappers and clears local state without
trying to send unholds during shutdown. Preserve that rule unless a future
protocol explicitly defines a graceful disconnect handshake. Once the transport
has failed, best-effort network cleanup is unreliable and can mask the original
failure.

Late finalizer callbacks are ignored using the lifecycle generation. Late
transport responses cannot resurrect entries or settle a promise twice.

## Failure Policy

Hold/unhold is a request/response protocol operation. A failure before
acknowledgement leaves remote state uncertain. The base runtime should normally
treat a hold-transition failure as a lifecycle/transport failure, invalidate the
affected proxy, and reject dependent calls. Silently pretending that an unhold
succeeded can leak; silently pretending that a hold succeeded can cause a
use-after-release.

Do not retry hold/unhold or invocation blindly. A response may have been lost
after the owner applied the operation. Holds are idempotent at the owner, but
their ordering relative to unholds matters; application method invocations need
not be idempotent.

Diagnostic errors should include the reference key, transition, request ID, and
lifecycle generation without retaining the application object.

## Testing

### Deterministic unit tests

Use an injectable finalizer/reconciliation scheduler and a fake dispatcher.
Cover:

- Repeated `refToObject` returns the same live proxy.
- `objectToRef` returns a proxy's original reference.
- A three-endpoint A-to-B-to-C relay preserves A's reference, creates C's hold
  directly at A, and allocates no forwarding object at B.
- A independently tracks B and C; after B disposes, C can still invoke A, and a
  reference returned to A resolves to A's exact object.
- A proxy from another lifecycle/session is rejected rather than re-exported.
- Co-located endpoints retain separate ownership and lease tables.
- A local object keeps one stable ID while tracked.
- Holds from the same client are idempotent.
- Different clients create distinct owner interests.
- The last unhold removes a non-service local object and detaches listeners.
- A registered service survives remote unholds because of its owner interest.
- Explicit disposal sends/awaits one logical unhold and is idempotent.
- A stale finalizer cannot unhold the current generation.
- Replacement during an in-flight unhold waits for a re-hold before invoking.
- A finalizer after lifecycle finalization sends nothing.
- An accepted invocation is not overtaken by disposal.
- Pending calls and service waits reject during finalization.
- Event caches/listeners and suppression state are cleared.
- `EndInvokeMethod` releases slots on success and deserialization failure.
- Nested by-reference collections acquire and release independent proxy claims.
- Early termination of remote enumeration disposes the enumerator.
- Dictionary key/value views are explicitly disposed.
- A by-value nested collection is mutation-isolated from its source, including
  observable-list events.
- Interface references inside a by-value result remain usable after its return
  slot is released and then follow ordinary proxy disposal.
- Cyclic by-value collection graphs fail without leaking slots or partial
  proxies.

The critical stale-finalizer test should explicitly schedule:

~~~text
hold(A) -> collect A -> create B -> run finalizer(A) -> call B
~~~

and the variant where unhold(A) has already been sent before B is created.

### Garbage-collector integration tests

When the test runtime exposes forced garbage collection, add a supplemental test
that observes eventual cleanup. It must tolerate multiple GC/finalizer turns and
must not be the only proof of correctness. A product test suite cannot require
that a specific `FinalizationRegistry` callback run within a fixed deadline.

### Leak checks

After deterministic finalization, assert that request tables, service waiters,
by-value slots, remote leases, strong local-object maps, event adapters, and
suppression maps are empty. Weak maps cannot be enumerated; expose internal test
counters or hooks instead of changing production ownership to make tests easier.

## Implementation Checklist

- Per-client owner interest is a `Set`, not an integer wrapper count.
- Local objects are strongly retained only while tracked.
- Reverse local identity uses `WeakMap`.
- Remote proxies are weakly interned by their complete references.
- All typed views of one remote owner/object share one logical hold lease.
- Proxies convert back to their original references.
- Relaying a proxy preserves its original owner and gives each receiving peer an
  independent direct owner interest.
- The null reference sentinel creates no object or lease state.
- Service registration establishes an owner interest.
- Every proxy has explicit asynchronous disposal.
- `FinalizationRegistry` is only a best-effort fallback.
- Finalizer tokens do not retain targets.
- Lease generations defeat stale-finalizer races.
- Hold transitions are serialized and calls await the required hold.
- Accepted calls are protected from concurrent disposal.
- Event/listener/property-cache cleanup is deterministic.
- Nested collection, enumerator, and dictionary-view proxies use ordinary
  generation-safe leases and deterministic disposal.
- By-value collection shells have no remote identity; interface leaves retain
  their normal object-reference lifetime.
- By-value slots are strongly held until `EndInvokeMethod`.
- Lifecycle finalization invalidates everything without relying on network
  cleanup or garbage collection.
