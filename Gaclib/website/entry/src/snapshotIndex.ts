export interface SnapshotFolder {
    type: 'Folder';
    content: { [key: string]: SnapshotEntry };
}

export type SnapshotEntry = SnapshotFolder | 'File';

export const Snapshot: SnapshotEntry = {
    type: 'Folder',
    content: {
        'HelloWorld.json': 'File',
    }
};
