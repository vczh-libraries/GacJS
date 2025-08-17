import { SnapshotEntry } from './snapshotIndex';

export interface TreeFolder {
    type: 'Folder';
    content: { [name: string]: TreeNode };
}

export interface TreeFile {
    type: 'File';
    url: {};
}

export type TreeNode = TreeFolder | TreeFile;

export interface TreeConfig {
    onSelected: (url: {}) => void;
    currentSelectedFile?: HTMLElement;
}

// Function to create tree element from a data structure
export function createTreeElement(tree: TreeFolder, config: TreeConfig, indent: number = 0): HTMLElement {
    const container = document.createElement('div');

    // Iterate through entries (already sorted in readSnapshot)
    Object.entries(tree.content).forEach(([name, entry]) => {
        if (entry.type === 'Folder') {
            // Create folder element
            const folderDiv = document.createElement('div');
            folderDiv.className = 'tree-item tree-folder';

            const indentSpan = document.createElement('span');
            indentSpan.className = 'tree-indent';
            indentSpan.style.width = (indent * 4) + 'ch';
            folderDiv.appendChild(indentSpan);

            folderDiv.appendChild(document.createTextNode(name));
            container.appendChild(folderDiv);

            // Recursively add folder content
            container.appendChild(createTreeElement(entry, config, indent + 1));
        } else {
            // File entry
            const fileDiv = document.createElement('div');
            fileDiv.className = 'tree-item';

            const indentSpan = document.createElement('span');
            indentSpan.className = 'tree-indent';
            indentSpan.style.width = (indent * 4) + 'ch';
            fileDiv.appendChild(indentSpan);

            const fileLink = document.createElement('a');
            fileLink.className = 'tree-file';
            fileLink.href = '#';
            fileLink.textContent = name;

            fileLink.addEventListener('click', (e) => {
                e.preventDefault();

                // Remove selected class from previously selected file
                if (config.currentSelectedFile) {
                    config.currentSelectedFile.classList.remove('selected');
                }

                // Add selected class to current file
                fileLink.classList.add('selected');
                config.currentSelectedFile = fileLink;

                config.onSelected(entry.url);
            });

            fileDiv.appendChild(fileLink);
            container.appendChild(fileDiv);
        }
    });

    return container;
}

// Function to read snapshot and convert to tree structure
export function readSnapshot(entry: SnapshotEntry, path: string): TreeNode {
    if (typeof entry === 'object' && entry.type === 'Folder') {
        const treeFolder: TreeFolder = {
            type: 'Folder',
            content: {}
        };

        // Sort entries: folders first, then files, both alphabetically
        const entries = Object.entries(entry.content);
        const folders = entries.filter(([, value]) => typeof value === 'object' && value.type === 'Folder').sort(([a], [b]) => a.localeCompare(b));
        const files = entries.filter(([, value]) => value === 'File').sort(([a], [b]) => a.localeCompare(b));

        // Add folders first
        folders.forEach(([name, childEntry]) => {
            const childPath = `${path}${name}/`;
            treeFolder.content[name] = readSnapshot(childEntry, childPath);
        });

        // Add files second
        files.forEach(([name, childEntry]) => {
            const childPath = `${path}${name}`;
            treeFolder.content[name] = readSnapshot(childEntry, childPath);
        });

        return treeFolder;
    } else {
        // entry === 'File'
        return {
            type: 'File',
            url: path
        };
    }
}