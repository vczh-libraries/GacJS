import { describe, it, expect } from 'vitest';
import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementManager, TypedElementDesc } from '../src/GacUIElementManager';

describe('ElementManager', () => {
    it('should create an element with a unique id and type', () => {
        const manager = new ElementManager();
        const id = 1;
        const type = SCHEMA.RendererType.SolidBorder;

        manager.create(id, type);

        expect(manager.getType(id)).toBe(type);
        expect(manager.getDesc(id)).toBeUndefined();
    });

    it('should throw error when creating element with occupied id', () => {
        const manager = new ElementManager();
        const id = 1;
        const type = SCHEMA.RendererType.SolidBorder;

        manager.create(id, type);

        expect(() => manager.create(id, type)).toThrow('Element with id 1 already exists');
    });

    it('should destroy element and release the id', () => {
        const manager = new ElementManager();
        const id = 1;
        const type = SCHEMA.RendererType.SolidBorder;

        manager.create(id, type);
        expect(manager.getType(id)).toBe(type);

        manager.destroy(id);
        expect(manager.getType(id)).toBeUndefined();
        expect(manager.getDesc(id)).toBeUndefined();
    });

    it('should ignore destroy on non-existent id', () => {
        const manager = new ElementManager();

        // Should not throw
        expect(() => manager.destroy(999)).not.toThrow();
    });

    it('should return undefined for getType on non-existent id', () => {
        const manager = new ElementManager();

        expect(manager.getType(999)).toBeUndefined();
    });

    it('should return undefined for getDesc on non-existent id', () => {
        const manager = new ElementManager();

        expect(manager.getDesc(999)).toBeUndefined();
    });

    it('should return undefined for getDesc when updateDesc has not been called', () => {
        const manager = new ElementManager();
        const id = 1;
        const type = SCHEMA.RendererType.Raw;

        manager.create(id, type);

        expect(manager.getDesc(id)).toBeUndefined();
    });

    it('should update element desc with matching type', () => {
        const manager = new ElementManager();
        const id = 1;
        const type = SCHEMA.RendererType.SolidBorder;

        manager.create(id, type);

        const desc: TypedElementDesc = {
            type: SCHEMA.RendererType.SolidBorder,
            desc: {
                id: 1,
                borderColor: '#FF0000',
                shape: {
                    shapeType: SCHEMA.ElementShapeType.Rectangle,
                    radiusX: 0,
                    radiusY: 0
                }
            }
        };

        manager.updateDesc(id, desc);

        expect(manager.getDesc(id)).toEqual(desc);
    });

    it('should update element desc for Raw type', () => {
        const manager = new ElementManager();
        const id = 1;
        const type = SCHEMA.RendererType.Raw;

        manager.create(id, type);

        const desc: TypedElementDesc = {
            type: SCHEMA.RendererType.Raw
        };

        manager.updateDesc(id, desc);

        expect(manager.getDesc(id)).toEqual(desc);
    });

    it('should update element desc for FocusRectangle type', () => {
        const manager = new ElementManager();
        const id = 1;
        const type = SCHEMA.RendererType.FocusRectangle;

        manager.create(id, type);

        const desc: TypedElementDesc = {
            type: SCHEMA.RendererType.FocusRectangle
        };

        manager.updateDesc(id, desc);

        expect(manager.getDesc(id)).toEqual(desc);
    });

    it('should throw error when updateDesc is called on non-existent id', () => {
        const manager = new ElementManager();

        const desc: TypedElementDesc = {
            type: SCHEMA.RendererType.Raw
        };

        expect(() => manager.updateDesc(999, desc)).toThrow('Element with id 999 does not exist');
    });

    it('should throw error when updateDesc has mismatched type', () => {
        const manager = new ElementManager();
        const id = 1;
        const createdType = SCHEMA.RendererType.SolidBorder;

        manager.create(id, createdType);

        const desc: TypedElementDesc = {
            type: SCHEMA.RendererType.Raw  // Different type
        };

        expect(() => manager.updateDesc(id, desc)).toThrow('Element type mismatch: expected SolidBorder, got Raw');
    });

    it('should handle multiple elements independently', () => {
        const manager = new ElementManager();

        // Create multiple elements
        manager.create(1, SCHEMA.RendererType.SolidBorder);
        manager.create(2, SCHEMA.RendererType.Raw);
        manager.create(3, SCHEMA.RendererType.FocusRectangle);

        // Verify types
        expect(manager.getType(1)).toBe(SCHEMA.RendererType.SolidBorder);
        expect(manager.getType(2)).toBe(SCHEMA.RendererType.Raw);
        expect(manager.getType(3)).toBe(SCHEMA.RendererType.FocusRectangle);

        // Update descriptions
        const desc1: TypedElementDesc = {
            type: SCHEMA.RendererType.SolidBorder,
            desc: {
                id: 1,
                borderColor: '#FF0000',
                shape: {
                    shapeType: SCHEMA.ElementShapeType.Rectangle,
                    radiusX: 0,
                    radiusY: 0
                }
            }
        };

        const desc2: TypedElementDesc = {
            type: SCHEMA.RendererType.Raw
        };

        manager.updateDesc(1, desc1);
        manager.updateDesc(2, desc2);

        // Verify descriptions
        expect(manager.getDesc(1)).toEqual(desc1);
        expect(manager.getDesc(2)).toEqual(desc2);
        expect(manager.getDesc(3)).toBeUndefined(); // Not updated

        // Destroy one element
        manager.destroy(2);
        expect(manager.getType(1)).toBe(SCHEMA.RendererType.SolidBorder);
        expect(manager.getType(2)).toBeUndefined();
        expect(manager.getType(3)).toBe(SCHEMA.RendererType.FocusRectangle);
    });

    it('should allow reuse of id after destroy', () => {
        const manager = new ElementManager();
        const id = 1;

        // Create, destroy, and create again with same id
        manager.create(id, SCHEMA.RendererType.SolidBorder);
        manager.destroy(id);
        manager.create(id, SCHEMA.RendererType.Raw);

        expect(manager.getType(id)).toBe(SCHEMA.RendererType.Raw);
    });
});
