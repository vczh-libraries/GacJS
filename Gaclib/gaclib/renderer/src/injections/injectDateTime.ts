import { InjectionDateTime } from '@gaclib/remote-protocol';

export function dateTimeFields(date: Date, utc: boolean): InjectionDateTime {
    return utc ? {
        year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(),
        hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds(), milliseconds: date.getUTCMilliseconds(),
    } : {
        year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(),
        hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(), milliseconds: date.getMilliseconds(),
    };
}

export function injectLocalToUtc(value: InjectionDateTime): InjectionDateTime {
    const date = new Date(0);
    date.setFullYear(value.year, value.month - 1, value.day);
    date.setHours(value.hour, value.minute, value.second, value.milliseconds);
    return dateTimeFields(date, true);
}

export function injectUtcToLocal(value: InjectionDateTime): InjectionDateTime {
    const date = new Date(0);
    date.setUTCFullYear(value.year, value.month - 1, value.day);
    date.setUTCHours(value.hour, value.minute, value.second, value.milliseconds);
    return dateTimeFields(date, false);
}
