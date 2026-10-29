import { InjectionFileOperation as Operation, InjectionFileRequest, InjectionFileResponse } from '@gaclib/remote-protocol';
import { dateTimeFields } from './injectDateTime';

export function normalizeOpfsPath(value: string): string {
    if (value.includes('\0')) throw new Error('Illegal path.');
    const parts: string[] = [];
    for (const part of value.split('/')) {
        if (part === '..') {
            if (parts.length === 0) throw new Error('Path traverses above root.');
            parts.pop();
        } else if (part !== '' && part !== '.') parts.push(part);
    }
    return '/' + parts.join('/');
}

function joinPath(base: string, name: string): string {
    return normalizeOpfsPath(name.startsWith('/') ? name : base + '/' + name);
}

function parentPath(path: string): string {
    const parent = path.substring(0, path.lastIndexOf('/'));
    return parent === '' ? '/' : parent;
}

async function getHandle(path: string, directory: true, create?: boolean): Promise<FileSystemDirectoryHandle>;
async function getHandle(path: string, directory: false, create?: boolean): Promise<FileSystemFileHandle>;
async function getHandle(path: string, directory: boolean, create = false): Promise<FileSystemDirectoryHandle | FileSystemFileHandle> {
    const parts = path.split('/').filter(part => part !== '');
    const name = parts.pop();
    let parent = await navigator.storage.getDirectory();
    for (const part of parts) parent = await parent.getDirectoryHandle(part);
    if (name === undefined) {
        if (!directory) throw new Error('Root is a directory.');
        return parent;
    }
    return directory ? parent.getDirectoryHandle(name, { create }) : parent.getFileHandle(name, { create });
}

async function exists(path: string, directory: boolean): Promise<boolean> {
    try {
        if (directory) await getHandle(path, true);
        else await getHandle(path, false);
        return true;
    } catch { return false; }
}

export function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let start = 0; start < bytes.length; start += 8192) {
        binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
    }
    return btoa(binary);
}

// TypeScript's DOM library does not include the async directory iteration API.
type IterableDirectory = FileSystemDirectoryHandle & {
    entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>;
};

async function copyEntry(source: FileSystemDirectoryHandle | FileSystemFileHandle, parent: FileSystemDirectoryHandle, name: string): Promise<void> {
    if (source.kind === 'file') {
        const file = await parent.getFileHandle(name, { create: true });
        const writer = await file.createWritable();
        await writer.write(await source.getFile());
        await writer.close();
    } else {
        const folder = await parent.getDirectoryHandle(name, { create: true });
        for await (const [childName, child] of (source as IterableDirectory).entries()) await copyEntry(child, folder, childName);
    }
}

export async function injectFileSystem(request: InjectionFileRequest): Promise<InjectionFileResponse> {
    const result: InjectionFileResponse = { success: false, text: '', paths: [], info: null, content: '' };
    try {
        const path = normalizeOpfsPath(request.path);
        switch (request.operation) {
            case Operation.PathDelimiter: result.text = '/'; break;
            case Operation.CompatibleDelimiters: break;
            case Operation.Initialize: result.text = path; break;
            case Operation.Concat: result.text = joinPath(path, request.target); break;
            case Operation.IsRoot: result.success = path === '/'; return result;
            case Operation.IsFile: result.success = await exists(path, false); return result;
            case Operation.IsFolder: result.success = await exists(path, true); return result;
            case Operation.Copy: return result;
            case Operation.Relative: {
                const source = (await exists(path, true) ? path : parentPath(path)).split('/').filter(part => part !== '');
                const target = normalizeOpfsPath(request.target).split('/').filter(part => part !== '');
                let common = 0;
                while (common < source.length && common < target.length && source[common] === target[common]) common++;
                result.text = [...source.slice(common).map(() => '..'), ...target.slice(common)].join('/');
                break;
            }
            case Operation.Info: {
                const directory = await exists(path, true);
                const file = directory ? undefined : await (await getHandle(path, false)).getFile();
                result.info = {
                    size: String(file?.size ?? 0), hardLinkCount: '0',
                    creationTime: null, lastAccessTime: null, lastChangeTime: null,
                    lastModifiedTime: file !== undefined && file.lastModified >= 0 ? dateTimeFields(new Date(file.lastModified), true) : null,
                    isDirectory: directory, isSymbolicLink: false, isReparsePoint: false,
                    canRead: true, canWrite: true, canExecute: false, isReadOnly: false,
                    isHidden: false, isSystem: false, isArchive: false, isCompressed: false,
                    isEncrypted: false, isSparse: false, isTemporary: false, isOffline: false,
                    isNotContentIndexed: false, isImmutable: false, isAppendOnly: false,
                };
                break;
            }
            case Operation.Folders:
            case Operation.Files: {
                const folder = await getHandle(path, true);
                for await (const [name, child] of (folder as IterableDirectory).entries()) {
                    if ((child.kind === 'directory') === (request.operation === Operation.Folders)) result.paths!.push(joinPath(path, name));
                }
                result.paths!.sort();
                break;
            }
            case Operation.CreateFolder:
                if (path === '/' || await exists(path, true) || await exists(path, false)) return result;
                await getHandle(path, true, true);
                break;
            case Operation.DeleteFile:
            case Operation.DeleteFolder: {
                if (path === '/' || !await exists(path, request.operation === Operation.DeleteFolder)) return result;
                const parent = await getHandle(parentPath(path), true);
                await parent.removeEntry(path.substring(path.lastIndexOf('/') + 1));
                break;
            }
            case Operation.RenameFile:
            case Operation.RenameFolder: {
                if (path === '/') return result;
                const directory = request.operation === Operation.RenameFolder;
                const source = directory ? await getHandle(path, true) : await getHandle(path, false);
                const target = joinPath(parentPath(path), request.target);
                if (target === path) break;
                if (target === '/' || (directory && target.startsWith(path + '/')) || await exists(target, true) || await exists(target, false)) return result;
                const destination = await getHandle(parentPath(target), true);
                await copyEntry(source, destination, target.substring(target.lastIndexOf('/') + 1));
                await (await getHandle(parentPath(path), true)).removeEntry(path.substring(path.lastIndexOf('/') + 1), { recursive: true });
                break;
            }
            case Operation.OpenRead:
            case Operation.OpenWrite:
            case Operation.OpenReadWrite: {
                const handle = await getHandle(path, false, request.operation !== Operation.OpenRead);
                if (request.operation !== Operation.OpenWrite) result.content = bytesToBase64(new Uint8Array(await (await handle.getFile()).arrayBuffer()));
                break;
            }
            case Operation.Commit: {
                if (request.content === null) return result;
                const bytes = Uint8Array.from(atob(request.content), char => char.charCodeAt(0));
                const handle = await getHandle(path, false);
                const writer = await handle.createWritable();
                await writer.write(bytes);
                await writer.close();
                break;
            }
        }
        result.success = true;
    } catch {
        // OPFS rejects for ordinary missing-entry, permission, quota, storage or
        // path errors. Complete the correlated request with its failure result.
        return { success: false, text: '', paths: [], info: null, content: '' };
    }
    return result;
}

export class FileSystemInjection {
    private queue: Promise<void> = Promise.resolve();

    request(request: InjectionFileRequest, respond: (response: InjectionFileResponse) => void, active: () => boolean): void {
        this.queue = this.queue.then(async () => {
            if (!active()) return;
            const response = await injectFileSystem(request);
            if (active()) respond(response);
        });
    }
}
