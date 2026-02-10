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
    *   Full pipeline: `bun run md2docx.ts all --pkg-root <dir> --name "Project Name" --author "Your Name"`
    *   Or step by step:
        *   Merge content: `bun run md2docx.ts merge --pkg-root <dir> --id "Draft1"`
        *   Convert to DOCX: `bun run md2docx.ts convert <merged.md> [output.docx]`
    *   **Verify page count**: `bun run check_stats.ts --docx output.docx 150`
    *   If short, expand sections and rebuild.

### Scenario 2: Style Cloning & Format Replacement (In-Place Normalization)
**Trigger**: When user asks to "transfer styles", "clone format", or "make it look like [Reference File]".
**Goal**: Create a high-fidelity clone that preserves headers/footers (Protocol B) rather than just applying fonts (Protocol A).

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

3.  **阅读 `document.xml` - 定位实际使用的样式**:
    *   打开 `word/document.xml` 文件
    *   查找文档中实际段落使用的样式 ID:
        *   搜索 `<w:pStyle w:val="XXX"/>` 找到段落样式引用
        *   例如：找到"第一章"所在的段落，查看其样式 ID（可能是 `CustomTitle1`、`1` 等）
        *   记录各级标题实际使用的样式 ID:
            ```
            一级标题 (如"第一章") → w:val="CustomTitle1" 或 "1"
            二级标题 (如"1.1 背景") → w:val="CustomTitle2" 或 "2"
            正文段落 → w:val="CustomBody" 或 "Normal"
            等等...
            ```
    *   **注意**: DOCX 文件可能使用了自定义样式名称，而非 Pandoc 标准名称

4.  **阅读 `styles.xml` - 理解样式定义**:
    *   打开 `word/styles.xml` 文件
    *   查看每个样式的完整定义:
        ```xml
        <w:style w:type="paragraph" w:styleId="CustomTitle1">
            <w:name w:val="一级标题"/>
            <w:basedOn w:val="Normal"/>
            <w:pPr>
                <w:numPr>
                    <w:numId w:val="1"/>
                </w:numPr>
                <w:spacing w:before="240" w:after="120"/>
            </w:pPr>
            <w:rPr>
                <w:rFonts w:ascii="黑体" w:eastAsia="黑体"/>
                <w:sz w:val="32"/>
                <w:b/>
            </w:rPr>
        </w:style>
        ```
    *   记录每个自定义样式的:
        *   字体（`w:rFonts`）
        *   字号（`w:sz`）
        *   段落间距（`w:spacing`）
        *   编号格式（`w:numPr`）
        *   颜色、加粗、斜体等属性

5.  **修改 `styles.xml` - 标准化为 Pandoc 样式**:
    *   **核心原则**: 保留原有样式的全部视觉属性，但将样式 ID 和名称改为 Pandoc 标准
    *   
    *   **Case A**: 如果模板中已存在 `Heading 1` 样式（但样式不对）:
        *   找到 `CustomTitle1` 的完整 `<w:style>` 节点
        *   将该节点的所有属性（字体、间距、编号等）**完整复制**到现有的 `Heading 1` 节点
        *   确保 `w:styleId="Heading1"` 和 `w:name w:val="Heading 1"`
    *   
    *   **Case B**: 如果模板中不存在 `Heading 1` 样式:
        *   复制整个 `CustomTitle1` 的 `<w:style>` 节点
        *   修改副本的属性:
            ```xml
            <w:style w:type="paragraph" w:styleId="Heading1">
                <w:name w:val="Heading 1"/>
                <!-- 保留原 CustomTitle1 的所有格式属性 -->
            </w:style>
            ```
    *   
    *   **重复此过程**处理所有 Pandoc 必需样式:
        *   `Heading1` - `Heading6` (六级标题)
        *   `BodyText` (正文)
        *   `FirstParagraph` (首段)
        *   `BlockText` (引用块)
        *   `SourceCode` (代码块)
        *   `TableGrid` (表格)
        *   `Title`, `Subtitle` (封面标题)

6.  **验证并重新打包**:
    *   **验证样式完整性**:
        *   检查 `styles.xml` 中是否包含所有 Pandoc 标准样式
        *   确认每个样式的 `w:styleId` 和 `w:name` 都正确
    *   
    *   **重新打包为 DOCX**:
        ```bash
        cd Reference_Extracted/
        zip -r ../Reference_Standardized.docx *
        ```
    *   
    *  
        *   使用 `md2docx.ts` 进行转换:
            比如：```bash
            bun run md2docx.ts test.md output.docx --template Reference_Standardized.docx
            ```
        *   检查生成的 DOCX 文件:
            - 标题样式是否正确应用
            - 编号是否正常工作
            - 页眉页脚是否保留
            - 字体、间距、颜色等是否与原模板一致
    *   
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
- **Modes**:
  - `all`: Full automated pipeline (merge + convert)
  - `merge`: Collect and merge content.md files into a single master Markdown
  - `convert`: Transform any Markdown to DOCX using Pandoc and a reference template
- **Features**:
  - **Dynamic Configuration**: All project-specific metadata (name, author, toc-title) passed via CLI.
  - **Smart Merging**: Hierarchical file collection with numeric sorting and automatic heading level adjustment.
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

