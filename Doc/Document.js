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
    NssResourceDeserializer
    ********************************************************************************/

    var DocNamespaceItem = Struct(PQN("DocNamespaceItem"), {
        Key: "",
        DisplayName: "",
        UrlName: "",
        Doc: false,
    });

    var NssResourceDeserializer = Class(PQN("NssResourceDeserializer"), IResourceDeserializer, {
        GetName: Public.Override(function () {
            return "Nss";
        }),

        GetPriorDeserializerName: Public.Override(function () {
            return "Xml";
        }),

        Deserialize: Public.Override(function (resource) {
            var nsXmls = resource.getElementsByTagName("Namespace");
            var list = [];
            var map = {};
            for (var i = 0; i < nsXmls.length; i++) {
                var nsXml = nsXmls[i];
                var item = new DocNamespaceItem(
                    nsXml.getAttribute("Key"),
                    nsXml.getAttribute("DisplayName"),
                    nsXml.getAttribute("UrlName"),
                    nsXml.getAttribute("Doc") === "true"
                    );
                list.push(item);
                map[item.Key] = item;
            }
            return { list: list, map: map };
        }),
    });
    RegisterDeserializer(new NssResourceDeserializer());
    RegisterResource(WildcardToRegExp("nss.xml"), "Nss");

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
    }
})