eval(
    Packages.Inject([
        "Test",
        "Class",
        "Html.ResizeEvent",
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
    tabButton.addEventListener("click", function (event) {
        ShowTabPage(event.currentTarget.TabPage);
    });
}

function SetupTabControl(tabControl) {

    function DirectChild(parent,className){
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
    var tabButtons = DirectChild(DirectChild(tabControl, "TabButtonContainer")[0], "TabButton");
    var tabPages = DirectChild(DirectChild(tabControl, "TabPageContainer")[0], "TabPage");
    for (var i = 0; i < tabButtons.length; i++) {
        CombineTabPage(tabControl, tabPages[i], tabButtons[i]);
    }

    ShowTabPage(tabPages[0]);
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

function InstallResizer(node) {
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
                var width = GetPx(node.style.width) + dx;
                var height = GetPx(node.style.height) + dy;
                if (width < 0 || height < 0) {
                    return;
                }

                node.style.width = width + "px";
                node.style.height = height + "px";
                draggableHandle.style.left = GetPx(draggableHandle.style.left) + dx + "px";
                draggableHandle.style.top = GetPx(draggableHandle.style.top) + dy + "px";

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

function InstallDraggableHandlers(node) {
    InstallMover(node);
    InstallResizer(node);
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
    div.style.minWidth = (20 + columns * 10) + "px";
    div.style.minHeight = (20 + rows * 10) + "px";
    div.style.width = (20 + columns * 100) + "px";
    div.style.height = (20 + rows * 100) + "px";
    div.style.border = "1px solid blue";
    div.style.float = "left";
    div.style.margin = "10px 10px 10px 10px";

    var child = layout.BoundsHtmlElement;
    if (child === undefined) {
        child = layout;
    }
    child.style.position = "relative";
    child.style.width = "calc(100% - 20px)";
    child.style.height = "calc(100% - 20px)";
    child.style.margin = "10px 10px 10px 10px";
    div.appendChild(child);

    InstallDraggableHandlers(div);
    return div;
}