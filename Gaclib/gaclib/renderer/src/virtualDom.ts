import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from './GacUIElementManager';

/*
 * # Converting from RenderingDom(r) to IVirtualDom(v)
 *   r.id -> v.id
 *   r.content.hitTestResult -> v.hitTestResult
 *   r.content.cursor -> v.cursor
 *   r.content.element -> v.typedDesc
 *   r.content.bounds -> v.globalBounds
 *   r.children -> v.children
 * 
 * r.content.bounds and r.content.validArea are in global coordinate.
 * v.globalBounds will in global coordinate too, but v.global will be in its parent's coordinate.
 * when v is the root, v.bounds === v.globalBounds.
 * 
 * In most cases, r.content.validArea is the same as r.content.bounds.
 * Unless the element is clipped by a parent node during rendering.
 * The actual parent is in GacUI Core therefore it may not necessary appeared as a RenderingDom.
 * r.content.validArea will always equals to or smaller than the intersection of r.content.bounds and parent.validArea.
 * 
 * In case of smaller, createSimpleDom will be called to make a IVirtualDom whose bounds is r.content.validArea.
 * And the IVirtualDom created from r becomes it child.
 * In case of equal, such extra IVirtualDom must not exist.
 * 
 * The RenderingDom always has a -1 id. All other RenderingDom's id must not be negative.
 * When two IVirtualDom need to be created for one RenderingDom
 *   The outer one reflects r.content.validArea, it would be a simple dom, but it copies RenderingDom.id.
 *   The inner one reflects r.content.bounds, it copies RenderingDom.content, but its id will be -2.
 *   An id of -2 is special and help identify such case, so it is possible to have multiple IVirtualDom using -2.
 *   This allows for more flexible rendering scenarios where elements may need to be represented in different ways.
 *   VirtualDomRecord.doms will not store for id that is negative.
 *
 * RootVirtualDomId and ClippedVirtualDomId are defined for special ids.
 *
 * # Converting from RenderingDom_DiffsInOrder to IVirtualDom
 * 
 * Although there is only one diffsInOrder collection but we should read RenderingDom_Diff.diffType and
 *   Process "Created", create IVirtualDom for each of them and maintain necessary mappings
 *     content must be non-null for "Created"
 *   Process "Deleted", remove them from mappings
 *     content and children will be ignored
 *   Process "Updated"
 *     non-null content or children means the updated new value
 *
 * We don't need to keep and update RenderingDom, it will apply to IVirtualDom directly.
 * The updated IVirtualDom must follow the above rule with bounds and validArea.
 */
export interface IVirtualDom {
    get parent(): IVirtualDom | undefined;
    get id(): SCHEMA.TYPES.Integer;
    get globalBounds(): SCHEMA.Rect;
    get bounds(): SCHEMA.Rect;
    get hitTestResult(): SCHEMA.WindowHitTestResult | undefined;
    get cursor(): SCHEMA.WindowSystemCursorType | undefined;
    get typedDesc(): TypedElementDesc | undefined;
    get children(): ReadonlyArray<IVirtualDom>;
    updateChildren(children: IVirtualDom[]): void;
    updateTypedDesc(typedDesc: TypedElementDesc | undefined): void;
}

export interface IVirtualDomProvider {
    createDom(
        id: SCHEMA.TYPES.Integer,
        globalBounds: SCHEMA.Rect,
        hitTestResult: SCHEMA.WindowHitTestResult | undefined,
        cursor: SCHEMA.WindowSystemCursorType | undefined,
        typedDesc: TypedElementDesc | undefined): IVirtualDom;
    createSimpleDom(
        id: SCHEMA.TYPES.Integer,
        globalBounds: SCHEMA.Rect): IVirtualDom;
}

export const RootVirtualDomId: SCHEMA.TYPES.Integer = -1;
export const ClippedVirtualDomId: SCHEMA.TYPES.Integer = -2;