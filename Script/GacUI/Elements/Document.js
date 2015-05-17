Packages.Define("GacUI.Elements.Document", ["Class", "GacUI.Types", "GacUI.Elements.Interface"], function (__injection__) {
    eval(__injection__);

    function FQN(name) {
        return "vl::presentation::elements::Gui" + name + "Element";
    }

    /********************************************************************************
    Document
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
        DocumentElement: DocumentElement,
    }
});