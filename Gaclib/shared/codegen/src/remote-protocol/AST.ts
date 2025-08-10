// Attribute
export interface Attribute {
    '$ast': 'Attribute';
    name: string;
    cppType: string;
}

// Type

export interface PrimitiveType {
    '$ast': 'PrimitiveType';
    type: 'Boolean' | 'Integer' | 'Float' | 'Double' | 'String' | 'Char' | 'Key' | 'Color' | 'Binary';
}

export interface ReferenceType {
    '$ast': 'ReferenceType';
    name: string;
}

export interface OptionalType {
    '$ast': 'OptionalType';
    element: Type;
}

export interface ArrayType {
    '$ast': 'ArrayType';
    element: Type;
}

export interface ArrayMapType {
    '$ast': 'ArrayMapType';
    element: string;
    keyField: string;
}

export interface MapType {
    '$ast': 'MapType';
    element: Type;
    keyType: Type;
}

export type Type = PrimitiveType | ReferenceType | ArrayType | MapType | ArrayMapType | OptionalType;

// Declaration

export interface _DeclarationCommon {
    attributes: Attribute[];
    name: string;
}

export interface EnumMember {
    '$ast': 'EnumMember';
    name: string;
}

export interface EnumDecl extends _DeclarationCommon {
    '$ast': 'EnumDecl';
    members: EnumMember[];
}

export interface UnionMember {
    '$ast': 'UnionMember';
    name: string;
}

export interface UnionDecl extends _DeclarationCommon {
    '$ast': 'UnionDecl';
    members: UnionMember[];
}

export interface StructMember {
    '$ast': 'StructMember';
    name: string;
    type: Type;
}

export interface StructDecl extends _DeclarationCommon {
    '$ast': 'StructDecl';
    members: StructMember[];
    type: 'Struct' | 'Class';
}

export interface MessageRequest {
    '$ast': 'MessageRequest';
    type: Type;
}

export interface MessageResponse {
    '$ast': 'MessageResponse';
    type: Type;
}

export interface MessageDecl extends _DeclarationCommon {
    '$ast': 'MessageDecl';
    request: MessageRequest | null;
    response: MessageResponse | null;
}

export interface EventRequest {
    '$ast': 'EventRequest';
    type: Type;
}

export interface EventDecl extends _DeclarationCommon {
    '$ast': 'EventDecl';
    request: EventRequest | null;
}

export type Declarations = StructDecl | EnumDecl | UnionDecl | MessageDecl | EventDecl;

// Schema

export interface Schema {
    '$ast': 'Schema';
    declarations: Declarations[];
}
