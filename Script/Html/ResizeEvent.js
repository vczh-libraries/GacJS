/*
API:
    AttachParentChangedEvent(element, callback);
    DetachParentChangedEvent(element, callback);
    AttachResizeEvent(element, callback);
    DetachResizeEvent(element, callback);
*/

Packages.Define("Html.ResizeEvent", ["Html.Events"], function (__injection__) {
    eval(__injection__);

    function AttachParentChangedEvent(element, callback) {
        AttachGeneralEvent(element, "ParentChanged", callback, function (RaiseEvent) {
        });
    }

    function DetachParentChangedEvent(element, callback) {
        DetachGeneralEvent(element, "ParentChanged", callback, function (RaiseEvent) {
        });
    }

    // This function is enhanced and modified to my coding style from
    // https://github.com/marcj/css-element-queries/
    function AttachResizeEvent(element, callback) {
        AttachGeneralEvent(element, "Resize", callback, function (RaiseEvent) {

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
                    RaiseEvent();
                }
                Reset();
            }, false);

            shrink.addEventListener("scroll", function (event) {
                if (element.offsetWidth < lastWidth || element.offsetHeight < lastHeight) {
                    RaiseEvent();
                }
                Reset();
            }, false);
        });
    }

    function DetachResizeEvent(element, callback) {
        DetachGeneralEvent(element, "Resize", callback, function (RaiseEvent) {
            element.removeChild(element.gacjs_ResizeExpand);
            element.removeChild(element.gacjs_ResizeShrink);
            delete element.gacjs_ResizeExpand;
            delete element.gacjs_ResizeShrink;
        });
    }

    return {
        AttachParentChangedEvent: AttachParentChangedEvent,
        DetachParentChangedEvent: DetachParentChangedEvent,
        AttachResizeEvent: AttachResizeEvent,
        DetachResizeEvent: DetachResizeEvent,
    }
});