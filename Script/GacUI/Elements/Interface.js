Packages.Define("GacUI.Elements.Interface", ["Class", "GacUI.Types", "Html.ResizeEvent"], function (__injection__) {
    eval(__injection__);

    var IElement = Class("vl::presentation::elements::IGuiGraphicsElement", {

        htmlElement: Protected(null),

        gacjs_InstallElement: Public.Virtual(function (graphElement) {
            graphElement.appendChild(this.htmlElement);
        }),

        gacjs_UninstallElement: Public.Virtual(function (graphElement) {
            grapyElement.removeChild(this.htmlElement);
        }),
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        IElement: IElement,
    }
});