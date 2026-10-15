import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as SCHEMA from '@gaclib/remote-protocol';
import { ElementManager } from '../src/GacUIElementManager';
import { GacUIRendererImpl } from '../src/GacUIRendererImpl';
import { GacUIRawElement } from '../src/interfaces';
import { VirtualDomProviderMock } from './virtualDomMock';

class RawTestRenderer extends GacUIRendererImpl {
    start(responses: SCHEMA.IRemoteProtocolResponses, events: SCHEMA.IRemoteProtocolEvents): void {
        this._start(responses, events, new ElementManager(), new VirtualDomProviderMock(), {
            requestMeasureSolidLabel: () => {},
            requestImageMetadata: () => {},
            RequestRendererEndRendering: () => {}
        });
    }
}

function createRenderer(): RawTestRenderer {
    const target = Object.assign(new EventTarget(), { clientWidth: 500, clientHeight: 400 }) as unknown as HTMLElement;
    const renderer = new RawTestRenderer({
        target,
        isShortcutReservedForBrowser: () => false,
        suggestMinSize: () => {}
    });
    renderer.start({} as SCHEMA.IRemoteProtocolResponses, {} as SCHEMA.IRemoteProtocolEvents);
    return renderer;
}

function update(renderer: RawTestRenderer, id: number, rawId: string, data: string): void {
    const invocation: SCHEMA.ProtocolInvoking = {
        semantic: 'Message',
        name: 'RendererBeginRendering',
        arguments: {
            frameId: 1,
            updatedElements: [['ElementDesc_Raw', { id, rawId, data }]]
        }
    };
    SCHEMA.jsonToRequest(JSON.parse(JSON.stringify(invocation)) as SCHEMA.ProtocolInvoking, renderer.requests);
}

beforeEach(() => {
    vi.stubGlobal('document', {
        createElement: () => ({ style: {}, id: '' })
    });
    vi.stubGlobal('window', {
        getComputedStyle: () => ({ fontFamily: 'Arial' })
    });
    vi.stubGlobal('ResizeObserver', class {
        observe(): void {}
        disconnect(): void {}
    });
});

afterEach(() => vi.unstubAllGlobals());

describe('Raw element public lifecycle', () => {
    it('publishes immutable empty records before install and retains them through atomic hidden updates', () => {
        const renderer = createRenderer();
        expect(renderer.getRawElements()).toEqual([]);
        let installed: GacUIRawElement | undefined;
        const unlisten = renderer.rawElementInstalled(raw => {
            installed = raw;
            expect(renderer.getRawElements()).toEqual([raw]);
            expect(raw.id).toBe('');
            expect(raw.data).toBe('');
            expect(raw.element.id).toBe('');
        });
        renderer.requests.RequestRendererCreated([{ id: 1, type: SCHEMA.RendererType.Raw }]);
        const raw = renderer.getRawElements()[0];
        const div = raw.element;
        expect(raw).toBe(installed);
        expect(Object.isFrozen(raw)).toBe(true);
        expect(Object.isFrozen(renderer.getRawElements())).toBe(true);
        unlisten();

        const updates: string[][] = [];
        renderer.rawElementUpdated(current => {
            expect(current).toBe(raw);
            expect(current.element).toBe(div);
            expect(renderer.getRawElements()[0]).toBe(current);
            updates.push([current.id, current.data]);
        });
        // No RenderingDom references this element throughout these descriptors.
        update(renderer, 1, '', '');
        update(renderer, 1, 'clock', '12:34:56');
        update(renderer, 1, 'clock', '12:34:56');
        update(renderer, 1, 'renamed', '12:34:56');
        update(renderer, 1, 'renamed', '中文 ⏰ 😀');
        update(renderer, 1, '', '中文 ⏰ 😀');
        update(renderer, 1, '', '');
        expect(updates).toEqual([
            ['clock', '12:34:56'], ['renamed', '12:34:56'],
            ['renamed', '中文 ⏰ 😀'], ['', '中文 ⏰ 😀'], ['', '']
        ]);
        expect(raw.element.id).toBe('');
        renderer.stop();
    });

    it('keeps duplicate string IDs separate and supports late enumeration and independent subscriptions', () => {
        const renderer = createRenderer();
        const installed = vi.fn();
        const otherInstalled = vi.fn();
        const unsubscribe = renderer.rawElementInstalled(installed);
        renderer.rawElementInstalled(otherInstalled);
        renderer.requests.RequestRendererCreated([
            { id: 1, type: SCHEMA.RendererType.Raw },
            { id: 2, type: SCHEMA.RendererType.Raw }
        ]);
        const [first, second] = renderer.getRawElements();
        expect(first).not.toBe(second);
        expect(first.element).not.toBe(second.element);
        expect(first.id).toBe(second.id);
        update(renderer, 1, 'same', 'first');
        update(renderer, 2, 'same', 'second');
        expect(renderer.getRawElements().map(raw => [raw.id, raw.data])).toEqual([
            ['same', 'first'], ['same', 'second']
        ]);
        expect(() => renderer.requests.RequestRendererCreated([{ id: 1, type: SCHEMA.RendererType.Raw }])).toThrow('already exists');
        expect(installed).toHaveBeenCalledTimes(2);
        unsubscribe();
        unsubscribe();
        renderer.requests.RequestRendererCreated([{ id: 3, type: SCHEMA.RendererType.Raw }]);
        expect(installed).toHaveBeenCalledTimes(2);
        expect(otherInstalled).toHaveBeenCalledTimes(3);

        const updated = vi.fn();
        const otherUpdated = vi.fn();
        const unsubscribeUpdated = renderer.rawElementUpdated(updated);
        renderer.rawElementUpdated(otherUpdated);
        update(renderer, 3, 'same', 'third');
        unsubscribeUpdated();
        update(renderer, 3, 'same', 'changed');
        expect(updated).toHaveBeenCalledTimes(1);
        expect(otherUpdated).toHaveBeenCalledTimes(2);
        renderer.stop();
    });

    it('notifies before removal, creates a new record on numeric ID reuse, and retains records on stop', () => {
        const renderer = createRenderer();
        renderer.requests.RequestRendererCreated([{ id: 1, type: SCHEMA.RendererType.Raw }]);
        update(renderer, 1, 'old', 'picture');
        const old = renderer.getRawElements()[0];
        const removed: GacUIRawElement[] = [];
        const unsubscribe = renderer.rawElementUninstalled(raw => {
            expect(renderer.getRawElements()).toContain(raw);
            removed.push(raw);
        });
        const otherRemoved = vi.fn();
        renderer.rawElementUninstalled(otherRemoved);
        renderer.requests.RequestRendererDestroyed([1]);
        expect(removed).toEqual([old]);
        expect(renderer.getRawElements()).toEqual([]);
        renderer.requests.RequestRendererCreated([{ id: 1, type: SCHEMA.RendererType.Raw }]);
        const replacement = renderer.getRawElements()[0];
        expect(replacement).not.toBe(old);
        expect(replacement.element).not.toBe(old.element);
        expect(replacement.id).toBe('');
        expect(replacement.data).toBe('');
        expect(old.id).toBe('old');
        expect(old.data).toBe('picture');
        unsubscribe();
        renderer.requests.RequestRendererDestroyed([1]);
        expect(removed).toEqual([old]);
        expect(otherRemoved).toHaveBeenCalledTimes(2);
        renderer.requests.RequestRendererCreated([{ id: 1, type: SCHEMA.RendererType.Raw }]);
        const retained = renderer.getRawElements()[0];
        renderer.stop();
        renderer.stop();
        expect(renderer.getRawElements()).toEqual([retained]);
        expect(otherRemoved).toHaveBeenCalledTimes(2);
    });
});
