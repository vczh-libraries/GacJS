/*
API:
*/
Packages.Define("Html.Razor", ["Class"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    RazorReIndent
    ********************************************************************************/

    function RazorReIndent(text) {
        var result = "";
        var lines = text.split("\n");
        var indent = undefined;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var firstChar = line.search(/[^\s]/);
            if (firstChar !== -1) {
                if (indent === undefined) {
                    indent = firstChar;
                }
                result += line.substring(indent, firstChar.length).replace(/\s*$/, "") + "\r\n";
            }
        }
        return result;
    }

    /********************************************************************************
    RazorToJs
    ********************************************************************************/

    var regexOption = /^@(\w+)\s+(\w+)$/;
    var regexCode = /^@\{$/;
    var regexStatement = /^@(for|while|do|if|switch|try|catch)\s*\(.*\)\s*\{/;
    var regexCommand = /^@(break|continue|throw(\s+.*)?);/;
    var regexVariable = /^@var\s+.*;/;
    var regexFunction = /^@function\s+(\w+)\s*\(\s*(?:(\w+)(?:,\s*(\w+))*)?\s*\)\s*\{$/;

    function RegexSwitch(text, branches) {
        for (var branch in branches) {
            if (branch !== "") {
                var regex = eval("regex" + branch);
                var match = regex.exec(text);
                if (match !== null) {
                    return branches[branch](match);
                }
            }
        }

        var defaultBranch = branches[""];
        if (defaultBranch !== undefined) {
            return defaultBranch();
        }
    }

    function RazorBodyToJs(indent, lines) {
        return lines.map(function (line) { return indent + line; }).join("\n") + "\n";
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            RegexSwitch(line, {
                Statement: function (matches) {
                },
                regexCommand: function (matches) {
                },
                Variable: function (matches) {
                },
                "": function () {
                }
            });
        }
    }

    function RazorToJs(razor) {
        var packages = ["Html.RazorHelper"];
        var model = null;
        var codes = [];
        var body = [];
        var functions = [];

        var InBody = 0;
        var InCode = 1;
        var InFunction = 2;
        var InFunctionBody = 3;

        var state = InBody;
        var statementCounter = 0;

        var lines = razor.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/^\s*/, "").replace(/\s*$/, "");
            if (line !== "") {
                RegexSwitch(line, {
                    Option: function (matches) {
                        if (state !== InBody) {
                            throw new Error("Option cannot appear in code block or functions: \"" + line + "\".");
                        }
                        switch (matches[1]) {
                            case "package":
                                packages.push(matches[2]);
                                break;
                            case "model":
                                if (model === null) {
                                    model = matches[2];
                                }
                                else {
                                    throw new Error("Option \"@model\" can only appear once: \"" + line + "\".");
                                }
                                break;
                            default:
                                throw new Error("Unknown option: \"" + line + "\".");
                        }
                    },
                    Code: function (matches) {
                        if (state !== InBody) {
                            throw new Error("Code block cannot appear in code block or functions: \"" + line + "\".");
                        }
                        state = InCode;
                    },
                    Function: function (matches) {
                        if (state !== InBody) {
                            throw new Error("Code block cannot appear in code block or functions: \"" + line + "\".");
                        }
                        state = InFunction;

                        var func = { name: matches[1], parameters: [], body: [] };
                        for (var j = 2; j < matches.length; j++) {
                            var parameter = matches[j];
                            if (parameter !== undefined) {
                                func.parameters.push(parameter);
                            }
                        }
                        functions.push(func);
                    },
                    Statement: function (matches) {
                        switch (state) {
                            case InBody:
                                body.push(line);
                                break;
                            case InFunction:
                                statementCounter++;
                                functions[functions.length - 1].body.push(line);
                                break;
                            default:
                                throw new Error("Illegal JavaScript statement: \"" + line + "\".");
                        }
                    },
                    "": function () {
                        switch (state) {
                            case InBody:
                                body.push(line);
                                break;
                            case InCode:
                                if (line[line.length - 1] === "{") {
                                    statementCounter++;
                                }
                                if (line === "}") {
                                    if (statementCounter === 0) {
                                        state = InBody;
                                        return;
                                    }
                                    else {
                                        statementCounter--;
                                    }
                                }
                                codes.push(lines[i]);
                                break;
                            case InFunction:
                                if (line === "}") {
                                    if (statementCounter === 0) {
                                        state = InBody;
                                        return;
                                    }
                                    else {
                                        statementCounter--;
                                    }
                                }
                                functions[functions.length - 1].body.push(line);
                                break;
                        }
                    }
                });
            }
        }

        var result = "";
        result += "function () {\n";
        result += "    eval(Packages.Inject([" + packages.map(JSON.stringify).join(", ") + "], true));\n";
        result += "\n";
        result += codes.join("\n");
        result += "\n";
        for (var i = 0; i < functions.length; i++) {
            var func = functions[i];
            result += "    function " + func.name + "(" + func.parameters.join(", ") + ") {\n";
            result += RazorBodyToJs("        ", func.body);
            result += "    }\n";
            result += "\n";
        }
        result += "    return function (model) {\n";
        if (model !== null) {
            result += "        " + model + ".RequireType(model);\n";
        }
        result += RazorBodyToJs("        ", body);
        result += "    }\n";
        result += "}()\n";
        return result;
    }

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        RazorReIndent: RazorReIndent,
        RazorToJs: RazorToJs,
    }
});

Packages.Define("Html.RazorHelper", ["Class"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
    }
});