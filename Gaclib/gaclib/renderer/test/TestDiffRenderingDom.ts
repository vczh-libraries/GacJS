import * as SCHEMA from '@gaclib/remote-protocol';
import { diffRenderingDom } from './virtualDomMock';
import { createRootRenderingDom, createChildRenderingDom, createSimpleRenderingDomContent } from './TestVirtualDomBuilding';
import { test, expect } from 'vitest';

test('diffRenderingDom - identical trees should have no diffs', () => {
    /*
     * ASCII Art:
     * +---------+
     * |   root  |
     * |  +---+  |
     * |  | a |  |
     * |  +---+  |
     * +---------+
     */
    
    const dom1: SCHEMA.RenderingDom = createRootRenderingDom();
    dom1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];
    
    const dom2: SCHEMA.RenderingDom = createRootRenderingDom();
    dom2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];
    
    const diff = diffRenderingDom(dom1, dom2);
    
    expect(diff.diffsInOrder).not.toBe(null);
    expect(diff.diffsInOrder).toEqual([]);
});

test('diffRenderingDom - created element should generate Created diff', () => {
    /*
     * ASCII Art:
     * r1:          r2:
     * +---------+  +---------+
     * |   root  |  |   root  |
     * |         |  |  +---+  |
     * |         |  |  | a |  |
     * |         |  |  +---+  |
     * +---------+  +---------+
     */
    
    const dom1: SCHEMA.RenderingDom = createRootRenderingDom();
    dom1.children = [];
    
    const dom2: SCHEMA.RenderingDom = createRootRenderingDom();
    dom2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];
    
    const diff = diffRenderingDom(dom1, dom2);
    
    expect(diff.diffsInOrder).not.toBe(null);
    expect(diff.diffsInOrder!).toHaveLength(2); // Root modified + child created
    
    // Sort by ID to ensure predictable order for testing
    const sortedDiffs = diff.diffsInOrder!.sort((a, b) => a.id - b.id);
    
    // Root modified (children changed from [] to [1])
    expect(sortedDiffs[0]).toEqual({
        id: -1,
        diffType: SCHEMA.RenderingDom_DiffType.Modified,
        content: null, // Content didn't change
        children: [1] // New children
    });
    
    // Child created
    expect(sortedDiffs[1]).toEqual({
        id: 1,
        diffType: SCHEMA.RenderingDom_DiffType.Created,
        content: {
            hitTestResult: null,
            cursor: null,
            element: null,
            bounds: { x1: 10, y1: 10, x2: 50, y2: 30 },
            validArea: { x1: 10, y1: 10, x2: 50, y2: 30 }
        },
        children: []
    });
});

test('diffRenderingDom - deleted element should generate Deleted diff', () => {
    /*
     * ASCII Art:
     * r1:          r2:
     * +---------+  +---------+
     * |   root  |  |   root  |
     * |  +---+  |  |         |
     * |  | a |  |  |         |
     * |  +---+  |  |         |
     * +---------+  +---------+
     */
    
    const dom1: SCHEMA.RenderingDom = createRootRenderingDom();
    dom1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];
    
    const dom2: SCHEMA.RenderingDom = createRootRenderingDom();
    dom2.children = [];
    
    const diff = diffRenderingDom(dom1, dom2);
    
    expect(diff.diffsInOrder).not.toBe(null);
    expect(diff.diffsInOrder!).toHaveLength(2); // Root modified + child deleted
    
    // Sort by ID to ensure predictable order for testing
    const sortedDiffs = diff.diffsInOrder!.sort((a, b) => a.id - b.id);
    
    // Root modified (children changed from [1] to [])
    expect(sortedDiffs[0]).toEqual({
        id: -1,
        diffType: SCHEMA.RenderingDom_DiffType.Modified,
        content: null, // Content didn't change
        children: [] // New children (empty)
    });
    
    // Child deleted
    expect(sortedDiffs[1]).toEqual({
        id: 1,
        diffType: SCHEMA.RenderingDom_DiffType.Deleted,
        content: null,
        children: null
    });
});

test('diffRenderingDom - modified content should generate Modified diff', () => {
    /*
     * ASCII Art:
     * r1:          r2:
     * +---------+  +---------+
     * |   root  |  |   root  |
     * |  +---+  |  |  +-----+|
     * |  | a |  |  |  |  a  ||
     * |  +---+  |  |  +-----+|
     * +---------+  +---------+
     */
    
    const dom1: SCHEMA.RenderingDom = createRootRenderingDom();
    dom1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];
    
    const dom2: SCHEMA.RenderingDom = createRootRenderingDom();
    dom2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 70, y2: 30 }), // Changed x2 from 50 to 70
            []
        )
    ];
    
    const diff = diffRenderingDom(dom1, dom2);
    
    expect(diff.diffsInOrder).not.toBe(null);
    expect(diff.diffsInOrder!).toHaveLength(1);
    expect(diff.diffsInOrder![0]).toEqual({
        id: 1,
        diffType: SCHEMA.RenderingDom_DiffType.Modified,
        content: {
            hitTestResult: null,
            cursor: null,
            element: null,
            bounds: { x1: 10, y1: 10, x2: 70, y2: 30 },
            validArea: { x1: 10, y1: 10, x2: 70, y2: 30 }
        },
        children: null
    });
});

test('diffRenderingDom - modified children order should generate Modified diff', () => {
    /*
     * ASCII Art:
     * r1:          r2:
     * +---------+  +---------+
     * |   root  |  |   root  |
     * |  +---+  |  |  +---+  |
     * |  | a |  |  |  | a |  |
     * |  |+-+|  |  |  |+-+|  |
     * |  ||b||  |  |  ||c||  |
     * |  |+-+|  |  |  |+-+|  |
     * |  |+-+|  |  |  |+-+|  |
     * |  ||c||  |  |  ||b||  |
     * |  |+-+|  |  |  |+-+|  |
     * |  +---+  |  |  +---+  |
     * +---------+  +---------+
     */
    
    const dom1: SCHEMA.RenderingDom = createRootRenderingDom();
    dom1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 50 }),
            [
                createChildRenderingDom(2, createSimpleRenderingDomContent({ x1: 15, y1: 15, x2: 25, y2: 25 }), []),
                createChildRenderingDom(3, createSimpleRenderingDomContent({ x1: 15, y1: 30, x2: 25, y2: 40 }), [])
            ]
        )
    ];
    
    const dom2: SCHEMA.RenderingDom = createRootRenderingDom();
    dom2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 50 }),
            [
                createChildRenderingDom(3, createSimpleRenderingDomContent({ x1: 15, y1: 30, x2: 25, y2: 40 }), []), // Same content as before
                createChildRenderingDom(2, createSimpleRenderingDomContent({ x1: 15, y1: 15, x2: 25, y2: 25 }), [])  // Same content as before
            ]
        )
    ];
    
    const diff = diffRenderingDom(dom1, dom2);
    
    expect(diff.diffsInOrder).not.toBe(null);
    expect(diff.diffsInOrder!).toHaveLength(1); // Only element 1 modified (children order changed)
    expect(diff.diffsInOrder![0].id).toBe(1);
    expect(diff.diffsInOrder![0].diffType).toBe(SCHEMA.RenderingDom_DiffType.Modified);
    expect(diff.diffsInOrder![0].content).toBe(null); // Content didn't change
    expect(diff.diffsInOrder![0].children).toEqual([3, 2]); // New children order
});

test('diffRenderingDom - complex mixed changes', () => {
    /*
     * ASCII Art:
     * r1:                  r2:
     * +-----------+        +-----------+
     * |    root   |        |    root   |
     * |  +-----+  |        |  +-----+  |
     * |  |  a  |  |        |  |  a  |  | (modified content)
     * |  | +-+ |  |   =>   |  | +-+ |  |
     * |  | |b| |  |        |  | |d| |  | (b deleted, d created)
     * |  | +-+ |  |        |  | +-+ |  |
     * |  +-----+  |        |  +-----+  |
     * +-----------+        +-----------+
     */
    
    const dom1: SCHEMA.RenderingDom = createRootRenderingDom();
    dom1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 60, y2: 50 }),
            [
                createChildRenderingDom(2, createSimpleRenderingDomContent({ x1: 20, y1: 20, x2: 40, y2: 40 }), [])
            ]
        )
    ];
    
    const dom2: SCHEMA.RenderingDom = createRootRenderingDom();
    dom2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 70, y2: 50 }), // Changed x2 from 60 to 70
            [
                createChildRenderingDom(4, createSimpleRenderingDomContent({ x1: 20, y1: 20, x2: 40, y2: 40 }), []) // New child with id 4
            ]
        )
    ];
    
    const diff = diffRenderingDom(dom1, dom2);
    
    // Should have 3 diffs: 1 deleted, 1 created, 1 modified
    expect(diff.diffsInOrder).not.toBe(null);
    expect(diff.diffsInOrder!).toHaveLength(3);
    
    // Sort by ID to ensure predictable order for testing
    const sortedDiffs = diff.diffsInOrder!.sort((a, b) => a.id - b.id);
    
    // Modified element (id=1)
    expect(sortedDiffs[0]).toEqual({
        id: 1,
        diffType: SCHEMA.RenderingDom_DiffType.Modified,
        content: {
            hitTestResult: null,
            cursor: null,
            element: null,
            bounds: { x1: 10, y1: 10, x2: 70, y2: 50 },
            validArea: { x1: 10, y1: 10, x2: 70, y2: 50 }
        },
        children: [4]
    });
    
    // Deleted element (id=2)
    expect(sortedDiffs[1]).toEqual({
        id: 2,
        diffType: SCHEMA.RenderingDom_DiffType.Deleted,
        content: null,
        children: null
    });
    
    // Created element (id=4)
    expect(sortedDiffs[2]).toEqual({
        id: 4,
        diffType: SCHEMA.RenderingDom_DiffType.Created,
        content: {
            hitTestResult: null,
            cursor: null,
            element: null,
            bounds: { x1: 20, y1: 20, x2: 40, y2: 40 },
            validArea: { x1: 20, y1: 20, x2: 40, y2: 40 }
        },
        children: []
    });
});
