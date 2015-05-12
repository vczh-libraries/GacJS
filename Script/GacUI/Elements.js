Packages.Define("GacUI.Elements", ["Class", "GacUI.Types"], function (__injection__) {
    eval(__injection__);

    function FQN(name) {
        return "vl::presentation::elements::Gui" + name + "Element";
    }

    var IElement = Class("vl::presentation::elements::IGuiGraphicsElement", {
        gacjs_InstallElement: Public.Abstract(),
        gacjs_UninstallElement: Public.Abstract(),
    });

    var ElementShape = Enum("vl::presentation::elements::ElementShape", {
        Rectangle: 0,
        Ellipse: 1,
    });

    /********************************************************************************
    SolidBorder
    ********************************************************************************/

    var SolidBorder = Class(FQN("SolidBorder"), IElement, {

        htmlElement: Protected(null),
        color: Protected(new Color()),
        shape: Protected(ElementShape.Rectangle),

        UpdateStyle: Protected(function () {
            this.htmlElement.borderColor = this.color.__ToString();
        }),

        gacjs_InstallElement: Public.Override(function (graphElement) {
            graphElement.appendChild(this.htmlElement);
        }),

        gacjs_UninstallElement: Public.Override(function (graphElement) {
            grapyElement.removeChild(this.htmlElement);
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

        GetColor: Public(function () {
            return this.color;
        }),
        SetColor: Public(function (value) {
            this.color = value;
            this.UpdateStyle();
        }),
        Color: Public.Property({}),

        GetShape: Public(function () {
            return this.shape;
        }),
        SetShape: Public(function (value) {
            this.shape = value;
            this.UpdateStyle();
        }),
        Shape: Public.Property({}),
    });

    /********************************************************************************
    RoundBorder
    ********************************************************************************/

    var RoundBorder = Class(FQN("RoundBorder"), IElement, {

        UpdateStyle: Protected(function () {
            throw new Error("Not Implemented.");
        }),

        color: Protected(new Color()),
        GetColor: Public(function () {
            return this.color;
        }),
        SetColor: Public(function (value) {
            this.color = value;
            this.UpdateStyle();
        }),
        Color: Public.Property({}),

        radius: Protected(0.0),
        GetRadius: Public(function () {
            return this.radius;
        }),
        SetRadius: Public(function (value) {
            this.radius = value;
            this.UpdateStyle();
        }),
        Radius: Public.Property({}),
    });

    /********************************************************************************
    ThreeDBorder
    ********************************************************************************/

    var ThreeDBorder = Class(FQN("3DBorder"), IElement, {

        UpdateStyle: Protected(function () {
            throw new Error("Not Implemented.");
        }),

        color1: Protected(new Color()),
        GetColor1: Public(function () {
            return this.color1;
        }),
        SetColor1: Public(function (value) {
            this.color1 = value;
            this.UpdateStyle();
        }),
        Color1: Public.Property({}),

        color2: Protected(new Color()),
        GetColor2: Public(function () {
            return this.color2;
        }),
        SetColor2: Public(function (value) {
            this.color2 = value;
            this.UpdateStyle();
        }),
        Color2: Public.Property({}),

        SetColors: Public(function (value1, value2) {
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

        UpdateStyle: Protected(function () {
            throw new Error("Not Implemented.");
        }),

        color1: Protected(new Color()),
        GetColor1: Public(function () {
            return this.color1;
        }),
        SetColor1: Public(function (value) {
            this.color1 = value;
            this.UpdateStyle();
        }),
        Color1: Public.Property({}),

        color2: Protected(new Color()),
        GetColor2: Public(function () {
            return this.color2;
        }),
        SetColor2: Public(function (value) {
            this.color2 = value;
            this.UpdateStyle();
        }),
        Color2: Public.Property({}),

        SetColors: Public(function (value1, value2) {
            this.color1 = value1;
            this.color2 = value2;
            this.UpdateStyle();
        }),

        direction: Protected(ThreeDSplitterDirection.Horizontal),
        GetDirection: Public(function () {
            return this.direction;
        }),
        SetDirection: Public(function (value) {
            this.direction = value;
            this.UpdateStyle();
        }),
    });

    /********************************************************************************
    SolidBackground
    ********************************************************************************/

    var SolidBackground = Class(FQN("SolidBackground"), IElement, {

        UpdateStyle: Protected(function () {
            throw new Error("Not Implemented.");
        }),

        color: Protected(new Color()),
        GetColor: Public(function () {
            return this.color;
        }),
        SetColor: Public(function (value) {
            this.color = value;
            this.UpdateStyle();
        }),
        Color: Public.Property({}),

        shape: Protected(ElementShape.Rectangle),
        GetShape: Public(function () {
            return this.shape;
        }),
        SetShape: Public(function (value) {
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

        UpdateStyle: Protected(function () {
            throw new Error("Not Implemented.");
        }),

        color1: Protected(new Color()),
        GetColor1: Public(function () {
            return this.color1;
        }),
        SetColor1: Public(function (value) {
            this.color1 = value;
            this.UpdateStyle();
        }),
        Color1: Public.Property({}),

        color2: Protected(new Color()),
        GetColor2: Public(function () {
            return this.color2;
        }),
        SetColor2: Public(function (value) {
            this.color2 = value;
            this.UpdateStyle();
        }),
        Color2: Public.Property({}),

        SetColors: Public(function (value1, value2) {
            this.color1 = value1;
            this.color2 = value2;
            this.UpdateStyle();
        }),

        direction: Protected(GradientBackgroundrDirection.Horizontal),
        GetDirection: Public(function () {
            return this.direction;
        }),
        SetDirection: Public(function (value) {
            this.direction = value;
            this.UpdateStyle();
        }),

        shape: Protected(ElementShape.Rectangle),
        GetShape: Public(function () {
            return this.shape;
        }),
        SetShape: Public(function (value) {
            this.shape = value;
            this.UpdateStyle();
        }),
        Shape: Public.Property({}),
    });

    /********************************************************************************
    SolidLabel
    ********************************************************************************/

    var SolidLabel = Class(FQN("SolidLabel"), IElement, {

        UpdateStyle: Protected(function () {
            throw new Error("Not Implemented.");
        }),

        color: Protected(new Color()),
        GetColor: Public(function () {
            return this.color;
        }),
        SetColor: Public(function (value) {
            this.color = value;
            this.UpdateStyle();
        }),
        Color: Public.Property({}),

        font: Protected(new FontProperties()),
        GetFont: Public(function () {
            return this.font;
        }),
        SetFont: Public(function (value) {
            this.font = value;
            this.UpdateStyle();
        }),
        Font: Public.Property({}),

        horizontalAlignment: Protected(Alignment.Left),
        GetHorizontalAlignment: Public(function () {
            return this.horizontalAlignment;
        }),
        SetHorizontalAlignment: Public(function (value) {
            this.horizontalAlignment = value;
            this.UpdateStyle();
        }),
        HorizontalAlignment: Public.Property({}),

        verticalAlignment: Protected(Alignment.Top),
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

        wrapLine: Protected(false),
        GetWrapLine: Public(function () {
            return this.wrapLine;
        }),
        SetWrapLine: Public(function (value) {
            this.wrapLine = value;
            this.UpdateStyle();
        }),
        WrapLine: Public.Property({}),

        ellipse: Protected(false),
        GetEllipse: Public(function () {
            return this.ellipse;
        }),
        SetEllipse: Public(function (value) {
            this.ellipse = value;
            this.UpdateStyle();
        }),
        Ellipse: Public.Property({}),

        multiline: Protected(false),
        GetMultiline: Public(function () {
            return this.multiline;
        }),
        SetMultiline: Public(function (value) {
            this.multiline = value;
            this.UpdateStyle();
        }),
        Multiline: Public.Property({}),

        wrapLineHeightCalculation: Protected(false),
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

        UpdateStyle: Protected(function () {
            throw new Error("Not Implemented.");
        }),

        image: Protected(""),
        GetImage: Public(function () {
            return this.image;
        }),
        SetImage: Public(function (value) {
            this.image = value;
            this.UpdateStyle();
        }),
        Image: Public.Property({}),

        horizontalAlignment: Protected(Alignment.Left),
        GetHorizontalAlignment: Public(function () {
            return this.horizontalAlignment;
        }),
        SetHorizontalAlignment: Public(function (value) {
            this.horizontalAlignment = value;
            this.UpdateStyle();
        }),
        HorizontalAlignment: Public.Property({}),

        verticalAlignment: Protected(Alignment.Top),
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

        stretch: Protected(false),
        GetStretch: Public(function () {
            return this.stretch;
        }),
        SetStretch: Public(function (value) {
            this.stretch = value;
            this.UpdateStyle();
        }),
        Stretch: Public.Property({}),

        enabled: Protected(false),
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
    });

    /********************************************************************************
    ColorizedText
    ********************************************************************************/

    var ColorizedTextElement = Class(FQN("ColorizedText"), IElement, {
    });

    /********************************************************************************
    Polygon
    ********************************************************************************/

    var DocumentElement = Class(FQN("Document"), IElement, {
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