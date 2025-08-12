import * as SCHEMA from '@gaclib/remote-protocol';
import { assert, test } from 'vitest';

// @ts-expect-error TS6133
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const inputDomJsonSingleRoot: SCHEMA.RenderingDom = {
    id: -1,
    content: {
        hitTestResult: null,
        cursor: null,
        element: null,
        bounds: { x1: 0, y1: 1, x2: 2, y2: 3 },
        validArea: { x1: 4, y1: 5, x2: 6, y2: 7 }
    },
    children: null
};

// @ts-expect-error TS6133
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const inputDomJsonBinaryTree: SCHEMA.RenderingDom = {
    id: -1,
    content: {
        hitTestResult: null,
        cursor: null,
        element: null,
        bounds: { x1: 0, y1: 1, x2: 2, y2: 3 },
        validArea: { x1: 4, y1: 5, x2: 6, y2: 7 }
    },
    children: [{
        id: 0,
        content: {
            hitTestResult: SCHEMA.WindowHitTestResult.Client,
            cursor: null,
            element: null,
            bounds: { x1: 0, y1: 0, x2: 0, y2: 0 },
            validArea: { x1: 0, y1: 0, x2: 0, y2: 0 }
        },
        children: [{
            id: 2,
            content: {
                hitTestResult: null,
                cursor: SCHEMA.WindowSystemCursorType.Arrow,
                element: null,
                bounds: { x1: 2, y1: 2, x2: 2, y2: 2 },
                validArea: { x1: 2, y1: 2, x2: 2, y2: 2 }
            },
            children: null
        },
        {
            id: 3,
            content: {
                hitTestResult: SCHEMA.WindowHitTestResult.Title,
                cursor: SCHEMA.WindowSystemCursorType.Help,
                element: null,
                bounds: { x1: 3, y1: 3, x2: 3, y2: 3 },
                validArea: { x1: 3, y1: 3, x2: 3, y2: 3 }
            },
            children: null
        }]
    },
    {
        id: 1,
        content: {
            hitTestResult: null,
            cursor: null,
            element: 99,
            bounds: { x1: 1, y1: 1, x2: 1, y2: 1 },
            validArea: { x1: 1, y1: 1, x2: 1, y2: 1 }
        },
        children: null
    }]
};

/*
 * basic style: position:absolute; box-sizing: border-box; overflow:hidden; left:10px; top:10px; width:50px; height:50px;
 * 
 * FocusRectangle: outline:1px dashed white; outline-offset:1px; mix-blend-mode: difference;
 * SolidBorder:
 *   Rectangle=outline:1px solid COLOR; outline-offset:-1px;
 *   Ellipse=outline:1px solid COLOR; outline-offset:-1px; border-radius: 50%;
 *   RoundRect=outline:1px solid COLOR; outline-offset:-1px; border-radius: 5px 10px;
 * 
 * https://playcode.io/html
 */

test(`EmptyTest`, () => {
    assert.isTrue(true);
});
