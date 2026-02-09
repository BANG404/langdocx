---
name: langdocx
description: Specialist skill for authoring long-form technical proposals (50-200 pages) and performing high-fidelity document format cloning. Features automated directory structure generation, multi-file merging, and semantic style extraction from reference DOCX files.
license: MIT
metadata:
  version: "2.0"
  author: "Copilot"
  compatibility: "Run with Bun. Requires Pandoc."
---

# langdocx

This skill transforms the workspace into a professional **Technical Document Factory**. It provides a structured workflow for generating massive PDF/DOCX deliverables and "cloning" the visual style of arbitrary reference documents (like government standards or corporate templates).

## Key Patterns

### Scenario 1: Authoring Long Technical Documents
Use this workflow when the user asks to "write a 100-page solution" or "expand this into a full technical proposal".

1.  **Analyze & Design**:
    *   Review requirements.
    *   Create a JSON structure plan (list of chapters/sections).
    
2.  **Initialize Structure**:
    *   Create a file `structure.json` defining the hierarchy.
    *   Run: `bun run langdocx/scripts/init_structure.ts structure.json <target_dir>`
    *   *Result*: A nested folder tree (e.g., `01_Chapter/02_Section/content.md`).

3.  **Draft & Iteratively Expand**:
    *   Edit `content.md` files in the generated folders.
    *   Continue drafting until satisfied with content depth and coverage.

4.  **Merge & Build**:
    *   Full pipeline: `bun run langdocx/scripts/md2docx.ts all`
    *   Or step by step:
        *   Merge content: `bun run langdocx/scripts/md2docx.ts merge`
        *   Convert to DOCX: `bun run langdocx/scripts/md2docx.ts convert <merged.md>`
    *   **Verify page count**: `bun run langdocx/scripts/check_stats.ts --docx output.docx 150`
    *   If short, expand sections and rebuild.

### Scenario 2: Style Cloning & Format Replacement
Use this workflow when the user says "Make my document look like THIS file".

1.  **Extract Reference DNA**:
    *   Get `word/styles.xml` and `word/numbering.xml` from the user's reference DOCX.
    *   *Command*: `unzip reference.docx -d existing_styles/` (or similar).

2.  **Analyze Semantic Styles**:
    *   Map visual styles to semantic Markdown elements.
    *   *Key mappings*:
        *   `Heading 1` -> `# Title`
        *   `Heading 2` -> `## Subtitle`
        *   `Normal` / `Body Text` -> Paragraphs
        *   `List Paragraph` -> Bullet/Numbered lists

3.  **Create Template**:
    *   Generate a `template.docx` that matches the reference's internal style IDs.
    *   Use this template in the build step (Scenario 1, Step 4).


## Tools & Scripts

### `scripts/init_structure.ts`
Scaffolds the project folder.
- **Input**: structure.json (Recursive node array: `{ name, children[] }`)
- **Output**: Directories and `content.md` files.

### `scripts/md2docx.ts` ⭐ UNIFIED WORKFLOW TOOL
Complete Markdown to DOCX pipeline with granular control.
- **Modes**:
  - `merge`: Collect and merge content.md files from directory structure
  - `convert`: Transform Markdown to DOCX using Pandoc
  - `all`: Full automated pipeline (merge + convert)
- **Features**:
  - Hierarchical file collection with numeric sorting
  - Automatic heading level adjustment based on directory depth
  - YAML frontmatter injection for Pandoc
  - Template-based style application
- **Dependency**: Requires `pandoc` and `template.docx`
- **Usage Examples**:
  - Full pipeline: `bun run md2docx.ts all`
  - Merge only: `bun run md2docx.ts merge [--path <dir>]`
  - Convert only: `bun run md2docx.ts convert <input.md> [output.docx]`
  - Quick convert: `bun run md2docx.ts document.md`

### `scripts/check_stats.ts` ⭐ UNIFIED ANALYSIS TOOL
Comprehensive document statistics and validation.
- **Modes**:
  - `--md <dir>`: Count characters and estimate pages from Markdown
  - `--docx <file> [target]`: Extract actual page count from DOCX
  - `--all <dir> <docx>`: Compare estimated vs actual pages
- **Features**:
  - Character counting with preprocessing (removes code blocks, comments)
  - DOCX metadata extraction from `docProps/app.xml`
  - Target validation with exit codes (0=success, 1=short)
  - Accuracy comparison and calibration advice
- **Usage Examples**:
  - Estimate pages: `bun run check_stats.ts ./project`
  - Validate DOCX: `bun run check_stats.ts --docx output.docx 150`
  - Compare: `bun run check_stats.ts --all ./project output.docx`


## Reference Files
*   `references/SCRIPTS_GUIDE.md`: Comprehensive documentation for all scripts, including usage examples, workflows, troubleshooting, and advanced customization. **Read this when you need detailed script information.**
*   `references/PROJECT_STRUCTURE_EXAMPLES.md`: Examples of JSON structures for common document types.
