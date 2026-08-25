import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    RpcTestCaseNames,
    RpcTestCases,
    selectRpcTestCase,
} from '../src/index.js';
import type { RpcEndpoint, RpcInterfaceDescriptor, RpcObjectReference } from '@gaclib/workflow-rpc';

function workflowRoot(): string {
    const packageRoot = path.resolve(import.meta.dirname, '../..');
    return path.resolve(packageRoot, '../../../../Workflow');
}

function indexedNames(): string[] {
    return fs.readFileSync(path.join(workflowRoot(), 'Test/Resources/IndexRpc.txt'), 'utf8')
        .split(/\r?\n/u)
        .filter(line => line.length > 0)
        .map(line => line.substring(0, line.indexOf('=')));
}

describe('Workflow RPC generated case registry', () => {
    it('matches IndexRpc.txt exactly and retains skipped destructor contracts', () => {
        const expected = indexedNames();
        expect(RpcTestCaseNames).toEqual(expected);
        expect(Object.keys(RpcTestCases)).toEqual(expected);

        const skipped = fs.readFileSync(path.join(workflowRoot(), 'Test/StartRpcStdio_DtorSkipList.txt'), 'utf8')
            .split(/\r?\n/u)
            .filter(line => line.length > 0);
        expect(skipped.every(name => RpcTestCaseNames.includes(name as typeof RpcTestCaseNames[number]))).toBe(true);
    });

    it('selects one exact case and rejects an unknown name', () => {
        expect(selectRpcTestCase('RequestService').name).toBe('RequestService');
        expect(() => selectRpcTestCase('RequestService_Unknown')).toThrow('Unknown Workflow RPC test case');
    });

    it('configures generated descriptors and registers the service before initialization', () => {
        const operations: string[] = [];
        const fakeEndpoint = {
            registerInterface(descriptor: RpcInterfaceDescriptor): void {
                operations.push(`interface:${descriptor.name}`);
            },
            registerService(descriptor: RpcInterfaceDescriptor): RpcObjectReference {
                operations.push(`service:${descriptor.name}`);
                return { clientId: 1, objectId: descriptor.typeId, typeId: descriptor.typeId };
            },
        } as unknown as RpcEndpoint;

        selectRpcTestCase('RequestService').prepare(fakeEndpoint);

        expect(operations.length).toBeGreaterThanOrEqual(2);
        expect(operations[0]).toMatch(/^interface:/u);
        expect(operations.at(-1)).toMatch(/^service:/u);
    });
});
