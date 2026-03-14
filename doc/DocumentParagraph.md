# DocumentParagraph Implementation

This document describes how the `DocumentParagraph` element type is implemented
in `@gaclib/renderer` — covering the DOM construction, measurement, caret operations,
and hit-testing logic.

See [Protocol.md](Protocol.md) for the protocol-level description of
`DocumentParagraph` messages.
See [DOM.md](DOM.md) for general HTML rendering patterns shared by all element types.

---

## Table of Contents

- [Architecture Summary](#architecture-summary)
- [Source Locations](#source-locations)
- [Data Structures](#data-structures)
- [DOM Construction (initializeParagraph)](#dom-construction-initializeparagraph)
- [Off-Screen Measurement](#off-screen-measurement)
- [Pending Elements](#pending-elements)
- [RequestRendererUpdateElement\_DocumentParagraph](#requestrendererupdateelement_documentparagraph)
- [Caret Operations](#caret-operations)
- [Caret Bounds](#caret-bounds)
- [Inline Object Hit-Testing](#inline-object-hit-testing)
- [Text Position Queries](#text-position-queries)
- [Known Limitations](#known-limitations)

---

## Architecture Summary

All DocumentParagraph protocol methods are implemented inline in
`GacUIRendererImpl.ts`. Helper types and functions for DOM construction,
measurement, and caret rendering live in `elementStyles_DocumentParagraph.ts`.

```
RequestRendererUpdateElement_DocumentParagraph(id, requestArgs)
    │
    ├── Build/merge ElementDesc_DocumentParagraphFull
    ├── _updateElement() → applyTypedStyle() → initializeParagraph()
    │   (full DOM rebuild every time — no incremental update)
    ├── If not yet in DOM → create temp element + _pendingElements
    ├── _measureParagraphDocumentSize()
    │   ├── Attach htmlElement off-screen if needed (not textDiv alone)
    │   ├── fillParagraphMeasurements()
    │   └── Read scrollWidth / scrollHeight
    └── Respond with { documentSize }

Caret/hit-test methods (GetCaret, GetCaretBounds, etc.)
    │
    └── All operate on ParagraphLayout stored via getParagraphLayout()
```

---

## Source Locations

| File | What it contains |
|------|-----------------|
| `GacUIRendererImpl.ts` | All `Request*_DocumentParagraph` method implementations, `_paragraphElements` map, `_pendingElements` map, `_measureParagraphDocumentSize()`, `_getParagraphLayout()`, `_findLineForCaret()`, `_findUnitForCaret()` |
| `elementStyles_DocumentParagraph.ts` | `ParagraphLayout`, `ParagraphLine`, `ParagraphBlock`, `ParagraphEditUnit` types; `initializeParagraph()`, `fillParagraphMeasurements()`, `renderParagraphMeasurements()`, `setCaretVisible()`, `isCaretVisible()`; line/block building helpers |
| `elementStyles.ts` | `applyTypedStyle()` has a `DocumentParagraph` case that calls `initializeParagraph()` and stores the layout via `setParagraphLayout()`. `applyBounds()` calls `fillParagraphMeasurements()` when a paragraph layout exists. |

---

## Data Structures

### ParagraphLayout

Stored on the HTML element via `setParagraphLayout()` / `getParagraphLayout()`.

```typescript
interface ParagraphLayout {
    paragraph: ElementDesc_DocumentParagraph & { text: string };
    caret: Nullable<OpenCaretRequest>;
    caretVisible: boolean;
    lines: ParagraphLine[];
    defaultFontSize: number;
    units: ParagraphEditUnit[];                        // filled by fillParagraphMeasurements
    inlineObjectBounds: ElementMeasurings['inlineObjectBounds'];  // filled by fillParagraphMeasurements
}
```

### ParagraphLine

Each line corresponds to a text segment between `\r*\n` separators:

```typescript
interface ParagraphLine {
    start: number;    // inclusive caret offset
    end: number;      // exclusive caret offset (before the \r*\n)
    blocks: ParagraphBlock[];
    element: HTMLDivElement;
}
```

### ParagraphBlock

A block is either a styled text span or an inline object span:

```typescript
interface ParagraphBlock {
    start: number;
    end: number;
    span: HTMLSpanElement;
    text?: Text;              // present for text blocks
    image?: HTMLImageElement; // present for image inline objects
}
```

### ParagraphEditUnit

The minimum selectable range of consecutive code points. JavaScript code points
are UTF-16. Most characters are a single unit; some emojis and CJK characters
span multiple code points. Each inline object and each line separator is also
one unit.

```typescript
interface ParagraphEditUnit {
    start: number;
    end: number;
    frontCaretBaseline: Point;   // bottom of caret at front edge (left for LTR)
    backCaretBaseline: Point;    // bottom of caret at back edge (right for LTR)
    caretHeight: Integer;
}
```

For text units and inline objects, `frontCaretBaseline.y === backCaretBaseline.y`.
For line separators, the Y values differ (front = end of current line, back = start
of next line).

---

## DOM Construction (initializeParagraph)

`initializeParagraph()` builds the full paragraph DOM from scratch. It is called
on every update — there is no incremental `updateParagraph()` yet.

**Input:** `ElementDesc_DocumentParagraphFull` (which contains `paragraph` + `caret`).

**Steps:**

1. **Split text by line breaks** (`/\r*\n/`), preserving empty trailing lines.
2. **Style the textDiv**: set `white-space: pre-wrap` or `pre`, `text-align`, and
   full-size positioning.
3. **For each line:**
   - Call `buildBlocksForLine()` to produce `ParagraphBlock[]`.
   - Create a `<div>` element for the line.
   - If `wrapLine && maxWidth > 0`, set `width: {maxWidth}px` on the line div.
   - If `!wrapLine`, set `white-space: nowrap` on the line div.
   - If the line is empty, set `height: {defaultFontSize}px` so it takes space.
   - Append all block spans as children of the line div.
4. **Replace textDiv children** with the newly built line divs. After
   `replaceChildren()`, clear the stale caret and measurement overlay references
   (`ParagraphCaretNodeName` and `ParagraphMeasurementsNodeName`) so they will be
   recreated on demand.
5. Return a `ParagraphLayout` with empty `units` (filled later by measurement).

**Block building** (`buildBlocksForLine()`):

- Collects all runs overlapping the line range from `runsDiff`, clipped to line bounds.
- For gaps between runs: creates a plain text `<span>`.
- For `DocumentTextRunProperty` runs: creates a styled `<span>` with font, color, and
  background CSS.
- For `DocumentInlineObjectRunProperty` runs: creates an inline-block `<span>` with
  hardcoded size. If `backgroundElementId !== -1`, loads the image from `ElementManager`
  and adds an `<img>` child.
- If the line has no blocks at all, creates an empty plain text span.

---

## Off-Screen Measurement

`_measureParagraphDocumentSize()` in `GacUIRendererImpl.ts` measures the natural
content size of a paragraph. The paragraph's layout width is determined entirely
by `maxWidth` (or infinite when `!wrapLine`), so measurement does not depend on
the element's position in the final DOM tree.

**Steps:**

1. Check whether `htmlElement` (the outer element, parent of `textDiv`) is already
   in the DOM via `htmlElement.isConnected`.
2. If **not connected**: save `htmlElement.style.cssText`, then temporarily attach
   `htmlElement` (not `textDiv` alone) to `document.body` with:
   ```css
   position: absolute; left: -9999px; top: -9999px; visibility: hidden;
   ```
   The parent-child relationship between `htmlElement` and `textDiv` is preserved.
3. Override `textDiv.style.height` to `auto` (so it expands to content height).
   If `!wrapLine`, also set `width: auto`. If `wrapLine && maxWidth > 0`, set
   `width: {maxWidth}px`.
4. Call `fillParagraphMeasurements(textDiv, layout)` to compute edit units and
   inline object bounds. If `layout.caret !== null`, this also restores the caret
   by calling `setCaretVisible(textDiv, true, layout)` — the previous caret `<div>`
   was destroyed when `initializeParagraph()` replaced textDiv's children.
5. Read `textDiv.scrollWidth` and `textDiv.scrollHeight` as the document size.
6. Restore `textDiv.style.height` and `textDiv.style.width`.
7. If temporarily attached: detach `htmlElement` from `document.body` and restore
   its `style.cssText`.

**Why attach `htmlElement` instead of `textDiv`:**

`textDiv` uses `height: 100%` which resolves relative to its parent. If `textDiv`
were attached directly to `document.body`, it would measure against the body's height
instead of expanding to its natural content height. Attaching the parent `htmlElement`
(with `height: auto` on `textDiv`) preserves the intended CSS cascade.

---

## Pending Elements

When `RequestRendererUpdateElement_DocumentParagraph` arrives before
`RequestRendererRenderDomDiff` has run, the element has no virtual DOM node yet.
In this case:

1. A temporary `<div>` is created.
2. `applyTypedStyle()` is called on it (which triggers `initializeParagraph()`).
3. The div is stored in `_pendingElements: Map<Integer, HTMLElement>`.
4. Measurement proceeds as normal using this temporary element.

When the DOM diff later mounts the element (via `applyTypedStyle()` on the real
virtual DOM node), the pending element is consumed. The style was already applied,
so the element renders correctly on first mount.

---

## RequestRendererUpdateElement\_DocumentParagraph

This is the core method. It receives `ElementDesc_DocumentParagraph` and responds
with the measured `documentSize`.

**First call** (`requestArgs.text !== null`):

- `text` contains the full paragraph text. `runsDiff` contains the complete set of
  styled runs. `createdInlineObjects` contains all inline object IDs.
- Builds `ElementDesc_DocumentParagraphFull` with `paragraph: requestArgs` and
  `caret: null`.

**Subsequent calls** (`requestArgs.text === null`):

- Merges with the existing `ElementDesc_DocumentParagraphFull`: carries forward the
  original `text`, overlays other changed fields (`wrapLine`, `maxWidth`, `alignment`,
  `runsDiff`, `createdInlineObjects`, `removedInlineObjects`).
- The `text` field never changes incrementally — changing text requires recreating
  the document.

**After building the desc:**

1. Call `_updateElement()` which triggers `applyTypedStyle()` → `initializeParagraph()`.
   This does a **full DOM rebuild** on every call.
2. Look up the virtual DOM node for the element. If not found, create a pending
   element (see above).
3. Get the `textDiv` (extra border div) and register the element in
   `_paragraphElements` for later caret/hit-test queries.
4. Call `_measureParagraphDocumentSize()` and respond with the result.

---

## Caret Operations

### GetCaret — Navigation

The core asks the client to compute a new caret position relative to the current one
(e.g., move left, move to line start). The client walks the `ParagraphEditUnit[]` and
`ParagraphLine[]` stored in the `ParagraphLayout` to resolve the request.

**Horizontal movement** (Left / Right) snaps to the nearest edit-unit boundary in
the requested direction. Because edit units already account for multi-code-point
characters and inline objects, this naturally produces the correct "one character"
or "one object" step.

**Vertical movement** (Up / Down) first determines which visual line the caret is
on by comparing baseline Y coordinates. It then finds the edit unit on the adjacent
visual line whose X position is closest to the current caret's X, preserving the
horizontal intent across lines. This works correctly even when a single
`ParagraphLine` wraps into multiple visual lines.

**Line boundary** (LineFirst / LineLast) uses `_findLineForCaret()` to locate the
`ParagraphLine` that contains the caret, then returns `line.start` or `line.end`.
When the caret falls exactly at a line separator, the preceding line is chosen.

The response includes `preferFrontSide` — a hint that tells the core which side of
the boundary the caret logically belongs to after the move.

### OpenCaret / CloseCaret — Rendering and Blinking

`OpenCaret` activates the caret: it records the caret position and color in the
`ParagraphLayout`, renders a 2px-wide colored bar at the correct pixel position,
and starts a client-side blink timer that toggles the bar's visibility every 500 ms.

The caret bar's position is determined by the **frontSide** flag in the request.
When a caret sits at the boundary between two characters with different font sizes,
the flag decides which character's metrics (baseline and height) are used to size and
position the bar. If the preferred side has no matching edit unit (e.g., at the very
beginning or end of the text), the opposite side is tried; if neither matches, the
bar falls back to the paragraph's default font size at position (0, 0).

`CloseCaret` hides the bar, clears the stored caret state, and stops the blink timer.

Both are fire-and-forget messages (no response expected).

---

## Caret Bounds

The core needs pixel rectangles for every caret position so it can render selections
and map mouse clicks to text offsets. `GetCaretBounds` computes a 1px-wide rectangle
for each position from 0 to `text.length`, using the edit unit whose range covers
that position.

Each position produces two bounds — a **front-side** bound (using the unit that
starts at or before the position) and a **back-side** bound (using the unit that
ends at or after the position). These differ at character boundaries where the
neighboring characters have different font sizes or sit on different visual lines.

The response contains `{ frontSideBounds, backSideBounds }` — parallel arrays of
`Rect`, one entry per caret position.

---

## Inline Object Hit-Testing

`GetInlineObjectFromPoint` determines whether a pixel coordinate falls on an inline
object (e.g., an embedded image). It iterates the edit units, skipping line
separators (which span two visual lines and cannot be inline objects), and checks
whether the point lies within each unit's bounding rectangle. When a hit is found,
it looks up the corresponding `DocumentInlineObjectRunProperty` from `runsDiff` and
returns that run. If nothing matches, it returns `null`.

---

## Text Position Queries

### IsValidCaret

A caret position is valid if and only if it equals `unit.start` or `unit.end` for
some `ParagraphEditUnit`. Positions inside a unit (not at a boundary) are invalid.

### GetNearestCaretFromTextPos

Scans `ParagraphEditUnit[]`:
- If the text position falls inside a unit, snaps to whichever boundary (start or end) is closer.
- Otherwise, finds the unit boundary globally nearest to the requested position.

---

## Known Limitations

1. **No separate modules**: The plan originally proposed extracting caret navigation,
   hit-testing, and incremental update logic into separate modules
   (`documentParagraphCaret.ts`, `documentParagraphHitTest.ts`,
   `documentParagraphUpdater.ts`). All logic currently lives inline in
   `GacUIRendererImpl.ts`.

2. **Caret blinking**: The client maintains its own blink timer. When `OpenCaret`
   is received, `_startCaretBlink()` creates a `setInterval(500)` that toggles
   `layout.caretVisible` and calls `setCaretVisible()` every 500 ms. The timer is
   stopped by `_stopCaretBlink()` when `CloseCaret` is received or a new `OpenCaret`
   replaces it. The core sends `OpenCaret` once to start blinking and `CloseCaret`
   once to stop it — it does not send periodic messages.
