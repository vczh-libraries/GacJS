import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementManager, TypedElementDesc } from '../src/GacUIElementManager';
import { RootVirtualDomId } from '../src/dom/virtualDom';
import { createVirtualDomFromRenderingDom } from '../src/dom/virtualDomBuilding';
import { VirtualDomProviderMock, createRootRenderingDom, createRenderingDomContent, createChildRenderingDom, assertDomAttributes, assertRecord } from './virtualDomMock';
import { test, expect, assert } from 'vitest';

test('createVirtualDomFromRenderingDom - root node with no children', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementManager = new ElementManager();
    const rootDom = createRootRenderingDom();

    const result = createVirtualDomFromRenderingDom(rootDom, elements, provider);
    assertRecord(result);

    // Verify the screen element
    assert.strictEqual(result.screen.id, RootVirtualDomId);
    assert.deepEqual(result.screen.props.globalBounds, { x1: 0, y1: 0, x2: 0, y2: 0 });
    assert.deepEqual(result.screen.bounds, { x1: 0, y1: 0, x2: 0, y2: 0 });
    assert.isUndefined(result.screen.parent);
    expect(result.screen.children).toEqual([]);

    assert.strictEqual(result.elements, elements);
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-negative-one ID)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementManager = new ElementManager();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.id = 0; // Invalid ID, should be -1

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-zero bounds)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementManager = new ElementManager();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.bounds = { x1: 10, y1: 20, x2: 30, y2: 40 }; // Non-zero bounds

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-null hitTestResult)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementManager = new ElementManager();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.hitTestResult = SCHEMA.WindowHitTestResult.Client; // Non-null hitTestResult

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-null element)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementManager = new ElementManager();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.element = 123; // Non-null element

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-null cursor)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementManager = new ElementManager();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.cursor = SCHEMA.WindowSystemCursorType.Arrow; // Non-null cursor

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on invalid root format (non-zero validArea)', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementManager = new ElementManager();
    const invalidRootDom = createRootRenderingDom();
    invalidRootDom.content.validArea = { x1: 10, y1: 20, x2: 30, y2: 40 }; // Non-zero validArea

    assert.throws(() => {
        createVirtualDomFromRenderingDom(invalidRootDom, elements, provider);
    }, 'Root RenderingDom does not match expected screen format');
});

test('createVirtualDomFromRenderingDom - throws on duplicate RenderingDom IDs', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementManager = new ElementManager();
    
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

test('createVirtualDomFromRenderingDom - throws on missing element in ElementManager', () => {
    const provider = new VirtualDomProviderMock();
    const elements: ElementManager = new ElementManager();
    // Note: elements manager is empty, but child references element ID 100
    
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
    }, 'Element with id 100 does not have a description');
});

test('createVirtualDomFromRenderingDom - throws on duplicate element mapping', () => {
    const provider = new VirtualDomProviderMock();
    const focusRectangleDesc: TypedElementDesc = { type: SCHEMA.RendererType.FocusRectangle };
    const elements: ElementManager = new ElementManager();
    elements.createWithDesc(100, focusRectangleDesc);
    
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
    
    const elements: ElementManager = new ElementManager();
    elements.createWithDesc(101, focusRectangleDesc);
    elements.createWithDesc(102, rawDesc);
    elements.createWithDesc(103, solidLabelDesc);
    
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
    assertRecord(result);

    // Verify the screen (root)
    assert.strictEqual(result.screen.id, RootVirtualDomId);
    assert.deepEqual(result.screen.props.globalBounds, { x1: 0, y1: 0, x2: 0, y2: 0 });
    assert.deepEqual(result.screen.bounds, { x1: 0, y1: 0, x2: 0, y2: 0 });
    assert.isUndefined(result.screen.parent);
    assert.strictEqual(result.screen.children.length, 2);

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
    const elements: ElementManager = new ElementManager();
    
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
    assertRecord(result);

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
