import * as fs from 'fs';
import * as path from 'path';

const __dirname = import.meta.dirname;
const SourcePath = path.join(__dirname, '../../../../../GacUI/Test/Resources/UnitTestSnapshots');
const DestPath = path.join(__dirname, '../../../website/entry/assets/snapshots');

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

}