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

- [ ] Gate renderer admission in the split Core `/Cli` path on RVM requester
  readiness, as required by `TODO_RPC.md:720-723`. In
  `GacUI/Test/GacUISrc/RemotingTest_Core/GuiMain.cpp:246-265`, the split renderer
  uses a plain `RemotingChannelServer` with immediate admission, while only the
  combined non-CLI `RemoteViewModelChannelServer` consults `CanAdmitRenderer()`.
  Add the same `Running` gate and a regression that attempts renderer assignment
  before service acquisition.

- [ ] Synchronize the owning GacUI launch documentation required by
  `TODO_RPC.md:763-766,1159-1171`: correct the `/RVMT` table in
  `DebugRemoteProtocolWithGacJS.md`, which still says
  `RemotingTest_RvmHost` is required despite the browser/Node host modes, and
  document that the inherited POSIX `/bin/sh -c` launcher handles ordinary
  spaces but not every shell-special filename robustly.
