#!/usr/bin/env bun
import { readdir } from "node:fs/promises";
import { join } from "path";

/**
 * check_stats.ts - Document Character Count & Validation Tool
 *
 * Usage:
 *   bun run check_stats.ts --md <dir> [min-chars]   # Analyze Markdown directory
 *   bun run check_stats.ts [dir] [min-chars]         # Analyze Markdown (default)
 *
 * min-chars: Minimum character count threshold for document completion check
 */

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
 * Analyze Markdown directory
 */
async function analyzeMarkdown(dir: string, minChars?: number): Promise<boolean> {
    console.log(`\n📊 Analyzing Markdown files in: ${dir}\n`);
    
    const { chars, files, placeholders } = await countMarkdownChars(dir);
    
    console.log(`Files analyzed:    ${files}`);
    console.log(`Total characters:  ${chars.toLocaleString()}`);
    
    // Check character count threshold
    let charThresholdMet = true;
    if (minChars !== undefined) {
        const percentage = ((chars / minChars) * 100).toFixed(1);
        console.log(`\n📏 Character Count Check:`);
        console.log(`   Target:     ${minChars.toLocaleString()} chars`);
        console.log(`   Current:    ${chars.toLocaleString()} chars`);
        console.log(`   Completion: ${percentage}%`);
        
        if (chars >= minChars) {
            const surplus = chars - minChars;
            console.log(`   ✅ Target met! (+${surplus.toLocaleString()} chars)`);
        } else {
            const shortage = minChars - chars;
            console.log(`   ❌ Short by ${shortage.toLocaleString()} chars`);
            charThresholdMet = false;
        }
    }

    // Check for placeholders
    let placeholderCheckPassed = true;
    if (placeholders.length > 0) {
        console.log(`\n⚠️  Found ${placeholders.length} files with placeholders:`);
        placeholders.forEach(p => console.log(`   - ${p}`));
        console.log(`\n❌ Warning: Document is incomplete.`);
        placeholderCheckPassed = false;
    } else {
        console.log(`\n✅ No placeholders found. Content complete!`);
    }
    
    return charThresholdMet && placeholderCheckPassed;
}

// ============ CLI Entry Point ============
if (import.meta.main) {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === "--help") {
        console.log(`
Usage:
  bun run check_stats.ts --md <dir> [min-chars]   Analyze Markdown directory
  bun run check_stats.ts [dir] [min-chars]         Analyze Markdown (default)

Parameters:
  dir:       Directory containing Markdown files
  min-chars: Minimum character count threshold (optional)

Examples:
  bun run check_stats.ts ./01_TechnicalProposal
  bun run check_stats.ts ./01_TechnicalProposal 50000
  bun run check_stats.ts --md ./project 100000
`);
        process.exit(1);
    }
    
    try {
        const mode = args[0];
        
        if (mode === "--md" && args.length >= 2) {
            const minChars = args[2] ? parseInt(args[2]) : undefined;
            const success = await analyzeMarkdown(args[1], minChars);
            process.exit(success ? 0 : 1);
        } else if (!mode.startsWith("--")) {
            // Default: analyze markdown
            const minChars = args[1] ? parseInt(args[1]) : undefined;
            const success = await analyzeMarkdown(mode, minChars);
            process.exit(success ? 0 : 1);
        } else {
            console.error("Invalid arguments. Use --help for usage information.");
            process.exit(1);
        }
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
