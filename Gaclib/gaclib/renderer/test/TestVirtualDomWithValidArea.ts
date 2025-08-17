import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../src/GacUIElementManager';
import { createVirtualDomFromRenderingDom, ElementMap, RootVirtualDomId, ClippedVirtualDomId } from '../src/virtualDom';
import { VirtualDomProviderMock } from './virtualDomMock';
import { test, expect, assert } from 'vitest';

// Helper function to create a valid root RenderingDom with zero bounds
function createRootRenderingDom(): SCHEMA.RenderingDom {
    return {
        id: RootVirtualDomId,
        content: {
            hitTestResult: null,
            cursor: null,
            element: null,
            bounds: { x1: 0, y1: 0, x2: 0, y2: 0 },
            validArea: { x1: 0, y1: 0, x2: 0, y2: 0 }
        },
        children: null
    };
}

// Helper function to create RenderingDomContent with different validArea and bounds
function createRenderingDomContentWithValidArea(
    bounds: SCHEMA.Rect,
    validArea: SCHEMA.Rect,
    hitTestResult: SCHEMA.WindowHitTestResult | null = null,
    cursor: SCHEMA.WindowSystemCursorType | null = null,
    element: SCHEMA.TYPES.Integer | null = null
): SCHEMA.RenderingDomContent {
    return {
        hitTestResult,
        cursor,
        element,
        bounds,
        validArea
    };
}

// Helper function to create a child RenderingDom
function createChildRenderingDom(
    id: SCHEMA.TYPES.Integer,
    content: SCHEMA.RenderingDomContent,
    children: SCHEMA.RenderingDom[] | null = null
): SCHEMA.RenderingDom {
    return {
        id,
        content,
        children
    };
}

test('createVirtualDomFromRenderingDom - validArea equals bounds (no clipping)', () => {
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const elements: ElementMap = new Map();
    elements.set(101, focusRectangleDesc);
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContentWithValidArea(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // validArea same as bounds
                SCHEMA.WindowHitTestResult.Client,
                SCHEMA.WindowSystemCursorType.Arrow,
                101
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
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const elements: ElementMap = new Map();
    elements.set(101, focusRectangleDesc);
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContentWithValidArea(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 },   // validArea smaller than bounds
                SCHEMA.WindowHitTestResult.Client,
                SCHEMA.WindowSystemCursorType.Arrow,
                101
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
            createRenderingDomContentWithValidArea(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 },   // validArea smaller than bounds
                SCHEMA.WindowHitTestResult.Client,
                null,
                101
            )
        ),
        createChildRenderingDom(
            2,
            createRenderingDomContentWithValidArea(
                { x1: 200, y1: 10, x2: 300, y2: 100 }, // bounds
                { x1: 210, y1: 20, x2: 290, y2: 90 },  // validArea smaller than bounds
                null,
                SCHEMA.WindowSystemCursorType.Hand,
                102
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
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const elements: ElementMap = new Map();
    elements.set(101, focusRectangleDesc);
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContentWithValidArea(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 },   // validArea smaller than bounds
                SCHEMA.WindowHitTestResult.Client,
                null,
                101
            ),
            [
                createChildRenderingDom(
                    3,
                    createRenderingDomContentWithValidArea(
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
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContentWithValidArea(
                { x1: 0, y1: 0, x2: 100, y2: 100 }, // bounds
                { x1: 10, y1: 10, x2: 90, y2: 90 }  // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createRenderingDomContentWithValidArea(
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

test('createVirtualDomFromRenderingDom - no duplicate ID error for ClippedVirtualDomId', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContentWithValidArea(
                { x1: 0, y1: 0, x2: 100, y2: 100 },
                { x1: 10, y1: 10, x2: 90, y2: 90 }
            )
        ),
        createChildRenderingDom(
            2,
            createRenderingDomContentWithValidArea(
                { x1: 200, y1: 0, x2: 300, y2: 100 },
                { x1: 210, y1: 10, x2: 290, y2: 90 }
            )
        )
    ];

    // This should not throw an error even though both children will create
    // inner virtual DOMs with ClippedVirtualDomId
    expect(() => {
        createVirtualDomFromRenderingDom(rootDom, elements, provider);
    }).not.toThrow();
});

test('createVirtualDomFromRenderingDom - still throws for duplicate positive IDs', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            1,
            createRenderingDomContentWithValidArea(
                { x1: 0, y1: 0, x2: 100, y2: 100 },
                { x1: 0, y1: 0, x2: 100, y2: 100 } // No clipping
            )
        ),
        createChildRenderingDom(
            1, // Duplicate positive ID - should still throw
            createRenderingDomContentWithValidArea(
                { x1: 200, y1: 0, x2: 300, y2: 100 },
                { x1: 200, y1: 0, x2: 300, y2: 100 } // No clipping
            )
        )
    ];

    assert.throws(() => {
        createVirtualDomFromRenderingDom(rootDom, elements, provider);
    }, 'Duplicate RenderingDom ID found: 1. Each RenderingDom must have a unique ID.');
});
