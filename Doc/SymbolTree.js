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
    Type Deserialization
    ********************************************************************************/

    /********************************************************************************
    Symbol
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