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

    function FQN(name) {
        return "<Html.Navigation>::" + name;
    }

    /********************************************************************************
    INativationController
    ********************************************************************************/

    var INativationController = Class(FQN("INavigationController"), {
        subController: Private(null),

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

    /********************************************************************************
    PatternHandler
    ********************************************************************************/

    var IPatternHandlerCallback = Class(FQN("IPatternHandlerCallback"), {
        storage: Protected(null),

        Set: Public.Abstract(),
        Create: Public.Abstract(),

        nav_GetStorage: Public(function () {
            return this.storage;
        }),

        __Constructor: Public(function () {
            this.storage = { array: false };
        }),
    });

    var PatternHandler = Class(FQN("PatternHandler"), {
        arguments: Protected(null),
        controllerType: Protected(null),
        patternIndex: Protected(null),
        argumentIndex: Protected(-1),

        __Constructor: Public(function () {
            this.arguments = {};
            this.patternIndex = {};
        }),

        Argument: Public.StrongTyped(__Void, [__String, __Number], function (argumentName, argumentIndex) {
            if (this.arguments.hasOwnProperty(argumentName)) {
                throw new Error("Argument \"" + argumentName + "\" has already been assigned.");
            }
            this.arguments[argumentName] = argumentIndex;
        }),

        Setter: Public.StrongTyped(__Void, [__String, __String], function (argumentName, argumentValue) {
            if (this.arguments.hasOwnProperty(argumentName)) {
                throw new Error("Argument \"" + argumentName + "\" has already been assigned.");
            }
            this.arguments[argumentName] = argumentValue;
        }),

        ControllerType: Public.StrongTyped(__Void, [__Type], function (controllerType) {
            if (this.controllerType !== null) {
                throw new Error("Controller type has already been assigned");
            }
            if (!INativationController.IsAssignableFrom(controllerType)) {
                throw new Error("Controller type should implements \"" + INativationController.FullName + "\".");
            }
            this.controllerType = controllerType;
        }),

        ConstantIndex: Public.StrongTyped(__Void, [__String, PatternHandler], function (constant, handler) {
            PatternHandler.RequireType(handler);
            if (this.patternIndex.hasOwnProperty(constant)) {
                throw new Error("Index \"" + constant + "\" has already been assigned.");
            }
            this.patternIndex[constant] = handler;
        }),

        ArgumentIndex: Public.StrongTyped(__Void, [__Number, PatternHandler], function (index, handler) {
            if (this.patternIndex.hasOwnProperty("+")) {
                throw new Error("Argument index has already been assigned.");
            }
            if (this.patternIndex.hasOwnProperty("*")) {
                throw new Error("Array index has already been assigned.");
            }
            this.patternIndex["+"] = handler;
            this.argumentIndex = index;
        }),

        ArrayIndex: Public.StrongTyped(__Void, [PatternHandler], function (handler) {
            if (this.patternIndex.hasOwnProperty("+")) {
                throw new Error("Argument index has already been assigned.");
            }
            if (this.patternIndex.hasOwnProperty("*")) {
                throw new Error("Array index has already been assigned.");
            }
            this.patternIndex["*"] = handler;
            this.argumentIndex = index;
        }),

        Execute: Protected(function (fragment, storage, callback) {
            if (fragment !== null && this.argumentIndex !== -1) {
                storage[this.argumentIndex] = fragment;
            }
            for (var i in this.arguments) {
                var value = this.arguments[i];
                if (typeof value === "number") {
                    callback.Set(i, storage[value]);
                }
                else {
                    callback.Set(i, value);
                }
            }
            if (this.controllerType !== null) {
                callback.Create(this.controllerType);
            }
        }),

        Parse: Public.Virtual.StrongTyped(PatternHandler, [__String, IPatternHandlerCallback], function (fragment, callback) {
            var storage = callback.nav_GetStorage();
            if (storage.array === true) {
                storage[this.argumentIndex].push(fragment);
                return this.__ExternalReference;
            }

            if (this.patternIndex.hasOwnProperty(fragment)) {
                this.Execute(null, storage, callback);
                return this.patternIndex[fragment];
            }
            else if (this.patternIndex.hasOwnProperty("+")) {
                this.Execute(fragment, storage, callback);
                return this.patternIndex["+"];
            }
            else if (this.patternIndex.hasOwnProperty("*")) {
                storage.array = true;
                storage[this.argumentIndex].push(fragment);
                return this.__ExternalReference;
            }
            else {
                throw new Error("Failed to parse the input fragment \"" + fragment + "\".");
            }
        }),

        Finish: Public.Virtual.StrongTyped(__Void, [IPatternHandlerCallback], function (callback) {
            var storage = callback.nav_GetStorage();
            if (storage.array === true) {
                this.Execute(null, storage, callback);
            }
            else {
                throw new Error("Unexpected end of input.");
            }
        }),
    });

    var LastPatternHandler = Class(FQN("LastPatternHandler"), PatternHandler, {
        Parse: Public.Override.StrongTyped(PatternHandler, [__String, IPatternHandlerCallback], function (fragment, callback) {
            throw new Error("Failed to parse the input fragment \"" + fragment + "\".");
        }),

        Finish: Public.Override.StrongTyped(__Void, [IPatternHandlerCallback], function (callback) {
        }),
    });

    /********************************************************************************
    Configuration
    ********************************************************************************/

    var rootNavigationController = null;
    var hashFlag = "vczh";

    function EnsureInitialized() {
        if (rootNavigationController === null) {
            throw new Error("InitializeNavigation should be called before using this function.");
        }
    }

    /********************************************************************************
    API
    ********************************************************************************/

    function InitializeNavigation(_hashFlag, rootType) {
        hashFlag = _hashFlag;
        rootNavigationController = new rootType();
        throw new Error("Not Implemented.");
    }

    function FinalizeNavigation() {
        if (rootNavigationController !== null) {
            rootNavigationController.NavigateTo(null);
            hashFlag = "vczh";
            rootNavigationController = null;
        }
    }

    function RegisterNavigationPath(pattern, type, defaultValues, parentType) {
        EnsureInitialized();
        throw new Error("Not Implemented.");
    }

    function BuildNavigationPath(arguments) {
        EnsureInitialized();
        throw new Error("Not Implemented.");
    }

    function NavigateTo(path) {
        EnsureInitialized();
        throw new Error("Not Implemented.");
    }

    function StartNavigation() {
        NavigateTo(window.location.hash);
    }

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        INativationController: INativationController,
        InitializeNavigation: InitializeNavigation,
        FinalizeNavigation: FinalizeNavigation,
        RegisterNavigationPath: RegisterNavigationPath,
        NavigateTo: NavigateTo,
        StartNavigation: StartNavigation,
    }
});