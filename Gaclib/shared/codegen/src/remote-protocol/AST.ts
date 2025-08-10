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
    element: TypeReference;
}

export interface ArrayType {
    '$ast': 'ArrayType';
    element: TypeReference;
}

export interface ArrayMapType {
    '$ast': 'ArrayMapType';
    element: string;
    keyField: string;
}

export interface MapType {
    '$ast': 'MapType';
    element: TypeReference;
    keyType: TypeReference;
}

export type TypeReference = PrimitiveType | ReferenceType | ArrayType | MapType | ArrayMapType | OptionalType;

// Declaration

export interface DeclarationBase {
    attributes: Attribute[];
    name: string;
}

export interface EnumMember {
    '$ast': 'EnumMember';
    name: string;
}

export interface EnumDecl extends DeclarationBase {
    '$ast': 'EnumDecl';
    members: EnumMember[];
}

export interface UnionMember {
    '$ast': 'UnionMember';
    name: string;
}

export interface UnionDecl extends DeclarationBase {
    '$ast': 'UnionDecl';
    members: UnionMember[];
}

export interface StructMember {
    '$ast': 'StructMember';
    name: string;
    type: TypeReference;
}

export interface StructDecl extends DeclarationBase {
    '$ast': 'StructDecl';
    members: StructMember[];
    type: 'Struct' | 'Class';
}

export interface MessageRequest {
    '$ast': 'MessageRequest';
    type: TypeReference;
}

export interface MessageResponse {
    '$ast': 'MessageResponse';
    type: TypeReference;
}

export interface MessageDecl extends DeclarationBase {
    '$ast': 'MessageDecl';
    request: MessageRequest | null;
    response: MessageResponse | null;
}

export interface EventRequest {
    '$ast': 'EventRequest';
    type: TypeReference;
}

export interface EventDecl extends DeclarationBase {
    '$ast': 'EventDecl';
    request: EventRequest | null;
}

export type Declarations = StructDecl | EnumDecl | UnionDecl | MessageDecl | EventDecl;

// Schema

export interface Schema {
    '$ast': 'Schema';
    declarations: Declarations[];
}
