import { expect, test } from 'vitest';
import { coreOrigin, parseConnectionOptions, connectionOptionsUrl } from '../src/connectionOptions';

test('query defaults, presence, mixed case, and duplicate replacement preserve other URL fields', () => {
    const defaults = parseConnectionOptions('http://localhost/index.html');
    expect(defaults).toEqual({ rvmhost: false, remoteDT: false, remoteLocale: false, remoteFS: false, corehost: false, host: 'localhost' });
    const current = 'http://localhost/index.html?RVMHOST&REMOTEdt=false&remoteDT&RemoteLocale&REMOTeFS&CoreHost=MyHost&x=1#end';
    const options = parseConnectionOptions(current);
    expect(options).toEqual({ rvmhost: true, remoteDT: true, remoteLocale: true, remoteFS: true, corehost: true, host: 'MyHost' });
    const updated = connectionOptionsUrl(current, { ...options, remoteDT: false });
    expect(updated).toBe(connectionOptionsUrl(updated, { ...options, remoteDT: false }));
    const url = new URL(updated);
    expect(url.pathname).toBe('/index.html');
    expect(url.hash).toBe('#end');
    expect([...url.searchParams.entries()]).toEqual([['x', '1'], ['rvmhost', ''], ['remoteLocale', ''], ['remoteFS', ''], ['corehost', 'MyHost']]);
    expect(connectionOptionsUrl(updated, defaults)).toBe('http://localhost/index.html?x=1#end');
});

test('Core destinations accept DNS IPv4 and IPv6 while rejecting schemes paths and ports', () => {
    expect(coreOrigin('MyHost.Example')).toBe('http://MyHost.Example:8888');
    expect(coreOrigin('127.0.0.1')).toBe('http://127.0.0.1:8888');
    expect(coreOrigin('::1')).toBe('http://[::1]:8888');
    expect(coreOrigin('[2001:DB8::1]')).toBe('http://[2001:DB8::1]:8888');
    for (const host of ['', 'http://localhost', 'localhost:8888', 'localhost/a', 'a@b', '[localhost]', '::xyz', '1.2.3.999', 'a b', '-bad', 'a..b']) {
        expect(() => coreOrigin(host)).toThrow();
    }
});
