/*
API:

    class MvcController : INavigationController
    {
    protected:
        virtual object      GetModel() { return this; }
        virtual void        OnLoaded() {}
    public:
        MvcController(string razorUrl, string renderPageId, bool autoLoad);

        string              RazorUrl { get; }
        Razor               Razor { get; }
        string              RazorText { get; }

        void                Load();
    }

    Type CreateMvcControllerType(string name, string razorUrl, { property : defaultValue }, additionalDefinitions);
    void InitializeMvc(string hashFlag, string rootRazorUrl, string loadingRazorUrl, { property : defaultValue });
*/
Packages.Define("Html.MVC", ["Class", "Html.Navigation", "Html.Razor", "IO.Resource", "IO.Wildcard", "Html.MVCRazorHelper.Internal"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    MvcController
    ********************************************************************************/

    var MvcController = Class(PQN("MvcController"), INavigationController, {

        //---------------------------------------------------------------------

        GetModel: Protected.Virtual(function () {
            return this.__ExternalReference;
        }),
        Model: Public.Property({ readonly: true }),

        razorUrl: Private(null),
        GetRazorUrl: Private(function () {
            return this.razorUrl;
        }),
        RazorUrl: Public.Property({ readonly: true }),

        razor: Private(null),
        GetRazor: Private(function () {
            return this.razor.Razor;
        }),
        Razor: Public.Property({ readonly: true }),

        GetRazorText: Private(function () {
            return this.razor.Text;
        }),
        RazorText: Public.Property({ readonly: true }),

        renderPageId: Private(null),
        GetRenderPageId: Private(function () {
            return this.renderPageId;
        }),
        RenderPageId: Public.Property({ readonly: true }),

        //---------------------------------------------------------------------

        html: Private(null),
        GetHtml: Private(function () {
            if (this.html === null) {
                try {
                    SetMvcRenderPageId(this.renderPageId);
                    this.html = this.Razor(this.GetModel()).RawHtml;
                }
                catch (ex) {
                    return "<span style=\"color:red;\">" + ex + "</span>";
                }
            }
            return this.html;
        }),
        Html: Public.Property({ readonly: true }),

        //---------------------------------------------------------------------

        loaded: Private(false),
        GetLoaded: Private(function () {
            return this.loaded;
        }),
        Loaded: Public.Property({ readonly: true }),

        OnLoaded: Protected.Virtual(function () { }),

        //---------------------------------------------------------------------

        razorReadyCallbacks: Private(),
        ExecuteAfterRazorReady: Public(function (callback) {
            if (this.razor === null) {
                this.razorReadyCallbacks.push(callback);
            }
            else {
                callback();
            }
        }),

        Load: Public.StrongTyped(__Void, [], function () {
            if (this.loaded === true) {
                return;
            }

            this.loaded = true;
            var self = this;

            GetResourceAsync(this.razorUrl).Then(function (razor) {
                self.razor = razor;
                self.OnLoaded();
                if (self.SubController !== null) {
                    self.DelayInstallSubControllerPage();
                }

                for (var i = 0; i < self.razorReadyCallbacks.length; i++) {
                    self.razorReadyCallbacks[i]();
                }
                self.razorReadyCallbacks = null;
            });
        }),

        //---------------------------------------------------------------------

        ReplaceSubControllerPage: Private(function (html) {
            var span = document.getElementById(this.renderPageId);
            if (span !== null) {
                span.innerHTML = html;
            }
        }),

        DelayInstallSubControllerPage: Private(function () {
            this.ReplaceSubControllerPage(loadingRazor({ Url: this.SubController.RazorUrl }).RawHtml);

            var self = this;
            this.SubController.ExecuteAfterRazorReady(function () {
                self.InstallSubControllerPage();
            });
        }),

        //---------------------------------------------------------------------

        InstallSubControllerPage: Private(function () {
            this.ReplaceSubControllerPage(this.SubController.Html);
        }),

        UninstallSubControllerPage: Private(function () {
            this.ReplaceSubControllerPage("");
        }),

        OnSubControllerInstalled: Public.Override.StrongTyped(__Void, [INavigationController], function (controller) {
            if (this.loaded) {
                this.DelayInstallSubControllerPage();
            }
        }),

        OnSubControllerUninstalled: Public.Override.StrongTyped(__Void, [INavigationController], function (controller) {
            this.UninstallSubControllerPage();
        }),

        //---------------------------------------------------------------------

        __Constructor: Public.StrongTyped(__Void, [__String, __String, __Boolean], function (razorUrl, renderPageId, autoLoad) {
            this.razorUrl = razorUrl;
            this.renderPageId = renderPageId;
            this.razorReadyCallbacks = [];
            if (autoLoad === true) {
                this.Load();
            }
        }),
    });

    /********************************************************************************
    CreateMvcControllerType
    ********************************************************************************/

    function CreateMvcControllerTypeInternal(name, razorUrl, autoLoad, properties, additionalDefinitions) {
        var def = {
            __Constructor: Public.StrongTyped(__Void, [], function () {
                this.__InitBase(MvcController, [razorUrl, GenerateMvcRenderPageId(), autoLoad]);
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

    function CreateMvcControllerType(name, razorUrl, properties, additionalDefinitions) {
        return CreateMvcControllerTypeInternal(name, razorUrl, true, properties, additionalDefinitions);
    }

    /********************************************************************************
    InitializeMvc
    ********************************************************************************/

    var loadingRazor = null;

    function InitializeMvc(hashFlag, rootRazorUrl, loadingRazorUrl, rootRazorProperties) {
        loadingRazor = GetResourceAsync(loadingRazorUrl, false).Result.Razor;
        document.body.innerHTML = loadingRazor({ Url: rootRazorUrl }).RawHtml;

        var rootRazorControllerType = CreateMvcControllerType(
            PQN("RootMvcRazorController"),
            rootRazorUrl,
            rootRazorProperties,
            {
                OnLoaded: Protected.Override(function () {
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

Packages.Define("Html.MVCRazorHelper.Internal", ["Html.RazorHelper"], function (__injection__) {
    eval(__injection__);

    var index = 0;
    var id = null;

    function GenerateMvcRenderPageId() {
        return "HTML_MVC_RENDER_PAGE_ID_" + (++index);
    }

    function SetMvcRenderPageId(newId) {
        id = newId;
    }

    function RenderPage() {
        return new RazorHtml("<span id=\"" + id + "\"></span>");
    }

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        GenerateMvcRenderPageId: GenerateMvcRenderPageId,
        SetMvcRenderPageId: SetMvcRenderPageId,
        RenderPage: RenderPage,
    }
})

Packages.Define("Html.MVCRazorHelper", ["Html.MVCRazorHelper.Internal"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        RenderPage: RenderPage,
    }
})