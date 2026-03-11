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
4. **Replace textDiv children** with the newly built line divs.
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
   inline object bounds.
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

### GetCaret

Navigates from a caret position using `CaretRelativePosition`. All navigation uses
`ParagraphEditUnit[]` and `ParagraphLine[]` from the stored `ParagraphLayout`.

| Direction | Behavior |
|-----------|----------|
| `CaretFirst` | Return 0 |
| `CaretLast` | Return `text.length` |
| `CaretLineFirst` | First caret position on current line (`line.start`) |
| `CaretLineLast` | Last caret position on current line (`line.end`) |
| `CaretMoveLeft` | Move to the start of the unit containing or preceding the caret |
| `CaretMoveRight` | Move to the end of the unit containing or following the caret |
| `CaretMoveUp` | Find the unit on the previous visual line closest to the current X coordinate |
| `CaretMoveDown` | Find the unit on the next visual line closest to the current X coordinate |

**Line detection** (`_findLineForCaret`): walks `ParagraphLine[]` to find which line
a caret belongs to. If the caret falls between two lines (in a line separator), the
preceding line is returned.

**Up/down navigation**: Uses the Y coordinate of `ParagraphEditUnit.frontCaretBaseline`
to detect visual lines. This correctly handles wrapped lines within a single
`ParagraphLine`. Selects the unit on the target visual line whose X position is closest
to the current caret's X.

Responds with `{ newCaret, preferFrontSide }`.

### OpenCaret / CloseCaret

- `OpenCaret`: stores the `OpenCaretRequest` in the `ParagraphLayout.caret` field and
  calls `setCaretVisible(textDiv, true, layout)`. Also updates the stored element desc.
- `CloseCaret`: sets `ParagraphLayout.caret = null` and calls
  `setCaretVisible(textDiv, false, layout)`. Also updates the stored element desc.

Both are fire-and-forget messages (no response).

`setCaretVisible()` creates or reuses a `<div>` (stored as `$GacUI-ParagraphCaretNodeName`
on the textDiv) styled as a 2px-wide colored bar at the caret's pixel position.

---

## Caret Bounds

`RequestDocumentParagraph_GetCaretBounds` returns pixel rectangles for every valid
caret position (0 through `text.length`).

For each position, it scans `ParagraphEditUnit[]`:
- **Front-side bound**: the unit where `pos >= start && pos < end` →
  use `frontCaretBaseline`.
- **Back-side bound**: the unit where `pos > start && pos <= end` →
  use `backCaretBaseline`.

Each bound is a 1px-wide rectangle from baseline minus caret height to baseline.

Responds with `{ frontSideBounds, backSideBounds }` — arrays of `Rect`, one per
caret position.

---

## Inline Object Hit-Testing

`RequestDocumentParagraph_GetInlineObjectFromPoint` tests a pixel coordinate against
inline objects.

Iterates `ParagraphEditUnit[]`:
1. Skip units where `frontCaretBaseline.y !== backCaretBaseline.y` (line separators).
2. Compute the bounding rectangle from the unit's front/back X and baseline Y / caret height.
3. If the point falls inside the rectangle, search `runsDiff` for a
   `DocumentInlineObjectRunProperty` run covering that unit's range.
4. Return the matching `DocumentRun`, or `null` if nothing matches.

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

1. **No incremental update**: `updateParagraph()` is not yet implemented.
   `initializeParagraph()` does a full DOM rebuild on every
   `RequestRendererUpdateElement_DocumentParagraph` call, including for selection-only
   style changes. A `// TODO: updateParagraph with actual diffs.` comment remains
   in `elementStyles_DocumentParagraph.ts`.

2. **No separate modules**: The plan originally proposed extracting caret navigation,
   hit-testing, and incremental update logic into separate modules
   (`documentParagraphCaret.ts`, `documentParagraphHitTest.ts`,
   `documentParagraphUpdater.ts`). All logic currently lives inline in
   `GacUIRendererImpl.ts`.

3. **Caret blinking**: The core handles blinking by sending `OpenCaret`/`CloseCaret`
   periodically. There is no client-side blink timer.
