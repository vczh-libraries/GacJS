export function quoteTypeScriptString(value: string): string {
    let content = '';
    for (const character of value) {
        switch (character) {
            case '\\': content += '\\\\'; break;
            case "'": content += "\\'"; break;
            case '\b': content += '\\b'; break;
            case '\f': content += '\\f'; break;
            case '\n': content += '\\n'; break;
            case '\r': content += '\\r'; break;
            case '\t': content += '\\t'; break;
            case '\u2028': content += '\\u2028'; break;
            case '\u2029': content += '\\u2029'; break;
            default: {
                const code = character.codePointAt(0)!;
                content += code < 0x20 ? `\\u${code.toString(16).padStart(4, '0')}` : character;
                break;
            }
        }
    }
    return `'${content}'`;
}
