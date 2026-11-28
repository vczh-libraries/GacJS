import * as SCHEMA from '@gaclib/remote-protocol';
import { IVirtualDom } from './dom/virtualDom';
import { VirtualDomRecord } from './dom/virtualDomBuilding';
import { getExtraBorder, getParagraphLayout, ParagraphLayout } from './domRenderer/elementStyles';
import { TextInputOptions, TextInputState, VirtualKeyboardController } from './interfaces';

type Modifiers = Omit<SCHEMA.IOCharInfo, 'code'>;
const noModifiers: Modifiers = { ctrl: false, shift: false, alt: false, osSuper: false, capslock: false };
const editingKeys = { Backspace: SCHEMA.TYPES.Key.KEY_BACK, Delete: SCHEMA.TYPES.Key.KEY_DELETE, Enter: SCHEMA.TYPES.Key.KEY_RETURN, Paste: SCHEMA.TYPES.Key.KEY_V };
const captureGuards = '\u200b\u200b';

export function sendCommittedText(events: SCHEMA.IRemoteProtocolEvents, text: string, modifiers: Modifiers): void {
    for (const code of text.split('')) events.OnIOChar({ code, ...modifiers });
}

interface EditContextLike extends EventTarget {
    readonly text: string;
    readonly selectionStart: number;
    readonly selectionEnd: number;
    updateText(start: number, end: number, text: string): void;
    updateSelection(start: number, end: number): void;
    updateControlBounds(bounds: DOMRect): void;
    updateSelectionBounds(bounds: DOMRect): void;
    updateCharacterBounds(start: number, bounds: DOMRect[]): void;
}
interface TextUpdate extends Event {
    updateRangeStart: number;
    updateRangeEnd: number;
    text: string;
    selectionStart: number;
    selectionEnd: number;
}
interface InputHost extends HTMLElement { editContext?: EditContextLike | null; virtualKeyboardPolicy?: string }
interface Boundary { id: number; host: InputHost; focused: boolean; editable: boolean }
interface Paragraph { element: HTMLElement; text: HTMLElement; layout: ParagraphLayout }
interface Composition { text: string; paragraph?: HTMLElement }
interface Session {
    boundary: Boundary;
    generation: number;
    adapter: 'edit-context' | 'contenteditable';
    pending: boolean;
    queue: Array<() => void>;
    cleanup: Array<() => void>;
    composition: Composition | null;
    context?: EditContextLike;
    buffer: string;
    selectionStart: number;
    selectionEnd: number;
    dirty: boolean;
    ordinary: { text: string | null; handled: boolean; before: string } | null;
    manual: boolean;
}

/** Core remains the sole text/selection model. This owns only browser capture transactions. */
export class TextInputCoordinator {
    private boundaries = new Map<number, Boundary>();
    private prepared = new Map<HTMLElement, Map<string, string | null>>();
    private contexts = new Map<InputHost, EditContextLike | null>();
    private session: Session | null = null;
    private desiredId: number | null = null;
    private generation = 0;
    private stopped = false;
    private suspended = false;
    private modifiers: Modifiers = { ...noModifiers };
    private physical = new Set<string>();
    private trace: string[] = [];
    private keyboard: VirtualKeyboardController | null;
    private style: HTMLStyleElement;
    private gesture: { id: number; x: number; y: number; time: number; boundary: Boundary | null; canceled: boolean } | null = null;
    private nativeCaret = { x: 0, y: 0 };
    private constructorEC = (globalThis as typeof globalThis & { EditContext?: new () => EditContextLike }).EditContext;

    constructor(
        private target: HTMLElement,
        private options: TextInputOptions,
        private events: SCHEMA.IRemoteProtocolEvents,
        private restore: (host: HTMLElement) => void,
        private releaseKeys: () => void,
        private sharedClipboard: () => boolean = () => false
    ) {
        this.keyboard = options.virtualKeyboard !== undefined ? options.virtualKeyboard :
            (navigator as Navigator & { virtualKeyboard?: VirtualKeyboardController }).virtualKeyboard ?? null;
        this.style = document.createElement('style');
        this.style.textContent = '[data-gacui-input] { caret-color:transparent!important; outline:none!important; }' +
            '[data-gacui-input] * { caret-color:transparent!important; }' +
            '[data-gacui-preedit]::after { content:attr(data-gacui-preedit); position:absolute; pointer-events:none;' +
            'left:var(--gacui-ime-x); top:var(--gacui-ime-y); font:var(--gacui-ime-font); white-space:pre;' +
            'color:var(--gacui-ime-color); text-decoration:var(--gacui-ime-decoration,underline); z-index:2147483647; }';
        document.head.append(this.style);
        window.addEventListener('blur', this.onWindowBlur);
        document.addEventListener('focusin', this.onFocus);
        window.visualViewport?.addEventListener('resize', this.updateBounds);
        window.visualViewport?.addEventListener('scroll', this.updateBounds);
        window.addEventListener('scroll', this.updateBounds, true);
        this.keyboard?.addEventListener('geometrychange', this.updateBounds);
    }

    get state(): TextInputState {
        const host = this.session?.boundary.host ?? this.target;
        const vk = isSecureContext && this.keyboard !== null && typeof this.keyboard.show === 'function' &&
            typeof this.keyboard.hide === 'function' && 'virtualKeyboardPolicy' in host;
        return {
            adapter: this.session?.adapter ?? 'legacy', activeId: this.session?.boundary.id ?? null,
            desiredId: this.desiredId, pending: this.session?.pending ?? false,
            composing: this.session?.composition !== null && this.session?.composition !== undefined,
            generation: this.generation,
            capabilities: {
                editContext: typeof this.constructorEC === 'function' && 'editContext' in HTMLElement.prototype,
                contenteditable: 'contentEditable' in host,
                beforeinput: 'onbeforeinput' in host && typeof InputEvent === 'function',
                virtualKeyboard: vk, geometry: this.keyboard?.boundingRect !== undefined,
                // The VK specification requires a contenteditable editing host. An exposed
                // EditContext + VK pair alone does not establish manual-show eligibility.
                manualEligible: vk && this.session?.adapter === 'contenteditable'
            }, events: [...this.trace]
        };
    }

    private record(name: string): void {
        this.trace.push(name);
        if (this.trace.length > 80) this.trace.shift();
    }

    private remember(host: HTMLElement, name: string, value: string): void {
        let saved = this.prepared.get(host);
        if (saved === undefined) { saved = new Map(); this.prepared.set(host, saved); }
        if (!saved.has(name)) saved.set(name, host.getAttribute(name));
        host.setAttribute(name, value);
    }

    private unprepare(host: HTMLElement): void {
        if (this.contexts.get(host) !== undefined && this.contexts.get(host) !== null) (host as InputHost).editContext = null;
        this.contexts.delete(host);
        for (const [name, value] of this.prepared.get(host) ?? []) {
            if (value === null) host.removeAttribute(name);
            else host.setAttribute(name, value);
        }
        this.prepared.delete(host);
    }

    private prepare(boundary: Boundary): void {
        const host = boundary.host;
        this.remember(host, 'tabindex', '-1');
        this.remember(host, 'data-gacui-input', String(boundary.id));
        this.remember(host, 'spellcheck', 'false');
        this.remember(host, 'autocorrect', 'off');
        this.remember(host, 'autocapitalize', 'off');
        this.remember(host, 'inputmode', 'text');
        if (!this.contexts.has(host) && this.options.adapter !== 'legacy') {
            const context = this.createContext(host);
            this.contexts.set(host, context ?? null);
            if (context !== undefined) this.remember(host, 'contenteditable', 'false');
            else if ('contentEditable' in host && 'onbeforeinput' in host && typeof InputEvent === 'function') {
                this.remember(host, 'contenteditable', 'plaintext-only');
                if (host.contentEditable !== 'plaintext-only') host.contentEditable = 'true';
            }
        }
    }

    /** Validate the recovered tree, including nodes untouched by a diff. */
    reconcile(record: VirtualDomRecord, completed = false): void {
        if (this.stopped) return;
        const next = new Map<number, Boundary>();
        const visit = (node: IVirtualDom, visible: boolean): void => {
            const area = node.props.validArea ?? node.props.globalBounds;
            visible = visible && (node.id === -1 || area.x2 > area.x1 && area.y2 > area.y1);
            const attribute = node.props.editableAttribute;
            if (visible && attribute !== undefined && attribute !== null && 'htmlElement' in node) {
                const id = node.id === -2 ? node.parent!.id : node.id;
                next.set(id, { id, host: node.htmlElement as InputHost, ...attribute });
            }
            for (const child of node.children) visit(child, visible);
        };
        visit(record.screen, true);
        const focused = [...next.values()].filter(boundary => boundary.focused);
        if (focused.length > 1) {
            this.stop();
            throw new Error(`Multiple focused editing boundaries: ${focused.map(boundary => boundary.id).join(', ')}`);
        }
        const desired = focused[0]?.editable === true ? focused[0].id : null;
        if (desired !== this.desiredId) this.suspended = false;
        this.desiredId = desired;
        const old = this.session;
        if (old !== null) {
            const current = next.get(old.boundary.id);
            if (current === undefined || !current.editable || current.host !== old.boundary.host ||
                !old.pending && current.id !== this.desiredId) this.end();
        }
        for (const host of this.prepared.keys()) {
            if (![...next.values()].some(boundary => boundary.host === host && boundary.editable)) this.unprepare(host);
        }
        this.boundaries = next;
        for (const boundary of next.values()) if (boundary.editable) this.prepare(boundary);
        if (this.session?.pending === true) {
            if (completed) {
                if (this.session.boundary.id === this.desiredId) {
                    this.session.pending = false;
                    const queue = this.session.queue.splice(0);
                    for (const action of queue) action();
                } else this.end();
            }
        }
        if (this.session === null && this.desiredId !== null && !this.suspended) this.activate(next.get(this.desiredId)!, false);
        if (this.session?.composition === null) this.syncSelection();
        this.updateBounds();
    }

    private alive(session: Session): boolean { return !this.stopped && this.session === session && session.generation === this.generation; }

    private listen(session: Session, target: EventTarget, name: string, handler: (event: Event) => void): void {
        const listener = (event: Event): void => {
            if (!this.alive(session)) return;
            this.record(`${name}:${event instanceof InputEvent ? event.inputType : ''}`);
            handler(event);
        };
        target.addEventListener(name, listener);
        session.cleanup.push(() => target.removeEventListener(name, listener));
    }

    private createContext(host: InputHost): EditContextLike | undefined {
        if (this.options.adapter === 'contenteditable' || this.options.adapter === 'legacy' ||
            typeof this.constructorEC !== 'function' || !('editContext' in HTMLElement.prototype)) return undefined;
        try {
            const context = new this.constructorEC();
            for (const name of ['updateText', 'updateSelection', 'updateControlBounds', 'updateSelectionBounds', 'updateCharacterBounds'] as const) {
                if (typeof context[name] !== 'function') return undefined;
            }
            host.editContext = context;
            return context;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'NotSupportedError') return undefined;
            throw error;
        }
    }

    private activate(boundary: Boundary, pending: boolean): void {
        if (this.stopped || this.options.adapter === 'legacy') return;
        if (this.session?.boundary.host === boundary.host) return;
        this.end();
        const host = boundary.host;
        const context = this.contexts.get(host) ?? this.createContext(host);
        if (context === undefined && (!('contentEditable' in host) || !('onbeforeinput' in host) || typeof InputEvent !== 'function')) return;
        const session: Session = {
            boundary, generation: ++this.generation, adapter: context === undefined ? 'contenteditable' : 'edit-context',
            pending, queue: [], cleanup: [], composition: null, context, buffer: captureGuards, selectionStart: 1, selectionEnd: 1,
            dirty: false, ordinary: null, manual: false
        };
        this.session = session;
        if (context === undefined) {
            this.remember(host, 'contenteditable', 'plaintext-only');
            if (host.contentEditable !== 'plaintext-only') host.contentEditable = 'true';
        } else {
            this.remember(host, 'contenteditable', 'false');
            this.resetBuffer(session);
        }
        const compositionTarget = context ?? host;
        this.listen(session, compositionTarget, 'compositionstart', () => {
            this.releaseKeys();
            this.physical.clear();
            session.composition = { text: '', paragraph: this.caret()?.paragraph?.element };
            session.ordinary = null;
            if (session.adapter === 'contenteditable') for (const paragraph of this.paragraphs(host)) {
                paragraph.layout.browserComposition = paragraph.element === session.composition.paragraph;
            }
        });
        this.listen(session, compositionTarget, 'compositionend', event => {
            const composition = session.composition;
            if (composition === null) return;
            if (context === undefined) composition.text = (event as CompositionEvent).data;
            // The transaction stays open through the native event dispatch, so an
            // end-before-final-input order updates this transaction rather than adding one.
            queueMicrotask(() => {
                if (!this.alive(session) || session.composition !== composition) return;
                this.finishComposition(session, composition);
            });
        });
        if (context !== undefined) {
            this.listen(session, context, 'textupdate', event => this.textUpdate(session, event as TextUpdate));
            this.listen(session, context, 'characterboundsupdate', event => {
                const bounds = event as Event & { rangeStart: number; rangeEnd: number };
                const rectangles: DOMRect[] = [];
                for (let i = bounds.rangeStart; i < bounds.rangeEnd; i++) rectangles.push(this.characterRect(session, i));
                context.updateCharacterBounds(bounds.rangeStart, rectangles);
            });
            this.listen(session, context, 'textformatupdate', event => {
                const formats = (event as Event & { getTextFormats(): Array<{ underlineStyle: string; underlineThickness: string }> }).getTextFormats();
                host.style.setProperty('--gacui-ime-decoration', formats.some(format => format.underlineStyle !== 'none') ? 'underline' : 'none');
            });
        } else {
            this.listen(session, host, 'compositionupdate', event => {
                if (session.composition !== null) session.composition.text = (event as CompositionEvent).data;
            });
            this.listen(session, host, 'input', event => this.input(session, event as InputEvent));
        }
        this.listen(session, host, 'beforeinput', event => this.beforeInput(session, event as InputEvent));
        this.listen(session, host, 'paste', event => {
            const paste = event as ClipboardEvent;
            paste.preventDefault();
            if (session.composition !== null) return;
            if (this.sharedClipboard()) this.command(session, 'Paste');
            else this.commit(session, paste.clipboardData?.getData('text/plain') ?? '');
        });
        this.listen(session, host, 'drop', event => { event.preventDefault(); });
        host.focus({ preventScroll: true });
        this.syncSelection();
        this.updateBounds();
    }

    private finishComposition(session: Session, composition: Composition): void {
        session.composition = null;
        for (const paragraph of this.paragraphs(session.boundary.host)) paragraph.layout.browserComposition = false;
        this.clearPreedit(session);
        this.reconcileMutation(session);
        this.resetBuffer(session);
        this.commit(session, composition.text);
    }

    private resetBuffer(session: Session): void {
        if (session.context === undefined || session.composition !== null) return;
        session.context.updateText(0, session.context.text.length, captureGuards);
        session.context.updateSelection(1, 1);
        session.buffer = captureGuards;
        session.selectionStart = session.selectionEnd = 1;
    }

    private textUpdate(session: Session, event: TextUpdate): void {
        const { updateRangeStart: start, updateRangeEnd: end, text } = event;
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > session.buffer.length) throw new Error('Invalid EditContext replacement range.');
        const previous = session.buffer;
        session.buffer = previous.slice(0, start) + text + previous.slice(end);
        const { selectionStart, selectionEnd } = event;
        if (!Number.isInteger(selectionStart) || !Number.isInteger(selectionEnd) || selectionStart < 0 ||
            selectionEnd < selectionStart || selectionEnd > session.buffer.length) throw new Error('Invalid EditContext selection range.');
        session.selectionStart = selectionStart;
        session.selectionEnd = selectionEnd;
        if (session.composition !== null) {
            if (start < 1 || end > previous.length - 1 || selectionStart < 1 || selectionEnd > session.buffer.length - 1) { this.cancelComposition(); return; }
            session.composition.text = session.buffer.slice(1, -1);
            this.updateBounds();
            return;
        }
        if (start === 1 && end === previous.length - 1) this.commit(session, text);
        else if (text === '' && start === 0 && end === 1) this.command(session, 'Backspace');
        else if (text === '' && start === 1 && end === 2) this.command(session, 'Delete');
        else this.record('rejected:replacement-range');
        this.resetBuffer(session);
    }

    private beforeInput(session: Session, event: InputEvent): void {
        const type = event.inputType;
        if (type === 'insertFromPaste' && this.sharedClipboard()) {
            if (event.cancelable) event.preventDefault();
            session.ordinary = { text: null, handled: true, before: session.boundary.host.textContent ?? '' };
            return;
        }
        if (session.composition !== null || event.isComposing || type === 'insertCompositionText' || type === 'deleteCompositionText') {
            if (session.composition === null) return; // Late input from a canceled generation.
            if (event.data !== null) session.composition.text = event.data;
            session.dirty = session.adapter === 'contenteditable';
            return;
        }
        const command = type === 'deleteContentBackward' ? 'Backspace' : type === 'deleteContentForward' ? 'Delete' :
            type === 'insertParagraph' || type === 'insertLineBreak' ? 'Enter' : null;
        if (command !== null) {
            if (event.cancelable) event.preventDefault();
            this.command(session, command);
            session.ordinary = { text: null, handled: true, before: session.boundary.host.textContent ?? '' };
            return;
        }
        if (type === 'insertText' || type === 'insertFromPaste') {
            const ranges = event.getTargetRanges();
            if (ranges.some(range => range.startContainer !== range.endContainer || range.startOffset !== range.endOffset)) {
                if (event.cancelable) event.preventDefault();
                session.ordinary = { text: null, handled: true, before: session.boundary.host.textContent ?? '' };
                this.record('rejected:replacement-range');
                return;
            }
            const text = event.data ?? event.dataTransfer?.getData('text/plain') ?? '';
            session.ordinary = { text, handled: event.cancelable, before: session.boundary.host.textContent ?? '' };
            if (event.cancelable) { event.preventDefault(); this.commit(session, text); }
            return;
        }
        // No remote range-edit protocol exists. Never append a spelling/reconversion
        // replacement at an unrelated Core caret or permit formatting/drop mutations.
        if (event.cancelable) event.preventDefault();
        session.ordinary = { text: null, handled: true, before: session.boundary.host.textContent ?? '' };
        this.record(`rejected:${type}`);
    }

    private input(session: Session, event: InputEvent): void {
        session.dirty = true;
        if (session.composition !== null) {
            if (event.data !== null) session.composition.text = event.data;
            return;
        }
        const transaction = session.ordinary;
        session.ordinary = null;
        let text = transaction?.text ?? null;
        if (transaction !== null && !transaction.handled && text === '') {
            const current = session.boundary.host.textContent ?? '';
            let prefix = 0;
            while (prefix < transaction.before.length && current[prefix] === transaction.before[prefix]) prefix++;
            let suffix = 0;
            while (suffix < transaction.before.length - prefix && current[current.length - suffix - 1] === transaction.before[transaction.before.length - suffix - 1]) suffix++;
            text = current.slice(prefix, current.length - suffix);
        }
        this.reconcileMutation(session);
        if (transaction !== null && !transaction.handled && text !== null) this.commit(session, text);
    }

    private reconcileMutation(session: Session): void {
        if (!session.dirty) return;
        session.dirty = false;
        this.restore(session.boundary.host);
        this.syncSelection();
    }

    private commit(session: Session, text: string): void {
        if (text === '' || !this.alive(session)) return;
        const modifiers = { ...this.modifiers };
        const action = (): void => {
            if (!this.alive(session)) return;
            sendCommittedText(this.events, text, modifiers);
        };
        if (session.pending) session.queue.push(action); else action();
    }

    private command(session: Session, key: keyof typeof editingKeys): void {
        if (this.physical.has(key)) return;
        // A physical Ctrl+V already reached Core. A browser menu paste has no key event.
        if (key === 'Paste' && this.modifiers.ctrl && (this.physical.has('v') || this.physical.has('V'))) return;
        const modifiers = key === 'Paste' ? { ...noModifiers, ctrl: true } : { ...this.modifiers };
        const action = (): void => {
            if (!this.alive(session)) return;
            const info = { code: editingKeys[key], ...modifiers, autoRepeatKeyDown: false };
            this.events.OnIOKeyDown(info);
            if (key === 'Enter') this.events.OnIOChar({ code: '\r', ...modifiers });
            this.events.OnIOKeyUp(info);
        };
        if (session.pending) session.queue.push(action); else action();
    }

    /** Returns true only for keys owned by an IME. Browser defaults stay enabled. */
    keyDown(event: KeyboardEvent): boolean {
        if (this.stopped) return true;
        this.modifiers = { ctrl: event.ctrlKey, shift: event.shiftKey, alt: event.altKey, osSuper: event.metaKey, capslock: event.getModifierState('CapsLock') };
        if (this.session === null) return false;
        if (event.isComposing || event.keyCode === 229 || event.key === 'Process' || this.session.composition !== null) return true;
        this.physical.add(event.key);
        return false;
    }

    keyUp(event: KeyboardEvent): boolean {
        this.physical.delete(event.key);
        this.modifiers = { ctrl: event.ctrlKey, shift: event.shiftKey, alt: event.altKey, osSuper: event.metaKey, capslock: event.getModifierState('CapsLock') };
        return this.session !== null && (event.isComposing || event.keyCode === 229 || event.key === 'Process' || this.session.composition !== null);
    }

    get active(): boolean { return this.session !== null; }
    get composing(): boolean { return this.session?.composition !== null && this.session?.composition !== undefined; }

    private hit(event: MouseEvent): Boundary | null {
        const hit = event.target;
        if (!(hit instanceof Node)) return null;
        const candidates = [...this.boundaries.values()].filter(boundary => boundary.editable && boundary.host.contains(hit));
        return candidates.find(boundary => !candidates.some(other => other !== boundary && boundary.host.contains(other.host))) ?? null;
    }

    mouseDown(event: MouseEvent): void {
        if (!event.isTrusted || event.button !== 0) return;
        const boundary = this.hit(event);
        if (boundary === null) { this.cancelComposition(); return; }
        this.suspended = false;
        this.activate(boundary, boundary.id !== this.desiredId);
        boundary.host.focus({ preventScroll: true });
        this.showKeyboard();
        // Native pointer selection is capture-only; Core receives the ordinary mouse event.
        event.preventDefault();
    }

    point(event: PointerEvent): void {
        if (event.pointerType !== 'touch' || !event.isTrusted) return;
        if (event.type === 'pointerdown') {
            if (this.gesture !== null) { this.gesture.canceled = true; return; }
            this.cancelComposition();
            this.gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, boundary: this.hit(event), canceled: false };
        } else if (this.gesture?.id === event.pointerId) {
            const gesture = this.gesture;
            if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) gesture.canceled = true;
            if (event.type === 'pointercancel' || event.type === 'lostpointercapture') this.gesture = null;
            if (event.type === 'pointerup') {
                this.gesture = null;
                if (!gesture.canceled && event.timeStamp - gesture.time < 500 && gesture.boundary !== null) {
                    this.suspended = false;
                    this.activate(gesture.boundary, gesture.boundary.id !== this.desiredId);
                    gesture.boundary.host.focus({ preventScroll: true });
                    this.showKeyboard();
                }
            }
        }
    }

    private showKeyboard(): void {
        const session = this.session;
        if (session === null || this.options.keyboardPolicy !== 'manual' || !this.state.capabilities.manualEligible) return;
        this.remember(session.boundary.host, 'virtualkeyboardpolicy', 'manual');
        session.manual = true;
        this.keyboard!.show();
    }

    private paragraphs(host: HTMLElement): Paragraph[] {
        const result: Paragraph[] = [];
        for (const element of [host, ...Array.from(host.querySelectorAll<HTMLElement>('div'))]) {
            const layout = getParagraphLayout(element);
            const text = getExtraBorder(element);
            if (layout !== undefined && text !== undefined) result.push({ element, text, layout });
        }
        return result;
    }

    private caret(): { paragraph?: Paragraph; rect: DOMRect; node: Node; offset: number; font: string; color: string } | null {
        const session = this.session;
        if (session === null) return null;
        const host = session.boundary.host;
        const paragraphs = this.paragraphs(host);
        const paragraph = paragraphs.find(value => value.layout.caret !== null) ?? paragraphs[0];
        let node: Node = host;
        let offset = 0;
        const screen = this.target.getBoundingClientRect();
        let rect = new DOMRect(screen.x + this.nativeCaret.x, screen.y + this.nativeCaret.y, 1, 16);
        if (paragraph !== undefined) {
            const { layout, text } = paragraph;
            const position = layout.caret?.caret ?? 0;
            const line = layout.lines.find(value => position >= value.start && position <= value.end) ?? layout.lines.at(-1)!;
            const block = line.blocks.find(value => value.text !== undefined && position >= value.start && position <= value.end);
            if (block?.text?.isConnected === true) { node = block.text; offset = Math.min(block.text.length, Math.max(0, position - block.start)); }
            else { node = line.element; offset = position >= line.end ? line.element.childNodes.length : 0; }
            const unit = layout.units.find(value => position >= value.start && position < value.end) ?? layout.units.at(-1);
            const textBounds = text.getBoundingClientRect();
            const baseline = unit === undefined ? { x: 0, y: layout.defaultFontSize } : position >= unit.end ? unit.backCaretBaseline : unit.frontCaretBaseline;
            const height = unit?.caretHeight ?? layout.defaultFontSize;
            rect = new DOMRect(textBounds.x + baseline.x, textBounds.y + baseline.y - height, 1, height);
        }
        const style = getComputedStyle(node instanceof Element ? node : node.parentElement!);
        return { paragraph, rect, node, offset, font: style.font, color: style.color };
    }

    private syncSelection(): void {
        const session = this.session;
        if (session === null || session.composition !== null || session.adapter !== 'contenteditable' || document.activeElement !== session.boundary.host) return;
        const caret = this.caret();
        if (caret !== null) document.getSelection()?.collapse(caret.node, caret.offset);
    }

    setCaret(point: SCHEMA.NativePoint): void {
        this.nativeCaret = { x: point.x.value, y: point.y.value };
        this.updateBounds();
    }

    updateBounds = (): void => {
        const session = this.session;
        const caret = this.caret();
        if (session === null || caret === null) return;
        session.context?.updateControlBounds(session.boundary.host.getBoundingClientRect());
        let selectionBounds = caret.rect;
        if (session.context !== undefined && session.composition !== null) {
            const start = this.characterRect(session, session.selectionStart);
            const end = this.characterRect(session, session.selectionEnd);
            selectionBounds = new DOMRect(start.x, start.y, Math.max(1, end.x - start.x), start.height);
        }
        session.context?.updateSelectionBounds(selectionBounds);
        if (session.composition !== null && session.context !== undefined) this.presentPreedit(session);
    };

    private characterRect(session: Session, offset: number): DOMRect {
        const caret = this.caret()!;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        context.font = caret.font;
        const text = session.composition?.text ?? '';
        const begin = context.measureText(text.slice(0, Math.max(0, offset - 1))).width;
        const end = context.measureText(text.slice(0, Math.max(0, offset))).width;
        return new DOMRect(caret.rect.x + begin, caret.rect.y, Math.max(1, end - begin), caret.rect.height);
    }

    private presentPreedit(session: Session): void {
        const caret = this.caret();
        if (caret === null) return;
        const host = session.boundary.host;
        const bounds = host.getBoundingClientRect();
        host.setAttribute('data-gacui-preedit', session.composition?.text ?? '');
        host.style.setProperty('--gacui-ime-x', `${caret.rect.x - bounds.x}px`);
        host.style.setProperty('--gacui-ime-y', `${caret.rect.y - bounds.y}px`);
        host.style.setProperty('--gacui-ime-font', caret.font);
        host.style.setProperty('--gacui-ime-color', caret.color);
    }

    private clearPreedit(session: Session): void {
        session.boundary.host.removeAttribute('data-gacui-preedit');
        for (const name of ['x', 'y', 'font', 'color', 'decoration']) session.boundary.host.style.removeProperty(`--gacui-ime-${name}`);
    }

    /** Called before an authoritative paragraph edit can invalidate captured offsets. */
    changing(element: HTMLElement, newCaret = false): void {
        const composition = this.session?.composition;
        if (composition !== undefined && composition !== null && this.session!.boundary.host.contains(element) &&
            (newCaret || composition.paragraph === undefined || composition.paragraph === element)) this.cancelComposition();
    }

    cancelComposition(): void {
        if (this.session?.composition === null || this.session === null) return;
        const boundary = this.session.boundary;
        const pending = this.session.pending;
        this.end();
        this.activate(boundary, pending);
    }

    private onWindowBlur = (): void => { this.suspended = true; this.releaseKeys(); this.end(); };
    private onFocus = (event: FocusEvent): void => {
        if (this.session !== null && event.target instanceof Node && !this.session.boundary.host.contains(event.target)) {
            this.suspended = true;
            this.releaseKeys();
            this.end();
        }
    };

    private end(): void {
        const session = this.session;
        if (session === null) return;
        this.session = null;
        this.generation++;
        this.releaseKeys();
        this.physical.clear();
        for (const cleanup of session.cleanup) cleanup();
        session.queue.length = 0;
        session.composition = null;
        for (const paragraph of this.paragraphs(session.boundary.host)) paragraph.layout.browserComposition = false;
        if (session.manual && document.activeElement === session.boundary.host) this.keyboard!.hide();
        if (session.context !== undefined) session.boundary.host.editContext = null;
        this.contexts.delete(session.boundary.host);
        this.clearPreedit(session);
        this.reconcileMutation(session);
        const saved = this.prepared.get(session.boundary.host);
        for (const name of ['contenteditable', 'virtualkeyboardpolicy']) {
            const value = saved?.get(name);
            if (value !== undefined) {
                if (value === null) session.boundary.host.removeAttribute(name); else session.boundary.host.setAttribute(name, value);
                saved!.delete(name);
            }
        }
    }

    stop(): void {
        if (this.stopped) return;
        this.end();
        this.stopped = true;
        this.desiredId = null;
        for (const host of this.prepared.keys()) this.unprepare(host);
        this.boundaries.clear();
        window.removeEventListener('blur', this.onWindowBlur);
        document.removeEventListener('focusin', this.onFocus);
        window.visualViewport?.removeEventListener('resize', this.updateBounds);
        window.visualViewport?.removeEventListener('scroll', this.updateBounds);
        window.removeEventListener('scroll', this.updateBounds, true);
        this.keyboard?.removeEventListener('geometrychange', this.updateBounds);
        this.style.remove();
    }
}
