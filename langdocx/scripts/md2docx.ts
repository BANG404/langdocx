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

const PROJECT_ROOT = dirname(import.meta.path);
const TEMPLATE_PATH = process.env.DOCX_TEMPLATE || join(PROJECT_ROOT, "../template.docx");
const TOC_DEPTH = parseInt(process.env.DOCX_TOC_DEPTH || "4");

// ============ Configuration ============
export let TARGET_ROOTS = [
    {
        id: process.env.DOCX_PKG_ID || "Package1",
        name: process.env.DOCX_PKG_NAME || "Technical Proposal Package 1",
        path: process.env.DOCX_PKG_PATH || "./01_TechnicalProposal"
    }
];

// Override entire config via environment variable if needed
if (process.env.DOCX_CONFIG) {
    try {
        TARGET_ROOTS = JSON.parse(process.env.DOCX_CONFIG);
    } catch (e) {
        console.warn("Failed to parse DOCX_CONFIG, using default configuration");
    }
}

export const AUTHOR = process.env.DOCX_AUTHOR || "Author Name";

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

export async function mergePackage(pkgPath: string, pkgName: string, pkgId: string): Promise<string> {
    console.log(`\n📦 Merging ${pkgName}...`);
    const files = await getFiles(pkgPath);
    let fullContent = "";

    fullContent += `---\n`;
    fullContent += `title: "${pkgName}"\n`;
    fullContent += `author: "${AUTHOR}"\n`;
    fullContent += `date: "${new Date().toLocaleDateString()}"\n`;
    fullContent += `toc: true\n`;
    fullContent += `toc-title: "Table of Contents"\n`;
    fullContent += `--- \n\n`;

    for (const f of files) {
        const relPath = relative(pkgPath, f);
        // Directory depth: 01_Overview/content.md → depth 0 (chapter level, H1 unchanged)
        //                  01_Overview/01_Section/content.md → depth 1 (# becomes ##)
        const depth = Math.max(0, relPath.split("/").length - 2);
        let rawContent = await file(f).text();

        // Optimization: add page break before each top-level chapter
        if (depth === 0 && fullContent.length > 500) {
            fullContent += `\n\n\\newpage\n\n`; 
        }

        if (depth > 0) {
            const headerPrefix = "#".repeat(depth);
            rawContent = rawContent.replace(/^(#+ )/gm, headerPrefix + "$1");
        }

        fullContent += `\n\n<!-- Source: ${relPath} -->\n\n`;
        fullContent += rawContent;
        fullContent += "\n";
    }

    const charCount = countContentChars(fullContent);

    console.log(`✅ ${pkgId} merge complete:`);
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
    // Remove HTML comments
    let processed = content.replace(/<!--.*?-->/gs, "");

    // Remove \newpage (replaced by pandoc page breaks if needed)
    processed = processed.replace(/\\newpage/g, "");

    // Remove manual numbering in headings to avoid conflicts with DOCX template auto-numbering
    // Match patterns:
    //   ## 2.1 Heading    → ## Heading
    //   ### 2.1.1 Heading → ### Heading
    //   ## 1. Heading     → ## Heading
    //   ### 3.2.1. Heading → ### Heading
    processed = processed.replace(
        /^(#{1,6})\s+\d+(?:\.\d+)*\.?\s+/gm,
        "$1 "
    );

    // Handle consecutive blank lines (merge more than 2 into 2)
    processed = processed.replace(/\n{4,}/g, "\n\n\n");

    return processed;
}

/**
 * Convert Markdown file to DOCX using pandoc
 */
async function convertMdToDocx(
    inputMd: string,
    outputDocx: string,
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

    if (!existsSync(TEMPLATE_PATH)) {
        throw new Error(`Template file not found: ${TEMPLATE_PATH}`);
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
        "--reference-doc", TEMPLATE_PATH,
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

    console.log(`📝 Converting: ${basename(inputMd)} → ${basename(outputDocx)}`);
    console.log(`   Template: ${basename(TEMPLATE_PATH)}`);

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
    console.log(`✅ Conversion successful: ${outputDocx}`);
    console.log(`   File size: ${(stat.size / 1024).toFixed(1)} KB`);
}

// ============ Workflow Functions ============

/**
 * Merge only - collect and merge Markdown files
 */
async function runMergeOnly(packagePath?: string): Promise<void> {
    if (packagePath) {
        // Custom single package
        const pkgName = basename(packagePath);
        const pkgId = pkgName;
        const mergedPath = await mergePackage(packagePath, pkgName, pkgId);
        console.log(`\n📄 Merged file: ${mergedPath}`);
    } else {
        // Default packages
        for (const root of TARGET_ROOTS) {
            try {
                const mergedPath = await mergePackage(root.path, root.name, root.id);
                console.log(`\n📄 Merged file: ${mergedPath}`);
            } catch (e) {
                console.error(`❌ Error merging ${root.name}:`, e);
            }
        }
    }
}

/**
 * Convert only - convert existing Markdown to DOCX
 */
async function runConvertOnly(inputPath: string, outputPath?: string): Promise<void> {
    const input = resolve(inputPath);
    const output = outputPath
        ? resolve(outputPath)
        : input.replace(/\.md$/, ".docx");

    await convertMdToDocx(input, output, {
        toc: true,
        tocDepth: TOC_DEPTH,
    });
}

/**
 * Full pipeline - merge and convert all packages
 */
async function runFullPipeline(): Promise<void> {
    console.log("🚀 Starting full pipeline: merge + convert...\n");

    for (const root of TARGET_ROOTS) {
        try {
            // First merge Markdown
            const mergedMdPath = await mergePackage(root.path, root.name, root.id);

            // Then convert to DOCX
            const docxPath = mergedMdPath.replace(/\.md$/, ".docx");
            await convertMdToDocx(mergedMdPath, docxPath, {
                toc: true,
                tocDepth: TOC_DEPTH,
            });

            console.log(`\n📦 ${root.name} complete!`);
            console.log(`   MD:   ${mergedMdPath}`);
            console.log(`   DOCX: ${docxPath}\n`);
        } catch (e) {
            console.error(`❌ Error processing ${root.name}:`, e);
        }
    }

    console.log("\n🎉 All conversions complete!");
}

// ============ CLI Entry Point ============
if (import.meta.main) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
md2docx.ts - Unified Markdown to DOCX Workflow Tool

Usage:
  bun run md2docx.ts merge [--path <dir>]         Merge content.md files only
  bun run md2docx.ts convert <input.md> [out]     Convert existing MD to DOCX
  bun run md2docx.ts all                          Full pipeline (merge + convert)
  bun run md2docx.ts <input.md> [output.docx]     Quick convert single file

Workflow Modes:
  merge    - Collect and merge content.md files from directory structure
  convert  - Convert already-merged Markdown to DOCX using pandoc
  all      - Complete workflow: merge all packages then convert to DOCX

Examples:
  bun run md2docx.ts merge --path ./01_TechnicalProposal
  bun run md2docx.ts convert Package1_Complete_Draft.md
  bun run md2docx.ts all
  bun run md2docx.ts my-document.md output.docx

Configuration (via environment variables):
  DOCX_TEMPLATE       Path to reference template (default: ../template.docx)
  DOCX_TOC_DEPTH      Table of contents depth (default: 4)
  DOCX_AUTHOR         Document author name
  DOCX_PKG_PATH       Single package path
  DOCX_PKG_NAME       Single package name
  DOCX_PKG_ID         Single package ID
  DOCX_CONFIG         Full JSON config for multiple packages

Template Style Mapping:
  # Heading       → Heading 1 (Top-level, numbered 1.)
  ## Heading      → Heading 2 (Second-level, numbered 1.1.)
  ### Heading     → Heading 3 (Third-level, numbered 1.1.1.)
  #### Heading    → Heading 4 (Fourth-level, numbered 1.1.1.1.)
  Paragraph       → Body Text (First-line indent, 1.5x line spacing)
  > Quote         → Block Text (Left gray border)
  \`\`\`code\`\`\`      → Source Code (Monospace, gray background)
  | Table |       → Table Grid (Full borders)

Page Settings: A4, top/bottom 2.54cm, left/right 3.17cm
`);
        process.exit(1);
    }

    const command = args[0];

    try {
        if (command === "merge") {
            // Check for --path flag
            const pathIndex = args.indexOf("--path");
            const customPath = pathIndex >= 0 && args[pathIndex + 1] ? args[pathIndex + 1] : undefined;
            await runMergeOnly(customPath);
        } else if (command === "convert" && args.length >= 2) {
            await runConvertOnly(args[1], args[2]);
        } else if (command === "all") {
            await runFullPipeline();
        } else if (!command.startsWith("--") && command.endsWith(".md")) {
            // Quick convert mode: bun run md2docx.ts input.md [output.docx]
            await runConvertOnly(command, args[1]);
        } else {
            console.error("Invalid arguments. Run without arguments to see usage.");
            process.exit(1);
        }
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

