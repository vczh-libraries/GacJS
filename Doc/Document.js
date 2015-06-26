Packages.Define("Doc.Document", ["Class", "Html.Razor", "IO.Resource", "IO.Wildcard"], function (__injection__) {
    eval(__injection__);

    function GetDirectXmlChild(element, name) {
        var xmls = [];
        for (var i = 0; i < element.childNodes.length; i++) {
            var xml = element.childNodes[i];
            if (xml.tagName === name) {
                xmls.push(xml);
            }
        }
        return xmls;
    }

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
            var list = [];
            var map = {};
            var nsXmls = GetDirectXmlChild(resource.firstChild, "Namespace");
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
    NsResourceDeserializer
    ********************************************************************************/

    var NsResourceDeserializer = Class(PQN("NsResourceDeserializer"), IResourceDeserializer, {
        GetName: Public.Override(function () {
            return "Ns";
        }),

        GetPriorDeserializerName: Public.Override(function () {
            return "Xml";
        }),

        Deserialize: Public.Override(function (resource) {
            var names = [];
            var map = {};
            var overloadsXmls = GetDirectXmlChild(resource.firstChild, "Overloads");
            for (var i = 0; i < overloadsXmls.length; i++) {
                var overloadsXml = overloadsXmls[i];
                var displayName = overloadsXml.getAttribute("DisplayName");

                var items = [];
                names.push(displayName);
                map[displayName] = items;

                var symbolXmls = GetDirectXmlChild(overloadsXml, "Symbol");
                for (var j = 0; j < symbolXmls.length; j++) {
                    var symbolXml = symbolXmls[j];

                    var item = new DocNamespaceItem(
                        symbolXml.getAttribute("Key"),
                        displayName,
                        symbolXml.getAttribute("UrlName"),
                        symbolXml.getAttribute("Doc") === "true"
                        );
                    items.push(item);
                }
            }
            return { names: names, map: map };
        }),
    });
    RegisterDeserializer(new NsResourceDeserializer());
    RegisterResource(WildcardToRegExp("ns(*).xml"), "Ns");

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
    }
})