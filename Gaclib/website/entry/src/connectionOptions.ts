export interface ConnectionOptions {
    rvmhost: boolean;
    remoteDT: boolean;
    remoteLocale: boolean;
    remoteFS: boolean;
    corehost: boolean;
    host: string;
}

const optionNames = ['rvmhost', 'remotedt', 'remotelocale', 'remotefs', 'corehost'];

export function coreOrigin(value: string): string {
    let host = value;
    if (host.startsWith('[') && host.endsWith(']')) {
        host = host.slice(1, -1);
        if (!host.includes(':')) throw new Error('Brackets are only valid for IPv6 Core hosts.');
    }
    if (host === '' || /[\s/\\?#@%[\]]/.test(host)) throw new Error('Core host must be a hostname or IP address without a scheme, path or port.');
    if (host.includes(':')) {
        // URL's IPv6 parser validates compression, groups and embedded IPv4.
        new URL(`http://[${host}]:8888`);
        return `http://[${host}]:8888`;
    }
    if (/^[0-9.]+$/.test(host)) {
        const parts = host.split('.');
        if (parts.length !== 4 || parts.some(part => !/^(0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255)) throw new Error('Invalid IPv4 Core host.');
    } else if (host.length > 253 || !host.replace(/\.$/, '').split('.').every(part => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(part))) {
        throw new Error('Invalid Core hostname.');
    }
    return `http://${host}:8888`;
}

export function parseConnectionOptions(url: string): ConnectionOptions {
    const values = new Map<string, string>();
    for (const [name, value] of new URL(url).searchParams) values.set(name.toLowerCase(), value);
    return {
        rvmhost: values.has('rvmhost'), remoteDT: values.has('remotedt'),
        remoteLocale: values.has('remotelocale'), remoteFS: values.has('remotefs'),
        corehost: values.has('corehost'), host: values.get('corehost') ?? 'localhost',
    };
}

export function connectionOptionsUrl(current: string, options: ConnectionOptions): string {
    const url = new URL(current);
    for (const name of [...url.searchParams.keys()]) if (optionNames.includes(name.toLowerCase())) url.searchParams.delete(name);
    for (const name of ['rvmhost', 'remoteDT', 'remoteLocale', 'remoteFS'] as const) if (options[name]) url.searchParams.set(name, '');
    if (options.corehost) {
        coreOrigin(options.host);
        url.searchParams.set('corehost', options.host);
    }
    return url.href;
}
