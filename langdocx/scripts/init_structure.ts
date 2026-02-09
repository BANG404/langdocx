
import { mkdir, write } from "bun";
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
 *     "name": "01_Introduction",
 *     "content": "# Introduction\n\nOverview of the project...",
 *     "children": [
 *       { "name": "01_Background", "content": "## Background..." }
 *     ]
 *   }
 * ]
 */

interface Node {
    name: string;
    content?: string;
    children?: Node[];
}

async function createStructure(nodes: Node[], parentPath: string) {
    for (const node of nodes) {
        const currentPath = join(parentPath, node.name);
        
        // Create directory
        await mkdir(currentPath, { recursive: true });
        console.log(`Created directory: ${currentPath}`);

        // Create content.md if content is provided or if it's a leaf node (optional policy)
        // Here we always create content.md if 'content' text is present, or just an empty one with title
        const contentText = node.content || `# ${node.name.replace(/^\d+_/, '')}\n\n<!-- content placeholder -->\n`;
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
