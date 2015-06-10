/*
API:
    RegExp WildcardToRegExp(string wildcard);
*/
Packages.Define("Doc.Wildcard", function (__injection__) {
    eval(__injection__);

    function WildcardToRegExp(wildcard) {
        var regex = "";
        for (var i = 0; i < wildcard.length; i++) {
            var c = wildcard[i];
            switch (c) {
                case "*":
                    regex += ".*";
                    break;
                case "?":
                    regex += ".";
                    break;
                case "(": case ")":
                case "[": case "]":
                case "{": case "}":
                case "*": case "+": case "?": case ".":
                case "$": case "^":
                case "\\": case "/":
                    regex += "\\" + c;
                    break;
                default:
                    regex += c;
            }
        }
        return new RegExp(regex);
    }

    return {
        WildcardToRegExp: WildcardToRegExp,
    }
})