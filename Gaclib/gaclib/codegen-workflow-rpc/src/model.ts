export interface SourceLocation {
    readonly path: string;
    readonly offset: number;
    readonly line: number;
    readonly column: number;
}

export interface AttributeAst {
    readonly name: string;
    readonly arguments: readonly (string | number)[];
    readonly location: SourceLocation;
}

export type CollectionKind = 'enumerable' | 'readonlyList' | 'list' | 'array' | 'observableList' | 'readonlyDictionary' | 'dictionary';

export type TypeAst =
    | { readonly kind: 'named'; readonly fullName: string; readonly interfaceReference: boolean; readonly location: SourceLocation }
    | { readonly kind: 'nullable'; readonly item: TypeAst; readonly location: SourceLocation }
    | { readonly kind: 'collection'; readonly collectionKind: CollectionKind; readonly item: TypeAst; readonly key?: TypeAst; readonly location: SourceLocation };

export interface EnumItemAst {
    readonly name: string;
    readonly value: number;
    readonly location: SourceLocation;
}

export interface EnumAst {
    readonly kind: 'enum';
    readonly fullName: string;
    readonly name: string;
    readonly flags: boolean;
    readonly items: readonly EnumItemAst[];
    readonly location: SourceLocation;
}

export interface StructFieldAst {
    readonly name: string;
    readonly type: TypeAst;
    readonly location: SourceLocation;
}

export interface StructAst {
    readonly kind: 'struct';
    readonly fullName: string;
    readonly name: string;
    readonly fields: readonly StructFieldAst[];
    readonly location: SourceLocation;
}

export interface ParameterAst {
    readonly name: string;
    readonly type: TypeAst;
    readonly attributes: readonly AttributeAst[];
    readonly location: SourceLocation;
}

export interface MethodAst {
    readonly kind: 'method';
    readonly name: string;
    readonly parameters: readonly ParameterAst[];
    readonly result: TypeAst;
    readonly attributes: readonly AttributeAst[];
    readonly location: SourceLocation;
}

export interface EventAst {
    readonly kind: 'event';
    readonly name: string;
    readonly parameters: readonly ParameterAst[];
    readonly attributes: readonly AttributeAst[];
    readonly location: SourceLocation;
}

export interface PropertyAst {
    readonly kind: 'property';
    readonly name: string;
    readonly type: TypeAst;
    readonly getter: string;
    readonly setter?: string;
    readonly changedEvent?: string;
    readonly attributes: readonly AttributeAst[];
    readonly location: SourceLocation;
}

export interface InterfaceAst {
    readonly kind: 'interface';
    readonly fullName: string;
    readonly name: string;
    readonly bases: readonly TypeAst[];
    readonly methods: readonly MethodAst[];
    readonly events: readonly EventAst[];
    readonly properties: readonly PropertyAst[];
    readonly attributes: readonly AttributeAst[];
    readonly location: SourceLocation;
}

export type TypeDeclarationAst = EnumAst | StructAst | InterfaceAst;

export interface ContractAst {
    readonly moduleName: string;
    readonly declarations: readonly TypeDeclarationAst[];
}

export type TransferMode = 'value' | 'byValue' | 'byReference';

export interface TypeUseIr {
    readonly type: TypeAst;
    readonly transfer: TransferMode;
}

export interface MethodIr extends Omit<MethodAst, 'parameters' | 'result'> {
    readonly idString: string;
    readonly idNumber: number;
    readonly implementationKey: string;
    readonly parameters: readonly (Omit<ParameterAst, 'type'> & TypeUseIr)[];
    readonly result: TypeUseIr;
}

export interface EventIr extends Omit<EventAst, 'parameters'> {
    readonly idString: string;
    readonly idNumber: number;
    readonly propertyKey: string;
    readonly parameters: readonly (Omit<ParameterAst, 'type'> & TypeUseIr)[];
}

export interface PropertyIr extends PropertyAst {
    readonly cached: boolean;
    readonly transfer: TransferMode;
    readonly getterMethodId: number;
    readonly setterMethodId?: number;
    readonly changedEventId?: number;
}

export interface InterfaceIr extends Omit<InterfaceAst, 'methods' | 'events' | 'properties'> {
    readonly idString: string;
    readonly idNumber: number;
    readonly constructorService: boolean;
    readonly baseTypeIds: readonly number[];
    readonly inheritanceClosure: readonly number[];
    readonly methods: readonly MethodIr[];
    readonly events: readonly EventIr[];
    readonly properties: readonly PropertyIr[];
    readonly tsName: string;
}

export interface ContractIr {
    readonly moduleName: string;
    readonly enums: readonly (EnumAst & { readonly tsName: string })[];
    readonly structs: readonly (StructAst & { readonly tsName: string })[];
    readonly interfaces: readonly InterfaceIr[];
    readonly declarationsByFullName: ReadonlyMap<string, TypeDeclarationAst>;
}

export class WorkflowRpcDiagnostic extends Error {
    constructor(
        message: string,
        readonly location: SourceLocation,
        readonly fullName?: string,
        readonly id?: string | number,
    ) {
        const context = [
            `${location.path}:${String(location.line)}:${String(location.column)}`,
            fullName === undefined ? undefined : `[${fullName}]`,
            id === undefined ? undefined : `(id: ${String(id)})`,
        ].filter(value => value !== undefined).join(' ');
        super(`${context}: ${message}`);
        this.name = 'WorkflowRpcDiagnostic';
    }
}
