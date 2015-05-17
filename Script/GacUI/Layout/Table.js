Packages.Define("GacUI.Layout.Table", ["Class", "GacUI.Types", "GacUI.Layout.Basic"], function (__injection__) {
    eval(__injection__);

    function FQN(name) {
        return "vl::presentation::compositions::Gui" + name + "Composition";
    }

    /********************************************************************************
    GuiTableComposition
    ********************************************************************************/

    var TableLayout = Class(FQN("Table"), BoundsLayout, {
    });

    /********************************************************************************
    GuiCellComposition
    ********************************************************************************/

    var CellLayout = Class(FQN("Cell"), SiteLayout, {
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        TableLayout: TableLayout,
        CellLayout: CellLayout,
    }
});