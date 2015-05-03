/*
API:
================================================================================

    Packages.EnabledRegistering
    Packages.Types[fullName]
    Packages.Packages[fullName]
    Packages.RegisterType(type);

    var package = Packages.Define(fullName, function() {
        return {
            ExportedSymbol: value,
        };
    });

    var package = Packages.Define(fullName, [dependency1, dependency2, ...], function(__injection__) {
        eval(__injection__);

        return {
            ExportedSymbol: value,
        };
    });

    var package = Packages.Require(fullName);
    eval(Packages.Inject(package1, package2, ...));
*/

///////////////////////////////////////////////////////////////

function Packages() {
}

Object.defineProperty(Packages, "EnabledRegistering", {
    configurable: false,
    enumerable: true,
    writable: true,
    value: true,
});

Object.defineProperty(Packages, "Types", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: {},
});

Object.defineProperty(Packages, "Packages", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: {},
});

Object.defineProperty(Packages, "__PackageDefinitions", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: {},
});

Object.defineProperty(Packages, "RegisterType", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function (type) {
        if (Packages.EnabledRegistering) {
            if (Packages.Types.hasOwnProperty(type.FullName)) {
                throw new Error("Type \"" + type.FullName + "\" has already been registered.");
            }
            Packages.Types[type.FullName] = type;
        }
    }
});

Object.defineProperty(Packages, "__PreparePackage", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function (fullName) {
        if (!Packages.__PackageDefinitions.hasOwnProperty(fullName)) {
            Packages.__PackageDefinitions[fullName] = {
                ReverseDependencies: [],
            }
        }
    }
});

Object.defineProperty(Packages, "__TryLoadPackage", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function (fullName) {
        var def = Packages.__PackageDefinitions[fullName];
        if (def === undefined) return;
        if (def.Loaded === undefined || def.Loaded === true) return;
        if (def.Counter < def.RequiredCounter) return;

        def.Loaded = true;
        def.Constructor(fullName);
        for (var i = 0; i < def.ReverseDependencies.length; i++) {
            var name = def.ReverseDependencies[i];
            var rdep = Packages.__PackageDefinitions[name];
            rdep.Counter++;
            Packages.__TryLoadPackage(name);
        }
    }
});

Object.defineProperty(Packages, "Define", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function () {
        var needInject = arguments.length === 3;
        var fullName = arguments[0];
        var dependencies = needInject ? arguments[1] : [];
        var constructor = needInject ? arguments[2] : arguments[1];

        for (var i = 0; i < dependencies.length; i++) {
            Packages.__PreparePackage(dependencies[i]);
        }
        Packages.__PreparePackage(fullName);

        var def = Packages.__PackageDefinitions[fullName];
        if (def.Loaded !== undefined) {
            throw new Error("Required package \"" + fullName + "\" already exists.");
        }

        for (var i = 0; i < dependencies.length; i++) {
            var dependency = Packages.__PackageDefinitions[dependencies[i]].ReverseDependencies.push(fullName);
        }

        def.Dependencies = dependencies;
        def.Loaded = false;
        def.Counter = 0;
        def.RequiredCounter = dependencies.length;
        def.Constructor = function (fullName) {
            var pkg = {};
            Packages.Packages[fullName] = pkg;

            var obj = constructor(Packages.Inject(dependencies));
            for (var i in obj) {
                if (pkg.hasOwnProperty(i)) {
                    throw new Error("Package \"" + fullName + "\" has already exported symbol \"" + i + "\".");
                }
                pkg[i] = obj[i];
            }
        }

        for (var i in Packages.__PackageDefinitions) {
            Packages.__TryLoadPackage(i);
        }
    }
});

Object.defineProperty(Packages, "Require", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function (fullName) {
        if (!Packages.Packages.hasOwnProperty(fullName)) {
            throw new Error("Required package \"" + fullName + "\" does not exist.");
        }
        return Packages.Packages[fullName];
    }
});

Object.defineProperty(Packages, "Inject", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function () {
        var symbols = {};
        var names =
            arguments.length === 1 && arguments[0] instanceof Array ?
            arguments[0] :
            arguments;

        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            var pkg = Packages.Require(name);
            for (var j in pkg) {
                if (symbols.hasOwnProperty(j)) {
                    throw new Error("Duplicate name \"" + j + "\" in specified packages.");
                }
                symbols[j] = pkg[j];
            }
        }

        var code = "";
        for (var i in names) {
            var name = names[i];
            var pkg = Packages.Require(name);
            for (var j in pkg) {
                code += "var " + j + " = Packages.Packages[" + JSON.stringify(name) + "][" + JSON.stringify(j) + "];\r\n";
            }
        }
        return code;
    }
});

Object.seal(Packages);