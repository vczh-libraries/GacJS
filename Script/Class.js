/*
API:
================================================================================

    class __EventHandler {
        object                      Function;
    }

    class __Event {
        __EventHandler              Attach(object function);
        void                        Detach(__EventHandler handler);
        void                        Execute(...);
        bool                        ContainsHandler(__EventHandler handler);
        bool                        IsEmpty();
    }

================================================================================

    class __BaseClass {
        __Class                     Type;
        bool                        Virtual;
    }

    class __MemberBase {
        enum <VirtualType> {
            NORMAL,
            VIRTUAL,
            OVERRIDE,
        }

        __Class                     DeclaringType;
        <VirtualType>               Virtual;
        bool                        New;
        object                      Value;
        __MemberBase[]              HiddenMembers;
    }

    class __PrivateMember : __MemberBase {}
    class __ProtectedMember : __MemberBase {}
    class __PublicMember : __MemberBase {}

    class __Class {
        bool                        VirtualClass                            // True if this type contains unoverrided abstract members
        string                      FullName;                               // Get the full name
        map<string, __MemberBase>   Description;                            // Get all declared members in this type
        map<string, __MemberBase>   FlattenedDescription;                   // Get all potentially visible members in this type
        __BaseClass[]               BaseClasses;                            // Get all direct base classes of this type
        __BaseClass[]               FlattenedBaseClasses;                   // Get all direct or indirect base classes of this type
        map<string, __Class>        VirtuallyConstructedBy;                 // If type of "key" virtually inherits this type, than this type can only be constructed by "value"

        bool                        IsAssignableFrom(__Class childType);    // Returns true if "childType" is or inherits from "Type"
        bool                        TestType(Object object);                // Returns false if "object" is not an instance of this class or its child classes
        void                        RequireType(Object object);             // Throw an exception if "object" is not an instance of this class or its child classes
    }

================================================================================

    this.__Type                                             // Get the real type that creates this object
    this.__ScopeType                                        // Get the scope type that creates this object
    this.__ExternalReference                                // Get the external reference of this instance, for passing the value of "this" out of the class
    this.__Dynamic(type)                                    // Get the dynamic scope object of a base class
    this.__Static(type)                                     // Get the static scope object of a base class
    this.__InitBase(type, [arguments])                      // Call the constructor of the base class

    obj.__Type                                              // Get the real type that creates this object
    obj.__Dynamic(type)                                     // Get the dynamic scope object of a base class
    obj.__Static(type)                                      // Get the static scope object of a base class
    scope.__Original                                        // Get the original object that creates this scope object

    handler = Event.Attach(xxx);
    event.Detach(handler);
    event.Execute(...);

    obj instanceof Class

    __Class Class(fullName, type1, Virtual(type2), ... {
        Member: (Public|Protected|Private) (value | function),
        Member: ((Public|Protected)[.New]|Private).Overload(typeList1, function1, typeList2, function2, ...);
        Member: (Public|Protected).(New|Virtual|NewVirtual|Override) (function),
        Member: ((Public|Protected)[.(New|Virtual|NewVirtual|Override)]|Private).StrongTyped (returnType, [argumentTypes], function),
        Member: (Public|Protected).Abstract();
        Member: Public.Event();
        Member: Public.Property({
            readonly: true | false,                         // (optional), false
            hasEvent: true | false,                         // (optional), false
            getterName: "GetterNameToOverride",             // (optional), "GetMember"
            setterName: "SetterNameToOverride",             // (optional), "SetMember",     implies readonly: false
            eventName: "EventNameToOverride",               // (optional), "MemberChanged", implies hasEvent: true
        }),
    });

    var obj = new ClassType(<constructor-arguments>);

================================================================================

    obj.__Type                                                  // Get the real type that creates this object
    obj.__Value                                                 // Get the integral representation of this object
    obj.__Clone()                                               // Copy the object
    obj.__Equals(value)                                         // Test equality with another object
    obj.__ToString()                                            // Get the string representation of this object

    obj.__Add(Flags)                                            // Combine a new flag (Flags)
    obj.__Remove(Flags)                                         // Remove a combined flag (Flags)
    obj.__Flags                                                 // Get all combined flags (Flags)

    class __Enum {
        bool                        Flags;                      // True if elements in this enum is combinable
        string                      FullName;                   // Get the full name
        map<string, (Enum|Flags)>   Description;                // Get all declared members in this type

        (Enum|Flags)                Parse(string text);         // Create a value of this type by a specified string representation
        bool                        TestType(Object object);    // Returns false if "object" is not an instance of this type
        void                        RequireType(Object object); // Throw an exception if "object" is not an instance of this type
    }

    obj instanceof Enum
    obj instanceof Flags

    var obj = EnumType.Description.<ItemName>;

    var obj = new FlagsType()
        .__Add(FlagsType.Description.<ItemName>)
        .__Add(FlagsType.Description.<ItemName>)
        ;

    __Enum (Enum|Flags)(fullName, {
        Member: value,
    });

================================================================================

    obj.__Type                                                  // Get the real type that creates this object
    obj.__Clone()                                               // Copy the object
    obj.__Equals(value)                                         // Test equality with another object
    obj.__ToString()                                            // Get the string representation of this object

    class __Struct {
        string                      FullName;                   // Get the full name
        map<string, value>          Description;                // Get all declared members in this type

        static Struct               Parse(string text);         // Create a value of this type by a specified string representation
        bool                        TestType(Object object);    // Returns false if "object" is not an instance of this type
        void                        RequireType(Object object); // Throw an exception if "object" is not an instance of this type
    }

    obj instanceof Struct

    __Struct Struct(fullName, {
        Member: value,
    });

    var obj = new StructType();

================================================================================

    class __PrimitiveType {
        string                      FullName;

        Object                      Parse(string text);
        string                      Print(Object object);
        bool                        TestType(Object object);
        void                        RequireType(Object object);
    }
*/

///////////////////////////////////////////////////////////////

Packages.Define("Class", function () {

    function __BaseClass(value, virtual) {
        this.Type = value;
        this.Virtual = virtual;
        Object.seal(this);
    }

    function __MemberBase() {
        this.DeclaringType = null;
        this.Virtual = __MemberBase.NORMAL;
        this.New = false;
        this.Value = null;
        this.HiddenMembers = [];
        Object.seal(this);
    }
    Object.defineProperty(__MemberBase, "NORMAL", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 1,
    });
    Object.defineProperty(__MemberBase, "ABSTRACT", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 2,
    });
    Object.defineProperty(__MemberBase, "VIRTUAL", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 3,
    });
    Object.defineProperty(__MemberBase, "OVERRIDE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 4,
    });

    ///////////////////////////////////////////////////////////////

    function __PrivateMember(value) {
        __MemberBase.call(this);
        this.Value = value;
    }
    __PrivateMember.prototype.__proto__ = __MemberBase.prototype;

    function __ProtectedMember(value) {
        __MemberBase.call(this);
        this.Value = value;
    }
    __ProtectedMember.prototype.__proto__ = __MemberBase.prototype;

    function __PublicMember(value) {
        __MemberBase.call(this);
        this.Value = value;
    }
    __PublicMember.prototype.__proto__ = __MemberBase.prototype;

    ///////////////////////////////////////////////////////////////

    function __EventConstructor() {
    }

    function __EventHandler(func) {
        this.Function = func;
        Object.seal(this);
    }

    function __Event() {
        var handlers = [];

        Object.defineProperty(this, "Attach", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (func) {
                if (typeof func !== "function") {
                    throw new Error("Only functions can be attached to an event.");
                }
                var handler = new __EventHandler(func);
                handlers.push(handler);
                return handler;
            }
        });

        Object.defineProperty(this, "Detach", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (handler) {
                var index = handlers.indexOf(handler);
                if (index === -1) {
                    throw new Error("Only handlers that created by this event can detach.");
                }
                handlers.splice(index, 1);
            }
        });

        Object.defineProperty(this, "Execute", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function () {
                for (var i in handlers) {
                    handlers[i].Function.apply(null, arguments);
                }
            }
        });

        Object.defineProperty(this, "ContainsHandler", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (handler) {
                return handlers.indexOf(handler) !== -1;
            }
        });

        Object.defineProperty(this, "IsEmpty", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function () {
                return handlers.length === 0;
            }
        });

        Object.seal(this);
    }

    ///////////////////////////////////////////////////////////////

    function __Property() {
        this.Readonly = false;
        this.HasEvent = false;
        this.GetterName = null;
        this.SetterName = null;
        this.EventName = null;
        Object.seal(this);
    }

    ///////////////////////////////////////////////////////////////

    function __Class() {
    }

    ///////////////////////////////////////////////////////////////

    function __Enum() {
    }

    ///////////////////////////////////////////////////////////////

    function __Struct() {
    }

    ///////////////////////////////////////////////////////////////

    function __PrimitiveType(fullName, parse, print, testType) {
        Object.defineProperty(this, "FullName", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: fullName,
        });
        Object.defineProperty(this, "Parse", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: parse,
        });
        Object.defineProperty(this, "Print", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: print,
        });
        Object.defineProperty(this, "TestType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: testType,
        });
        Object.defineProperty(this, "RequireType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (value) {
                if (!this.TestType(value)) {
                    throw new Error("The specified object's type is not compatible with \"" + this.FullName + "\".");
                }
            },
        });
        Object.seal(this);
    }

    var __Number = new __PrimitiveType(
        "<number>",
        function (text) { return +text; },
        function (value) { return "" + value; },
        function (value) { return typeof value === "number"; }
        );

    var __String = new __PrimitiveType(
        "<string>",
        function (text) { return text; },
        function (value) { return value; },
        function (value) { return typeof value === "string" }
        );

    var __Boolean = new __PrimitiveType(
        "<boolean>",
        function (text) { if (text === "true") return true; if (text === "false") return false; throw new Error("\"" + text + "\" is not a valid string representation for type \"" + this.FullName + "\"."); },
        function (value) { return "" + value; },
        function (value) { return typeof value === "boolean"; }
        );

    var __Array = new __PrimitiveType(
        "<array>",
        function (text) { throw new Error("Not Supported."); },
        function (value) { throw new Error("Not Supported."); },
        function (value) { return value instanceof Array; }
        );

    var __Function = new __PrimitiveType(
        "<function>",
        function (text) { throw new Error("Not Supported."); },
        function (value) { throw new Error("Not Supported."); },
        function (value) { return typeof value === "function"; }
        );

    var __Void = new __PrimitiveType(
        "<function>",
        function (text) { throw new Error("Not Supported."); },
        function (value) { throw new Error("Not Supported."); },
        function (value) { return value === undefined; }
        );

    var __Type = new __PrimitiveType(
        "<type>",
        function (text) { throw new Error("Not Supported."); },
        function (value) { throw new Error("Not Supported."); },
        function (value) { return value instanceof __Class || value instanceof __Struct || value instanceof __Struct; }
        );

    var __Object = new __PrimitiveType(
        "<object>",
        function (text) { throw new Error("Not Supported."); },
        function (value) { throw new Error("Not Supported."); },
        function (value) { return value !== undefined; }
        );

    ///////////////////////////////////////////////////////////////

    function __BuildOverloadingFunctions() {
        if (arguments.length % 2 !== 0) {
            throw new Error("Arguments for Overload should be typeList1, func1, typeList2, func2, ...");
        }

        var functionCount = Math.floor(arguments.length / 2);
        var typeLists = new Array(functionCount);
        var funcs = new Array(functionCount);
        for (var i = 0; i < functionCount; i++) {
            typeLists[i] = arguments[i * 2];
            funcs[i] = arguments[i * 2 + 1];
        }

        return function () {
            for (var i in typeLists) {
                var typeList = typeLists[i];
                if (arguments.length !== typeList.length) continue;

                var matched = typeList.length === 0;
                for (var j in typeList) {
                    var arg = arguments[j];

                    var type = typeList[j];
                    matched = type.TestType(arg);
                    if (!matched) break;
                }

                if (matched) {
                    return funcs[i].apply(this, arguments);
                }
            }
            throw new Error("Cannot find a overloading function that matches the arguments.");
        }
    }

    ///////////////////////////////////////////////////////////////

    function __BuildStrongTypedFunction(returnType, argumentTypes, func) {
        return function () {
            if (argumentTypes.length !== arguments.length) {
                throw new Error("The number of arguments does not match.");
            }

            for (var i = 0; i < argumentTypes.length; i++) {
                argumentTypes[i].RequireType(arguments[i]);
            }

            var returnValue = func.apply(this, arguments);
            returnType.RequireType(returnValue);
            return returnValue;
        }
    }

    ///////////////////////////////////////////////////////////////

    function __DefineDecorator(accessor, name, decorator) {
        Object.defineProperty(accessor, name, {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (value) {
                var member = accessor(value);
                decorator(member, value);
                if (typeof member.Value !== "function") {
                    if (member.Virtual !== __MemberBase.NORMAL) {
                        throw new Error("Only function member can be virtual or override.");
                    }
                }
                return member;
            }
        });
    }

    function __DefineSubDecorator(accessor, name, decorator) {
        Object.defineProperty(accessor, name, {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function () {
                return accessor(decorator.apply(null, arguments));
            }
        });
    }

    function __DefineOverload(accessor) {
        __DefineSubDecorator(accessor, "Overload", __BuildOverloadingFunctions);
    }

    function __DefineStrongTyped(accessor) {
        __DefineSubDecorator(accessor, "StrongTyped", __BuildStrongTypedFunction);
    }

    function __DefineNew(accessor) {
        __DefineDecorator(accessor, "New", function (member) {
            member.New = true;
        });
    }

    function __DefineVirtual(accessor) {
        __DefineDecorator(accessor, "Virtual", function (member) {
            member.Virtual = __MemberBase.VIRTUAL;
        });
    }

    function __DefineNewVirtual(accessor) {
        __DefineDecorator(accessor, "NewVirtual", function (member) {
            member.New = true;
            member.Virtual = __MemberBase.VIRTUAL;
        });
    }

    function __DefineOverride(accessor) {
        __DefineDecorator(accessor, "Override", function (member) {
            member.Virtual = __MemberBase.OVERRIDE;
        });
    }

    function __DefineAbstract(accessor) {
        __DefineDecorator(accessor, "Abstract", function (member) {
            member.Virtual = __MemberBase.ABSTRACT;
            member.Value = function () {
                throw new Error("Cannot call an abstract function.");
            }
        });
    }

    function __DefineEvent(accessor) {
        __DefineDecorator(accessor, "Event", function (member) {
            member.Value = new __EventConstructor();
        });
    }

    function __DefineProperty(accessor) {
        __DefineDecorator(accessor, "Property", function (member, value) {
            member.Value = new __Property();

            if (!value.hasOwnProperty("getterName") && value.hasOwnProperty("setterName")) {
                throw new Error("Getter of the property should be set if setter ia set.");
            }

            if (value.hasOwnProperty("readonly")) {
                member.Value.Readonly = value.readonly;
                if (!value.readonly && value.hasOwnProperty("setterName")) {
                    throw new Error("Readonly event cannot have a setter.");
                }
            }
            else {
                member.Value.Readonly = value.hasOwnProperty("getterName") && !value.hasOwnProperty("setterName");
            }

            if (value.hasOwnProperty("hasEvent")) {
                member.Value.HasEvent = value.hasEvent;
                if (!value.hasEvent && value.hasOwnProperty("eventName")) {
                    throw new Error("Non-trigger property cannot have an event.");
                }
            }
            else {
                member.Value.HasEvent = value.hasOwnProperty("eventName");
            }

            if (value.hasOwnProperty("getterName")) {
                member.Value.GetterName = value.getterName;
            }
            if (value.hasOwnProperty("setterName")) {
                member.Value.SetterName = value.setterName;
            }
            if (value.hasOwnProperty("eventName")) {
                member.Value.EventName = value.eventName;
            }
        });
    }

    ///////////////////////////////////////////////////////////////

    function Virtual(value) {
        return new __BaseClass(value, true);
    }

    function Private(value) {
        return new __PrivateMember(value);
    }

    function Protected(value) {
        return new __ProtectedMember(value);
    }
    __DefineNew(Protected);
    __DefineVirtual(Protected);
    __DefineNewVirtual(Protected);
    __DefineAbstract(Protected);
    __DefineOverride(Protected);

    function Public(value) {
        return new __PublicMember(value);
    }
    __DefineNew(Public);
    __DefineVirtual(Public);
    __DefineNewVirtual(Public);
    __DefineAbstract(Public);
    __DefineOverride(Public);
    __DefineEvent(Public);
    __DefineProperty(Public);

    __DefineOverload(Private);
    __DefineOverload(Protected);
    __DefineOverload(Protected.New);
    __DefineOverload(Public);
    __DefineOverload(Public.New);

    __DefineStrongTyped(Private);
    __DefineStrongTyped(Protected);
    __DefineStrongTyped(Protected.New);
    __DefineStrongTyped(Protected.Virtual);
    __DefineStrongTyped(Protected.NewVirtual);
    __DefineStrongTyped(Protected.Override);
    __DefineStrongTyped(Public);
    __DefineStrongTyped(Public.New);
    __DefineStrongTyped(Public.Virtual);
    __DefineStrongTyped(Public.NewVirtual);
    __DefineStrongTyped(Public.Override);

    ///////////////////////////////////////////////////////////////

    function Class(fullName) {

        function CreateInternalReference(typeObject) {
            // create an internal reference from a type description and copy all members
            var description = typeObject.Description;
            var internalReference = {};

            // this.__ScopeType
            Object.defineProperty(internalReference, "__ScopeType", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: typeObject,
            });

            for (var name in description) {
                var member = description[name];

                if (member instanceof __PrivateMember ||
                    member instanceof __ProtectedMember ||
                    member instanceof __PublicMember) {
                    if (member.Value instanceof __Property) {
                        (function () {
                            var getterName = member.Value.GetterName;
                            var setterName = member.Value.SetterName;

                            Object.defineProperty(internalReference, name, {
                                configurable: true,
                                enumerable: true,
                                get: function () {
                                    return internalReference[getterName].apply(internalReference, []);
                                },
                                set: member.Value.Readonly ? undefined : function (value) {
                                    internalReference[setterName].apply(internalReference, [value]);
                                },
                            });
                        })();
                    }
                    else {
                        Object.defineProperty(internalReference, name, {
                            configurable: true,
                            enumerable: true,
                            writable: typeof member.Value !== "function" && !(member.Value instanceof __EventConstructor),
                            value: member.Value instanceof __EventConstructor ? new __Event() : member.Value,
                        });
                    }
                }
            }

            return internalReference;
        }

        function CopyReferencableMember(target, source, memberName, member, forceReplace) {
            // copy a closured member from one internal reference to another
            if (target.hasOwnProperty(memberName)) {
                if (!forceReplace) {
                    return;
                }
            }

            if (typeof member.Value === "function") {
                Object.defineProperty(target, memberName, {
                    configurable: true,
                    enumerable: true,
                    writable: false,
                    value: function () {
                        return member.Value.apply(source, arguments);
                    }
                });
            }
            else {
                var readonly = member.Value instanceof __Property && member.Value.Readonly;
                Object.defineProperty(target, memberName, {
                    configurable: true,
                    enumerable: true,
                    get: function () {
                        return source[memberName];
                    },
                    set: readonly ? undefined : function (value) {
                        source[memberName] = value;
                    }
                });
            }
        }

        function CopyReferencableMembers(target, source, description, forInternalReference) {
            // copy all closured members from one internal reference to another
            for (var name in description) {
                if (name !== "__Constructor") {
                    (function () {
                        var memberName = name;
                        var member = description[memberName];

                        if (member instanceof __ProtectedMember) {
                            if (forInternalReference) {
                                CopyReferencableMember(target, source, memberName, member, false);
                            }
                        }
                        else if (member instanceof __PublicMember) {
                            CopyReferencableMember(target, source, memberName, member, false);
                        }
                    })();
                }
            }
        }

        function OverrideVirtualFunction(source, memberName, member, targetBaseClasses, accumulated) {
            // override a virtual functions in base internal references
            for (var i in targetBaseClasses) {
                var targetType = targetBaseClasses[i].Type;
                var target = accumulated[targetType.FullName];
                var targetDescription = targetType.FlattenedDescription;
                var targetMember = targetDescription[memberName];
                if (targetMember !== undefined) {
                    if (targetMember.Virtual !== __MemberBase.NORMAL) {
                        CopyReferencableMember(target, source, memberName, member, true, true);
                    }
                    if (targetMember.New === true) {
                        continue;
                    }
                }
                OverrideVirtualFunction(source, memberName, member, targetType.BaseClasses, accumulated);
            }
        }

        function OverrideVirtualFunctions(source, sourceType, accumulated) {
            // override every virtual functions in base internal references
            var description = sourceType.Description;
            for (var name in description) {
                var member = description[name];
                if (member.Virtual === __MemberBase.OVERRIDE) {
                    OverrideVirtualFunction(source, name, member, sourceType.BaseClasses, accumulated);
                }
            }
        }

        function CreateCompleteInternalReference(constructingType, type, accumulated, forVirtualBaseClass) {
            // create an internal reference from a type with inherited members
            var description = type.Description;
            var baseClasses = type.BaseClasses;
            var baseInstances = new Array(baseClasses.length);

            for (var i = 0; i <= baseClasses.length; i++) {
                if (i === baseClasses.length) {
                    // only create one internal reference for one virtual base class
                    var instanceReference = accumulated[type.FullName];
                    if (instanceReference !== undefined) {
                        if (forVirtualBaseClass) {
                            return instanceReference;
                        }
                        else {
                            throw new Error("Internal error: Internal reference for type \"" + type.FullName + "\" has already been created.");
                        }
                    }

                    // create the internal reference for the current type
                    internalReference = CreateInternalReference(type);

                    // override virtual functions in base internal references
                    OverrideVirtualFunctions(internalReference, type, accumulated);

                    // inherit members from base classes
                    for (var j = 0; j < baseClasses.length; j++) {
                        CopyReferencableMembers(
                            internalReference,
                            baseInstances[j],
                            baseClasses[j].Type.Description,
                            true);
                    }

                    // this.__FromVirtualBaseClass (deleted after constructor)
                    internalReference.__FromVirtualBaseClass = forVirtualBaseClass;

                    if (description.__Constructor !== undefined) {
                        // this.__ConstructedBy (deleted after constructor)
                        internalReference.__ConstructedBy = null;

                        // this.__CanBeConstructedBy (deleted after constructor)
                        internalReference.__CanBeConstructedBy = type.VirtuallyConstructedBy[constructingType.FullName];
                    }

                    accumulated[type.FullName] = internalReference;
                    return internalReference;
                }
                else {
                    // create a complete internal reference for a base class
                    var baseClass = baseClasses[i];
                    var baseInstance = CreateCompleteInternalReference(
                        constructingType,
                        baseClass.Type,
                        accumulated,
                        baseClass.Virtual);
                    if (baseInstance.__CanBeConstructedBy === undefined) {
                        baseInstance.__CanBeConstructedBy = type;
                    }
                    baseInstances[i] = baseInstance;
                }
            }
        }

        function InjectObjects(externalReference, typeObject, accumulated) {

            diScope = {};
            deScope = {};
            siScope = {};
            seScope = {};

            function GetScope(type, isDynamic, isInternal) {
                if (typeObject === type || !accumulated.hasOwnProperty(type.FullName)) {
                    throw new Error("Type \"" + typeObject.FullName + "\" does not directly or indirectly inherit from \"" + type.FullName + "\".");
                }

                var scopeCache = (isDynamic ? (isInternal ? diScope : deScope) : (isInternal ? siScope : seScope));
                var scopeObject = scopeCache[type.FullName];

                if (scopeObject === undefined) {
                    scopeObject = {};
                    if (isDynamic) {
                        Object.defineProperty(scopeObject, "__Original", {
                            configurable: false,
                            enumerable: false,
                            writable: false,
                            value: accumulated[typeObject.FullName],
                        });
                    }
                    else {
                        Object.defineProperty(scopeObject, "__Original", {
                            configurable: false,
                            enumerable: false,
                            writable: false,
                            value: externalReference,
                        });
                    }

                    var flattened = type.FlattenedDescription;
                    for (var i in flattened) {
                        (function () {
                            var memberName = i;
                            var member = flattened[memberName];
                            if (member instanceof __PublicMember || (isInternal && member instanceof __ProtectedMember)) {
                                var ref = accumulated[type.FullName];

                                if (isDynamic) {
                                    var prop = Object.getOwnPropertyDescriptor(ref, memberName);

                                    if (prop.get !== undefined) { // property
                                        Object.defineProperty(scopeObject, memberName, prop);
                                    }
                                    else if (prop.writable === false) {
                                        if (prop.value instanceof __Event) { // event
                                            Object.defineProperty(scopeObject, memberName, prop);
                                        }
                                        else { // function
                                            Object.defineProperty(scopeObject, memberName, {
                                                configurable: false,
                                                enumerable: true,
                                                writable: false,
                                                value: function () {
                                                    return prop.value.apply(ref, arguments);
                                                }
                                            });
                                        }
                                    }
                                    else { // field
                                        Object.defineProperty(scopeObject, memberName, {
                                            configurable: false,
                                            enumerable: true,
                                            get: function () {
                                                return ref[memberName];
                                            },
                                            set: function (value) {
                                                ref[memberName] = value;
                                            },
                                        });
                                    }
                                }
                                else {
                                    CopyReferencableMember(
                                        scopeObject,
                                        ref,
                                        memberName,
                                        member,
                                        false);
                                }
                            }
                        })();
                    }

                    Object.seal(scopeObject);
                    scopeCache[type.FullName] = scopeObject;
                }

                return scopeObject;
            }

            // externalReference.__Type
            Object.defineProperty(externalReference, "__Type", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: typeObject,
            });

            // externalReference.__Dynamic
            Object.defineProperty(externalReference, "__Dynamic", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: function (type) {
                    return GetScope(type, true, false);
                },
            });

            // externalReference.__Static
            Object.defineProperty(externalReference, "__Static", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: function (type) {
                    return GetScope(type, false, false);
                },
            });

            for (var i in accumulated) {
                (function () {
                    var ref = accumulated[i];
                    var refType = ref.__ScopeType;

                    // this.__Type
                    Object.defineProperty(ref, "__Type", {
                        configurable: false,
                        enumerable: false,
                        writable: false,
                        value: typeObject,
                    });

                    // this.__ExternalReference
                    Object.defineProperty(ref, "__ExternalReference", {
                        configurable: false,
                        enumerable: false,
                        writable: false,
                        value: externalReference,
                    });

                    // this.__Dynamic(type)
                    Object.defineProperty(ref, "__Dynamic", {
                        configurable: false,
                        enumerable: false,
                        writable: false,
                        value: function (type) {
                            return GetScope(type, true, true);
                        },
                    });

                    // this.__Static(type)
                    Object.defineProperty(ref, "__Static", {
                        configurable: false,
                        enumerable: false,
                        writable: false,
                        value: function (type) {
                            return GetScope(type, false, true);
                        },
                    });

                    // this.__InitBase(type) (deleted after constructor)
                    Object.defineProperty(ref, "__InitBase", {
                        configurable: true,
                        enumerable: false,
                        writable: false,
                        value: function (type, args) {
                            var baseRef = accumulated[type.FullName];
                            if (baseRef === undefined) {
                                throw new Error("Type \"" + refType.FullName + "\" does not directly inherit from \"" + type.FullName + "\".");
                            }

                            if (baseRef.__CanBeConstructedBy !== refType) {
                                if (baseRef.__FromVirtualBaseClass) {
                                    return;
                                }
                                else {
                                    throw new Error("In the construction of type \"" + typeObject.FullName + "\", type \"" + refType.FullName + "\" cannot initialize type \"" + type.FullName + "\" because the correct type to initialize it is \"" + baseRef.__CanBeConstructedBy.FullName + "\".");
                                }
                            }

                            var ctor = baseRef.__Constructor;
                            if (ctor === undefined) {
                                throw new Error("Type\"" + type.FullName + "\" does not have a constructor.");
                            }

                            if (baseRef.__ConstructedBy === null) {
                                ctor.apply(baseRef, args);
                                baseRef.__ConstructedBy = refType;
                            }
                            else {
                                throw new Error("The constructor of type \"" + type.FullName + "\" has already been executed by \"" + baseRef.__ConstructedBy.FullName + "\".");
                            }
                        },
                    });
                })();
            }
        }

        var directBaseClasses = new Array(arguments.length - 2);
        for (var i = 1; i < arguments.length - 1; i++) {
            baseClass = arguments[i];
            if (!(baseClass instanceof __BaseClass)) {
                baseClass = new __BaseClass(baseClass, false);
            }
            directBaseClasses[i - 1] = baseClass;
        }

        var delayLoad = false;
        var description = arguments[arguments.length - 1];
        if (typeof description === "function") {
            delayLoad = true;
        }

        function Type() {
            var typeObject = arguments.callee;

            if (typeObject.VirtualClass) {
                for (var i in typeObject.FlattenedDescription) {
                    var member = typeObject.FlattenedDescription[i];
                    if (member.Virtual === __MemberBase.ABSTRACT) {
                        throw new Error("Cannot create instance of type \"" + typeObject.FullName + "\" because it contains an abstract function \"" + i + "\".");
                    }
                }
            }

            // create every internalReference, which is the value of "this" in member functions
            var accumulated = {};
            var internalReference = CreateCompleteInternalReference(
                typeObject,
                typeObject,
                accumulated,
                false);

            // create the externalReference
            var externalReference = {};

            // copy all public member fields to externalReference
            var accumulatedCopyOrder = [typeObject];
            for (var i = 0; i < accumulatedCopyOrder.length; i++) {
                var type = accumulatedCopyOrder[i];
                var baseClasses = type.BaseClasses;
                for (var j = 0; j < baseClasses.length; j++) {
                    var baseClass = baseClasses[j].Type;
                    if (accumulatedCopyOrder.indexOf(baseClass) === -1) {
                        accumulatedCopyOrder.push(baseClass);
                    }
                }
            }
            for (var i = 0; i < accumulatedCopyOrder.length; i++) {
                var ref = accumulated[accumulatedCopyOrder[i].FullName];
                CopyReferencableMembers(
                    externalReference,
                    ref,
                    ref.__ScopeType.Description,
                    false);
            }

            // inject API into references
            InjectObjects(externalReference, typeObject, accumulated);

            // call the constructor
            externalReference.__proto__ = typeObject.prototype;
            if (internalReference.hasOwnProperty("__Constructor")) {
                internalReference.__Constructor.apply(internalReference, arguments);
            }

            // check is there any constructor is not called
            for (var i in accumulated) {
                var ref = accumulated[i];
                if (ref !== internalReference) {
                    if (ref.__ConstructedBy === null) {
                        throw new Error("The constructor of type \"" + ref.__ScopeType.FullName + "\" has never been executed.");
                    }
                }
            }

            // delete every __InitBase so that this function can only be called when constructing the object
            for (var i in accumulated) {
                delete accumulated[i].__FromVirtualBaseClass;
                delete accumulated[i].__ConstructedBy;
                delete accumulated[i].__CanBeConstructedBy;
                delete accumulated[i].__InitBase;
            }

            // return the created object
            for (var i in accumulated) {
                Object.seal(accumulated[i]);
            }
            Object.seal(externalReference);
            return externalReference;
        }

        var flattenedBaseClasses = null;
        var flattenedBaseClassNames = null;
        var flattenedDescription = null;
        var isVirtualClass = null;
        var virtuallyConstructedBy = {};

        var loaded = false;
        function LoadType() {
            if (loaded) return;
            loaded = true;
            if (delayLoad) {
                description = description();
            }

            // set __MemberBase.DeclaringType
            for (var name in description) {
                if (name.substring(0, 2) === "__" && name !== "__Constructor") {
                    throw new Error("Member name cannot start with \"__\" except \"__Constructor\".");
                }

                var member = description[name];
                member.DeclaringType = Type;

                var value = member.Value;
                if (value !== null &&
                    value !== undefined &&
                    typeof value != "function" &&
                    typeof value != "number" &&
                    typeof value != "string" &&
                    typeof value != "boolean" &&
                    !(value instanceof Struct) &&
                    !(value instanceof Enum) &&
                    !(value instanceof Flags) &&
                    !(value instanceof __EventConstructor) &&
                    !(value instanceof __Property)) {
                    throw new Error("Default value of fields can only be null, undefined, function, number, string, boolean, struct, enum and flags.");
                }

                if (value instanceof __Property) {
                    if (value.GetterName === null) {
                        value.GetterName = "Get" + name;
                    }
                    if (!value.Readonly && value.SetterName === null) {
                        value.SetterName = "Set" + name;
                    }
                    if (value.HasEvent && value.EventName === null) {
                        value.EventName = name + "Changed";
                    }
                }
            }

            // calculate Type.FlattenedBaseClasses
            flattenedBaseClasses = [];
            flattenedBaseClassNames = {};

            function AddFlattenedBaseClass(baseClass) {
                var existingBaseClass = flattenedBaseClassNames[baseClass.Type.FullName];
                if (existingBaseClass === undefined) {
                    flattenedBaseClassNames[baseClass.Type.FullName] = baseClass;
                    flattenedBaseClasses.push(baseClass);
                }
                else {
                    if (existingBaseClass.Virtual !== true || baseClass.Virtual !== true) {
                        throw new Error("Type \"" + fullName + "\" cannot non-virtually inherit from type \"" + baseClass.Type.FullName + "\" multiple times.");
                    }
                }
            }

            for (var i in directBaseClasses) {
                var baseClass = directBaseClasses[i];
                var baseFlattened = baseClass.Type.FlattenedBaseClasses;
                for (var j in baseFlattened) {
                    AddFlattenedBaseClass(baseFlattened[j]);
                }
                AddFlattenedBaseClass(baseClass);
            }

            for (var i in flattenedBaseClasses) {
                var virtualBaseClass = flattenedBaseClasses[i];
                if (virtualBaseClass.Virtual === true) {
                    var firstClass = null;
                    var counter = 0;

                    for (var j in directBaseClasses) {
                        var directBaseClass = directBaseClasses[j];
                        var constructedBy = virtualBaseClass.Type.VirtuallyConstructedBy[directBaseClass.Type.FullName];
                        if (constructedBy !== undefined) {
                            if (firstClass === null) {
                                firstClass = constructedBy;
                            }
                            counter++;
                        }
                    }

                    if (firstClass === null || counter > 0) {
                        virtualBaseClass.Type.VirtuallyConstructedBy[fullName] = Type;
                    }
                    else {
                        virtualBaseClass.Type.VirtuallyConstructedBy[fullName] = firstClass;
                    }
                }
            }

            // calculate Type.FlattenedDescription
            flattenedDescription = Object.create(description);

            for (var i in directBaseClasses) {
                var baseClass = directBaseClasses[i];
                var flattened = baseClass.Type.FlattenedDescription;
                for (var name in flattened) {
                    var member = description[name];
                    var baseMember = flattened[name];

                    if (name === "__Constructor") {
                        continue;
                    }

                    if (baseMember instanceof __PrivateMember) {
                        continue;
                    }

                    if (member === undefined) {
                        if (flattenedDescription[name] !== undefined) {
                            if (flattenedBaseClassNames[baseMember.DeclaringType.FullName].Virtual === false) {
                                throw new Error("Type \"" + fullName + "\" cannot inherit multiple members of the same name \"" + name + "\" without defining a new one.");
                            }
                        }
                        else {
                            flattenedDescription[name] = baseMember;
                        }
                    }
                    else {
                        member.HiddenMembers.push(baseMember);
                    }
                }
            }

            for (var i in description) {
                var member = description[i];

                for (var j in member.HiddenMembers) {
                    var hiddenMember = member.HiddenMembers[j];
                    if (hiddenMember.Value instanceof __EventConstructor) {
                        throw new Error("Type \"" + fullName + "\" cannot hide event \"" + i + "\".");
                    }
                }

                if (member.Virtual === __MemberBase.OVERRIDE) {
                    if (member.HiddenMembers.length === 0) {
                        throw new Error("Type \"" + fullName + "\" cannot find virtual function \"" + i + "\" to override.");
                    }
                    else {
                        for (var j in member.HiddenMembers) {
                            var hiddenMember = member.HiddenMembers[j];
                            if (hiddenMember.Virtual === __MemberBase.NORMAL) {
                                throw new Error("Type \"" + fullName + "\" cannot override non-virtual function \"" + i + "\".");
                            }
                        }
                    }
                }
                else if (member.New) {
                    if (member.HiddenMembers.length === 0) {
                        throw new Error("Type \"" + fullName + "\" cannot define a new member \"" + i + "\" without hiding anything.");
                    }
                }
                else {
                    for (var j in member.HiddenMembers) {
                        var hiddenMember = member.HiddenMembers[j];
                        if (hiddenMember.Virtual === __MemberBase.NORMAL) {
                            throw new Error("Type \"" + fullName + "\" cannot hide member \"" + i + "\" without new.");
                        }
                        else {
                            throw new Error("Type \"" + fullName + "\" cannot hide virtual function \"" + i + "\" without overriding.");
                        }
                    }
                }
            }

            // Type.VirtualClass
            isVirtualClass = false;
            for (var i in flattenedDescription) {
                var member = flattenedDescription[i];
                if (member.Virtual === __MemberBase.ABSTRACT) {
                    isVirtualClass = true;
                }
            }
        }

        if (delayLoad) {
            Object.defineProperty(Type, "__ForceLoad", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: function () {
                    LoadType();
                },
            });
        }
        else {
            LoadType();
        }

        // Type.FullName
        Object.defineProperty(Type, "FullName", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: fullName,
        });

        // Type.Description
        Object.defineProperty(Type, "Description", {
            configurable: false,
            enumerable: true,
            get: function () {
                LoadType();
                return description;
            },
        });

        // Type.FlattenedDescription
        Object.defineProperty(Type, "FlattenedDescription", {
            configurable: false,
            enumerable: true,
            get: function () {
                LoadType();
                return flattenedDescription;
            },
        });

        // Type.BaseClasses
        Object.defineProperty(Type, "BaseClasses", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: directBaseClasses,
        });

        // Type.FlattenedBaseClasses
        Object.defineProperty(Type, "FlattenedBaseClasses", {
            configurable: false,
            enumerable: true,
            get: function () {
                LoadType();
                return flattenedBaseClasses;
            },
        });

        // Type.FlattenedBaseClasses
        Object.defineProperty(Type, "VirtuallyConstructedBy", {
            configurable: false,
            enumerable: true,
            get: function () {
                LoadType();
                return virtuallyConstructedBy;
            },
        });

        // Type.IsAssignableFrom(childType)
        Object.defineProperty(Type, "IsAssignableFrom", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (childType) {
                LoadType();
                if (childType === Type) {
                    return true;
                }
                else {
                    var baseClasses = childType.BaseClasses;
                    for (var i in baseClasses) {
                        if (Type.IsAssignableFrom(baseClasses[i].Type)) {
                            return true;
                        }
                    }
                    return false;
                }
            }
        });

        // Type.TestType(obj)
        Object.defineProperty(Type, "TestType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (obj) {
                LoadType();
                return obj === null || (obj instanceof Class && Type.IsAssignableFrom(obj.__Type));
            }
        });

        // Type.RequireType(obj)
        Object.defineProperty(Type, "RequireType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (obj) {
                if (!this.TestType(obj)) {
                    throw new Error("The specified object's type is not compatible with \"" + Type.FullName + "\".");
                }
            }
        });

        Type.__proto__ = __Class.prototype;
        Type.prototype.__proto__ = Class.prototype;
        Object.seal(Type);
        Packages.RegisterType(Type);
        return Type;
    }

    ///////////////////////////////////////////////////////////////

    function Enum(fullName, description) {

        function Type(itemName, value) {
            var typeObject = arguments.callee;

            // obj.__Type
            Object.defineProperty(this, "__Type", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: typeObject,
            });
            // obj.__Value
            Object.defineProperty(this, "__Value", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: value,
            });
            // obj.__Clone
            Object.defineProperty(this, "__Clone", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: function () {
                    return this;
                },
            });
            // obj.__Equals
            Object.defineProperty(this, "__Equals", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: function (obj) {
                    return obj instanceof Enum && obj.__Type === typeObject && obj.__Value === value;
                },
            });
            // obj.__ToString
            Object.defineProperty(this, "__ToString", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: function () {
                    return itemName;
                },
            });

            Object.seal(this);
        }

        // Type.Flags
        Object.defineProperty(Type, "Flags", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: false,
        });
        // Type.FullName
        Object.defineProperty(Type, "FullName", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: fullName,
        });
        // Type.Description
        Object.defineProperty(Type, "Description", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: {},
        });
        for (var i in description) {
            Type.Description[i] = new Type(i, description[i]);
        }
        // Type.Parse(text)
        Object.defineProperty(Type, "Parse", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (text) {
                if (!Type.Description.hasOwnProperty(text)) {
                    throw new Error("\"" + text + "\" is not a valid string representation for type \"" + Type.FullName + "\".");
                }
                return Type.Description[text];
            },
        });
        // Type.TestType(obj)
        Object.defineProperty(Type, "TestType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (obj) {
                return obj instanceof Enum && obj.__Type === Type;
            }
        });
        // Type.RequireType(obj)
        Object.defineProperty(Type, "RequireType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (obj) {
                if (!this.TestType(obj)) {
                    throw new Error("The specified object's type is not compatible with \"" + Type.FullName + "\".");
                }
            }
        });

        Type.__proto__ = __Enum.prototype;
        Type.prototype.__proto__ = Enum.prototype;
        Object.seal(Type);
        Packages.RegisterType(Type);
        return Type;
    }

    function Flags(fullName, description) {

        function Type(itemName, value) {
            var typeObject = arguments.callee;
            var flags = {};

            if (arguments.length === 2) {
                flags[itemName] = this;
            }

            // obj.__Type
            Object.defineProperty(this, "__Type", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: typeObject,
            });
            // obj.__Value
            if (arguments.length === 2) {
                Object.defineProperty(this, "__Value", {
                    configurable: false,
                    enumerable: true,
                    writable: false,
                    value: value,
                });
            }
            else {
                Object.defineProperty(this, "__Value", {
                    configurable: false,
                    enumerable: true,
                    get: function () {
                        var result = 0;
                        for (var i in flags) {
                            result += typeObject.Description[i].__Value;
                        }
                        return result;
                    },
                });
            }
            // obj.__Clone
            Object.defineProperty(this, "__Clone", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: function () {
                    var result = new typeObject();
                    for (var i in flags) {
                        result = result.__Add(typeObject.Description[i]);
                    }
                    return result;
                },
            });
            // obj.__Equals
            Object.defineProperty(this, "__Equals", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: function (obj) {
                    return obj instanceof Flags && obj.__Type === typeObject && obj.__Value === this.__Value;
                },
            });
            // obj.__ToString
            if (arguments.length === 2) {
                Object.defineProperty(this, "__ToString", {
                    configurable: false,
                    enumerable: true,
                    writable: false,
                    value: function () {
                        return itemName;
                    },
                });
            }
            else {
                Object.defineProperty(this, "__ToString", {
                    configurable: false,
                    enumerable: true,
                    writable: false,
                    value: function () {
                        var result = "";
                        for (var i in typeObject.Description) {
                            if (flags.hasOwnProperty(i)) {
                                if (result !== "") {
                                    result += "|";
                                }
                                result += i;
                            }
                        }
                        return result;
                    },
                });
            }
            if (arguments.length === 0) {
                // obj.__Add
                Object.defineProperty(this, "__Add", {
                    configurable: false,
                    enumerable: true,
                    writable: false,
                    value: function (obj) {
                        if (!(obj instanceof Flags) || obj.__Type !== typeObject) {
                            throw new Error("Flags can only combine with static flags (YourFlagType.Description.FlagName) of the same type.");
                        }

                        var name = obj.__ToString();
                        if (!typeObject.Description.hasOwnProperty(name) || typeObject.Description[name] !== obj) {
                            throw new Error("Flags can only combine with static flags (YourFlagType.Description.FlagName) of the same type.");
                        }

                        if (flags.hasOwnProperty(name)) {
                            throw new Error("Flag \"" + name + "\" has already been added.");
                        }

                        flags[name] = obj;
                        return this;
                    },
                });
                // obj.__Remove
                Object.defineProperty(this, "__Remove", {
                    configurable: false,
                    enumerable: true,
                    writable: false,
                    value: function (obj) {
                        if (!(obj instanceof Flags) || obj.__Type !== typeObject) {
                            throw new Error("Flags can only combine with static flags (YourFlagType.Description.FlagName) of the same type.");
                        }

                        var name = obj.__ToString();
                        if (!typeObject.Description.hasOwnProperty(name) || typeObject.Description[name] !== obj) {
                            throw new Error("Flags can only combine with static flags (YourFlagType.Description.FlagName) of the same type.");
                        }

                        if (!flags.hasOwnProperty(name)) {
                            throw new Error("Flag \"" + name + "\" cannot be removed.");
                        }

                        delete flags[name];
                        return this;
                    },
                });
                // obj.__Flags
                Object.defineProperty(this, "__Flags", {
                    configurable: false,
                    enumerable: true,
                    writable: false,
                    value: flags,
                });
            }

            Object.seal(this);
        }

        // Type.Flags
        Object.defineProperty(Type, "Flags", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: true,
        });
        // Type.FullName
        Object.defineProperty(Type, "FullName", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: fullName,
        });
        // Type.Description
        Object.defineProperty(Type, "Description", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: {},
        });
        for (var i in description) {
            Type.Description[i] = new Type(i, description[i]);
        }
        // Type.Parse(text)
        Object.defineProperty(Type, "Parse", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (text) {
                var result = new Type();
                if (text !== "") {
                    var names = text.split('|');
                    for (var i in names) {
                        var name = names[i];
                        if (!Type.Description.hasOwnProperty(name)) {
                            throw new Error("\"" + name + "\" is not a valid string representation for type \"" + Type.FullName + "\".");
                        }
                        result.__Add(Type.Description[name]);
                    }
                }
                return result;
            },
        });
        // Type.TestType(obj)
        Object.defineProperty(Type, "TestType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (obj) {
                return obj instanceof Flags && obj.__Type === Type;
            }
        });
        // Type.RequireType(obj)
        Object.defineProperty(Type, "RequireType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (obj) {
                if (!this.TestType(obj)) {
                    throw new Error("The specified object's type is not compatible with \"" + Type.FullName + "\".");
                }
            }
        });

        Type.__proto__ = __Enum.prototype;
        Type.prototype.__proto__ = Flags.prototype;
        Object.seal(Type);
        Packages.RegisterType(Type);
        return Type;
    }

    ///////////////////////////////////////////////////////////////

    function __StructMemberEquals(a, b) {
        if (a instanceof Enum && b instanceof Enum) {
            return a.__Equals(b);
        }
        else if (a instanceof Flags && b instanceof Flags) {
            return a.__Equals(b);
        }
        else if (a instanceof Struct && b instanceof Struct) {
            return a.__Equals(b);
        }
        else {
            return a === b;
        }
    }

    function __StructMemberClone(a) {
        if (a instanceof Enum || a instanceof Flags || a instanceof Struct) {
            return a.__Clone();
        }
        else {
            return a;
        }
    }

    function __StructMemberToString(a) {
        if (a instanceof Enum || a instanceof Flags || a instanceof Struct) {
            return a.__ToString();
        }
        else {
            return "" + a;
        }
    }

    function __StructMemberParse(text, defaultValue) {
        if (defaultValue instanceof Enum || defaultValue instanceof Flags || defaultValue instanceof Struct) {
            return defaultValue.__Type.Parse(text);
        }
        else if (typeof defaultValue === "number") {
            return +text;
        }
        else if (typeof defaultValue === "boolean") {
            if (text === "true") return true;
            if (text === "false") return false;
            throw new Error("\"" + text + "\" is not a valid string representation for type \"boolean\".");
        }
        else {
            return text;
        }
    }

    function __StructEscape(text) {
        if (text.indexOf(" ") === -1 && text.indexOf("{") === -1 && text.indexOf("}") === -1) {
            return text;
        }

        var result = "";
        for (var i in text) {
            var c = text[i];
            switch (c) {
                case '{':
                    result += "{{";
                    break;
                case '}':
                    result += "}}";
                    break;
                default:
                    result += c;
            }
        }

        return "{" + result + "}";
    }

    function __StructUnescape(text) {
        if (text === "" || text[0] !== "{") {
            return text;
        }

        var result = "";
        for (var i = 1; i < text.length - 1; i++) {
            var c = text[i];
            switch (c) {
                case '{':
                    if (text[i + 1] !== '{') {
                        throw new Error("\"" + text + "\" is not a valid escaped struct member representation.");
                    }
                    result += "{";
                    i++;
                    break;
                case '}':
                    if (text[i + 1] !== '}') {
                        throw new Error("\"" + text + "\" is not a valid escaped struct member representation.");
                    }
                    result += "}";
                    i++;
                    break;
                default:
                    result += c;
            }
        }
        return result;
    }

    function Struct(fullName, description, toString, fromString) {

        var length = 0;
        for (var i in description) {
            length++;
        }

        var descriptionTypes = {};
        for (var i in description) {
            var defaultValue = description[i];
            var memberType = null;

            if (defaultValue instanceof Enum || defaultValue instanceof Flags || defaultValue instanceof Struct) {
                memberType = defaultValue.__Type;
            }
            else if (typeof defaultValue === "number") {
                memberType = __Number;
            }
            else if (typeof defaultValue === "string") {
                memberType = __String;
            }
            else if (typeof defaultValue === "boolean") {
                memberType = __Boolean;
            }
            else if (typeof defaultValue === "function") {
                memberType = __Function;
            }
            else if (defaultValue instanceof Array) {
                memberType = __Array;
            }
            else if (defaultValue instanceof Class) {
                throw new Error("The default value of field \"" + i + "\" in type \"" + fullName + "\" cannot be an instanceof of a class.");
            }
            else {
                throw new Error("Cannot recognize the type of the  default value of field \"" + i + "\" in type \"" + fullName + "\".");
            }

            descriptionTypes[i] = memberType;
        }

        function Type(proto) {
            var typeObject = arguments.callee;

            // obj.__Type
            Object.defineProperty(this, "__Type", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: typeObject,
            });
            // obj.__Clone
            Object.defineProperty(this, "__Clone", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: function () {
                    var proto = {};
                    for (var i in description) {
                        proto[i] = this[i];
                    }
                    return new typeObject(proto);
                },
            });
            // obj.__Equals
            Object.defineProperty(this, "__Equals", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: function (obj) {
                    if (!(obj instanceof Struct)) return false;
                    if (obj.__Type !== typeObject) return false;
                    for (var i in typeObject.Description) {
                        if (!__StructMemberEquals(this[i], obj[i])) return false;
                    }
                    return true;
                },
            });
            // obj.__ToString
            Object.defineProperty(this, "__ToString", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: toString !== undefined ? toString : function () {
                    var result = "";
                    for (var i in typeObject.Description) {
                        if (result !== "") {
                            result += " ";
                        }
                        result += i + ":" + __StructEscape(__StructMemberToString(this[i]));
                    }
                    return result;
                },
            });

            var members = {};
            for (var i in description) {
                (function () {
                    var memberName = i;
                    var memberType = descriptionTypes[i];

                    Object.defineProperty(this, memberName, {
                        configurable: false,
                        enumerable: true,
                        get: function () {
                            return members[memberName];
                        },
                        set: function (value) {
                            memberType.RequireType(value);
                            members[memberName] = value;
                        },
                    });
                }).apply(this, []);
            }

            if (arguments.length === 0) {
                for (var i in description) {
                    this[i] = __StructMemberClone(description[i]);
                }
            }
            else if (arguments.length === 1 && proto.__proto__ === Object.prototype) {
                for (var i in description) {
                    if (proto.hasOwnProperty(i)) {
                        this[i] = __StructMemberClone(proto[i]);
                    } else {
                        this[i] = __StructMemberClone(description[i]);
                    }
                }
            }
            else {
                if (arguments.length !== length) {
                    throw new Error("Values of each member should be provided to create struct \"" + fullName + "\".");
                }
                var index = 0;
                for (var i in description) {
                    this[i] = __StructMemberClone(arguments[index++]);
                }
            }
            Object.seal(this);
        }

        // Type.FullName
        Object.defineProperty(Type, "FullName", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: fullName,
        });
        // Type.Description
        Object.defineProperty(Type, "Description", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: description,
        });
        // Type.Parse(text)
        Object.defineProperty(Type, "Parse", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: fromString !== undefined ? fromString : function (text) {
                var proto = {};

                var reading = 0;
                while (reading < text.length) {
                    var colon = text.indexOf(':', reading);
                    if (colon === -1) {
                        throw new Error("\"" + text + "\" is not a valid string representation for type \"" + fullName + "\".");
                    }

                    var key = text.substring(reading, colon);
                    if (proto.hasOwnProperty(key) || !description.hasOwnProperty(key) || colon === text.length - 1) {
                        throw new Error("\"" + text + "\" is not a valid string representation for type \"" + fullName + "\".");
                    }

                    if (text[colon + 1] === '{') {
                        reading = colon + 1;
                        while (true) {
                            var close = text.indexOf('}', reading);
                            if (close === -1) {
                                throw new Error("\"" + text + "\" is not a valid string representation for type \"" + fullName + "\".");
                            }
                            reading = close + 1;

                            if (reading < text.length && text[reading] === '}') {
                                reading++;
                            } else {
                                break;
                            }
                        }
                        var value = text.substring(colon + 1, reading);
                    } else {
                        var space = text.indexOf(' ', colon + 1);
                        if (space === -1) space = text.length;
                        var value = text.substring(colon + 1, space);
                        reading = space;
                    }

                    proto[key] = __StructMemberParse(__StructUnescape(value), description[key]);

                    while (reading < text.length && text[reading] === ' ') {
                        reading++;
                    }
                }

                for (var i in description) {
                    if (!proto.hasOwnProperty(i)) {
                        proto[i] = description[i];
                    }
                }
                return new Type(proto);
            },
        });
        // Type.TestType(obj)
        Object.defineProperty(Type, "TestType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (obj) {
                return obj instanceof Struct && obj.__Type === Type;
            }
        });
        // Type.RequireType(obj)
        Object.defineProperty(Type, "RequireType", {
            configurable: false,
            enumerable: true,
            writable: false,
            value: function (obj) {
                if (!this.TestType(obj)) {
                    throw new Error("The specified object's type is not compatible with \"" + Type.FullName + "\".");
                }
            }
        });

        Type.__proto__ = __Struct.prototype;
        Type.prototype.__proto__ = Struct.prototype;
        Object.seal(Type);
        Packages.RegisterType(Type);
        return Type;
    }

    return {
        __BaseClass: __BaseClass,
        __MemberBase: __MemberBase,
        __PrivateMember: __PrivateMember,
        __ProtectedMember: __ProtectedMember,
        __PublicMember: __PublicMember,
        __EventConstructor: __EventConstructor,
        __Event: __Event,
        __EventHandler: __EventHandler,
        __Property: __Property,

        __Class: __Class,
        __Enum: __Enum,
        __Struct: __Struct,
        __PrimitiveType: __PrimitiveType,

        __Number: __Number,
        __Boolean: __Boolean,
        __String: __String,
        __Array: __Array,
        __Function: __Function,
        __Type: __Type,
        __Void: __Void,
        __Object: __Object,

        Class: Class,
        Enum: Enum,
        Flags: Flags,
        Struct: Struct,

        Public: Public,
        Protected: Protected,
        Private: Private,
        Virtual: Virtual,
    }
});