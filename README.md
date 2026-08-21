# GacJS

**Read the [LICENSE](https://github.com/vczh-libraries/GacJS/blob/master/LICENSE.md) first.**

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/vczh-libraries/GacJS)

Running GacUI in Browsers!

## Documentation

| Area | Document |
|---|---|
| Architecture | [Project Structure](doc/Projects.md) |
| Network transport and handshakes | [GacJS Network Protocol](doc/NetworkProtocol.md) |
| Remote Protocol | [GacUI Remote Protocol Reference](doc/Protocol.md) |
| Rendering | [GacUI HTML DOM Rendering](doc/DOM.md) |
| Rich text | [DocumentParagraph Implementation](doc/DocumentParagraph.md) |
| E2E testing | [Testing the Remote Protocol with Playwright](doc/Testing_Protocol.md) |
| Snapshot testing | [Testing with Snapshots](doc/Testing_Snapshot.md) |
| Workflow RPC | [Workflow Interface-Based RPC](doc/rpc/Features.md) |
| Workflow RPC lifetime | [Memory Management for Workflow RPC in TypeScript](doc/rpc/MemoryManagement.md) |
| Workflow RPC bindings | [Generating TypeScript Bindings for Workflow RPC](doc/rpc/CodeGeneration.md) |

## Building this Project

The root of test projects is in the `Gaclib` folder,
`yarn build` and you will get all files created to `Gaclib\website\entry\lib\dist`.

## Run in Browser

Run [RemotingTest_Core.vcxproj](https://github.com/vczh-libraries/GacUI/tree/master/Test/GacUISrc/RemotingTest_Core)
with `/Http` on Windows or `/MiniHttp` on Windows, Linux, or macOS.

Start the website on port `8896`:

```powershell
Set-Location Gaclib\website\entry
npm run start
```

Open `http://localhost:8896` and press ENTER in the server terminal when you want to stop it. This is an interactive GacUI renderer.

![RPT_Windows](RPT_Windows.png)
![RPT_Ubuntu](RPT_Ubuntu.png)
![RPT_macOS](RPT_macOS.png)

### Interacting with GacUI Core

![GacUIHtml2](GacUIHtml1.gif)

### Switching between Renderers

You can start a local `RemotingTest_Win32_Renderer` with `/Http`, do something to the UI, and start the website, you can see the website take over the running UI on the fly.

![GacUIHtml2](GacUIHtml2.gif)

## localhost/snapshots.html

A demo for rendering [GacUI Unit Test with Snapshots](https://github.com/vczh-libraries/GacUI/tree/master/Test/GacUISrc/UnitTestViewer)

![SnapshotViewer](SnapshotViewer.png)
