# Testing with Snapshots

## Overview

The snapshot viewer at `/snapshots.html` is a pure TypeScript-implemented page,
in the `@gaclib-website/entry` package. It renders GacUI unit test traces previously and stored as JSON files.
Each snapshot is a recorded sequence of rendering frames that can be replayed
in the browser without running the server.

## Snapshot File Structure

Snapshots live under `Gaclib/website/entry/assets/snapshots/` organized by category:

```
snapshots/
├── Controls/
│   ├── Basic/
│   ├── Editor/
│   │   └── Features/
│   │       ├── InlineObject.json
│   │       ├── InlineObject/
│   │       │   ├── frame_0.json
│   │       │   ├── frame_1.json
│   │       │   └── ...
│   │       ├── InlineObjectWithCaret.json
│   │       ├── InlineObjectWithCaret/
│   │       │   ├── frame_0.json
│   │       │   └── ...
│   │       └── RichText/
│   ├── List/
│   ├── Ribbon/
│   └── Toolstrip/
├── Application/
├── DomRecovery/
├── HelloWorld.json
├── HelloWorld/
└── UnitTestFramework/
```

Each snapshot has:
- **Top-level JSON** (e.g., `InlineObjectWithCaret.json`): Contains `createdElements`, `imageCreations`, `imageMetadatas`, and a `frames` array. The `frames` array holds frame metadata (not the full frame data).
- **Frame folder** (e.g., `InlineObjectWithCaret/`): Contains `frame_0.json`, `frame_1.json`, etc. — one file per frame with the full rendering data (`elements`, `root`, `windowSize`).

### Top-Level JSON Properties

| Property | Description |
|---|---|
| `createdElements` | Array of `[id, rendererType]` pairs for all elements used across frames |
| `imageCreations` | Image resource definitions referenced by elements |
| `imageMetadatas` | Image metadata (dimensions, format) |
| `frames` | Array of frame stubs with `frameId` and `frameName` (full data in separate files) |

### Frame JSON Properties

| Property | Description |
|---|---|
| `frameId` | Numeric ID of the frame |
| `frameName` | Human-readable name (e.g., "Ready", "Move right over first inline") |
| `elements` | Map of element ID → element descriptor with type-specific properties |
| `root` | The rendering DOM tree structure for this frame |
| `windowSize` | Window bounds (`x1`, `y1`, `x2`, `y2`) |

## Navigating the Snapshot Viewer

1. Run `yarn build` from `Gaclib`.
2. Run `npm run start` from `Gaclib/website/entry`; it serves the website until
   ENTER is pressed.
3. Open `http://localhost:8896/snapshots.html` in a browser.
4. The left panel shows a **Files Tree View** — expand folders to find the snapshot JSON file.
5. Click a `.json` file. The middle panel (**Frame List**) populates with frames named as `{frameId}: {frameName}`.
6. Click a frame entry. The right panel (**GacUI Rendering**) renders the frame into the `#gacuiScreen` div.
7. Splitters between panels are draggable.

## Inspecting Rendered Elements

After a frame renders, use browser DevTools to inspect the `#gacuiScreen` element.

### Key DOM Properties

Elements rendered by the virtual DOM carry custom properties accessible via DevTools console:

| Property | Description |
|---|---|
| `element['$GacUI-ExtraBorder']` | The extra border `<div>` used for paragraph text content |
| `element['$GacUI-ParagraphLayout']` | The `ParagraphLayout` object with parsed paragraph structure |

### ParagraphLayout Object

When a `DocumentParagraph` element is rendered, its `$GacUI-ParagraphLayout` contains:

| Field | Type | Description |
|---|---|---|
| `paragraph` | `DocumentParagraph` | The source paragraph descriptor (text, runs, etc.) |
| `caret` | `number` | Caret position (-1 if none) |
| `lines` | `ParagraphLine[]` | Parsed lines with blocks and the line `<div>` element |
| `defaultFontSize` | `number` | Default font size for the paragraph |
| `units` | `ParagraphEditUnit[]` | Measured edit units with caret positions |
| `inlineObjectBounds` | `Map` | Bounds for inline objects keyed by element ID |

### ParagraphEditUnit

Each unit in `units` represents a measurable segment (character cluster, inline object, or line separator):

| Field | Description |
|---|---|
| `start` / `end` | Character offsets in the paragraph text |
| `frontCaretBaseline` | `{x, y}` — front edge caret position relative to the paragraph div |
| `backCaretBaseline` | `{x, y}` — back edge caret position relative to the paragraph div |
| `caretHeight` | Height of the caret at this unit |

## Automated Inspection with Playwright

Playwright can automate navigating to a snapshot frame and extracting measurement data.

### Example Script

```javascript
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:8896/snapshots.html');
await page.waitForLoadState('networkidle');

// Navigate the tree: expand folders, then click a snapshot file
await page.locator('.tree-folder:has-text("Controls")').first().click();
await page.locator('.tree-folder:has-text("Editor")').first().click();
await page.locator('.tree-folder:has-text("Features")').first().click();
await page.locator('.tree-file:has-text("InlineObjectWithCaret.json")').first().click();

// Wait for frames to appear, then select one
await page.waitForSelector('#frameList .tree-file');
await page.locator('.tree-file:has-text("4: Ready")').first().click();
await page.waitForTimeout(1000);

// Extract paragraph layouts from the rendered DOM
const result = await page.evaluate(() => {
    const screen = document.getElementById('gacuiScreen');
    const allDivs = screen.querySelectorAll('div');
    const paragraphs = [];

    for (const div of allDivs) {
        const layout = div['$GacUI-ParagraphLayout'];
        if (!layout) continue;

        paragraphs.push({
            text: layout.paragraph.text,
            unitsCount: layout.units.length,
            units: layout.units.map(u => ({
                start: u.start,
                end: u.end,
                frontX: u.frontCaretBaseline.x,
                frontY: u.frontCaretBaseline.y,
                backX: u.backCaretBaseline.x,
                backY: u.backCaretBaseline.y,
                caretHeight: u.caretHeight
            }))
        });
    }
    return paragraphs;
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
```

### Running

```powershell
cd Gaclib
node test-snapshot.mjs
```

Playwright is installed as a dev dependency (`@playwright/test`) in the Gaclib workspace.

### Tree View CSS Selectors

| Selector | Description |
|---|---|
| `.tree-folder:has-text("Name")` | A folder node in the tree view |
| `.tree-file:has-text("Name")` | A file/leaf node in the tree view |
| `#filesTreeView` | The snapshot files tree container |
| `#frameList` | The frames list container |
| `#gacuiScreen` | The rendering target div |
