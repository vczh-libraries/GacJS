eval(
    Packages.Inject([
        "Test",
        "Class",
        "Html.ResizeEvent",
        "Html.Navigation",
        "GacUI.Types",
        "GacUI.Elements.Interface",
        "GacUI.Elements.Basic",
        "GacUI.Elements.ColorizedText",
        "GacUI.Elements.Document",
        "GacUI.Layout.Basic",
        "GacUI.Layout.Stack",
        "GacUI.Layout.Table",
        "GacUI.Layout.Misc"],
        true)
    );

/********************************************************************************
TabControl
********************************************************************************/

function BuildTabController(name) {
    var Controller = Class("<TabController>::" + name, INativationController, {
        Id: Public(null),
        Url: Public(null),

        OnInstalled: Public.Override(function () {
            var tabControl = window[this.Id];
            for (var i = 0; i < tabControl.TabButtons.length; i++) {
                var tabButton = tabControl.TabButtons[i];
                if (tabButton.getAttribute("data-url") === this.Url) {
                    ShowTabPage(tabButton.TabPage);
                    break;
                }
            }
        }),
    });
    return Controller;
}

var TabRootController = BuildTabController("Root");

function ShowTabPage(tabPage) {
    var currentTabPage = tabPage.TabControl.CurrentTabPage;
    if (currentTabPage !== null) {
        currentTabPage.classList.remove("Selected");
        currentTabPage.TabButton.classList.remove("Selected");
    }
    tabPage.TabControl.CurrentTabPage = tabPage;
    tabPage.classList.add("Selected");
    tabPage.TabButton.classList.add("Selected");
}

function CombineTabPage(tabControl, tabPage, tabButton) {
    tabPage.TabControl = tabControl;
    tabPage.TabButton = tabButton;

    tabButton.TabPage = tabPage;
    if (tabControl.TabControllerType) {
        parentControllerType = undefined;
        var current = tabButton;
        while (current) {
            if (current.TabControllerType && current !== tabControl) {
                parentControllerType = current.TabControllerType;
                break;
            }
            current = current.parentElement;
        }

        var url = tabButton.getAttribute("data-url");
        RegisterNavigationPath(
            url,
            tabControl.TabControllerType,
            { Id: tabControl.id, Url: url },
            parentControllerType
            );

        tabButton.addEventListener("click", function (event) {
            var context = GetNavigationContextBefore(tabControl.TabControllerType);
            context.push({ type: tabControl.TabControllerType, values: { Id: tabControl.id, Url: url } });
            var path = BuildNavigationPath(context);
            NavigateTo(path);
        });
    }
    else {
        tabButton.addEventListener("click", function (event) {
            ShowTabPage(event.currentTarget.TabPage);
        });
    }
}

function SetupTabControl(tabControl) {
    function DirectChild(parent, className) {
        var result = [];
        var childNodes = parent.childNodes;
        for (var i = 0; i < childNodes.length; i++) {
            var childNode = childNodes[i];
            if (childNode.className === className) {
                result.push(childNode);
            }
        }
        return result;
    }

    tabControl.CurrentTabPage = null;
    if (tabControl.getAttribute("data-navigation") === "true") {
        tabControl.TabControllerType = BuildTabController(tabControl.id);
    }
    else {
        tabControl.TabControllerType = null;
    }

    tabControl.TabButtons = DirectChild(DirectChild(tabControl, "TabButtonContainer")[0], "TabButton");
    tabControl.TabPages = DirectChild(DirectChild(tabControl, "TabPageContainer")[0], "TabPage");
    for (var i = 0; i < tabControl.TabButtons.length; i++) {
        CombineTabPage(tabControl, tabControl.TabPages[i], tabControl.TabButtons[i]);
    }

    if (!tabControl.TabControllerType) {
        ShowTabPage(tabControl.TabPages[0]);
    }
}

/********************************************************************************
Draggable Handler
********************************************************************************/

function GetPx(px) {
    return +px.substr(0, px.length - 2);
}

var bodyOnMouseMove = null;
var bodyOnMouseUp = null;

function TrackMouse(node) {
    bodyOnMouseMove = node.data_onMouseMove;
    bodyOnMouseUp = node.data_onMouseUp;
    DetachMouseEvents(node, false);
}

function UnTrackMouse(node) {
    AttachMouseEvents(node);
    bodyOnMouseMove = null;
    bodyOnMouseUp = null;
}

function AttachMouseEvents(node, onMouseDown, onMouseMove, onMouseUp) {
    if (onMouseDown) node.data_onMouseDown = onMouseDown;
    if (onMouseMove) node.data_onMouseMove = onMouseMove;
    if (onMouseUp) node.data_onMouseUp = onMouseUp;

    node.addEventListener("mousedown", node.data_onMouseDown, false);
    node.addEventListener("mousemove", node.data_onMouseMove, false);
    node.addEventListener("mouseup", node.data_onMouseUp, false);
}

function DetachMouseEvents(node, removeHandler) {
    node.removeEventListener("mousedown", node.data_onMouseDown, false);
    node.removeEventListener("mousemove", node.data_onMouseMove, false);
    node.removeEventListener("mouseup", node.data_onMouseUp, false);

    if (removeHandler) {
        node.data_onMouseDown = undefined;
        node.data_onMouseMove = undefined;
        node.data_onMouseUp = undefined;
    }
}

function InstallResizer(node, resizeCallback) {
    var draggableHandle = document.createElement("div");
    draggableHandle.setAttribute("class", "DraggableHandle");
    draggableHandle.style.right = "1px";
    draggableHandle.style.bottom = "1px";
    draggableHandle.style.backgroundColor = "red";
    node.appendChild(draggableHandle);

    var dragging = false;
    var x = 0.0;
    var y = 0.0;

    AttachMouseEvents(
        draggableHandle,
        function (event) {
            if (draggableHandle.style.right !== "") {
                draggableHandle.style.right = "";
                draggableHandle.style.bottom = "";
                draggableHandle.style.left = (node.offsetWidth - draggableHandle.offsetWidth - 3) + "px";
                draggableHandle.style.top = (node.offsetHeight - draggableHandle.offsetHeight - 3) + "px";
            }

            dragging = true;
            x = event.pageX;
            y = event.pageY;
            TrackMouse(draggableHandle);
        },
        function (event) {
            if (dragging) {
                var dx = event.pageX - x;
                var dy = event.pageY - y;
                var left = GetPx(draggableHandle.style.left);
                var top = GetPx(draggableHandle.style.top);
                var width = left + draggableHandle.offsetWidth + 1 + dx;
                var height = top + draggableHandle.offsetHeight + 1 + dy;
                if (width < 0 || height < 0) {
                    return;
                }

                node.style.minWidth = width + "px";
                node.style.minHeight = height + "px";
                draggableHandle.style.left = left + dx + "px";
                draggableHandle.style.top = top + dy + "px";
                resizeCallback(width, height);

                x = event.pageX;
                y = event.pageY;
            }
        },
        function (event) {
            dragging = false;
            UnTrackMouse(draggableHandle);
        }
    );
}

function InstallMover(node) {
    if (node.style.left === "" || node.style.top === "") {
        return;
    }

    var draggableHandle = document.createElement("div");
    draggableHandle.setAttribute("class", "DraggableHandle");
    draggableHandle.style.left = "1px";
    draggableHandle.style.top = "1px";
    draggableHandle.style.backgroundColor = "blue";
    node.appendChild(draggableHandle);

    var dragging = false;
    var x = 0.0;
    var y = 0.0;

    AttachMouseEvents(
        draggableHandle,
        function (event) {
            dragging = true;
            x = event.pageX;
            y = event.pageY;
            TrackMouse(draggableHandle);
        },
        function (event) {
            if (dragging) {
                var dx = event.pageX - x;
                var dy = event.pageY - y;

                node.style.left = GetPx(node.style.left) + dx + "px";
                node.style.top = GetPx(node.style.top) + dy + "px";

                x = event.pageX;
                y = event.pageY;
            }
        },
        function (event) {
            dragging = false;
            UnTrackMouse(draggableHandle);
        }
    );
}

function InstallDraggableHandlers(node, resizeCallback) {
    InstallMover(node);
    InstallResizer(node, resizeCallback);
}

window.addEventListener("mousemove", function (event) {
    if (bodyOnMouseMove) {
        bodyOnMouseMove(event);
    }
}, false);

window.addEventListener("mouseup", function (event) {
    if (bodyOnMouseUp) {
        bodyOnMouseUp(event);
    }
}, false);

/********************************************************************************
Layout Embedder
********************************************************************************/

function CreateLayoutEmbedder(layout, rows, columns) {
    if (rows === undefined) rows = 1;
    if (columns === undefined) columns = 1;

    var div = document.createElement("div");
    div.style.display = "block";
    div.style.position = "relative";
    div.style.border = "1px solid blue";
    div.style.float = "left";
    div.style.margin = "10px 10px 10px 10px";

    var child = layout.BoundsHtmlElement;
    if (child === undefined) {
        child = layout;
    }
    child.style.position = "relative";
    child.style.width = (columns * 100) + "px";
    child.style.height = (rows * 100) + "px";
    child.style.margin = "10px 10px 10px 10px";
    div.appendChild(child);

    InstallDraggableHandlers(div, function (width, height) {
        child.style.width = (width - 20) + "px";
        child.style.height = (height - 20) + "px";
    });
    return div;
}