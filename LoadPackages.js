var AllJavaScriptPackages = [
    "./Script/Package.js",
    "./Script/Test.js",
    "./Script/Html/Events.js",
    "./Script/Html/RunAfterWindowLoaded.js",
    "./Script/Html/ResizeEvent.js",
    "./Script/Html/Navigation.js",
    "./Script/Html/Razor.js",
    "./Script/Html/MVC.js",
    "./Script/IO/Delay.js",
    "./Script/IO/Wildcard.js",
    "./Script/IO/Resource.js",
    "./Script/GacUI/Layout/Basic.js",
    "./Script/GacUI/Layout/Stack.js",
    "./Script/GacUI/Layout/Table.js",
    "./Script/GacUI/Layout/Misc.js",
    "./Script/GacUI/Elements/Interface.js",
    "./Script/GacUI/Elements/Basic.js",
    "./Script/GacUI/Elements/ColorizedText.js",
    "./Script/GacUI/Elements/Document.js",
    "./Script/GacUI/Types.js",
    "./Script/Class.js",
];

for (var i = 0; i < AllJavaScriptPackages.length; i++) {
    var currentJavaScriptPackage = JSON.stringify(AllJavaScriptPackages[i]);
    document.write("<script src=" + currentJavaScriptPackage + "></script>");
}