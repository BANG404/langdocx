---
name: langdocx
description: Specialist skill for authoring long-form technical proposals (50-200 pages) and performing high-fidelity document format cloning. Features automated directory structure generation, multi-file merging, and semantic style extraction from reference DOCX files.
license: Apache-2.0
compatibility: "Run with Bun. Requires Pandoc."
metadata:
  version: "2.1"
  author: "IUMM"
---

# langdocx

This skill transforms the workspace into a professional **Technical Document Factory**. It provides a structured workflow for generating massive PDF/DOCX deliverables and "cloning" the visual style of arbitrary reference documents (like government standards or corporate templates).

## Best Practices & Agent Strategies

*   **Subagent Concurrency**: When generating large-scale content (e.g., 100+ pages), use subagents to draft multiple `content.md` files in parallel to maximize throughput and maintain consistent detail across chapters.
*   **Progressive Drafting**: Start with a detailed `structure.json`, then initialize the folders, and systematically fill the sections.
*   **Pathing**: Always run scripts relative to the skill root if possible, or use the full path provided in the examples.

## Key Patterns

### Scenario 1: Authoring Long Technical Documents
Use this workflow when the user asks to "write a 100-page solution" or "expand this into a full technical proposal".

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
    *   Use `bun run scripts/check_stats.ts --md <target_dir>` frequently to monitor the estimated character and page counts during drafting.

4.  **Merge, Build & Validate**:
    *   Build the document: `bun run scripts/md2docx.ts all --pkg-root <dir> --name "Project Name" --author "Your Name"`
    *   **Prefix normalization**: `md2docx.ts` keeps prefixed folders for deterministic traversal order, then automatically removes those prefixes from final headings.
    *   **Final Verification**: Run `bun run scripts/check_stats.ts --docx output.docx <target_pages>` to verify if the output meets the page count requirement.
    *   **Constraint Loop**: If the document is too short or lacks detail, identify thin chapters, expand their `content.md`, and rebuild until validation passes.

### Scenario 2: Style Cloning & Format Replacement (In-Place Normalization)
**Trigger**: When user asks to "transfer styles", "clone format", or "make it look like [Reference File]".
**Goal**: Create a high-fidelity clone that preserves headers/footers (Protocol B) rather than just applying fonts (Protocol A).

**Process Algorithm**:

1.  **Preparation**:
    *   Ensure extraction tools are installed (`unzip`).
    *   Prepare a reference DOCX file (e.g., government standards or corporate guidelines).
    *   Review Pandoc standard style mapping requirements (see list below).

2.  **Unzip Reference**:
    *   Extract the reference DOCX:
        ```bash
        unzip Reference.docx -d Reference_Extracted/
        ```
    *   Structure:
        ```
        Reference_Extracted/
        ├── [Content_Types].xml
        ├── word/
            ├── document.xml      ← Content and paragraph style references
            ├── styles.xml        ← Style definitions
            └── ...
        ```

3.  **Scripted Style Refactor**:
    *   **Core Concept**: Avoid manual XML editing. Use Python with `xml.etree.ElementTree` to manipulate `word/styles.xml`.
    *   **Objective**: Standardize style IDs and names to Pandoc-compatible sets (e.g., `Heading1`-`Heading6`, `BodyText`, `FirstParagraph`) while preserving original visual attributes (font size, indentation, spacing).
    *   **Implementation**: Create a custom normalization script based on the specific `document.xml` of the reference file. The `FirstParagraph` style should match `BodyText` if no specific first-paragraph style exists.

4.  **Validate & Pack**:
    *   **Verify Style Integrity**: Ensure `styles.xml` contains all Pandoc standard styles with correct `w:styleId` and `w:name`.
    *   **Repackage to DOCX**.
    *   **Testing**: Run `scripts/md2docx.ts` to verify the generated document correctly inherits headers, footers, and styles.

**Pandoc Standard Style Mapping**:
| Pandoc Style ID | Style Name | Usage | Markdown Equivalent |
|---------------|---------|------|--------------|
| `Heading1` | Heading 1 | Level 1 Header | `# Title` |
| `Heading2` | Heading 2 | Level 2 Header | `## Title` |
| `Heading3` | Heading 3 | Level 3 Header | `### Title` |
| `Heading4` | Heading 4 | Level 4 Header | `#### Title` |
| `Heading5` | Heading 5 | Level 5 Header | `##### Title` |
| `Heading6` | Heading 6 | Level 6 Header | `###### Title` |
| `BodyText` | Body Text | Standard Paragraph | `Paragraph` |
| `FirstParagraph` | First Paragraph | First para after header | (Automatic) |
| `TableGrid` | Table Grid | Table style | `| table |` |
| `Title` | Title | Document Title | `title:` (YAML) |

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
Document statistics and validation.
- **Modes**: `--md`, `--docx`.
- **Usage**: Estimate page counts and validate deliverables.

