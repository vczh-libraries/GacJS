/*
API:
    AttachParentChangedEvent(element, callback);
    DetachParentChangedEvent(element, callback);
    AttachResizeEvent(element, callback);
    DetachResizeEvent(element, callback);
*/

Packages.Define("Html.RunAfterWindowLoaded", function () {

    var windowLoaded = false;
    var runAfterWindowLoadedFunctions = [];

    window.addEventListener("load", function (event) {
        windowLoaded = true;
        for (var i = 0; i < runAfterWindowLoadedFunctions.length; i++) {
            runAfterWindowLoadedFunctions[i]();
        }
        runAfterWindowLoadedFunctions = [];
    }, false);

    function RunAfterWindowLoaded(func) {
        if (windowLoaded === true) {
            func();
        }
        else {
            runAfterWindowLoadedFunctions.push(func);
        }
    }

    return {
        RunAfterWindowLoaded: RunAfterWindowLoaded,
    }
});