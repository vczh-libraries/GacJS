import * as fs from 'fs';
import * as path from 'path';

const __dirname = import.meta.dirname;
const SourcePath = path.join(__dirname, '../../../../../GacUI/Test/Resources/UnitTestSnapshots');
const DestPath = path.join(__dirname, '../../../website/entry/assets/snapshots');
const IndexPath = path.join(__dirname, '../../../website/entry/src/snapshotIndex.ts');

export function prepareSnapshots(): void {
    // Ensure the destination directory exists
    if (!fs.existsSync(DestPath)) {
        fs.mkdirSync(DestPath, { recursive: true });
    }

    // Recursive function to copy JSON files
    function copyJsonFiles(sourcePath: string, destPath: string): void {
        // Check if source path exists
        if (!fs.existsSync(sourcePath)) {
            console.warn(`Source path does not exist: ${sourcePath}`);
            return;
        }

        // Read all items in the source directory
        const items = fs.readdirSync(sourcePath, { withFileTypes: true });

        for (const item of items) {
            const sourceItemPath = path.join(sourcePath, item.name);
            const destItemPath = path.join(destPath, item.name);

            if (item.isDirectory()) {
                // Create the directory in destination if it doesn't exist
                if (!fs.existsSync(destItemPath)) {
                    fs.mkdirSync(destItemPath, { recursive: true });
                }
                // Recursively copy JSON files from subdirectory
                copyJsonFiles(sourceItemPath, destItemPath);
            } else if (item.isFile() && path.extname(item.name).toLowerCase() === '.json') {
                // Copy JSON file to destination
                fs.copyFileSync(sourceItemPath, destItemPath);
                console.log(`Copied: ${item.name} to ${path.relative(DestPath, destItemPath)}`);
            }
        }
    }

    console.log(`Copying JSON files from ${SourcePath} to ${DestPath}`);
    copyJsonFiles(SourcePath, DestPath);
    console.log('JSON files copy completed');
}

export function generateSnapshotIndex(): void {
    console.log(`Generating snapshot index from ${DestPath} to ${IndexPath}`);

    // Type definitions for the snapshot tree
    interface SnapshotFolderContent {
        [key: string]: SnapshotFolderContent | 'File' | { type: 'Folder'; content: SnapshotFolderContent };
    }

    // Recursive function to build the snapshot tree
    function buildSnapshotTree(dirPath: string): SnapshotFolderContent {
        const content: SnapshotFolderContent = {};
        
        if (!fs.existsSync(dirPath)) {
            console.warn(`Directory does not exist: ${dirPath}`);
            return content;
        }

        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
                // Recursively build tree for subdirectory
                const subContent = buildSnapshotTree(itemPath);
                content[item.name] = {
                    type: 'Folder',
                    content: subContent
                };
            } else if (item.isFile() && path.extname(item.name).toLowerCase() === '.json') {
                // Add JSON file as 'File' entry
                content[item.name] = 'File';
            }
        }
        
        return content;
    }

    // Build the snapshot tree
    const snapshotContent = buildSnapshotTree(DestPath);

    // Generate the TypeScript file content
    const tsContent = `export interface SnapshotFolder {
    type: 'Folder';
    content: { [key: string]: SnapshotEntry };
}

export type SnapshotEntry = SnapshotFolder | 'File';

export const Snapshot: SnapshotEntry = ${JSON.stringify({
        type: 'Folder',
        content: snapshotContent
    }, null, 4)};
`;

    // Ensure the directory exists
    const indexDir = path.dirname(IndexPath);
    if (!fs.existsSync(indexDir)) {
        fs.mkdirSync(indexDir, { recursive: true });
    }

    // Write the generated TypeScript file
    fs.writeFileSync(IndexPath, tsContent, 'utf8');
    
    console.log(`Snapshot index generated successfully at ${IndexPath}`);
}