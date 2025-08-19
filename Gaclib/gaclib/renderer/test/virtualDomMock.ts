import * as SCHEMA from '@gaclib/remote-protocol';
import { TypedElementDesc } from '../src/GacUIElementManager';
import {
    IVirtualDom,
    IVirtualDomProvider,
    VirtualDomBaseRoot,
    VirtualDomBaseValidArea,
    VirtualDomBaseOrdinary,
    VirtualDomProperties
} from '../src/dom/virtualDom';

type VirtualDomMockTypes = VirtualDomMockRoot | VirtualDomMockValidArea | VirtualDomMockOrdinary;

class VirtualDomMockRoot extends VirtualDomBaseRoot<VirtualDomMockTypes> {
    protected getExpectedChildType(): string {
        return 'VirtualDomMockValidArea or VirtualDomMockOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomMockValidArea ||
            child instanceof VirtualDomMockOrdinary;
    }

    protected onUpdateChildren(children: VirtualDomMockTypes[]): void {

        void children;
        // Mock implementation - no additional logic needed
    }
}

class VirtualDomMockValidArea extends VirtualDomBaseValidArea<VirtualDomMockTypes> {
    constructor(
        id: SCHEMA.TYPES.Integer,
        validArea: SCHEMA.Rect
    ) {
        super(id, validArea);
    }

    protected getExpectedChildType(): string {
        return 'VirtualDomMockValidArea or VirtualDomMockOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomMockValidArea ||
            child instanceof VirtualDomMockOrdinary;
    }

    protected onUpdateChildren(children: VirtualDomMockTypes[]): void {
        void children;
        // Mock implementation - no additional logic needed
    }
}

class VirtualDomMockOrdinary extends VirtualDomBaseOrdinary<VirtualDomMockTypes> {
    constructor(
        id: SCHEMA.TYPES.Integer,
        props: VirtualDomProperties
    ) {
        super(id, props);
    }

    protected getExpectedChildType(): string {
        return 'VirtualDomMockValidArea or VirtualDomMockOrdinary';
    }

    protected isExpectedChildType(child: IVirtualDom): boolean {
        return child instanceof VirtualDomMockValidArea ||
            child instanceof VirtualDomMockOrdinary;
    }

    protected onUpdateTypedDesc(typedDesc: TypedElementDesc | undefined): void {
        void typedDesc;
        // Mock implementation - no additional logic needed
    }

    protected onUpdateChildren(children: VirtualDomMockTypes[]): void {
        void children;
        // Mock implementation - no additional logic needed
    }
}

export class VirtualDomProviderMock implements IVirtualDomProvider {
    createDom(
        id: SCHEMA.TYPES.Integer,
        props: VirtualDomProperties
    ): IVirtualDom {
        return new VirtualDomMockOrdinary(id, props);
    }

    createDomForRoot(): IVirtualDom {
        return new VirtualDomMockRoot();
    }

    createDomForValidArea(
        id: SCHEMA.TYPES.Integer,
        validArea: SCHEMA.Rect
    ): IVirtualDom {
        return new VirtualDomMockValidArea(id, validArea);
    }

    createSimpleDom(
        id: SCHEMA.TYPES.Integer,
        globalBounds: SCHEMA.Rect
    ): IVirtualDom {
        return new VirtualDomMockValidArea(id, globalBounds);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fixBounds(virtualDom: IVirtualDom, target: HTMLElement, width: number, height: number): void {
        throw new Error('Not Implemented');
    }
}
