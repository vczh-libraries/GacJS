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
            RegisterNavigationPath("/Demo", DemoController);
                http://localhost:80#<hashFlag>/Demo
            RegisterNavigationPath("/{DemoName}", IndividualDemoController, {}, DemoController);
                http://localhost:80#<hashFlag>/Demo/HelloWorld
            RegisterNavigationPath("/Source", DemoSourceController, {FileName:"main.cpp"}, IndividualDemoController);
                http://localhost:80#<hashFlag>/Demo/HelloWorld/Source
                ==> http://localhost:80#<hashFlag>/Demo/HelloWorld/Source/main.cpp
            RegisterNavigationPath("/Source/{FileName}", DemoSourceController, {}, IndividualDemoController);
                http://localhost:80#<hashFlag>/Demo/HelloWorld/Source/main.cpp
            RegisterNavigationPath("/Document", DocumentController, {Symbols:["vl","presentation","controls","GuiControl"]});
                http://localhost:80#<hashFlag>/Document
                ==> http://localhost:80#<hashFlag>/Document/vl/presentation/controls/GuiControl
            RegisterNavigationPath("/Document/{*Symbols}", DocumentController);
                http://localhost:80#<hashFlag>/Document/vl/presentation/controls/GuiControl
                {*xx} should be at the end of a complete pattern

    string BuildNavigation(Path|Hash|Url)([{type:type, values:values}, {type:type, values:values},  ...]);
        example:
            BuildNavigationPath([
                [DemoController, {}],
                [IndividualDemoController, {DemoName:"HelloWorld"}]
                [DemoSourceController, {FileName:"main.cpp"}]
                ])
            returns
                Path: Demo/HelloWorld/Source/main.cpp
                Hash: #<hashFlag>/Demo/HelloWorld/Source/main.cpp
                Path: http://localhost:80#<hashFlag>/Demo/HelloWorld/Source/main.cpp

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
            level: Protected(null),
            patternIndex: Protected(null),
            argumentIndex: Protected(-1),

            SetArgumentIndex: Public(function (index) {
                this.argumentIndex = index;
            }),

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

            ControllerType: Public.StrongTyped(__Void, [__Type, __Number], function (controllerType, level) {
                if (this.controllerType !== null) {
                    throw new Error("Controller type has already been assigned");
                }
                if (!INativationController.IsAssignableFrom(controllerType)) {
                    throw new Error("Controller type should implements \"" + INativationController.FullName + "\".");
                }
                this.controllerType = controllerType;
                this.level = level;
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
                handler.SetArgumentIndex(index);
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
                    callback.Create(this.controllerType, this.level);
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
                    this.Execute([fragment], storage, callback);
                    return this.patternIndex["*"];
                }
                else {
                    throw new Error("Failed to parse the input fragment \"" + fragment + "\".");
                }
            }),

            Finish: Public.Virtual.StrongTyped(__Void, [IPatternHandlerCallback], function (callback) {
                if (this.controllerType !== null) {
                    var storage = callback.nav_GetStorage();
                    this.Execute(null, storage, callback);
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

    var PathFragmentType = Enum(FQN("PathFragmentType"), {
        Constant: 0,
        Argument: 1,
        Array: 2,
    });

    var PathFragment = Struct(FQN("PathFragment"), {
        type: PathFragmentType.Description.Constant,
        content: "",
    });

    var PathConfig = Class(FQN("PathConfig"), {
        parentPathConfig: Public(null),
        controllerType: Public(null),
        defaultValues: Public(null),
        handler: Public(null),
        usedArguments: Public(0),
        level: Public(-1),
        pathFragments: Public(null),
    });

    var rootNavigationController = null;
    var rootPatternHandler = null;
    var hashFlag = null;
    var typePathConfigs = null;

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
        typePathConfigs = {};
    }

    /********************************************************************************
    RegisterNavigationPath
    ********************************************************************************/

    function ParsePathFragments(pattern) {
        var pathFragments = [];

        var textFragments = pattern.split("/");
        for (var j = (textFragments[0] === "" ? 1 : 0) ; j < textFragments.length; j++) {
            var textFragment = textFragments[j];
            if (textFragment === "+" || textFragment === "*") {
                throw new Error("Fragments in the URL pattern should not be \"+\" or \"*\".");
            }

            var pathFragment = new PathFragment();

            if (textFragment[0] === "{" && textFragment[textFragment.length - 1] === "}") {
                if (textFragment[1] === "*") {
                    pathFragment.type = PathFragmentType.Description.Array;
                    pathFragment.content = textFragment.substring(2, textFragment.length - 1);
                }
                else {
                    pathFragment.type = PathFragmentType.Description.Argument;
                    pathFragment.content = textFragment.substring(1, textFragment.length - 1);
                }
            }
            else {
                pathFragment.type = PathFragmentType.Description.Constant;
                pathFragment.content = textFragment;
            }

            pathFragments.push(pathFragment);
        }

        return pathFragments;
    }

    function RegisterNavigationPath(pattern, type, defaultValues, parentType) {
        EnsureInitialized();

        var pathFragments = ParsePathFragments(pattern);

        var parentPathKey = (parentType === undefined ? "" : parentType.FullName);
        var parentPathConfigs = typePathConfigs[parentPathKey];
        if (parentPathConfigs === undefined) {
            var pathConfig = new PathConfig();
            pathConfig.handler = rootPatternHandler;
            parentPathConfigs = [pathConfig];
            typePathConfigs[parentPathKey] = parentPathConfigs;
        }

        for (var i = 0; i < parentPathConfigs.length; i++) {
            var parentPathConfig = parentPathConfigs[i];
            var handler = parentPathConfig.handler;
            var usedArguments = parentPathConfig.usedArguments;
            var assignedArguments = {};

            for (var j = 0; j < pathFragments.length; j++) {
                var pathFragment = pathFragments[j];
                switch (pathFragment.type) {
                    case PathFragmentType.Description.Constant:
                        handler = handler.ConstantIndex(pathFragment.content);
                        break;
                    case PathFragmentType.Description.Argument:
                        assignedArguments[pathFragment.content] = usedArguments;
                        handler = handler.ArgumentIndex(usedArguments++);
                        break;
                    case PathFragmentType.Description.Array:
                        assignedArguments[pathFragment.content] = usedArguments;
                        handler = handler.ArrayIndex(usedArguments++);
                        break;
                }
            }

            var currentPathConfigs = typePathConfigs[type.FullName];
            if (currentPathConfigs === undefined) {
                currentPathConfigs = [];
                typePathConfigs[type.FullName] = currentPathConfigs;
            }

            var pathConfig = new PathConfig();
            pathConfig.parentPathConfig = parentPathConfig;
            pathConfig.controllerType = type;
            pathConfig.defaultValues = (defaultValues === undefined ? {} : defaultValues);
            pathConfig.handler = handler;
            pathConfig.usedArguments = usedArguments;
            pathConfig.level = parentPathConfig.level + 1;
            pathConfig.pathFragments = pathFragments;
            currentPathConfigs.push(pathConfig);

            handler.ControllerType(type, pathConfig.level);
            for (var j in assignedArguments) {
                var index = assignedArguments[j];
                handler.Argument(j, index);
            }
            if (defaultValues !== undefined) {
                for (var j in defaultValues) {
                    var value = defaultValues[j];
                    handler.Setter(j, value);
                }
            }
        }
    }

    /********************************************************************************
    BuildNavigationPath
    ********************************************************************************/

    function EnumeratePathConfigsMatrix(arguments, index, postfixMatrix) {
        var type = (index === -1 ? null : arguments[index].type);

        if (postfixMatrix !== undefined) {
            for (var i = postfixMatrix.length - 1; i >= 0; i--) {
                var row = postfixMatrix[i];
                var accepted = (type === null
                    ? row[0].parentPathConfig === null
                    : row[0].parentPathConfig.controllerType === type
                    );
                if (!accepted) {
                    postfixMatrix.splice(i, 1);
                }
            }

            if (postfixMatrix.length === 0) {
                return [];
            }
        }

        if (index === -1) {
            if (postfixMatrix === undefined) {
                return [];
            }
            else {
                return postfixMatrix;
            }
        }

        var pathConfigs = typePathConfigs[type.FullName];
        if (pathConfigs === undefined) {
            return [];
        }

        var prefixColumn = [];
        for (var i = 0; i < pathConfigs.length; i++) {
            var pathConfig = pathConfigs[i];
            var defaultValues = pathConfig.defaultValues;
            var expectedValues = arguments[index].values;
            var accepted = true;

            for (var j in expectedValues) {
                if (defaultValues.hasOwnProperty(j)) {
                    if (expectedValues[j] !== defaultValues[j]) {
                        accepted = false;
                    }
                }
                if (!accepted) {
                    break;
                }
            }

            if (accepted) {
                prefixColumn.push(pathConfig);
            }
        }

        var matrix = [];
        if (postfixMatrix === undefined) {
            postfixMatrix = [[]];
        }

        for (var i = 0; i < prefixColumn.length; i++) {
            var head = [prefixColumn[i]];
            for (var j = 0; j < postfixMatrix.length; j++) {
                var tail = postfixMatrix[j];
                matrix.push(head.concat.apply(head, tail));
            }
        }

        return EnumeratePathConfigsMatrix(arguments, index - 1, matrix);
    }

    function BuildNavigationPath(arguments) {
        EnsureInitialized();
        throw new Error("Not Implemented.");
    }

    function BuildNavigationHash(arguments) {
        return "#" + hashFlag + "/" + BuildNavigationPath(arguments);
    }

    function BuildNavigationUrl(arguments) {
        var href = window.location.href;
        var hash = window.location.hash;
        return href.substring(0, href.length - hash.length) + BuildNavigationHash(arguments);
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

        Set: Public.Override.StrongTyped(__Void, [__String, __Object], function (name, value) {
            var last = this.GetLast();
            last.values[name] = value;
        }),
        Create: Public.Override.StrongTyped(__Void, [__Type, __Number], function (type, level) {
            var last = this.GetLast();
            last.type = type;

            if (level < this.result.length - 1) {
                this.result.splice(level, this.result.length - 1 - level);
            }
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
        for (var i = 0 ; i < fragments.length; i++) {
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
        BuildNavigationHash: BuildNavigationHash,
        BuildNavigationUrl: BuildNavigationUrl,
        ParseNavigationPath: ParseNavigationPath,
        NavigateTo: NavigateTo,
        StartNavigation: StartNavigation,
    }
});