/***********************************************************************
Author: Zihan Chen (vczh)
Licensed under https://github.com/vczh-libraries/License
***********************************************************************/

#ifndef VCZH_TUI_TYPES
#define VCZH_TUI_TYPES

#include "../../Import/Vlpp.h"

namespace vl
{
	namespace presentation
	{
		/// <summary>
		/// Represents a position in the local window coordinate space, which is DPI awared.
		/// </summary>
		using GuiCoordinate = vint;

		/// <summary>
		/// Represents a position in the global screen coordinate space.
		/// </summary>
		struct NativeCoordinate
		{
			vint				value;

			NativeCoordinate() :value(0) {}
			NativeCoordinate(vint _value) :value(_value) {}
			NativeCoordinate(const NativeCoordinate& _value) = default;
			NativeCoordinate(NativeCoordinate&& _value) = default;
			NativeCoordinate& operator=(const NativeCoordinate& _value) = default;
			NativeCoordinate& operator=(NativeCoordinate&& _value) = default;

			auto operator<=>(const NativeCoordinate&) const = default;

			inline NativeCoordinate operator+(NativeCoordinate c)const { return value + c.value; };
			inline NativeCoordinate operator-(NativeCoordinate c)const { return value - c.value; };
			inline NativeCoordinate operator*(NativeCoordinate c)const { return value * c.value; };
			inline NativeCoordinate operator/(NativeCoordinate c)const { return value / c.value; };

			inline NativeCoordinate& operator+=(NativeCoordinate c) { value += c.value; return *this; };
			inline NativeCoordinate& operator-=(NativeCoordinate c) { value -= c.value; return *this; };
			inline NativeCoordinate& operator*=(NativeCoordinate c) { value *= c.value; return *this; };
			inline NativeCoordinate& operator/=(NativeCoordinate c) { value /= c.value; return *this; };
		};

		inline vint CompareCoordinate(vint a, vint b) { return a - b; }
		inline vint CompareCoordinate(NativeCoordinate a, NativeCoordinate b) { return a.value - b.value; }

#define GUI_DEFINE_KEYBOARD_CODE_BASIC(ITEM)									\
/*																				\
 * Virtual Keys, Standard Set													\
 */																				\
ITEM(LBUTTON,             0x01)													\
ITEM(RBUTTON,             0x02)													\
ITEM(CANCEL,              0x03)													\
ITEM(MBUTTON,             0x04)		/* NOT contiguous with L & RBUTTON */		\
ITEM(XBUTTON1,            0x05)		/* NOT contiguous with L & RBUTTON */		\
ITEM(XBUTTON2,            0x06)		/* NOT contiguous with L & RBUTTON */		\
ITEM(BACK,                0x08)													\
ITEM(TAB,                 0x09)													\
ITEM(CLEAR,               0x0C)													\
ITEM(RETURN,              0x0D)													\
ITEM(SHIFT,               0x10)													\
ITEM(CONTROL,             0x11)													\
ITEM(MENU,                0x12)													\
ITEM(PAUSE,               0x13)													\
ITEM(CAPITAL,             0x14)													\
ITEM(KANA_HANGUL,         0x15)													\
ITEM(JUNJA,               0x17)													\
ITEM(FINAL,               0x18)													\
ITEM(KANJI,               0x19)													\
ITEM(ESCAPE,              0x1B)													\
ITEM(CONVERT,             0x1C)													\
ITEM(NONCONVERT,          0x1D)													\
ITEM(ACCEPT,              0x1E)													\
ITEM(MODECHANGE,          0x1F)													\
ITEM(SPACE,               0x20)													\
ITEM(PRIOR,               0x21)													\
ITEM(NEXT,                0x22)													\
ITEM(END,                 0x23)													\
ITEM(HOME,                0x24)													\
ITEM(LEFT,                0x25)													\
ITEM(UP,                  0x26)													\
ITEM(RIGHT,               0x27)													\
ITEM(DOWN,                0x28)													\
ITEM(SELECT,              0x29)													\
ITEM(PRINT,               0x2A)													\
ITEM(EXECUTE,             0x2B)													\
ITEM(SNAPSHOT,            0x2C)													\
ITEM(INSERT,              0x2D)													\
ITEM(DELETE,              0x2E)													\
ITEM(HELP,                0x2F)													\
/*																				\
 * VKEY_0 - VKEY_9 are the same as ASCII '0' - '9' (0x30 - 0x39)				\
 * VKEY_A - VKEY_Z are the same as ASCII 'A' - 'Z' (0x41 - 0x5A)				\
 */																				\
ITEM(0,                   0x30)													\
ITEM(1,                   0x31)													\
ITEM(2,                   0x32)													\
ITEM(3,                   0x33)													\
ITEM(4,                   0x34)													\
ITEM(5,                   0x35)													\
ITEM(6,                   0x36)													\
ITEM(7,                   0x37)													\
ITEM(8,                   0x38)													\
ITEM(9,                   0x39)													\
ITEM(A,                   0x41)													\
ITEM(B,                   0x42)													\
ITEM(C,                   0x43)													\
ITEM(D,                   0x44)													\
ITEM(E,                   0x45)													\
ITEM(F,                   0x46)													\
ITEM(G,                   0x47)													\
ITEM(H,                   0x48)													\
ITEM(I,                   0x49)													\
ITEM(J,                   0x4A)													\
ITEM(K,                   0x4B)													\
ITEM(L,                   0x4C)													\
ITEM(M,                   0x4D)													\
ITEM(N,                   0x4E)													\
ITEM(O,                   0x4F)													\
ITEM(P,                   0x50)													\
ITEM(Q,                   0x51)													\
ITEM(R,                   0x52)													\
ITEM(S,                   0x53)													\
ITEM(T,                   0x54)													\
ITEM(U,                   0x55)													\
ITEM(V,                   0x56)													\
ITEM(W,                   0x57)													\
ITEM(X,                   0x58)													\
ITEM(Y,                   0x59)													\
ITEM(Z,                   0x5A)													\
ITEM(LWIN,                0x5B)													\
ITEM(RWIN,                0x5C)													\
ITEM(APPS,                0x5D)													\
ITEM(SLEEP,               0x5F)													\
ITEM(NUMPAD0,             0x60)													\
ITEM(NUMPAD1,             0x61)													\
ITEM(NUMPAD2,             0x62)													\
ITEM(NUMPAD3,             0x63)													\
ITEM(NUMPAD4,             0x64)													\
ITEM(NUMPAD5,             0x65)													\
ITEM(NUMPAD6,             0x66)													\
ITEM(NUMPAD7,             0x67)													\
ITEM(NUMPAD8,             0x68)													\
ITEM(NUMPAD9,             0x69)													\
ITEM(MULTIPLY,            0x6A)													\
ITEM(ADD,                 0x6B)													\
ITEM(SEPARATOR,           0x6C)													\
ITEM(SUBTRACT,            0x6D)													\
ITEM(DECIMAL,             0x6E)													\
ITEM(DIVIDE,              0x6F)													\
ITEM(F1,                  0x70)													\
ITEM(F2,                  0x71)													\
ITEM(F3,                  0x72)													\
ITEM(F4,                  0x73)													\
ITEM(F5,                  0x74)													\
ITEM(F6,                  0x75)													\
ITEM(F7,                  0x76)													\
ITEM(F8,                  0x77)													\
ITEM(F9,                  0x78)													\
ITEM(F10,                 0x79)													\
ITEM(F11,                 0x7A)													\
ITEM(F12,                 0x7B)													\
ITEM(F13,                 0x7C)													\
ITEM(F14,                 0x7D)													\
ITEM(F15,                 0x7E)													\
ITEM(F16,                 0x7F)													\
ITEM(F17,                 0x80)													\
ITEM(F18,                 0x81)													\
ITEM(F19,                 0x82)													\
ITEM(F20,                 0x83)													\
ITEM(F21,                 0x84)													\
ITEM(F22,                 0x85)													\
ITEM(F23,                 0x86)													\
ITEM(F24,                 0x87)													\
ITEM(NUMLOCK,             0x90)													\
ITEM(SCROLL,              0x91)													\
/*																				\
 * Fujitsu/OASYS kbd definitions												\
 */																				\
ITEM(OEM_FJ_JISHO,        0x92)		/* 'Dictionary' key */						\
ITEM(OEM_FJ_MASSHOU,      0x93)		/* 'Unregister word' key */					\
ITEM(OEM_FJ_TOUROKU,      0x94)		/* 'Register word' key */					\
ITEM(OEM_FJ_LOYA,         0x95)		/* 'Left OYAYUBI' key */					\
ITEM(OEM_FJ_ROYA,         0x96)		/* 'Right OYAYUBI' key */					\
/*																				\
 * VKEY_L* & VKEY_R* - left and right Alt, Ctrl and Shift virtual keys.			\
 * Used only as parameters to GetAsyncKeyState() and GetKeyState().				\
 * No other API or message will distinguish left and right keys in this way.	\
 */																				\
ITEM(LSHIFT,              0xA0)													\
ITEM(RSHIFT,              0xA1)													\
ITEM(LCONTROL,            0xA2)													\
ITEM(RCONTROL,            0xA3)													\
ITEM(LMENU,               0xA4)													\
ITEM(RMENU,               0xA5)													\
ITEM(BROWSER_BACK,        0xA6)													\
ITEM(BROWSER_FORWARD,     0xA7)													\
ITEM(BROWSER_REFRESH,     0xA8)													\
ITEM(BROWSER_STOP,        0xA9)													\
ITEM(BROWSER_SEARCH,      0xAA)													\
ITEM(BROWSER_FAVORITES,   0xAB)													\
ITEM(BROWSER_HOME,        0xAC)													\
ITEM(VOLUME_MUTE,         0xAD)													\
ITEM(VOLUME_DOWN,         0xAE)													\
ITEM(VOLUME_UP,           0xAF)													\
ITEM(MEDIA_NEXT_TRACK,    0xB0)													\
ITEM(MEDIA_PREV_TRACK,    0xB1)													\
ITEM(MEDIA_STOP,          0xB2)													\
ITEM(MEDIA_PLAY_PAUSE,    0xB3)													\
ITEM(LAUNCH_MAIL,         0xB4)													\
ITEM(LAUNCH_MEDIA_SELECT, 0xB5)													\
ITEM(LAUNCH_APP1,         0xB6)													\
ITEM(LAUNCH_APP2,         0xB7)													\
ITEM(OEM_PLUS,            0xBB)		/* '+' any country */						\
ITEM(OEM_COMMA,           0xBC)		/* ',' any country */						\
ITEM(OEM_MINUS,           0xBD)		/* '-' any country */						\
ITEM(OEM_PERIOD,          0xBE)		/* '.' any country */						\
ITEM(OEM_8,               0xDF)													\
/*																				\
 * Various extended or enhanced keyboards										\
 */																				\
ITEM(OEM_AX,              0xE1)		/* 'AX' key on Japanese AX kbd */			\
ITEM(OEM_102,             0xE2)		/* "<>" or "\|" on RT 102-key kbd */		\
ITEM(ICO_HELP,            0xE3)		/* Help key on ICO */						\
ITEM(ICO_00,              0xE4)		/* 00 key on ICO */							\
ITEM(PROCESSKEY,          0xE5)													\
ITEM(ICO_CLEAR,           0xE6)													\
ITEM(PACKET,              0xE7)													\
/*																				\
 * Nokia/Ericsson definitions													\
 */																				\
ITEM(OEM_RESET,           0xE9)													\
ITEM(OEM_JUMP,            0xEA)													\
ITEM(OEM_PA1,             0xEB)													\
ITEM(OEM_PA2,             0xEC)													\
ITEM(OEM_PA3,             0xED)													\
ITEM(OEM_WSCTRL,          0xEE)													\
ITEM(OEM_CUSEL,           0xEF)													\
ITEM(OEM_ATTN,            0xF0)													\
ITEM(OEM_FINISH,          0xF1)													\
ITEM(OEM_COPY,            0xF2)													\
ITEM(OEM_AUTO,            0xF3)													\
ITEM(OEM_ENLW,            0xF4)													\
ITEM(OEM_BACKTAB,         0xF5)													\
ITEM(ATTN,                0xF6)													\
ITEM(CRSEL,               0xF7)													\
ITEM(EXSEL,               0xF8)													\
ITEM(EREOF,               0xF9)													\
ITEM(PLAY,                0xFA)													\
ITEM(ZOOM,                0xFB)													\
ITEM(NONAME,              0xFC)													\
ITEM(PA1,                 0xFD)													\
ITEM(OEM_CLEAR,           0xFE)													\
/*																				\
 * Friendly names for common keys (US)											\
 */																				\
ITEM(SEMICOLON,           0xBA)		/* OEM_1 */									\
ITEM(SLASH,               0xBF)		/* OEM_2 */									\
ITEM(GRAVE_ACCENT,        0xC0)		/* OEM_3 */									\
ITEM(LEFT_BRACKET,        0xDB)		/* OEM_4 */									\
ITEM(BACKSLASH,           0xDC)		/* OEM_5 */									\
ITEM(RIGHT_BRACKET,       0xDD)		/* OEM_6 */									\
ITEM(APOSTROPHE,          0xDE)		/* OEM_7 */									\

#define GUI_DEFINE_KEYBOARD_CODE_ADDITIONAL(ITEM)								\
ITEM(OEM_1,               0xBA)		/* ';:' for US */							\
ITEM(OEM_2,               0xBF)		/* '/?' for US */							\
ITEM(OEM_3,               0xC0)		/* '`~' for US */							\
ITEM(OEM_4,               0xDB)		/* '[{' for US */							\
ITEM(OEM_5,               0xDC)		/* '\|' for US */							\
ITEM(OEM_6,               0xDD)		/* ']}' for US */							\
ITEM(OEM_7,               0xDE)		/* ''"' for US */							\
ITEM(HANJA,               0x19)													\
/*																				\
 * NEC PC-9800 kbd definitions													\
 */																				\
ITEM(OEM_NEC_EQUAL,       0x92)		/* '=' key on numpad */						\

#define GUI_DEFINE_KEYBOARD_CODE(ITEM)											\
			GUI_DEFINE_KEYBOARD_CODE_BASIC(ITEM)								\
			GUI_DEFINE_KEYBOARD_CODE_ADDITIONAL(ITEM)							\


#define GUI_DEFINE_KEYBOARD_CODE_ENUM_ITEM(NAME, CODE) KEY_##NAME = CODE,
		enum class VKEY
		{
			KEY_UNKNOWN = -1,
			KEY_MAXIMUM = 255,
			GUI_DEFINE_KEYBOARD_CODE(GUI_DEFINE_KEYBOARD_CODE_ENUM_ITEM)
		};
#undef GUI_DEFINE_KEYBOARD_CODE_ENUM_ITEM
		static auto operator <=> (VKEY a, VKEY b) { return (vint)a <=> (vint)b; }
		static VKEY operator &  (VKEY a, VKEY b) { return (VKEY)((vint)a & (vint)b); }
		static VKEY operator |  (VKEY a, VKEY b) { return (VKEY)((vint)a | (vint)b); }



		/// <summary>
		/// Mouse message information.
		/// </summary>
		enum class NativeMouseButton
		{
			Left,
			Middle,
			Right,
			Mouse4,
			Mouse5,
		};

		/// <typeparam name="T">Type of the coordinate.</typeparam>
		template<typename T>
		struct WindowMouseInfo_
		{
			/// <summary>True if the control button is pressed.</summary>
			bool						ctrl = false;
			/// <summary>True if the shift button is pressed.</summary>
			bool						shift = false;
			/// <summary>True if the alt button is pressed.</summary>
			bool						alt = false;
			/// <summary>True if the operating system Super button is pressed.</summary>
			bool						osSuper = false;
			/// <summary>True if the left mouse button is pressed.</summary>
			bool						left = false;
			/// <summary>True if the middle mouse button is pressed.</summary>
			bool						middle = false;
			/// <summary>True if the right mouse button is pressed.</summary>
			bool						right = false;
			/// <summary>The mouse position of x dimension.</summary>
			T							x = {};
			/// <summary>The mouse position of y dimension.</summary>
			T							y = {};
			/// <summary>The delta of the wheel. 120 for every tick, position for up/right, negative for down/left</summary>
			vint						wheel = 0;
			/// <summary>True if the mouse is in the non-client area.</summary>
			bool						nonClient = false;
		};

		using WindowMouseInfo = WindowMouseInfo_<GuiCoordinate>;
		using NativeWindowMouseInfo = WindowMouseInfo_<NativeCoordinate>;

		/// <summary>
		/// Key message information.
		/// </summary>
		struct NativeWindowKeyInfo
		{
			/// <summary>Key code of the key that sends this message.</summary>
			VKEY						code = VKEY::KEY_UNKNOWN;
			/// <summary>True if the control button is pressed.</summary>
			bool						ctrl = false;
			/// <summary>True if the shift button is pressed.</summary>
			bool						shift = false;
			/// <summary>True if the alt button is pressed.</summary>
			bool						alt = false;
			/// <summary>True if the operating system Super button is pressed.</summary>
			bool						osSuper = false;
			/// <summary>True if the capslock button is pressed.</summary>
			bool						capslock = false;
			/// <summary>True if this repeated event is generated because a key is holding down.</summary>
			bool						autoRepeatKeyDown = false;
		};

		using WindowKeyInfo = NativeWindowKeyInfo;

		/// <summary>
		/// Character message information.
		/// </summary>
		struct NativeWindowCharInfo
		{
			/// <summary>Character that sends this message.</summary>
			wchar_t						code = 0;
			/// <summary>True if the control button is pressed.</summary>
			bool						ctrl = false;
			/// <summary>True if the shift button is pressed.</summary>
			bool						shift = false;
			/// <summary>True if the alt button is pressed.</summary>
			bool						alt = false;
			/// <summary>True if the operating system Super button is pressed.</summary>
			bool						osSuper = false;
			/// <summary>True if the capslock button is pressed.</summary>
			bool						capslock = false;
		};

		using WindowCharInfo = NativeWindowCharInfo;
	}
}

#endif
