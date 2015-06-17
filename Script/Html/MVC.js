/*
API:

    class MvcController : INavigationController
    {
    protected:
        virtual object      GetModel() { return this; }
        virtual void        OnRazorLoaded() {}
    public:
        MvcController(string razorUrl);

        Razor               Razor { get; }
        string              RazorText { get; }
    }

    Type CreateMvcControllerType(string name, string razorUrl, { property : defaultValue }, additionalDefinitions);
    void InitializeMvc(string hashFlag, string rootRazorUrl, string loadingRazorUrl, { property : defaultValue });
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

        OnRazorLoaded: Protected.Virtual(function () {
        }),

        razor: Private(null),

        GetRazor: Private(function () {
            return this.razor.Razor;
        }),
        Razor: Public.Property({ readonly: true }),

        GetRazorText: Private(function () {
            return this.razor.Text;
        }),
        RazorText: Public.Property({ readonly: true }),

        GetHtml: Private(function () {
            return this.Razor(this.GetModel()).RawHtml;
        }),
        Html: Public.Property({ readonly: true }),

        __Constructor: Public.StrongTyped(__Void, [__String], function (razorUrl) {
            var self = this;
            GetResourceAsync(razorUrl).Then(function (razor) {
                self.razor = razor;
                self.OnRazorLoaded();
            });
        }),
    });

    /********************************************************************************
    MvcController
    ********************************************************************************/

    function CreateMvcControllerType(name, razorUrl, properties, additionalDefinitions) {
        var def = {
            __Constructor: Public.StrongTyped(__Void, [], function () {
                this.__InitBase(MvcController, [razorUrl]);
            }),
        };

        if (properties !== undefined) {
            for (var i in properties) {
                def[i] = Public(properties[i]);
            }
        }

        if (additionalDefinitions !== undefined) {
            for (var i in additionalDefinitions) {
                if (i === "__Constructor") {
                    throw Error("You cannot define __Constructor in CreateMvcControllerType.");
                }
                else {
                    def[i] = additionalDefinitions[i];
                }
            }
        }

        return Class(name, MvcController, def);
    }

    /********************************************************************************
    InitializeMvc
    ********************************************************************************/

    var loadingRazor = null;

    function InitializeMvc(hashFlag, rootRazorUrl, loadingRazorUrl, properties) {
        var loadingRazor = GetResourceAsync(loadingRazorUrl, false).Result.Razor;
        document.body.innerHTML = loadingRazor({ Url: rootRazorUrl }).RawHtml;

        var rootRazorControllerType = CreateMvcControllerType(
            PQN("RootMvcRazorController"),
            rootRazorUrl,
            properties,
            {
                OnRazorLoaded: Protected.Override(function () {
                    document.body.innerHTML = this.Html;
                }),
            });
        InitializeNavigation(hashFlag, rootRazorControllerType);
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
        CreateMvcControllerType: CreateMvcControllerType,
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