export type _Boolean = boolean;
export type _Integer = number;
export type _Float = number;
export type _Double = number;
export type _String = string;
export type _Char = string;
export type _Color = string; // #FFFFFF
export type _Binary = string; // base64 encoded

// GacUI\Source\GuiTypes.h
export enum _Key {
    /*
     * Virtual Keys, Standard Set
     */
    KEY_LBUTTON = 0x01,
    KEY_RBUTTON = 0x02,
    KEY_CANCEL = 0x03,
    KEY_MBUTTON = 0x04,             /* NOT contiguous with L & RBUTTON */
    KEY_XBUTTON1 = 0x05,            /* NOT contiguous with L & RBUTTON */
    KEY_XBUTTON2 = 0x06,            /* NOT contiguous with L & RBUTTON */
    KEY_BACK = 0x08,
    KEY_TAB = 0x09,
    KEY_CLEAR = 0x0C,
    KEY_RETURN = 0x0D,
    KEY_SHIFT = 0x10,
    KEY_CONTROL = 0x11,
    KEY_MENU = 0x12,
    KEY_PAUSE = 0x13,
    KEY_CAPITAL = 0x14,
    KEY_KANA_HANGUL = 0x15,
    KEY_JUNJA = 0x17,
    KEY_FINAL = 0x18,
    KEY_KANJI = 0x19,
    KEY_ESCAPE = 0x1B,
    KEY_CONVERT = 0x1C,
    KEY_NONCONVERT = 0x1D,
    KEY_ACCEPT = 0x1E,
    KEY_MODECHANGE = 0x1F,
    KEY_SPACE = 0x20,
    KEY_PRIOR = 0x21,
    KEY_NEXT = 0x22,
    KEY_END = 0x23,
    KEY_HOME = 0x24,
    KEY_LEFT = 0x25,
    KEY_UP = 0x26,
    KEY_RIGHT = 0x27,
    KEY_DOWN = 0x28,
    KEY_SELECT = 0x29,
    KEY_PRINT = 0x2A,
    KEY_EXECUTE = 0x2B,
    KEY_SNAPSHOT = 0x2C,
    KEY_INSERT = 0x2D,
    KEY_DELETE = 0x2E,
    KEY_HELP = 0x2F,

    /*
     * VKEY_0 - VKEY_9 are the same as ASCII '0' - '9' (0x30 - 0x39)
     * VKEY_A - VKEY_Z are the same as ASCII 'A' - 'Z' (0x41 - 0x5A)
     */
    KEY_0 = 0x30,
    KEY_1 = 0x31,
    KEY_2 = 0x32,
    KEY_3 = 0x33,
    KEY_4 = 0x34,
    KEY_5 = 0x35,
    KEY_6 = 0x36,
    KEY_7 = 0x37,
    KEY_8 = 0x38,
    KEY_9 = 0x39,
    KEY_A = 0x41,
    KEY_B = 0x42,
    KEY_C = 0x43,
    KEY_D = 0x44,
    KEY_E = 0x45,
    KEY_F = 0x46,
    KEY_G = 0x47,
    KEY_H = 0x48,
    KEY_I = 0x49,
    KEY_J = 0x4A,
    KEY_K = 0x4B,
    KEY_L = 0x4C,
    KEY_M = 0x4D,
    KEY_N = 0x4E,
    KEY_O = 0x4F,
    KEY_P = 0x50,
    KEY_Q = 0x51,
    KEY_R = 0x52,
    KEY_S = 0x53,
    KEY_T = 0x54,
    KEY_U = 0x55,
    KEY_V = 0x56,
    KEY_W = 0x57,
    KEY_X = 0x58,
    KEY_Y = 0x59,
    KEY_Z = 0x5A,
    KEY_LWIN = 0x5B,
    KEY_RWIN = 0x5C,
    KEY_APPS = 0x5D,
    KEY_SLEEP = 0x5F,
    KEY_NUMPAD0 = 0x60,
    KEY_NUMPAD1 = 0x61,
    KEY_NUMPAD2 = 0x62,
    KEY_NUMPAD3 = 0x63,
    KEY_NUMPAD4 = 0x64,
    KEY_NUMPAD5 = 0x65,
    KEY_NUMPAD6 = 0x66,
    KEY_NUMPAD7 = 0x67,
    KEY_NUMPAD8 = 0x68,
    KEY_NUMPAD9 = 0x69,
    KEY_MULTIPLY = 0x6A,
    KEY_ADD = 0x6B,
    KEY_SEPARATOR = 0x6C,
    KEY_SUBTRACT = 0x6D,
    KEY_DECIMAL = 0x6E,
    KEY_DIVIDE = 0x6F,
    KEY_F1 = 0x70,
    KEY_F2 = 0x71,
    KEY_F3 = 0x72,
    KEY_F4 = 0x73,
    KEY_F5 = 0x74,
    KEY_F6 = 0x75,
    KEY_F7 = 0x76,
    KEY_F8 = 0x77,
    KEY_F9 = 0x78,
    KEY_F10 = 0x79,
    KEY_F11 = 0x7A,
    KEY_F12 = 0x7B,
    KEY_F13 = 0x7C,
    KEY_F14 = 0x7D,
    KEY_F15 = 0x7E,
    KEY_F16 = 0x7F,
    KEY_F17 = 0x80,
    KEY_F18 = 0x81,
    KEY_F19 = 0x82,
    KEY_F20 = 0x83,
    KEY_F21 = 0x84,
    KEY_F22 = 0x85,
    KEY_F23 = 0x86,
    KEY_F24 = 0x87,
    KEY_NUMLOCK = 0x90,
    KEY_SCROLL = 0x91,
    
    /*
     * Fujitsu/OASYS kbd definitions
     */
    KEY_OEM_FJ_JISHO = 0x92,        /* 'Dictionary' key */
    KEY_OEM_FJ_MASSHOU = 0x93,      /* 'Unregister word' key */
    KEY_OEM_FJ_TOUROKU = 0x94,      /* 'Register word' key */
    KEY_OEM_FJ_LOYA = 0x95,         /* 'Left OYAYUBI' key */
    KEY_OEM_FJ_ROYA = 0x96,         /* 'Right OYAYUBI' key */

    /*
     * VKEY_L* & VKEY_R* - left and right Alt, Ctrl and Shift virtual keys.
     * Used only as parameters to GetAsyncKeyState() and GetKeyState().
     * No other API or message will distinguish left and right keys in this way.
     */
    KEY_LSHIFT = 0xA0,
    KEY_RSHIFT = 0xA1,
    KEY_LCONTROL = 0xA2,
    KEY_RCONTROL = 0xA3,
    KEY_LMENU = 0xA4,
    KEY_RMENU = 0xA5,
    KEY_BROWSER_BACK = 0xA6,
    KEY_BROWSER_FORWARD = 0xA7,
    KEY_BROWSER_REFRESH = 0xA8,
    KEY_BROWSER_STOP = 0xA9,
    KEY_BROWSER_SEARCH = 0xAA,
    KEY_BROWSER_FAVORITES = 0xAB,
    KEY_BROWSER_HOME = 0xAC,
    KEY_VOLUME_MUTE = 0xAD,
    KEY_VOLUME_DOWN = 0xAE,
    KEY_VOLUME_UP = 0xAF,
    KEY_MEDIA_NEXT_TRACK = 0xB0,
    KEY_MEDIA_PREV_TRACK = 0xB1,
    KEY_MEDIA_STOP = 0xB2,
    KEY_MEDIA_PLAY_PAUSE = 0xB3,
    KEY_LAUNCH_MAIL = 0xB4,
    KEY_LAUNCH_MEDIA_SELECT = 0xB5,
    KEY_LAUNCH_APP1 = 0xB6,
    KEY_LAUNCH_APP2 = 0xB7,
    KEY_OEM_PLUS = 0xBB,            /* '+' any country */
    KEY_OEM_COMMA = 0xBC,           /* ',' any country */
    KEY_OEM_MINUS = 0xBD,           /* '-' any country */
    KEY_OEM_PERIOD = 0xBE,          /* '.' any country */
    KEY_OEM_8 = 0xDF,

    /*
 * Various extended or enhanced keyboards
     */
    KEY_OEM_AX = 0xE1,              /* 'AX' key on Japanese AX kbd */
    KEY_OEM_102 = 0xE2,             /* "<>" or "\|" on RT 102-key kbd */
    KEY_ICO_HELP = 0xE3,            /* Help key on ICO */
    KEY_ICO_00 = 0xE4,              /* 00 key on ICO */
    KEY_PROCESSKEY = 0xE5,
    KEY_ICO_CLEAR = 0xE6,
    KEY_PACKET = 0xE7,

    /*
     * Nokia/Ericsson definitions
     */
    KEY_OEM_RESET = 0xE9,
    KEY_OEM_JUMP = 0xEA,
    KEY_OEM_PA1 = 0xEB,
    KEY_OEM_PA2 = 0xEC,
    KEY_OEM_PA3 = 0xED,
    KEY_OEM_WSCTRL = 0xEE,
    KEY_OEM_CUSEL = 0xEF,
    KEY_OEM_ATTN = 0xF0,
    KEY_OEM_FINISH = 0xF1,
    KEY_OEM_COPY = 0xF2,
    KEY_OEM_AUTO = 0xF3,
    KEY_OEM_ENLW = 0xF4,
    KEY_OEM_BACKTAB = 0xF5,
    KEY_ATTN = 0xF6,
    KEY_CRSEL = 0xF7,
    KEY_EXSEL = 0xF8,
    KEY_EREOF = 0xF9,
    KEY_PLAY = 0xFA,
    KEY_ZOOM = 0xFB,
    KEY_NONAME = 0xFC,
    KEY_PA1 = 0xFD,
    KEY_OEM_CLEAR = 0xFE,

    /*
     * Friendly names for common keys (US)
     */
    KEY_SEMICOLON = 0xBA,           /* OEM_1 */
    KEY_SLASH = 0xBF,               /* OEM_2 */
    KEY_GRAVE_ACCENT = 0xC0,        /* OEM_3 */
    KEY_RIGHT_BRACKET = 0xDB,       /* OEM_4 */
    KEY_BACKSLASH = 0xDC,           /* OEM_5 */
    KEY_LEFT_BRACKET = 0xDD,        /* OEM_6 */
    KEY_APOSTROPHE = 0xDE,          /* OEM_7 */

    /*
     * Additionals
     */
    KEY_OEM_1 = 0xBA,               /* ';:' for US */
    KEY_OEM_2 = 0xBF,               /* '/?' for US */
    KEY_OEM_3 = 0xC0,               /* '`~' for US */
    KEY_OEM_4 = 0xDB,               /* '[{' for US */
    KEY_OEM_5 = 0xDC,               /* '\|' for US */
    KEY_OEM_6 = 0xDD,               /* ']}' for US */
    KEY_OEM_7 = 0xDE,               /* ''"' for US */
    KEY_HANJA = 0x19,
}