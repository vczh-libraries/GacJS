Packages.Define("GacUI.Layout", ["Class", "GacUI.Types"], function (__injection__) {
    eval(__injection__);

    function FQN(name) {
        return "vl::presentation::composition::Gui" + name + "Composition";
    }

    var MinSizeLimitation = Enum("vl::presentation::compositions::GuiGraphicsComposition::MinSizeLimitation", {
        NoLimit: 0,
        LimitToElement: 1,
        LimitToElementAndChildren: 2,
    });

    /********************************************************************************
    GuiGraphicsComposition
    ********************************************************************************/

    var Layout = Class(FQN("Graphics"), {

        boundsElement: Protected(null),
        containerElement: Protected(null),

        GetBoundsElement: Public(function () {
            return this.boundsElement;
        }),
        BoundsElement: Public.Property({}),

        GetContainerElement: Public(function () {
            return this.containerElement;
        }),
        ContainerElement: Public.Property({}),

        __Constructor: Public(function () {
        }),

        //////////////////////////////////////////////////////

        parent: Protected(null),
        children: Protected([]),

        GetParent: Public(function () {
            return this.parent;
        }),
        internal_SetParent: Public(function (value) {
            this.parent = value;
        }),
        Parent: Public.Property({ readonly: true }),

        GetChildren: Public(function () {
            return this.children;
        }),
        Children: Public.Property({ readonly: true }),

        AddChild: Public(function (child) {
            Layout.RequireType(child);
            if (this.children.indexOf(child) !== -1) {
                return false;
            }
            this.children.push(child);
            child.internal_SetParent(this.__ExternalReference);
            return true;
        }),
        InsertChild: Public(function (index, child) {
            Layout.RequireType(child);
            if (this.children.indexOf(child) !== -1) {
                return false;
            }
            if (index < 0 || index > this.children.length) {
                return false;
            }
            this.children.splice(index, 0, child);
            child.internal_SetParent(this.__ExternalReference);
            return true;
        }),
        RemoveChild: Public(function (child) {
            Layout.RequireType(child);
            var index = this.children.indexOf(child);
            if (index === -1) {
                return false;
            }
            this.children.splice(index, 1);
            child.internal_SetParent(null);
            return true;
        }),
        MoveChild: Public(function (child, newIndex) {
            Layout.RequireType(child);
            if (newIndex < 0 || newIndex >= this.children.length) {
                return false;
            }
            var index = this.children.indexOf(child);
            if (index === -1) {
                return false;
            }
            this.children.splice(index, 1);
            this.children.splice(newIndex, 0, child);
            return true;
        }),

        GetOwnedElement: Public(function () {
            throw new Error("Not Implemented.");
        }),
        SetOwnedElement: Public(function (value) {
            throw new Error("Not Implemented.");
        }),
        OwnedElement: Public.Property({}),

        //////////////////////////////////////////////////////

        UpdateStyle: Protected.Virtual(function () {
            throw new Error("Not Implemented.");
        }),

        visible: Protected(true),
        GetVisible: Public(function () {
            return this.visible;
        }),
        SetVisible: Public(function (value) {
            this.visible = value;
            this.UpdateStyle();
        }),
        Visible: Public.Property({}),

        minSizeLimitation: Protected(MinSizeLimitation.NoLimit),
        GetMinSizeLimitation: Public(function () {
            return this.minSizeLimitation;
        }),
        SetMinSizeLimitation: Public(function (value) {
            this.minSizeLimitation = value;
            this.UpdateStyle();
        }),
        MinSizeLimitation: Public.Property({}),

        margin: Protected(new Margin(-1, -1, -1, -1)),
        GetMargin: Public(function () {
            return this.margin;
        }),
        SetMargin: Public(function (value) {
            this.margin = value;
            this.UpdateStyle();
        }),
        Margin: Public.Property({}),

        internalMargin: Protected(new Margin(-1, -1, -1, -1)),
        GetInternalMargin: Public(function () {
            return this.internalMargin;
        }),
        SetInternalMargin: Public(function (value) {
            this.internalMargin = value;
            this.UpdateStyle();
        }),
        InternalMargin: Public.Property({}),

        preferredMinSize: Public(new Size(0, 0)),
        GetPreferredMinSize: Public(function () {
            return this.preferredMinSize;
        }),
        SetPreferredMinSize: Public(function (value) {
            this.preferredMinSize = value;
            this.UpdateStyle();
        }),
        PreferredMinSize: Public.Property({}),

        //////////////////////////////////////////////////////

        GetClientArea: Public(function () {
            throw new Error("Not Implemented.");
        }),
        ClientArea: Public.Property({}),

        ForceCalculateSizeImmediately: Public(function () {
        }),

        GetMinPreferredClientSize: Public(function () {
            throw new Error("Not Implemented.");
        }),
        MinPreferredClientSize: Public.Property({}),

        GetPreferredBounds: Public(function () {
            throw new Error("Not Implemented.");
        }),
        PreferredBounds: Public.Property({}),

        GetBounds: Public(function () {
            throw new Error("Not Implemented.");
        }),

        GetGlobalBounds: Public(function () {
            throw new Error("Not Implemented.");
        }),
        GlobalBounds: Public.Property({ readonly: true }),

        //////////////////////////////////////////////////////

        GetAssociatedCursor: Public(function () {
            throw new Error("Not Implemented.");
        }),
        SetAssociatedCursor: Public(function (value) {
            throw new Error("Not Implemented.");
        }),
        AssociatedCursor: Public.Property({}),

        GetAssociatedControl: Public(function () {
            throw new Error("Not Implemented.");
        }),
        SetAssociatedControl: Public(function () {
            throw new Error("Not Implemented.");
        }),
        AssociatedControl: Public.Property({}),

        GetAssociatedHitTestResult: Public(function () {
            throw new Error("Not Implemented.");
        }),
        SetAssociatedHitTestResult: Public(function (value) {
            throw new Error("Not Implemented.");
        }),
        AssociatedHitTestResult: Public.Property({}),

        GetRelatedControl: Public(function () {
            throw new Error("Not Implemented.");
        }),
        RelatedControl: Public.Property({ readonly: true }),

        GetRelatedControlHost: Public(function () {
            throw new Error("Not Implemented.");
        }),
        RelatedControlHost: Public.Property({ readonly: true }),

        GetRelatedCursor: Public(function () {
            throw new Error("Not Implemented.");
        }),
        RelatedCursor: Public.Property({ readonly: true }),
    });

    /********************************************************************************
    GuiGraphicsSiteComposition
    ********************************************************************************/

    var SiteLayout = Class(FQN("GraphicsSite"), Layout, {
        Bounds: Public.Property({ readonly: true }),
    });

    /********************************************************************************
    GuiWindowComposition
    ********************************************************************************/

    var WindowLayout = Class(FQN("Window"), SiteLayout, {
    });

    /********************************************************************************
    GuiBoundsComposition
    ********************************************************************************/

    var BoundsLayout = Class(FQN("Bounds"), Layout, {

        UpdateStyle: Protected.Override(function () {
            this.__Dynamic(Layout).UpdateStyle();
            throw new Error("Not Implemented.");
        }),

        bounds: Protected(new Rect()),

        SetBounds: Public(function (value) {
            this.bounds = value;
            this.UpdateStyle();
        }),
        Bounds: Public.Property({}),

        alignmentToParent: Protected(new Margin(-1, -1, -1, -1)),
        GetAlignmentToParent: Public(function () {
            return this.alignmentToParent;
        }),
        SetAlignmentToParent: Public(function (value) {
            this.alignmentToParent = value;
            this.UpdateStyle();
        }),
        AlignmentToParent: Public.Property({}),
    });

    /********************************************************************************
    GuiStackComposition
    ********************************************************************************/

    var StackLayout = Class(FQN("Stack"), SiteLayout, {
    });

    /********************************************************************************
    GuiStackItemComposition
    ********************************************************************************/

    var StackItemLayout = Class(FQN("StackItem"), SiteLayout, {
    });

    /********************************************************************************
    GuiTableComposition
    ********************************************************************************/

    var TableLayout = Class(FQN("Table"), SiteLayout, {
    });

    /********************************************************************************
    GuiCellComposition
    ********************************************************************************/

    var CellLayout = Class(FQN("Cell"), SiteLayout, {
    });

    /********************************************************************************
    GuiSideAlignedComposition
    ********************************************************************************/

    var SideAlignedLayout = Class(FQN("SideAligned"), SiteLayout, {
    });

    /********************************************************************************
    GuiPartialViewComposition
    ********************************************************************************/

    var PartialViewLayout = Class(FQN("PartialView"), SiteLayout, {
    });

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        Layout: Layout,
        SiteLayout: SiteLayout,
        WindowLayout: WindowLayout,
        BoundsLayout: BoundsLayout,
        StackLayout: StackLayout,
        StackItemLayout: StackItemLayout,
        TableLayout: TableLayout,
        CellLayout: CellLayout,
        SideAlignedLayout: SideAlignedLayout,
        PartialViewLayout: PartialViewLayout,
    }
});