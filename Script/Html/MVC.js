/*
API:

    class MvcController : INavigationController
    {
    protected:
        virtual object      GetModel() { return this; }
    public:
        MvcController(string razorUrl);
    }

    Type CreateMvcControllerType(string name, string razorUrl, { property : defaultValue });
    void InitializeMvc(string hashFlag, string rootRazorUrl, string loadingRazorUrl);
*/
Packages.Define("Html.MVC", ["Class", "Html.Navigation", "Html.Razor", "IO.Resource", "IO.Wildcard"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    MvcController
    ********************************************************************************/

    var MvcController = Class(PQN("MvcController"), INavigationController, {
        GetModel: Protected.Virtual(function () {
            return this.__ExternalReference;
        }),
        Model: Public.Property({ readonly: true }),

        __Constructor: Public.StrongTyped(__Void, [__String], function (razorUrl) {

        }),
    });

    /********************************************************************************
    InitializeMvc
    ********************************************************************************/

    var loadingRazor = null;

    function InitializeMvc(hashFlag, rootRazorUrl, loadingRazorUrl) {
        var loadingRazor = GetResourceAsync(loadingRazorUrl, false).Result.Razor;
        document.body.innerHTML = loadingRazor({ Url: rootRazorUrl }).RawHtml;
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
    Package
    ********************************************************************************/

    return {
        MvcController: MvcController,
        InitializeMvc: InitializeMvc,
    }
})

Packages.Define("Html.MVCRazorHelper", function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
    }
})