# GacUI HTML DOM Rendering

This document explains how the `@gaclib/renderer` package renders remote protocol
elements into HTML DOM in the browser.

See [Protocol.md](Protocol.md) for the full protocol reference.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Coordinate System](#coordinate-system)
- [Virtual DOM](#virtual-dom)
- [Clipping (ValidArea)](#clipping-validarea)
- [Element Type Rendering](#element-type-rendering)
  - [Raw](#raw)
  - [FocusRectangle](#focusrectangle)
  - [SolidBorder](#solidborder)
  - [SolidBackground](#solidbackground)
  - [GradientBackground](#gradientbackground)
  - [SinkBorder](#sinkborder)
  - [SinkSplitter](#sinksplitter)
  - [InnerShadow](#innershadow)
  - [Polygon](#polygon)
  - [SolidLabel](#solidlabel)
  - [ImageFrame](#imageframe)
  - [DocumentParagraph](#documentparagraph)
- [Extra Border Pattern](#extra-border-pattern)
- [Measurement System](#measurement-system)
- [Cursor Mapping](#cursor-mapping)
- [Keyboard Mapping](#keyboard-mapping)
- [Mouse Input](#mouse-input)
- [Rendering Flow](#rendering-flow)
- [Feature Gates](#feature-gates)
- [Responding to IME and Virtual Keyboard](#responding-to-ime-and-virtual-keyboard)

---

## Architecture Overview

The rendering system uses three layers:

```
Protocol Messages (from GacUI Core)
        │
        ▼
  ┌─────────────────────────────┐
  │  GacUIRendererImpl          │  Processes protocol messages
  │  GacUIElementManager        │  Tracks element lifecycle
  └──────────┬──────────────────┘
             │
             ▼
  ┌─────────────────────────────┐
  │  IVirtualDom                │  Abstract tree: bounds, clipping, typed descriptions
  │  (virtualDom.ts)            │  Built from RenderingDom / RenderingDom_Diff
  └──────────┬──────────────────┘
             │
             ▼
  ┌─────────────────────────────┐
  │  VirtualDomHtml*            │  Concrete HTML <div> elements
  │  (virtualDomRenderer.ts)    │  CSS styles applied per element type
  └─────────────────────────────┘
```

Key source files:

| File | Purpose |
|------|---------|
| `dom/virtualDom.ts` | `IVirtualDom` interface and base classes |
| `dom/virtualDomBuilding.ts` | Builds/updates the virtual DOM from `RenderingDom` |
| `domRenderer/virtualDomRenderer.ts` | Concrete HTML implementation of `IVirtualDom` |
| `GacUIElementManager.ts` | Element lifecycle: create → describe → bind-to-dom |
| `GacUIRendererImpl.ts` | Main renderer: message handling, IO events, window management |
| `elementStyles.ts` | CSS style application per element type |
| `elementMeasurer.ts` | Font height, text size, and image measurement |
| `keyMapping.ts` | JavaScript `KeyboardEvent` → GacUI key code mapping |
| `featureGates.ts` | Runtime feature toggles |
| `interfaces.ts` | `GacUISettings` configuration |

---

## Coordinate System

All `RenderingDom` bounds use **global (window-relative) coordinates**.

When building the virtual DOM, bounds are converted to **parent-relative (local)** coordinates:

```
localBounds.x1 = globalBounds.x1 - parent.globalBounds.x1
localBounds.y1 = globalBounds.y1 - parent.globalBounds.y1
```

The root node (ID = -1) has `globalBounds = localBounds` since it has no parent.

HTML elements use `position: absolute` with `left`, `top`, `width`, `height` set from local bounds.

---

## Virtual DOM

The HTML provider maps each `RenderingDom` ID to one persistent `IVirtualDom`
and HTML div. Providers without native clipping retain the two-node representation:

| VirtualDom type | ID | Purpose |
|----------------|----|---------|
| `VirtualDomBaseRoot` | -1 | Root container (the window/screen) |
| `VirtualDomBaseOrdinary` | ≥ 0 | Regular element node with typed description |
| `VirtualDomBaseValidArea` | -2 | Clipping wrapper inserted when `validArea` is smaller than natural intersection |

`IVirtualDom` properties:

```typescript
{
    globalBounds: Rect;           // Position in window coordinates
    bounds: Rect;                 // Position relative to parent
    hitTestResult?: WindowHitTestResult;
    cursor?: WindowSystemCursorType;
    typedDesc?: TypedElementDesc; // Element rendering description (SolidBorder, SolidLabel, etc.)
    elementId?: number;           // Reference into ElementManager
    validArea?: Rect;             // Global clipping rectangle for the HTML provider
    editableAttribute?: ElementEditableAttribute | null;
}
```

---

## Clipping (ValidArea)

The HTML provider applies `clip-path: inset(...)` to the existing div, deriving
the insets from global bounds and `validArea`. Clipping changes do not insert or
remove ancestors. Full-tree replacement also reuses retained logical IDs.

Other providers, including the virtual-DOM mock tests, retain a **two-node
structure** when `validArea` is smaller than the natural intersection:

```
  Outer (id = original, bounds = validArea)     ← overflow: hidden
    └── Inner (id = -2, bounds = original)      ← actual content + element
```

The outer virtual node represents the visible rectangle and the inner node the
element's original bounds. This compatibility representation is not used for HTML
editing hosts.

---

## Element Type Rendering

All elements share a common base style:

```css
background-color: none;
display: block;
position: absolute;
box-sizing: border-box;
overflow: hidden;
```

### Raw

An application drawing surface with a persistent `HTMLDivElement`. The protocol
descriptor supplies an application string ID, an interpretor name and data.
The renderer selects a registered page-provided factory by interpretor name;
the painter interprets the data. Manual event-based drawing remains supported.

`<Raw/>` is the standard, recommended GacUI owner-drawing element, both locally
and over the remote protocol. Its reflected `GuiRawElementBase` exposes `Id`,
`Interpretor` and `Data`; native clients select Direct2D, GDI, Cairo or CoreGraphics through their
resource manager, while GacJS supplies the div below. Native drawing callbacks
do not run in the browser: provide the corresponding page-owned painter. The
protocol carries drawing state, not native graphics handles or rendered pixels.
GacUI's TUI backend does not support `<Raw/>`.

```html
<div style="/* renderer bounds, clipping and input */">
  <div style="/* persistent raw drawing surface */"><!-- page content --></div>
  <!-- renderer children -->
</div>
```

`IGacUIRenderer.getRawElements()` returns read-only records with
`{ element: HTMLDivElement, id: string, interpretor: string, data: string }`. The public `id` is the
descriptor's `rawId`, not its numeric renderer ID or an HTML document ID. Empty
and duplicate strings are valid. Records and divs remain stable until protocol
destruction, including while hidden or detached from the rendering DOM.

`rawElementInstalled`, `rawElementUninstalled` and `rawElementUpdated` register
synchronous listeners and return `IGacUIEventSubscription` objects with an
idempotent `unsubscribe()` method. Creation inserts the
record before installed listeners run, with empty strings. A descriptor applies
all three strings before one updated notification, only when a value changes.
Uninstalled listeners can still enumerate the record; removal follows their
callbacks. Destroying and recreating the same numeric ID creates a new record.
Subscribe to updates as well as installation when selecting by string ID, then
enumerate existing records to support late attachment.

`registerRawElementInterpretorFactory(name, factory)` registers an
`IRawElementInterpretorFactory`; duplicate names throw. Lookup through
`getRawElementInterpretorFactory(name)` returns that factory or `undefined`.
Register before consuming elements receive descriptors. Registration does not
retry existing unknown names. Empty and unknown names install no interpretor
and leave manual drawing handlers active.

Each raw element owns a separate `factory.create()` result. When its name changes,
the renderer finalizes the old instance, initializes the replacement with the
fully updated raw record, then emits `rawElementUpdated`. The interpretor can
subscribe to that event for data changes. ID-only and data-only changes do not
recreate it; DOM detachment, reparenting and resizing also preserve it. On protocol
destruction, uninstalled listeners run first, then the record is removed from
enumeration and the interpretor is finalized exactly once.

The renderer retains the drawing div across full DOM rebuilds, clipping wrapper
changes, reparenting and bounds updates. Its page-owned children are separate
from renderer child reconciliation. Pages should use absolutely positioned,
non-interactive drawing content so it adds no intrinsic minimum size and input
continues to reach GacUI. Observe the div's size and device pixel ratio when
sizing a canvas: descriptors may arrive before layout, including at zero bounds.
Give the owning GacUI composition explicit bounds or a minimum size; canvas
content does not supply a minimum size to the Core layout engine.

Changing `Interpretor` or `Data` on the Core requests repaint; changing `Id` only marks state
dirty for the next otherwise-required frame. Equal assignments do nothing.
Several setters can coalesce into one applied descriptor, so use the latest
record state instead of treating update callbacks as an application event log.

Protocol destruction ends the element lifetime. Transport loss and `stop()`
retain the last picture and do not synthesize uninstallation. `stop()` finalizes
owned interpretors while keeping records enumerable and their names unchanged.
Interpretors release their subscriptions and observers in `finalize()`; manual
painters need page-owned cleanup on completion, errors and teardown. The clock
retains its canvas when finalized with its name and enumerable record unchanged,
and removes only its own canvas on name changes or destruction. Cleanup must be
idempotent and preserve independently attached content.

---

### FocusRectangle

Keyboard focus indicator using inverted dashed outline.

```html
<div style="outline: 1px dashed white;
            outline-offset: -1px;
            mix-blend-mode: difference;"></div>
```

`mix-blend-mode: difference` ensures the dashed outline is visible regardless of
background color by inverting pixels.

---

### SolidBorder

Solid-colored border drawn as a CSS outline.

**Rectangle shape:**
```html
<div style="outline: 1px solid #336699;
            outline-offset: -1px;"></div>
```

**Ellipse / RoundRect shape:**
Uses an [extra border div](#extra-border-pattern) with:
```css
border: 1px solid #336699;
border-radius: {radiusX}px {radiusY}px;   /* RoundRect */
border-radius: 50%;                        /* Ellipse */
```

---

### SolidBackground

Solid-color fill.

**Rectangle shape:**
```html
<div style="background-color: #336699;"></div>
```

**Ellipse / RoundRect shape:**
Uses an [extra border div](#extra-border-pattern) with `border-radius`.

---

### GradientBackground

Linear gradient fill.

```html
<div style="background: linear-gradient(to right, #336699 0%, #FFFFFF 100%);"></div>
```

Direction mapping:

| Protocol value | CSS gradient direction |
|---------------|----------------------|
| `Horizontal` | `to right` |
| `Vertical` | `to bottom` |
| `Slash` | `to left bottom` |
| `Backslash` | `to right bottom` |

Ellipse / RoundRect shapes use an [extra border div](#extra-border-pattern) with `border-radius`.

---

### SinkBorder

3D beveled border using two-tone coloring.

Uses an [extra border div](#extra-border-pattern):
```css
border-style: solid;
border-width: 1px;
border-left-color: #808080;    /* leftTopColor */
border-top-color: #808080;     /* leftTopColor */
border-right-color: #FFFFFF;   /* rightBottomColor */
border-bottom-color: #FFFFFF;  /* rightBottomColor */
```

Creates the illusion of a sunken or raised surface.

---

### SinkSplitter

Thin divider line, centered within its bounds.

Uses an [extra border div](#extra-border-pattern):

**Horizontal:**
```css
width: 100%; height: 2px;
top: 0; bottom: 0; margin: auto 0;
border-top: 1px solid #808080;
border-bottom: 1px solid #FFFFFF;
```

**Vertical:**
```css
width: 2px; height: 100%;
left: 0; right: 0; margin: 0 auto;
border-left: 1px solid #808080;
border-right: 1px solid #FFFFFF;
```

---

### InnerShadow

Inward shadow from all four edges using layered gradients.

Uses an [extra border div](#extra-border-pattern):
```css
background:
    linear-gradient(to right, rgba(0,0,0,0.3) 0px, transparent 5px),
    linear-gradient(to bottom, rgba(0,0,0,0.3) 0px, transparent 5px),
    linear-gradient(to left, rgba(0,0,0,0.3) 0px, transparent 5px),
    linear-gradient(to top, rgba(0,0,0,0.3) 0px, transparent 5px),
    transparent;
```

The `thickness` field controls the gradient length in pixels.

---

### Polygon

SVG polygon rendered inside an [extra border div](#extra-border-pattern).

```html
<svg width="32" height="32" viewBox="0 0 32 32"
     style="position:absolute; box-sizing: border-box; overflow: hidden;">
  <polygon fill="#336699"
           stroke="#000000"
           stroke-width="1"
           points="16,0 32,32 0,32" />
</svg>
```

The SVG element is reused on subsequent updates if one already exists.

---

### SolidLabel

Text rendering with font, color, alignment, wrapping, and ellipsis.

Rendered as a two-level flexbox structure inside an [extra border div](#extra-border-pattern):

```html
<div style="display: flex;
            align-items: center;           /* vertical alignment */
            justify-content: flex-start;   /* not used — text-align handles horizontal */
            width: 100%; height: 100%;">
  <div style="color: #FFFFFF;
              font-family: 'Segoe UI';
              font-size: 12px;
              line-height: 1.4;
              font-weight: bold;
              font-style: italic;
              text-decoration: underline line-through;
              text-align: center;
              text-overflow: ellipsis;
              white-space: pre-wrap;        /* or 'pre' if not wrapping */
              flex: 0 1 auto;
              max-width: 100%;
              max-height: 100%;
              overflow: hidden;">
    Text content here
  </div>
</div>
```

**Vertical alignment** via outer `align-items`:

| Value | CSS |
|-------|-----|
| `Top` | `align-items: flex-start` |
| `Center` | `align-items: center` |
| `Bottom` | `align-items: flex-end` |

**Horizontal alignment** via inner `text-align`:

| Value | CSS |
|-------|-----|
| `Left` | `text-align: left` |
| `Center` | `text-align: center` |
| `Right` | `text-align: right` |

**Ellipsis with wrap-line** (when feature gate `useWebkitLineClamp` is enabled):

```css
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: 3;       /* calculated: floor(height / lineHeight) */
```

The line-clamp value is recalculated on resize.

---

### ImageFrame

Image rendered as a CSS background image from inline base64 data.

Uses an [extra border div](#extra-border-pattern):

```css
background-image: url(data:image/png;base64,...);
background-repeat: no-repeat;
```

**Positioning (non-stretched):**
```css
background-position-x: left | center | right;   /* horizontalAlignment */
background-position-y: top | center | bottom;    /* verticalAlignment */
```

**Stretch mode:**
```css
background-origin: border-box;
background-size: 100% 100%;
```

**Disabled state:**
```css
filter: grayscale(100%);
```

Image format is auto-detected from binary headers:

| Format | Signature |
|--------|-----------|
| BMP | `"BM"` |
| GIF | `"GIF87a"` or `"GIF89a"` |
| PNG | `"\x89PNG"` |
| JPEG | `"\xFF\xD8"` |
| TIFF | `"II"` or `"MM"` |
| ICO | `"\x00\x00\x01\x00"` or `"\x00\x00\x02\x00"` |

---

### DocumentParagraph

Rich text rendering with caret support and inline objects.
See [DocumentParagraph.md](DocumentParagraph.md) for the full implementation details
(measurement, caret operations, hit-testing).

Each paragraph consists of lines separated by `\r*\n`. Within each line, text content
and inline objects are rendered as blocks:

- **Text blocks**: Consecutive `DocumentTextRunProperty` ranges and uncovered text between
  inline objects are merged into a single `Text` node.
- **Inline object blocks**: Each `DocumentInlineObjectRunProperty` becomes an `HTMLSpanElement`
  with `display: inline-block` and hardcoded size. If `backgroundElementId` is not -1,
  an `HTMLImageElement` is added as a child, sourced from the `ElementManager`.

```html
<div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;
            white-space: pre-wrap; text-align: left; overflow: hidden;">
  <div>Line 1 text<span style="display: inline-block; width: 20px;
       height: 20px; position: relative;"><img .../></span>more text</div>
  <div>Line 2 text</div>
</div>
```

**Inline object baseline** offsets the content vertically via `position: absolute`:
- `baseline === size.y`: content top at `0px` (normal)
- `baseline > size.y`: content pushed down (`top > 0`)
- `baseline < size.y`: content pushed up (`top < 0`)

---

## Extra Border Pattern

Many element types need a child `<div>` for proper border/shape rendering.
This is called the "extra border div" and is stored as a `$GacUI-ExtraBorder`
property on the parent HTML element.

```
Outer <div>      ← position: absolute; base style; NO visual styling
  └── Extra <div>  ← position: absolute; 0/0/100%/100%; actual visual CSS
        └── ...     ← optional content (SVG for Polygon, text for SolidLabel)
```

This pattern:
- Separates layout positioning from visual styling
- Enables reliable `border-radius` on ellipses / round rects
- Allows the inner div to be reused across description updates

Elements using extra border: SolidBorder (non-rectangle), SolidBackground (non-rectangle),
GradientBackground (non-rectangle), SinkBorder, SinkSplitter, InnerShadow, Polygon,
SolidLabel, ImageFrame.

Elements **not** using extra border: Raw, FocusRectangle, SolidBorder (rectangle),
SolidBackground (rectangle).

---

## Measurement System

The client measures certain values and returns them in `ElementMeasurings`
at the end of each rendering frame (`RendererEndRendering`).

### Font height

Measures the pixel height of a `fontFamily + fontSize` combination:

1. Create a temporary `<div>` with `textContent = "Ag"` and the target font style
2. Append to `document.body`, read `getComputedStyle(...).lineHeight`
3. Remove the div

Results are cached by `"fontSize:fontFamily"` key. Each unique combination
is reported only once.

### Text total size

Measures the pixel dimensions of a SolidLabel's text:

1. Create a test `<div>` with the label's font style
2. If `wrapLine`, constrain width to the element's bounds width
3. Read `offsetWidth` × `offsetHeight`

### Image metadata

When `ImageCreated` is received:

1. Convert binary data to a `data:` URL
2. Create an `HTMLImageElement` and register `load` and `error` handlers before
   setting `src`
3. After `load`, read `naturalWidth` × `naturalHeight`; after `error`, report the
   unsupported-image fallback
4. Auto-detect format from byte signature
5. Return `ImageMetadata` to the core

---

## Cursor Mapping

GacUI cursor types map to CSS `cursor` values:

| `WindowSystemCursorType` | CSS `cursor` |
|--------------------------|-------------|
| `SmallWaiting` | `wait` |
| `LargeWaiting` | `wait` |
| `Arrow` | `default` |
| `Cross` | `crosshair` |
| `Hand` | `pointer` |
| `Help` | `help` |
| `IBeam` | `text` |
| `SizeAll` | `move` |
| `SizeNESW` | `nesw-resize` |
| `SizeNS` | `ns-resize` |
| `SizeNWSE` | `nwse-resize` |
| `SizeWE` | `ew-resize` |

---

## Keyboard Mapping

JavaScript `KeyboardEvent` is converted to GacUI key codes using a three-tier strategy:

1. **`event.code`** (physical key position) — most reliable
2. **`event.key`** (logical character) — fallback
3. **`event.keyCode`** (legacy numeric code) — last resort

With an active browser text adapter, committed browser input supplies characters
and printable `keydown` does not synthesize them. Ordinary Core key events,
navigation, shortcuts, Enter and Tab keep their mappings. IME-owned keys pass to
the browser without also editing Core. Reserved browser shortcuts remain reserved.
Without an adapter, the legacy route accepts one Unicode code point in
`event.key`. Both routes use one helper that sends one UTF-16 code unit per
`IOChar`, preserving surrogate order and modifier flags. UTF-32 Core input joins
the pair before delivering the character to controls.

Auto-repeat detection:
- Track currently-pressed keys in a `Set`
- If a key-down fires while already in the set → `autoRepeatKeyDown = true`
- On `blur`, clear the set to avoid stuck keys

Cross-platform modifier handling:
- `IOKeyInfo.ctrl` tracks Ctrl independently of Command/Meta.
- `IOKeyInfo.osSuper` tracks Command on macOS, Super on Linux and Win on Windows.

---

## Mouse Input

`GacUIRendererImpl` maps DOM button values 0 through 4 to Left, Middle, Right,
Mouse4, and Mouse5. Consumed Mouse4/Mouse5 down and up events prevent their
browser defaults so Back/Forward navigation cannot disconnect the renderer.
Both events still reach Core and update application controls normally.

A mouse press immediately acquires browser pointer capture until release,
covering the round trip before Core can request capture. A rapid drag and release
outside the surface therefore still reach Core in order. Stopping the renderer
also releases any mouse pointer it still owns.

Core's `IORequireCapture` keeps mouse down, movement and release events flowing
when a drag leaves the renderer surface but remains in the browser document.
Document listeners forward only events originating outside the surface, so
ordinary events from rendered children are delivered once. Coordinates remain
relative to the renderer and can fall outside its bounds. `IOReleaseCapture`
ends this explicit forwarding; stopping the renderer also clears capture and removes
the document listeners. This prevents a modal resize from remaining active
after its mouse release occurs outside the rendered surface.

---

## Rendering Flow

### Initial render

```
1. RendererCreated([...])           → Register element types in ElementManager
2. RendererBeginRendering(...)      → Update element descriptions
3. RendererEndRendering()           → Collect & return measurements
4. RendererRenderDom(renderingDom)  → Build full IVirtualDom tree → HTML DOM
```

### Incremental update

```
1. RendererBeginRendering(...)      → Update changed element descriptions
2. RendererEndRendering()           → Collect & return measurements
3. RendererRenderDomDiff(diffs)     → Apply Created/Modified/Deleted diffs to IVirtualDom → update HTML
```

### Post-render layout (`fixBounds`)

After building/updating the tree:
1. Set root dimensions from window sizing config
2. Recursively apply CSS `left/top/width/height` to all nodes
3. Reconcile the target/root child order, leaving retained nodes and ancestors connected
4. Recalculate SolidLabel `-webkit-line-clamp` values for resized labels

---

## Feature Gates

Runtime toggles in `featureGates.ts`:

| Gate | Default | Effect |
|------|---------|--------|
| `useWebkitLineClamp` | `false` | Enables `-webkit-line-clamp` for multi-line text ellipsis. Falls back to `text-overflow: ellipsis` when disabled. |

## Touch ownership and FullControlTest.Touching

The renderer installs touch-action none on its stable target and every descendant before input begins. Descendant coverage matters because overflow-hidden DOM nodes establish scroll containers. Each touch pointer is captured on that stable target, so replacing rendered children or moving outside does not change the sequence target. Samples use target-relative CSS pixels and client contact rectangles; canvas DPR does not rescale input. Unavailable touch orientation/platform frame identity remain null.

Down-order contact slots are never reused within an overlapping sequence. Normal Up followed by lostpointercapture is cleanup, not cancellation of remaining contacts. Unexpected capture loss ends once, then drains physical Up/Cancel; pointercancel retires its own contact immediately. Connected disposal sends one Canceled_WindowDestroyed End before detaching listeners/captures. After transport loss, stop(true) performs silent cleanup and Core owns its disconnect cancellation. Touch compatibility mouse/boundary/activation events are suppressed locally and synchronously while real mouse/pen and non-touch activation retain their path.

Both HTTP and Wasm FCT call `installRawClock` from `<GacJS repo>/Gaclib/website/entry/assets/rawClock.js` to register `FullControlTest::Clock`, and `installRawTouching` from `<GacJS repo>/Gaclib/website/entry/assets/rawTouching.js` for manual ID-based Touching attachment. They share canvas sizing and observer cleanup in `<GacJS repo>/Gaclib/website/entry/assets/rawCanvas.js`. The clock strokes the rim, hour marks and all three hands in black at width 3, then draws the white face and cyan, green and yellow hands at width 2.

Touching has an empty interpretor. Its data is centerX,centerY,axisX,axisY,count followed by count pointId,x,y triples. The painter fills Core's transformed rectangle in sky blue, outlines it in black and draws orange radius-16 contact rings. The border and rings are two logical pixels wide. Raw hooks retain one canvas, track resize/DPR, redraw data changes and release observers on removal/disposal. Core's Misc > Touching page owns translation, rotation, scaling, three-contact pause and membership rebasing.

## Responding to IME and Virtual Keyboard

`TextInputCoordinator` in `<GacJS repo>/Gaclib/gaclib/renderer/src/textInput.ts`
is shared by HTTP and Wasm. Core owns document text, selection, commands and
committed rendering. The coordinator registers visible tagged boundaries by
logical DOM ID after each complete full/diff batch, including unchanged nodes.
Two focused tags are fatal even if one is read-only. Only the unique focused,
editable tag is a confirmed input target. Caret painting alone never activates
editing. Passive snapshot playback does not construct this coordinator.

The host is the existing boundary div, which can contain several paragraphs.
There is no proxy input, textarea or replacement editor subtree. Ordered child
reconciliation, full-tree reuse and CSS clipping preserve its identity and
connected ancestors. Removal, ancestor hiding, lost metadata/editability,
disconnect and renderer replacement invalidate the session generation. Late
callbacks cannot commit into a new session with the same ID. Bridge attributes
are restored when a host becomes ineligible.

Every visible eligible host is prepared before a gesture. A trusted mouse press
or qualified short touch release focuses it synchronously before Core's pointer
response. A candidate holds text until completed render/idle confirms its ID;
unchanged authoritative focus can reject it. Same-target taps need no additional
confirmation. Movement over eight CSS pixels, a hold of at least 500 ms,
overlapping contacts or cancellation disqualify a touch tap. Existing touch
capture and compatibility-mouse suppression remain in effect. Page-level focus
handlers respect editing descendants. External page focus suspends automatic
refocusing until a new Core target or gesture.

The browser contracts are defined by the [EditContext draft](https://www.w3.org/TR/edit-context/),
[Input Events Level 2](https://www.w3.org/TR/input-events-2/) and the
[VirtualKeyboard draft](https://www.w3.org/TR/virtual-keyboard/).
[WebKit's programmatic-focus issue](https://bugs.webkit.org/show_bug.cgi?id=195884)
explains why asynchronous webpage focus and native embedding privileges must be
distinguished when verifying keyboard activation.

Runtime fallback order is EditContext, contenteditable, then legacy physical
keyboard characters. `GacUISettings.textInput.adapter` accepts `auto`,
`edit-context`, `contenteditable` or `legacy` for controlled coverage without
replacing browser globals. EditContext requires its constructor, HTMLElement
attachment and all used update methods; a recognized unsupported attachment can
fall back, while unexpected errors remain fatal. Contenteditable requires
`contentEditable`, `onbeforeinput` and `InputEvent`, preferring reflected
`plaintext-only`. Without these input capabilities the legacy route cannot
promise IME or software-keyboard text input.

EditContext owns only a guarded JavaScript capture buffer at Core's current
selection. Replacement and selection offsets belong to that buffer. Preedit is
presented through a host pseudo-element; bounds use client CSS pixels and the
Core paragraph caret. Contenteditable places a collapsed browser capture
selection inside the existing paragraph, independently of Core's selected range.
Cancelable ordinary input is intercepted; noncancelable composition mutations
remain local until the transaction ends, then current Core descriptors restore
the structure. Composition revisions never produce `IOChar`. Final commits use
the shared UTF-16 helper exactly once; repeated identical commits remain valid.

Soft backward/forward deletion and line breaks translate to Core commands.
Physical-key ownership prevents duplicate commands. Clipboard keyboard shortcuts,
including Ctrl+V, go to Core so Copy, Cut and Paste share Core's rich clipboard
with menu and toolbar commands. They suppress the browser default; they do not
read the OS clipboard. A browser-originated paste event supplies plaintext in one
transaction. Spelling/autocorrection is disabled where supported; unsupported
replacement ranges, rich formatting and drops are rejected and reconciled.
There is no document-range editing protocol: arbitrary reconversion cannot be
implemented by appending text at an unrelated Core caret. Local ownership also
cannot detect an as-yet-unobserved Core focus change; transport ordering matters.

VirtualKeyboard is detected independently. Automatic browser policy is the
default. Optional `keyboardPolicy: 'manual'` calls `show()` only during a trusted
gesture on an eligible contenteditable host in a secure context with the required
API and policy property. EditContext exposure alone does not prove that
manual-show condition. Teardown hides only a keyboard owned by this session
while its host still has focus; external inputs keep their keyboard. Geometry,
viewport and scroll notifications refresh input bounds without setting global
`overlaysContent` or adding a second viewport inset. Core focus updates can focus
a host but cannot create user activation or promise a phone keyboard will open.

Use the controlled and live suites in
[<GacJS repo>/doc/Testing_Protocol.md](Testing_Protocol.md#browser-text-input).
They exercise detected adapters and forced contenteditable, ordinary Unicode,
engine composition, selection replacement/cancellation, lifecycle and structure.
The implementation run detected EditContext in Chromium 145.0.7632.6 and
contenteditable in WebKit 26.0 and Firefox 146.0.1; these are observations, not
permanent support rules. Follow the authoritative operations in
[<GacUI repo>/.github/Jobs/DebugRemoteProtocolSop.md](../../GacUI/.github/Jobs/DebugRemoteProtocolSop.md#3-type-and-preserve-text-in-two-editors):
in both Search and the central editor, compose at a collapsed caret, replace a
selected range, cancel without changing the range, then verify persistence.
CDP composition and synthetic ordering tests do not establish an OS candidate
window or physical software keyboard. Record actual browser/IME/device coverage
separately; a mobile viewport descriptor is not iOS Safari.
