Packages.Define("GacUI.Layout.Bounds", ["Class", "GacUI.Types", "GacUI.Layout.Basic"], function (__injection__) {
    eval(__injection__);

    function FQN(name) {
        return "vl::presentation::compositions::Gui" + name + "Composition";
    }

    /********************************************************************************
    GuiBoundsComposition
    ********************************************************************************/

    var BoundsLayout = Class(FQN("Bounds"), Layout, {

        UpdateStyle: Protected.Override(function () {
            this.__Dynamic(Layout).UpdateStyle();
            throw new Error("Not Implemented.");
        }),

        bounds: Protected(new Rect()),

        SetBounds: Public(function (value) {
            this.bounds = value;
            this.UpdateStyle();
        }),
        Bounds: Public.Property({}),

        alignmentToParent: Protected(new Margin(-1, -1, -1, -1)),
        GetAlignmentToParent: Public(function () {
            return this.alignmentToParent;
        }),
        SetAlignmentToParent: Public(function (value) {
            this.alignmentToParent = value;
            this.UpdateStyle();
        }),
        AlignmentToParent: Public.Property({}),
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        BoundsLayout: BoundsLayout,
    }
});