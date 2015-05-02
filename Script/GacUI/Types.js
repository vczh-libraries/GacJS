Packages.Define("GacUI.Types", function () {

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
        x: 0,
        y: 0,
    });

    var Rect = Struct("vl::presentation::Rect", {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    });

    var __PrintColor = function (color) {

    }

    var __ParseColor = function (text) {

    }

    var Color = Struct("vl::presentation::Color", {
        r: 0,
        g: 0,
        b: 0,
        a: 0,
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