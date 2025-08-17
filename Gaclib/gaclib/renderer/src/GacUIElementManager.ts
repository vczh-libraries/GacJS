import * as SCHEMA from '@gaclib/remote-protocol';

export type TypedElementDesc =
    | { type: SCHEMA.RendererType.Raw }
    | { type: SCHEMA.RendererType.FocusRectangle }
    | { type: SCHEMA.RendererType.SolidBorder; desc: SCHEMA.ElementDesc_SolidBorder }
    | { type: SCHEMA.RendererType.SolidBackground; desc: SCHEMA.ElementDesc_SolidBackground }
    | { type: SCHEMA.RendererType.GradientBackground; desc: SCHEMA.ElementDesc_GradientBackground }
    | { type: SCHEMA.RendererType.SinkBorder; desc: SCHEMA.ElementDesc_SinkBorder }
    | { type: SCHEMA.RendererType.SinkSplitter; desc: SCHEMA.ElementDesc_SinkSplitter }
    | { type: SCHEMA.RendererType.InnerShadow; desc: SCHEMA.ElementDesc_InnerShadow }
    | { type: SCHEMA.RendererType.ImageFrame; desc: SCHEMA.ElementDesc_ImageFrame }
    | { type: SCHEMA.RendererType.Polygon; desc: SCHEMA.ElementDesc_Polygon }
    | { type: SCHEMA.RendererType.SolidLabel; desc: SCHEMA.ElementDesc_SolidLabel };

interface ElementRecord {
    type: SCHEMA.RendererType;
    desc?: TypedElementDesc;
}

/*
 * ElementManager for renderer life cycle.
 *
 * A newly created element only get a type without desc assigned.
 * updateDesc is not allowed to change the element type.
 */
export class ElementManager {
    private _elements: Map<SCHEMA.TYPES.Integer, ElementRecord> = new Map();

    create(id: SCHEMA.TYPES.Integer, type: SCHEMA.RendererType): void {
        if (this._elements.has(id)) {
            throw new Error(`Element with id ${id} already exists`);
        }
        this._elements.set(id, { type });
    }

    destroy(id: SCHEMA.TYPES.Integer): void {
        this._elements.delete(id);
    }

    getType(id: SCHEMA.TYPES.Integer): SCHEMA.RendererType | undefined {
        const element = this._elements.get(id);
        return element?.type;
    }

    getDesc(id: SCHEMA.TYPES.Integer): TypedElementDesc | undefined {
        const element = this._elements.get(id);
        return element?.desc;
    }

    updateDesc(id: SCHEMA.TYPES.Integer, desc: TypedElementDesc): void {
        const element = this._elements.get(id);
        if (element === undefined) {
            throw new Error(`Element with id ${id} does not exist`);
        }
        if (element.type !== desc.type) {
            throw new Error(`Element type mismatch: expected ${element.type}, got ${desc.type}`);
        }
        element.desc = desc;
    }
}
