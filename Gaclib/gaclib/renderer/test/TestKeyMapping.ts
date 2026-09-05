import { describe, expect, it } from 'vitest';
import { TYPES } from '@gaclib/remote-protocol';
import { mapJavaScriptKeyToGacUIKey } from '../src/keyMapping';

function map(code: string, key: string, keyCode = 0): TYPES.Key | null {
    return mapJavaScriptKeyToGacUIKey({ code, key, keyCode } as KeyboardEvent);
}

describe('Shared native keyboard mapping', () => {
    it('keeps bracket and brace physical keys at the Windows OEM values', () => {
        for (const key of ['[', '{']) expect(map('BracketLeft', key)).toBe(0xDB);
        for (const key of [']', '}']) expect(map('BracketRight', key)).toBe(0xDD);
        expect(TYPES.Key.KEY_LEFT_BRACKET).toBe(TYPES.Key.KEY_OEM_4);
        expect(TYPES.Key.KEY_RIGHT_BRACKET).toBe(TYPES.Key.KEY_OEM_6);
    });

    it('preserves physical keys, logical fallbacks and left/right modifiers', () => {
        expect(map('KeyQ', 'a')).toBe(TYPES.Key.KEY_Q);
        expect(map('', 'a')).toBe(TYPES.Key.KEY_A);
        expect(map('AltLeft', 'Alt')).toBe(TYPES.Key.KEY_LMENU);
        expect(map('AltRight', 'Alt')).toBe(TYPES.Key.KEY_RMENU);
        expect(map('MetaLeft', 'Meta')).toBe(TYPES.Key.KEY_LWIN);
        expect(map('MetaRight', 'Meta')).toBe(TYPES.Key.KEY_RWIN);
        expect(map('ArrowLeft', 'ArrowLeft')).toBe(TYPES.Key.KEY_LEFT);
        expect(map('', '', 13)).toBe(TYPES.Key.KEY_RETURN);
    });

    it('ignores browser keys with no native mapping', () => {
        expect(map('Unidentified', 'Unidentified')).toBeNull();
        expect(map('', '😀')).toBeNull();
        expect(map('', '', 256)).toBeNull();
        expect(TYPES.Key.KEY_UNKNOWN).toBe(-1);
        expect(TYPES.Key.KEY_MAXIMUM).toBe(255);
    });
});
