/*
API:
    AttachGeneralEvent(element, eventName, callback, initialize);
    DetachGeneralEvent(element, eventName, callback, finalize);
*/
Packages.Define("Html.Events", ["Class"], function (__injection__) {
    eval(__injection__);

    function AttachGeneralEvent(element, eventName, callback, initialize) {
        var fieldName = "gacjs_" + eventName + "Handlers";
        var eventContainer = element[fieldName];

        if (eventContainer === undefined) {
            eventContainer = new __Event();
            element[fieldName] = eventContainer;
            initialize(eventContainer);
        }
        return eventContainer.Attach(callback);
    }

    function DetachGeneralEvent(element, eventName, handler, finalize) {
        var fieldName = "gacjs_" + eventName + "Handlers";
        var eventContainer = element[fieldName];

        if (eventContainer !== undefined) {
            eventContainer.Detach(handler);

            if (eventContainer.IsEmpty()) {
                finalize();
                delete element[fieldName];
            }
        }
    }

    return {
        AttachGeneralEvent: AttachGeneralEvent,
        DetachGeneralEvent: DetachGeneralEvent
    }
});