# GacUI Remote Protocol Reference

GacUI uses an X-window-like remote protocol to render UI in a separate process.
The **core** (server) runs the GacUI application logic.
The **client** (renderer) draws the UI — in this repo, inside a web browser.

Communication direction:

| Kind | Direction | Blocking? |
|------|-----------|-----------|
| **Message** (no response type) | Core → Client | No — fire-and-forget |
| **Request** (has response type) | Core → Client | Yes — core blocks until client responds |
| **Event** | Client → Core | No — fire-and-forget |

> The protocol itself is transport-agnostic.
> The HTTP implementation in this repo exists **only for demo/testing** purposes.

## Source Locations

**Protocol definitions** (the source of truth):
- `GacUI/Source/PlatformProviders/Remote/Protocol/*.txt` — human-readable protocol schema
- `GacUI/Source/PlatformProviders/Remote/Protocol/Generated/` — C++ generated code from the schema

**Core (server) implementation:**
- `GacUI/Source/PlatformProviders/Remote/` — the core-side remote protocol provider that drives the protocol from the GacUI application

**Client (renderer) implementations:**

| Implementation | Location | Purpose |
|----------------|----------|---------|
| Unit test client | `GacUI/Source/UnitTestUtilities/` | Captures rendering traces for automated testing; does not perform real rendering |
| Native renderer | `GacUI/Source/PlatformProviders/RemoteRenderer/` | A real native-platform rendering client (C++) |
| Web renderer | `Gaclib/gaclib/renderer/src/` | This repo's HTML/CSS renderer for web browsers (incomplete) |

**TypeScript generated code:**
- `Gaclib/gaclib/remote-protocol/` — generated from `Import/Metadata/RemoteProtocol.json` by `@gaclib-shared/codegen`

---

## Table of Contents

- [Primitive Types](#primitive-types)
- [Controller Protocol](#controller-protocol)
- [Main Window Protocol](#main-window-protocol)
- [IO Protocol](#io-protocol)
- [Renderer Protocol](#renderer-protocol)
- [Basic Element Descriptions](#basic-element-descriptions)
- [Image Protocol](#image-protocol)
- [Document Paragraph Protocol](#document-paragraph-protocol)
- [DOM Synchronization Protocol](#dom-synchronization-protocol)
- [Unit Test Protocol](#unit-test-protocol)
- [Annotations](#annotations)

---

## Primitive Types

These structs are used throughout other protocol messages.

### Coordinate types (native, with DPI scaling)

| Struct | Fields | Description |
|--------|--------|-------------|
| `NativeCoordinate` | `value: int` | A single coordinate in native (physical-pixel) space |
| `NativePoint` | `x, y: NativeCoordinate` | Point in native space |
| `NativeSize` | `x, y: NativeCoordinate` | Size in native space |
| `NativeRect` | `x1, y1, x2, y2: NativeCoordinate` | Rectangle in native space (top-left to bottom-right) |
| `NativeMargin` | `left, top, right, bottom: NativeCoordinate` | Margin in native space |

### Coordinate types (logical, DPI-independent)

| Struct | Fields | Description |
|--------|--------|-------------|
| `Point` | `x, y: int` | Logical pixel point |
| `Size` | `x, y: int` | Logical pixel size |
| `Rect` | `x1, y1, x2, y2: int` | Logical pixel rectangle |

### Font

| Struct | Fields |
|--------|--------|
| `FontProperties` | `fontFamily: string`, `size: int`, `bold`, `italic`, `underline`, `strikeline`, `antialias`, `verticalAntialias: bool` |
| `FontConfig` | `defaultFont: FontProperties`, `supportedFonts: string[]` |

---

## Controller Protocol

Manages the overall connection lifecycle, font/screen configuration.

### Messages (Core → Client)

| Message | Request | Response | Description |
|---------|---------|----------|-------------|
| `ControllerGetFontConfig` | — | `FontConfig` | Request the client's font configuration (default font, supported font list) |
| `ControllerGetScreenConfig` | — | `ScreenConfig` | Request current screen bounds, client area, and DPI scaling factors |
| `ControllerConnectionEstablished` | — | — | Notify the client that the connection has been established |
| `ControllerConnectionStopped` | — | — | Notify the client that the connection is being terminated |

### Events (Client → Core)

| Event | Payload | Description |
|-------|---------|-------------|
| `ControllerConnect` | `ControllerGlobalConfig` | Client informs the core it is ready, providing global configuration including `documentCaretFromEncoding` (`UTF8`/`UTF16`/`UTF32`) |
| `ControllerDisconnect` | — | Client requests disconnection |
| `ControllerRequestExit` | — | Client politely asks the core to exit (e.g., user clicked close) |
| `ControllerForceExit` | — | Client demands immediate shutdown |
| `ControllerScreenUpdated` | `ScreenConfig` | Client reports that screen configuration has changed. Annotated `@DropRepeat` — the server may ignore intermediate events and only process the last one |

### Supporting types

| Type | Fields | Description |
|------|--------|-------------|
| `ScreenConfig` | `bounds`, `clientBounds: NativeRect`, `scalingX`, `scalingY: double` | Screen geometry and DPI scaling |
| `ControllerGlobalConfig` | `documentCaretFromEncoding: CharacterEncoding` | Global settings sent on connect |
| `CharacterEncoding` | `UTF8`, `UTF16`, `UTF32` | Encoding used for document caret positions |

---

## Main Window Protocol

Controls the single main window's properties and state.

### Messages (Core → Client)

| Message | Request | Response | Description |
|---------|---------|----------|-------------|
| `WindowGetBounds` | — | `WindowSizingConfig` | Request current window geometry |
| `WindowNotifySetTitle` | `string` | — | Set window title |
| `WindowNotifySetEnabled` | `bool` | — | Enable/disable the window |
| `WindowNotifySetTopMost` | `bool` | — | Set always-on-top |
| `WindowNotifySetShowInTaskBar` | `bool` | — | Show/hide in taskbar |
| `WindowNotifySetCustomFrameMode` | `bool` | — | Enable/disable custom (non-native) frame |
| `WindowNotifySetMaximizedBox` | `bool` | — | Show/hide maximize button |
| `WindowNotifySetMinimizedBox` | `bool` | — | Show/hide minimize button |
| `WindowNotifySetBorder` | `bool` | — | Show/hide window border |
| `WindowNotifySetSizeBox` | `bool` | — | Allow/disallow resizing |
| `WindowNotifySetIconVisible` | `bool` | — | Show/hide window icon |
| `WindowNotifySetTitleBar` | `bool` | — | Show/hide title bar |
| `WindowNotifySetBounds` | `NativeRect` | — | Set window bounds |
| `WindowNotifySetClientSize` | `NativeSize` | — | Set client area size |
| `WindowNotifyActivate` | — | — | Activate (bring to front) the window |
| `WindowNotifyShow` | `WindowShowing` | — | Show the window with given activation and size state |
| `WindowNotifyMinSize` | `NativeSize` | — | Set minimum window size |
| `WindowNotifySetCaret` | `NativePoint` | — | Set IME caret position |

All `WindowNotify*` messages are annotated `@DropRepeat` — the client may ignore intermediate messages and only process the last one.

### Events (Client → Core)

Both events are annotated `@DropRepeat` — the server may ignore intermediate events and only process the last one. The client should not assume every `@DropRepeat` event will be handled.

| Event | Payload | Description |
|-------|---------|-------------|
| `WindowBoundsUpdated` | `WindowSizingConfig` | Client reports window geometry change (resize, move, state change). Annotated `@DropRepeat` |
| `WindowActivatedUpdated` | `bool` | Client reports activation state change. Annotated `@DropRepeat` |

### Supporting types

| Type | Fields | Description |
|------|--------|-------------|
| `WindowSizingConfig` | `bounds`, `clientBounds: NativeRect`, `sizeState: WindowSizeState`, `customFramePadding: NativeMargin` | Complete window geometry snapshot |
| `WindowShowing` | `activate: bool`, `sizeState: WindowSizeState` | Parameters for showing a window |
| `WindowSizeState` | `Minimized`, `Restored`, `Maximized` | Window size states |
| `WindowHitTestResult` | `BorderNoSizing`, `BorderLeft`, `BorderRight`, `BorderTop`, `BorderBottom`, `BorderLeftTop`, `BorderRightTop`, `BorderLeftBottom`, `BorderRightBottom`, `Title`, `ButtonMinimum`, `ButtonMaximum`, `ButtonClose`, `Client`, `Icon`, `NoDecision` | Hit-test areas for custom frame windows |
| `WindowSystemCursorType` | `SmallWaiting`, `LargeWaiting`, `Arrow`, `Cross`, `Hand`, `Help`, `IBeam`, `SizeAll`, `SizeNESW`, `SizeNS`, `SizeNWSE`, `SizeWE` | System cursor types |

---

## IO Protocol

Handles keyboard and mouse input events and global shortcut keys.

### Messages (Core → Client)

| Message | Request | Response | Description |
|---------|---------|----------|-------------|
| `IOUpdateGlobalShortcutKey` | `GlobalShortcutKey[]` | — | Register a set of global shortcut keys to monitor |
| `IORequireCapture` | — | — | Request mouse capture (all mouse events go to the window) |
| `IOReleaseCapture` | — | — | Release mouse capture |
| `IOIsKeyPressing` | `key` | `bool` | Query whether a specific key is currently held down |
| `IOIsKeyToggled` | `key` | `bool` | Query whether a toggle key (e.g., CapsLock) is active |

### Events (Client → Core)

| Event | Payload | Description |
|-------|---------|-------------|
| `IOButtonDown` | `IOMouseInfoWithButton` | Mouse button pressed |
| `IOButtonDoubleClick` | `IOMouseInfoWithButton` | Mouse button double-clicked |
| `IOButtonUp` | `IOMouseInfoWithButton` | Mouse button released |
| `IOHWheel` | `IOMouseInfo` | Horizontal mouse wheel scrolled |
| `IOVWheel` | `IOMouseInfo` | Vertical mouse wheel scrolled |
| `IOMouseMoving` | `IOMouseInfo` | Mouse moved. Annotated `@DropConsecutive` — consecutive events may be coalesced |
| `IOMouseEntered` | — | Mouse entered the window |
| `IOMouseLeaved` | — | Mouse left the window |
| `IOKeyDown` | `IOKeyInfo` | Key pressed |
| `IOKeyUp` | `IOKeyInfo` | Key released |
| `IOChar` | `IOCharInfo` | Character input (after IME / dead-key processing) |
| `IOGlobalShortcutKey` | `int` | A registered global shortcut key was triggered (by ID) |

### Supporting types

| Type | Fields | Description |
|------|--------|-------------|
| `IOMouseButton` | `Left`, `Middle`, `Right` | Mouse button enum |
| `IOMouseInfo` | `ctrl`, `shift`, `left`, `middle`, `right: bool`, `x`, `y: NativeCoordinate`, `wheel: int`, `nonClient: bool` | Mouse state at time of event |
| `IOMouseInfoWithButton` | `button: IOMouseButton`, `info: IOMouseInfo` | Mouse event with which button was involved |
| `IOKeyInfo` | `code: key`, `ctrl`, `shift`, `alt`, `capslock`, `autoRepeatKeyDown: bool` | Keyboard key event |
| `IOCharInfo` | `code: char`, `ctrl`, `shift`, `alt`, `capslock: bool` | Character input event |
| `GlobalShortcutKey` | `id: int`, `ctrl`, `shift`, `alt: bool`, `code: key` | Global shortcut key definition |

---

## Renderer Protocol

Manages the lifecycle and rendering of graphical elements.

### Element types

```
FocusRectangle, Raw, SolidBorder, SinkBorder, SinkSplitter,
SolidBackground, GradientBackground, InnerShadow, SolidLabel,
Polygon, ImageFrame, DocumentParagraph
```

### Messages (Core → Client)

| Message | Request | Response | Description |
|---------|---------|----------|-------------|
| `RendererCreated` | `RendererCreation[]` | — | Create elements with given IDs and types |
| `RendererDestroyed` | `int[]` | — | Destroy elements by ID |
| `RendererBeginRendering` | `ElementBeginRendering` | — | Begin a rendering frame; delivers updated element descriptions |
| `RendererEndRendering` | — | `ElementMeasurings` | End a rendering frame; client returns measurement results |
| `RendererBeginBoundary` | `ElementBoundary` | — | Begin a hit-test boundary region |
| `RendererRenderElement` | `ElementRendering` | — | Render an element at given bounds and clipping area |
| `RendererEndBoundary` | — | — | End a hit-test boundary region |

### Supporting types

| Type | Fields | Description |
|------|--------|-------------|
| `RendererCreation` | `id: int`, `type: RendererType` | Element ID and type to create |
| `ElementBeginRendering` | `frameId: int`, `updatedElements: OrdinaryElementDescVariant[]` | Frame ID and element description updates for this frame |
| `ElementRendering` | `id: int`, `bounds: Rect`, `areaClippedByParent: Rect` | Element position and visible area |
| `ElementBoundary` | `id: int`, `hitTestResult?: WindowHitTestResult`, `cursor?: WindowSystemCursorType`, `bounds: Rect`, `areaClippedBySelf: Rect` | Boundary region for hit-testing and cursor |
| `ElementMeasurings` | `fontHeights`, `minSizes`, `createdImages`, `inlineObjectBounds` | Accumulated measurements from a frame |
| `ElementMeasuring_FontHeight` | `fontFamily: string`, `fontSize: int`, `height: int` | Measured pixel height of a font |
| `ElementMeasuring_ElementMinSize` | `id: int`, `minSize: Size` | Minimum size measured for an element |
| `ElementMeasuring_InlineObjectBounds` | `elementId: int`, `callbackId: int`, `bounds: Rect` | Bounds of inline objects in a document |
| `OrdinaryElementDescVariant` | union of all `ElementDesc_*` except `DocumentParagraph` | Discriminated union of element descriptions |

---

## Basic Element Descriptions

Descriptions sent as part of `ElementBeginRendering.updatedElements`.

### ElementDesc_SolidBorder

Draws a solid-color border.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `borderColor` | `color` | Border color |
| `shape` | `ElementShape` | Rectangle, Ellipse, or RoundRect with radii |

### ElementDesc_SinkBorder

Draws a 3D beveled (sunken/raised) border using two colors.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `leftTopColor` | `color` | Color of top and left edges |
| `rightBottomColor` | `color` | Color of bottom and right edges |

### ElementDesc_SinkSplitter

A thin visual divider line.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `leftTopColor` | `color` | Color of first edge |
| `rightBottomColor` | `color` | Color of second edge |
| `direction` | `ElementSplitterDirection` | `Horizontal` or `Vertical` |

### ElementDesc_SolidBackground

Fills the element area with a solid color.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `backgroundColor` | `color` | Fill color |
| `shape` | `ElementShape` | Rectangle, Ellipse, or RoundRect with radii |

### ElementDesc_GradientBackground

Fills the element area with a linear gradient.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `leftTopColor` | `color` | Start color |
| `rightBottomColor` | `color` | End color |
| `direction` | `ElementGradientrDirection` | `Horizontal`, `Vertical`, `Slash`, or `Backslash` |
| `shape` | `ElementShape` | Shape with optional radii |

### ElementDesc_InnerShadow

Draws an inward shadow from all four edges.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `shadowColor` | `color` | Shadow color |
| `thickness` | `int` | Shadow depth in pixels |

### ElementDesc_Polygon

An SVG polygon shape.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `size` | `Size` | Viewport size |
| `borderColor` | `color` | Stroke color |
| `backgroundColor` | `color` | Fill color |
| `points` | `Point[]` | Polygon vertices |

### ElementDesc_SolidLabel

Renders text with font, color, alignment, wrapping, and ellipsis.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `textColor` | `color` | Text color |
| `horizontalAlignment` | `ElementHorizontalAlignment` | `Left`, `Right`, or `Center` |
| `verticalAlignment` | `ElementVerticalAlignment` | `Top`, `Bottom`, or `Center` |
| `wrapLine` | `bool` | Whether text wraps to multiple lines |
| `wrapLineHeightCalculation` | `bool` | Whether height participates in line-wrap calculations |
| `ellipse` | `bool` | Whether to show ellipsis when text overflows |
| `multiline` | `bool` | Whether text contains multiple lines (`\r\n`) |
| `font` | `FontProperties?` | Font (optional — only sent on change) |
| `text` | `string?` | Text content (optional — only sent on change) |
| `measuringRequest` | `ElementSolidLabelMeasuringRequest?` | `FontHeight` or `TotalSize` — what measurement the core needs back |

### ElementDesc_ImageFrame

Displays an image frame with alignment, stretching, and enabled state.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `imageId` | `int?` | Image resource ID |
| `imageFrame` | `int` | Frame index within the image |
| `horizontalAlignment` | `ElementHorizontalAlignment` | Image alignment |
| `verticalAlignment` | `ElementVerticalAlignment` | Image alignment |
| `stretch` | `bool` | Stretch image to fill bounds |
| `enabled` | `bool` | If false, render as grayscale (disabled look) |
| `imageCreation` | `ImageCreation?` | Inline image data (if any) |

### Supporting enums

| Enum | Values | Description |
|------|--------|-------------|
| `ElementShapeType` | `Rectangle`, `Ellipse`, `RoundRect` | Shape types |
| `ElementShape` | `shapeType`, `radiusX`, `radiusY` | Shape with optional corner radii |
| `ElementGradientrDirection` | `Horizontal`, `Vertical`, `Slash`, `Backslash` | Gradient directions |
| `ElementSplitterDirection` | `Horizontal`, `Vertical` | Splitter direction |
| `ElementHorizontalAlignment` | `Left`, `Right`, `Center` | Horizontal alignment |
| `ElementVerticalAlignment` | `Top`, `Bottom`, `Center` | Vertical alignment |
| `ElementSolidLabelMeasuringRequest` | `FontHeight`, `TotalSize` | What to measure for a SolidLabel |

---

## Image Protocol

Manages image resources.

### Messages (Core → Client)

| Message | Request | Response | Description |
|---------|---------|----------|-------------|
| `ImageCreated` | `ImageCreation` | `ImageMetadata` | Send image binary data; client decodes and returns metadata (format, per-frame sizes) |
| `ImageDestroyed` | `int` | — | Release an image resource by ID |

### Supporting types

| Type | Fields | Description |
|------|--------|-------------|
| `ImageCreation` | `id: int`, `imageData: binary`, `imageDataOmitted: bool` | Image creation payload. Data may be omitted for unit-test scenarios |
| `ImageMetadata` | `id: int`, `format: ImageFormatType`, `frames: ImageFrameMetadata[]` | Decoded image metadata returned to core |
| `ImageFrameMetadata` | `size: Size` | The natural size of one image frame |
| `ImageFormatType` | `Bmp`, `Gif`, `Icon`, `Jpeg`, `Png`, `Tiff`, `Wmp`, `Unknown` | Detected image format |

---

## Document Paragraph Protocol

Rich text paragraph rendering with caret and inline objects.

### Messages (Core → Client)

| Message | Request | Response | Description |
|---------|---------|----------|-------------|
| `RendererUpdateElement_DocumentParagraph` | `ElementDesc_DocumentParagraph` | `UpdateElement_DocumentParagraphResponse` | Update a document paragraph's content; client returns measured size |
| `DocumentParagraph_GetCaret` | `GetCaretRequest` | `GetCaretResponse` | Navigate from a caret position (e.g., move left, down) |
| `DocumentParagraph_GetCaretBounds` | `GetCaretBoundsRequest` | `GetCaretBoundsResponse` | Get pixel bounds for all carets in a paragraph |
| `DocumentParagraph_GetInlineObjectFromPoint` | `GetInlineObjectFromPointRequest` | `DocumentRun?` | Hit-test a point to find an inline object |
| `DocumentParagraph_GetNearestCaretFromTextPos` | `GetNearestCaretFromTextPosRequest` | `int` | Convert a text position to the nearest valid caret position |
| `DocumentParagraph_IsValidCaret` | `IsValidCaretRequest` | `bool` | Check if a caret position is valid |
| `DocumentParagraph_OpenCaret` | `OpenCaretRequest` | — | Show a blinking caret at the given position |
| `DocumentParagraph_CloseCaret` | `int` | — | Hide the caret for a paragraph by element ID |

### ElementDesc_DocumentParagraph

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Element ID |
| `text` | `string?` | Full paragraph text (optional — only sent on change) |
| `wrapLine` | `bool` | Word-wrap enabled |
| `maxWidth` | `int` | Maximum width for line-wrapping |
| `alignment` | `ElementHorizontalAlignment` | Text alignment |
| `runsDiff` | `DocumentRun[]` | Incremental run changes |
| `createdInlineObjects` | `int[]` | Newly created inline object element IDs |
| `removedInlineObjects` | `int[]` | Removed inline object element IDs |

### Document runs

A `DocumentRun` covers a range of caret positions (`caretBegin` to `caretEnd`) and has a `DocumentRunProperty` (union):

- **DocumentTextRunProperty**: `textColor`, `backgroundColor: color`, `fontProperties: FontProperties`
- **DocumentInlineObjectRunProperty**: `size: Size`, `baseline: int`, `breakCondition: BreakCondition`, `backgroundColor: color`, `backgroundElementId: int`, `callbackId: int`

### Caret navigation types

| Type | Fields | Description |
|------|--------|-------------|
| `GetCaretRequest` | `id`, `caret: int`, `relativePosition: CaretRelativePosition` | Navigate from a caret position |
| `GetCaretResponse` | `newCaret: int`, `preferFrontSide: bool` | Result of caret navigation |
| `GetCaretBoundsRequest` | `id: int` | Request caret bounds for a paragraph |
| `GetCaretBoundsResponse` | `frontSideBounds`, `backSideBounds: Rect[]` | Pixel bounds for every caret position |
| `OpenCaretRequest` | `id`, `caret: int`, `caretColor: color`, `frontSide: bool` | Show a caret at this position |

### Enums

| Enum | Values | Description |
|------|--------|-------------|
| `BreakCondition` | `StickToPreviousRun`, `StickToNextRun`, `Alone` | Line-break behavior of inline objects |
| `CaretRelativePosition` | `CaretFirst`, `CaretLast`, `CaretLineFirst`, `CaretLineLast`, `CaretMoveLeft`, `CaretMoveRight`, `CaretMoveUp`, `CaretMoveDown` | Relative caret navigation commands |

---

## DOM Synchronization Protocol

Synchronizes the visual tree between core and client.

### Messages (Core → Client)

| Message | Request | Response | Description |
|---------|---------|----------|-------------|
| `RendererRenderDom` | `RenderingDom` | — | Send the full DOM tree to be rendered — used on initial render |
| `RendererRenderDomDiff` | `RenderingDom_DiffsInOrder` | — | Send incremental DOM diffs for efficient updates |

### RenderingDom (full tree)

```
class RenderingDom {
    id: int               // Unique node ID
    content: RenderingDomContent
    children: RenderingDom[]
}

struct RenderingDomContent {
    hitTestResult?: WindowHitTestResult
    cursor?: WindowSystemCursorType
    element?: int          // The element ID to render here (refers to RendererCreated IDs)
    bounds: Rect           // Global coordinates
    validArea: Rect        // Visible portion (for clipping)
}
```

The root node always has `id = -1` with `bounds = {0, 0, 0, 0}`.

### RenderingDom_DiffsInOrder

| Type | Fields | Description |
|------|--------|-------------|
| `RenderingDom_DiffsInOrder` | `diffsInOrder: RenderingDom_Diff[]` | Wrapper containing an ordered list of DOM diffs |

### DOM diffs

Each diff entry (`RenderingDom_Diff`) describes what happened to a single node:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Node ID |
| `diffType` | `RenderingDom_DiffType` | `Created`, `Modified`, or `Deleted` |
| `content` | `RenderingDomContent?` | New content (for Created/Modified) |
| `children` | `int[]` | New child order (for Created/Modified) |

Diffs are applied in order. Created nodes use new positive IDs. Modified nodes update bounds/content. Deleted nodes are removed.

---

## Unit Test Protocol

Structures for capturing rendering traces in unit tests.

| Type | Fields | Description |
|------|--------|-------------|
| `ElementDesc_DocumentParagraphFull` | `paragraph: ElementDesc_DocumentParagraph`, `caret?: OpenCaretRequest` | Full paragraph state including caret for snapshots |
| `UnitTest_ElementDescVariant` | union of all `ElementDesc_*` + `ElementDesc_DocumentParagraphFull` | All element descriptions for snapshots |
| `UnitTest_RenderingFrame` | `frameId: int`, `frameName?: string`, `windowSize: WindowSizingConfig`, `elements: UnitTest_ElementDescVariant[int]`, `root: RenderingDom` | One rendering frame with all element states and DOM tree |
| `UnitTest_RenderingTrace` | `createdElements: RendererType[int]`, `imageCreations: ImageCreation[.id]`, `imageMetadatas: ImageMetadata[.id]`, `frames: UnitTest_RenderingFrame[]` | Complete rendering trace across multiple frames |

---

## Annotations

Protocol definitions support annotations that control optimization behavior:

| Annotation | Meaning |
|------------|---------|
| `@DropRepeat` | **On messages (Core → Client):** the client may ignore intermediate messages and only process the last one. **On events (Client → Core):** the server may ignore intermediate events and only process the last one — even when values differ. The client should not assume every `@DropRepeat` event will be handled. For example, resizing a window twice in quick succession should produce the same layout as resizing it once to the final size |
| `@DropConsecutive` | Consecutive events may be coalesced (e.g., rapid mouse moves) |
| `@Cpp(...)` | Maps to a C++ type (irrelevant for TypeScript implementation) |
| `@CppNamespace(...)` | C++ namespace mapping (irrelevant for TypeScript implementation) |
