import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../src/GacUIElementManager';
import { createVirtualDomFromRenderingDom, ElementMap, ClippedVirtualDomId } from '../src/virtualDom';
import { VirtualDomProviderMock } from './virtualDomMock';
import { createRootRenderingDom, createRenderingDomContent, createSimpleRenderingDomContent, createChildRenderingDom, assertDomAttributes } from './TestVirtualDom';
import { test, assert } from 'vitest';

test('createVirtualDomFromRenderingDom - validArea equals bounds (no clipping)', () => {
    // +--+
    // |1 |
    // |  |
    // +--+
    
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const elements: ElementMap = new Map();
    elements.set(101, focusRectangleDesc);
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                SCHEMA.WindowHitTestResult.Client,
                SCHEMA.WindowSystemCursorType.Arrow,
                101,
                { x1: 10, y1: 10, x2: 100, y2: 100 } // validArea same as bounds
            )
        )
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Should have exactly one child
    assert.strictEqual(result.screen.children.length, 1);
    
    const dom1 = result.screen.children[0];
    assertDomAttributes(rootDom.children[0]!, elements, dom1);
    assert.strictEqual(dom1.children.length, 0);

    // Should be in doms map
    assert.strictEqual(result.doms.get(1), dom1);
    assert.strictEqual(result.elementToDoms.get(101), dom1);
});

test('createVirtualDomFromRenderingDom - validArea smaller than bounds (clipping)', () => {
    // +-------+
    // |1      |
    // | +---+ |
    // | |1v | |
    // | |   | |
    // | +---+ |
    // +-------+
    
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const elements: ElementMap = new Map();
    elements.set(101, focusRectangleDesc);
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                SCHEMA.WindowHitTestResult.Client,
                SCHEMA.WindowSystemCursorType.Arrow,
                101,
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            )
        )
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Should have exactly one child (the outer clipped DOM)
    assert.strictEqual(result.screen.children.length, 1);
    
    const dom1 = result.screen.children[0];
    const dom1v = dom1.children[0];
    
    assertDomAttributes(rootDom.children[0]!, elements, dom1, dom1v);
    assert.strictEqual(dom1.children.length, 1); // Should have one child
    assert.strictEqual(dom1v.children.length, 0);

    // Outer DOM should be in doms map (with original ID)
    assert.strictEqual(result.doms.get(1), dom1);
    // Inner DOM should NOT be in doms map (negative ID)
    assert.isUndefined(result.doms.get(ClippedVirtualDomId));
    // Element should map to inner DOM (the one with the actual content)
    assert.strictEqual(result.elementToDoms.get(101), dom1v);
});

test('createVirtualDomFromRenderingDom - multiple clipped elements with same ClippedVirtualDomId', () => {
    // +-------+  +-------+
    // |1      |  |2      |
    // | +---+ |  | +---+ |
    // | |1v | |  | |2v | |
    // | |   | |  | |   | |
    // | +---+ |  | +---+ |
    // +-------+  +-------+
    
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const rawDesc: TypedElementDesc = { type: SCHEMA.RendererType.Raw };
    const elements: ElementMap = new Map();
    elements.set(101, focusRectangleDesc);
    elements.set(102, rawDesc);
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                SCHEMA.WindowHitTestResult.Client,
                null,
                101,
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            )
        ),
        createChildRenderingDom(
            2,
            createRenderingDomContent(
                { x1: 200, y1: 10, x2: 300, y2: 100 }, // bounds
                null,
                SCHEMA.WindowSystemCursorType.Hand,
                102,
                { x1: 210, y1: 20, x2: 290, y2: 90 }  // validArea smaller than bounds
            )
        )
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Should have exactly two children (both outer clipped DOMs)
    assert.strictEqual(result.screen.children.length, 2);
    
    const dom1 = result.screen.children[0];
    const dom2 = result.screen.children[1];
    const dom1v = dom1.children[0];
    const dom2v = dom2.children[0];
    
    assertDomAttributes(rootDom.children[0]!, elements, dom1, dom1v);
    assertDomAttributes(rootDom.children[1]!, elements, dom2, dom2v);
    
    // Both should have exactly one child
    assert.strictEqual(dom1.children.length, 1);
    assert.strictEqual(dom2.children.length, 1);

    // Both outer DOMs should be in doms map
    assert.strictEqual(result.doms.get(1), dom1);
    assert.strictEqual(result.doms.get(2), dom2);
    // No ClippedVirtualDomId in doms map
    assert.isUndefined(result.doms.get(ClippedVirtualDomId));
    
    // Elements should map to inner DOMs
    assert.strictEqual(result.elementToDoms.get(101), dom1v);
    assert.strictEqual(result.elementToDoms.get(102), dom2v);
});

test('createVirtualDomFromRenderingDom - clipped element with children', () => {
    // +------------------+
    // |1                 |
    // |   +------------+ |
    // |   |1v          | |
    // |   |      +---+ | |
    // |   |      |1/3| | |
    // |   |      +---+ | |
    // |   +------------+ |
    // +------------------+
    
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const elements: ElementMap = new Map();
    elements.set(101, focusRectangleDesc);
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                SCHEMA.WindowHitTestResult.Client,
                null,
                101,
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    3,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 80, y2: 80 }, // bounds (inside parent bounds)
                        { x1: 30, y1: 30, x2: 80, y2: 80 }  // validArea same as bounds
                    )
                )
            ]
        )
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Should have exactly one child (the outer clipped DOM)
    assert.strictEqual(result.screen.children.length, 1);
    
    const dom1 = result.screen.children[0];
    const dom1v = dom1.children[0];
    
    assertDomAttributes(rootDom.children[0]!, elements, dom1, dom1v);
    assert.strictEqual(dom1.children.length, 1);
    assert.strictEqual(dom1v.children.length, 1);

    // Verify the grandchild
    const dom3 = dom1v.children[0];
    assertDomAttributes(rootDom.children[0]!.children![0]!, elements, dom3);
    assert.strictEqual(dom3.children.length, 0);

    // Verify mappings
    assert.strictEqual(result.doms.get(1), dom1);
    assert.strictEqual(result.doms.get(3), dom3);
    assert.strictEqual(result.elementToDoms.get(101), dom1v);
});

test('createVirtualDomFromRenderingDom - nested clipping', () => {
    // +---------------------+
    // |1                    |
    // |  +---------------+  |
    // |  |1v             |  |
    // |  |  +---------+  |  |
    // |  |  |1/2      |  |  |
    // |  |  | +-----+ |  |  |
    // |  |  | |1/2v | |  |  |
    // |  |  | +-----+ |  |  |
    // |  |  +---------+  |  |
    // |  +---------------+  |
    // +---------------------+
    
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 0, y1: 0, x2: 100, y2: 100 }, // bounds
                { x1: 10, y1: 10, x2: 90, y2: 90 }  // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 20, y1: 20, x2: 80, y2: 80 }, // bounds
                        { x1: 30, y1: 30, x2: 70, y2: 70 }  // validArea smaller than bounds
                    )
                )
            ]
        )
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Navigate the hierarchy
    const dom1 = result.screen.children[0]; // ID 1, clipped
    const dom1v = dom1.children[0]; // ID ClippedVirtualDomId, parent content
    const dom2 = dom1v.children[0]; // ID 2, clipped
    const dom2v = dom2.children[0]; // ID ClippedVirtualDomId, child content
    
    assertDomAttributes(rootDom.children[0]!, elements, dom1, dom1v);
    assertDomAttributes(rootDom.children[0]!.children![0]!, elements, dom2, dom2v);
    
    assert.strictEqual(dom1.children.length, 1);
    assert.strictEqual(dom1v.children.length, 1);
    assert.strictEqual(dom2.children.length, 1);
    assert.strictEqual(dom2v.children.length, 0);

    // Verify mappings
    assert.strictEqual(result.doms.get(1), dom1);
    assert.strictEqual(result.doms.get(2), dom2);
    assert.isUndefined(result.doms.get(ClippedVirtualDomId));
});

test('createVirtualDomFromRenderingDom - still throws for duplicate positive IDs', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 0, y1: 0, x2: 100, y2: 100 },
                { x1: 0, y1: 0, x2: 100, y2: 100 } // No clipping
            )
        ),
        createChildRenderingDom(
            1, // Duplicate positive ID - should still throw
            createSimpleRenderingDomContent(
                { x1: 200, y1: 0, x2: 300, y2: 100 },
                { x1: 200, y1: 0, x2: 300, y2: 100 } // No clipping
            )
        )
    ];

    assert.throws(() => {
        createVirtualDomFromRenderingDom(rootDom, elements, provider);
    }, 'Duplicate RenderingDom ID found: 1. Each RenderingDom must have a unique ID.');
});

test('createVirtualDomFromRenderingDom - parent clips child naturally', () => {
    // +-------------+
    // |1            |
    // | +---------+ |
    // | |1v       | |
    // | |  +------+-+-+
    // | |  |1/2   | | |
    // | |  |      | | |
    // | +--+------+ | |
    // +----+--------+ |
    //      +----------+

    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // a.bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // a.validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 120, y2: 120 }, // b.bounds (extends beyond a.validArea)
                        { x1: 30, y1: 30, x2: 90, y2: 90 }    // b.validArea = intersection(b.bounds, a.validArea)
                    )
                )
            ]
        )
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Navigate the hierarchy
    const dom1 = result.screen.children[0]; // ID 1, clipped
    const dom1v = dom1.children[0]; // ID ClippedVirtualDomId, a content
    const dom2 = dom1v.children[0]; // ID 2, not clipped
    
    assertDomAttributes(rootDom.children[0]!, elements, dom1, dom1v);
    assertDomAttributes(rootDom.children[0]!.children![0]!, elements, dom2);
    
    assert.strictEqual(dom1.children.length, 1);
    assert.strictEqual(dom1v.children.length, 1);
    assert.strictEqual(dom2.children.length, 0);

    // Verify mappings
    assert.strictEqual(result.doms.get(1), dom1);
    assert.strictEqual(result.doms.get(2), dom2);
    assert.isUndefined(result.doms.get(ClippedVirtualDomId));
});

test('createVirtualDomFromRenderingDom - four children in corners', () => {
    // +----------------+
    // |1               |
    // | +---+    +---+ |
    // | |+--+----+--+| |
    // | ||2 |1v  |3 || |
    // | ++--+    +--++ |
    // |  |          |  |
    // | ++--+    +--++ |
    // | ||4 |    |5 || |
    // | |+--+----+--+| |
    // | +---+    +---+ |
    // |                |
    // +----------------+

    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 0, y1: 0, x2: 200, y2: 200 }, // a.bounds
                { x1: 20, y1: 20, x2: 180, y2: 180 } // a.validArea smaller than bounds
            ),
            [
                // Top-left corner
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 10, y1: 10, x2: 50, y2: 50 }, // b.bounds
                        { x1: 20, y1: 20, x2: 50, y2: 50 }  // b.validArea = intersection(b.bounds, a.validArea)
                    )
                ),
                // Top-right corner
                createChildRenderingDom(
                    3,
                    createSimpleRenderingDomContent(
                        { x1: 150, y1: 10, x2: 190, y2: 50 }, // c.bounds
                        { x1: 150, y1: 20, x2: 180, y2: 50 }  // c.validArea = intersection(c.bounds, a.validArea)
                    )
                ),
                // Bottom-left corner
                createChildRenderingDom(
                    4,
                    createSimpleRenderingDomContent(
                        { x1: 10, y1: 150, x2: 50, y2: 190 }, // d.bounds
                        { x1: 20, y1: 150, x2: 50, y2: 180 }  // d.validArea = intersection(d.bounds, a.validArea)
                    )
                ),
                // Bottom-right corner
                createChildRenderingDom(
                    5,
                    createSimpleRenderingDomContent(
                        { x1: 150, y1: 150, x2: 190, y2: 190 }, // e.bounds
                        { x1: 150, y1: 150, x2: 180, y2: 180 }  // e.validArea = intersection(e.bounds, a.validArea)
                    )
                )
            ]
        )
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Navigate the hierarchy
    const dom1 = result.screen.children[0]; // ID 1, clipped
    const dom1v = dom1.children[0]; // ID ClippedVirtualDomId, a content
    
    assertDomAttributes(rootDom.children[0]!, elements, dom1, dom1v);
    assert.strictEqual(dom1.children.length, 1);
    assert.strictEqual(dom1v.children.length, 4);

    // All children should NOT be clipped because their validArea == intersection(bounds, a.validArea)
    const dom2 = dom1v.children[0]; // ID 2
    const dom3 = dom1v.children[1]; // ID 3
    const dom4 = dom1v.children[2]; // ID 4
    const dom5 = dom1v.children[3]; // ID 5
    
    assertDomAttributes(rootDom.children[0]!.children![0]!, elements, dom2);
    assertDomAttributes(rootDom.children[0]!.children![1]!, elements, dom3);
    assertDomAttributes(rootDom.children[0]!.children![2]!, elements, dom4);
    assertDomAttributes(rootDom.children[0]!.children![3]!, elements, dom5);
    
    assert.strictEqual(dom2.children.length, 0);
    assert.strictEqual(dom3.children.length, 0);
    assert.strictEqual(dom4.children.length, 0);
    assert.strictEqual(dom5.children.length, 0);

    // Verify mappings
    assert.strictEqual(result.doms.get(1), dom1);
    assert.strictEqual(result.doms.get(2), dom2);
    assert.strictEqual(result.doms.get(3), dom3);
    assert.strictEqual(result.doms.get(4), dom4);
    assert.strictEqual(result.doms.get(5), dom5);
    assert.isUndefined(result.doms.get(ClippedVirtualDomId));
});

test('createVirtualDomFromRenderingDom - three nested elements with same y2', () => {
    // +--------------+
    // |1             |
    // | +----------+ |
    // | |1v        | |
    // | |    +-----++|
    // | |    |2    |||
    // | |  +-+---+ |||
    // | |  |3|   | |||
    // +-+--+-----+-+++
    //      | +---+--+
    //      +-----+
    
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 200, y2: 100 }, // a.bounds
                { x1: 20, y1: 20, x2: 180, y2: 100 }  // a.validArea (same y2)
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 120, y1: 30, x2: 190, y2: 120 }, // b.bounds (at a's bottom right)
                        { x1: 120, y1: 30, x2: 180, y2: 100 }  // b.validArea = intersection(b.bounds, a.validArea)
                    ),
                    [
                        createChildRenderingDom(
                            3,
                            createSimpleRenderingDomContent(
                                { x1: 100, y1: 80, x2: 150, y2: 130 }, // c.bounds (at b's bottom left)
                                { x1: 120, y1: 80, x2: 150, y2: 100 }  // c.validArea = intersection(c.bounds, b.validArea)
                            )
                        )
                    ]
                )
            ]
        )
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Navigate the hierarchy
    const dom1 = result.screen.children[0]; // ID 1, clipped
    const dom1v = dom1.children[0]; // ID ClippedVirtualDomId, a content
    const dom2 = dom1v.children[0]; // ID 2, not clipped
    const dom3 = dom2.children[0]; // ID 3, not clipped
    
    assertDomAttributes(rootDom.children[0]!, elements, dom1, dom1v);
    assertDomAttributes(rootDom.children[0]!.children![0]!, elements, dom2);
    assertDomAttributes(rootDom.children[0]!.children![0]!.children![0]!, elements, dom3);
    
    assert.strictEqual(dom1.children.length, 1);
    assert.strictEqual(dom1v.children.length, 1);
    assert.strictEqual(dom2.children.length, 1);
    assert.strictEqual(dom3.children.length, 0);

    // Verify mappings
    assert.strictEqual(result.doms.get(1), dom1);
    assert.strictEqual(result.doms.get(2), dom2);
    assert.strictEqual(result.doms.get(3), dom3);
    assert.isUndefined(result.doms.get(ClippedVirtualDomId));
});
