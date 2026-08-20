import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { expect, test } from 'vitest';
import ts from 'typescript';
import { generateWorkflowRpc } from '../src/index.js';

const fixtures = path.resolve(import.meta.dirname, 'fixtures');

function generate(name: string) {
    const metadataPath = path.join(fixtures, `${name}.txt`);
    const schemaPath = path.join(fixtures, `${name}.d.ts`);
    return generateWorkflowRpc({
        metadataPath,
        metadataText: fs.readFileSync(metadataPath, 'utf8'),
        schemaPath,
        schemaText: fs.readFileSync(schemaPath, 'utf8'),
    });
}

test('real RVM fixture produces exact IDs and a self-contained public surface deterministically', () => {
    const metadataPath = path.join(fixtures, 'RvmMetadata.txt');
    const schemaPath = path.join(fixtures, 'RvmMetadata.d.ts');
    const metadataText = fs.readFileSync(metadataPath, 'utf8');
    const schemaText = fs.readFileSync(schemaPath, 'utf8');
    const first = generateWorkflowRpc({
        metadataPath,
        metadataText: `\uFEFF${metadataText.replace(/\r?\n/gu, '\r\n')}`,
        schemaPath,
        schemaText: `\uFEFF${schemaText.replace(/\r?\n/gu, '\r\n')}`,
    });
    const second = generate('RvmMetadata');
    expect(first.files).toEqual(second.files);
    expect(first.files).toEqual([{
        path: 'generated.ts',
        content: fs.readFileSync(path.join(fixtures, 'goldens', 'RvmMetadata.generated.ts'), 'utf8'),
    }]);
    expect(first.contract.interfaces[0].idNumber).toBe(0);
    expect(first.contract.interfaces[0].methods[0].idNumber).toBe(1);
    expect(first.files[0].content).toContain('export interface IViewModelLocal');
    expect(first.files[0].content).toContain('registerIViewModelService');
});

test('full-surface fixture emits inheritance, overload, property, event, collection, and transfer glue', () => {
    const result = generate('FullSurface');
    const source = result.files[0].content;
    expect(result.contract.interfaces).toHaveLength(3);
    expect(source).toContain('Convert_1');
    expect(source).toContain('Convert_2');
    expect(source).toContain('RPC.createByReferenceObservableListCodec');
    expect(source).toContain('RPC.createByReferenceListCodec');
    expect(source).toContain('RPC.createListCodec');
    expect(source).toContain('readonly ItemsChanged: RPC.RpcEvent');
    expect(source).toContain('getItems(): Promise');
    expect(result.contract.interfaces.flatMap(item => item.properties).find(item => item.name === 'Items')?.transfer).toBe('byReference');
    expect(source).toContain('this.ItemsChanged.setOutgoing((...arguments_) => this.raiseEvent(IService_ItemsChanged_5Id, arguments_));');
    expect(source).toContain("this.ItemsChanged.subscribe(() => this.invalidateProperty('IService.Items'));");
    expect(source).toContain('export enum Options');
    expect(source).toContain('export interface Envelope');
    expect(source).toContain('export interface NumericBoundaries');
    expect(source).toContain('baseTypeIds: [10, 20]');
    expect(source).toContain('RoundValueReference');
    expect(source).toContain('UseCallback(callback: ICallbackObject | null)');
    expect(source).toContain('protected override onFinalize(): void');
    const parsed = ts.createSourceFile('generated.ts', source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    const diagnostics = (parsed as unknown as { readonly parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
    expect(diagnostics).toEqual([]);

    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gacjs-rpc-codegen-'));
    try {
        const generatedPath = path.join(temporary, 'generated.ts');
        fs.writeFileSync(generatedPath, source, 'utf8');
        const gaclibRoot = path.resolve(import.meta.dirname, '../../..');
        const program = ts.createProgram([generatedPath], {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ES2022,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            strict: true,
            types: [],
            noEmit: true,
            skipLibCheck: true,
            baseUrl: gaclibRoot,
            paths: {
                '@gaclib/workflow-rpc': ['gaclib/workflow-rpc/src/index.ts'],
            },
        });
        const errors = ts.getPreEmitDiagnostics(program).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        expect(errors).toEqual([]);
    } finally {
        fs.rmSync(temporary, { recursive: true, force: true });
    }
});

test('duplicate IDs fail with a source-located diagnostic before emission', () => {
    const metadataPath = path.join(fixtures, 'RvmMetadata.txt');
    const schemaPath = path.join(fixtures, 'RvmMetadata.d.ts');
    const metadata = fs.readFileSync(metadataPath, 'utf8').replace('@rpc:IdNumber(1)', '@rpc:IdNumber(0)');
    expect(() => generateWorkflowRpc({
        metadataPath,
        metadataText: metadata,
        schemaPath,
        schemaText: fs.readFileSync(schemaPath, 'utf8'),
    })).toThrow(/RvmMetadata\.txt:\d+:\d+.*Numeric RPC ID 0 collides/u);
});

test('schema shapes are cross-checked against metadata before emission', () => {
    const metadataPath = path.join(fixtures, 'FullSurface.txt');
    const schemaPath = path.join(fixtures, 'FullSurface.d.ts');
    const schema = fs.readFileSync(schemaPath, 'utf8').replace('name: string;', 'name: number;');
    expect(() => generateWorkflowRpc({
        metadataPath,
        metadataText: fs.readFileSync(metadataPath, 'utf8'),
        schemaPath,
        schemaText: schema,
    })).toThrow(/FullSurface\.d\.ts:\d+:\d+.*sample_Item\.name must be string, not number/u);
});

test('read-only dictionaries fail explicitly when normalized metadata requests by-reference transfer', () => {
    const metadataPath = path.join(fixtures, 'RvmMetadata.txt');
    const schemaPath = path.join(fixtures, 'RvmMetadata.d.ts');
    const metadata = fs.readFileSync(metadataPath, 'utf8').replace(
        /@rpc:IdString\("rvmt::IViewModel\.Translate"\)\r?\n {8}@rpc:IdNumber\(1\)\r?\n {8}func Translate\(name : ::system::String\) : \(::system::String\);/u,
        '@rpc:Byref\n        @rpc:IdString("rvmt::IViewModel.Bad")\n        @rpc:IdNumber(2)\n        func Bad() : (const ::system::String[::system::String]);\n\n        @rpc:IdString("rvmt::IViewModel.Translate")\n        @rpc:IdNumber(1)\n        func Translate(name : ::system::String) : (::system::String);',
    );
    expect(() => generateWorkflowRpc({
        metadataPath,
        metadataText: metadata,
        schemaPath,
        schemaText: fs.readFileSync(schemaPath, 'utf8'),
    })).toThrow(/read-only dictionary cannot be transferred by reference/u);
});

test('schema aliases, tagged discriminators, and union membership are cross-validated', () => {
    const metadataPath = path.join(fixtures, 'RvmMetadata.txt');
    const schemaPath = path.join(fixtures, 'RvmMetadata.d.ts');
    const metadataText = fs.readFileSync(metadataPath, 'utf8');
    const schemaText = fs.readFileSync(schemaPath, 'utf8');
    const cases: readonly [string, RegExp][] = [
        [schemaText.replace(/(['"])\$\1: (['"])system::RpcException\2;/u, () => "'$': 'wrong';"), /must declare the discriminator/u],
        [schemaText.replace(/ {2}\| UnknownType_system_RpcException\r?\n/u, ''), /UnknownTypeSchema must include UnknownType_system_RpcException/u],
        [schemaText.replace(/ {2}\| system_RpcException\r?\n/u, ''), /KnownTypeSchema must include system_RpcException/u],
        [schemaText.replace('extends system_RpcObjectReference', 'extends missing_Base'), /extends missing symbol missing_Base/u],
    ];
    for (const [changedSchema, expected] of cases) {
        expect(() => generateWorkflowRpc({ metadataPath, metadataText, schemaPath, schemaText: changedSchema })).toThrow(expected);
    }
});

test('by-value enumerable T{} is rejected with a source-located compatibility diagnostic', () => {
    const metadataPath = path.join(fixtures, 'RvmMetadata.txt');
    const schemaPath = path.join(fixtures, 'RvmMetadata.d.ts');
    const metadata = fs.readFileSync(metadataPath, 'utf8').replace(
        /@rpc:IdString\("rvmt::IViewModel\.Translate"\)\r?\n {8}@rpc:IdNumber\(1\)/u,
        '@rpc:Byval\n        @rpc:IdString("rvmt::IViewModel.Translate")\n        @rpc:IdNumber(1)',
    ).replace('func Translate(name : ::system::String) : (::system::String);', 'func Translate(name : ::system::String) : (::system::String{});');
    expect(() => generateWorkflowRpc({
        metadataPath,
        metadataText: metadata,
        schemaPath,
        schemaText: fs.readFileSync(schemaPath, 'utf8'),
    })).toThrow(/RvmMetadata\.txt:\d+:\d+.*By-value enumerable T\{\} is unsupported/u);
});

test('missing IDs, unresolved bases and types, and unsafe numeric IDs fail before emission', () => {
    const metadataPath = path.join(fixtures, 'FullSurface.txt');
    const schemaPath = path.join(fixtures, 'FullSurface.d.ts');
    const source = fs.readFileSync(metadataPath, 'utf8');
    const schemaText = fs.readFileSync(schemaPath, 'utf8');
    const cases: readonly [string, RegExp][] = [
        [source.replace(/ {8}@rpc:IdNumber\(11\)\r?\n/u, ''), /Exactly one @rpc:IdNumber attribute is required/u],
        [source.replace('interface IService : ::sample::IBase, ::sample::ICallback', 'interface IService : ::sample::Missing, ::sample::ICallback'), /Unresolved RPC base sample::Missing/u],
        [source.replace('value : ::system::String', 'value : ::sample::Missing'), /Unresolved RPC type sample::Missing/u],
        [source.replace('@rpc:IdNumber(21)', '@rpc:IdNumber(9007199254740992)'), /Integer literal is not safe/u],
    ];
    for (const [metadataText, expected] of cases) {
        expect(() => generateWorkflowRpc({ metadataPath, metadataText, schemaPath, schemaText })).toThrow(expected);
    }
});

test('unknown RPC attributes are rejected in their source context', () => {
    const metadataPath = path.join(fixtures, 'RvmMetadata.txt');
    const schemaPath = path.join(fixtures, 'RvmMetadata.d.ts');
    const metadata = fs.readFileSync(metadataPath, 'utf8').replace('@rpc:Interface', '@rpc:Interface\n    @rpc:FutureFeature');
    expect(() => generateWorkflowRpc({
        metadataPath,
        metadataText: metadata,
        schemaPath,
        schemaText: fs.readFileSync(schemaPath, 'utf8'),
    })).toThrow(/RvmMetadata\.txt:\d+:\d+.*Unsupported @rpc:FutureFeature attribute/u);
});

test('generated member collisions are rejected across overloaded and literal method names', () => {
    const metadataPath = path.join(fixtures, 'FullSurface.txt');
    const schemaPath = path.join(fixtures, 'FullSurface.d.ts');
    const metadata = fs.readFileSync(metadataPath, 'utf8').replace('func Snapshot(', 'func Convert_1(');
    expect(() => generateWorkflowRpc({
        metadataPath,
        metadataText: metadata,
        schemaPath,
        schemaText: fs.readFileSync(schemaPath, 'utf8'),
    })).toThrow(/FullSurface\.txt:\d+:\d+.*Generated RPC member name collision: Convert_1/u);
});

test('property setters must return system::Void', () => {
    const metadataPath = path.join(fixtures, 'FullSurface.txt');
    const schemaPath = path.join(fixtures, 'FullSurface.d.ts');
    const metadata = fs.readFileSync(metadataPath, 'utf8').replace(
        'func SetItems(@rpc:Byref <value> : observe ::sample::Item[]) : (::system::Void);',
        'func SetItems(@rpc:Byref <value> : observe ::sample::Item[]) : (::system::String);',
    );
    expect(() => generateWorkflowRpc({
        metadataPath,
        metadataText: metadata,
        schemaPath,
        schemaText: fs.readFileSync(schemaPath, 'utf8'),
    })).toThrow(/Invalid setter link SetItems/u);
});

test('required system serialization records are shape checked', () => {
    const metadataPath = path.join(fixtures, 'RvmMetadata.txt');
    const schemaPath = path.join(fixtures, 'RvmMetadata.d.ts');
    const schema = fs.readFileSync(schemaPath, 'utf8').replace('clientId: number;', 'clientId: string;');
    expect(() => generateWorkflowRpc({
        metadataPath,
        metadataText: fs.readFileSync(metadataPath, 'utf8'),
        schemaPath,
        schemaText: schema,
    })).toThrow(/system_RpcObjectReference has incompatible field clientId/u);
});

test('recursive value structs fail with a source-located diagnostic before codec emission', () => {
    const metadataPath = path.join(fixtures, 'FullSurface.txt');
    const schemaPath = path.join(fixtures, 'FullSurface.d.ts');
    const metadata = fs.readFileSync(metadataPath, 'utf8').replace(
        'struct Item { name : ::system::String; state : ::sample::State; }',
        'struct Item { name : ::system::String; state : ::sample::State; next : ::sample::Item; }',
    );
    const schema = fs.readFileSync(schemaPath, 'utf8').replace(
        'export interface sample_Item { name: string; state: sample_State; }',
        'export interface sample_Item { name: string; state: sample_State; next: sample_Item; }',
    );
    expect(() => generateWorkflowRpc({ metadataPath, metadataText: metadata, schemaPath, schemaText: schema }))
        .toThrow(/FullSurface\.txt:\d+:\d+.*Recursive value struct dependency/u);
});

test('derived generated names cannot collide with fixed exports', () => {
    const metadataPath = path.join(fixtures, 'FullSurface.txt');
    const schemaPath = path.join(fixtures, 'FullSurface.d.ts');
    const metadata = fs.readFileSync(metadataPath, 'utf8')
        .replace('enum State', 'enum AllRpcInterfaceDescriptors')
        .replaceAll('::sample::State', '::sample::AllRpcInterfaceDescriptors');
    const schema = fs.readFileSync(schemaPath, 'utf8')
        .replaceAll('sample_State', 'sample_AllRpcInterfaceDescriptors')
        .replaceAll('sample::State', 'sample::AllRpcInterfaceDescriptors');
    expect(() => generateWorkflowRpc({ metadataPath, metadataText: metadata, schemaPath, schemaText: schema }))
        .toThrow(/Generated TypeScript name AllRpcInterfaceDescriptors collides with the descriptor registry/u);
});
