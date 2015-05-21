/*
API:

    class INavigationController
    {
    protected:
        abstract void OnSubControllerInstalled(INavigationController subController);
        abstract void OnSubControllerUninstalled(INavigationController subController);

    public:
        void NavigateTo(INavigationController subController);
        INavigationController SubController { get; }
    }

    void InitializeNavigation(string hashFlag, INavigationController rootType);

    void RegisterNavigationPath(Type parentType, string pattern, Type type);
        type with the pattern is cascade
        example: (localhost:80 represents the actual url)
            RegisterNavigationPath("/", HomeController);
                http://localhost:80
                http://localhost:80#<hashFlag>
            RegisterNavigationPath("/Home", HomeController);
                http://localhost:80#<hashFlag>/Home
            RegisterNavigationPath("/GettingStarted", GettingStartedController);
                http://localhost:80#<hashFlag>/GettingStarted
            RegisterNavigationPath("/Download", DownloadController);
                http://localhost:80#<hashFlag>/Download
            RegisterNavigationPath("/Demo", DemoController, {DemoName: "HelloWorld"});
                http://localhost:80#<hashFlag>/Demo
            RegisterNavigationPath("/{DemoName}", IndividualDemoController, {}, DemoController);
                http://localhost:80#<hashFlag>/Demo/HelloWorld
            RegisterNavigationPath("/{DemoName}/Source", DemoSourceController, {FileName:"main.cpp"}, DemoController);
                http://localhost:80#<hashFlag>/Demo/HelloWorld/Source
                ==> http://localhost:80#<hashFlag>/Demo/HelloWorld/Source/main.cpp
            RegisterNavigationPath("/{DemoName}/Source/{FileName}", DemoSourceController, {}, DemoController);
                http://localhost:80#<hashFlag>/Demo/HelloWorld/Source/main.cpp
            RegisterNavigationPath("/Document", DocumentController, {Symbols:["vl","presentation","controls","GuiControl"]});
                http://localhost:80#<hashFlag>/Document
                ==> http://localhost:80#<hashFlag>/Document/vl/presentation/controls/GuiControl
            RegisterNavigationPath("/Document/{*Symbols}", DocumentController);
                http://localhost:80#<hashFlag>/Document/vl/presentation/controls/GuiControl
                {*xx} should be at the end of a complete pattern

    string BuildNavigationPath([[type, values], [type, values],  ...]);
        example:
            BuildNavigationPath([
                [DemoController, {}],
                [DemoSourceController, {FileName:"main.cpp"}]
                ])
            returns /Demo/HelloWorld/Source/main.cpp
            because DemoControler::DemoName has a default value "HelloWorld"

    void NavigateTo(string path);
        navigate to http://localhost:80/#<hashFlag><path>

    void StartNavigation();
        read the current hash and navigate
*/
Packages.Define("Html.Navigation", ["Class"], function (__injection__) {
    eval(__injection__);

    var INativationController = Class("<Html.Navigation>::INavigationController", {
        subController: Private(nul),

        OnSubControllerInstalled: Protected.Abstract(),
        OnSubControllerUninstalled: Protected.Abstract(),

        NavigateTo: Public.StrongTyped(__Void, [INativationController], function (subController) {
            if (this.subController !== null) {
                this.subController.NavigateTo(null);
                this.OnSubControllerUninstalled(this.subController);
                this.subController = null;
            }
            this.subController = subController;
            if (this.subController !== null) {
                this.OnSubControllerInstalled(this.subController);
                this.subController = null;
            }
        }),

        GetSubController: Public.StrongTyped(INativationController, [], function () {
            return this.subController;
        }),
        SubController: Public.Property({ readonly: true }),
    });

    var rootNavigationController = null;
    var hashFlag = "vczh";

    function InitializeNavigation(_hashFlag, rootType) {
        hashFlag = _hashFlag;
        rootNavigationController = new rootType();
        throw new Error("Not Implemented.");
    }

    function RegisterNavigationPath(pattern, type, defaultValues, parentType) {
        throw new Error("Not Implemented.");
    }

    function BuildNavigationPath(arguments) {

    }

    function NavigateTo(path) {
        throw new Error("Not Implemented.");
    }

    function StartNavigation() {
        NavigateTo(window.location.hash);
    }

    return {
        INativationController: INativationController,
        InitializeNavigation: InitializeNavigation,
        RegisterNavigationPath: RegisterNavigationPath,
        NavigateTo: NavigateTo,
        StartNavigation: StartNavigation,
    }
});