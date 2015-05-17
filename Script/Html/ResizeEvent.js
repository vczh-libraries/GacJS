/*
API:
    AttachParentChangedEvent(element, callback);
    DetachParentChangedEvent(element, callback);
    AttachResizeEvent(element, callback);
    DetachResizeEvent(element, callback);
*/

Packages.Define("Html.ResizeEvent", ["Html.Events", "Html.RunAfterWindowLoaded"], function (__injection__) {
    eval(__injection__);

    function AttachConnectionToBodyChangedEvent(element, callback) {
        return AttachGeneralEvent(element, "ConnectionToBodyChanged", callback, function (eventContainer) {

            function ElementListContainsElement(records, element) {
                for (var i = 0; i < records.length; i++) {
                    if (records[i] === element) {
                        return true;
                    }
                }
                return false;
            }

            function RecordContainsElement(record, element) {
                if (ElementListContainsElement(record.addedNodes, element)) {
                    return true;
                }
                if (ElementListContainsElement(record.removedNodes, element)) {
                    return true;
                }
                return false;
            }

            function RecordContainsParentLine(record) {
                var current = element;
                while (current !== null) {
                    if (RecordContainsElement(record, current)) {
                        return true;
                    }
                    current = current.parentElement;
                }
                return false;
            }

            var observer = new MutationObserver(function (records) {
                function ExecuteEvent() {
                    eventContainer.Execute();
                }

                if (records.filter(RecordContainsParentLine).length > 0) {
                    RunAfterWindowLoaded(ExecuteEvent);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            element.gacjs_BodySubTreeObserver = observer;
        });
    }

    function DetachConnectionToBodyChangedEvent(element, handler) {
        return DetachGeneralEvent(element, "ConnectionToBodyChanged", handler, function () {
            element.gacjs_BodySubTreeObserver.disconnect();
            delete element.gacjs_BodySubTreeObserver;
        });
    }

    // This function is enhanced and modified to my coding style from
    // https://github.com/marcj/css-element-queries/
    function AttachResizeEvent(element, callback) {
        return AttachGeneralEvent(element, "Resize", callback, function (eventContainer) {

            function SetStyle(element, forContainer) {
                element.style.position = "absolute";
                element.style.left = "0";
                element.style.top = "0";

                if (forContainer) {
                    element.style.right = "0";
                    element.style.bottom = "0";
                    element.style.overflow = "scroll";
                    element.style.zIndex = "-1";
                    element.style.visibility = "hidden";
                }
                else {
                    element.style.width = "200%";
                    element.style.height = "200%";
                }

            }

            var expand = document.createElement("div");
            SetStyle(expand, true);

            var expandChild = document.createElement("div");
            SetStyle(expandChild, false);

            var shrink = document.createElement("div");
            SetStyle(shrink, true);

            var shrinkChild = document.createElement("div");
            SetStyle(shrinkChild, false);

            expand.appendChild(expandChild);
            shrink.appendChild(shrinkChild);

            element.appendChild(expand);
            element.appendChild(shrink);

            element.gacjs_ResizeExpand = expand;
            element.gacjs_ResizeShrink = shrink;

            var lastWidth = null;
            var lastHeight = null;

            function Reset() {
                expandChild.style.width = expand.offsetWidth + 10 + "px";
                expandChild.style.height = expand.offsetHeight + 10 + "px";
                expand.scrollLeft = expand.scrollWidth;
                expand.scrollTop = expand.scrollHeight;
                shrink.scrollLeft = shrink.scrollWidth;
                shrink.scrollTop = shrink.scrollHeight;
                lastWidth = element.offsetWidth;
                lastHeight = element.offsetHeight;
            }

            Reset();

            expand.addEventListener("scroll", function (event) {
                if (element.offsetWidth > lastWidth || element.offsetHeight > lastHeight) {
                    eventContainer.Execute();
                }
                Reset();
            }, false);

            shrink.addEventListener("scroll", function (event) {
                if (element.offsetWidth < lastWidth || element.offsetHeight < lastHeight) {
                    eventContainer.Execute();
                }
                Reset();
            }, false);
        });
    }

    function DetachResizeEvent(element, handler) {
        return DetachGeneralEvent(element, "Resize", handler, function () {
            element.removeChild(element.gacjs_ResizeExpand);
            element.removeChild(element.gacjs_ResizeShrink);
            delete element.gacjs_ResizeExpand;
            delete element.gacjs_ResizeShrink;
        });
    }

    function DetectResize(element, callback) {
        var handler = AttachConnectionToBodyChangedEvent(element, function () {
            AttachResizeEvent(element, callback);
            DetachConnectionToBodyChangedEvent(element, handler);
            callback();
        }, false);
    }

    return {
        AttachConnectionToBodyChangedEvent: AttachConnectionToBodyChangedEvent,
        DetachConnectionToBodyChangedEvent: DetachConnectionToBodyChangedEvent,
        AttachResizeEvent: AttachResizeEvent,
        DetachResizeEvent: DetachResizeEvent,
        DetectResize: DetectResize,
    }
});