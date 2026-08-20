import {
    AttributeAst,
    CollectionKind,
    ContractAst,
    EnumAst,
    EventAst,
    InterfaceAst,
    MethodAst,
    ParameterAst,
    PropertyAst,
    SourceLocation,
    StructAst,
    TypeAst,
    TypeDeclarationAst,
    WorkflowRpcDiagnostic,
} from './model.js';

type TokenKind = 'identifier' | 'string' | 'number' | 'punctuation' | 'eof';

interface Token {
    readonly kind: TokenKind;
    readonly text: string;
    readonly value?: string | number;
    readonly location: SourceLocation;
}

class Lexer {
    private offset = 0;
    private line = 1;
    private column = 1;

    constructor(private readonly path: string, private readonly text: string) {
        if (text.charCodeAt(0) === 0xFEFF) {
            this.offset = 1;
            this.column = 2;
        }
    }

    private location(): SourceLocation {
        return { path: this.path, offset: this.offset, line: this.line, column: this.column };
    }

    private peek(delta = 0): string {
        return this.text[this.offset + delta] ?? '';
    }

    private take(): string {
        const value = this.peek();
        if (value === '') {
            return value;
        }
        this.offset++;
        if (value === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        return value;
    }

    private skipTrivia(): void {
        while (true) {
            while (/\s/u.test(this.peek())) {
                this.take();
            }
            if (this.peek() === '/' && this.peek(1) === '/') {
                while (this.peek() !== '' && this.take() !== '\n') {
                    // Skip a line comment.
                }
                continue;
            }
            if (this.peek() === '/' && this.peek(1) === '*') {
                const start = this.location();
                this.take();
                this.take();
                while (!(this.peek() === '*' && this.peek(1) === '/')) {
                    if (this.peek() === '') {
                        throw new WorkflowRpcDiagnostic('Unterminated block comment.', start);
                    }
                    this.take();
                }
                this.take();
                this.take();
                continue;
            }
            return;
        }
    }

    next(): Token {
        this.skipTrivia();
        const location = this.location();
        const first = this.peek();
        if (first === '') {
            return { kind: 'eof', text: '', location };
        }
        if (/[_\p{L}]/u.test(first)) {
            let text = '';
            while (/[_\p{L}\p{N}]/u.test(this.peek())) {
                text += this.take();
            }
            return { kind: 'identifier', text, value: text, location };
        }
        if (first === '-' || /\d/u.test(first)) {
            let text = '';
            if (first === '-') {
                text += this.take();
            }
            while (/\d/u.test(this.peek())) {
                text += this.take();
            }
            const value = Number(text);
            if (!Number.isSafeInteger(value)) {
                throw new WorkflowRpcDiagnostic(`Integer literal is not safe: ${text}`, location);
            }
            return { kind: 'number', text, value, location };
        }
        if (first === '"') {
            let raw = this.take();
            while (true) {
                const value = this.peek();
                if (value === '' || value === '\n' || value === '\r') {
                    throw new WorkflowRpcDiagnostic('Unterminated string literal.', location);
                }
                raw += this.take();
                if (value === '"') {
                    break;
                }
                if (value === '\\') {
                    if (this.peek() === '') {
                        throw new WorkflowRpcDiagnostic('Unterminated string escape.', location);
                    }
                    raw += this.take();
                }
            }
            let value: unknown;
            try {
                value = JSON.parse(raw) as unknown;
            } catch {
                throw new WorkflowRpcDiagnostic('Invalid string literal.', location);
            }
            if (typeof value !== 'string') {
                throw new WorkflowRpcDiagnostic('Invalid string literal.', location);
            }
            return { kind: 'string', text: raw, value, location };
        }
        if (first === ':' && this.peek(1) === ':') {
            this.take();
            this.take();
            return { kind: 'punctuation', text: '::', location };
        }
        if ('@():;{},[]=<>?^'.includes(first)) {
            this.take();
            return { kind: 'punctuation', text: first, location };
        }
        throw new WorkflowRpcDiagnostic(`Unexpected character ${JSON.stringify(first)}.`, location);
    }
}

class Parser {
    private readonly lexer: Lexer;
    private lookahead: Token;
    private lookahead2: Token;
    private readonly declarations: TypeDeclarationAst[] = [];

    constructor(path: string, text: string) {
        this.lexer = new Lexer(path, text);
        this.lookahead = this.lexer.next();
        this.lookahead2 = this.lexer.next();
    }

    parse(): ContractAst {
        this.expect('module');
        const moduleName = this.identifier().text;
        this.expect(';');
        while (!this.at('eof')) {
            this.parseDeclaration([]);
        }
        return { moduleName, declarations: this.declarations };
    }

    private at(text: string): boolean {
        return text === 'eof' ? this.lookahead.kind === 'eof' : this.lookahead.text === text;
    }

    private take(): Token {
        const token = this.lookahead;
        this.lookahead = this.lookahead2;
        this.lookahead2 = this.lexer.next();
        return token;
    }

    private expect(text: string): Token {
        if (!this.at(text)) {
            throw new WorkflowRpcDiagnostic(`Expected ${JSON.stringify(text)}, received ${JSON.stringify(this.lookahead.text)}.`, this.lookahead.location);
        }
        return this.take();
    }

    private identifier(): Token {
        if (this.lookahead.kind !== 'identifier') {
            throw new WorkflowRpcDiagnostic(`Expected an identifier, received ${JSON.stringify(this.lookahead.text)}.`, this.lookahead.location);
        }
        return this.take();
    }

    private escapedIdentifier(): Token {
        if (!this.at('<')) {
            return this.identifier();
        }
        const location = this.take().location;
        const name = this.identifier();
        this.expect('>');
        return { ...name, text: name.text, location };
    }

    private parseAttributes(): AttributeAst[] {
        const result: AttributeAst[] = [];
        while (this.at('@')) {
            const location = this.take().location;
            const category = this.identifier().text;
            this.expect(':');
            const name = `${category}:${this.identifier().text}`;
            const arguments_: (string | number)[] = [];
            if (this.at('(')) {
                this.take();
                if (!this.at(')')) {
                    while (true) {
                        const argument = this.take();
                        if (argument.kind !== 'string' && argument.kind !== 'number') {
                            throw new WorkflowRpcDiagnostic('Attribute arguments must be string or integer literals.', argument.location);
                        }
                        arguments_.push(argument.value as string | number);
                        if (!this.at(',')) {
                            break;
                        }
                        this.take();
                    }
                }
                this.expect(')');
            }
            result.push({ name, arguments: arguments_, location });
        }
        return result;
    }

    private parseDeclaration(namespace: readonly string[]): void {
        const attributes = this.parseAttributes();
        if (this.at('namespace')) {
            if (attributes.length > 0) {
                throw new WorkflowRpcDiagnostic('Namespaces cannot have RPC attributes.', attributes[0].location);
            }
            this.take();
            const name = this.identifier().text;
            this.expect('{');
            while (!this.at('}')) {
                this.parseDeclaration([...namespace, name]);
            }
            this.take();
            return;
        }
        let flags = false;
        if (this.at('flag')) {
            flags = true;
            this.take();
        }
        if (this.at('enum')) {
            this.declarations.push(this.parseEnum(namespace, flags));
            return;
        }
        if (flags) {
            throw new WorkflowRpcDiagnostic('Expected enum after flag.', this.lookahead.location);
        }
        if (this.at('struct')) {
            this.declarations.push(this.parseStruct(namespace));
            return;
        }
        if (this.at('interface')) {
            this.declarations.push(this.parseInterface(namespace, attributes));
            return;
        }
        throw new WorkflowRpcDiagnostic(`Unsupported normalized declaration ${JSON.stringify(this.lookahead.text)}.`, this.lookahead.location);
    }

    private fullName(namespace: readonly string[], name: string): string {
        return [...namespace, name].join('::');
    }

    private parseEnum(namespace: readonly string[], flags: boolean): EnumAst {
        const location = this.take().location;
        const name = this.identifier().text;
        this.expect('{');
        const items: { name: string; value: number; location: SourceLocation }[] = [];
        while (!this.at('}')) {
            const item = this.identifier();
            this.expect('=');
            const value = this.take();
            if (value.kind !== 'number') {
                throw new WorkflowRpcDiagnostic('An enum value must be an integer.', value.location);
            }
            items.push({ name: item.text, value: value.value as number, location: item.location });
            if (this.at(',')) {
                this.take();
            }
        }
        this.take();
        return { kind: 'enum', name, fullName: this.fullName(namespace, name), flags, items, location };
    }

    private parseStruct(namespace: readonly string[]): StructAst {
        const location = this.take().location;
        const name = this.identifier().text;
        this.expect('{');
        const fields: { name: string; type: TypeAst; location: SourceLocation }[] = [];
        while (!this.at('}')) {
            const attributes = this.parseAttributes();
            if (attributes.length > 0) {
                throw new WorkflowRpcDiagnostic('Struct fields cannot have RPC attributes.', attributes[0].location);
            }
            const field = this.escapedIdentifier();
            this.expect(':');
            fields.push({ name: field.text, type: this.parseType(namespace), location: field.location });
            this.expect(';');
        }
        this.take();
        return { kind: 'struct', name, fullName: this.fullName(namespace, name), fields, location };
    }

    private parseInterface(namespace: readonly string[], attributes: readonly AttributeAst[]): InterfaceAst {
        const location = this.take().location;
        const name = this.identifier().text;
        const bases: TypeAst[] = [];
        if (this.at(':')) {
            this.take();
            while (true) {
                bases.push(this.parseType(namespace, false));
                if (!this.at(',')) {
                    break;
                }
                this.take();
            }
        }
        this.expect('{');
        const methods: MethodAst[] = [];
        const events: EventAst[] = [];
        const properties: PropertyAst[] = [];
        while (!this.at('}')) {
            const memberAttributes = this.parseAttributes();
            if (this.at('func')) {
                methods.push(this.parseMethod(namespace, memberAttributes));
            } else if (this.at('event')) {
                events.push(this.parseEvent(namespace, memberAttributes));
            } else if (this.at('prop')) {
                properties.push(this.parseProperty(namespace, memberAttributes));
            } else {
                throw new WorkflowRpcDiagnostic(`Unsupported interface member ${JSON.stringify(this.lookahead.text)}.`, this.lookahead.location);
            }
        }
        this.take();
        return {
            kind: 'interface',
            name,
            fullName: this.fullName(namespace, name),
            bases,
            methods,
            events,
            properties,
            attributes,
            location,
        };
    }

    private parseMethod(namespace: readonly string[], attributes: readonly AttributeAst[]): MethodAst {
        const location = this.take().location;
        const name = this.escapedIdentifier().text;
        const parameters = this.parseNamedParameters(namespace);
        this.expect(':');
        this.expect('(');
        const result = this.parseType(namespace);
        this.expect(')');
        this.expect(';');
        return { kind: 'method', name, parameters, result, attributes, location };
    }

    private parseNamedParameters(namespace: readonly string[]): ParameterAst[] {
        this.expect('(');
        const parameters: ParameterAst[] = [];
        while (!this.at(')')) {
            const attributes = this.parseAttributes();
            const parameter = this.escapedIdentifier();
            this.expect(':');
            parameters.push({
                name: parameter.text,
                type: this.parseType(namespace),
                attributes,
                location: parameter.location,
            });
            if (!this.at(',')) {
                break;
            }
            this.take();
        }
        this.expect(')');
        return parameters;
    }

    private parseEvent(namespace: readonly string[], attributes: readonly AttributeAst[]): EventAst {
        const location = this.take().location;
        const name = this.escapedIdentifier().text;
        this.expect('(');
        const parameters: ParameterAst[] = [];
        while (!this.at(')')) {
            const parameterLocation = this.lookahead.location;
            const type = this.parseType(namespace);
            let parameterName = `argument${String(parameters.length + 1)}`;
            if (this.lookahead.kind === 'identifier') {
                parameterName = this.take().text;
            }
            parameters.push({ name: parameterName, type, attributes: [], location: parameterLocation });
            if (!this.at(',')) {
                break;
            }
            this.take();
        }
        this.expect(')');
        this.expect(';');
        return { kind: 'event', name, parameters, attributes, location };
    }

    private parseProperty(namespace: readonly string[], attributes: readonly AttributeAst[]): PropertyAst {
        const location = this.take().location;
        const name = this.escapedIdentifier().text;
        this.expect(':');
        const type = this.parseType(namespace);
        this.expect('{');
        const getter = this.escapedIdentifier().text;
        let setter: string | undefined;
        let changedEvent: string | undefined;
        if (this.at(',')) {
            this.take();
            setter = this.escapedIdentifier().text;
        }
        if (this.at(':')) {
            this.take();
            changedEvent = this.escapedIdentifier().text;
        }
        this.expect('}');
        if (this.at(';')) {
            this.take();
        }
        return { kind: 'property', name, type, getter, setter, changedEvent, attributes, location };
    }

    private parseType(namespace: readonly string[], allowEnumerable = true): TypeAst {
        const location = this.lookahead.location;
        const qualifiers: ('const' | 'observe')[] = [];
        while (this.at('const') || this.at('observe')) {
            qualifiers.push(this.take().text as 'const' | 'observe');
        }
        let absolute = false;
        if (this.at('::')) {
            absolute = true;
            this.take();
        }
        const parts = [this.identifier().text];
        while (this.at('::')) {
            this.take();
            parts.push(this.identifier().text);
        }
        const fullName = absolute ? parts.join('::') : [...namespace, ...parts].join('::');
        let result: TypeAst = { kind: 'named', fullName, interfaceReference: false, location };
        if (this.at('^')) {
            this.take();
            result = { ...result, interfaceReference: true };
        }
        if (this.at('?')) {
            this.take();
            result = { kind: 'nullable', item: result, location };
        }
        let collectionIndex = 0;
        while (this.at('[') || (allowEnumerable && this.at('{') && this.lookahead2.text === '}')) {
            const qualifier = qualifiers[collectionIndex];
            if (this.at('{')) {
                this.take();
                this.expect('}');
                result = { kind: 'collection', collectionKind: 'enumerable', item: result, location };
            } else {
                this.take();
                if (this.at(']')) {
                    this.take();
                    const collectionKind: CollectionKind = qualifier === 'observe'
                        ? 'observableList'
                        : qualifier === 'const'
                            ? 'readonlyList'
                            : 'list';
                    result = { kind: 'collection', collectionKind, item: result, location };
                } else {
                    const key = this.parseType(namespace);
                    this.expect(']');
                    result = {
                        kind: 'collection',
                        collectionKind: qualifier === 'const' ? 'readonlyDictionary' : 'dictionary',
                        item: result,
                        key,
                        location,
                    };
                }
            }
            collectionIndex++;
        }
        if (qualifiers.length > collectionIndex) {
            throw new WorkflowRpcDiagnostic(`${qualifiers[collectionIndex]} is only supported on a strongly typed collection.`, location);
        }
        return result;
    }
}

export function parseWorkflowRpcMetadata(path: string, text: string): ContractAst {
    return new Parser(path, text).parse();
}
