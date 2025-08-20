import * as SCHEMA from '@gaclib/remote-protocol';
import { diffRenderingDom, createRootRenderingDom, createChildRenderingDom, createSimpleRenderingDomContent, createTestRecord, assertVirtualDomEquality } from './virtualDomMock';
import { test, assert } from 'vitest';

/****************************************************************************************
 * Category 1: bounds clipped by parent's validArea, validArea = intersection(bounds, parent.validArea)
 * These test cases should pass as they don't require ClippedVirtualDomId generation.
 ***************************************************************************************/

test('updateVirtualDomWithRenderingDomDiff - Category 1: Create single element with natural clipping', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +-------------+         +-------------+
     * |1            |         |1            |
     * | +---------+ |         | +---------+ |
     * | |1v       | |         | |1v       | |
     * | |         | |    =>   | |  +----+ | |
     * | |         | |         | |  | 2  | | |
     * | |         | |         | |  +----+ | |
     * | +---------+ |         | +---------+ |
     * +-------------+         +-------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            []
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 70, y2: 60 }, // bounds within parent's validArea
                        { x1: 30, y1: 30, x2: 70, y2: 60 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 2);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 2);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Created);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - Category 1: Delete single element with natural clipping', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +-------------+         +-------------+
     * |1            |         |1            |
     * | +---------+ |         | +---------+ |
     * | |1v       | |         | |1v       | |
     * | |  +----+ | |    =>   | |         | |
     * | |  | 2  | | |         | |         | |
     * | |  +----+ | |         | |         | |
     * | +---------+ |         | +---------+ |
     * +-------------+         +-------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 70, y2: 60 }, // bounds within parent's validArea
                        { x1: 30, y1: 30, x2: 70, y2: 60 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            []
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 2);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 2);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Deleted);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - Category 1: Modify element with natural clipping', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +-------------+         +-------------+
     * |1            |         |1            |
     * | +---------+ |         | +---------+ |
     * | |1v       | |         | |1v       | |
     * | |  +----+ | |    =>   | |  +------+-+-+
     * | |  |1/2 | | |         | |  |1/2   | | |
     * | |  +----+ | |         | |  |      | | |
     * | +---------+ |         | +--+------+ | |
     * +-------------+         +----+--------+ |
     *                              +----------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 70, y2: 60 }, // bounds within parent's validArea
                        { x1: 30, y1: 30, x2: 70, y2: 60 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 120, y2: 120 }, // modified bounds (x2 expanded)
                        { x1: 30, y1: 30, x2: 90, y2: 90 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 1);
    assert.strictEqual(diff.diffsInOrder![0].id, 2);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - Category 1: Mixed operations with natural clipping', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +-------------+         +-------------+
     * |1            |         |1            |
     * | +---------+ |         | +---------+ |
     * | |1v       | |         | |1v       | |
     * | |  +----+ | |   =>    | |  +----+ | |
     * | |  |1/2 | | |         | |  |1/2 | | |
     * | |  +----+ | |         | |  +----+ | |
     * | |  +----+ | |         | |  +----+ | |
     * | |  |1/3 | | |         | |  |1/4 | | |
     * | |  +----+ | |         | |  +----+ | |
     * | +---------+ |         | +---------+ |
     * +-------------+         +-------------+

     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 50, y2: 45 }, // bounds within parent's validArea
                        { x1: 30, y1: 30, x2: 50, y2: 45 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                ),
                createChildRenderingDom(
                    3,
                    createSimpleRenderingDomContent(
                        { x1: 65, y1: 65, x2: 85, y2: 80 }, // bounds within parent's validArea
                        { x1: 65, y1: 65, x2: 85, y2: 80 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                // 2 deleted, 3 deleted
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 70, y2: 45 }, // new element
                        { x1: 30, y1: 30, x2: 70, y2: 45 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                ),
                createChildRenderingDom(
                    4,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 50, x2: 70, y2: 70 }, // new element
                        { x1: 30, y1: 50, x2: 70, y2: 70 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
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
    assert.strictEqual(diff.diffsInOrder![3].id, 4);
    assert.strictEqual(diff.diffsInOrder![3].diffType, SCHEMA.RenderingDom_DiffType.Created);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

/****************************************************************************************
 * Category 2: bounds clipped by parent's validArea, validArea < intersection(bounds, parent.validArea)
 * These test cases will probably fail as ClippedVirtualDomId is required but not implemented in diff update.
 ***************************************************************************************/

test('updateVirtualDomWithRenderingDomDiff - Category 2: Create single element with extra clipping', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +-------------+         +---------------+
     * |1            |         |1              |
     * | +---------+ |         | +---------+   |
     * | |1v       | |         | |1v       |   |
     * | |         | |    =>   | | +-------+-+ |
     * | |         | |         | | |1/2    | | |
     * | |         | |         | | |+----+ | | |
     * | |         | |         | | ||1/2v| | | |
     * | |         | |         | | |+----+ | | |
     * | |         | |         | | +-------+-+ |
     * | +---------+ |         | +---------+   |
     * +-------------+         +---------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            []
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 95, y2: 70 }, // bounds extending beyond parent's validArea
                        { x1: 30, y1: 30, x2: 80, y2: 60 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 2);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 2);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Created);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - Category 2: Delete single element with extra clipping', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +---------------+       +-------------+
     * |1              |       |1            |
     * | +---------+   |       | +---------+ |
     * | |1v       |   |       | |1v       | |
     * | | +-------+-+ |  =>   | |         | |
     * | | |1/2    | | |       | |         | |
     * | | |+----+ | | |       | |         | |
     * | | ||1/2v| | | |       | |         | |
     * | | |+----+ | | |       | +---------+ |
     * | | +-------+-+ |       +-------------+
     * | +---------+   |
     * +---------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 95, y2: 70 }, // bounds extending beyond parent's validArea
                        { x1: 30, y1: 30, x2: 80, y2: 60 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            []
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 2);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 2);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Deleted);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - Category 2: Modify element with extra clipping', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +---------------+       +---------------+
     * |1              |       |1              |
     * | +---------+   |       | +---------+   |
     * | |1v       |   |       | |1v       |   |
     * | | +-------+-+ |       | | +-------+-+ |
     * | | |1/2    | | |       | | |1/2    | | |
     * | | |+----+ | | |       | | |+----+ | | |
     * | | ||1/2v| | | |       | | ||1/2v| | | |
     * | | |+----+ | | |       | | |+----+ | | |
     * | | +-------+-+ |       | | +-------+-+ |
     * | +---------+   |       | +---------+   |
     * +---------------+       +---------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 95, y2: 70 }, // bounds extending beyond parent's validArea
                        { x1: 30, y1: 30, x2: 80, y2: 60 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 105, y2: 75 }, // modified bounds (extended further)
                        { x1: 30, y1: 30, x2: 85, y2: 65 } // modified validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 1);
    assert.strictEqual(diff.diffsInOrder![0].id, 2);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - Category 2: Mixed operations with extra clipping', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +-------------+         +-------------+
     * |1            |         |1            |
     * | +---------+ |         | +---------+ |
     * | |1v       | |         | |1v       | |
     * | |  +----+ | |         | |  +------++|
     * | |  |1/2 | | |         | |  |1/2   |||
     * | |  +----+ | |         | |  +------++|
     * | |  +----+ | |         | |  +------++|
     * | |  |1/3 | | |         | |  |1/4   |||
     * | |  +----+ | |         | |  +------++|
     * | +---------+ |         | +---------+ |
     * +-------------+         +-------------+
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 60, y2: 50 }, // bounds within parent's validArea
                        { x1: 30, y1: 30, x2: 60, y2: 50 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                ),
                createChildRenderingDom(
                    3,
                    createSimpleRenderingDomContent(
                        { x1: 65, y1: 65, x2: 95, y2: 85 }, // bounds extending beyond parent's validArea
                        { x1: 65, y1: 65, x2: 85, y2: 80 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                // 2 deleted, 3 deleted
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 95, y2: 55 }, // new element extending beyond parent's validArea
                        { x1: 30, y1: 30, x2: 80, y2: 50 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                ),
                createChildRenderingDom(
                    4,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 60, x2: 95, y2: 85 }, // new element extending beyond parent's validArea
                        { x1: 30, y1: 60, x2: 80, y2: 80 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
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
    assert.strictEqual(diff.diffsInOrder![3].id, 4);
    assert.strictEqual(diff.diffsInOrder![3].diffType, SCHEMA.RenderingDom_DiffType.Created);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

/****************************************************************************************
 * Category 3: parent and child switching between clipped and non-clipped
 ***************************************************************************************/

test('updateVirtualDomWithRenderingDomDiff - Category 3: Mixed operations with extra clipping (1)', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +-------------+         +----------|
     * |1            |         |1         |
     * | +---------+ |         |          |
     * | |1v       | |         |          |
     * | |  +----+ | |         |    +-----|+
     * | |  |1/2 | | |         |    |1/2  ||
     * | |  +----+ | |         |    +-----|+
     * | |  +------+-+-+       |    +-----|+
     * | |  |1/3   | | |       |    |1/3  ||
     * | |  +------+-+-+       |    +-----|+
     * | +---------+ |         |          |
     * +-------------+         +----------|
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 60, y2: 50 }, // bounds within parent's validArea
                        { x1: 30, y1: 30, x2: 60, y2: 50 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                ),
                createChildRenderingDom(
                    3,
                    createSimpleRenderingDomContent(
                        { x1: 65, y1: 65, x2: 200, y2: 85 }, // bounds extending beyond parent's validArea
                        { x1: 65, y1: 65, x2: 85, y2: 80 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 100, y2: 100 }   // validArea = bounds
            ),
            [
                // 2 deleted, 3 deleted
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 200, y2: 55 }, // new element extending beyond parent's validArea
                        { x1: 30, y1: 30, x2: 80, y2: 50 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                ),
                createChildRenderingDom(
                    3,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 60, x2: 130, y2: 85 }, // new element extending beyond parent's validArea
                        { x1: 30, y1: 60, x2: 100, y2: 85 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 3);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 2);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![2].id, 3);
    assert.strictEqual(diff.diffsInOrder![2].diffType, SCHEMA.RenderingDom_DiffType.Modified);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});

test('updateVirtualDomWithRenderingDomDiff - Category 3: Mixed operations with extra clipping (2)', () => {
    /*
     * ASCII Art:
     * r1:                     r2:
     * +----------|            +-------------+   
     * |1         |            |1            |   
     * |          |            | +---------+ |   
     * |          |            | |1v       | |   
     * |    +-----|+           | |  +----+ | |   
     * |    |1/2  ||           | |  |1/2 | | |   
     * |    +-----|+           | |  +----+ | |   
     * |    +-----|+           | |  +------+-+-+ 
     * |    |1/3  ||           | |  |1/3   | | | 
     * |    +-----|+           | |  +------+-+-+ 
     * |          |            | +---------+ |   
     * +----------|            +-------------+   
     */

    const { elements, provider } = createTestRecord();

    const r1: SCHEMA.RenderingDom = createRootRenderingDom();
    r1.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 100, y2: 100 }   // validArea = bounds
            ),
            [
                // 2 deleted, 3 deleted
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 200, y2: 55 }, // new element extending beyond parent's validArea
                        { x1: 30, y1: 30, x2: 80, y2: 50 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                ),
                createChildRenderingDom(
                    3,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 60, x2: 130, y2: 85 }, // new element extending beyond parent's validArea
                        { x1: 30, y1: 60, x2: 100, y2: 85 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const r2: SCHEMA.RenderingDom = createRootRenderingDom();
    r2.children = [
        createChildRenderingDom(
            1,
            createSimpleRenderingDomContent(
                { x1: 10, y1: 10, x2: 100, y2: 100 }, // bounds
                { x1: 20, y1: 20, x2: 90, y2: 90 }   // validArea smaller than bounds
            ),
            [
                createChildRenderingDom(
                    2,
                    createSimpleRenderingDomContent(
                        { x1: 30, y1: 30, x2: 60, y2: 50 }, // bounds within parent's validArea
                        { x1: 30, y1: 30, x2: 60, y2: 50 } // validArea = intersection(bounds, parent.validArea)
                    ),
                    []
                ),
                createChildRenderingDom(
                    3,
                    createSimpleRenderingDomContent(
                        { x1: 65, y1: 65, x2: 200, y2: 85 }, // bounds extending beyond parent's validArea
                        { x1: 65, y1: 65, x2: 85, y2: 80 } // validArea < intersection(bounds, parent.validArea)
                    ),
                    []
                )
            ]
        )
    ];

    const diff = diffRenderingDom(r1, r2);
    assert.strictEqual(diff.diffsInOrder?.length, 3);
    assert.strictEqual(diff.diffsInOrder![0].id, 1);
    assert.strictEqual(diff.diffsInOrder![0].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![1].id, 2);
    assert.strictEqual(diff.diffsInOrder![1].diffType, SCHEMA.RenderingDom_DiffType.Modified);
    assert.strictEqual(diff.diffsInOrder![2].id, 3);
    assert.strictEqual(diff.diffsInOrder![2].diffType, SCHEMA.RenderingDom_DiffType.Modified);

    assertVirtualDomEquality(r1, r2, diff, elements, provider);
});