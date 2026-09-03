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

Each `RenderingDom` node maps to one or two `IVirtualDom` nodes:

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
}
```

---

## Clipping (ValidArea)

When a `RenderingDom` node's `validArea` is smaller than the natural intersection
of its bounds with the parent's visible area, a **two-node structure** is created:

```
  Outer (id = original, bounds = validArea)     ← overflow: hidden
    └── Inner (id = -2, bounds = original)      ← actual content + element
```

The outer `<div>` clips rendering via `overflow: hidden`. The inner `<div>` holds
the element content and can extend beyond the outer div's edges.

This structure is automatically added/removed as bounds change during diff updates.

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

A transparent container with no visual representation.

```html
<div style="/* base style only */"></div>
```

Used as a layout-only node — the GacUI composition system may produce these for
positioning children without any graphical element.

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

Auto-repeat detection:
- Track currently-pressed keys in a `Set`
- If a key-down fires while already in the set → `autoRepeatKeyDown = true`
- On `blur`, clear the set to avoid stuck keys

Cross-platform modifier handling:
- `IOKeyInfo.ctrl` is set for both `Ctrl` (Windows/Linux) and `Cmd` (macOS)
- This provides a unified interface for GacUI application shortcuts

---

## Mouse Input

`GacUIRendererImpl` maps DOM button values 0 through 4 to Left, Middle, Right,
Mouse4, and Mouse5. Consumed Mouse4/Mouse5 down and up events prevent their
browser defaults so Back/Forward navigation cannot disconnect the renderer.
Both events still reach Core and update application controls normally.

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
3. Replace the target element's children with the root element
4. Recalculate SolidLabel `-webkit-line-clamp` values for resized labels

---

## Feature Gates

Runtime toggles in `featureGates.ts`:

| Gate | Default | Effect |
|------|---------|--------|
| `useWebkitLineClamp` | `false` | Enables `-webkit-line-clamp` for multi-line text ellipsis. Falls back to `text-overflow: ellipsis` when disabled. |
