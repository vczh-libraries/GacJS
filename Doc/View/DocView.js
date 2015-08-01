
Packages.Define("Doc.View", ["Class", "Doc.SymbolTree", "IO.Resource", "IO.Delay"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    Views
    ********************************************************************************/

    var DocRenderType = Enum(PQN("DocRenderType"), {
        Detailed: 0,
        ClassMember: 1,
        FunctionParameter: 2,
    });

    var viewType = null;
    var viewTemplate = null;
    var viewSpecification = null;
    var viewTypedef = null;
    var viewVar = null;
    var viewFunction = null;
    var viewEnum = null;
    var viewClass = null;
    var viewGroupedField = null;

    function RenderType(type, continuation) {
        var model = { type: type, continuation: continuation };
        return viewType(model);
    }

    function RenderTemplate(template) {
        var model = { template: template };
        return viewTemplate(model);
    }

    function RenderSpecification(template) {
        var model = { template: template };
        return viewSpecification(model);
    }

    function RenderSymbol(renderType, symbol) {
        if (TemplateDecl.TestType(symbol)) {
            symbol = symbol.Element;
        }
        var model = { renderType: renderType, symbol: symbol };

        if (ClassDecl.TestType(symbol)) {
            return viewClass(model);
        }
        else if (VarDecl.TestType(symbol)) {
            return viewVar(model);
        }
        else if (FuncDecl.TestType(symbol)) {
            return viewFunction(model);
        }
        else if (EnumDecl.TestType(symbol)) {
            return viewEnum(model);
        }
        else if (TypedefDecl.TestType(symbol)) {
            return viewTypedef(model);
        }
        else if (GroupedFieldDecl.TestType(symbol)) {
            return viewGroupedField(model);
        }
        else {
            throw new Error("Cannot render symbol of type \"" + symbol.__Type.FullName + "\".");
        }
    }

    function FindSymbolByOverloadKey(symbol, overloadKey) {
        if (symbol.OverloadKey === overloadKey) {
            return symbol;
        }

        if (TemplateDecl.TestType(symbol)) {
            return FindSymbolByOverloadKey(symbol.Element, overloadKey);
        }

        for (var i = 0; i < symbol.Children.length; i++) {
            var result = FindSymbolByOverloadKey(symbol.Children[i], overloadKey);
            if (result !== null) {
                return result;
            }
        }

        return null;
    }

    /********************************************************************************
    CancelAndRunAfterDocViewReady
    ********************************************************************************/

    var taskSucceeded = null;
    var taskFailed = null;
    var taskReady = false;
    var taskPreparing = false;

    function RunTask(succeeded) {
        if (succeeded) {
            if (taskSucceeded !== null) {
                taskSucceeded();
            }
        }
        else {
            if (taskFailed !== null) {
                taskFailed();
            }
        }

        taskSucceeded = null;
        taskFailed = null;
    }

    function PrepareDocView() {
        if (taskPreparing === false) {
            taskPreparing === true;

            var asyncType = GetResourceAsync("./Doc/View/Type.razor.html", true);
            var asyncTemplate = GetResourceAsync("./Doc/View/Template.razor.html", true);
            var asyncSpecification = GetResourceAsync("./Doc/View/Specification.razor.html", true);
            var asyncTypedef = GetResourceAsync("./Doc/View/Typedef.razor.html", true);
            var asyncVar = GetResourceAsync("./Doc/View/Var.razor.html", true);
            var asyncFunction = GetResourceAsync("./Doc/View/Function.razor.html", true);
            var asyncEnum = GetResourceAsync("./Doc/View/Enum.razor.html", true);
            var asyncClass = GetResourceAsync("./Doc/View/Class.razor.html", true);
            var asyncGroupedField = GetResourceAsync("./Doc/View/GroupedField.razor.html", true);

            var asyncTasks = [asyncType, asyncTemplate, asyncSpecification, asyncTypedef, asyncVar, asyncFunction, asyncEnum, asyncClass, asyncGroupedField];
            WaitAll(asyncTasks).Then(function (result) {
                for (var i = 0; i < result.length; i++) {
                    if (DelayException.TestType(result[i])) {
                        taskPreparing = false;
                        RunTask(false);
                        return;
                    }
                }

                viewType = result[0].Razor;
                viewTemplate = result[1].Razor;
                viewSpecification = result[2].Razor;
                viewTypedef = result[3].Razor;
                viewVar = result[4].Razor;
                viewFunction = result[5].Razor;
                viewEnum = result[6].Razor;
                viewClass = result[7].Razor;
                viewGroupedField = result[8].Razor;

                taskReady = true;
                taskPreparing = false;
                RunTask(true);
            });
        }
    }

    function CancelAndRunAfterDocViewReady(succeeded, failed) {
        taskSucceeded = succeeded;
        taskFailed = failed;

        if (taskReady) {
            RunTask(true);
        }
        else if (!taskPreparing) {
            PrepareDocView();
        }
    }

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        DocRenderType: DocRenderType,
        RenderType: RenderType,
        RenderTemplate: RenderTemplate,
        RenderSpecification: RenderSpecification,
        RenderSymbol: RenderSymbol,
        FindSymbolByOverloadKey: FindSymbolByOverloadKey,
        CancelAndRunAfterDocViewReady: CancelAndRunAfterDocViewReady,
    }
});