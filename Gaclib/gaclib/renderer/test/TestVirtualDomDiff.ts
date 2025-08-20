import * as SCHEMA from '@gaclib/remote-protocol';
import { updateVirtualDomWithRenderingDomDiff, createVirtualDomFromRenderingDom } from '../src/dom/virtualDomBuilding';
import { diffRenderingDom, createRootRenderingDom, createChildRenderingDom, createSimpleRenderingDomContent, createTestRecord, assertVirtualDomEquality, assertRecord } from './virtualDomMock';
import { test, expect, assert } from 'vitest';

/****************************************************************************************
 * Exception Tests - Test illegal diff scenarios
 ***************************************************************************************/

test('updateVirtualDomWithRenderingDomDiff - Created diff must have content', () => {
    const { elements, provider } = createTestRecord();

    // Create a simple initial state
    const initialRenderingDom = createRootRenderingDom();
    const record = createVirtualDomFromRenderingDom(initialRenderingDom, elements, provider);
    assertRecord(record);

    const illegalDiff: SCHEMA.RenderingDom_DiffsInOrder = {
        diffsInOrder: [
            {
                id: 1,
                diffType: SCHEMA.RenderingDom_DiffType.Created,
                content: null, // Missing content - should throw
                children: []
            }
        ]
    };

    expect(() => {
        updateVirtualDomWithRenderingDomDiff(illegalDiff, record, provider);
    }).toThrow('RenderingDom_Diff with Created must have content or children available');
});

test('updateVirtualDomWithRenderingDomDiff - Created diff must have children', () => {
    const { elements, provider } = createTestRecord();

    // Create a simple initial state
    const initialRenderingDom = createRootRenderingDom();
    const record = createVirtualDomFromRenderingDom(initialRenderingDom, elements, provider);
    assertRecord(record);

    const illegalDiff: SCHEMA.RenderingDom_DiffsInOrder = {
        diffsInOrder: [
            {
                id: 1,
                diffType: SCHEMA.RenderingDom_DiffType.Created,
                content: createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
                children: null // Missing children - should throw
            }
        ]
    };

    expect(() => {
        updateVirtualDomWithRenderingDomDiff(illegalDiff, record, provider);
    }).toThrow('RenderingDom_Diff with Created must have content or children available');
});

test('updateVirtualDomWithRenderingDomDiff - Created diff must use unused ID', () => {
    const { elements, provider } = createTestRecord();

    // Create initial state with a child to make ID 1 exist
    const initialRenderingDom = createRootRenderingDom();
    initialRenderingDom.children = [
        createChildRenderingDom(1, createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }), [])
    ];
    const record = createVirtualDomFromRenderingDom(initialRenderingDom, elements, provider);
    assertRecord(record);

    const illegalDiff: SCHEMA.RenderingDom_DiffsInOrder = {
        diffsInOrder: [
            {
                id: 1, // ID already exists - should throw
                diffType: SCHEMA.RenderingDom_DiffType.Created,
                content: createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
                children: []
            }
        ]
    };

    expect(() => {
        updateVirtualDomWithRenderingDomDiff(illegalDiff, record, provider);
    }).toThrow('RenderingDom_Diff with Created must use unused ID');
});

test('updateVirtualDomWithRenderingDomDiff - Created diff with negative ID should throw', () => {
    const { elements, provider } = createTestRecord();

    // Create a simple initial state
    const initialRenderingDom = createRootRenderingDom();
    const record = createVirtualDomFromRenderingDom(initialRenderingDom, elements, provider);
    assertRecord(record);

    const illegalDiff: SCHEMA.RenderingDom_DiffsInOrder = {
        diffsInOrder: [
            {
                id: -2, // Negative ID (not root) - should throw
                diffType: SCHEMA.RenderingDom_DiffType.Created,
                content: createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
                children: []
            }
        ]
    };

    expect(() => {
        updateVirtualDomWithRenderingDomDiff(illegalDiff, record, provider);
    }).toThrow('RenderingDom_Diff with Created must use unused ID');
});

test('updateVirtualDomWithRenderingDomDiff - Modified diff must use existing ID', () => {
    const { elements, provider } = createTestRecord();

    // Create a simple initial state
    const initialRenderingDom = createRootRenderingDom();
    const record = createVirtualDomFromRenderingDom(initialRenderingDom, elements, provider);
    assertRecord(record);

    const illegalDiff: SCHEMA.RenderingDom_DiffsInOrder = {
        diffsInOrder: [
            {
                id: 999, // Non-existing ID - should throw
                diffType: SCHEMA.RenderingDom_DiffType.Modified,
                content: createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
                children: []
            }
        ]
    };

    expect(() => {
        updateVirtualDomWithRenderingDomDiff(illegalDiff, record, provider);
    }).toThrow('RenderingDom_Diff with Modified must use existing ID');
});

test('updateVirtualDomWithRenderingDomDiff - Deleted diff must use existing ID', () => {
    const { elements, provider } = createTestRecord();

    // Create a simple initial state
    const initialRenderingDom = createRootRenderingDom();
    const record = createVirtualDomFromRenderingDom(initialRenderingDom, elements, provider);
    assertRecord(record);

    const illegalDiff: SCHEMA.RenderingDom_DiffsInOrder = {
        diffsInOrder: [
            {
                id: 999, // Non-existing ID - should throw
                diffType: SCHEMA.RenderingDom_DiffType.Deleted,
                content: null,
                children: null
            }
        ]
    };

    expect(() => {
        updateVirtualDomWithRenderingDomDiff(illegalDiff, record, provider);
    }).toThrow('RenderingDom_Diff with Deleted must use existing ID');
});

test('updateVirtualDomWithRenderingDomDiff - diff with invalid child ID should throw', () => {
    const { elements, provider } = createTestRecord();

    // Create initial state with a child
    const initialRenderingDom = createRootRenderingDom();
    initialRenderingDom.children = [
        createChildRenderingDom(1, createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }), [])
    ];
    const record = createVirtualDomFromRenderingDom(initialRenderingDom, elements, provider);
    assertRecord(record);

    const illegalDiff: SCHEMA.RenderingDom_DiffsInOrder = {
        diffsInOrder: [
            {
                id: 1, // This ID exists
                diffType: SCHEMA.RenderingDom_DiffType.Modified,
                content: null,
                children: [999] // Invalid child ID - should throw
            }
        ]
    };

    expect(() => {
        updateVirtualDomWithRenderingDomDiff(illegalDiff, record, provider);
    }).toThrow('RenderingDom_Diff should not use invalid child id');
});

test('updateVirtualDomWithRenderingDomDiff - dangling created node should throw', () => {
    const { elements, provider } = createTestRecord();

    // Create a simple initial state
    const initialRenderingDom = createRootRenderingDom();
    const record = createVirtualDomFromRenderingDom(initialRenderingDom, elements, provider);
    assertRecord(record);

    const illegalDiff: SCHEMA.RenderingDom_DiffsInOrder = {
        diffsInOrder: [
            {
                id: 1,
                diffType: SCHEMA.RenderingDom_DiffType.Created,
                content: createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
                children: []
            }
            // Missing parent relationship - node will be dangling
        ]
    };

    expect(() => {
        updateVirtualDomWithRenderingDomDiff(illegalDiff, record, provider);
    }).toThrow('RenderingDom_Diff should not be dangling');
});

/****************************************************************************************
 * Normal Operation Tests - Using diffRenderingDom + updateVirtualDomWithRenderingDomDiff
 ***************************************************************************************/

test('updateVirtualDomWithRenderingDomDiff - no changes', () => {
    /*
     * ASCII Art:
     * +---------+
     * |   root  |
     * |  +---+  |
     * |  | 1 |  |
     * |  +---+  |
     * +---------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 0);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - create single element', () => {
    /*
     * ASCII Art:
     * r1:          r2:
     * +---------+  +---------+
     * |   root  |  |   root  |
     * |         |  |  +---+  |
     * |         |  |  | 1 |  |
     * |         |  |  +---+  |
     * +---------+  +---------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 2);
    assert.strictEqual(diff.diffsInOrder![0].id, -1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 1);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Created);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - delete single element', () => {
    /*
     * ASCII Art:
     * r1:          r2:
     * +---------+  +---------+
     * |   root  |  |   root  |
     * |  +---+  |  |         |
     * |  | 1 |  |  |         |
     * |  +---+  |  |         |
     * +---------+  +---------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 2);
    assert.strictEqual(diff.diffsInOrder![0].id, -1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 1);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Deleted);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - modify element content', () => {
    /*
     * ASCII Art:
     * r1:          r2:
     * +---------+  +---------+
     * |   root  |  |   root  |
     * |  +---+  |  |  +-----+|
     * |  | 1 |  |  |  |  1  ||
     * |  +---+  |  |  +-----+|
     * +---------+  +---------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 30 }),
            []
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 70, y2: 30 }), // Changed x2 from 50 to 70
            []
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 1);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - modify children order', () => {
    /*
     * ASCII Art:
     * r1:          r2:
     * +------------+  +------------+
     * |  root      |  |  root      |
     * |  +------+  |  |  +------+  |
     * |  |1     |  |  |  |1     |  |
     * |  |+----+|  |  |  |+----+|  |
     * |  ||1/2 ||  |  |  ||1/3 ||  |
     * |  |+----+|  |  |  |+----+|  |
     * |  |+----+|  |  |  |+----+|  |
     * |  ||1/3 ||  |  |  ||1/2 ||  |
     * |  |+----+|  |  |  |+----+|  |
     * |  +------+  |  |  +------+  |
     * +------------+  +------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 50 }),
            [
                createChildRenderingDom(2, createSimpleRenderingDomContent({ x1: 15, y1: 15, x2: 25, y2: 25 }), []),
                createChildRenderingDom(3, createSimpleRenderingDomContent({ x1: 15, y1: 30, x2: 25, y2: 40 }), [])
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 50, y2: 50 }),
            [
                createChildRenderingDom(3, createSimpleRenderingDomContent({ x1: 15, y1: 30, x2: 25, y2: 40 }), []), // Swapped order
                createChildRenderingDom(2, createSimpleRenderingDomContent({ x1: 15, y1: 15, x2: 25, y2: 25 }), [])
            ]
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 1);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - complex nested changes', () => {
    /*
     * ASCII Art:
     * r1:                    r2:
     * +-------------+        +-------------+
     * |    root     |        |    root     |
     * |  +-------+  |        |  +-------+  |
     * |  | 1     |  |        |  | 1     |  |
     * |  | +---+ |  |   =>   |  | +---+ |  |
     * |  | |1/2| |  |        |  | |1/4| |  | (b deleted, d created)
     * |  | +---+ |  |        |  | +---+ |  |
     * |  +-------+  |        |  | +---+ |  |
     * |             |        |  | |1/5| |  | (e created)
     * |             |        |  | +---+ |  |
     * |             |        |  +-------+  |
     * +-------------+        +-------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 80, y2: 60 }),
            [
                createChildRenderingDom(2, createSimpleRenderingDomContent({ x1: 20, y1: 20, x2: 40, y2: 35 }), [])
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 80, y2: 60 }),
            [
                createChildRenderingDom(4, createSimpleRenderingDomContent({ x1: 20, y1: 20, x2: 40, y2: 35 }), []), // New child with id 4
                createChildRenderingDom(5, createSimpleRenderingDomContent({ x1: 20, y1: 40, x2: 40, y2: 55 }), [])  // Additional new child
            ]
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 4);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 2);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Deleted);
    assert.strictEqual(diff.diffsInOrder![2].id, 4);
    assert.strictEqual(diff.diffsInOrder![2].diffType, SCHEMA.RenderingDom_DiffType.Created);
    assert.strictEqual(diff.diffsInOrder![3].id, 5);
    assert.strictEqual(diff.diffsInOrder![3].diffType, SCHEMA.RenderingDom_DiffType.Created);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - three level hierarchy changes', () => {
    /*
     * ASCII Art:
     * r1:                    r2:
     * +-----------------+        +-----------------+
     * |    root         |        |    root         |
     * |  +-----------+  |        |  +-----------+  |
     * |  | 1         |  |        |  | 1         |  | (content modified)
     * |  | +-------+ |  |   =>   |  | +-------+ |  |
     * |  | |1/2    | |  |        |  | |1/2    | |  |
     * |  | |+-----+| |  |        |  | |+-----+| |  |
     * |  | ||1/2/3|| |  |        |  | ||1/2/6|| |  | (c deleted, f created)
     * |  | |+-----+| |  |        |  | |+-----+| |  |
     * |  | +-------+ |  |        |  | +-------+ |  |
     * |  +-----------+  |        |  +-----------+  |
     * +-----------------+        +-----------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 80, y2: 70 }),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent({ x1: 20, y1: 20, x2: 70, y2: 60 }),
                    [
                        createChildRenderingDom(3, createSimpleRenderingDomContent({ x1: 30, y1: 30, x2: 50, y2: 45 }), [])
                    ]
                )
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 10, y1: 10, x2: 85, y2: 70 }), // Modified x2 from 80 to 85
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent({ x1: 20, y1: 20, x2: 70, y2: 60 }),
                    [
                        createChildRenderingDom(6, createSimpleRenderingDomContent({ x1: 30, y1: 30, x2: 50, y2: 45 }), []) // New id 6 instead of 3
                    ]
                )
            ]
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 4);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 2);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![2].id, 3);
    assert.strictEqual(diff.diffsInOrder![2].diffType, SCHEMA.RenderingDom_DiffType.Deleted);
    assert.strictEqual(diff.diffsInOrder![3].id, 6);
    assert.strictEqual(diff.diffsInOrder![3].diffType, SCHEMA.RenderingDom_DiffType.Created);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - validArea equals bounds scenario', () => {
    /*
     * ASCII Art:
     * r1:          r2:
     * +---------+  +------------+
     * |   root  |  |   root     |
     * |  +---+  |  |  +-------+ |
     * |  | 1 |  |  |  |   1   | |
     * |  +---+  |  |  +-------+ |
     * +---------+  +------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 20, y1: 20, x2: 40, y2: 35 }),
            []
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent({ x1: 20, y1: 20, x2: 60, y2: 35 }), // Wider bounds, validArea follows
            []
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 1);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});
