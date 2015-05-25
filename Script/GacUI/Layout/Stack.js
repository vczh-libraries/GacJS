Packages.Define("GacUI.Layout.Stack", ["Class", "GacUI.Types", "GacUI.Layout.Basic"], function (__injection__) {
    eval(__injection__);

    function FQN(name) {
        return "vl::presentation::compositions::Gui" + name + "Composition";
    }

    /********************************************************************************
    GuiStackComposition
    ********************************************************************************/

    var StackLayout = Class(FQN("Stack"), BoundsLayout, {
    });

    /********************************************************************************
    GuiStackItemComposition
    ********************************************************************************/

    var StackItemLayout = Class(FQN("StackItem"), SiteLayout, {
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        StackLayout: StackLayout,
        StackItemLayout: StackItemLayout
    }
});