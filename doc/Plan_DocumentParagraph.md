# Plan: Implementing DocumentParagraph Renderer

## Overview

This document describes the plan for implementing the `Renderer (DocumentElement)` section
in `GacUIRendererImpl.ts`, which handles rich text paragraphs with caret support,
inline objects, and incremental style updates.

---

## Table of Contents

- [Current State](#current-state)
- [Architecture Summary](#architecture-summary)
- [Protocol Methods to Implement](#protocol-methods-to-implement)
- [Data Flow and Lifecycle](#data-flow-and-lifecycle)
- [Layout and Measurement Strategy](#layout-and-measurement-strategy)
- [Incremental Update Strategy](#incremental-update-strategy)
- [Caret Operations](#caret-operations)
- [Module Decomposition](#module-decomposition)
- [Test Strategy](#test-strategy)
- [Implementation Phases](#implementation-phases)

---

## Current State

All `Request*_DocumentParagraph` methods in `GacUIRendererImpl.ts` currently throw
`Not Implemented` errors. However, substantial supporting code already exists:

| File | What exists |
|------|------------|
| `elementStyles_DocumentParagraph.ts` | `initializeParagraph()`, `fillParagraphMeasurements()`, `renderParagraphMeasurements()`, `ParagraphLayout`, `ParagraphLine`, `ParagraphBlock`, `ParagraphEditUnit`, caret show/hide |
| `elementStyles.ts` | `applyTypedStyle()` has a `DocumentParagraph` case that calls `initializeParagraph()` and stores the layout via `setParagraphLayout()`. `applyBounds()` calls `fillParagraphMeasurements()` when a paragraph layout exists. |
| `GacUIElementManager.ts` | `TypedElementDesc` includes `{ type: DocumentParagraph; desc: ElementDesc_DocumentParagraphFull }` |
| `elementMeasurer.ts` | No DocumentParagraph-specific measurement support yet — only SolidLabel and ImageFrame |

The snapshot rendering path (`snapshots.html`) already exercises `initializeParagraph()` via
`applyTypedStyle()` → `initializeParagraph()`, proving the initial DOM construction works.

---

## Architecture Summary

```
RequestRendererUpdateElement_DocumentParagraph(id, requestArgs)
    │
    ├── First call (text !== null): Build full ParagraphLayout
    │   ├── Merge requestArgs into ElementDesc_DocumentParagraphFull
    │   ├── Store via _updateElement() → applyTypedStyle() → initializeParagraph()
    │   └── Respond with documentSize after layout
    │
    └── Subsequent calls (text === null): Incremental style update
        ├── Patch runsDiff into existing ParagraphLayout
        ├── Update only affected DOM spans
        └── Respond with documentSize after layout

Other methods (GetCaret, GetCaretBounds, etc.)
    │
    └── All operate on the ParagraphLayout stored on the HTML element
```

---

## Protocol Methods to Implement

### `RequestRendererUpdateElement_DocumentParagraph(id, requestArgs)`

**This is the core method.** It receives `ElementDesc_DocumentParagraph` and must return
`UpdateElement_DocumentParagraphResponse` with the measured `documentSize`.

**Key behaviors:**
- `requestArgs.text` is non-null only on the first call (full document creation).
  The text never changes incrementally — changing text requires recreating the document.
- Subsequent calls have `requestArgs.text === null` and carry only `runsDiff` changes
  (style updates, inline object changes).
- `requestArgs.runsDiff` contains the **complete** set of runs after the change, not a diff
  against the previous runs. Each call replaces the previous runs.
- `requestArgs.createdInlineObjects` / `requestArgs.removedInlineObjects` track inline
  object lifecycle.
- Must respond with `{ documentSize: { x, y } }` — the pixel dimensions of the rendered paragraph.

**Critical timing issue — Layout before measurement:**

`fillParagraphMeasurements()` uses `Range.getClientRects()` and `getBoundingClientRect()`
to compute caret positions. These APIs require the DOM to be laid out (i.e., the element
must be in the document, with CSS applied and bounds set).

However, `RequestRendererUpdateElement_DocumentParagraph` is called **during**
`RendererBeginRendering`, **before** `RendererRenderDomDiff` which triggers `fixBounds()`
that mounts elements into the document.

**Solution — Deferred measurement:**

The response cannot be sent immediately. Instead:

1. During `RequestRendererUpdateElement_DocumentParagraph`: Build/update the DOM structure,
   store the pending response ID, and register a "needs measurement" flag.
2. After `fixBounds()` mounts the DOM: Measure the paragraph's actual dimensions and
   send the response.

This mirrors how `ElementHTMLMeasurer` already defers `RespondRendererEndRendering` until
image measurements complete. We extend this pattern:

- Add a `_pendingParagraphMeasurements` queue in `ElementHTMLMeasurer` (or a new
  `DocumentParagraphMeasurer` helper).
- After `fixBounds()` runs in `RequestRendererRenderDom` / `RequestRendererRenderDomDiff`,
  iterate pending paragraphs, call `fillParagraphMeasurements()`, read element dimensions,
  and call `RespondRendererUpdateElement_DocumentParagraph()`.

### `RequestDocumentParagraph_GetCaret(id, requestArgs)`

Navigate from a caret position using `CaretRelativePosition`:

| Direction | Behavior |
|-----------|----------|
| `CaretFirst` | Return caret position 0 |
| `CaretLast` | Return caret position = text.length |
| `CaretLineFirst` | First valid caret on current line |
| `CaretLineLast` | Last valid caret on current line |
| `CaretMoveLeft` | Move one unit left (respecting inline objects) |
| `CaretMoveRight` | Move one unit right (respecting inline objects) |
| `CaretMoveUp` | Move to previous line at same X offset |
| `CaretMoveDown` | Move to next line at same X offset |

All navigation uses `ParagraphEditUnit[]` from the layout. For Up/Down, find the unit
whose X range contains the current caret's X position on the target line.

Respond with `GetCaretResponse { newCaret, preferFrontSide }`.

### `RequestDocumentParagraph_GetCaretBounds(id, requestArgs)`

Return pixel bounds for every valid caret position (0 through text.length).

Uses `ParagraphEditUnit[]`:
- For each caret position, find the matching unit and extract the pixel rectangle
  from `frontCaretBaseline` / `backCaretBaseline` / `caretHeight`.

Respond with `GetCaretBoundsResponse { frontSideBounds, backSideBounds }`.

### `RequestDocumentParagraph_GetInlineObjectFromPoint(id, requestArgs)`

Hit-test a pixel coordinate against inline objects. Iterate units, find inline object
units whose bounds contain the point, and return the corresponding `DocumentRun`.

Respond with `DocumentRun | null`.

### `RequestDocumentParagraph_GetNearestCaretFromTextPos(id, requestArgs)`

Convert a text position to the nearest valid caret position. Walk `ParagraphEditUnit[]`
and find the unit containing or nearest to the text position.

Respond with `int` (caret position).

### `RequestDocumentParagraph_IsValidCaret(id, requestArgs)`

Check if a caret position falls on a valid unit boundary.

Respond with `bool`.

### `RequestDocumentParagraph_OpenCaret(requestArgs)`

Show a blinking caret. Store the `OpenCaretRequest` in the `ParagraphLayout` and
call `setCaretVisible()` (already implemented).

No response needed (fire-and-forget message).

### `RequestDocumentParagraph_CloseCaret(requestArgs)`

Hide the caret for the given element ID. Call `setCaretVisible(false)`.

No response needed.

---

## Data Flow and Lifecycle

### Rendering Frame Sequence

```
RendererCreated([{ id: N, type: DocumentParagraph }])
  → ElementManager registers element N

RendererBeginRendering({ updatedElements: [...] })
  → OrdinaryElementDescVariant does NOT include DocumentParagraph
  → DocumentParagraph updates come via separate RequestRendererUpdateElement_DocumentParagraph

RequestRendererUpdateElement_DocumentParagraph(responseId, { id: N, text: "...", runsDiff: [...], ... })
  → Build/update DOM, queue deferred measurement with responseId

RendererEndRendering(responseId)
  → Collect SolidLabel/image measurements → respond

RendererRenderDomDiff(diffs)
  → fixBounds() mounts everything → triggers applyBounds()
  → applyBounds() calls fillParagraphMeasurements() for paragraph elements
  → After fixBounds(), flush deferred paragraph measurements
  → RespondRendererUpdateElement_DocumentParagraph(responseId, { documentSize })
```

### Element Lifecycle

```
RendererCreated        → element registered in ElementManager
RequestRendererUpdateElement_DocumentParagraph (first)  → full document built
RequestRendererUpdateElement_DocumentParagraph (subsequent) → incremental style changes
RequestDocumentParagraph_*  → caret navigation, bounds queries
RequestRendererUpdateElement_DocumentParagraph (with new runs) → style/selection changes
RendererDestroyed      → element removed, ParagraphLayout discarded
```

---

## Layout and Measurement Strategy

### The Problem

`fillParagraphMeasurements()` needs DOM layout to be complete before it can measure.
The DOM is only mounted during `fixBounds()`, which happens after
`RequestRendererUpdateElement_DocumentParagraph` is called.

### The Solution: Deferred Response Pattern

Add a deferred measurement queue to the measurer:

```typescript
interface PendingParagraphMeasurement {
    responseId: number;
    elementId: number;
}
```

The flow:

1. `RequestRendererUpdateElement_DocumentParagraph(responseId, requestArgs)`:
   - Build or update the DOM (create ParagraphLayout or patch existing).
   - Store the update via `_updateElement()`.
   - Push `{ responseId, elementId }` onto `_pendingParagraphMeasurements`.

2. After `fixBounds()` in `RequestRendererRenderDom` / `RequestRendererRenderDomDiff`:
   - For each pending measurement:
     - Find the HTML element for the paragraph.
     - `fillParagraphMeasurements()` has already been called by `applyBounds()`.
     - Read the rendered dimensions from the `textDiv` (the extra border div).
     - Call `_responses.RespondRendererUpdateElement_DocumentParagraph(responseId, { documentSize })`.
   - Clear the queue.

3. If `fixBounds()` hasn't happened yet (e.g., the paragraph is not yet in the DOM tree),
   the measurement stays queued until the next `fixBounds()` call.

### Why This Works

- `applyBounds()` in `elementStyles.ts` already calls `fillParagraphMeasurements()` 
  for any element with a `ParagraphLayout` — so by the time `fixBounds()` completes,
  all paragraph measurements are filled.
- The deferred pattern is already proven by `ElementHTMLMeasurer` for image metadata.
- No additional frame delay: measurement happens in the same rendering cycle, just
  after DOM mounting rather than before.

### Fallback: Temporary Off-Screen Measurement

If a paragraph needs to be measured before it's mounted (unlikely but possible in edge
cases), we can temporarily attach the textDiv to `document.body` off-screen, measure,
and detach. This is the same approach used for SolidLabel `TotalSize` measurement.

---

## Incremental Update Strategy

### Why Incremental Updates Matter

Selection changes are the most frequent incremental update. When a user drags to select
text, the core sends rapid `RequestRendererUpdateElement_DocumentParagraph` calls with
only `runsDiff` changes (the selection adds background colors to text runs). These must
be fast because:

1. Each mouse move during a drag generates a new selection update.
2. The user perceives lag if DOM manipulation takes >16ms per frame.
3. Rebuilding the entire paragraph from scratch on each selection change is too expensive.

### What Changes Incrementally

| Field | First call | Subsequent calls | Interpretation |
|-------|-----------|-----------------|----------------|
| `text` | Full text ≠ null | Always null | Text never changes incrementally |
| `wrapLine` | Initial value | May change | Global layout property |
| `maxWidth` | Initial value | May change | Global layout property |
| `alignment` | Initial value | May change | Global layout property |
| `runsDiff` | Complete runs | Complete replacement runs | Full set of current runs |
| `createdInlineObjects` | Initial set | New objects | Newly created inline objects |
| `removedInlineObjects` | Empty | Removed IDs | Inline objects to remove |

### Incremental DOM Update Algorithm

Since `runsDiff` provides the **complete** current set of runs (not a delta), the
algorithm is:

**For each line in the existing ParagraphLayout:**

1. Compute the new set of `ParagraphBlock`s that the current `runsDiff` would produce
   for this line's text range.
2. Compare with existing blocks:
   - **Same type, same range, same properties** → No change (skip).
   - **Same type, same range, different properties** → Update CSS inline style only.
   - **Different structure** → Rebuild the line's DOM children.

**Optimization for selection changes (the common case):**

Selection changes only modify `textColor` and `backgroundColor` in `DocumentTextRunProperty`.
The text content, font, and inline objects remain the same. Therefore:

1. For each `ParagraphBlock` with a `text` node:
   - If the block's range overlaps with a changed run, update `span.style.color`
     and `span.style.backgroundColor` directly.
   - If the block needs to be split (a run boundary falls inside a block), splice the
     text node and create new spans.

2. For blocks that need restructuring:
   - Call `buildBlocksForLine()` for just that line and replace the line's DOM children.

**Fast-path detection:**

```typescript
function isStyleOnlyChange(oldRuns: DocumentRun[], newRuns: DocumentRun[]): boolean {
    // Returns true if:
    // - Same number of runs
    // - All run boundaries (caretBegin, caretEnd) are identical 
    // - All run types match (text vs inline object)
    // - Only textColor/backgroundColor differ
}
```

When `isStyleOnlyChange` returns true, iterate runs in parallel and update only
the CSS properties that differ — no DOM structure changes needed.

### New Function: `updateParagraph()`

```typescript
export function updateParagraph(
    textDiv: HTMLElement,
    layout: ParagraphLayout,
    newDesc: SCHEMA.ElementDesc_DocumentParagraph,
    elements: ElementManager
): void
```

This function replaces the `// TODO: updateParagraph with actual diffs` comment in
`elementStyles_DocumentParagraph.ts`.

**Algorithm:**

1. Update `layout.paragraph` metadata (`wrapLine`, `maxWidth`, `alignment`).
2. If `wrapLine`, `maxWidth`, or `alignment` changed: update `textDiv` CSS styles and
   each line's width constraints.
3. Handle `removedInlineObjects`: find and remove corresponding spans.
4. Handle `createdInlineObjects`: no DOM changes needed yet — they'll appear in `runsDiff`.
5. For each line, diff old runs vs new runs within that line range:
   - If structure unchanged (same boundaries and types): update span styles inline.
   - If structure changed: rebuild line DOM via `buildBlocksForLine()`.
6. Update `layout.paragraph.runsDiff` to the new runs.

---

## Caret Operations

### Caret Position Model

A caret position is an integer from 0 to `text.length`. Each `ParagraphEditUnit` covers
a range `[start, end)` and has:

- `frontCaretBaseline`: pixel coordinates of the front (left for LTR) caret
- `backCaretBaseline`: pixel coordinates of the back (right for LTR) caret
- `caretHeight`: pixel height of the caret

### GetCaret Navigation

The implementation follows the C++ unit test reference implementation in
`GuiUnitTestProtocol_Rendering_Document.cpp`:

```
CaretFirst      → 0
CaretLast       → text.length
CaretLineFirst  → first valid caret on current line
CaretLineLast   → last valid caret on current line (before line break)
CaretMoveLeft   → previous unit boundary (skip inline objects as one unit)
CaretMoveRight  → next unit boundary (skip inline objects as one unit)
CaretMoveUp     → same X offset on previous line
CaretMoveDown   → same X offset on next line
```

For `CaretMoveUp` / `CaretMoveDown`, the X coordinate of the current caret
determines the target position on the adjacent line.

### Line Detection

To determine which line a caret is on:

```typescript
function findLineForCaret(layout: ParagraphLayout, caret: number): number {
    for (let i = 0; i < layout.lines.length; i++) {
        const line = layout.lines[i];
        if (caret >= line.start && caret <= line.end) return i;
        // Check if caret is in the line separator between this line and the next
        if (i < layout.lines.length - 1) {
            const next = layout.lines[i + 1];
            if (caret > line.end && caret < next.start) return i;
        }
    }
    return layout.lines.length - 1;
}
```

---

## Module Decomposition

### New Modules

| Module | Responsibility |
|--------|---------------|
| `documentParagraphUpdater.ts` | `updateParagraph()` — incremental DOM update logic |
| `documentParagraphCaret.ts` | Caret navigation: `GetCaret`, `GetCaretBounds`, `IsValidCaret`, `GetNearestCaretFromTextPos` |
| `documentParagraphHitTest.ts` | `GetInlineObjectFromPoint` — point-to-run hit testing |

### Modified Modules

| Module | Changes |
|--------|---------|
| `GacUIRendererImpl.ts` | Implement all `RequestDocumentParagraph_*` and `RequestRendererUpdateElement_DocumentParagraph` methods |
| `elementMeasurer.ts` | Add deferred paragraph measurement queue (`_pendingParagraphMeasurements`) |
| `elementStyles_DocumentParagraph.ts` | Export `updateParagraph()`, improve `buildBlocksForLine()` for reuse |

### Existing Reusable Code

| Function | Reuse |
|----------|-------|
| `initializeParagraph()` | First-call full document construction (already works) |
| `fillParagraphMeasurements()` | Measurement after layout (already called by `applyBounds()`) |
| `renderParagraphMeasurements()` | Debug overlay (already works) |
| `setCaretVisible()` / `isCaretVisible()` | Caret show/hide (already works) |
| `buildBlocksForLine()` | Block construction per line (reuse for incremental per-line updates) |
| `getCollapsedCaretRect()` | Pixel measurement of caret positions |

---

## Test Strategy

### Unit Tests (vitest, no DOM)

These test pure logic that doesn't need a real browser DOM.

**1. Caret Navigation Tests (`test/TestDocumentParagraphCaret.ts`)**

```
- CaretFirst returns 0
- CaretLast returns text.length
- CaretMoveLeft from position 0 stays at 0
- CaretMoveRight from end stays at end
- CaretMoveLeft skips inline object as one unit
- CaretMoveRight skips inline object as one unit
- CaretMoveLeft across line boundary
- CaretMoveRight across line boundary
- CaretLineFirst at start of line
- CaretLineLast at end of line (before line break)
- CaretMoveUp from first line stays on first line
- CaretMoveDown from last line stays on last line
- IsValidCaret for positions at unit boundaries
- IsValidCaret for positions inside multi-code-point units
- GetNearestCaretFromTextPos snaps to nearest valid position
```

These tests create `ParagraphEditUnit[]` arrays directly (no DOM needed) and test
the navigation functions.

**2. Incremental Update Logic Tests (`test/TestDocumentParagraphUpdate.ts`)**

```
- isStyleOnlyChange returns true for color-only changes
- isStyleOnlyChange returns false when run boundaries change
- isStyleOnlyChange returns false when run types change
- Run diff detects no changes when runs are identical
- Run diff identifies changed properties
```

Again, pure data structure comparisons — no DOM needed.

**3. Hit Test Logic Tests (`test/TestDocumentParagraphHitTest.ts`)**

```
- Point inside inline object returns the correct DocumentRun
- Point outside all inline objects returns null
- Point on inline object boundary (edge case)
```

Uses mock `ParagraphEditUnit[]` and `ParagraphLayout`.

### Integration Tests (vitest with jsdom or browser)

If jsdom is insufficient for `Range.getClientRects()` (likely — jsdom doesn't implement
layout), these tests would need Playwright or a browser environment.

**4. Paragraph DOM Construction Tests**

```
- initializeParagraph creates correct line divs for single-line text
- initializeParagraph creates correct line divs for multi-line text
- initializeParagraph handles inline objects
- updateParagraph updates span styles without restructuring for color changes
- updateParagraph rebuilds line when run boundaries change
```

### Snapshot Rendering Tests (manual or Playwright)

**5. Snapshot Verification**

Using the existing `snapshots.html` infrastructure:
- Navigate to document editor snapshots (InlineObject, InlineObjectWithCaret, RichText).
- Verify that `initializeParagraph` runs without errors.
- Verify visual appearance matches expectations.
- Verify caret rendering in `InlineObjectWithCaret` snapshots.

### End-to-End Tests (Playwright + C++ server)

**6. Live Protocol Tests**

See `doc/Testing_Protocol.md` for how to set up the C++ test server.

```
- Open index.html, navigate to the Control → Document Editor tab
- Type text and verify it appears
- Select text by dragging and verify selection highlighting updates
- Move caret with arrow keys and verify caret position
- Undo/redo and verify document state
- Test inline objects in the document editor
```

### Test Data Factories

Create reusable test data builders:

```typescript
function createTestParagraphDesc(overrides?: Partial<ElementDesc_DocumentParagraph>): ElementDesc_DocumentParagraph {
    return {
        id: 1,
        text: 'Hello World',
        wrapLine: false,
        maxWidth: 0,
        alignment: ElementHorizontalAlignment.Left,
        runsDiff: null,
        createdInlineObjects: null,
        removedInlineObjects: null,
        ...overrides
    };
}

function createTestTextRun(begin: number, end: number, overrides?: Partial<DocumentTextRunProperty>): DocumentRun {
    return {
        caretBegin: begin,
        caretEnd: end,
        props: ['DocumentTextRunProperty', {
            textColor: '#000000',
            backgroundColor: '#00000000',
            fontProperties: { fontFamily: 'Arial', size: 12, bold: false, italic: false, underline: false, strikeline: false, antialias: false, verticalAntialias: false },
            ...overrides
        }]
    };
}

function createTestEditUnits(ranges: [number, number][]): ParagraphEditUnit[] {
    let x = 0;
    return ranges.map(([start, end]) => {
        const width = (end - start) * 8; // 8px per char for testing
        const unit: ParagraphEditUnit = {
            start, end,
            frontCaretBaseline: { x, y: 16 },
            backCaretBaseline: { x: x + width, y: 16 },
            caretHeight: 16
        };
        x += width;
        return unit;
    });
}
```

---

## Implementation Phases

### Phase 1: Core Update and Response

1. Implement `RequestRendererUpdateElement_DocumentParagraph`:
   - Handle first call (text ≠ null): build `ElementDesc_DocumentParagraphFull`,
     call `_updateElement()`.
   - Handle subsequent calls (text === null): merge with existing desc, call
     `_updateElement()`.
   - Queue deferred measurement.

2. Add deferred paragraph measurement to `ElementHTMLMeasurer`:
   - Add `requestParagraphMeasurement(responseId, elementId)`.
   - After `fixBounds()`, flush measurements and respond.

3. Wire up the deferred measurement flush in `RequestRendererRenderDom` and
   `RequestRendererRenderDomDiff`.

### Phase 2: Incremental Updates

4. Implement `updateParagraph()` in `elementStyles_DocumentParagraph.ts`.
5. Modify `applyTypedStyle()` to detect existing `ParagraphLayout` and call
   `updateParagraph()` instead of `initializeParagraph()` on subsequent updates.
6. Add style-only fast path for selection changes.

### Phase 3: Caret Operations

7. Implement `RequestDocumentParagraph_OpenCaret` and `CloseCaret`.
8. Implement `RequestDocumentParagraph_GetCaret` (all navigation directions).
9. Implement `RequestDocumentParagraph_GetCaretBounds`.
10. Implement `RequestDocumentParagraph_IsValidCaret`.
11. Implement `RequestDocumentParagraph_GetNearestCaretFromTextPos`.

### Phase 4: Hit Testing

12. Implement `RequestDocumentParagraph_GetInlineObjectFromPoint`.

### Phase 5: Testing

13. Write unit tests for caret navigation.
14. Write unit tests for incremental update logic.
15. Write Playwright tests for live protocol testing.
16. Verify snapshot rendering with InlineObjectWithCaret.

---

## Open Questions

1. **Multi-paragraph coordination**: Does the core ever send inline objects that span
   multiple paragraphs? (Answer: No — each paragraph is independent.)

2. **Caret blinking**: Should we implement a CSS animation or a JS timer for the
   blinking caret? The existing `setCaretVisible()` just shows/hides the caret div.
   The core may handle blinking by sending `OpenCaret`/`CloseCaret` periodically.

3. **Measurement accuracy**: `Range.getClientRects()` may return fractional pixel values.
   The C++ unit test client uses integer coordinates. We should round consistently using
   `Math.round()` (which `fillParagraphMeasurements` already does).

4. **Performance threshold**: At what paragraph size does incremental update become
   noticeably faster than full rebuild? Need profiling to determine if the fast path is
   worthwhile for short paragraphs (< 100 characters).
