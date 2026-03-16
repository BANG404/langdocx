---
name: langdocx
description: Specialist skill for authoring long-form technical documents (50-200 pages). Features automated directory structure generation, multi-file merging, and character count validation to ensure documents meet length requirements.
license: Apache-2.0
compatibility: "Run with Bun. Requires Pandoc."
metadata:
  version: "3.0"
  author: "IUMM"
---

# langdocx

This skill transforms the workspace into a professional **Technical Document Factory**. It provides a structured workflow for generating massive DOCX deliverables, with character count validation to ensure documents meet length requirements.

## Best Practices & Agent Strategies

*   **Subagent Concurrency**: When generating large-scale content, use subagents to draft multiple `content.md` files in parallel to maximize throughput and maintain consistent detail across chapters.
*   **Progressive Drafting**: Start with a detailed `structure.json`, then initialize the folders, and systematically fill the sections.
*   **Pathing**: Always run scripts relative to the skill root if possible, or use the full path provided in the examples.

## Key Patterns

### Scenario 1: Authoring Long Technical Documents
Use this workflow when the user asks to "write a long-form document".

1.  **Analyze & Design**:
    *   Review requirements.
    *   Create a JSON structure plan (list of chapters/sections).
    
2.  **Initialize Structure**:
    *   Create a file `structure.json` defining the hierarchy.
    *   **Naming rule**: Use semantic names **without** sorting prefixes in `structure.json` (e.g., `Project_Overview`, `Technical_Framework`, not `01_Project_Overview`).
    *   Run: `bun run scripts/init_structure.ts structure.json <target_dir>`
    *   *Result*: The script auto-generates prefixed folders (e.g., `01_Project_Background/01_Industry_Trends/content.md`).

3.  **Draft & Fill Placeholders**:
    *   **Folder-Driven Content**: Use folder names as titles. Keep semantic names in planning files, and rely on `init_structure.ts` to add sortable prefixes on disk.
    *   **Strict Purity**: `content.md` should contain **absolutely no `#` headers**. All structure is driven 100% by the folder hierarchy.
    *   Replace **all** `<!-- content placeholder -->` in the generated `content.md` files with detailed technical descriptions.
    *   **Writing Style (Human-Centric)**: strictly avoid fragmented bullet points or summarized lists. Use full paragraphs with logical transitions and descriptive language. Avoid repetitive transition words like "Finally" or "Furthermore".
    *   Use `bun run scripts/check_stats.ts --md <target_dir> [min-chars]` frequently to monitor the estimated character and page counts during drafting. Optionally specify minimum character count to check if document meets length requirements.

4.  **Merge, Build & Validate**:
    *   Build the document: `bun run scripts/md2docx.ts all --pkg-root <dir> --name "Project Name" --author "Your Name"`
    *   **Prefix normalization**: `md2docx.ts` keeps prefixed folders for deterministic traversal order, then automatically removes those prefixes from final headings.
    *   **Final Verification**: 
        *   Run `bun run scripts/check_stats.ts --md <target_dir> <min_chars>` to verify character count meets the minimum requirement.
    *   **Constraint Loop**: If the document is too short or lacks detail, identify thin chapters, expand their `content.md`, and rebuild until the character count validation passes.



## Tools & Scripts

### `scripts/init_structure.ts`
Scaffolds the project folder.
- **Input**: `structure.json` (Recursive node array, names without numeric prefixes)
- **Output**: Prefixed directories (`01_`, `02_`, ...) and `content.md` files.

### `scripts/md2docx.ts` ⭐ UNIFIED WORKFLOW TOOL
Complete Markdown to DOCX pipeline.
- **Modes**: `all`, `merge`, `convert`.
- **Features**: Dynamic configuration, smart merging, hierarchical file collection, and heading prefix cleanup on merge.
- **Dependency**: Requires `pandoc` and a reference document via `--template`.

### `scripts/check_stats.ts` ⭐ UNIFIED ANALYSIS TOOL
Document statistics and character count validation.
- **Usage**: 
  - `bun run check_stats.ts --md <dir> [min-chars]` - Analyze Markdown files, optionally check against minimum character count threshold.
  - `bun run check_stats.ts <dir> [min-chars]` - Default mode, analyzes Markdown with optional character count validation.
- **Features**: 
  - Character count and placeholder detection for Markdown.
  - Returns exit code 0 on success, 1 on failure (useful in CI/CD pipelines).