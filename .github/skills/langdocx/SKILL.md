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
撰写文档的时候，优先考虑 使用 subagent 做并发

1.  **Analyze & Design**:
    *   Review requirements.
    *   Create a JSON structure plan (list of chapters/sections).
    
2.  **Initialize Structure**:
    *   Create a file `structure.json` defining the hierarchy.
    *   Run: `bun run langdocx/scripts/init_structure.ts structure.json <target_dir>`
    *   *Result*: A nested folder tree (e.g., `项目背景/行业趋势分析/content.md`).

3.  **Draft & Fill Placeholders**:
    *   **Folder-Driven Content**: Use folder names as titles. **CRITICAL**: Do NOT use numeric prefixes (e.g., `01_Overview`, `1_`, `2.`) in folder names. Use descriptive names directly (e.g., `项目背景`, `系统架构`, `Implementation Plan`). Folder order is determined by file system or alphabetical sorting.
    *   **Strict Purity**: `content.md` should contain **absolutely no `#` headers**. All structure is driven 100% by the folder hierarchy. **Note**: Any line starting with `#` in `content.md` will be **automatically deleted** during processing to ensure folders remain the single source of truth for the document structure.
    *   Replace **all** `<!-- content placeholder -->` in the generated `content.md` files with detailed technical descriptions.
    *   **Writing Style (Human-Centric)**: When drafting content, **strictly avoid fragmented bullet points or summarized lists**. Use full paragraphs with logical transitions and descriptive language. This ensures the document feels human-written and professional rather than AI-summarized.避免使用过多的连接词，比如最后，此外等。
    *   Use `bun run check_stats.ts --md <target_dir>` frequently to monitor the estimated character and page counts during drafting.

4.  **Merge, Build & Validate**:
    *   Build the document: `bun run md2docx.ts all --pkg-root <dir> --name "Project Name" --author "Your Name"`
    *   **Final Verification**: Run `bun run check_stats.ts --docx output.docx <target_pages>` to verify if the output meets the page count requirement.
    *   **Constraint Loop**: If the document is too short or lacks detail, identify thin chapters, expand their `content.md`, and rebuild until the `check_stats.ts` validation passes.

### Scenario 2: Style Cloning & Format Replacement (In-Place Normalization)
**Trigger**: When user asks to "transfer styles", "clone format", or "make it look like [Reference File]".
**Goal**: Create a high-fidelity clone that preserves headers/footers (Protocol B) rather than just applying fonts (Protocol A).

在 First Paragraph 没有的情况下样式应该和 正文一致

**Process Algorithm**:

1.  **前期准备**:
    *   确保安装了解压工具（`unzip` 或使用 AdmZip 等）
    *   准备好参考 DOCX 文件（如政府标准模板、企业格式规范文档等）
    *   了解 Pandoc 标准样式映射要求（见下方列表）

2.  **Unzip 解压模板**:
    *   将参考 DOCX 文件解压到工作目录:
        ```bash
        unzip Reference.docx -d Reference_Extracted/
        ```
    *   解压后得到标准 Office Open XML 目录结构:
        ```
        Reference_Extracted/
        ├── [Content_Types].xml
        ├── _rels/
        ├── docProps/
        └── word/
            ├── document.xml      ← 文档内容和段落样式引用
            ├── styles.xml        ← 样式定义库
            ├── numbering.xml     ← 编号定义
            └── ...
        ```

3.  **脚本化样式逆向与重构 (Scripted Style Refactor)**:
    *   **核心理念**: 放弃手动编辑巨大的 XML 文件。Agent 应当参考 `xml.etree.ElementTree` 的处理模式，编写专门的 Python 脚本来操作 `word/styles.xml`。
    *   **设计目的**: 自动化地将模板中的样式 ID 和名称统一标准化为 Pandoc 兼容集（如 `Heading1`-`Heading6`, `BodyText`, `FirstParagraph`），同时精准继承原始模板的视觉属性（字号、缩进、行间距、中西文字体）。
    *   **实现提醒**: 脚本应具备清理冲突样式、定义缺失标准样式以及处理 `word/numbering.xml` 关联的能力。在执行任务时，Agent 应优先根据当前参考文件的 `document.xml` 使用习惯，**即时构建并运行**一个定制化的标准化脚本。

4.  **验证并重新打包**:
    *   **验证样式完整性**:
        *   检查 `styles.xml` 中是否包含所有 Pandoc 标准样式
        *   确认每个样式的 `w:styleId` 和 `w:name` 都正确
    *   **重新打包为 DOCX**
    *   **端到端测试**:
        *   使用 `md2docx.ts` 进行转换测试，检查生成的 DOCX 是否完美继承了原模板的页眉页脚、标题样式和编号习惯。
    *   **Outcome**: A template that looks identical to the original (same headers/footers) but responds correctly to Pandoc's standard `# Heading 1` output.

**Pandoc 标准样式映射参考**:
| Pandoc 样式 ID | 样式名称 | 用途 | Markdown 对应 |
|---------------|---------|------|--------------|
| `Heading1` | Heading 1 | 一级标题 | `# Title` |
| `Heading2` | Heading 2 | 二级标题 | `## Title` |
| `Heading3` | Heading 3 | 三级标题 | `### Title` |
| `Heading4` | Heading 4 | 四级标题 | `#### Title` |
| `Heading5` | Heading 5 | 五级标题 | `##### Title` |
| `Heading6` | Heading 6 | 六级标题 | `###### Title` |
| `BodyText` | Body Text | 正文段落 | `Paragraph` |
| `FirstParagraph` | First Paragraph | 标题后首段 | (自动) |
| `BlockText` | Block Text | 引用块 | `> Quote` |
| `SourceCode` | Source Code | 代码块 | ` ```code``` ` |
| `Compact` | Compact | 紧凑列表 | `- item` |
| `TableGrid` | Table Grid | 表格 | `\| table \|` |
| `Title` | Title | 文档标题 | `title:` (YAML) |
| `Subtitle` | Subtitle | 副标题 | `subtitle:` (YAML) |



## Tools & Scripts

### `scripts/init_structure.ts`
Scaffolds the project folder.
- **Input**: structure.json (Recursive node array: `{ name, children[] }`)
- **Output**: Directories and `content.md` files.

### `scripts/md2docx.ts` ⭐ UNIFIED WORKFLOW TOOL
Complete Markdown to DOCX pipeline with high flexibility. No hardcoded project content.
- **Folder-Driven Standardization**: 
  - **Dynamic Title Generation**: Automatically converts folder names to headers.
  - **Legacy Prefix Handling**: For backward compatibility, strips numeric sequence prefixes (like `01_`, `1. `, `2 `) if present. However, **new projects should NOT use numeric prefixes** in folder names.
  - **Content Purity**: Enforces a standard where `content.md` contains only the body, while structure is defined by the file system.
- **Modes**:
  - `all`: Full automated pipeline (merge + convert)
  - `merge`: Collect and merge content.md files into a single master Markdown
  - `convert`: Transform any Markdown to DOCX using Pandoc and a reference template
- **Features**:
  - **Dynamic Configuration**: All project-specific metadata (name, author, toc-title) passed via CLI.
  - **Smart Merging**: Hierarchical file collection with automatic folder sorting and heading level adjustment.
  - **Zero-Config Defaults**: Sensible defaults for TOC depth and layout, overrideable via flags.
  - **Template Support**: Uses `template.docx` for high-fidelity styling.
- **Dependency**: Requires `pandoc` (globally installed) and a reference `template.docx`.
- **Usage Examples**:
  - Full pipeline: `bun run md2docx.ts all --pkg-root ./docs --name "Technical Solution" --author "Author Name"`
  - Merge only: `bun run md2docx.ts merge --pkg-root ./01_Chapter --id "Chapter1_Draft"`
  - Convert only: `bun run md2docx.ts convert Master.md Final.docx --template ref.docx`
  - Custom TOC: `bun run md2docx.ts all --pkg-root . --toc-title "Index" --toc-depth 3`

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

