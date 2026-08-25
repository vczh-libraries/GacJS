import * as fs from 'fs';
import * as path from 'path';
import { emitWorkflowRpcContract, GeneratedFile } from './emit.js';
import { ContractIr, WorkflowRpcDiagnostic } from './model.js';
import { parseWorkflowRpcMetadata } from './parser.js';
import { parseSchemaSymbols } from './schema.js';
import { validateWorkflowRpcContract } from './validate.js';

export interface WorkflowRpcGeneratorInput {
    readonly metadataPath: string;
    readonly metadataText: string;
    readonly schemaPath: string;
    readonly schemaText: string;
}

export interface WorkflowRpcGeneratorResult {
    readonly contract: ContractIr;
    readonly files: readonly GeneratedFile[];
}

export function generateWorkflowRpc(input: WorkflowRpcGeneratorInput): WorkflowRpcGeneratorResult {
    const ast = parseWorkflowRpcMetadata(input.metadataPath, input.metadataText);
    const schema = parseSchemaSymbols(input.schemaPath, input.schemaText);
    const contract = validateWorkflowRpcContract(ast, schema);
    return { contract, files: emitWorkflowRpcContract(contract) };
}

const manifestName = 'manifest.json';

function normalizeOwnedPath(root: string, relativePath: string): string {
    if (path.isAbsolute(relativePath) || relativePath.split(/[\\/]/u).includes('..')) {
        throw new Error(`Generated path escapes its output root: ${relativePath}`);
    }
    const resolvedRoot = path.resolve(root);
    const resolved = path.resolve(root, relativePath);
    if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
        throw new Error(`Generated path escapes its output root: ${relativePath}`);
    }
    return resolved;
}

function writeIfChanged(filePath: string, content: string): void {
    if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) {
        return;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
}

export function writeWorkflowRpcGeneratedFiles(outputRoot: string, files: readonly GeneratedFile[]): void {
    const normalizedRoot = path.resolve(outputRoot);
    fs.mkdirSync(normalizedRoot, { recursive: true });
    const manifestPath = normalizeOwnedPath(normalizedRoot, manifestName);
    let previous: string[] = [];
    if (fs.existsSync(manifestPath)) {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as unknown;
        if (!Array.isArray(parsed) || !parsed.every(value => typeof value === 'string')) {
            throw new Error(`Invalid Workflow RPC generated manifest: ${manifestPath}`);
        }
        previous = parsed;
    }
    const current = [...files.map(file => file.path)].sort();
    for (const obsolete of previous.filter(file => !current.includes(file))) {
        const target = normalizeOwnedPath(normalizedRoot, obsolete);
        if (fs.existsSync(target) && fs.statSync(target).isFile()) {
            fs.unlinkSync(target);
        }
    }
    for (const file of files) {
        writeIfChanged(normalizeOwnedPath(normalizedRoot, file.path), file.content);
    }
    writeIfChanged(manifestPath, `${JSON.stringify(current, undefined, 4)}\n`);
}

export function generateWorkflowRpcFromFiles(metadataPath: string, schemaPath: string, outputRoot: string): WorkflowRpcGeneratorResult {
    for (const inputPath of [metadataPath, schemaPath]) {
        if (!fs.existsSync(inputPath)) {
            throw new WorkflowRpcDiagnostic(
                `Required Workflow RPC generator input is missing: ${inputPath}. Generate the matching normalized metadata and serialization schema before running GacJS code generation.`,
                { path: inputPath, offset: 0, line: 1, column: 1 },
            );
        }
    }
    const result = generateWorkflowRpc({
        metadataPath,
        metadataText: fs.readFileSync(metadataPath, 'utf8'),
        schemaPath,
        schemaText: fs.readFileSync(schemaPath, 'utf8'),
    });
    writeWorkflowRpcGeneratedFiles(outputRoot, result.files);
    return result;
}
