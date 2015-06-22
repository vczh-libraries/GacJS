Packages.Define("Doc.TreeView", ["Class", "IO.Resource", "Doc.Document"], function (__injection__) {
    eval(__injection__);

    function Dom(type, parent) {
        var node = document.createElement(type);
        if (parent) {
            parent.appendChild(node);
        }
        return node;
    }

    /********************************************************************************
    TreeNodeContainer
    ********************************************************************************/

    var TreeNodeContainer = Class(PQN("TreeNodeContainer"), {
        element: Private(null),
        visible: Private(false),

        GetElement: Private(function () { return this.element; }),
        Element: Public.Property({ readonly: true }),

        GetVisible: Private(function () { return this.visible; }),
        SetVisible: Private.StrongTyped(__Void, [__Boolean], function (value) {
            this.visible = value;
            if (value) {
                this.element.setAttribute("class", "TreeNodeContainer Expanded");
            }
            else {
                this.element.setAttribute("class", "TreeNodeContainer Collapsed");
            }
        }),
        Visible: Public.Property({}),

        __Constructor: Public.StrongTyped(__Void, [__Boolean, __Object], function (visible, parent) {
            this.element = Dom("ul", parent);
            this.element.doc_Owner = this.__ExternalReference;
            this.Visible = visible;
        }),
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        TreeNodeContainer: TreeNodeContainer,
    }
})