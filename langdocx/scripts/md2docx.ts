#!/usr/bin/env bun
/**
 * md2docx.ts - Unified Markdown to DOCX Workflow Tool
 * 
 * Combines Markdown merging and DOCX conversion in one tool with granular control
 * 
 * Features:
 * - Merge multiple content.md files from directory structure
 * - Convert Markdown to DOCX using pandoc with reference template
 * - Flexible workflow: merge-only, convert-only, or full pipeline
 * - Prefix lifecycle: structure.json uses semantic names (no numeric prefix),
 *   init_structure adds sortable prefixes to folders (01_, 02_, ...),
 *   and merge removes prefixes from final headings.
 * 
 * Style mapping (from reference template):
 *   - Heading 1: Top-level heading with numbering (e.g., 1.)
 *   - Heading 2: Second-level heading with numbering (e.g., 1.1.)
 *   - Heading 3: Third-level heading with numbering (e.g., 1.1.1.)
 *   - Heading 4: Fourth-level heading with numbering (e.g., 1.1.1.1.)
 *   - Body Text: Normal paragraph with first-line indentation
 *   - First Paragraph: First paragraph after heading
 *   - Compact: Compact list paragraph
 *   - Source Code: Code blocks (monospace font, gray background)
 *   - Block Text: Blockquote (left gray border)
 *   - Table Grid: Full-bordered table
 *   - Title/Subtitle: Cover page titles
 * 
 * Page settings: A4, top/bottom margins 2.54cm, left/right margins 3.17cm
 * 
 * Usage:
 *   bun run md2docx.ts merge [--path <dir>]          # Merge only
 *   bun run md2docx.ts convert <input.md> [out.docx] # Convert only
 *   bun run md2docx.ts all                           # Full pipeline (default)
 *   bun run md2docx.ts <input.md> [output.docx]      # Quick convert
 */

import { $ } from "bun";
import { file, write } from "bun";
import { join, dirname, basename, resolve, relative } from "path";
import { existsSync } from "fs";
import { readdir } from "node:fs/promises";

// ============ Markdown Merging Functions ============

async function getFiles(dir: string): Promise<string[]> {
    const dirents = await readdir(dir, { withFileTypes: true });

    // Sorting: content.md first, then by numeric prefix
    dirents.sort((a, b) => {
        if (a.name === "content.md") return -1;
        if (b.name === "content.md") return 1;

        const numA = parseInt(a.name.match(/^\d+/)?.[0] || "999");
        const numB = parseInt(b.name.match(/^\d+/)?.[0] || "999");

        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
    });

    const files: string[] = [];
    for (const dirent of dirents) {
        const res = join(dir, dirent.name);
        if (dirent.isDirectory()) {
            files.push(...await getFiles(res));
        } else if (dirent.name === "content.md") {
            files.push(res);
        }
    }
    return files;
}

export function countContentChars(text: string) {
    return text
        .replace(/<!--.*?-->/gs, "") // Remove comments
        .replace(/\s+/g, "")         // Remove all whitespace
        .length;
}

export async function mergePackage(pkgPath: string, pkgName: string, pkgId: string, author: string, tocTitle: string = "Table of Contents"): Promise<string> {
    console.log(`\n[INFO] Merging ${pkgName}...`);
    const files = await getFiles(pkgPath);
    let fullContent = "";

    fullContent += `---\n`;
    fullContent += `title: "${pkgName}"\n`;
    fullContent += `author: "${author}"\n`;
    fullContent += `date: "${new Date().toLocaleDateString()}"\n`;
    fullContent += `toc: true\n`;
    fullContent += `toc-title: "${tocTitle}"\n`;
    fullContent += `--- \n\n`;

    // Title is already in YAML frontmatter, no need for duplicate H1 heading

    for (const f of files) {
        const relPath = relative(pkgPath, f);
        // Correct depth: 
        // 01_Overview/content.md -> depth 0
        // 01_Overview/01_Section/content.md -> depth 1
        const pathParts = relPath.split("/");
        const depth = Math.max(0, pathParts.length - 2);
        
        // Auto-generate heading from folder name
        const rawFolderName = pathParts[pathParts.length - 2];
        // Strip ALL numeric prefixes to avoid conflicts with Word's auto-numbering
        // Handles formats: "01_Title", "1. Title", "1) Title", "(01)Title", "[1]Title", etc.
        // This ensures Word template's numbering style is the ONLY source of numbering
        let cleanFolderName = rawFolderName
            .replace(/^[\(（【]?\d+[\)）】]?[\s._\-]*/, "") // Remove common numbering prefixes
            .replace(/_/g, " ") // Convert underscores to spaces
            .trim();
        
        // Safety check: if cleaning removed everything, use original
        if (!cleanFolderName) {
            cleanFolderName = rawFolderName.replace(/_/g, " ").trim();
        }
        
        // Match heading level to depth + 1 (no document title, top chapters are H1)
        const headingLevel = depth + 1;
        const headingPrefix = "#".repeat(headingLevel);
        
        let rawContent = await file(f).text();
        
        // PREPROCESS content.md: Remove local headers to prevent folder-vs-file title conflicts
        // This ensures the folder structure is the ONLY source of headers.
        rawContent = rawContent.replace(/^#{1,6}\s+.*\n?/gm, "");

        // Optimization: add page break before each top-level chapter
        if (depth === 0 && fullContent.length > 500) {
            fullContent += `\n\n\\newpage\n\n`; 
        }

        // Add the auto-generated heading
        fullContent += `\n\n${headingPrefix} ${cleanFolderName}\n\n`;

        fullContent += `\n\n<!-- Source: ${relPath} -->\n\n`;
        fullContent += rawContent;
        fullContent += "\n";
    }

    const charCount = countContentChars(fullContent);

    console.log(`[SUCCESS] ${pkgId} merge complete:`);
    console.log(`   - Files included: ${files.length}`);
    console.log(`   - Total characters: ${charCount}`);

    const outputPath = join(pkgPath, "../", `${pkgId}_Complete_Draft.md`);
    await write(outputPath, fullContent);
    return outputPath;
}

// ============ DOCX Conversion Functions ============


/**
 * Preprocess Markdown: Remove pandoc-incompatible content, clean heading numbering conflicts
 */
function preprocessMarkdown(content: string): string {
    // 1. Remove HTML comments
    let processed = content.replace(/<!--.*?-->/gs, "");

    // 2. Remove \newpage (replaced by pandoc page breaks if needed)
    processed = processed.replace(/\\newpage/g, "");

    // 4. Handle consecutive blank lines (merge more than 2 into 2)
    processed = processed.replace(/\n{4,}/g, "\n\n\n");

    return processed;
}

/**
 * Convert Markdown file to DOCX using pandoc
 */
async function convertMdToDocx(
    inputMd: string,
    outputDocx: string,
    templatePath: string,
    options: {
        toc?: boolean;
        tocDepth?: number;
        numberSections?: boolean;
    } = {}
): Promise<void> {
    const {
        toc = true,
        tocDepth = 4,
        numberSections = false,
    } = options;

    if (!existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
    }

    if (!existsSync(inputMd)) {
        throw new Error(`Input file not found: ${inputMd}`);
    }

    // Preprocess Markdown
    const rawContent = await Bun.file(inputMd).text();
    const processed = preprocessMarkdown(rawContent);
    const tmpInput = inputMd + ".tmp.md";
    await Bun.write(tmpInput, processed);

    // Build pandoc command arguments
    const args: string[] = [
        tmpInput,
        "-o", outputDocx,
        "--reference-doc", templatePath,
        "--from", "markdown+yaml_metadata_block+pipe_tables+grid_tables+table_captions+fenced_code_blocks+backtick_code_blocks+fenced_divs+bracketed_spans",
        "--to", "docx",
        "--wrap=none",
    ];

    if (toc) {
        args.push("--toc");
        args.push("--toc-depth", String(tocDepth));
    }

    if (numberSections) {
        args.push("--number-sections");
    }

    console.log(`[CONVERT] Converting: ${basename(inputMd)} -> ${basename(outputDocx)}`);
    console.log(`   Template: ${basename(templatePath)}`);

    try {
        const proc = Bun.spawn(["pandoc", ...args], {
            stdout: "pipe",
            stderr: "pipe",
        });
        const exitCode = await proc.exited;
        const stderr = await new Response(proc.stderr).text();
        const stdout = await new Response(proc.stdout).text();

        if (exitCode !== 0) {
            throw new Error(`pandoc exit code ${exitCode}: ${stderr || stdout}`);
        }
        if (stderr.trim()) {
            console.log(`   pandoc warning: ${stderr.trim()}`);
        }
    } catch (err: any) {
        if (err.message?.startsWith("pandoc exit code")) throw err;
        throw new Error(`pandoc conversion failed: ${err.message || err}`);
    } finally {
        // Cleanup temporary files
        try {
            await $`rm -f ${tmpInput}`.quiet();
        } catch {}
    }

    if (!existsSync(outputDocx)) {
        throw new Error(`Output file not generated: ${outputDocx}`);
    }

    const stat = Bun.file(outputDocx);
    console.log(`[SUCCESS] Conversion successful: ${outputDocx}`);
    console.log(`   File size: ${(stat.size / 1024).toFixed(1)} KB`);
}

// ============ Workflow Functions ============

/**
 * Merge only - collect and merge Markdown files
 */
async function runMergeOnly(targetRoots: any[], author: string, tocTitle: string, packagePath?: string): Promise<void> {
    if (packagePath) {
        // Custom single package
        const pkgName = basename(packagePath);
        const pkgId = pkgName;
        const mergedPath = await mergePackage(packagePath, pkgName, pkgId, author, tocTitle);
        console.log(`\n[FILE] Merged file: ${mergedPath}`);
    } else {
        // Default packages
        for (const root of targetRoots) {
            try {
                const mergedPath = await mergePackage(root.path, root.name, root.id, author, tocTitle);
                console.log(`\n[FILE] Merged file: ${mergedPath}`);
            } catch (e) {
                console.error(`[ERROR] Error merging ${root.name}:`, e);
            }
        }
    }
}

/**
 * Convert only - convert existing Markdown to DOCX
 */
async function runConvertOnly(inputPath: string, templatePath: string, tocDepth: number, outputPath?: string): Promise<void> {
    const input = resolve(inputPath);
    const output = outputPath
        ? resolve(outputPath)
        : input.replace(/\.md$/, ".docx");

    await convertMdToDocx(input, output, templatePath, {
        toc: true,
        tocDepth: tocDepth,
    });
}

/**
 * Full pipeline - merge and convert all packages
 */
async function runFullPipeline(targetRoots: any[], author: string, templatePath: string, tocDepth: number, tocTitle: string): Promise<void> {
    console.log("[START] Starting full pipeline: merge + convert...\n");

    for (const root of targetRoots) {
        try {
            // First merge Markdown
            const mergedMdPath = await mergePackage(root.path, root.name, root.id, author, tocTitle);

            // Then convert to DOCX
            const docxPath = mergedMdPath.replace(/\.md$/, ".docx");
            await convertMdToDocx(mergedMdPath, docxPath, templatePath, {
                toc: true,
                tocDepth: tocDepth,
                numberSections: true, // Enable Pandoc numbering to apply template's numbering styles
            });

            console.log(`\n[SUCCESS] ${root.name} complete!`);
            console.log(`   MD:   ${mergedMdPath}`);
            console.log(`   DOCX: ${docxPath}\n`);
        } catch (e) {
            console.error(`[ERROR] Error processing ${root.name}:`, e);
        }
    }

    console.log("\n[FINISH] All conversions complete!");
}

// Helper to parse CLI arguments
function parseCliArgs(args: string[]) {
    const config: Record<string, string> = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            // Handle flags with values
            if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                config[key] = args[i + 1];
                i++; // Skip next arg
            } else {
                config[key] = 'true';
            }
        }
    }
    return config;
}

// ============ CLI Entry Point ============
if (import.meta.main) {
    const args = process.argv.slice(2);
    const cliConfig = parseCliArgs(args);

    // Default settings (can be overridden by CLI args)
    const author = cliConfig['author'] || "Author"; 
    const tocDepth = parseInt(cliConfig['toc-depth'] || "4");
    const tocTitle = cliConfig['toc-title'] || "Table of Contents";
    
    // Template priority: 1. CLI flag, 2. Numbering template (NEW), 3. Default in skill root, 4. Workspace test dir
    const projectRoot = dirname(import.meta.path);
    const skillRootTemplate = resolve(projectRoot, "../assets/template.docx");
    const skillRootNumberingTemplate = resolve(projectRoot, "../assets/template_with_numbering.docx");
    const workspaceTemplate = resolve(process.cwd(), "test/template.docx");
    
    let templatePath = cliConfig['template'] ? resolve(cliConfig['template']) : "";
    
    if (!templatePath) {
        // Prioritize numbering template for automatic heading numbering
        if (existsSync(skillRootNumberingTemplate)) {
            templatePath = skillRootNumberingTemplate;
        } else if (existsSync(workspaceTemplate)) {
            templatePath = workspaceTemplate;
        } else if (existsSync(skillRootTemplate)) {
            templatePath = skillRootTemplate;
        } else {
            templatePath = skillRootTemplate; // Fallback to expected path even if missing for error report
        }
    }

    let targetRoots: any[] = [];

    // Parse package targetRoots from CLI
    if (cliConfig['pkg-root'] || cliConfig['name'] || cliConfig['id']) {
        const pkgRoot = cliConfig['pkg-root'] || ".";
        const pkgName = cliConfig['name'] || basename(resolve(pkgRoot));
        const pkgId = cliConfig['id'] || pkgName;
        
        targetRoots = [{
            id: pkgId,
            name: pkgName,
            path: pkgRoot
        }];
    }
    // Allow overriding via JSON config flag
    else if (cliConfig['config']) {
        try {
            targetRoots = JSON.parse(cliConfig['config']);
        } catch (e) {
            console.warn("Failed to parse --config JSON");
        }
    } else {
        // Fallback or empty
        targetRoots = [];
    }

    if (args.length === 0 || args[0] === "--help" || (targetRoots.length === 0 && (args[0] === "all" || args[0] === "merge"))) {
        console.log(`
md2docx.ts - Unified Markdown to DOCX Workflow Tool

Usage:
  bun run md2docx.ts all   --pkg-root <dir>       Full pipeline (merge + convert)
  bun run md2docx.ts merge --pkg-root <dir>       Merge content.md files only
  bun run md2docx.ts convert <input.md> [out]     Convert existing MD to DOCX
  bun run md2docx.ts <input.md> [output.docx]     Quick convert single file

Options:
  --pkg-root <dir>   Package root directory (source for merging)
  --name <name>      Package name (used in document title)
  --id <id>          Package ID (used in output filename)
  --author <name>    Author name [default: Author]
  --template <path>  Custom DOCX template path
  --toc-depth <num>  TOC depth (1-6) [default: 4]
  --toc-title <str>  TOC title [default: Table of Contents]
  --config <json>    JSON configuration for multiple packages: '[{"id":"p1","name":"Pkg1","path":"./dir"}]'

Workflow Modes:
  all      - Complete workflow: merge all packages in targetRoots then convert to DOCX
  merge    - Collect and merge content.md files from directory structure
  convert  - Convert already-merged Markdown to DOCX using pandoc

Examples:
  bun run md2docx.ts all --pkg-root ./my-docs --name "Project Plan"
  bun run md2docx.ts merge --pkg-root ./src --id "FullDraft"
  bun run md2docx.ts convert Draft.md --template custom.docx
  bun run md2docx.ts report.md final.docx

Template Style Mapping:
  # Heading       -> Heading 1 (Top-level, numbered 1.)
  ## Heading      -> Heading 2 (Second-level, numbered 1.1.)
  ### Heading     -> Heading 3 (Third-level, numbered 1.1.1.)
  #### Heading    -> Heading 4 (Fourth-level, numbered 1.1.1.1.)
  Paragraph       -> Body Text (First-line indent, 1.5x line spacing)
  > Quote         -> Block Text (Left gray border)
  \`\`\`code\`\`\`      -> Source Code (Monospace, gray background)
  | Table |       -> Table Grid (Full borders)

Page Settings: A4, top/bottom 2.54cm, left/right 3.17cm
`);
        process.exit(1);
    }

    const command = args[0];

    try {
        if (command === "merge") {
            // Check for --pkg-root flag (preferred) or legacy --path
            const pathIndex = args.indexOf("--path");
            const pkgRootIndex = args.indexOf("--pkg-root");
            
            let customPath = undefined;
            if (pkgRootIndex >= 0 && args[pkgRootIndex + 1]) {
                customPath = args[pkgRootIndex + 1];
            } else if (pathIndex >= 0 && args[pathIndex + 1]) {
                customPath = args[pathIndex + 1];
            }
            
            await runMergeOnly(targetRoots, author, tocTitle, customPath);
        } else if (command === "convert" && args.length >= 2) {
            await runConvertOnly(args[1], templatePath, tocDepth, args[2]);
        } else if (command === "all") {
            await runFullPipeline(targetRoots, author, templatePath, tocDepth, tocTitle);
        } else if (!command.startsWith("--") && command.endsWith(".md")) {
            // Quick convert mode: bun run md2docx.ts input.md [output.docx]
            await runConvertOnly(command, templatePath, tocDepth, args[1]);
        } else {
            console.error("Invalid arguments. Run without arguments to see usage.");
            process.exit(1);
        }
    } catch (error) {
        console.error("[ERROR] Error:", error);
        process.exit(1);
    }
}
