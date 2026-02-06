# LangDocx Skill - Assets Directory

This directory contains reference templates and supporting files for document generation.

## Contents

### template.docx
**Purpose:** Pandoc reference document that defines styles, numbering, and page layout.

**What It Contains:**
- Paragraph styles (Heading 1-4, Body Text, etc.)
- Character styles (code, emphasis, etc.)
- Table styles (Table Grid, etc.)
- Numbering schemes (multi-level heading numbering)
- Page setup (margins, size, orientation)
- Font mappings (Chinese/English fonts)

**How It's Used:**
The `--reference-doc` flag in Pandoc reads this file to apply formatting:
```bash
pandoc input.md -o output.docx --reference-doc template.docx
```

**Customization:**
To create your own template based on an existing DOCX:
1. Follow instructions in `../references/STYLE_EXTRACTION_GUIDE.md`
2. Extract styles from reference document
3. Build new template.docx with desired formatting
4. Replace this file with your custom template

---

## Template Style Reference

### Default Style Mapping

Based on the included `template.docx`:

| Markdown Element | DOCX Style | Formatting |
|-----------------|------------|------------|
| `# Heading` | Heading 1 | 16pt bold, SimSun, numbered 1. |
| `## Heading` | Heading 2 | 15pt bold, SimSun, numbered 1.1. |
| `### Heading` | Heading 3 | 14pt bold, SimSun, numbered 1.1.1. |
| `#### Heading` | Heading 4 | 12pt bold, SimSun, numbered 1.1.1.1. |
| Normal paragraph | Body Text | 12pt SimSun, first-line indent 2 chars, 1.5x spacing |
| ` ```code``` ` | Source Code | 10pt Consolas, gray background, border |
| `> quote` | Block Text | 12pt SimSun, left gray border, indented |
| `| table |` | Table Grid | Full borders, header row style |
| `**bold**` | Strong | Bold run property |
| `*italic*` | Emphasis | Italic run property |

### Page Setup

- **Paper Size:** A4 (210mm × 297mm)
- **Margins:**
  - Top: 2.54cm (1 inch)
  - Bottom: 2.54cm (1 inch)
  - Left: 3.17cm (1.25 inches)
  - Right: 3.17cm (1.25 inches)
- **Orientation:** Portrait
- **Line Spacing:** 1.5x (for body text)

---

## Creating Your Own Template

### Method 1: Extract from Existing Document

If you have a well-formatted Word document:

```bash
# 1. Use it directly as reference
cp your_document.docx template.docx

# 2. Or extract and customize styles
unzip your_document.docx -d _extract/
# Edit _extract/word/styles.xml
# Edit _extract/word/numbering.xml
cd _extract && zip -r ../template.docx * && cd ..
```

### Method 2: Modify Existing Template

```bash
# 1. Extract current template
unzip template.docx -d _template_edit/

# 2. Edit XML files
# - word/styles.xml: Change fonts, sizes, colors
# - word/numbering.xml: Adjust numbering patterns
# - word/settings.xml: Change page size/margins

# 3. Repackage
cd _template_edit
zip -r ../template_custom.docx *
cd ..
mv template_custom.docx template.docx
```

### Method 3: Create from Scratch in Word

1. Open Microsoft Word
2. Create a new document
3. Define styles:
   - Home → Styles → Manage Styles
   - Modify Heading 1, Heading 2, etc.
   - Create custom "Body Text" style if needed
4. Set numbering:
   - Home → Multilevel List → Define New Multilevel List
   - Link levels to heading styles
5. Set page layout:
   - Layout → Margins, Size, Orientation
6. Save as template.docx
7. Test with Pandoc

---

## Template Validation

### Quick Test
```bash
# Create test Markdown
echo "# Test\n\nBody text." > test.md

# Convert with template
pandoc test.md -o test_output.docx --reference-doc template.docx

# Open in Word and verify styles
open test_output.docx  # macOS
```

### Inspect Styles in Output

```bash
# Extract and check applied styles
unzip -p test_output.docx word/document.xml | \
  xmllint --format - | \
  grep -A 2 'w:pStyle'
```

Expected output:
```xml
<w:pStyle w:val="Heading1"/>
<w:pStyle w:val="BodyText"/>
```

---

## Common Issues

### Issue: Styles Not Applied

**Symptom:** Output DOCX uses default Word styles instead of template styles.

**Causes & Solutions:**
1. **Wrong Style IDs:**
   - Pandoc expects exact IDs: `Heading1`, `BodyText`, `SourceCode`
   - Open template.docx, extract `word/styles.xml`, verify `w:styleId` attributes
   - Rename IDs to match Pandoc conventions

2. **Missing Styles:**
   - Template must include all required styles
   - Add missing styles in Word's Style Manager

3. **Corrupted Template:**
   - Validate XML structure: `unzip template.docx && xmllint --noout word/*.xml`
   - Rebuild from working Word document if corrupted

### Issue: Chinese Characters Display Incorrectly

**Symptom:** Chinese text shows as boxes or wrong font.

**Solution:**
Ensure `word/fontTable.xml` includes Chinese fonts:
```xml
<w:font w:name="SimSun">
  <w:charset w:val="86"/>
  <w:family w:val="auto"/>
</w:font>
<w:font w:name="宋体">
  <w:charset w:val="86"/>
  <w:family w:val="auto"/>
</w:font>
```

And styles reference them:
```xml
<w:rFonts w:ascii="SimSun" w:eastAsia="宋体" w:hAnsi="SimSun"/>
```

### Issue: Numbering Not Working

**Symptom:** Headings are not numbered or numbering is broken (1. 1. 1. instead of 1.1.1.).

**Solution:**
1. Verify `word/numbering.xml` defines multi-level abstract numbering
2. Ensure `word/styles.xml` links heading styles to numbering:
   ```xml
   <w:pPr>
     <w:numPr>
       <w:ilvl w:val="0"/>  <!-- Level for this heading -->
       <w:numId w:val="1"/> <!-- Link to numbering definition -->
     </w:numPr>
   </w:pPr>
   ```

---

## Advanced Customization

### Custom Code Block Style

Edit `word/styles.xml` to change code formatting:
```xml
<w:style w:styleId="SourceCode" w:type="paragraph">
  <w:name w:val="Source Code"/>
  <w:basedOn w:val="Normal"/>
  <w:rPr>
    <w:rFonts w:ascii="Fira Code" w:hAnsi="Fira Code"/>  <!-- Use Fira Code -->
    <w:sz w:val="20"/>  <!-- 10pt font -->
    <w:color w:val="D63384"/>  <!-- Pink text -->
  </w:rPr>
  <w:pPr>
    <w:shd w:val="clear" w:fill="F8F9FA"/>  <!-- Light gray background -->
    <w:spacing w:before="100" w:after="100"/>
  </w:pPr>
</w:style>
```

### Custom Table Style

Create a professional table style:
```xml
<w:style w:type="table" w:styleId="CustomTable">
  <w:name w:val="Custom Table"/>
  <w:tblPr>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:color="4472C4"/>
      <w:bottom w:val="single" w:sz="4" w:color="4472C4"/>
      <w:insideH w:val="single" w:sz="4" w:color="CCCCCC"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tblStylePr w:type="firstRow">
    <w:tcPr>
      <w:shd w:fill="4472C4"/>
    </w:tcPr>
    <w:rPr>
      <w:color w:val="FFFFFF"/>
      <w:b/>
    </w:rPr>
  </w:tblStylePr>
</w:style>
```

### Landscape Pages

For landscape sections (e.g., wide tables):
```xml
<w:sectPr>
  <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
  <w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/>
</w:sectPr>
```

**Note:** Pandoc applies section properties globally. For mixed orientations, use Word post-processing.

---

## Template Maintenance

### Version Control

Track template changes:
```bash
# Initial commit
git add assets/template.docx
git commit -m "Add initial DOCX template"

# After modifications
git add assets/template.docx
git commit -m "Update template: increase body text size to 13pt"
```

### Template Comparison

Compare two templates:
```bash
# Extract both
unzip -q template_old.docx -d _old/
unzip -q template_new.docx -d _new/

# Diff styles
diff <(xmllint --format _old/word/styles.xml) \
     <(xmllint --format _new/word/styles.xml)
```

### Documentation

Keep a changelog:
```markdown
## Template Change Log

### v1.2 (2026-02-06)
- Increased body text font size from 12pt to 13pt
- Changed heading 2 color to navy blue
- Added custom table style "BlueTable"

### v1.1 (2026-01-15)
- Fixed Chinese font mapping
- Adjusted first-line indent to 2 characters

### v1.0 (2026-01-01)
- Initial template creation
```

---

## File Specifications

### Minimum Template Files

A valid template.docx must contain:
```
template.docx (zip archive)
├── [Content_Types].xml
├── _rels/
│   └── .rels
└── word/
    ├── document.xml       (minimal content)
    ├── styles.xml         (style definitions)
    ├── numbering.xml      (numbering schemes)
    ├── settings.xml       (page setup)
    ├── fontTable.xml      (font declarations)
    └── _rels/
        └── document.xml.rels
```

### Optional Files
- `word/theme/theme1.xml`: Color schemes
- `word/webSettings.xml`: Web-specific settings
- `docProps/core.xml`: Document metadata

---

## Backup & Recovery

### Backup Template
```bash
# Create dated backup
cp template.docx "template_backup_$(date +%Y%m%d).docx"
```

### Restore from Backup
```bash
# List backups
ls template_backup_*.docx

# Restore specific backup
cp template_backup_20260205.docx template.docx
```

### Emergency Recovery

If template is corrupted:
1. Use a known-good Word document as template
2. Or use Pandoc's default template:
   ```bash
   # Extract Pandoc's default
   pandoc -o default.docx --print-default-data-file reference.docx
   cp default.docx template.docx
   ```

---

## Additional Resources

- [Office Open XML Documentation](http://officeopenxml.com/)
- [Pandoc Manual - Reference DOCX](https://pandoc.org/MANUAL.html#option--reference-doc)
- [WordprocessingML Primer](https://docs.microsoft.com/en-us/office/open-xml/word-processing)
- See `../references/STYLE_EXTRACTION_GUIDE.md` for detailed XML editing guide

---

## Template License

The template.docx file included in this skill is provided for project-specific use. Customize as needed for your organization's branding and style requirements.
