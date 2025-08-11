import { Schema, Type } from './AST';

export function fixIndentation(code: string): string {
    // Break code into lines
    const lines = code.split('\n');

    const processedLines: string[] = [];

    for (const line of lines) {
        // Check if line is only spaces - if so, remove it
        if (line.trim() === '') {
            continue;
        }

        // Check if line begins with zero or more spaces followed by '|'
        const match = line.match(/^(\s*)\|(.*)$/);
        if (match) {
            // Remove the spaces before '|' and keep the content after '|'
            processedLines.push(match[2]);
        } else {
            // Line doesn't match the expected pattern, throw error
            throw new Error(`Invalid line format: "${line}". Expected line to be empty or start with spaces followed by '|'.`);
        }
    }

    // Join them back to a string
    return processedLines.join('\r\n');
}

export function collectClassNames(schema: Schema): string[] {
    const classNames: string[] = [];
    schema.declarations.forEach(decl => {
        if (decl['$ast'] === 'StructDecl' && decl.type === 'Class') {
            classNames.push(decl.name);
        }
    });
    return classNames;
}

export function refToString(element: string, classNames: string[]): string {
    return classNames.includes(element) ? `TYPES.Ptr<${element}>` : element;
}

export function typeToString(t: Type, classNames: string[]): string {
    switch (t['$ast']) {
        case 'PrimitiveType':
            return `TYPES.${t.type}`;
        case 'ReferenceType':
            return refToString(t.name, classNames);
        case 'OptionalType':
            return `TYPES.Nullable<${typeToString(t.element, classNames)}>`;
        case 'ArrayType':
            return `TYPES.List<${typeToString(t.element, classNames)}>`;
        case 'ArrayMapType':
            return `TYPES.ArrayMap<${refToString(t.element, classNames)}, '${t.keyField}'>`;
        case 'MapType':
            return `TYPES.Dictionary<${typeToString(t.keyType, classNames)}, ${typeToString(t.element, classNames)}>`;
        default:
            throw new Error(`Unknown type: ${t['$ast']}`);
    }
}
