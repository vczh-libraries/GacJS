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

    void RegisterNavigationPath(pattern, type, defaultValues, parentType);
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

    string BuildNavigationPath([{type:type, values:values}, {type:type, values:values},  ...]);
        example:
            BuildNavigationPath([
                [DemoController, {}],
                [DemoSourceController, {FileName:"main.cpp"}]
                ])
            returns /Demo/HelloWorld/Source/main.cpp
            because DemoControler::DemoName has a default value "HelloWorld"

    [{type:type, values:values}, {type:type, values:values},  ...] ParseNavigationPath(string path);
        reverted BuildNavigationPath

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

    var PatternHandler = Class(FQN("PatternHandler"), function () {
        return {
            arguments: Protected(null),
            controllerType: Protected(null),
            patternIndex: Protected(null),
            argumentIndex: Protected(-1),
            lastHandler: Protected(null),

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

            Last: Public.StrongTyped(PatternHandler, [], function () {
                if (this.lastHandler !== null) {
                    throw new Error("Ambiguous rule is not allowed.");
                }
                this.lastHandler = new PatternHandler();
                return this.lastHandler;
            }),

            ConstantIndex: Public.StrongTyped(PatternHandler, [__String], function (constant) {
                var handler = null;
                if (this.patternIndex.hasOwnProperty(constant)) {
                    handler = this.patternIndex[constant];
                }
                else {
                    handler = new PatternHandler();
                    this.patternIndex[constant] = handler;
                }
                return handler;
            }),

            ArgumentIndex: Public.StrongTyped(PatternHandler, [__Number], function (index) {
                if (this.patternIndex.hasOwnProperty("*")) {
                    throw new Error("Array index has already been assigned.");
                }

                var handler = null;
                if (this.patternIndex.hasOwnProperty("+")) {
                    handler = this.patternIndex["+"];
                }
                else {
                    handler = new PatternHandler();
                    this.patternIndex["+"] = handler;
                }
                this.argumentIndex = index;
                return handler;
            }),

            ArrayIndex: Public.StrongTyped(PatternHandler, [__Number], function (index) {
                if (this.patternIndex.hasOwnProperty("+")) {
                    throw new Error("Argument index has already been assigned.");
                }

                var handler = null;
                if (this.patternIndex.hasOwnProperty("*")) {
                    handler = this.patternIndex["*"];
                }
                else {
                    handler = new PatternHandler();
                    this.patternIndex["*"] = handler;
                }
                this.argumentIndex = index;
                return handler;
            }),

            Execute: Public(function (fragment, storage, callback) {
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
                if (this.lastHandler !== null) {
                    var storage = callback.nav_GetStorage();
                    if (storage.array === true) {
                        this.Execute(null, storage, callback);
                    }
                    this.lastHandler.Execute(null, storage, callback);
                }
                else {
                    throw new Error("Unexpected end of input.");
                }
            }),
        }
    });

    /********************************************************************************
    Configuration
    ********************************************************************************/

    var rootNavigationController = null;
    var rootPatternHandler = null;
    var hashFlag = null;
    var typeLastHandlers = null;

    function EnsureInitialized() {
        if (rootNavigationController === null) {
            throw new Error("InitializeNavigation should be called before using this function.");
        }
    }

    /********************************************************************************
    InitializeNavigation
    ********************************************************************************/

    function InitializeNavigation(_hashFlag, rootType) {
        rootNavigationController = new rootType();
        rootPatternHandler = new PatternHandler();
        hashFlag = _hashFlag;
        typeLastHandlers = {};
    }

    /********************************************************************************
    RegisterNavigationPath
    ********************************************************************************/

    function RegisterNavigationPath(pattern, type, defaultValues, parentType) {
        EnsureInitialized();

        var lastHandlerKey = (parentType === undefined ? "" : parentType.FullName);
        var startHandlers = typeLastHandlers[lastHandlerKey];
        if (startHandlers === undefined) {
            startHandlers = [{ handler: rootPatternHandler, usedArguments: 0 }];
            typeLastHandlers[lastHandlerKey] = startHandlers;
        }

        for (var i = 0; i < startHandlers.length; i++) {
            var handler = startHandlers[i].handler;
            var usedArguments = startHandlers[i].usedArguments;
            var assignedArguments = {};

            if (pattern !== "/") {
                var fragments = pattern.split("/");
                for (var j = (fragments[0] === "" ? 1 : 0) ; j < fragments.length; j++) {
                    var fragment = fragments[j];
                    if (fragment === "" || fragment === "+" || fragment === "*") {
                        throw new Error("Fragments in the URL pattern should not be \"\", \"+\" or \"*\".");
                    }

                    if (fragment[0] === "{" && fragment[fragment.length - 1] === "}") {
                        if (fragment[1] === "*") {
                            assignedArguments[fragment.substring(2, fragment.length - 1)] = usedArguments;
                            handler = handler.ArrayIndex(usedArguments++);
                        }
                        else {
                            assignedArguments[fragment.substring(1, fragment.length - 1)] = usedArguments;
                            handler = handler.ArgumentIndex(usedArguments++);
                        }
                    }
                    else {
                        handler = handler.ConstantIndex(fragment);
                    }
                }
            }

            var lastHandler = handler.Last();
            lastHandler.ControllerType(type);
            for (var j in assignedArguments) {
                var index = assignedArguments[j];
                lastHandler.Argument(j, index);
            }
            if (defaultValues !== undefined) {
                for (var j in defaultValues) {
                    var value = defaultValues[j];
                    lastHandler.Setter(j, value);
                }
            }

            var lastHandlers = typeLastHandlers[type.FullName];
            if (lastHandlers === undefined) {
                lastHandlers = [];
                typeLastHandlers[type.FullName] = lastHandlers;
            }
            lastHandlers.push({ handler: handler, usedArguments: usedArguments });
        }
    }

    /********************************************************************************
    BuildNavigationPath
    ********************************************************************************/

    function BuildNavigationPath(arguments) {
        EnsureInitialized();
        throw new Error("Not Implemented.");
    }

    /********************************************************************************
    ParseNavigationPath
    ********************************************************************************/

    var ParseCallback = Class(FQN("ParseCallback"), IPatternHandlerCallback, {
        result: Protected(null),

        GetLast: Protected(function () {
            var last = this.result[this.result.length - 1];
            if (last === undefined || last.type !== null) {
                last = { type: null, values: {} }
                this.result.push(last);
            }
            return last;
        }),

        Set: Public.Override.StrongTyped(__Void, [__String, __String], function (name, value) {
            var last = this.GetLast();
            last.values[name] = value;
        }),
        Create: Public.Override.StrongTyped(__Void, [__Type], function (type) {
            var last = this.GetLast();
            last.type = type;
        }),

        GetResult: Public(function () {
            return this.result;
        }),
        Result: Public.Property({ readonly: true }),

        __Constructor: Public(function () {
            this.__InitBase(IPatternHandlerCallback, []);
            this.result = [];
        }),
    });

    function ParseNavigationPath(path) {
        EnsureInitialized();
        var fragments = path.split("/");
        var callback = new ParseCallback();
        var handler = rootPatternHandler;
        for (var i = (fragments[0] === "" ? 1 : 0) ; i < fragments.length; i++) {
            handler = handler.Parse(fragments[i], callback);
        }
        handler.Finish(callback);
        return callback.Result;
    }

    /********************************************************************************
    NavigateTo
    ********************************************************************************/

    function NavigateTo(path) {
        EnsureInitialized();
        throw new Error("Not Implemented.");
    }

    /********************************************************************************
    StartNavigation
    ********************************************************************************/

    function StartNavigation() {
        var hash = window.location.hash;
        if (hash === "") {
            hash = "#" + hashFlag + "/";
        }
        if (hash[0] === "#") {
            hash = hash.substring(1, hash.length);
        }
        if (hash.length > hashFlag.length) {
            if (hash.substring(0, hashFlag.length + 1) === hashFlag + "/") {
                var path = hash.substring(hashFlag.length + 1, hash.length);
                return NavigateTo(path);
            }
        }
        throw new Error("Failed to navigate by hash \"#" + hash + "\".");
    }

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        INativationController: INativationController,
        InitializeNavigation: InitializeNavigation,
        RegisterNavigationPath: RegisterNavigationPath,
        BuildNavigationPath: BuildNavigationPath,
        ParseNavigationPath: ParseNavigationPath,
        NavigateTo: NavigateTo,
        StartNavigation: StartNavigation,
    }
});