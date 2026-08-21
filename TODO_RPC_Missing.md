# Workflow RPC Missing Work

This file contains only requirements from [`TODO_RPC.md`](TODO_RPC.md) that are
still open after the GacJS implementation and Windows verification. The
cross-platform C++ Workflow RPC results are not repeated here; the remaining
platform item is specifically about the GacJS Node/browser/SEA integration.

## GacJS gates

- [ ] Complete and archive the remaining native GacJS platform matrix from
  `TODO_RPC.md:1060-1087,1118-1137,1150-1151,1240-1242`. Windows now covers
  `/Http` and `/MiniHttp`, browser-host, independently started Node network-host,
  Core-launched SEA stdio-host, direct C++ requester, graceful child reap, and
  the host-loss failure path. Still required are native Linux and macOS SEA
  build/execution plus their documented `/MiniHttp` browser-host, network-host,
  and Core-launched stdio-host runs with Firefox/WebKit, and the IIS-hosted
  static-output `?rvmhost` check. The permitted manual commands/results may be
  used where the native live application is not automated.

## GacUI items outside the requested GacJS-only change scope

- [ ] Enforce the same `/RVMT` renderer-admission invariant regardless of whether
  the RVM host connects over the network or is Core-launched through `/Cli`
  stdio: until the requester has acquired the required `IViewModel` service and
  entered its `Running` phase, reject renderer admission immediately rather
  than waiting or queuing the early renderer. After `Running`, admit the first
  renderer and preserve normal renderer replacement. The combined non-CLI
  `RemoteViewModelChannelServer` already applies this `CanAdmitRenderer()` gate.
  In `GacUI/Test/GacUISrc/RemotingTest_Core/GuiMain.cpp:246-265`, however, the
  split `/Cli` path gives the renderer a plain `RemotingChannelServer` with
  immediate admission, bypassing the RVM requester state. Add the equivalent
  `Running` gate to that split renderer path, as required by
  `TODO_RPC.md:720-723`, and regression coverage proving that early admission is
  rejected, then the first post-acquisition renderer and a replacement renderer
  are accepted.

- [ ] Synchronize the owning GacUI launch documentation required by
  `TODO_RPC.md:763-766,1159-1171`: correct the `/RVMT` table in
  `DebugRemoteProtocolWithGacJS.md`, which still says
  `RemotingTest_RvmHost` is required despite the browser/Node host modes, and
  document that the inherited POSIX `/bin/sh -c` launcher handles ordinary
  spaces but not every shell-special filename robustly.
