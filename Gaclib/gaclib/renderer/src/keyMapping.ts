import * as SCHEMA from '@gaclib/remote-protocol';

/**
 * Maps JavaScript KeyboardEvent to GacUI Key enum values
 * Based on Windows Virtual Key codes used in the Key enum
 * 
 * COVERAGE ANALYSIS:
 * This mapping covers all commonly used keys that are accessible through web browser keyboard events.
 * The following groups of keys from the Key enum are intentionally NOT mapped because they are either
 * not available on standard keyboards, not accessible via web browsers, or require special handling:
 * 
 * 1. MOUSE/BUTTON KEYS (not keyboard events):
 *    - KEY_LBUTTON, KEY_RBUTTON, KEY_MBUTTON, KEY_XBUTTON1, KEY_XBUTTON2
 *    These are mouse button codes, not keyboard keys, so they don't belong in keyboard event mapping.
 * 
 * 2. ASIAN LANGUAGE INPUT KEYS (IME-specific):
 *    - KEY_KANA_HANGUL (Korean/Japanese Kana mode toggle)
 *    - KEY_HANJA (Korean Hanja conversion)
 *    - KEY_JUNJA, KEY_FINAL, KEY_KANJI (Japanese input method states)
 *    - KEY_CONVERT, KEY_NONCONVERT (IME text conversion)
 *    These require specialized Input Method Editor (IME) handling and are not standard keyboard events
 *    in web browsers. They would need platform-specific implementation.
 * 
 * 3. SYSTEM-LEVEL SPECIAL KEYS (not accessible in browsers):
 *    - KEY_ACCEPT, KEY_MODECHANGE (system mode changes)
 *    - KEY_SLEEP (system sleep key)
 *    - KEY_SEPARATOR (numpad separator, varies by locale)
 *    These are typically handled at the OS level and not exposed to web applications for security reasons.
 * 
 * 4. VENDOR-SPECIFIC KEYBOARD KEYS (Fujitsu/OASYS):
 *    - KEY_OEM_FJ_JISHO ('Dictionary' key on Fujitsu keyboards)
 *    - KEY_OEM_FJ_MASSHOU ('Unregister word' key)
 *    - KEY_OEM_FJ_TOUROKU ('Register word' key)
 *    - KEY_OEM_FJ_LOYA, KEY_OEM_FJ_ROYA ('Left/Right OYAYUBI' keys)
 *    These are specific to Fujitsu/OASYS keyboards and extremely rare in modern usage.
 * 
 * 5. BROWSER/MEDIA KEYS (may not be accessible or need special permission):
 *    - KEY_BROWSER_* (BACK, FORWARD, REFRESH, STOP, SEARCH, FAVORITES, HOME)
 *    - KEY_VOLUME_* (MUTE, DOWN, UP)
 *    - KEY_MEDIA_* (NEXT_TRACK, PREV_TRACK, STOP, PLAY_PAUSE)
 *    - KEY_LAUNCH_* (MAIL, MEDIA_SELECT, APP1, APP2)
 *    Modern browsers often block these for security or require special permissions. They may be
 *    handled by the browser itself rather than passed to web applications.
 * 
 * 6. EXTENDED/LEGACY OEM KEYS (rare or obsolete):
 *    - KEY_OEM_8 (varies by keyboard layout)
 *    - KEY_OEM_AX ('AX' key on Japanese AX keyboards - obsolete)
 *    - KEY_OEM_102 ("<>" or "\|" on 102-key RT keyboards - legacy)
 *    These are either obsolete or highly layout-specific and rarely encountered.
 * 
 * 7. INDUSTRIAL/SPECIALTY KEYS (ICO/Nokia/Ericsson terminals):
 *    - KEY_ICO_* (HELP, 00, CLEAR - ICO terminal keys)
 *    - KEY_OEM_* (RESET, JUMP, PA1-3, WSCTRL, CUSEL, ATTN, FINISH, COPY, AUTO, ENLW, BACKTAB)
 *    These were used in industrial terminals, mainframe systems, and specialized equipment.
 *    They are not present on modern consumer keyboards.
 * 
 * 8. SYSTEM/INTERNAL KEYS (not user-accessible):
 *    - KEY_PROCESSKEY (used internally by IME)
 *    - KEY_PACKET (used for Unicode character input)
 *    - KEY_ATTN, KEY_CRSEL, KEY_EXSEL, KEY_EREOF (mainframe terminal functions)
 *    - KEY_PLAY, KEY_ZOOM, KEY_NONAME, KEY_PA1, KEY_OEM_CLEAR (misc system functions)
 *    These are used internally by the system or for specialized applications.
 * 
 * 9. GENERIC MODIFIER KEYS (replaced by specific L/R variants):
 *    - KEY_SHIFT, KEY_CONTROL, KEY_MENU
 *    These generic versions are covered by their specific left/right variants (KEY_LSHIFT/KEY_RSHIFT, etc.)
 *    which provide more precise key identification.
 * 
 * The mapping focuses on keys that:
 * - Are present on standard modern keyboards
 * - Are accessible through web browser KeyboardEvent API
 * - Are commonly used in desktop applications
 * - Can be reliably detected across different platforms and browsers
 */
export function mapJavaScriptKeyToGacUIKey(event: KeyboardEvent): SCHEMA.TYPES.Key | null {
    // Try mapping by event.code first (physical key layout)
    const codeMapping = mapByEventCode(event.code);
    if (codeMapping !== null) {
        return codeMapping;
    }

    // Fallback to event.key (logical key)
    const keyMapping = mapByEventKey(event.key);
    if (keyMapping !== null) {
        return keyMapping;
    }

    // Last resort: try keyCode (deprecated but still works for basic keys)
    return mapByKeyCode(event.keyCode);
}

/**
 * Maps event.code (physical key) to GacUI Key
 */
function mapByEventCode(code: string): SCHEMA.TYPES.Key | null {
    const codeMap: Record<string, SCHEMA.TYPES.Key> = {
        // Letters
        'KeyA': SCHEMA.TYPES.Key.KEY_A,
        'KeyB': SCHEMA.TYPES.Key.KEY_B,
        'KeyC': SCHEMA.TYPES.Key.KEY_C,
        'KeyD': SCHEMA.TYPES.Key.KEY_D,
        'KeyE': SCHEMA.TYPES.Key.KEY_E,
        'KeyF': SCHEMA.TYPES.Key.KEY_F,
        'KeyG': SCHEMA.TYPES.Key.KEY_G,
        'KeyH': SCHEMA.TYPES.Key.KEY_H,
        'KeyI': SCHEMA.TYPES.Key.KEY_I,
        'KeyJ': SCHEMA.TYPES.Key.KEY_J,
        'KeyK': SCHEMA.TYPES.Key.KEY_K,
        'KeyL': SCHEMA.TYPES.Key.KEY_L,
        'KeyM': SCHEMA.TYPES.Key.KEY_M,
        'KeyN': SCHEMA.TYPES.Key.KEY_N,
        'KeyO': SCHEMA.TYPES.Key.KEY_O,
        'KeyP': SCHEMA.TYPES.Key.KEY_P,
        'KeyQ': SCHEMA.TYPES.Key.KEY_Q,
        'KeyR': SCHEMA.TYPES.Key.KEY_R,
        'KeyS': SCHEMA.TYPES.Key.KEY_S,
        'KeyT': SCHEMA.TYPES.Key.KEY_T,
        'KeyU': SCHEMA.TYPES.Key.KEY_U,
        'KeyV': SCHEMA.TYPES.Key.KEY_V,
        'KeyW': SCHEMA.TYPES.Key.KEY_W,
        'KeyX': SCHEMA.TYPES.Key.KEY_X,
        'KeyY': SCHEMA.TYPES.Key.KEY_Y,
        'KeyZ': SCHEMA.TYPES.Key.KEY_Z,

        // Numbers
        'Digit0': SCHEMA.TYPES.Key.KEY_0,
        'Digit1': SCHEMA.TYPES.Key.KEY_1,
        'Digit2': SCHEMA.TYPES.Key.KEY_2,
        'Digit3': SCHEMA.TYPES.Key.KEY_3,
        'Digit4': SCHEMA.TYPES.Key.KEY_4,
        'Digit5': SCHEMA.TYPES.Key.KEY_5,
        'Digit6': SCHEMA.TYPES.Key.KEY_6,
        'Digit7': SCHEMA.TYPES.Key.KEY_7,
        'Digit8': SCHEMA.TYPES.Key.KEY_8,
        'Digit9': SCHEMA.TYPES.Key.KEY_9,

        // Function keys
        'F1': SCHEMA.TYPES.Key.KEY_F1,
        'F2': SCHEMA.TYPES.Key.KEY_F2,
        'F3': SCHEMA.TYPES.Key.KEY_F3,
        'F4': SCHEMA.TYPES.Key.KEY_F4,
        'F5': SCHEMA.TYPES.Key.KEY_F5,
        'F6': SCHEMA.TYPES.Key.KEY_F6,
        'F7': SCHEMA.TYPES.Key.KEY_F7,
        'F8': SCHEMA.TYPES.Key.KEY_F8,
        'F9': SCHEMA.TYPES.Key.KEY_F9,
        'F10': SCHEMA.TYPES.Key.KEY_F10,
        'F11': SCHEMA.TYPES.Key.KEY_F11,
        'F12': SCHEMA.TYPES.Key.KEY_F12,
        'F13': SCHEMA.TYPES.Key.KEY_F13,
        'F14': SCHEMA.TYPES.Key.KEY_F14,
        'F15': SCHEMA.TYPES.Key.KEY_F15,
        'F16': SCHEMA.TYPES.Key.KEY_F16,
        'F17': SCHEMA.TYPES.Key.KEY_F17,
        'F18': SCHEMA.TYPES.Key.KEY_F18,
        'F19': SCHEMA.TYPES.Key.KEY_F19,
        'F20': SCHEMA.TYPES.Key.KEY_F20,
        'F21': SCHEMA.TYPES.Key.KEY_F21,
        'F22': SCHEMA.TYPES.Key.KEY_F22,
        'F23': SCHEMA.TYPES.Key.KEY_F23,
        'F24': SCHEMA.TYPES.Key.KEY_F24,

        // Arrow keys
        'ArrowLeft': SCHEMA.TYPES.Key.KEY_LEFT,
        'ArrowUp': SCHEMA.TYPES.Key.KEY_UP,
        'ArrowRight': SCHEMA.TYPES.Key.KEY_RIGHT,
        'ArrowDown': SCHEMA.TYPES.Key.KEY_DOWN,

        // Navigation keys
        'Home': SCHEMA.TYPES.Key.KEY_HOME,
        'End': SCHEMA.TYPES.Key.KEY_END,
        'PageUp': SCHEMA.TYPES.Key.KEY_PRIOR,
        'PageDown': SCHEMA.TYPES.Key.KEY_NEXT,
        'Insert': SCHEMA.TYPES.Key.KEY_INSERT,
        'Delete': SCHEMA.TYPES.Key.KEY_DELETE,

        // Special keys
        'Enter': SCHEMA.TYPES.Key.KEY_RETURN,
        'Space': SCHEMA.TYPES.Key.KEY_SPACE,
        'Tab': SCHEMA.TYPES.Key.KEY_TAB,
        'Backspace': SCHEMA.TYPES.Key.KEY_BACK,
        'Escape': SCHEMA.TYPES.Key.KEY_ESCAPE,

        // Modifier keys
        'ShiftLeft': SCHEMA.TYPES.Key.KEY_LSHIFT,
        'ShiftRight': SCHEMA.TYPES.Key.KEY_RSHIFT,
        'ControlLeft': SCHEMA.TYPES.Key.KEY_LCONTROL,
        'ControlRight': SCHEMA.TYPES.Key.KEY_RCONTROL,
        'AltLeft': SCHEMA.TYPES.Key.KEY_LMENU,
        'AltRight': SCHEMA.TYPES.Key.KEY_RMENU,
        'MetaLeft': SCHEMA.TYPES.Key.KEY_LWIN,
        'MetaRight': SCHEMA.TYPES.Key.KEY_RWIN,

        // Lock keys
        'CapsLock': SCHEMA.TYPES.Key.KEY_CAPITAL,
        'NumLock': SCHEMA.TYPES.Key.KEY_NUMLOCK,
        'ScrollLock': SCHEMA.TYPES.Key.KEY_SCROLL,

        // Numpad
        'Numpad0': SCHEMA.TYPES.Key.KEY_NUMPAD0,
        'Numpad1': SCHEMA.TYPES.Key.KEY_NUMPAD1,
        'Numpad2': SCHEMA.TYPES.Key.KEY_NUMPAD2,
        'Numpad3': SCHEMA.TYPES.Key.KEY_NUMPAD3,
        'Numpad4': SCHEMA.TYPES.Key.KEY_NUMPAD4,
        'Numpad5': SCHEMA.TYPES.Key.KEY_NUMPAD5,
        'Numpad6': SCHEMA.TYPES.Key.KEY_NUMPAD6,
        'Numpad7': SCHEMA.TYPES.Key.KEY_NUMPAD7,
        'Numpad8': SCHEMA.TYPES.Key.KEY_NUMPAD8,
        'Numpad9': SCHEMA.TYPES.Key.KEY_NUMPAD9,
        'NumpadDecimal': SCHEMA.TYPES.Key.KEY_DECIMAL,
        'NumpadDivide': SCHEMA.TYPES.Key.KEY_DIVIDE,
        'NumpadMultiply': SCHEMA.TYPES.Key.KEY_MULTIPLY,
        'NumpadSubtract': SCHEMA.TYPES.Key.KEY_SUBTRACT,
        'NumpadAdd': SCHEMA.TYPES.Key.KEY_ADD,
        'NumpadEnter': SCHEMA.TYPES.Key.KEY_RETURN,

        // Punctuation
        'Semicolon': SCHEMA.TYPES.Key.KEY_OEM_1,
        'Equal': SCHEMA.TYPES.Key.KEY_OEM_PLUS,
        'Comma': SCHEMA.TYPES.Key.KEY_OEM_COMMA,
        'Minus': SCHEMA.TYPES.Key.KEY_OEM_MINUS,
        'Period': SCHEMA.TYPES.Key.KEY_OEM_PERIOD,
        'Slash': SCHEMA.TYPES.Key.KEY_OEM_2,
        'Backquote': SCHEMA.TYPES.Key.KEY_OEM_3,
        'BracketLeft': SCHEMA.TYPES.Key.KEY_OEM_4,
        'Backslash': SCHEMA.TYPES.Key.KEY_OEM_5,
        'BracketRight': SCHEMA.TYPES.Key.KEY_OEM_6,
        'Quote': SCHEMA.TYPES.Key.KEY_OEM_7,

        // Other special keys
        'Pause': SCHEMA.TYPES.Key.KEY_PAUSE,
        'PrintScreen': SCHEMA.TYPES.Key.KEY_SNAPSHOT,
        'ContextMenu': SCHEMA.TYPES.Key.KEY_APPS,
    };

    return codeMap[code] ?? null;
}

/**
 * Maps event.key (logical key) to GacUI Key
 */
function mapByEventKey(key: string): SCHEMA.TYPES.Key | null {
    const keyMap: Record<string, SCHEMA.TYPES.Key> = {
        // Special keys that might not be caught by code mapping
        'Clear': SCHEMA.TYPES.Key.KEY_CLEAR,
        'Help': SCHEMA.TYPES.Key.KEY_HELP,
        'Select': SCHEMA.TYPES.Key.KEY_SELECT,
        'Print': SCHEMA.TYPES.Key.KEY_PRINT,
        'Execute': SCHEMA.TYPES.Key.KEY_EXECUTE,
        'Cancel': SCHEMA.TYPES.Key.KEY_CANCEL,

        // Fallback for basic keys (using logical names)
        'a': SCHEMA.TYPES.Key.KEY_A, 'A': SCHEMA.TYPES.Key.KEY_A,
        'b': SCHEMA.TYPES.Key.KEY_B, 'B': SCHEMA.TYPES.Key.KEY_B,
        'c': SCHEMA.TYPES.Key.KEY_C, 'C': SCHEMA.TYPES.Key.KEY_C,
        'd': SCHEMA.TYPES.Key.KEY_D, 'D': SCHEMA.TYPES.Key.KEY_D,
        'e': SCHEMA.TYPES.Key.KEY_E, 'E': SCHEMA.TYPES.Key.KEY_E,
        'f': SCHEMA.TYPES.Key.KEY_F, 'F': SCHEMA.TYPES.Key.KEY_F,
        'g': SCHEMA.TYPES.Key.KEY_G, 'G': SCHEMA.TYPES.Key.KEY_G,
        'h': SCHEMA.TYPES.Key.KEY_H, 'H': SCHEMA.TYPES.Key.KEY_H,
        'i': SCHEMA.TYPES.Key.KEY_I, 'I': SCHEMA.TYPES.Key.KEY_I,
        'j': SCHEMA.TYPES.Key.KEY_J, 'J': SCHEMA.TYPES.Key.KEY_J,
        'k': SCHEMA.TYPES.Key.KEY_K, 'K': SCHEMA.TYPES.Key.KEY_K,
        'l': SCHEMA.TYPES.Key.KEY_L, 'L': SCHEMA.TYPES.Key.KEY_L,
        'm': SCHEMA.TYPES.Key.KEY_M, 'M': SCHEMA.TYPES.Key.KEY_M,
        'n': SCHEMA.TYPES.Key.KEY_N, 'N': SCHEMA.TYPES.Key.KEY_N,
        'o': SCHEMA.TYPES.Key.KEY_O, 'O': SCHEMA.TYPES.Key.KEY_O,
        'p': SCHEMA.TYPES.Key.KEY_P, 'P': SCHEMA.TYPES.Key.KEY_P,
        'q': SCHEMA.TYPES.Key.KEY_Q, 'Q': SCHEMA.TYPES.Key.KEY_Q,
        'r': SCHEMA.TYPES.Key.KEY_R, 'R': SCHEMA.TYPES.Key.KEY_R,
        's': SCHEMA.TYPES.Key.KEY_S, 'S': SCHEMA.TYPES.Key.KEY_S,
        't': SCHEMA.TYPES.Key.KEY_T, 'T': SCHEMA.TYPES.Key.KEY_T,
        'u': SCHEMA.TYPES.Key.KEY_U, 'U': SCHEMA.TYPES.Key.KEY_U,
        'v': SCHEMA.TYPES.Key.KEY_V, 'V': SCHEMA.TYPES.Key.KEY_V,
        'w': SCHEMA.TYPES.Key.KEY_W, 'W': SCHEMA.TYPES.Key.KEY_W,
        'x': SCHEMA.TYPES.Key.KEY_X, 'X': SCHEMA.TYPES.Key.KEY_X,
        'y': SCHEMA.TYPES.Key.KEY_Y, 'Y': SCHEMA.TYPES.Key.KEY_Y,
        'z': SCHEMA.TYPES.Key.KEY_Z, 'Z': SCHEMA.TYPES.Key.KEY_Z,

        '0': SCHEMA.TYPES.Key.KEY_0,
        '1': SCHEMA.TYPES.Key.KEY_1,
        '2': SCHEMA.TYPES.Key.KEY_2,
        '3': SCHEMA.TYPES.Key.KEY_3,
        '4': SCHEMA.TYPES.Key.KEY_4,
        '5': SCHEMA.TYPES.Key.KEY_5,
        '6': SCHEMA.TYPES.Key.KEY_6,
        '7': SCHEMA.TYPES.Key.KEY_7,
        '8': SCHEMA.TYPES.Key.KEY_8,
        '9': SCHEMA.TYPES.Key.KEY_9,
    };

    return keyMap[key] ?? null;
}

/**
 * Maps keyCode (legacy) to GacUI Key
 * Used as last resort fallback
 */
function mapByKeyCode(keyCode: number): SCHEMA.TYPES.Key | null {
    // Basic ASCII mapping that usually works
    if (keyCode >= 65 && keyCode <= 90) { // A-Z
        return keyCode as SCHEMA.TYPES.Key;
    }
    if (keyCode >= 48 && keyCode <= 57) { // 0-9
        return keyCode as SCHEMA.TYPES.Key;
    }
    if (keyCode >= 112 && keyCode <= 123) { // F1-F12
        return keyCode as SCHEMA.TYPES.Key;
    }

    // Common special keys
    const keyCodeMap: Record<number, SCHEMA.TYPES.Key> = {
        8: SCHEMA.TYPES.Key.KEY_BACK,
        9: SCHEMA.TYPES.Key.KEY_TAB,
        13: SCHEMA.TYPES.Key.KEY_RETURN,
        16: SCHEMA.TYPES.Key.KEY_SHIFT,
        17: SCHEMA.TYPES.Key.KEY_CONTROL,
        18: SCHEMA.TYPES.Key.KEY_MENU,
        20: SCHEMA.TYPES.Key.KEY_CAPITAL,
        27: SCHEMA.TYPES.Key.KEY_ESCAPE,
        32: SCHEMA.TYPES.Key.KEY_SPACE,
        33: SCHEMA.TYPES.Key.KEY_PRIOR,
        34: SCHEMA.TYPES.Key.KEY_NEXT,
        35: SCHEMA.TYPES.Key.KEY_END,
        36: SCHEMA.TYPES.Key.KEY_HOME,
        37: SCHEMA.TYPES.Key.KEY_LEFT,
        38: SCHEMA.TYPES.Key.KEY_UP,
        39: SCHEMA.TYPES.Key.KEY_RIGHT,
        40: SCHEMA.TYPES.Key.KEY_DOWN,
        45: SCHEMA.TYPES.Key.KEY_INSERT,
        46: SCHEMA.TYPES.Key.KEY_DELETE,
    };

    return keyCodeMap[keyCode] ?? null;
}
