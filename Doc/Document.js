Packages.Define("Doc.Document", ["Class", "Html.Razor", "IO.Resource", "IO.Wildcard"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    RazorResourceDeserializer
    ********************************************************************************/

    var RazorResourceDeserializer = Class(PQN("RazorResourceDeserializer"), IResourceDeserializer, {
        GetName: Public.Override(function () {
            return "Razor";
        }),

        GetPriorDeserializerName: Public.Override(function () {
            return "Text";
        }),

        Deserialize: Public.Override(function (resource) {
            return CompileRazor(resource, "Html.MVCRazorHelper");
        }),
    });
    RegisterDeserializer(new RazorResourceDeserializer());
    RegisterResource(WildcardToRegExp("*.razor.html"), "Razor");

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
    }
})