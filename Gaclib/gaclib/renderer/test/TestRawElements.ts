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
    const target = Object.assign(new EventTarget(), { clientWidth: 500, clientHeight: 400, classList: { add() {}, remove() {} } }) as unknown as HTMLElement;
    const renderer = new RawTestRenderer({
        target,
        isShortcutReservedForBrowser: () => false,
        suggestMinSize: () => {}
    });
    renderer.start({} as SCHEMA.IRemoteProtocolResponses, {} as SCHEMA.IRemoteProtocolEvents);
    return renderer;
}

function update(renderer: RawTestRenderer, id: number, rawId: string, data: string, interpretor = ''): void {
    const invocation: SCHEMA.ProtocolInvoking = {
        semantic: 'Message',
        name: 'RendererBeginRendering',
        arguments: {
            frameId: 1,
            updatedElements: [['ElementDesc_Raw', { id, rawId, interpretor, data }]]
        }
    };
    SCHEMA.jsonToRequest(JSON.parse(JSON.stringify(invocation)) as SCHEMA.ProtocolInvoking, renderer.requests);
}

beforeEach(() => {
    vi.stubGlobal('document', {
        createElement: () => ({ style: {}, id: '', remove() {} }),
        head: { appendChild() {} },
        addEventListener() {},
        removeEventListener() {}
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
    it('owns independent factory instances, switches before updates, and cleans up exactly once', () => {
        const renderer = createRenderer();
        const calls: string[] = [];
        const create = (name: string) => vi.fn(() => {
            let subscription: { unsubscribe(): void };
            let raw: GacUIRawElement;
            return {
                initialize(element: GacUIRawElement): void {
                    raw = element;
                    calls.push(`initialize ${name}: ${raw.id}/${raw.interpretor}/${raw.data}`);
                    subscription = renderer.rawElementUpdated(updated => {
                        if (updated === raw) calls.push(`update ${name}: ${raw.data}`);
                    });
                },
                finalize(): void {
                    calls.push(`finalize ${name}: ${raw.id}`);
                    subscription.unsubscribe();
                },
            };
        });
        const first = { create: create('first') };
        const second = { create: create('second') };
        renderer.registerRawElementInterpretorFactory('first', first);
        renderer.registerRawElementInterpretorFactory('second', second);
        expect(renderer.getRawElementInterpretorFactory('first')).toBe(first);
        expect(renderer.getRawElementInterpretorFactory('missing')).toBeUndefined();
        expect(() => renderer.registerRawElementInterpretorFactory('first', second)).toThrow('already registered');
        expect(renderer.getRawElementInterpretorFactory('first')).toBe(first);
        renderer.requests.RequestRendererCreated([
            { id: 1, type: SCHEMA.RendererType.Raw }, { id: 2, type: SCHEMA.RendererType.Raw }
        ]);
        const manual = vi.fn();
        renderer.rawElementUpdated(manual);
        update(renderer, 1, '', 'initial', 'first');
        update(renderer, 1, '', 'initial', 'first');
        update(renderer, 2, '', 'other', 'first');
        expect(first.create).toHaveBeenCalledTimes(2);
        expect(first.create.mock.results[0].value).not.toBe(first.create.mock.results[1].value);
        update(renderer, 1, 'renamed', 'initial', 'first');
        update(renderer, 1, 'renamed', 'changed', 'first');
        expect(first.create).toHaveBeenCalledTimes(2);
        expect(calls).toEqual([
            'initialize first: /first/initial', 'update first: initial',
            'initialize first: /first/other', 'update first: other',
            'update first: initial', 'update first: changed'
        ]);
        calls.length = 0;
        update(renderer, 1, 'renamed', 'replacement', 'second');
        expect(calls).toEqual([
            'finalize first: renamed', 'initialize second: renamed/second/replacement', 'update second: replacement'
        ]);
        calls.length = 0;
        update(renderer, 1, 'renamed', 'replacement', 'missing');
        update(renderer, 1, 'renamed', 'manual');
        expect(calls).toEqual(['finalize second: renamed']);
        update(renderer, 1, 'renamed', 'again', 'first');
        update(renderer, 1, 'renamed', 'again');
        expect(calls.at(-1)).toBe('finalize first: renamed');
        const removed = vi.fn();
        renderer.rawElementUninstalled(removed);
        renderer.requests.RequestRendererDestroyed([2]);
        expect(calls.at(-1)).toBe('finalize first: ');
        expect(removed).toHaveBeenCalledTimes(1);
        update(renderer, 1, 'retained', 'last picture', 'second');
        calls.length = 0;
        renderer.stop();
        renderer.stop();
        expect(calls).toEqual(['finalize second: retained']);
        expect(removed).toHaveBeenCalledTimes(1);
        expect(renderer.getRawElements()).toHaveLength(1);
        expect(manual).toHaveBeenCalledTimes(10);
        renderer.requests.RequestRendererDestroyed([1]);
        expect(calls).toEqual(['finalize second: retained']);
    });

    it('keeps missing names and manual listeners without retrying on data or ID updates', () => {
        const renderer = createRenderer();
        const create = vi.fn(() => ({ initialize: vi.fn(), finalize: vi.fn() }));
        renderer.registerRawElementInterpretorFactory('', { create });
        renderer.requests.RequestRendererCreated([{ id: 1, type: SCHEMA.RendererType.Raw }]);
        const states: string[][] = [];
        renderer.rawElementUpdated(raw => { states.push([raw.id, raw.interpretor, raw.data]); });
        update(renderer, 1, 'manual', 'data');
        update(renderer, 1, 'manual', 'data', 'late');
        renderer.registerRawElementInterpretorFactory('late', { create });
        update(renderer, 1, 'manual', 'new data', 'late');
        update(renderer, 1, 'renamed', 'new data', 'late');
        expect(create).not.toHaveBeenCalled();
        expect(states).toEqual([
            ['manual', '', 'data'], ['manual', 'late', 'data'],
            ['manual', 'late', 'new data'], ['renamed', 'late', 'new data']
        ]);
        update(renderer, 1, 'renamed', 'new data');
        update(renderer, 1, 'renamed', 'new data', 'late');
        expect(create).toHaveBeenCalledTimes(1);
        renderer.stop();
    });

    it('publishes immutable empty records before install and retains them through atomic hidden updates', () => {
        const renderer = createRenderer();
        expect(renderer.getRawElements()).toEqual([]);
        let installed: GacUIRawElement | undefined;
        const unlisten = renderer.rawElementInstalled(raw => {
            installed = raw;
            expect(renderer.getRawElements()).toEqual([raw]);
            expect(raw.id).toBe('');
            expect(raw.interpretor).toBe('');
            expect(raw.data).toBe('');
            expect(raw.element.id).toBe('');
        });
        renderer.requests.RequestRendererCreated([{ id: 1, type: SCHEMA.RendererType.Raw }]);
        const raw = renderer.getRawElements()[0];
        const div = raw.element;
        expect(raw).toBe(installed);
        expect(Object.isFrozen(raw)).toBe(true);
        expect(Object.isFrozen(renderer.getRawElements())).toBe(true);
        unlisten.unsubscribe();

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
        unsubscribe.unsubscribe();
        unsubscribe.unsubscribe();
        renderer.requests.RequestRendererCreated([{ id: 3, type: SCHEMA.RendererType.Raw }]);
        expect(installed).toHaveBeenCalledTimes(2);
        expect(otherInstalled).toHaveBeenCalledTimes(3);

        const updated = vi.fn();
        const otherUpdated = vi.fn();
        const unsubscribeUpdated = renderer.rawElementUpdated(updated);
        renderer.rawElementUpdated(otherUpdated);
        update(renderer, 3, 'same', 'third');
        unsubscribeUpdated.unsubscribe();
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
        unsubscribe.unsubscribe();
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
