#!/usr/bin/env bun
import { $ } from "bun";
import { readdir } from "node:fs/promises";
import { join } from "path";

/**
 * check_stats.ts - Unified Document Statistics Tool
 * 
 * Provides multiple analysis modes:
 * - MD analysis: Count characters and estimate pages from Markdown files
 * - DOCX analysis: Extract actual page count from generated DOCX files
 * - Combined analysis: Compare estimated vs actual pages
 * 
 * Usage:
 *   bun run check_stats.ts --md <dir>              # Analyze Markdown directory
 *   bun run check_stats.ts --docx <file> [target]  # Check DOCX page count
 *   bun run check_stats.ts --all <dir> <docx>      # Compare MD estimate vs DOCX actual
 *   bun run check_stats.ts [dir]                   # Analyze Markdown (default)
 */

const WORDS_PER_PAGE = 800; // Adjust based on font size/line height

/**
 * Count characters in Markdown files recursively
 */
async function countMarkdownChars(dir: string): Promise<{ chars: number; files: number }> {
    let totalChars = 0;
    let totalFiles = 0;
    
    try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                const result = await countMarkdownChars(fullPath);
                totalChars += result.chars;
                totalFiles += result.files;
            } else if (entry.isFile() && entry.name.endsWith(".md")) {
                const content = await Bun.file(fullPath).text();
                // Remove code blocks, html tags, comments, whitespace for rough char count
                const clean = content
                    .replace(/```[\s\S]*?```/g, "")
                    .replace(/<!--.*?-->/gs, "")
                    .replace(/<[^>]+>/g, "")
                    .replace(/\s+/g, "");
                totalChars += clean.length;
                totalFiles += 1;
            }
        }
    } catch (e) {
        console.error(`Error reading directory ${dir}:`, e);
    }
    
    return { chars: totalChars, files: totalFiles };
}

/**
 * Extract page count from DOCX file's metadata
 */
async function getDocxPageCount(docxPath: string): Promise<number> {
    try {
        // Extract app.xml from docx (which is a zip archive)
        const tempDir = `/tmp/docx_check_${Date.now()}`;
        await $`mkdir -p ${tempDir}`;
        await $`unzip -q ${docxPath} -d ${tempDir}`;
        
        const appXmlPath = join(tempDir, "docProps/app.xml");
        const appXml = await Bun.file(appXmlPath).text();
        
        // Parse <Pages>N</Pages> tag
        const match = appXml.match(/<Pages>(\d+)<\/Pages>/);
        const pageCount = match ? parseInt(match[1]) : 0;
        
        // Cleanup
        await $`rm -rf ${tempDir}`;
        
        return pageCount;
    } catch (error) {
        console.error("Error reading DOCX page count:", error);
        return 0;
    }
}

/**
 * Analyze Markdown directory
 */
async function analyzeMarkdown(dir: string): Promise<void> {
    console.log(`\n📊 Analyzing Markdown files in: ${dir}\n`);
    
    const { chars, files } = await countMarkdownChars(dir);
    const estimatedPages = (chars / WORDS_PER_PAGE).toFixed(1);
    
    console.log(`Files analyzed:    ${files}`);
    console.log(`Total characters:  ${chars.toLocaleString()}`);
    console.log(`Estimated pages:   ${estimatedPages} (at ${WORDS_PER_PAGE} chars/page)`);
}

/**
 * Analyze DOCX file
 */
async function analyzeDocx(docxPath: string, targetPages?: number): Promise<boolean> {
    console.log(`\n📄 Analyzing DOCX file: ${docxPath}\n`);
    
    const actualPages = await getDocxPageCount(docxPath);
    
    console.log(`Actual pages: ${actualPages}`);
    
    if (targetPages) {
        const difference = actualPages - targetPages;
        const percentage = ((actualPages / targetPages) * 100).toFixed(1);
        
        console.log(`Target pages: ${targetPages}`);
        console.log(`Completion:   ${percentage}%`);
        
        if (difference >= 0) {
            console.log(`✅ Target met! (${difference > 0 ? '+' + difference : difference} pages)`);
            return true;
        } else {
            console.log(`❌ Short by ${Math.abs(difference)} pages`);
            return false;
        }
    }
    
    return true;
}

/**
 * Compare Markdown estimate with DOCX actual
 */
async function compareAll(mdDir: string, docxPath: string): Promise<void> {
    console.log(`\n📊 Comprehensive Analysis\n`);
    console.log(`Markdown source: ${mdDir}`);
    console.log(`DOCX output:     ${docxPath}\n`);
    
    // Analyze Markdown
    const { chars, files } = await countMarkdownChars(mdDir);
    const estimatedPages = chars / WORDS_PER_PAGE;
    
    console.log(`--- Source Analysis ---`);
    console.log(`Files:             ${files}`);
    console.log(`Characters:        ${chars.toLocaleString()}`);
    console.log(`Estimated pages:   ${estimatedPages.toFixed(1)}\n`);
    
    // Analyze DOCX
    const actualPages = await getDocxPageCount(docxPath);
    
    console.log(`--- Output Analysis ---`);
    console.log(`Actual pages:      ${actualPages}`);
    
    // Compare
    const difference = actualPages - estimatedPages;
    const accuracy = ((actualPages / estimatedPages) * 100).toFixed(1);
    
    console.log(`\n--- Comparison ---`);
    console.log(`Estimation accuracy: ${accuracy}%`);
    console.log(`Difference:          ${difference > 0 ? '+' : ''}${difference.toFixed(1)} pages`);
    
    if (Math.abs(difference) <= estimatedPages * 0.1) {
        console.log(`✅ Estimation is accurate (within 10%)`);
    } else {
        console.log(`⚠️  Consider adjusting WORDS_PER_PAGE constant (current: ${WORDS_PER_PAGE})`);
    }
}

// ============ CLI Entry Point ============
if (import.meta.main) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Usage:
  bun run check_stats.ts --md <dir>               Analyze Markdown directory
  bun run check_stats.ts --docx <file> [target]   Check DOCX page count
  bun run check_stats.ts --all <dir> <docx>       Compare MD vs DOCX
  bun run check_stats.ts [dir]                    Analyze Markdown (default)

Examples:
  bun run check_stats.ts ./01_TechnicalProposal
  bun run check_stats.ts --docx Package1_Complete_Draft.docx 50
  bun run check_stats.ts --all ./01_TechnicalProposal Package1_Complete_Draft.docx
`);
        process.exit(1);
    }
    
    try {
        const mode = args[0];
        
        if (mode === "--md" && args.length >= 2) {
            await analyzeMarkdown(args[1]);
        } else if (mode === "--docx" && args.length >= 2) {
            const target = args[2] ? parseInt(args[2]) : undefined;
            const success = await analyzeDocx(args[1], target);
            process.exit(success ? 0 : 1);
        } else if (mode === "--all" && args.length >= 3) {
            await compareAll(args[1], args[2]);
        } else if (!mode.startsWith("--")) {
            // Default: analyze markdown
            await analyzeMarkdown(mode);
        } else {
            console.error("Invalid arguments. Use --help for usage information.");
            process.exit(1);
        }
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
