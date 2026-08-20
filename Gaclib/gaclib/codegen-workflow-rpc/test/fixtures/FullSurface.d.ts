export type TypeList_Enum = 'sample::Options' | 'sample::State';
export type UnknownType_EnumSchema = [TypeList_Enum, number];
export type UnknownTypeSchema = UnknownType_EnumSchema | UnknownType_sample_Item | UnknownType_sample_Envelope | UnknownType_sample_NumericBoundaries | UnknownType_system_RpcObjectReference | UnknownType_system_RpcException | string | number;
export interface UnknownType_sample_Item extends sample_Item { '$': 'sample::Item'; }
export interface UnknownType_sample_Envelope extends sample_Envelope { '$': 'sample::Envelope'; }
export interface UnknownType_sample_NumericBoundaries extends sample_NumericBoundaries { '$': 'sample::NumericBoundaries'; }
export interface UnknownType_system_RpcObjectReference extends system_RpcObjectReference { '$': 'system::RpcObjectReference'; }
export interface UnknownType_system_RpcException extends system_RpcException { '$': 'system::RpcException'; }
export enum sample_State { Off = 0, On = 1 }
export enum sample_Options { None = 0, First = 1, Second = 2 }
export interface sample_Item { name: string; state: sample_State; }
export interface sample_Envelope { note: string | null; nested: [string, sample_Item[]][]; }
export interface sample_NumericBoundaries { u8: number; i64: number; single: number; }
export interface system_RpcObjectReference { clientId: number; objectId: number; typeId: number; }
export interface system_RpcException { message: string; }
export type KnownTypeSchema = number | boolean | string | sample_Item | sample_Envelope | sample_NumericBoundaries | system_RpcObjectReference | system_RpcException;
