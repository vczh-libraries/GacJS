Packages.Define("Doc.SymbolTree", ["Class"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    Type
    ********************************************************************************/

    var TypeDecl = Class(PQN("TypeDecl"), {
        ReferencingNameKey: Public(""),
        ReferencingOverloadKeys: Public(null),
    });

    var RefTypeDecl = Class(PQN("RefTypeDecl"), TypeDecl, {
        Name: Public(""),
    });

    var SubTypeDecl = Class(PQN("SubTypeDecl"), TypeDecl, {
        Parent: Public(null),
        Name: Public(""),
    });

    var Decoration = Enum(PQN("Decoration"), {
        Const: 0,
        Volatile: 1,
        Pointer: 2,
        LeftRef: 3,
        RightRef: 4,
        Signed: 5,
        Unsigned: 6,
    });

    var DecorateTypeDecl = Class(PQN("DecorateTypeDecl"), TypeDecl, {
        Element: Public(null),
        Decoration: Public(Decoration.Description.Const),
    });

    var ArrayTypeDecl = Class(PQN("ArrayTypeDecl"), TypeDecl, {
        Element: Public(null),
        Expression: Public(""),
    });

    var CallingConvention = Enum(PQN("CallingConvention"), {
        Default: 0,
        CDecl: 1,
        ClrCall: 2,
        StdCall: 3,
        FastCall: 4,
        ThisCall: 5,
        VectorCall: 6,
    });

    var FunctionTypeDecl = Class(PQN("FunctionTypeDecl"), TypeDecl, {
        CallingConvention: Public(CallingConvention.Description.Default),
        ReturnType: Public(null),
        Parameters: Public(null),
        Const: Public(false),
    });

    var ClassMemberTypeDecl = Class(PQN("ClassMemberTypeDecl"), TypeDecl, {
        Element: Public(null),
        ClassType: Public(null),
    });

    var GenericTypeDecl = Class(PQN("GenericTypeDecl"), TypeDecl, {
        Element: Public(null),
        TypeArguments: Public(null),
    });

    var DeclTypeDecl = Class(PQN("DeclTypeDecl"), TypeDecl, {
        Expression: Public(""),
    });

    var VariadicArgumentTypeDecl = Class(PQN("VariadicArgumentTypeDecl"), TypeDecl, {
        Element: Public(null),
    });

    var ConstantTypeDecl = Class(PQN("ConstantTypeDecl"), TypeDecl, {
        Value: Public(""),
    });

    /********************************************************************************
    Symbol
    ********************************************************************************/

    var Access = Enum(PQN("Access"), {
        Public: 0,
        Protected: 1,
        Private: 2,
    });

    var SymbolDecl = Class(PQN("SymbolDecl"), {
        Access: Public(Access.Description.Public),
        Name: Public(""),
        Children: Public(null),
        Document: Public(null),
        Tags: Public(null),
        NameKey: Public(""),
        OverloadKey: Public(""),
    });

    var TypeParameterDecl = Class(PQN("TypeParameterDecl"), SymbolDecl, {
    });

    var TemplateDecl = Class(PQN("TemplateDecl"), SymbolDecl, {
        TypeParameters: Public(null),
        Specialization: Public(null),
        Element: Public(null),
    });

    var ClassType = Enum(PQN("ClassType"), {
        Class: 0,
        Struct: 1,
        Union: 2,
    });

    var BaseTypeDecl = Class(PQN("BaseTypeDecl"), SymbolDecl, {
        Type: Public(null),
    });

    var ClassDecl = Class(PQN("ClassDecl"), SymbolDecl, {
        ClassType: Public(ClassType.Description.Class),
        BaseTypes: Public(null),
    });

    var VarDecl = Class(PQN("VarDecl"), SymbolDecl, {
        Type: Public(null),
        Static: Public(false),
    });

    var Virtual = Enum(PQN("Virtual"), {
        Static: 0,
        Normal: 1,
        Virtual: 2,
        Abstract: 3,
    });

    var Function = Enum(PQN("Function"), {
        Constructor: 0,
        Destructor: 1,
        Function: 2,
    });

    var FuncDecl = Class(PQN("FuncDecl"), SymbolDecl, {
        Type: Public(null),
        Virtual: Public(Virtual.Description.Normal),
        Function: Public(Function.Description.Function),
    });

    var Grouping = Enum(PQN("Grouping"), {
        Union: 0,
        Struct: 1,
    });

    var GroupedFieldDecl = Class(PQN("GroupedFieldDecl"), SymbolDecl, {
        Grouping: Public(Grouping.Description.Struct),
    });

    var EnumItemDecl = Class(PQN("EnumItemDecl"), SymbolDecl, {
    });

    var EnumDecl = Class(PQN("EnumDecl"), SymbolDecl, {
        EnumClass: Public(false),
    });

    var TypedefDecl = Class(PQN("TypedefDecl"), SymbolDecl, {
        Type: Public(null),
    });

    /********************************************************************************
    Type Deserialization
    ********************************************************************************/

    /********************************************************************************
    Symbol Deserialization
    ********************************************************************************/

    return {
        TypeDecl: TypeDecl,
        RefTypeDecl: RefTypeDecl,
        SubTypeDecl: SubTypeDecl,
        Decoration: Decoration,
        DecorateTypeDecl: DecorateTypeDecl,
        ArrayTypeDecl: ArrayTypeDecl,
        CallingConvention: CallingConvention,
        FunctionTypeDecl: FunctionTypeDecl,
        ClassMemberTypeDecl: ClassMemberTypeDecl,
        GenericTypeDecl: GenericTypeDecl,
        DeclTypeDecl: DeclTypeDecl,
        VariadicArgumentTypeDecl: VariadicArgumentTypeDecl,
        ConstantTypeDecl: ConstantTypeDecl,
    }
})