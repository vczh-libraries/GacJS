Packages.Define("GacUI.Elements.Basic", ["Class", "GacUI.Types", "Html.ResizeEvent", "GacUI.Elements.Interface"], function (__injection__) {
    eval(__injection__);

    function FQN(name) {
        return "vl::presentation::elements::Gui" + name + "Element";
    }

    var ElementShape = Enum("vl::presentation::elements::ElementShape", {
        Rectangle: 0,
        Ellipse: 1
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
        Shape: Public.Property({})
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
        Radius: Public.Property({})
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
        })
    });

    /********************************************************************************
    ThreeDSplitter
    ********************************************************************************/

    var ThreeDSplitterDirection = Enum("vl::presentation::elements::Gui3DSplitterElement::Direction", {
        Horizontal: 0,
        Vertical: 1
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
        Direction: Public.Property({})
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
        Shape: Public.Property({})
    });

    /********************************************************************************
    GradientBackground
    ********************************************************************************/

    var GradientBackgroundrDirection = Enum("vl::presentation::elements::GuiGradientBackgroundElement::Direction", {
        Horizontal: 0,
        Vertical: 1,
        Slash: 2,
        Backslash: 2
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
        Shape: Public.Property({})
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

        horizontalHtmlFlexElement: Protected(null),
        verticalHtmlFlexElement: Protected(null),
        textHtmlElement: Protected(null),
        referenceHtmlElement: Protected(null),
        measuringHtmlElement: Protected(null),

        enabledMinSizeNotify: Protected(false),
        measuringMinSize: Protected(false),
        measuringHtmlElementSizeChanged: Protected(false),
        suppressMeasuringHtmlElementSizeChanged: Protected(false),

        UpdateMinSize: Protected(function () {
            var x = 0;
            var y = 0;
            if (this.measuringMinSize) {
                if (!this.wrapLine) {
                    x = this.measuringHtmlElement.offsetWidth;
                }
                y = this.measuringHtmlElement.offsetHeight;
            }

            if (this.minSize.cx !== x || this.minSize.cy !== y) {
                this.minSize = new Size(x, y);
                this.gacjs_MinSizeChanged.Execute();
            }
        }),

        UpdateMinSizeMeasuringState: Protected(function () {
            var newMeasuringMinSize = this.enabledMinSizeNotify && !this.ellipse && (!this.wrapLine || this.wrapLineHeightCalculation);
            if (this.measuringMinSize !== newMeasuringMinSize) {
                this.measuringMinSize = newMeasuringMinSize;

            }

            if (this.measuringMinSize) {
                this.measuringHtmlElement.style.width = this.textHtmlElement.style.width;
            }
            else {
                this.measuringHtmlElement.style.width = "0";
            }
        }),

        UpdateStyleInternal: Protected(function (textElement, forDisplay) {
            textElement.innerHTML = "";
            if (this.multiline) {
                if (this.ellipse && !this.wrapLine) {
                    // Internet Explorer 11.0
                    var lines = this.text.split(/\r?\n/);
                    for (var i = 0; i < lines.length; i++) {
                        var div = document.createElement("div");
                        if (forDisplay) {
                            div.style.overflow = "hidden";
                            div.style.textOverflow = "ellipsis";
                        }
                        div.appendChild(document.createTextNode(lines[i]));
                        textElement.appendChild(div);
                    }
                }
                else {
                    textElement.appendChild(document.createTextNode(this.text));
                }
            }
            else {
                if (forDisplay) {
                    textElement.style.textOverflow = (this.ellipse && !this.wrapLine ? "ellipsis" : "");
                }
                textElement.appendChild(document.createTextNode(this.text.replace(/\r?\n/, " ")));
            }

            textElement.style.color = this.color.__ToString();
            textElement.style.fontFamily = "'" + this.font.fontFamily + "'";
            textElement.style.fontSize = this.font.size + "px";
            textElement.style.fontWeight = (this.font.bold ? "bold" : "normal");
            textElement.style.fontStyle = (this.font.italic ? "italic" : "normal");
            textElement.style.textDecoration = (this.font.underline ? "underline" : "");
            textElement.style.whiteSpace = (this.wrapLine ? "pre-wrap" : "pre");
        }),

        UpdateStyle: Protected(function () {
            this.suppressMeasuringHtmlElementSizeChanged = true;

            switch (this.horizontalAlignment) {
                case Alignment.Description.Left:
                    this.horizontalHtmlFlexElement.style.justifyContent = "flex-start";
                    break;
                case Alignment.Description.Right:
                    this.horizontalHtmlFlexElement.style.justifyContent = "flex-end";
                    break;
                default:
                    this.horizontalHtmlFlexElement.style.justifyContent = "center";
                    break;
            }

            switch (this.verticalAlignment) {
                case Alignment.Description.Top:
                    this.verticalHtmlFlexElement.style.justifyContent = "flex-start";
                    break;
                case Alignment.Description.Bottom:
                    this.verticalHtmlFlexElement.style.justifyContent = "flex-end";
                    break;
                default:
                    this.verticalHtmlFlexElement.style.justifyContent = "center";
                    break;
            }

            this.htmlElement.style.color = this.color.__ToString();
            this.htmlElement.style.textDecoration = (this.font.strikeline ? "line-through" : "");
            this.UpdateStyleInternal(this.textHtmlElement, true);
            this.UpdateStyleInternal(this.referenceHtmlElement, false);
            this.UpdateStyleInternal(this.measuringHtmlElement, false);
            this.UpdateMinSizeMeasuringState();

            this.suppressMeasuringHtmlElementSizeChanged = false;
            if (this.measuringHtmlElementSizeChanged) {
                this.UpdateMinSize();
                this.measuringHtmlElementSizeChanged = false;
            }
        }),

        measuringHtmlElement_OnResize: Protected(function () {
            if (!this.suppressMeasuringHtmlElementSizeChanged) {
                this.UpdateMinSize();
            }
            else {
                this.measuringHtmlElementSizeChanged = true;
            }
        }),

        HtmlElement_OnResize: Protected(function () {
            var referenceWidth = this.referenceHtmlElement.offsetWidth;
            var displayWidth = this.htmlElement.offsetWidth;
            if (this.wrapLine || this.ellipse) {
                var width = (Math.min(referenceWidth, displayWidth) + 1) + "px";
            }
            else {
                var width = referenceWidth + "px";
            }
            if (this.textHtmlElement.style.width !== width) {
                this.textHtmlElement.style.width = width;
                this.UpdateMinSizeMeasuringState();
            }
        }),

        gacjs_EnableMinSizeNotify: Public.Override.StrongTyped(__Void, [__Boolean], function (enabled) {
            this.enabledMinSizeNotify = enabled;
            this.UpdateMinSizeMeasuringState();
        }),

        __Constructor: Public(function () {
            this.horizontalHtmlFlexElement = document.createElement("div");
            this.horizontalHtmlFlexElement.style.position = "relative";
            this.horizontalHtmlFlexElement.style.display = "flex";
            this.horizontalHtmlFlexElement.style.flexDirection = "row";
            this.horizontalHtmlFlexElement.style.height = "100%";

            this.verticalHtmlFlexElement = document.createElement("div");
            this.verticalHtmlFlexElement.style.position = "relative";
            this.verticalHtmlFlexElement.style.display = "flex";
            this.verticalHtmlFlexElement.style.flexDirection = "column";

            this.textHtmlElement = document.createElement("div");
            this.textHtmlElement.style.display = "block";
            this.textHtmlElement.style.position = "relative";
            this.textHtmlElement.style.overflow = "hidden";

            this.referenceHtmlElement = document.createElement("div");
            this.referenceHtmlElement.style.display = "block";
            this.referenceHtmlElement.style.position = "fixed";
            this.referenceHtmlElement.style.visibility = "hidden";
            this.referenceHtmlElement.style.left = "0";
            this.referenceHtmlElement.style.top = "0";

            this.measuringHtmlElement = document.createElement("div");
            this.measuringHtmlElement.style.display = "block";
            this.measuringHtmlElement.style.position = "fixed";
            this.measuringHtmlElement.style.visibility = "hidden";
            this.measuringHtmlElement.style.left = "0";
            this.measuringHtmlElement.style.top = "0";

            this.horizontalHtmlFlexElement.appendChild(this.verticalHtmlFlexElement);
            this.verticalHtmlFlexElement.appendChild(this.textHtmlElement);
            this.verticalHtmlFlexElement.appendChild(this.referenceHtmlElement);
            this.verticalHtmlFlexElement.appendChild(this.measuringHtmlElement);
            this.htmlElement = this.horizontalHtmlFlexElement;
            this.UpdateStyle();

            var self = this;
            DetectResize(this.htmlElement, function () {
                self.HtmlElement_OnResize();
            });
            DetectResize(this.measuringHtmlElement, function () {
                self.measuringHtmlElement_OnResize();
            });
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
        WrapLineHeightCalculation: Public.Property({})
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
        Enabled: Public.Property({})
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
        })
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
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
        PolygonElement: PolygonElement
    }
});