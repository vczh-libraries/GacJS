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
