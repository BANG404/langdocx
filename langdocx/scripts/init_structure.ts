
import { mkdir } from "node:fs/promises";
import { write } from "bun";
import { join, dirname } from "path";

/**
 * init_structure.ts
 * 
 * Generates a hierarchical directory structure for long-form technical documents.
 * Usage: bun run scripts/init_structure.ts <structure.json> [output_dir]
 * 
 * structure.json format example:
 * [
 *   {
 *     "name": "Introduction",
 *     "content": "Overview of the project...",
 *     "children": [
 *       { "name": "Background", "content": "Overview of context..." }
 *     ]
 *   }
 * ]
 * 
 * Naming rule:
 * - structure.json should use semantic names WITHOUT sorting prefixes.
 * - This script automatically creates prefixed folders (01_, 02_, ...).
 */

interface Node {
    name: string;
    content?: string;
    children?: Node[];
}

function stripSortPrefix(name: string): string {
    return name
        .replace(/^[\(（【]?\d+[\)）】]?[\s._\-]*/, "")
        .trim();
}

function formatNodeFolderName(rawName: string, index: number): string {
    const cleanName = stripSortPrefix(rawName) || rawName.trim();
    const prefix = String(index + 1).padStart(2, "0");
    return `${prefix}_${cleanName}`;
}

async function createStructure(nodes: Node[], parentPath: string) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const folderName = formatNodeFolderName(node.name, i);
        const currentPath = join(parentPath, folderName);
        
        // Create directory
        await mkdir(currentPath, { recursive: true });
        console.log(`Created directory: ${currentPath}`);

        // Create content.md if content is provided, otherwise initialize with placeholder only.
        // Keep file body header-free; section hierarchy is defined by folder structure.
        const contentText = node.content || `<!-- content placeholder -->\n`;
        await write(join(currentPath, "content.md"), contentText);
        console.log(`Created file: ${join(currentPath, "content.md")}`);

        if (node.children && node.children.length > 0) {
            await createStructure(node.children, currentPath);
        }
    }
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error("Usage: bun run scripts/init_structure.ts <structure.json> [output_dir]");
    process.exit(1);
}

const jsonFile = args[0];
const outputDir = args[1] || ".";

try {
    const jsonContent = await Bun.file(jsonFile).text();
    const structure: Node[] = JSON.parse(jsonContent);
    
    console.log(`Initializing structure in ${outputDir}...`);
    await createStructure(structure, outputDir);
    console.log("Structure initialization complete.");
} catch (error) {
    console.error(`Error processing file ${jsonFile}:`, error);
    process.exit(1);
}
