# GacJS Network Protocol

This document is the wire-level guide for implementing a GacJS-compatible
renderer or remote view-model host in another programming language. It covers
the protocols used by:

- `Gaclib/website/remote-protocol-http`
- `Gaclib/website/rvmhost`
- `Gaclib/website/rvm`
- `Gaclib/website/entry`

It does not cover building or starting `RemotingTest_Core`, hosting the website,
or operating the sample UI. See
[Operating GacUI Through GacJS](../../GacUI/.github/Jobs/DebugRemoteProtocolWithGacJS.md)
for those tasks. See [Protocol.md](Protocol.md) for the GacUI Remote Protocol
message catalog after the connection handshake succeeds.

The HTTP and stdio transports described here are test and demonstration
transports. They provide no authentication, authorization, TLS termination,
message replay, end-to-end application acknowledgement, or exactly-once
delivery.

## Two Handshake Levels

Every connection has two conceptual handshake levels.

| Level | Renderer over HTTP | RVM host over HTTP | RVM host over stdio |
|---|---|---|---|
| 1. Transport and channel admission | Acquire HTTP request/response paths, advertise `GacUIRemoteProtocol`, receive a client ID | Acquire separate HTTP paths, advertise both view-model channels, receive a host ID | Exchange Base64-framed channel join and assignment packages |
| 2. Application | Send `ControllerConnect`; answer the Core's configuration requests | Send `Ready`; accept Workflow RPC `Login`; declare and hold `IViewModel` | After Base64 decoding, perform exactly the same RVM application handshake as HTTP |

The generic VlppOS `NetworkPackage` envelope sits between these levels:

```text
Remote Protocol JSON array ─┐
                            ├─ NetworkPackage ─ HTTP UTF-8 response body
Workflow RPC JSON array ────┘                 └ stdio Base64 line
```

HTTP bodies carry the `NetworkPackage` as plain UTF-8 text. Stdio carries the
same complete UTF-8 package encoded once as Base64. The JSON body is never
Base64-encoded separately.

## The Shared NetworkPackage Envelope

### Grammar

An ordinary package has this text grammar:

```text
<primary-id>[,<extra-id>...];<channel-name>;<message-body>
```

Split on the first two semicolons only. `message-body` may contain any number of
additional semicolons.

The first field is directional:

- Client to server: `primary-id` is the receiver. An empty ID broadcasts to all
  eligible clients. Extra comma-separated IDs exclude those receivers from a
  broadcast.
- Server to client: `primary-id` is the sender.

Client IDs are positive decimal integers. A channel name cannot contain `!` or
`;`. `NetworkPackage` itself does not require JSON, but every application
channel in this document uses a JSON array as its ordinary message body, even
when the array contains only one object or string.

Examples:

| Meaning | Serialized package |
|---|---|
| Join two channels before assignment | `;;ChannelA!ChannelB` |
| Server assigns client ID 7 | `7;;` |
| Client 7 sends directly to client 1 | `1;ChannelA;["value"]` |
| Server tells the receiver that client 7 sent a message | `7;ChannelA;["value"]` |
| Broadcast except clients 8 and 9 | `,8,9;ChannelA;["value"]` |
| Fatal channel error | `;!Error;error text` |

The direct-message examples deliberately have the same first field syntax but
different meanings. A client writes the destination; the server delivers a new
package whose first field identifies the source. Workflow RPC also includes
`sourceClientId` and `targetClientId` inside its JSON, so validate both layers.

### Channel admission

Before a client ID exists, the client sends one join package:

```text
;;<channel-1>!<channel-2>!...<channel-n>
```

If the server accepts that exact set of channel names, it replies:

```text
<assigned-client-id>;;
```

The transport connection can succeed while channel admission still fails. Do
not treat an HTTP `/Connect` response as proof that the requested role was
accepted. Parse the assignment and never assume a dynamic client ID.

`!Error` is the reserved fatal channel. A compatible client should terminate
the logical connection when it receives it or when an ordinary package is
malformed.

## HTTP Transport Handshake

`/Http` and `/MiniHttp` use the same wire protocol. Their server
implementations differ, but a client should not need a mode-specific code path.

The default Core endpoint is:

```text
Origin:   http://localhost:8888
Base:     /GacUIRemoteProtocolHttp
```

All three HTTP routes below are under that base.

For compatibility with both servers, do not rely on permissive HTTP framing.
`/MiniHttp` applies these stricter request rules:

- `Connect` and `Request` have no body, chunked transfer, or trailers. Omit
  `Content-Length` or send exactly one plain-decimal `Content-Length: 0`.
- `Response` has exactly one nonzero plain-decimal `Content-Length` whose value
  is the UTF-8 byte count, exactly one
  `Content-Type: application/json; charset=utf8`, and no chunked transfer or
  trailers.
- Encode request text as strict UTF-8.

Browser `fetch` supplies a valid content length automatically. A port using an
HTTP library may need to disable its default chunked request encoding.

### 1. Acquire a logical connection

Send:

```http
GET /GacUIRemoteProtocolHttp/VlppInterProcess/Connect HTTP/1.1
Host: localhost:8888
Accept: application/json; charset=utf8
```

A successful response has status 200 and a body containing exactly two
semicolon-separated paths:

```text
/VlppInterProcess/Request/01234567-89ab-cdef-0123-456789abcdef;/VlppInterProcess/Response/01234567-89ab-cdef-0123-456789abcdef
```

Resolve both returned paths under the configured origin and base. The token is
opaque; do not parse or manufacture it.

The names are from the server's perspective and can look reversed to a client:

- POST an empty body to the returned `Request` path to wait for one
  server-to-client package.
- POST a client-to-server package to the returned `Response` path.

### 2. Advertise channels

Immediately POST the join package to the `Response` path:

```http
POST /GacUIRemoteProtocolHttp/VlppInterProcess/Response/<token> HTTP/1.1
Host: localhost:8888
Content-Type: application/json; charset=utf8

;;GacUIRemoteProtocol
```

The body is plain UTF-8 `NetworkPackage` text, not JSON, despite the historical
media type.

The assignment often arrives in this POST's 200 response:

```text
2;;
```

A 200 response may instead have an empty body, in which case the assignment
arrives from the `Request` long poll. Support both cases.

### 3. Maintain the server-to-client read

Keep one empty POST outstanding on the `Request` path:

```http
POST /GacUIRemoteProtocolHttp/VlppInterProcess/Request/<token> HTTP/1.1
Host: localhost:8888
Accept: application/json; charset=utf8
Content-Length: 0
```

Each 200 response contains either one UTF-8 package or an empty body. Process a
nonempty package, then replace the long poll immediately. An empty body is not a
protocol message or delivery acknowledgement; issue the next long poll.
Current servers normally retain an idle poll instead of returning periodic
empty responses.

### 4. Send packages

Serialize outgoing POSTs to preserve order. POST each package to the
`Response` path with
`Content-Type: application/json; charset=utf8`.

Every successful send response can piggyback one server package. Process that
body through the same parser used by the long poll. Ignoring send-response
bodies can lose the channel assignment or an application message.

There is no HTTP disconnect route, idle heartbeat, replay, deduplication, or
exactly-once guarantee. The replacement `Request` POST is a transport-level
acknowledgement: after the server delivers a queued package through a long poll,
the next `Request` must arrive within five seconds or the server invalidates
the logical connection. A package piggybacked on a `Response` POST does not arm
this timer. While the connection is idle, no acknowledgement timer is armed and
a dead peer can remain undetected.

A non-200 response, failed request, or invalid response body is terminal. Stop
outstanding requests and create a fresh logical connection to reconnect.

## Renderer over HTTP

A renderer opens its own HTTP logical connection and advertises exactly one
channel:

```text
;;GacUIRemoteProtocol
```

The Core's renderer participant has fixed client ID `1`. The renderer's assigned
ID is dynamic and must still be parsed from its assignment package.

Install message handlers before starting the application handshake. Then send
this package to receiver 1:

```text
1;GacUIRemoteProtocol;[{"semantic":"Event","name":"ControllerConnect","arguments":{"documentCaretFromEncoding":"UTF16"}}]
```

This line is the complete HTTP request body in UTF-8. No part of it is Base64.

The first invocation in the first inbound package is:

```json
{"semantic":"Message","name":"ControllerConnectionEstablished"}
```

The Core batches this invocation with the two configuration requests described
below. Their request IDs are generated at runtime.

Remote Protocol invocations are objects collected in a JSON array:

| Field | Meaning |
|---|---|
| `semantic` | `Message`, `Request`, `Response`, or `Event` |
| `id` | Correlation ID on `Request` and the matching `Response` |
| `name` | Protocol operation name |
| `arguments` | Optional operation payload |

After `ControllerConnect`, the Core sends
`ControllerConnectionEstablished` and requests
`ControllerGetFontConfig` and `ControllerGetScreenConfig`. The renderer must
return `Response` invocations with the matching request IDs and the expected
configuration payloads. Do not depend on request IDs, batching, or relative
arrival beyond the request/response correlations.

Once those requests complete, normal Remote Protocol messages describe windows,
resources, DOM updates, input, and renderer-idle state. Implement those messages
according to [Protocol.md](Protocol.md).

`ControllerDisconnect` is an application event. It is not an HTTP transport
disconnect handshake.

## RVM Host over HTTP

The `rvm` package contains generated Workflow RPC bindings. It does not own the
connection. `rvmhost` owns the transport and lifecycle, while `entry` composes a
host and renderer for the browser sample.

An RVM host opens a logical HTTP connection separate from the renderer and
advertises exactly these two channels:

```text
;;ViewModelChannel!ViewModelReadyChannel
```

`RemotingTest_Core` accepts one host with that exact channel set. In the examples
below, host ID `H = 3`, Workflow RPC broker ID `B = 1`, and request ID `R = 1`
are illustrative. Use the client ID assignment and Login broker ID received at
runtime. Allocate outgoing Workflow RPC request IDs locally, and preserve an
incoming request ID in its response.

### RVM application handshake

1. Configure the Workflow RPC endpoint and register the local `IViewModel`
   service.
2. Start the channel reader before announcing readiness.
3. Broadcast readiness:

   ```text
   ;ViewModelReadyChannel;["Ready"]
   ```

   Over HTTP this is plain UTF-8 text, not Base64.

4. The Core admits the ready host to its Workflow RPC broker. The broker sends a
   Login package. With illustrative broker ID 1:

   ```text
   1;ViewModelChannel;[{"rpcChannelingSystem":"Login","serverClientId":1}]
   ```

   Because this is server-to-client traffic, the outer `1` identifies the
   sender. Validate that it equals `serverClientId` and remember it as `B`.

5. After Login, send the cached service declaration directly to `B`. With
   illustrative `B = 1`, `H = 3`, and `R = 1`:

   ```text
   1;ViewModelChannel;[{"rpcMethod":"Request:IRpcDispatcher_DeclareRemoteService","rpcRequestId":1,"sourceClientId":3,"ref":{"clientId":3,"objectId":0,"typeId":0}}]
   ```

   In client-to-server traffic, the outer `1` is the receiver. The generated
   `IViewModel` service uses type ID 0 and the registered service object uses
   object ID 0.

6. The Core-side requester acquires the declared service and sends
   `Request:IObjectOps_ObjectHold` with `hold: true`. Respond with
   `Response:IObjectOps_ObjectHold`. The GacJS host reports `serviceHeld` only
   after it has observed that external hold and the response has been written.

The Core does not admit a renderer for the RVM test application until the
service is held. Therefore, "TCP connected", "channel assigned", "Ready sent",
and "Login received" are all earlier states, not complete RVM readiness.

### Entry modes

- Plain `index.html` starts a renderer only. An independent RVM host must already
  be ready for the RVM test Core.
- `index.html?rvmhost` first connects and holds a browser RVM host, then opens a
  distinct renderer HTTP connection.
- The Node network CLI connects and holds its RVM host independently. Its
  exact `GACJS_RVMHOST_SERVICE_HELD` and `GACJS_RVMHOST_READY` stdout lines are
  process-readiness signals, not wire messages. `--service-only` emits only the
  first marker.

Do not reuse the RVM host's token or assigned ID for the renderer. The two roles
advertise different channel sets and use separate logical connections.

## Workflow RPC Call Example

`IViewModel` has type ID 0. Its `Translate(string)` method has method ID 1.
Suppose requester ID 2 invokes `Translate("Alice")` on the host service at ID 3.

The server delivers this package to the host. The outer `2` is the sender:

```text
2;ViewModelChannel;[{"rpcMethod":"Request:IObjectOps_InvokeMethod","rpcRequestId":101,"sourceClientId":2,"targetClientId":3,"ref":{"clientId":3,"objectId":0,"typeId":0},"methodId":1,"arguments":["Alice"]}]
```

The host implementation returns `Hello, Alice!` and submits this package to
receiver 2:

```text
2;ViewModelChannel;[{"rpcMethod":"Response:IObjectOps_InvokeMethod","rpcRequestId":101,"sourceClientId":3,"targetClientId":2,"response":"Hello, Alice!"}]
```

The response preserves `rpcRequestId`. The Workflow RPC endpoint, not the HTTP
transport, owns this correlation.

## RVM Host over Stdio (/Cli)

`/Cli:<host-executable>` replaces only the RVM host transport. The Core still
uses `/Http` or `/MiniHttp` for a separate renderer connection. Conceptually:

```text
renderer ── HTTP or MiniHTTP ──> renderer channel server in Core
Core ── stdin/stdout ──> child rvmhost /Cli
```

The child opens no RVM HTTP connection or admission probe; stdio is its entire
host transport.

The Core launches the specified executable with one child argument, exactly
`/Cli`. The child's stdout must contain protocol frames only; write diagnostics
to stderr.

### Line framing

For every ordinary package in either direction:

1. Serialize the complete `NetworkPackage` text.
2. Encode it as strict UTF-8.
3. Encode all UTF-8 bytes with canonical standard Base64, including required
   `=` padding.
4. Write the Base64 ASCII followed by LF.

A receiver may accept LF or CRLF. It must buffer fragments across arbitrary
stream reads until a line terminator arrives; one read is not necessarily one
frame. It then strips the terminator, validates and decodes Base64, decodes
strict UTF-8, and parses the `NetworkPackage`. The complete semicolon envelope
is encoded once. Do not encode only the JSON body, and do not add JSON string
quoting around the Base64.

Do not rely on an unterminated final frame at EOF. The TypeScript child processes
one nonempty final fragment before reporting EOF, while the Core's child-output
reader discards a partial final line.

After decoding, channel admission and the RVM application handshake are
identical to HTTP.

### Complete initial transcript

The following transcript uses the common isolated stdio IDs `B = 1` and
`H = 3` only to make the bytes concrete. A port must parse the actual values.

1. Host stdout advertises both channels.

   Decoded UTF-8 `NetworkPackage`:

   ```text
   ;;ViewModelChannel!ViewModelReadyChannel
   ```

   Base64 stdout line, followed by LF:

   ```text
   OztWaWV3TW9kZWxDaGFubmVsIVZpZXdNb2RlbFJlYWR5Q2hhbm5lbA==
   ```

2. Core stdin assigns host ID 3.

   Decoded UTF-8 `NetworkPackage`:

   ```text
   3;;
   ```

   Base64 stdin line, followed by LF:

   ```text
   Mzs7
   ```

3. Host stdout broadcasts Ready.

   Decoded UTF-8 `NetworkPackage`:

   ```text
   ;ViewModelReadyChannel;["Ready"]
   ```

   Base64 stdout line, followed by LF:

   ```text
   O1ZpZXdNb2RlbFJlYWR5Q2hhbm5lbDtbIlJlYWR5Il0=
   ```

4. Core stdin sends Workflow RPC Login from broker ID 1.

   Decoded UTF-8 `NetworkPackage`:

   ```text
   1;ViewModelChannel;[{"rpcChannelingSystem":"Login","serverClientId":1}]
   ```

   Base64 stdin line, followed by LF:

   ```text
   MTtWaWV3TW9kZWxDaGFubmVsO1t7InJwY0NoYW5uZWxpbmdTeXN0ZW0iOiJMb2dpbiIsInNlcnZlckNsaWVudElkIjoxfV0=
   ```

5. Host stdout declares `IViewModel` to broker ID 1.

   Decoded UTF-8 `NetworkPackage`:

   ```text
   1;ViewModelChannel;[{"rpcMethod":"Request:IRpcDispatcher_DeclareRemoteService","rpcRequestId":1,"sourceClientId":3,"ref":{"clientId":3,"objectId":0,"typeId":0}}]
   ```

   Base64 stdout line, followed by LF:

   ```text
   MTtWaWV3TW9kZWxDaGFubmVsO1t7InJwY01ldGhvZCI6IlJlcXVlc3Q6SVJwY0Rpc3BhdGNoZXJfRGVjbGFyZVJlbW90ZVNlcnZpY2UiLCJycGNSZXF1ZXN0SWQiOjEsInNvdXJjZUNsaWVudElkIjozLCJyZWYiOnsiY2xpZW50SWQiOjMsIm9iamVjdElkIjowLCJ0eXBlSWQiOjB9fV0=
   ```

Object-hold and later method-call packages continue with the same Base64 line
framing.

### Shutdown and invalid input

The exact raw ASCII line below is a stdio control frame, not Base64:

```text
!Exit
```

The Core writes `!Exit` plus LF to request child shutdown. EOF also means the
transport disconnected. No renderer package or renderer client ID travels
through this stdio connection.

For compatibility with the checked-in TypeScript and C++ implementations:

- Ignore other raw lines beginning with `!`.
- Ignore non-ASCII, invalid or noncanonical Base64, and invalid UTF-8 lines.
- Treat a successfully decoded malformed `NetworkPackage` or `!Error` package
  as fatal.
- Keep stdout free of logs, banners, and progress messages.

## Porting Checklist

A compatible implementation should verify all of the following:

- Split a `NetworkPackage` at only its first two semicolons.
- Preserve the directional meaning of the outer ID field.
- Advertise exactly the channel set required by the selected role.
- Parse every assigned ID and Workflow RPC broker ID; hard-code only the Core
  renderer receiver ID 1 where the renderer protocol requires it.
- Treat ordinary channel bodies as JSON arrays.
- Serialize HTTP send POSTs and process piggyback bodies from both HTTP paths.
- Replace every HTTP long poll immediately.
- Send plain UTF-8 over HTTP; Base64-encode the whole package only for stdio.
- Install readers and handlers before sending `ControllerConnect` or `Ready`.
- Correlate Remote Protocol `Request`/`Response` by `id` and Workflow RPC by
  `rpcRequestId`.
- Wait for the external `IViewModel` hold before declaring the RVM host ready.
- Stop on transport failure, fatal channel errors, malformed decoded packages,
  or loss of the accepted RVM host.

## Source Map

The primary TypeScript implementations are:

- [channel.ts](../Gaclib/website/remote-protocol-http/src/channel.ts) -
  `NetworkPackage` parsing, validation, and routing API.
- [httpChannel.ts](../Gaclib/website/remote-protocol-http/src/httpChannel.ts) -
  HTTP endpoint acquisition, admission, polling, and send serialization.
- [rendererClient.ts](../Gaclib/website/remote-protocol-http/src/rendererClient.ts) -
  renderer channel name and `ControllerConnect`.
- [rvmhost index.ts](../Gaclib/website/rvmhost/src/index.ts) - RVM Ready,
  service registration, and hold lifecycle.
- [rvmhost stdio.ts](../Gaclib/website/rvmhost/src/stdio.ts) - Base64 line
  framing and `!Exit`.
- [Workflow RPC endpoint.ts](../Gaclib/gaclib/workflow-rpc/src/endpoint.ts) -
  Login, declarations, holds, calls, and correlation.
- [generated.ts](../Gaclib/website/rvm/src/generated/generated.ts) -
  `IViewModel` type and method IDs.
- [entry index.ts](../Gaclib/website/entry/src/index.ts) - browser composition
  of RVM host and renderer roles.

The corresponding C++ servers and generic channel protocol are under:

- [RemotingTest_Core](../../GacUI/Test/GacUISrc/RemotingTest_Core/GuiMain.cpp)
- [Remoting helpers](../../GacUI/Test/RemotingHelpers)
- [VlppOS inter-process protocol](../../VlppOS/Source/InterProcess)
