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
 *   bun run check_stats.ts [dir]                   # Analyze Markdown (default)
 */

// const WORDS_PER_PAGE = 800; // Removed per user request

/**
 * Count characters in Markdown files recursively and detect placeholders
 */
async function countMarkdownChars(dir: string): Promise<{ chars: number; files: number; placeholders: string[] }> {
    let totalChars = 0;
    let totalFiles = 0;
    let placeholders: string[] = [];
    
    try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                const result = await countMarkdownChars(fullPath);
                totalChars += result.chars;
                totalFiles += result.files;
                placeholders.push(...result.placeholders);
            } else if (entry.isFile() && entry.name.endsWith(".md")) {
                const content = await Bun.file(fullPath).text();
                
                // Check for placeholder
                if (content.includes("<!-- content placeholder -->")) {
                    placeholders.push(fullPath);
                }

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
    
    return { chars: totalChars, files: totalFiles, placeholders };
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
    
    const { chars, files, placeholders } = await countMarkdownChars(dir);
    
    console.log(`Files analyzed:    ${files}`);
    console.log(`Total characters:  ${chars.toLocaleString()}`);

    if (placeholders.length > 0) {
        console.log(`\n⚠️  Found ${placeholders.length} files with placeholders:`);
        placeholders.forEach(p => console.log(`   - ${p}`));
        console.log(`\n❌ Warning: Document is incomplete.`);
    } else {
        console.log(`\n✅ No placeholders found. Content complete!`);
    }
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

// ============ CLI Entry Point ============
if (import.meta.main) {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === "--help") {
        console.log(`
Usage:
  bun run check_stats.ts --md <dir>               Analyze Markdown directory (stats only)
  bun run check_stats.ts --docx <file> [target]   Check DOCX page count
  bun run check_stats.ts [dir]                    Analyze Markdown (default)

Examples:
  bun run check_stats.ts ./01_TechnicalProposal
  bun run check_stats.ts --docx Package1_Complete_Draft.docx 50
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
