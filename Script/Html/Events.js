/*
API:
    AttachGeneralEvent(element, eventName, callback, initialize);
    DetachGeneralEvent(element, eventName, callback, finalize);
*/
Packages.Define("Html.Events", function () {

    function AttachGeneralEvent(element, eventName, callback, initialize) {
        var fieldName = "gacjs_" + eventName + "Handlers";
        var handlers = element[fieldName];
        if (element[fieldName] === undefined) {
            handlers = [];
            element[fieldName] = handlers;

            function RaiseEvent() {
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i].apply(this, arguments);
                }
            }

            initialize(RaiseEvent);
        }
        handlers.push(callback);
    }

    function DetachGeneralEvent(element, eventName, callback, finalize) {
        var fieldName = "gacjs_" + eventName + "Handlers";
        var handlers = element[fieldName];
        if (handlers !== undefined) {
            var index = handlers.indexOf(callback);
            if (index !== -1) {
                handlers.splice(index, 1);
            }

            if (handlers.length === 0) {
                finalize();
                delete element[fieldName];
            }
        }
    }

    return {
        AttachGeneralEvent: AttachGeneralEvent,
        DetachGeneralEvent: DetachGeneralEvent,
    }
});