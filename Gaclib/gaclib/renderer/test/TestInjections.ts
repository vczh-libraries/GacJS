import type { InjectionClipboard } from '@gaclib/remote-protocol';
import { BrowserClipboard } from '../src/injections/injectClipboard';
import { expect, test, vi } from 'vitest';
import { injectLocalToUtc, injectUtcToLocal } from '../src/injections/injectDateTime';
import { injectLocale } from '../src/injections/injectLocale';
import { FileSystemInjection, injectFileSystem, normalizeOpfsPath } from '../src/injections/injectFileSystem';
import { InjectionFileOperation as FileOp, InjectionLocaleOperation as LocaleOp } from '@gaclib/remote-protocol';

test('DateTime preserves calendar fields and milliseconds across conversion', () => {
    for (const value of [
        { year: 2024, month: 1, day: 2, hour: 8, minute: 17, second: 42, milliseconds: 123 },
        { year: 2024, month: 7, day: 2, hour: 8, minute: 17, second: 42, milliseconds: 987 },
        { year: 42, month: 1, day: 2, hour: 8, minute: 17, second: 42, milliseconds: 0 },
    ]) expect(injectUtcToLocal(injectLocalToUtc(value))).toEqual(value);
});

test('Locale implements every operation and honors explicit locales outside enumeration', () => {
    vi.stubGlobal('navigator', { language: 'tr-TR', languages: ['tr-TR'] });
    try {
        const query = (operation: LocaleOp, text = '', index = 1, localeName = 'tr-TR'): string[] => injectLocale({ operation, text, index, localeName });
        for (const operation of Object.values(LocaleOp)) expect(query(operation).length).toBeGreaterThan(0);
        expect(query(LocaleOp.Invariant)).toEqual(['']);
        expect(query(LocaleOp.UserDefault)).toEqual(['tr-TR']);
        expect(query(LocaleOp.ToUpper, 'i')).toEqual(['İ']);
        expect(query(LocaleOp.ToLinguisticLower, 'I')).toEqual(['ı']);
        expect(query(LocaleOp.LongMonthName, '', 1, 'fr-FR')).toEqual(['janvier']);
        expect(query(LocaleOp.LongDayOfWeekName, '', 0, 'en-US')).toEqual(['Sunday']);
        expect(query(LocaleOp.LongMonthName, '', 1, 'pl-PL')).toEqual(['styczeń']);
        expect(query(LocaleOp.ShortDateFormats, '', 0, 'en-GB')[0]).toContain('yyyy');
    } finally { vi.unstubAllGlobals(); }
});

test('OPFS paths reject traversal and missing storage completes failures', async () => {
    expect(normalizeOpfsPath('a/./目录/../b')).toBe('/a/b');
    expect(normalizeOpfsPath('')).toBe('/');
    expect(() => normalizeOpfsPath('../a')).toThrow();
    expect(() => normalizeOpfsPath('/a/../../b')).toThrow();
    expect(() => normalizeOpfsPath('/a\0b')).toThrow();
    vi.stubGlobal('navigator', {});
    try {
        const request = { operation: FileOp.OpenRead, path: '/missing', target: '', content: null };
        expect((await injectFileSystem(request)).success).toBe(false);
        expect((await injectFileSystem({ ...request, operation: FileOp.Copy })).success).toBe(false);
        const queue = new FileSystemInjection();
        const responses: boolean[] = [];
        await new Promise<void>(resolve => {
            queue.request(request, result => responses.push(result.success), () => true);
            queue.request({ ...request, operation: FileOp.Initialize }, result => { responses.push(result.success); resolve(); }, () => true);
        });
        expect(responses).toEqual([false, true]);
        let active = true;
        queue.request(request, () => { throw new Error('Canceled operation responded.'); }, () => active);
        active = false;
        await Promise.resolve();
    } finally { vi.unstubAllGlobals(); }
});

test('an asynchronous filesystem completion cannot respond after its owner stops', async () => {
    let release!: () => void;
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    const pending = new Promise<FileSystemDirectoryHandle>((_resolve, reject) => {
        release = () => reject(new Error('Storage became unavailable.'));
    });
    vi.stubGlobal('navigator', { storage: { getDirectory: () => { started(); return pending; } } });
    try {
        let active = true;
        const respond = vi.fn();
        const queue = new FileSystemInjection();
        queue.request({ operation: FileOp.Files, path: '/', target: '', content: null }, respond, () => active);
        await ready;
        active = false;
        release();
        await new Promise<void>(resolve => {
            queue.request({ operation: FileOp.Initialize, path: '/', target: '', content: null }, () => resolve(), () => true);
        });
        expect(respond).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
});

test('clipboard observations preserve order, distinguish denied reads and discard a stopped session', async () => {
    const clipboard = Object.assign(new EventTarget(), { read: vi.fn(), write: vi.fn() });
    vi.stubGlobal('navigator', { clipboard });
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('ClipboardItem', class {});
    const read = (text: string) => [{ types: ['text/plain'], getType: () => Promise.resolve(new Blob([text])) }];
    let first!: (items: unknown) => void;
    const pending = new Promise(resolve => { first = resolve; });
    clipboard.read.mockReturnValueOnce(pending).mockResolvedValueOnce(read('second'));
    const values: InjectionClipboard[] = [];
    const service = new BrowserClipboard();
    try {
        service.start(value => values.push(value));
        clipboard.dispatchEvent(new Event('clipboardchange'));
        first(read(''));
        await vi.waitFor(() => expect(values.map(item => item.text)).toEqual(['', 'second']));
        clipboard.read.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError')).mockResolvedValueOnce([]);
        clipboard.dispatchEvent(new Event('clipboardchange'));
        clipboard.dispatchEvent(new Event('clipboardchange'));
        await vi.waitFor(() => expect(values).toHaveLength(3));
        expect(values[2]).toEqual({ text: null, document: null, image: null });
        clipboard.read.mockResolvedValueOnce(read('old session'));
        clipboard.dispatchEvent(new Event('clipboardchange'));
        service.stop();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(values).toHaveLength(3);
        const rejected = vi.fn();
        service.write({ text: 'ignored', document: null, image: null }, rejected);
        expect(rejected).toHaveBeenCalledWith(false);
        expect(clipboard.write).not.toHaveBeenCalled();
    } finally { service.stop(); vi.unstubAllGlobals(); }
});

test('clipboard resumes on a permission grant and a new owner does not wait for a stopped read', async () => {
    const permission = Object.assign(new EventTarget(), { state: 'denied' });
    const clipboard = Object.assign(new EventTarget(), { read: vi.fn(), write: vi.fn() });
    vi.stubGlobal('navigator', { clipboard, permissions: { query: () => Promise.resolve(permission) } });
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('ClipboardItem', class {});
    const read = (text: string) => [{ types: ['text/plain'], getType: () => Promise.resolve(new Blob([text])) }];
    const service = new BrowserClipboard();
    const first = vi.fn(), second = vi.fn();
    try {
        clipboard.read.mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce(read('granted'));
        service.start(first);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(first).not.toHaveBeenCalled();
        permission.state = 'granted';
        permission.dispatchEvent(new Event('change'));
        await vi.waitFor(() => expect(first).toHaveBeenCalledWith({ text: 'granted', document: null, image: null }));

        let finish!: (items: unknown) => void;
        clipboard.read.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
        clipboard.dispatchEvent(new Event('clipboardchange'));
        service.stop();
        clipboard.read.mockResolvedValueOnce(read('new owner'));
        service.start(second);
        await vi.waitFor(() => expect(second).toHaveBeenCalledWith({ text: 'new owner', document: null, image: null }));
        finish(read('old owner'));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    } finally { service.stop(); vi.unstubAllGlobals(); }
});
