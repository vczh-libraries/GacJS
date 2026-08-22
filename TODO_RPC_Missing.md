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
