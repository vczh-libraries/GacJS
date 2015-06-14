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
    void InitializeMvc(string hashFlag, string rootRazorUrl);
*/
Packages.Define("Html.MVC", ["Class", "Html.Navigation", "Html.Razor", "IO.Resource"], function (__injection__) {
    eval(__injection__);

    return {
    }
})