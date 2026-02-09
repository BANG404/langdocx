# LangDocx Skill - Scripts Directory

This directory contains TypeScript automation scripts for the long-form document generation workflow.

## Available Scripts

### 1. init_structure.ts
**Purpose:** Generate hierarchical directory structure from JSON definition.

**Features:**
- Creates nested folder structure from JSON schema
- Generates `content.md` placeholders in each directory
- Supports multi-level document hierarchies

**Usage:**
```bash
bun run scripts/init_structure.ts structure.json [output_dir]
```

**Input Format (structure.json):**
```json
[
  {
    "name": "01_Introduction",
    "content": "# Introduction\n\nOverview...",
    "children": [
      { "name": "01_Background", "content": "## Background..." }
    ]
  }
]
```

---

### 2. md2docx.ts ⭐ UNIFIED TOOL
**Purpose:** Complete Markdown to DOCX workflow with granular control.

**Features:**
- **Merge Mode**: Collect and merge content.md files from directory structure
- **Convert Mode**: Transform Markdown to DOCX using Pandoc
- **Full Pipeline**: Automated merge + convert workflow
- Automatic heading level adjustment based on directory depth
- YAML frontmatter injection for Pandoc
- Template-based style application
- Character count and file statistics

**Usage:**
```bash
# Merge only - collect content.md files
bun run md2docx.ts merge [--path <dir>]

# Convert only - existing MD to DOCX
bun run md2docx.ts convert <input.md> [output.docx]

# Full pipeline - merge all packages then convert
bun run md2docx.ts all

# Quick convert - single file
bun run md2docx.ts my-document.md [output.docx]
```

**Configuration:**
Environment variables for customization:
- `DOCX_TEMPLATE`: Path to reference template (default: `../template.docx`)
- `DOCX_TOC_DEPTH`: Table of contents depth (default: 4)
- `DOCX_AUTHOR`: Document author name
- `DOCX_PKG_PATH`: Single package path
- `DOCX_PKG_NAME`: Single package name
- `DOCX_PKG_ID`: Single package ID
- `DOCX_CONFIG`: Full JSON config for multiple packages

**Template Style Mapping:**
```
# Heading       → Heading 1 (Top-level, numbered 1.)
## Heading      → Heading 2 (Second-level, numbered 1.1.)
### Heading     → Heading 3 (Third-level, numbered 1.1.1.)
#### Heading    → Heading 4 (Fourth-level, numbered 1.1.1.1.)
Paragraph       → Body Text (First-line indent, 1.5x line spacing)
> Quote         → Block Text (Left gray border)
```code```      → Source Code (Monospace, gray background)
| Table |       → Table Grid (Full borders)
```

---

### 3. check_stats.ts ⭐ UNIFIED STATISTICS TOOL
**Purpose:** Comprehensive document analysis for Markdown and DOCX files.

**Features:**
- **MD Analysis**: Count characters and estimate pages from Markdown
- **DOCX Analysis**: Extract actual page count from generated DOCX files
- **Comparison Mode**: Compare estimated vs actual pages
- Target validation with exit codes

**Usage:**
```bash
# Analyze Markdown directory
bun run check_stats.ts --md <dir>
bun run check_stats.ts <dir>  # default mode

# Check DOCX page count
bun run check_stats.ts --docx <file.docx> [target_pages]

# Compare MD estimate with DOCX actual
bun run check_stats.ts --all <dir> <file.docx>
```

**Examples:**
```bash
# Estimate pages from Markdown source
bun run check_stats.ts ./01_TechnicalProposal

# Validate DOCX against 50-page target
bun run check_stats.ts --docx Package1.docx 50

# Full comparison
bun run check_stats.ts --all ./01_TechnicalProposal Package1.docx
```

**Exit Codes:**
- `0`: Success or target met
- `1`: Target not met or error

---

## Typical Workflows

### Workflow 1: Complete Document Generation
```bash
# 1. Create initial structure
bun run scripts/init_structure.ts structure.json ./project

# 2. Edit content.md files in generated folders
# ... (manual editing)

# 3. Run full pipeline (merge + convert)
bun run scripts/md2docx.ts all

# 4. Verify page count against target
bun run scripts/check_stats.ts --docx Package1_Complete_Draft.docx 150
```

### Workflow 2: Iterative Development
```bash
# 1. Merge content only (check structure)
bun run scripts/md2docx.ts merge

# 2. Review merged Markdown
cat Package1_Complete_Draft.md

# 3. Convert to DOCX when ready
bun run scripts/md2docx.ts convert Package1_Complete_Draft.md

# 4. Compare estimate vs actual
bun run scripts/check_stats.ts --all ./project Package1_Complete_Draft.docx
```

### Workflow 3: Quick Single File Conversion
```bash
# Convert any standalone Markdown file
bun run scripts/md2docx.ts my-report.md final-report.docx

# Check the result
bun run scripts/check_stats.ts --docx final-report.docx
```

---

## Dependencies

### Required
- **Bun**: Runtime for TypeScript scripts ([bun.sh](https://bun.sh))
- **Pandoc**: Markdown to DOCX conversion ([pandoc.org](https://pandoc.org))
- **unzip**: DOCX metadata extraction (usually pre-installed)

### Installation

**macOS:**
```bash
brew install bun pandoc
```

**Linux:**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Pandoc
sudo apt install pandoc
```

**Windows:**
```bash
# Install Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# Install Pandoc
choco install pandoc
```

---

## Template File

The workflow requires a reference DOCX template (`template.docx`) that defines:
- Heading styles (Heading 1-4) with automatic numbering
- Paragraph styles (Body Text, First Paragraph)
- Code block styles (Source Code)
- Quote styles (Block Text)
- Table styles (Table Grid)
- Page layout (margins, sizes)

Place the template at `langdocx/template.docx` or set `DOCX_TEMPLATE` environment variable.

---

## Legacy Scripts (Merged)

The following scripts have been unified into newer tools:
- **`merge_docx.ts`** → Now part of **`md2docx.ts merge`**
- **`check_docx_pages.ts`** → Now part of **`check_stats.ts --docx`**

All previous functionality is preserved with more robust unified interfaces.

---

## Troubleshooting

### "Template file not found"
- Ensure `template.docx` exists at `langdocx/template.docx`
- Or set `DOCX_TEMPLATE` environment variable to the correct path

### "pandoc: command not found"
- Install Pandoc using instructions above
- Verify with: `pandoc --version`

### DOCX page count shows 0
- Ensure the DOCX was generated by Microsoft Word or Pandoc
- Some DOCX editors don't write page count metadata
- Open in Word and save to update metadata

### Character estimate vs actual pages differs significantly
- Adjust `WORDS_PER_PAGE` constant in check_stats.ts (default: 800)
- Different fonts and layouts affect actual page count
- Use `--all` mode to calibrate for your template

- `md2docx.template.ts`: Clean template without project-specific configuration

When setting up a new project:
1. Copy `.template.ts` files to remove `.template` suffix
2. Customize `TARGET_ROOTS` and paths
3. Adjust `WORDS_PER_PAGE` based on your content density

---

## Common Workflow

```mermaid
graph LR
    A[Content Files] -->|md2docx.ts merge| B[Merged Markdown]
    B -->|md2docx.ts convert| C[DOCX Output]
    C -->|check_stats.ts| D[Statistics Report]
    D -->|Expand Sections| A
```

**Step-by-Step:**
1. Write content in `content.md` files across directories
2. Run `md2docx.ts merge` to create unified Markdown
3. Run `md2docx.ts convert` to generate DOCX with template styling
4. (Optional) Run `check_stats.ts` to verify page count
5. Expand sections if needed and repeat

---

## Script Requirements

### Runtime
- **Bun** (>= 1.0): JavaScript/TypeScript runtime
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### External Tools
- **Pandoc** (>= 3.0): Document converter
  ```bash
  brew install pandoc  # macOS
  ```

- **xmllint** (optional): XML formatting
  ```bash
  brew install libxml2  # macOS
  ```

- **pdfinfo** (optional): PDF metadata extraction
  ```bash
  brew install poppler  # macOS
  ```

---

## Troubleshooting

### Issue: "Bun command not found"
**Solution:** Install Bun:
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### Issue: "Pandoc not found"
**Solution:** Install Pandoc:
```bash
# macOS
brew install pandoc

# Ubuntu/Debian
sudo apt-get install pandoc

# Windows
choco install pandoc
```

### Issue: "Template file not found"
**Solution:** Ensure `assets/template.docx` exists:
```bash
ls ../assets/template.docx
# If missing, create template using STYLE_EXTRACTION_GUIDE.md
```

### Issue: Incorrect heading levels in output
**Cause:** Directory depth calculation mismatch.

**Solution:** Adjust the `depth` calculation in `md2docx.ts`:
```typescript
// Current: depth = Math.max(0, relPath.split("/").length - 2)
// Try: depth = Math.max(0, relPath.split("/").length - 1)
const depth = Math.max(0, relPath.split("/").length - YOUR_OFFSET);
```

---

## Advanced Customization

### Custom File Patterns
Modify `getFiles()` to collect different files:
```typescript
// Collect all .md files (not just content.md)
} else if (dirent.name.endsWith(".md")) {
    files.push(res);
}
```

### Custom Markdown Extensions
Add preprocessing logic:
```typescript
function preprocessMarkdown(content: string): string {
    // ... existing preprocessing ...
    
    // Custom: Convert admonitions
    content = content.replace(
        /::: (warning|note|tip)\n([\s\S]*?)\n:::/g,
        (match, type, body) => `> **${type.toUpperCase()}**: ${body}`
    );
    
    return content;
}
```

### Multi-Language Support
Add language-specific processing:
```typescript
function adjustForLanguage(content: string, lang: "zh" | "en"): string {
    if (lang === "zh") {
        // Chinese: Use SimSun font
        return content;
    } else {
        // English: Use Arial font
        // Adjust template selection
        return content;
    }
}
```

---

## Script Architecture

### md2docx.ts Flow
```
User Config (TARGET_ROOTS)
    ↓
getFiles() → Recursive directory scan
    ↓
Sort by numeric prefix
    ↓
Read content.md files
    ↓
Adjust heading levels (depth-based)
    ↓
Merge with YAML frontmatter
    ↓
Output: Package_Complete_Draft.md
    ↓
preprocessMarkdown() → Clean content
    ↓
Pandoc command construction
    ↓
Bun.spawn(["pandoc", ...args])
    ↓
Error handling & validation
    ↓
Output: Styled DOCX file
```

---

## Performance Considerations

### Large Projects (>100 files)
- Consider parallelizing file reads:
  ```typescript
  const contents = await Promise.all(files.map(f => file(f).text()));
  ```

### Memory Usage
- For very large documents (>500 pages), process in chunks:
  ```typescript
  const CHUNK_SIZE = 50; // Files per chunk
  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
      const chunk = files.slice(i, i + CHUNK_SIZE);
      // Process chunk...
  }
  ```

### Pandoc Performance
- Disable TOC for drafts to speed up conversion:
  ```typescript
  await convertMdToDocx(input, output, { toc: false });
  ```

---

## Testing Scripts

### Unit Test Example
```typescript
import { test, expect } from "bun:test";
import { countContentChars } from "./md2docx";

test("countContentChars removes comments", () => {
    const input = "Text <!-- comment --> more text";
    expect(countContentChars(input)).toBe(12); // "Textmoretext"
});
```

### Integration Test
```bash
# Create test structure
mkdir -p test_project/01_Chapter
echo "# Test" > test_project/01_Chapter/content.md

# Run merge
bun run merge_docx.ts

# Verify output
test -f test_project/Test_Complete_Draft.md
```

---

## Maintenance

### Updating for New Projects
1. Copy `scripts/` folder to new project
2. Update `TARGET_ROOTS` in `md2docx.ts`
3. Update `TEMPLATE_PATH` in `md2docx.ts`
4. Test with sample content before full run

### Version Control
```bash
# Track scripts
git add scripts/*.ts
git commit -m "Add document generation scripts"

# Ignore generated files
echo "*_Complete_Draft.md" >> .gitignore
echo "*.docx" >> .gitignore
```

---

## Further Reading

- See `../references/STYLE_EXTRACTION_GUIDE.md` for template creation
- See `../references/PROJECT_STRUCTURE_EXAMPLES.md` for directory patterns
- See `../SKILL.md` for complete workflow documentation
