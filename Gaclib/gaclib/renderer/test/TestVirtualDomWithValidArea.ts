import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../src/GacUIElementManager';
import { createVirtualDomFromRenderingDom, ElementMap, ClippedVirtualDomId } from '../src/virtualDom';
import { VirtualDomProviderMock } from './virtualDomMock';
import { createRootRenderingDom, createRenderingDomContent, createSimpleRenderingDomContent, createChildRenderingDom } from './TestVirtualDom';
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
    
    const child = result.screen.children[0];
    assert.strictEqual(child.id, 1);
    assert.deepEqual(child.globalBounds, { x1: 10, y1: 10, x2: 100, y2: 100 });
    assert.strictEqual(child.hitTestResult, SCHEMA.WindowHitTestResult.Client);
    assert.strictEqual(child.cursor, SCHEMA.WindowSystemCursorType.Arrow);
    assert.deepEqual(child.typedDesc, focusRectangleDesc);
    assert.strictEqual(child.children.length, 0);

    // Should be in doms map
    assert.strictEqual(result.doms.get(1), child);
    assert.strictEqual(result.elementToDoms.get(101), child);
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
    
    const outerChild = result.screen.children[0];
    
    // Outer DOM should have the original ID and reflect validArea
    assert.strictEqual(outerChild.id, 1);
    assert.deepEqual(outerChild.globalBounds, { x1: 20, y1: 20, x2: 90, y2: 90 }); // validArea
    assert.isUndefined(outerChild.hitTestResult); // Simple DOM has no properties
    assert.isUndefined(outerChild.cursor);
    assert.isUndefined(outerChild.typedDesc);
    assert.strictEqual(outerChild.children.length, 1); // Should have one child

    // Inner DOM should have ClippedVirtualDomId and reflect original bounds
    const innerChild = outerChild.children[0];
    assert.strictEqual(innerChild.id, ClippedVirtualDomId);
    assert.deepEqual(innerChild.globalBounds, { x1: 10, y1: 10, x2: 100, y2: 100 }); // original bounds
    assert.strictEqual(innerChild.hitTestResult, SCHEMA.WindowHitTestResult.Client);
    assert.strictEqual(innerChild.cursor, SCHEMA.WindowSystemCursorType.Arrow);
    assert.deepEqual(innerChild.typedDesc, focusRectangleDesc);
    assert.strictEqual(innerChild.children.length, 0);

    // Outer DOM should be in doms map (with original ID)
    assert.strictEqual(result.doms.get(1), outerChild);
    // Inner DOM should NOT be in doms map (negative ID)
    assert.isUndefined(result.doms.get(ClippedVirtualDomId));
    // Element should map to inner DOM (the one with the actual content)
    assert.strictEqual(result.elementToDoms.get(101), innerChild);
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
    
    const outerChild1 = result.screen.children[0];
    const outerChild2 = result.screen.children[1];
    
    // Both outer DOMs should have their original IDs
    assert.strictEqual(outerChild1.id, 1);
    assert.strictEqual(outerChild2.id, 2);
    
    // Both should have exactly one child
    assert.strictEqual(outerChild1.children.length, 1);
    assert.strictEqual(outerChild2.children.length, 1);

    // Both inner DOMs should have ClippedVirtualDomId
    const innerChild1 = outerChild1.children[0];
    const innerChild2 = outerChild2.children[0];
    assert.strictEqual(innerChild1.id, ClippedVirtualDomId);
    assert.strictEqual(innerChild2.id, ClippedVirtualDomId);

    // Verify properties are correctly mapped
    assert.strictEqual(innerChild1.hitTestResult, SCHEMA.WindowHitTestResult.Client);
    assert.isUndefined(innerChild1.cursor);
    assert.deepEqual(innerChild1.typedDesc, focusRectangleDesc);
    
    assert.isUndefined(innerChild2.hitTestResult);
    assert.strictEqual(innerChild2.cursor, SCHEMA.WindowSystemCursorType.Hand);
    assert.deepEqual(innerChild2.typedDesc, rawDesc);

    // Both outer DOMs should be in doms map
    assert.strictEqual(result.doms.get(1), outerChild1);
    assert.strictEqual(result.doms.get(2), outerChild2);
    // No ClippedVirtualDomId in doms map
    assert.isUndefined(result.doms.get(ClippedVirtualDomId));
    
    // Elements should map to inner DOMs
    assert.strictEqual(result.elementToDoms.get(101), innerChild1);
    assert.strictEqual(result.elementToDoms.get(102), innerChild2);
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
    
    const outerChild = result.screen.children[0];
    assert.strictEqual(outerChild.id, 1);
    assert.strictEqual(outerChild.children.length, 1);

    // Inner DOM should have the child elements
    const innerChild = outerChild.children[0];
    assert.strictEqual(innerChild.id, ClippedVirtualDomId);
    assert.strictEqual(innerChild.children.length, 1);

    // Verify the grandchild
    const grandChild = innerChild.children[0];
    assert.strictEqual(grandChild.id, 3);
    assert.deepEqual(grandChild.globalBounds, { x1: 30, y1: 30, x2: 80, y2: 80 });
    assert.strictEqual(grandChild.children.length, 0);

    // Verify mappings
    assert.strictEqual(result.doms.get(1), outerChild);
    assert.strictEqual(result.doms.get(3), grandChild);
    assert.strictEqual(result.elementToDoms.get(101), innerChild);
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
    const outerParent = result.screen.children[0]; // ID 1, clipped
    assert.strictEqual(outerParent.id, 1);
    assert.strictEqual(outerParent.children.length, 1);

    const innerParent = outerParent.children[0]; // ID ClippedVirtualDomId, parent content
    assert.strictEqual(innerParent.id, ClippedVirtualDomId);
    assert.strictEqual(innerParent.children.length, 1);

    const outerChild = innerParent.children[0]; // ID 2, clipped
    assert.strictEqual(outerChild.id, 2);
    assert.strictEqual(outerChild.children.length, 1);

    const innerChild = outerChild.children[0]; // ID ClippedVirtualDomId, child content
    assert.strictEqual(innerChild.id, ClippedVirtualDomId);
    assert.strictEqual(innerChild.children.length, 0);

    // Verify bounds
    assert.deepEqual(outerParent.globalBounds, { x1: 10, y1: 10, x2: 90, y2: 90 });
    assert.deepEqual(innerParent.globalBounds, { x1: 0, y1: 0, x2: 100, y2: 100 });
    assert.deepEqual(outerChild.globalBounds, { x1: 30, y1: 30, x2: 70, y2: 70 });
    assert.deepEqual(innerChild.globalBounds, { x1: 20, y1: 20, x2: 80, y2: 80 });

    // Verify mappings
    assert.strictEqual(result.doms.get(1), outerParent);
    assert.strictEqual(result.doms.get(2), outerChild);
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
    const outerParent = result.screen.children[0]; // ID 1, clipped
    assert.strictEqual(outerParent.id, 1);
    assert.deepEqual(outerParent.globalBounds, { x1: 20, y1: 20, x2: 90, y2: 90 }); // a.validArea
    assert.strictEqual(outerParent.children.length, 1);

    const innerParent = outerParent.children[0]; // ID ClippedVirtualDomId, a content
    assert.strictEqual(innerParent.id, ClippedVirtualDomId);
    assert.deepEqual(innerParent.globalBounds, { x1: 10, y1: 10, x2: 100, y2: 100 }); // a.bounds
    assert.strictEqual(innerParent.children.length, 1);

    // Child b should NOT be clipped because b.validArea == intersection(b.bounds, a.validArea)
    const child = innerParent.children[0]; // ID 2, not clipped
    assert.strictEqual(child.id, 2);
    assert.deepEqual(child.globalBounds, { x1: 30, y1: 30, x2: 120, y2: 120 }); // b.bounds
    assert.strictEqual(child.children.length, 0);

    // Verify mappings
    assert.strictEqual(result.doms.get(1), outerParent);
    assert.strictEqual(result.doms.get(2), child);
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
    const outerParent = result.screen.children[0]; // ID 1, clipped
    assert.strictEqual(outerParent.id, 1);
    assert.deepEqual(outerParent.globalBounds, { x1: 20, y1: 20, x2: 180, y2: 180 }); // a.validArea
    assert.strictEqual(outerParent.children.length, 1);

    const innerParent = outerParent.children[0]; // ID ClippedVirtualDomId, a content
    assert.strictEqual(innerParent.id, ClippedVirtualDomId);
    assert.deepEqual(innerParent.globalBounds, { x1: 0, y1: 0, x2: 200, y2: 200 }); // a.bounds
    assert.strictEqual(innerParent.children.length, 4);

    // All children should NOT be clipped because their validArea == intersection(bounds, a.validArea)
    const child1 = innerParent.children[0]; // ID 2
    assert.strictEqual(child1.id, 2);
    assert.deepEqual(child1.globalBounds, { x1: 10, y1: 10, x2: 50, y2: 50 });
    assert.strictEqual(child1.children.length, 0);

    const child2 = innerParent.children[1]; // ID 3
    assert.strictEqual(child2.id, 3);
    assert.deepEqual(child2.globalBounds, { x1: 150, y1: 10, x2: 190, y2: 50 });
    assert.strictEqual(child2.children.length, 0);

    const child3 = innerParent.children[2]; // ID 4
    assert.strictEqual(child3.id, 4);
    assert.deepEqual(child3.globalBounds, { x1: 10, y1: 150, x2: 50, y2: 190 });
    assert.strictEqual(child3.children.length, 0);

    const child4 = innerParent.children[3]; // ID 5
    assert.strictEqual(child4.id, 5);
    assert.deepEqual(child4.globalBounds, { x1: 150, y1: 150, x2: 190, y2: 190 });
    assert.strictEqual(child4.children.length, 0);

    // Verify mappings
    assert.strictEqual(result.doms.get(1), outerParent);
    assert.strictEqual(result.doms.get(2), child1);
    assert.strictEqual(result.doms.get(3), child2);
    assert.strictEqual(result.doms.get(4), child3);
    assert.strictEqual(result.doms.get(5), child4);
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
    const outerA = result.screen.children[0]; // ID 1, clipped
    assert.strictEqual(outerA.id, 1);
    assert.deepEqual(outerA.globalBounds, { x1: 20, y1: 20, x2: 180, y2: 100 }); // a.validArea
    assert.strictEqual(outerA.children.length, 1);

    const innerA = outerA.children[0]; // ID ClippedVirtualDomId, a content
    assert.strictEqual(innerA.id, ClippedVirtualDomId);
    assert.deepEqual(innerA.globalBounds, { x1: 10, y1: 10, x2: 200, y2: 100 }); // a.bounds
    assert.strictEqual(innerA.children.length, 1);

    // b should NOT be clipped because b.validArea == intersection(b.bounds, a.validArea)
    const nodeB = innerA.children[0]; // ID 2, not clipped
    assert.strictEqual(nodeB.id, 2);
    assert.deepEqual(nodeB.globalBounds, { x1: 120, y1: 30, x2: 190, y2: 120 }); // b.bounds
    assert.strictEqual(nodeB.children.length, 1);

    // c should NOT be clipped because c.validArea == intersection(c.bounds, b.validArea)
    const nodeC = nodeB.children[0]; // ID 3, not clipped
    assert.strictEqual(nodeC.id, 3);
    assert.deepEqual(nodeC.globalBounds, { x1: 100, y1: 80, x2: 150, y2: 130 }); // c.bounds
    assert.strictEqual(nodeC.children.length, 0);

    // Verify mappings
    assert.strictEqual(result.doms.get(1), outerA);
    assert.strictEqual(result.doms.get(2), nodeB);
    assert.strictEqual(result.doms.get(3), nodeC);
    assert.isUndefined(result.doms.get(ClippedVirtualDomId));
});
