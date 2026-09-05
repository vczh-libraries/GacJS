import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Key } from '@gaclib/remote-protocol';

describe('Generated shared key declarations', () => {
    it('matches every imported VlppOS key and has no stale entries', () => {
        const header = readFileSync(path.resolve('../codegen-remote-protocol/src/Import/TUITypes.h'), 'utf8');
        const expected: Record<string, number> = { KEY_UNKNOWN: -1, KEY_MAXIMUM: 255 };
        for (const line of header.split('\n')) {
            const item = /ITEM\(\s*(\w+)\s*,\s*(0x[0-9A-Fa-f]+)\s*\)/u.exec(line);
            if (item !== null) expected['KEY_' + item[1]] = Number(item[2]);
        }
        expect(Object.keys(expected).length).toBeGreaterThan(180);
        const actual = Object.fromEntries(Object.entries(Key).filter(([name]) => name.startsWith('KEY_')));
        expect(actual).toEqual(expected);
        expect(Key.KEY_LEFT_BRACKET).toBe(0xDB);
        expect(Key.KEY_RIGHT_BRACKET).toBe(0xDD);
    });
});
