Packages.Define("GacUI.Layout.Misc", ["Class", "GacUI.Types", "GacUI.Layout.Basic"], function (__injection__) {
    eval(__injection__);

    function FQN(name) {
        return "vl::presentation::compositions::Gui" + name + "Composition";
    }

    /********************************************************************************
    GuiSideAlignedComposition
    ********************************************************************************/

    var SideAlignedLayout = Class(FQN("SideAligned"), SiteLayout, {
    });

    /********************************************************************************
    GuiPartialViewComposition
    ********************************************************************************/

    var PartialViewLayout = Class(FQN("PartialView"), SiteLayout, {
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        SideAlignedLayout: SideAlignedLayout,
        PartialViewLayout: PartialViewLayout
    }
});