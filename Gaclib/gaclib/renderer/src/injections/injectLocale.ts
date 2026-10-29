import { InjectionLocaleOperation as Operation, InjectionLocaleRequest } from '@gaclib/remote-protocol';

// Intl does not enumerate its locale database. This is our advertised candidate
// list, filtered by this browser, plus the user's preferred languages.
const candidates = ['en-US', 'en-GB', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-BR', 'ru-RU', 'ar-SA', 'hi-IN', 'tr-TR'];

function localeName(name: string): string {
    return name === '' ? 'en-US' : Intl.getCanonicalLocales(name.replaceAll('_', '-'))[0];
}

function datePattern(locale: string, month: '2-digit' | 'long', day: boolean): string {
    const formatter = new Intl.DateTimeFormat(locale, {
        calendar: 'gregory', numberingSystem: 'latn', timeZone: 'UTC',
        year: 'numeric', month, ...(day ? { day: '2-digit' } : {}),
    });
    // Only the common formatter token subset is used. Textual literal words are
    // omitted: the portable Core formatter has no quoted-literal syntax.
    return formatter.formatToParts(new Date(Date.UTC(2001, 10, 23))).map(part => {
        switch (part.type) {
            case 'year': return 'yyyy';
            case 'month': return month === 'long' ? 'MMMM' : 'MM';
            case 'day': return 'dd';
            case 'literal': return part.value.replace(/[A-Za-z']/g, '');
            default: return '';
        }
    }).join('');
}

export function injectLocale(request: InjectionLocaleRequest): string[] {
    switch (request.operation) {
        case Operation.Invariant: return [''];
        case Operation.SystemDefault: return [new Intl.DateTimeFormat().resolvedOptions().locale];
        case Operation.UserDefault: return [localeName(navigator.language)];
        case Operation.Enumerate:
            return ['', ...Intl.DateTimeFormat.supportedLocalesOf([...new Set([...candidates, ...navigator.languages])])];
    }
    const locale = localeName(request.localeName);
    switch (request.operation) {
        case Operation.ShortDateFormats: return [datePattern(locale, '2-digit', true)];
        case Operation.LongDateFormats: return [datePattern(locale, 'long', true)];
        case Operation.YearMonthDateFormats: return [datePattern(locale, 'long', false)];
        // Core's portable 12-hour formatting differs at noon/midnight. The
        // common 24-hour patterns work consistently on all Core platforms.
        case Operation.LongTimeFormats: return ['HH:mm:ss'];
        case Operation.ShortTimeFormats: return ['HH:mm'];
        case Operation.ShortDayOfWeekName:
        case Operation.LongDayOfWeekName:
            if (request.index < 0 || request.index > 6) return [''];
            return [new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: request.operation === Operation.ShortDayOfWeekName ? 'short' : 'long' })
                .format(new Date(Date.UTC(2023, 0, 1 + request.index)))];
        case Operation.ShortMonthName:
        case Operation.LongMonthName:
            if (request.index < 1 || request.index > 12) return [''];
            return [new Intl.DateTimeFormat(locale, { calendar: 'gregory', timeZone: 'UTC', month: request.operation === Operation.ShortMonthName ? 'short' : 'long' })
                .format(new Date(Date.UTC(2023, request.index - 1, 1)))];
        case Operation.ToLower:
        case Operation.ToLinguisticLower: return [request.text.toLocaleLowerCase(locale)];
        case Operation.ToUpper:
        case Operation.ToLinguisticUpper: return [request.text.toLocaleUpperCase(locale)];
    }
}
