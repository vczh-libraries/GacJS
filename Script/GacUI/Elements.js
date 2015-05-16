Packages.Define("GacUI.Elements", ["Class", "GacUI.Types"], function (__injection__) {
    eval(__injection__);

    function FQN(name) {
        return "vl::presentation::elements::Gui" + name + "Element";
    }

    var IElement = Class("vl::presentation::elements::IGuiGraphicsElement", {

        htmlElement: Protected(null),

        gacjs_InstallElement: Public.Virtual(function (graphElement) {
            graphElement.appendChild(this.htmlElement);
        }),

        gacjs_UninstallElement: Public.Virtual(function (graphElement) {
            grapyElement.removeChild(this.htmlElement);
        }),
    });

    var ElementShape = Enum("vl::presentation::elements::ElementShape", {
        Rectangle: 0,
        Ellipse: 1,
    });

    /********************************************************************************
    SolidBorder
    ********************************************************************************/

    var SolidBorder = Class(FQN("SolidBorder"), IElement, {

        color: Protected(new Color()),
        shape: Protected(ElementShape.Description.Rectangle),

        UpdateStyle: Protected(function () {
            this.htmlElement.style.borderColor = this.color.__ToString();
            switch (this.shape) {
                case ElementShape.Description.Rectangle:
                    this.htmlElement.style.borderRadius = "";
                    break;
                case ElementShape.Description.Ellipse:
                    this.htmlElement.style.borderRadius = "50%";
                    break;
            }
        }),

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "block";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "calc(100% - 2px)";
            this.htmlElement.style.height = "calc(100% - 2px)";
            this.htmlElement.style.borderStyle = "solid";
            this.htmlElement.style.borderWidth = "1px";
            this.UpdateStyle();
        }),

        GetColor: Public.StrongTyped(Color, [], function () {
            return this.color;
        }),
        SetColor: Public.StrongTyped(__Void, [Color], function (value) {
            this.color = value;
            this.UpdateStyle();
        }),
        Color: Public.Property({}),

        GetShape: Public.StrongTyped(ElementShape, [], function () {
            return this.shape;
        }),
        SetShape: Public.StrongTyped(__Void, [ElementShape], function (value) {
            this.shape = value;
            this.UpdateStyle();
        }),
        Shape: Public.Property({}),
    });

    /********************************************************************************
    RoundBorder
    ********************************************************************************/

    var RoundBorder = Class(FQN("RoundBorder"), IElement, {

        color: Protected(new Color()),
        radius: Protected(0.0),

        UpdateStyle: Protected(function () {
            this.htmlElement.style.borderColor = this.color.__ToString();
            this.htmlElement.style.borderRadius = this.radius + "px";
        }),

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "block";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "calc(100% - 2px)";
            this.htmlElement.style.height = "calc(100% - 2px)";
            this.htmlElement.style.borderStyle = "solid";
            this.htmlElement.style.borderWidth = "1px";
            this.UpdateStyle();
        }),

        GetColor: Public.StrongTyped(Color, [], function () {
            return this.color;
        }),
        SetColor: Public.StrongTyped(__Void, [Color], function (value) {
            this.color = value;
            this.UpdateStyle();
        }),
        Color: Public.Property({}),

        GetRadius: Public.StrongTyped(__Number, [], function () {
            return this.radius;
        }),
        SetRadius: Public.StrongTyped(__Void, [__Number], function (value) {
            this.radius = value;
            this.UpdateStyle();
        }),
        Radius: Public.Property({}),
    });

    /********************************************************************************
    ThreeDBorder
    ********************************************************************************/

    var ThreeDBorder = Class(FQN("3DBorder"), IElement, {

        color1: Protected(new Color()),
        color2: Protected(new Color()),

        UpdateStyle: Protected(function () {
            this.htmlElement.style.borderLeftColor = this.color1.__ToString();
            this.htmlElement.style.borderTopColor = this.color1.__ToString();
            this.htmlElement.style.borderRightColor = this.color2.__ToString();
            this.htmlElement.style.borderBottomColor = this.color2.__ToString();
        }),

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "block";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "calc(100% - 2px)";
            this.htmlElement.style.height = "calc(100% - 2px)";
            this.htmlElement.style.borderStyle = "solid";
            this.htmlElement.style.borderWidth = "1px";
            this.UpdateStyle();
        }),

        GetColor1: Public.StrongTyped(Color, [], function () {
            return this.color1;
        }),
        SetColor1: Public.StrongTyped(__Void, [Color], function (value) {
            this.color1 = value;
            this.UpdateStyle();
        }),
        Color1: Public.Property({}),

        GetColor2: Public.StrongTyped(Color, [], function () {
            return this.color2;
        }),
        SetColor2: Public.StrongTyped(__Void, [Color], function (value) {
            this.color2 = value;
            this.UpdateStyle();
        }),
        Color2: Public.Property({}),

        SetColors: Public.StrongTyped(__Void, [Color, Color], function (value1, value2) {
            this.color1 = value1;
            this.color2 = value2;
            this.UpdateStyle();
        }),
    });

    /********************************************************************************
    ThreeDSplitter
    ********************************************************************************/

    var ThreeDSplitterDirection = Enum("vl::presentation::elements::Gui3DSplitterElement::Direction", {
        Horizontal: 0,
        Vertical: 1,
    });

    var ThreeDSplitter = Class(FQN("3DSplitter"), IElement, {

        splitterHtmlElement: Protected(null),
        color1: Protected(new Color()),
        color2: Protected(new Color()),
        direction: Protected(ThreeDSplitterDirection.Description.Horizontal),

        UpdateStyle: Protected(function () {
            this.splitterHtmlElement.style.borderLeftColor = this.color1.__ToString();
            this.splitterHtmlElement.style.borderTopColor = this.color1.__ToString();
            this.splitterHtmlElement.style.borderRightColor = this.color2.__ToString();
            this.splitterHtmlElement.style.borderBottomColor = this.color2.__ToString();
            switch (this.direction) {
                case ThreeDSplitterDirection.Description.Horizontal:
                    this.htmlElement.style.flexDirection = "column";
                    this.splitterHtmlElement.style.width = "calc(100% - 2px)";
                    this.splitterHtmlElement.style.height = "0";
                    break;
                case ThreeDSplitterDirection.Description.Vertical:
                    this.htmlElement.style.flexDirection = "row";
                    this.splitterHtmlElement.style.width = "0";
                    this.splitterHtmlElement.style.height = "calc(100% - 2px)";
                    break;
            }
        }),

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "flex";
            this.htmlElement.style.justifyContent = "center";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "100%";
            this.htmlElement.style.height = "100%";

            this.splitterHtmlElement = document.createElement("div");
            this.splitterHtmlElement.style.display = "block";
            this.splitterHtmlElement.style.position = "relative";
            this.splitterHtmlElement.style.borderStyle = "solid";
            this.splitterHtmlElement.style.borderWidth = "1px";
            this.htmlElement.appendChild(this.splitterHtmlElement);
            this.UpdateStyle();
        }),

        GetColor1: Public.StrongTyped(Color, [], function () {
            return this.color1;
        }),
        SetColor1: Public.StrongTyped(__Void, [Color], function (value) {
            this.color1 = value;
            this.UpdateStyle();
        }),
        Color1: Public.Property({}),

        GetColor2: Public.StrongTyped(Color, [], function () {
            return this.color2;
        }),
        SetColor2: Public.StrongTyped(__Void, [Color], function (value) {
            this.color2 = value;
            this.UpdateStyle();
        }),
        Color2: Public.Property({}),

        SetColors: Public.StrongTyped(__Void, [Color, Color], function (value1, value2) {
            this.color1 = value1;
            this.color2 = value2;
            this.UpdateStyle();
        }),

        GetDirection: Public.StrongTyped(ThreeDSplitterDirection, [], function () {
            return this.direction;
        }),
        SetDirection: Public.StrongTyped(__Void, [ThreeDSplitterDirection], function (value) {
            this.direction = value;
            this.UpdateStyle();
        }),
        Direction: Public.Property({}),
    });

    /********************************************************************************
    SolidBackground
    ********************************************************************************/

    var SolidBackground = Class(FQN("SolidBackground"), IElement, {

        color: Protected(new Color()),
        shape: Protected(ElementShape.Description.Rectangle),

        UpdateStyle: Protected(function () {
            this.htmlElement.style.backgroundColor = this.color.__ToString();
            switch (this.shape) {
                case ElementShape.Description.Rectangle:
                    this.htmlElement.style.borderRadius = "";
                    break;
                case ElementShape.Description.Ellipse:
                    this.htmlElement.style.borderRadius = "50%";
                    break;
            }
        }),

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "block";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "100%";
            this.htmlElement.style.height = "100%";
            this.htmlElement.style.backgroundStyle = "solid";
            this.UpdateStyle();
        }),

        GetColor: Public.StrongTyped(Color, [], function () {
            return this.color;
        }),
        SetColor: Public.StrongTyped(__Void, [Color], function (value) {
            this.color = value;
            this.UpdateStyle();
        }),
        Color: Public.Property({}),

        GetShape: Public.StrongTyped(ElementShape, [], function () {
            return this.shape;
        }),
        SetShape: Public.StrongTyped(__Void, [ElementShape], function (value) {
            this.shape = value;
            this.UpdateStyle();
        }),
        Shape: Public.Property({}),
    });

    /********************************************************************************
    GradientBackground
    ********************************************************************************/

    var GradientBackgroundrDirection = Enum("vl::presentation::elements::GuiGradientBackgroundElement::Direction", {
        Horizontal: 0,
        Vertical: 1,
        Slash: 2,
        Backslash: 2,
    });

    var GradientBackground = Class(FQN("GradientBackground"), IElement, {

        color1: Protected(new Color()),
        color2: Protected(new Color()),
        direction: Protected(GradientBackgroundrDirection.Description.Horizontal),
        shape: Protected(ElementShape.Description.Rectangle),

        UpdateStyle: Protected(function () {
            var colorStop1 = this.color1.__ToString();
            var colorStop2 = this.color2.__ToString();
            switch (this.direction) {
                case GradientBackgroundrDirection.Description.Horizontal:
                    var side = "right";
                    break;
                case GradientBackgroundrDirection.Description.Vertical:
                    var side = "bottom";
                    break;
                case GradientBackgroundrDirection.Description.Slash:
                    var side = "left bottom";
                    break;
                case GradientBackgroundrDirection.Description.Backslash:
                    var side = "right bottom";
                    break;
            }
            this.htmlElement.style.background = "linear-gradient(to " + side + ", " + colorStop1 + " 0%, " + colorStop2 + " 100%)";
            switch (this.shape) {
                case ElementShape.Description.Rectangle:
                    this.htmlElement.style.borderRadius = "";
                    break;
                case ElementShape.Description.Ellipse:
                    this.htmlElement.style.borderRadius = "50%";
                    break;
            }
        }),

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "block";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "100%";
            this.htmlElement.style.height = "100%";
            this.htmlElement.style.backgroundStyle = "solid";
            this.UpdateStyle();
        }),

        GetColor1: Public.StrongTyped(Color, [], function () {
            return this.color1;
        }),
        SetColor1: Public.StrongTyped(__Void, [Color], function (value) {
            this.color1 = value;
            this.UpdateStyle();
        }),
        Color1: Public.Property({}),

        GetColor2: Public.StrongTyped(Color, [], function () {
            return this.color2;
        }),
        SetColor2: Public.StrongTyped(__Void, [Color], function (value) {
            this.color2 = value;
            this.UpdateStyle();
        }),
        Color2: Public.Property({}),

        SetColors: Public.StrongTyped(__Void, [Color, Color], function (value1, value2) {
            this.color1 = value1;
            this.color2 = value2;
            this.UpdateStyle();
        }),

        GetDirection: Public.StrongTyped(GradientBackgroundrDirection, [], function () {
            return this.direction;
        }),
        SetDirection: Public.StrongTyped(__Void, [GradientBackgroundrDirection], function (value) {
            this.direction = value;
            this.UpdateStyle();
        }),
        Direction: Public.Property({}),

        GetShape: Public.StrongTyped(ElementShape, [], function () {
            return this.shape;
        }),
        SetShape: Public.StrongTyped(__Void, [ElementShape], function (value) {
            this.shape = value;
            this.UpdateStyle();
        }),
        Shape: Public.Property({}),
    });

    /********************************************************************************
    SolidLabel
    ********************************************************************************/

    var SolidLabel = Class(FQN("SolidLabel"), IElement, {

        color: Protected(new Color()),
        font: Protected(new FontProperties()),
        text: Protected(""),
        horizontalAlignment: Protected(Alignment.Description.Left),
        verticalAlignment: Protected(Alignment.Description.Top),
        wrapLine: Protected(false),
        ellipse: Protected(false),
        multiline: Protected(false),
        wrapLineHeightCalculation: Protected(false),

        textHtmlElement:Protected(null),
        textHtmlNode: Protected(null),

        UpdateStyleInternal: Protected(function (textElement, textNode) {
            textNode.textContent = this.text;

            textElement.style.color = this.color.__ToString();
            textElement.style.fontFamily = "'" + this.font.fontFamily + "'";
            textElement.style.fontSize = this.font.size + "px";
            textElement.style.fontWeight = (this.font.bold ? "bold" : "normal");
            textElement.style.fontStyle = (this.font.italic ? "italic" : "normal");
            textElement.style.textDecoration = (this.font.underline ? "underline" : "");
        }),

        UpdateStyle: Protected(function () {
            switch(this.horizontalAlignment)
            {
                case Alignment.Description.Left:
                    this.htmlElement.style.gridColumns = "0px auto 1fr";
                    this.htmlElement.style.msGridColumns = "0px auto 1fr";
                    break;
                case Alignment.Description.Right:
                    this.htmlElement.style.gridColumns = "1fr auto 0px";
                    this.htmlElement.style.msGridColumns = "1fr auto 0px";
                    break;
                default:
                    this.htmlElement.style.gridColumns = "1fr auto 1fr";
                    this.htmlElement.style.msGridColumns = "1fr auto 1fr";
                    break;
            }

            switch (this.verticalAlignment) {
                case Alignment.Description.Top:
                    this.htmlElement.style.gridRows = "0px auto 1fr";
                    this.htmlElement.style.msGridRows = "0px auto 1fr";
                    break;
                case Alignment.Description.Bottom:
                    this.htmlElement.style.gridRows = "1fr auto 0px";
                    this.htmlElement.style.msGridRows = "1fr auto 0px";
                    break;
                default:
                    this.htmlElement.style.gridRows = "1fr auto 1fr";
                    this.htmlElement.style.msGridRows = "1fr auto 1fr";
                    break;
            }

            this.htmlElement.style.color = this.color.__ToString();
            this.htmlElement.style.textDecoration = (this.font.strikeline ? "line-through" : "");
            this.UpdateStyleInternal(this.textHtmlElement, this.textHtmlNode);
        }),

        CreateTextElement:Protected(function(){
            var node = document.createElement("div");
            node.style.display = "block";
            node.style.position = "relative";
            node.style.width = "100%";
            node.style.height = "100%";
            return node;
        }),

        CreateTextNode: Protected(function () {
            var node = document.createTextNode("");
            return node;
        }),

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "grid";
            this.htmlElement.style.display = "-ms-grid";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "100%";
            this.htmlElement.style.height = "100%";

            this.htmlElement.style.gridRows = "1fr auto 1fr";
            this.htmlElement.style.msGridRows = "1fr auto 1fr";

            this.htmlElement.style.gridColumns = "1fr auto 1fr";
            this.htmlElement.style.msGridColumns = "1fr auto 1fr";

            this.textHtmlElement = this.CreateTextElement();
            this.textHtmlElement.style.gridRow = "2";
            this.textHtmlElement.style.msGridRow = "2";
            this.textHtmlElement.style.gridColumn = "2";
            this.textHtmlElement.style.msGridColumn = "2";

            this.textHtmlNode = this.CreateTextNode();

            this.textHtmlElement.appendChild(this.textHtmlNode);
            this.htmlElement.appendChild(this.textHtmlElement);
            this.UpdateStyle();
        }),

        GetColor: Public(function () {
            return this.color;
        }),
        SetColor: Public(function (value) {
            this.color = value;
            this.UpdateStyle();
        }),
        Color: Public.Property({}),

        GetFont: Public(function () {
            return this.font;
        }),
        SetFont: Public(function (value) {
            this.font = value;
            this.UpdateStyle();
        }),
        Font: Public.Property({}),

        GetText: Public(function () {
            return this.text;
        }),
        SetText: Public(function (value) {
            this.text = value;
            this.UpdateStyle();
        }),
        Text: Public.Property({}),

        GetHorizontalAlignment: Public(function () {
            return this.horizontalAlignment;
        }),
        SetHorizontalAlignment: Public(function (value) {
            this.horizontalAlignment = value;
            this.UpdateStyle();
        }),
        HorizontalAlignment: Public.Property({}),

        GetVerticalAlignment: Public(function () {
            return this.verticalAlignment;
        }),
        SetVerticalAlignment: Public(function (value) {
            this.verticalAlignment = value;
            this.UpdateStyle();
        }),
        VerticalAlignment: Public.Property({}),

        SetAlignments: Public(function (horizontal, vertical) {
            this.horizontalAlignment = horizontal;
            this.verticalAlignment = vertical;
            this.UpdateStyle();
        }),

        GetWrapLine: Public(function () {
            return this.wrapLine;
        }),
        SetWrapLine: Public(function (value) {
            this.wrapLine = value;
            this.UpdateStyle();
        }),
        WrapLine: Public.Property({}),

        GetEllipse: Public(function () {
            return this.ellipse;
        }),
        SetEllipse: Public(function (value) {
            this.ellipse = value;
            this.UpdateStyle();
        }),
        Ellipse: Public.Property({}),

        GetMultiline: Public(function () {
            return this.multiline;
        }),
        SetMultiline: Public(function (value) {
            this.multiline = value;
            this.UpdateStyle();
        }),
        Multiline: Public.Property({}),

        GetWrapLineHeightCalculation: Public(function () {
            return this.wrapLineHeightCalculation;
        }),
        SetWrapLineHeightCalculation: Public(function (value) {
            this.wrapLineHeightCalculation = value;
            this.UpdateStyle();
        }),
        WrapLineHeightCalculation: Public.Property({}),
    });

    /********************************************************************************
    ImageFrame
    ********************************************************************************/

    var ImageFrameElement = Class(FQN("ImageFrame"), IElement, {

        image: Protected(""),
        horizontalAlignment: Protected(Alignment.Description.Left),
        verticalAlignment: Protected(Alignment.Description.Top),
        stretch: Protected(false),
        enabled: Protected(false),

        UpdateStyle: Protected(function () {
            throw new Error("Not Implemented.");
        }),

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "block";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "100%";
            this.htmlElement.style.height = "100%";
            this.UpdateStyle();
        }),

        GetImage: Public(function () {
            return this.image;
        }),
        SetImage: Public(function (value) {
            this.image = value;
            this.UpdateStyle();
        }),
        Image: Public.Property({}),

        GetHorizontalAlignment: Public(function () {
            return this.horizontalAlignment;
        }),
        SetHorizontalAlignment: Public(function (value) {
            this.horizontalAlignment = value;
            this.UpdateStyle();
        }),
        HorizontalAlignment: Public.Property({}),

        GetVerticalAlignment: Public(function () {
            return this.verticalAlignment;
        }),
        SetVerticalAlignment: Public(function (value) {
            this.verticalAlignment = value;
            this.UpdateStyle();
        }),
        VerticalAlignment: Public.Property({}),

        SetAlignments: Public(function (horizontal, vertical) {
            this.horizontalAlignment = horizontal;
            this.verticalAlignment = vertical;
            this.UpdateStyle();
        }),

        GetStretch: Public(function () {
            return this.stretch;
        }),
        SetStretch: Public(function (value) {
            this.stretch = value;
            this.UpdateStyle();
        }),
        Stretch: Public.Property({}),

        GetEnabled: Public(function () {
            return this.enabled;
        }),
        SetEnabled: Public(function (value) {
            this.enabled = value;
            this.UpdateStyle();
        }),
        Enabled: Public.Property({}),
    });

    /********************************************************************************
    Polygon
    ********************************************************************************/

    var PolygonElement = Class(FQN("Polygon"), IElement, {

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "block";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "100%";
            this.htmlElement.style.height = "100%";
            this.UpdateStyle();
        }),
    });

    /********************************************************************************
    ColorizedText
    ********************************************************************************/

    var ColorizedTextElement = Class(FQN("ColorizedText"), IElement, {

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "block";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "100%";
            this.htmlElement.style.height = "100%";
            this.UpdateStyle();
        }),
    });

    /********************************************************************************
    Polygon
    ********************************************************************************/

    var DocumentElement = Class(FQN("Document"), IElement, {

        __Constructor: Public(function () {
            this.htmlElement = document.createElement("div");
            this.htmlElement.style.display = "block";
            this.htmlElement.style.position = "relative";
            this.htmlElement.style.width = "100%";
            this.htmlElement.style.height = "100%";
            this.UpdateStyle();
        }),
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        IElement: IElement,
        ElementShape: ElementShape,
        SolidBorder: SolidBorder,
        RoundBorder: RoundBorder,
        ThreeDBorder: ThreeDBorder,
        ThreeDSplitter: ThreeDSplitter,
        ThreeDSplitterDirection: ThreeDSplitterDirection,
        SolidBackground: SolidBackground,
        GradientBackground: GradientBackground,
        GradientBackgroundrDirection: GradientBackgroundrDirection,
        SolidLabel: SolidLabel,
        ImageFrameElement: ImageFrameElement,
        PolygonElement: PolygonElement,
        ColorizedTextElement: ColorizedTextElement,
        DocumentElement: DocumentElement,
    }
});