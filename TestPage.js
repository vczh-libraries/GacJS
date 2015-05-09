/********************************************************************************
TabControl
********************************************************************************/

var currentTabPage = null;

function ShowTabPage(tabPage) {
    if (currentTabPage !== null) {
        currentTabPage.classList.remove("Selected");
        currentTabPage.TabButton.classList.remove("Selected");
    }
    currentTabPage = tabPage;
    currentTabPage.classList.add("Selected");
    currentTabPage.TabButton.classList.add("Selected");
}

function CombineTabPage(tabPage, tabButton) {
    tabPage.TabButton = tabButton;
    tabButton.TabPage = tabPage;
    tabButton.addEventListener("click", function (event) {
        ShowTabPage(event.currentTarget.TabPage);
    });
}

function SetupTabControl(tabControl) {
    var tabButtons = tabControl.getElementsByClassName("TabButton");
    var tabPages = tabControl.getElementsByClassName("TabPage");
    for (var i = 0; i < tabButtons.length; i++) {
        CombineTabPage(tabPages[i], tabButtons[i]);
    }

    ShowTabPage(tabPages[0]);
}

/********************************************************************************
Resizer
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
    var resizer = document.createElement("div");
    resizer.setAttribute("class", "Resizer");
    node.appendChild(resizer);

    var dragging = false;
    var x = 0.0;
    var y = 0.0;

    AttachMouseEvents(
        resizer,
        function (event) {
            dragging = true;
            x = event.pageX;
            y = event.pageY;
            TrackMouse(resizer);
        },
        function (event) {
            if (dragging) {
                var dx = event.pageX - x;
                var dy = event.pageY - y;

                node.style.width = GetPx(node.style.width) + dx + "px";
                node.style.height = GetPx(node.style.height) + dy + "px";

                x = event.pageX;
                y = event.pageY;
            }
        },
        function (event) {
            dragging = false;
            UnTrackMouse(resizer);
        }
    );
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