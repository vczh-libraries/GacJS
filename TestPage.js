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

function SetupTab(tabControl) {
    var tabButtons = tabControl.getElementsByClassName("TabButton");
    var tabPages = tabControl.getElementsByClassName("TabPage");
    for (var i = 0; i < tabButtons.length; i++) {
        CombineTabPage(tabPages[i], tabButtons[i]);
    }

    ShowTabPage(tabPages[0]);
}