Packages.Define("GacUI.Types", ["Class"], function (__injection__) {
    eval(__injection__);

    var Alignment = Enum("vl::presentation::Alignment", {
        Left: 0,
        Top: 1,
        Center: 2,
        Right: 3,
        Bottom: 4,
    });

    var TextPos = Struct("vl::presentation::TextPos", {
        row: 0,
        column: 0,
    });

    var GridPos = Struct("vl::presentation::GridPos", {
        row: 0,
        column: 0,
    });

    var Point = Struct("vl::presentation::Point", {
        x: 0,
        y: 0,
    });

    var Size = Struct("vl::presentation::Size", {
        cx: 0,
        cy: 0,
    });

    var Rect = Struct("vl::presentation::Rect", {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    });

    var __Hex = "0123456789ABCDEF";

    function __HexToInt(c) {
        var i = c.charCodeAt(0);
        if (48 <= i && i <= 57) return i - 48;
        if (65 <= i && i <= 70) return i - 55;
        throw new Error("\"" + c + "\" is not a valid hex number.");
    }

    function __ByteToHex(b) {
        if (0 <= b && b <= 255) {
            return __Hex[(b / 16) | 0] + __Hex[b % 16];
        }
        else {
            throw new Error("\"" + b + "\" is out of range [0, 255].");
        }
    }

    var __PrintColor = function () {
        return "#" +
            __ByteToHex(this.r) +
            __ByteToHex(this.g) +
            __ByteToHex(this.b) +
            (this.a == 255 ? "" : __ByteToHex(this.a))
        ;
    }

    var __ParseColor = function (text) {
        if (text.length != 7 && text.length != 9 && text[0] != '#') {
            throw new Error("\"" + text + "\" is not a valid string representation for type \"" + Color.FullName + "\".");
        }

        var color = new Color(
            __HexToInt(text[1]) * 16 + __HexToInt(text[2]),
            __HexToInt(text[3]) * 16 + __HexToInt(text[4]),
            __HexToInt(text[5]) * 16 + __HexToInt(text[6]),
            (text.length == 7 ? 255 : __HexToInt(text[7]) * 16 + __HexToInt(text[8]))
            );
        return color;
    }

    var Color = Struct("vl::presentation::Color", {
        r: 0,
        g: 0,
        b: 0,
        a: 255,
    }, __PrintColor, __ParseColor);

    var Margin = Struct("vl::presentation::Margin", {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    });

    var FontProperties = Struct("vl::presentation::FontProperties", {
        fontFamily: "",
        size: 0,
        bold: false,
        italic: false,
        underline: false,
        strikeline: false,
        antialias: true,
        verticalAntialias: false,
    });

    return {
        Alignment: Alignment,
        TextPos: TextPos,
        GridPos: GridPos,
        Point: Point,
        Size: Size,
        Rect: Rect,
        Color: Color,
        Margin: Margin,
        FontProperties: FontProperties,
    }
});