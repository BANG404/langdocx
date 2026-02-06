---
name: langdocx
description: "Expert skill for writing and expanding long-form technical documents (50-200 pages) with reference-based semantic formatting. Use when: 1) User requests writing or expanding detailed technical proposals, specifications, or reports; 2) User needs to convert existing documents to match a reference template's formatting; 3) User mentions 'long document', 'technical proposal', 'reference document', 'format conversion', or 'expand content'; 4) Multi-chapter structured documents need consistent styling. Supports Markdown-to-DOCX with automated style mapping and multi-file merging."
license: Proprietary
metadata:
  version: "1.0.0"
  author: "Technical Documentation Team"
  compatibility: "Requires Bun runtime, Pandoc"
---

# Long-Form Document Writing & Format Conversion Skill

## Overview

This skill specializes in **creating, expanding, and formatting long technical documents** (typically 50-200 pages) with professional styling. It combines:
- **Content Generation**: AI-assisted technical writing with domain expertise
- **Format Conversion**: Semantic analysis of reference documents to replicate their styling
- **Automation**: Multi-file merging, style mapping, and DOCX generation pipelines

## Core Capabilities

### 1. Long Document Expansion & Writing

Write or expand technical documents with:
- **Structured Content**: Multi-level hierarchical organization (章节/sections)
- **Domain Expertise**: Technical proposals, system designs, implementation plans
- **Reference-Based**: Use example documents as style and content guides
- **Iterative Refinement**: Check page count targets and expand systematically

**When to Use:**
- User requests "写一份技术方案" or "expand this document to X pages"
- Need to write detailed specifications following reference examples
- Multi-chapter projects requiring consistent tone and depth

**Workflow:**
1. Analyze reference document structure and content patterns
2. Generate hierarchical outline matching reference style
3. Write detailed content using domain-appropriate terminology
4. Verify page count and expand sections as needed

### 2. Reference-Based Format Conversion

Convert existing documents to match a reference template's formatting:
- **Semantic Style Extraction**: Analyze DOCX styles.xml to identify heading/body styles
- **Automated Mapping**: Map Markdown elements to Word style IDs
- **Template Generation**: Create Pandoc-compatible reference documents

**When to Use:**
- User provides a reference DOCX and asks to "format like this template"
- Need to unify multiple documents with consistent professional styling
- Converting informal drafts to polished deliverables

**Workflow:**
1. Unzip reference DOCX and extract `word/styles.xml`, `word/numbering.xml`
2. Identify style patterns (fonts, sizes, indentation, numbering)
3. Create template.docx with mapped styles
4. Convert content using Pandoc with `--reference-doc`

### 3. Multi-File Document Merging

Merge distributed Markdown files into cohesive documents:
- **Hierarchical Assembly**: Automatically merge nested content.md files
- **Level Adjustment**: Auto-adjust heading levels based on directory depth
- **Metadata Injection**: Add YAML frontmatter for Pandoc processing

**Use Cases:**
- Projects with modular document structure (e.g., `01_章节/content.md`)
- Combining multiple authors' contributions
- Version-controlled documentation

## Implementation Patterns

### Pattern 1: New Long Document Creation

```markdown
User: "Write a 150-page technical proposal for XXX system"

Steps:
1. Analyze requirements and reference materials
2. Design document outline with ~10 major chapters
3. Create directory structure: 01_Chapter/01_Section/content.md
4. Write content section by section (target ~500 chars/page)
5. Run merge script to combine all content.md files
6. Convert to DOCX using template
7. Check page count with: bun run check_stats.ts
8. Expand sections if below target
```

### Pattern 2: Format Conversion from Reference

```markdown
User: "Make my document look like this reference.docx"

Steps:
1. Extract reference styles:
   unzip reference.docx -d _analysis/
   xmllint --format _analysis/word/styles.xml
   
2. Identify key styles:
   - Heading 1-4: Font, size, numbering format
   - Body Text: Font, size, indentation, line spacing
   - Code/Quote blocks: Special formatting
   
3. Create template.docx with mapped styles
4. Convert source Markdown:
   bun run scripts/md2docx.ts input.md output.docx
```

### Pattern 3: Multi-Package Document Projects

```markdown
User: "Merge all technical specs into deliverable documents"

Steps:
1. Define TARGET_ROOTS in merge_docx.ts:
   - Package A: path, name, id
   - Package B: path, name, id
   
2. Run batch conversion:
   bun run scripts/md2docx.ts --all
   
3. Verify outputs:
   bun run check_stats.ts
```

## Technical Details

### Script Reference

All scripts are located in `scripts/` directory:

- **merge_docx.ts**: Multi-file Markdown merger
  - Recursively collects content.md files
  - Adjusts heading levels by directory depth
  - Adds YAML metadata for Pandoc
  - Usage: `bun run scripts/merge_docx.ts`

- **md2docx.ts**: Markdown-to-DOCX converter
  - Preprocesses Markdown (removes comments, cleans numbering)
  - Calls Pandoc with reference-doc template
  - Options: TOC generation, section numbering
  - Usage: `bun run scripts/md2docx.ts input.md [output.docx]`
  - Batch: `bun run scripts/md2docx.ts --all`

- **check_stats.ts**: Document statistics analyzer
  - Merges packages and generates PDF via Chrome headless
  - Counts actual pages, characters, sections
  - Compares against targets and suggests expansion
  - Usage: `bun run scripts/check_stats.ts`

### Style Mapping Standards

When creating templates, use these conventions:

| Markdown Element | DOCX Style ID | Typical Formatting |
|------------------|---------------|-------------------|
| `# Heading` | `Heading1` | 16pt bold, auto-numbering 1. |
| `## Heading` | `Heading2` | 15pt bold, auto-numbering 1.1. |
| `### Heading` | `Heading3` | 14pt bold, auto-numbering 1.1.1. |
| `#### Heading` | `Heading4` | 12pt bold, auto-numbering 1.1.1.1. |
| Normal text | `BodyText` / `Normal` | 12pt, first-line indent 2 chars |
| ` ```code``` ` | `SourceCode` | Monospace, gray background |
| `> quote` | `BlockText` | Left border, indented |
| Tables | `TableGrid` | Full borders, header row |

### Pandoc Command Structure

```bash
pandoc input.md \
  -o output.docx \
  --reference-doc template.docx \
  --from markdown+pipe_tables+fenced_code_blocks \
  --to docx \
  --toc \
  --toc-depth 4 \
  --wrap=none
```

### Template.docx Requirements

A valid reference document must include:
- **styles.xml**: Style definitions with correct `w:styleId` attributes
- **numbering.xml**: Multi-level numbering schemes for headings
- **settings.xml**: Page setup (size, margins)
- Consistent font mappings for Chinese (SimSun/宋体) and code (Consolas)

## Content Writing Guidelines

When generating long document content:

### 1. Structure & Organization
- Use hierarchical numbering: 章 (Chapter) → 节 (Section) → 条 (Article)
- Each major chapter starts with overview, then detailed sub-sections
- Maintain 3-4 heading levels maximum for readability

### 2. Technical Depth
- **Level 1 (Overview)**: High-level goals, scope, context (~300 words)
- **Level 2 (Architecture)**: System design, component breakdown (~500 words)
- **Level 3 (Implementation)**: Detailed specs, code samples, configurations (~800 words)
- **Level 4 (Reference)**: Tables, parameters, APIs (as needed)

### 3. Content Density Targets
- **Government/Enterprise proposals**: ~500-600 Chinese characters per page
- **Technical specifications**: ~400-500 chars/page (more diagrams)
- **Include**: Tables (20%), code blocks (10%), diagrams (15%)

### 4. Style & Tone
- Formal, third-person perspective
- Use domain-specific terminology consistently
- Avoid colloquialisms; prefer "实现" over "搞定", "优化" over "弄快"

### 5. Quality Checks
- Run `check_stats.ts` after each chapter to verify page progress
- Ensure no orphaned headings (every heading must have content)
- Cross-reference consistency (if mentioning "第3.2节", verify it exists)

## Troubleshooting

### Issue: Page Count Too Low

**Diagnosis:**
```bash
bun run check_stats.ts
# Output shows: 实际 PDF: 85 页 (目标: 150)
```

**Solutions:**
1. Expand thin sections: Add more examples, case studies, or comparisons
2. Add diagrams/tables: Visual elements increase page count
3. Detailed implementation steps: Break down high-level points
4. Include appendices: Glossaries, parameter tables, sample configs

### Issue: Style Not Applied in Output DOCX

**Diagnosis:**
Headings appear as normal text or wrong font.

**Solutions:**
1. Verify template.docx has correct style IDs:
   ```bash
   unzip -p template.docx word/styles.xml | grep 'w:styleId="Heading'
   ```
2. Check Pandoc output for warnings:
   ```bash
   pandoc -v  # Ensure version >= 3.0
   ```
3. Ensure Markdown uses correct heading syntax (# with space)

### Issue: Numbering Broken in DOCX

**Diagnosis:**
Headings show "1. 1. 1." or no numbers.

**Solutions:**
1. Verify numbering.xml defines multi-level abstract numbering
2. Ensure styles.xml links heading styles to numbering (w:numId)
3. Remove manual numbering from Markdown source (let DOCX auto-number)

## Best Practices

1. **Start with Outline**: Define full document structure before writing details
2. **Modular Files**: Keep each section in separate content.md for version control
3. **Iterative Expansion**: Write skeleton → basic → detailed → polished
4. **Template First**: Always create/validate template.docx before batch conversion
5. **Progressive Disclosure**: Write high-level content first, expand based on stats
6. **Reference Examples**: Study 2-3 similar documents for tone and structure
7. **Version Control**: Commit after each major chapter completion
8. **Consistent Terminology**: Maintain glossary for domain-specific terms

## Advanced Features

### Custom Style Mapping

Modify `scripts/md2docx.ts` to handle custom Markdown extensions:

```typescript
// Example: Custom admonition blocks
function preprocessMarkdown(content: string): string {
    // Convert ::: warning to BlockQuote style
    content = content.replace(
        /::: warning\n([\s\S]*?)\n:::/g,
        '> **警告**: $1'
    );
    return content;
}
```

### Automated Content Expansion

Use AI to expand thin sections:

```typescript
// In merge_docx.ts
if (sectionCharCount < MIN_SECTION_LENGTH) {
    console.log(`Expanding ${sectionPath}...`);
    const prompt = `Expand this section to ${MIN_SECTION_LENGTH} chars:\n${content}`;
    const expanded = await aiExpand(prompt);
    await write(sectionPath, expanded);
}
```

### Style Extraction Script

For complex templates, automate style extraction:

```bash
# Extract all style definitions
unzip -p reference.docx word/styles.xml | \
  xmllint --format - | \
  grep -A 20 'w:style w:type="paragraph"' > extracted_styles.xml
```

## Dependencies

- **Bun**: Runtime for TypeScript scripts (≥ 1.0)
- **Pandoc**: Document converter (≥ 3.0)
- **xmllint**: XML formatting (via libxml2)
- **unzip**: DOCX extraction (standard tool)
- **Chrome/Chromium**: PDF generation for page counting (optional)
- **pdfinfo**: PDF metadata extraction (via poppler-utils, optional)

Install on macOS:
```bash
brew install pandoc libxml2 poppler
curl -fsSL https://bun.sh/install | bash
```

## Related Skills

- **docx**: For manual DOCX editing and advanced XML manipulation
- **markdown**: For Markdown syntax and formatting guidance
- **pdf**: For PDF-specific operations and conversions

## Examples

See `references/` directory for:
- Sample reference documents
- Example project structures
- Style guide templates

## License & Attribution

This skill is proprietary. Template files and scripts are provided as-is for project-specific use.