# GacJS

**Read the [LICENSE](https://github.com/vczh-libraries/GacJS/blob/master/LICENSE.md) first.**

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/vczh-libraries/GacJS)

Running GacUI in Browsers!

## Building this Project

The root of test projects is in the `Gaclib` folder,
`yarn build` and you will get all files created to `Gaclib\website\entry\lib\dist`.

## Run in Browser

Run [RemotingTest_Core.vcxproj](https://github.com/vczh-libraries/GacUI/tree/master/Test/GacUISrc/RemotingTest_Core)
with `/Http` on Windows or `/MiniHttp` on Windows, Linux, or macOS.

Start the website on port `8896`:

```bash
cd Gaclib\website\entry
npm run start
```

Open `http://localhost:8896` and press ENTER in the server terminal when you want to stop it. This is an interactive GacUI renderer.

![RPT_Windows](RPT_Windows.png)
![RPT_macOS](RPT_macOS.png)

### Interacting with GacUI Core

![GacUIHtml2](GacUIHtml1.gif)

### Switching between Renderers

You can start a local `RemotingTest_Win32_Renderer` with `/Http` or `/Pipe`, do something to the UI, and start the website, you can see the website take over the running UI on the fly.

![GacUIHtml2](GacUIHtml2.gif)

## localhost/snapshots.html

A demo for rendering [GacUI Unit Test with Snapshots](https://github.com/vczh-libraries/GacUI/tree/master/Test/GacUISrc/UnitTestViewer)

![SnapshotViewer](SnapshotViewer.png)
