import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../src/GacUIElementManager';
import { IVirtualDom, RootVirtualDomId, ClippedVirtualDomId } from '../src/virtualDom';
import { createVirtualDomFromRenderingDom, ElementMap } from '../src/virtualDomBuilding';
import { VirtualDomProviderMock } from './virtualDomMock';
import { test, expect, assert } from 'vitest';

// Helper function to create a valid root RenderingDom with zero bounds
export function createRootRenderingDom(): SCHEMA.RenderingDom {
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

// Helper function to create RenderingDomContent
export function createRenderingDomContent(
    bounds: SCHEMA.Rect,
    hitTestResult: SCHEMA.WindowHitTestResult | null = null,
    cursor: SCHEMA.WindowSystemCursorType | null = null,
    element: SCHEMA.TYPES.Integer | null = null,
    validArea?: SCHEMA.Rect
): SCHEMA.RenderingDomContent {
    return {
        hitTestResult,
        cursor,
        element,
        bounds,
        validArea: validArea ?? bounds // If validArea is not provided, use bounds
    };
}

// Helper function to create simple RenderingDomContent (for cases with mostly null parameters)
export function createSimpleRenderingDomContent(
    bounds: SCHEMA.Rect,
    validArea?: SCHEMA.Rect
): SCHEMA.RenderingDomContent {
    return createRenderingDomContent(bounds, null, null, null, validArea);
}

// Helper function to create a child RenderingDom
export function createChildRenderingDom(
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

function assertDomDesc(renderingDom: SCHEMA.RenderingDom, elements: ElementMap, dom: IVirtualDom): void {
    // Check typedDesc based on element mapping
    if (renderingDom.content.element !== null) {
        const expectedTypedDesc = elements.get(renderingDom.content.element);
        assert.deepEqual(dom.typedDesc, expectedTypedDesc);
    } else {
        assert.isUndefined(dom.typedDesc);
    }
}

export function assertDomAttributes(renderingDom: SCHEMA.RenderingDom, elements: ElementMap, dom: IVirtualDom, domv?: IVirtualDom): void {
    console.log(`Asserting attributes for RenderingDom ID: ${renderingDom.id}`);
    if (domv === undefined) {
        // Single DOM case: dom should have the original ID and inherit bounds as globalBounds
        assert.strictEqual(dom.id, renderingDom.id);
        assert.deepEqual(dom.globalBounds, renderingDom.content.bounds);
        assert.strictEqual(dom.hitTestResult, renderingDom.content.hitTestResult ?? undefined);
        assert.strictEqual(dom.cursor, renderingDom.content.cursor ?? undefined);
        
        assertDomDesc(renderingDom, elements, dom);
    } else {
        // Clipped DOM case: dom is outer (with validArea), domv is inner (with bounds and content)
        assert.strictEqual(dom.id, renderingDom.id);
        assert.deepEqual(dom.globalBounds, renderingDom.content.validArea);
        assert.isUndefined(dom.hitTestResult); // Simple DOM has no properties
        assert.isUndefined(dom.cursor);
        assert.isUndefined(dom.typedDesc);
        
        assert.strictEqual(domv.id, ClippedVirtualDomId);
        assert.deepEqual(domv.globalBounds, renderingDom.content.bounds);
        assert.strictEqual(domv.hitTestResult, renderingDom.content.hitTestResult ?? undefined);
        assert.strictEqual(domv.cursor, renderingDom.content.cursor ?? undefined);
        
        assertDomDesc(renderingDom, elements, domv);
    }
}

test('createVirtualDomFromRenderingDom - root node with no children', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    const rootDom = createRootRenderingDom();

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Verify the screen element
    assert.strictEqual(result.screen.id, RootVirtualDomId);
    assert.deepEqual(result.screen.globalBounds, { x1: 0, y1: 0, x2: 0, y2: 0 });
    assert.deepEqual(result.screen.bounds, { x1: 0, y1: 0, x2: 0, y2: 0 });
    assert.isUndefined(result.screen.parent);
    expect(result.screen.children).toEqual([]);

    // Verify maps are empty since there are no children
    assert.strictEqual(result.doms.size, 0);
    assert.strictEqual(result.elementToDoms.size, 0);
    assert.strictEqual(result.elements, elements);
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-negative-one ID)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.id = 0; // Invalid ID, should be -1

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-zero bounds)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.bounds = { x1: 10, y1: 20, x2: 30, y2: 40 }; // Non-zero bounds

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-null hitTestResult)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.hitTestResult = SCHEMA.WindowHitTestResult.Client; // Non-null hitTestResult

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-null element)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.element = 123; // Non-null element

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-null cursor)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.cursor = SCHEMA.WindowSystemCursorType.Arrow; // Non-null cursor

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-zero validArea)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.validArea = { x1: 10, y1: 20, x2: 30, y2: 40 }; // Non-zero validArea

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on duplicate RenderingDom IDs', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            2,
            createRenderingDomContent({ x1: 10, y1: 10, x2: 110, y2: 110 })
        ),
        createChildRenderingDom(
            2, // Duplicate ID - should throw
            createRenderingDomContent({ x1: 200, y1: 10, x2: 300, y2: 110 })
        )
    ];

    assert.throws(() => {
        createVirtualDomFromRenderingDom(rootDom, elements, provider);
    }, 'Duplicate RenderingDom ID found: 2. Each RenderingDom must have a unique ID.');
});

test('createVirtualDomFromRenderingDom - throws on missing element in ElementMap', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    // Note: elements map is empty, but child references element ID 100
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            2,
            createRenderingDomContent(
                { x1: 10, y1: 10, x2: 110, y2: 110 },
                null,
                null,
                100 // Element ID not in map
            )
        )
    ];

    assert.throws(() => {
        createVirtualDomFromRenderingDom(rootDom, elements, provider);
    }, 'RenderingDomContent.element ID 100 not found in ElementMap');
});

test('createVirtualDomFromRenderingDom - throws on duplicate element mapping', () => {
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const elements: ElementMap = new Map();
    elements.set(100, focusRectangleDesc);
    
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        createChildRenderingDom(
            2,
            createRenderingDomContent(
                { x1: 10, y1: 10, x2: 110, y2: 110 },
                null,
                null,
                100 // Element ID
            )
        ),
        createChildRenderingDom(
            3,
            createRenderingDomContent(
                { x1: 200, y1: 10, x2: 300, y2: 110 },
                null,
                null,
                100 // Same element ID - should throw
            )
        )
    ];

    assert.throws(() => {
        createVirtualDomFromRenderingDom(rootDom, elements, provider);
    }, 'RenderingDomContent.element ID 100 is already mapped to another IVirtualDom. Each element must have 1:1 mapping with IVirtualDom.');
});

test('createVirtualDomFromRenderingDom - simple tree root(a(b(c,d)), e)', () => {
    // +---------------------+  +---+
    // |2                    |  |6  |
    // |  +----------------+ |  |   |
    // |  |2/3             | |  |   |
    // |  | +-----+        | |  |   |
    // |  | |2/3/4|        | |  |   |
    // |  | +-----+        | |  |   |
    // |  |        +-----+ | |  |   |
    // |  |        |2/3/5| | |  |   |
    // |  |        |     | | |  |   |
    // |  |        +-----+ | |  |   |
    // |  +----------------+ |  |   |
    // +---------------------+  +---+
    
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const rawDesc: TypedElementDesc = { type: SCHEMA.RendererType.Raw };
    const solidLabelDesc: TypedElementDesc = {
        type: SCHEMA.RendererType.SolidLabel,
        desc: {
            id: 103,
            text: 'Test Label',
            font: {
                fontFamily: 'Arial',
                size: 12,
                bold: false,
                italic: false,
                underline: false,
                strikeline: false,
                antialias: false,
                verticalAntialias: false
            },
            textColor: '#000000',
            horizontalAlignment: SCHEMA.ElementHorizontalAlignment.Left,
            verticalAlignment: SCHEMA.ElementVerticalAlignment.Top,
            wrapLine: false,
            wrapLineHeightCalculation: false,
            ellipse: false,
            multiline: false,
            measuringRequest: null
        }
    };
    
    const elements: ElementMap = new Map();
    elements.set(101, focusRectangleDesc);
    elements.set(102, rawDesc);
    elements.set(103, solidLabelDesc);
    
    // Create tree structure: root(a(b(c,d)), e)
    // Global bounds: Root: (0,0,0,0), A: (100,100,300,300), B: (120,120,280,280), 
    //                C: (130,130,180,180), D: (200,200,270,270), E: (400,100,600,300)
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        { // a
            id: 2,
            content: createRenderingDomContent(
                { x1: 100, y1: 100, x2: 300, y2: 300 },
                SCHEMA.WindowHitTestResult.Client,
                SCHEMA.WindowSystemCursorType.Arrow,
                101
            ),
            children: [
                { // b
                    id: 3,
                    content: createRenderingDomContent(
                        { x1: 120, y1: 120, x2: 280, y2: 280 },
                        null,
                        null,
                        102
                    ),
                    children: [
                        { // c
                            id: 4,
                            content: createRenderingDomContent(
                                { x1: 130, y1: 130, x2: 180, y2: 180 }
                            ),
                            children: null
                        },
                        { // d
                            id: 5,
                            content: createRenderingDomContent(
                                { x1: 200, y1: 200, x2: 270, y2: 270 },
                                null,
                                null,
                                103
                            ),
                            children: null
                        }
                    ]
                }
            ]
        },
        { // e
            id: 6,
            content: createRenderingDomContent(
                { x1: 400, y1: 100, x2: 600, y2: 300 }
            ),
            children: null
        }
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    // Verify the screen (root)
    assert.strictEqual(result.screen.id, RootVirtualDomId);
    assert.deepEqual(result.screen.globalBounds, { x1: 0, y1: 0, x2: 0, y2: 0 });
    assert.deepEqual(result.screen.bounds, { x1: 0, y1: 0, x2: 0, y2: 0 });
    assert.isUndefined(result.screen.parent);
    assert.strictEqual(result.screen.children.length, 2);

    // Verify maps sizes
    assert.strictEqual(result.doms.size, 5); // 5 child nodes (excluding screen)
    assert.strictEqual(result.elementToDoms.size, 3); // 3 elements: 101, 102, 103
    assert.strictEqual(result.elements, elements);

    // Get child nodes
    const dom2 = result.screen.children[0];
    const dom6 = result.screen.children[1];

    // Verify node 'dom2' (child of root)
    assertDomAttributes(rootDom.children[0]!, elements, dom2);
    // Bounds should be relative to parent (root at 0,0) - so same as global
    assert.deepEqual(dom2.bounds, { x1: 100, y1: 100, x2: 300, y2: 300 });
    assert.strictEqual(dom2.parent, result.screen);
    assert.strictEqual(dom2.children.length, 1);

    // Verify node 'dom6' (child of root)
    assertDomAttributes(rootDom.children[1]!, elements, dom6);
    // Bounds should be relative to parent (root at 0,0) - so same as global
    assert.deepEqual(dom6.bounds, { x1: 400, y1: 100, x2: 600, y2: 300 });
    assert.strictEqual(dom6.parent, result.screen);
    assert.strictEqual(dom6.children.length, 0);

    // Get child 'dom3' of 'dom2'
    const dom3 = dom2.children[0];
    assertDomAttributes(rootDom.children[0]!.children![0]!, elements, dom3);
    // Bounds should be relative to parent 'dom2' (at 100,100)
    assert.deepEqual(dom3.bounds, { x1: 20, y1: 20, x2: 180, y2: 180 });
    assert.strictEqual(dom3.parent, dom2);
    assert.strictEqual(dom3.children.length, 2);

    // Get children 'dom4' and 'dom5' of 'dom3'
    const dom4 = dom3.children[0];
    const dom5 = dom3.children[1];

    // Verify node 'dom4' (child of 'dom3')
    assertDomAttributes(rootDom.children[0]!.children![0]!.children![0]!, elements, dom4);
    // Bounds should be relative to parent 'dom3' (at 120,120)
    assert.deepEqual(dom4.bounds, { x1: 10, y1: 10, x2: 60, y2: 60 });
    assert.strictEqual(dom4.parent, dom3);
    assert.strictEqual(dom4.children.length, 0);

    // Verify node 'dom5' (child of 'dom3')
    assertDomAttributes(rootDom.children[0]!.children![0]!.children![1]!, elements, dom5);
    // Bounds should be relative to parent 'dom3' (at 120,120)
    assert.deepEqual(dom5.bounds, { x1: 80, y1: 80, x2: 150, y2: 150 });
    assert.strictEqual(dom5.parent, dom3);
    assert.strictEqual(dom5.children.length, 0);

    // Verify element mappings
    assert.strictEqual(result.elementToDoms.get(101), dom2);
    assert.strictEqual(result.elementToDoms.get(102), dom3);
    assert.strictEqual(result.elementToDoms.get(103), dom5);

    // Verify all nodes are in doms map
    assert.strictEqual(result.doms.get(2), dom2);
    assert.strictEqual(result.doms.get(3), dom3);
    assert.strictEqual(result.doms.get(4), dom4);
    assert.strictEqual(result.doms.get(5), dom5);
    assert.strictEqual(result.doms.get(6), dom6);
});

test('createVirtualDomFromRenderingDom - complex bounds calculation with multiple levels', () => {
    // +--------------+
    // |2             |
    // | +----------+ |
    // | |2/3       | |
    // | | +------+ | |
    // | | |2/3/4 | | |
    // | | |      | | |
    // | | |      | | |
    // | | +------+ | |
    // | +----------+ |
    // +--------------+
    
    const provider = new VirtualDomProviderMock();
    const elements: ElementMap = new Map();
    
    // Create a 3-level nested structure with specific bounds for testing
    const rootDom = createRootRenderingDom();
    rootDom.children = [
        {
            id: 2, // Level 1: Global (100,200,600,700)
            content: createRenderingDomContent(
                { x1: 100, y1: 200, x2: 600, y2: 700 }
            ),
            children: [
                {
                    id: 3, // Level 2: Global (150,250,550,650)
                    content: createRenderingDomContent(
                        { x1: 150, y1: 250, x2: 550, y2: 650 }
                    ),
                    children: [
                        {
                            id: 4, // Level 3: Global (200,300,500,600)
                            content: createRenderingDomContent(
                                { x1: 200, y1: 300, x2: 500, y2: 600 }
                            ),
                            children: null
                        }
                    ]
                }
            ]
        }
    ];

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);

    const dom2 = result.screen.children[0];
    const dom3 = dom2.children[0];
    const dom4 = dom3.children[0];

    assertDomAttributes(rootDom.children[0]!, elements, dom2);
    assertDomAttributes(rootDom.children[0]!.children![0]!, elements, dom3);
    assertDomAttributes(rootDom.children[0]!.children![0]!.children![0]!, elements, dom4);

    // Level 1: Relative to root (0,0) = (100,200,600,700)
    assert.deepEqual(dom2.bounds, { x1: 100, y1: 200, x2: 600, y2: 700 });

    // Level 2: Relative to dom2 (100,200) = (150-100, 250-200, 550-100, 650-200) = (50,50,450,450)
    assert.deepEqual(dom3.bounds, { x1: 50, y1: 50, x2: 450, y2: 450 });

    // Level 3: Relative to dom3 (150,250) = (200-150, 300-250, 500-150, 600-250) = (50,50,350,350)
    assert.deepEqual(dom4.bounds, { x1: 50, y1: 50, x2: 350, y2: 350 });
});
