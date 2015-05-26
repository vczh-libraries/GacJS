Packages.Define("GacUI.Elements.Interface", ["Class", "GacUI.Types", "Html.ResizeEvent"], function (__injection__) {
    eval(__injection__);

    var IElement = Class("vl::presentation::elements::IGuiGraphicsElement", {

        htmlElement: Protected(null),
        minSize: Protected(new Size(0, 0)),

        gacjs_InstallElement: Public.Virtual(function (graphElement) {
            graphElement.appendChild(this.htmlElement);
        }),

        gacjs_UninstallElement: Public.Virtual(function (graphElement) {
            grapyElement.removeChild(this.htmlElement);
        }),

        gacjs_MinSizeChanged: Public.Event(),

        gacjs_EnableMinSizeNotify: Public.Virtual.StrongTyped(__Void, [__Boolean], function (enabled) {
        }),

        gacjs_GetMinSize: Public.StrongTyped(Size, [], function () {
            return this.minSize;
        }),
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        IElement: IElement
    }
});