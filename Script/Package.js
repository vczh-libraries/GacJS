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

    var package = Packages.Require(fullName);
    var code = Packages.Inject(package1, package2, ...);
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

Object.defineProperty(Packages, "Define", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function () {
        var needInject = arguments.length === 3;
        var fullName = arguments[0];
        var packages = needInject ? arguments[1] : undefined;
        var constructor = needInject ? arguments[2] : arguments[1];

        var pkg = Packages.Packages[fullName];
        if (pkg === undefined) {
            pkg = {};
            Packages.Packages[fullName] = pkg;
        }

        var obj = needInject ? constructor(this.Inject(packages)) : constructor();
        for (var i in obj) {
            if (pkg.hasOwnProperty(i)) {
                throw new Error("Package \"" + fullName + "\" has already exported symbol \"" + i + "\".");
            }
            pkg[i] = obj[i];
        }
        return pkg;
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
        for (var i in arguments) {
            var name = arguments[i];
            var pkg = this.Require(name);
            for (var j in pkg) {
                if (symbols.hasOwnProperty(j)) {
                    throw new Error("Duplicate name \"" + j + "\" in specified packages.");
                }
                symbols[j] = pkg[j];
            }
        }

        var code = "";
        for (var i in arguments) {
            var name = arguments[i];
            var pkg = this.Require(name);
            for (var j in pkg) {
                code += "var " + j + " = Packages.Packages[" + JSON.stringify(name) + "][" + JSON.stringify(j) + "];\r\n";
            }
        }
        return code;
    }
});

Object.seal(Packages);