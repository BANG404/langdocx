# DOCX Style Extraction & Template Creation Guide

## Overview

This guide explains how to analyze an existing DOCX file to extract its styling patterns and create a Pandoc-compatible reference template.

## Step 1: Extract DOCX Structure

### 1.1 Unzip the Reference Document

```bash
# Create analysis directory
mkdir -p _docx_analysis/extracted

# Extract all XML files
unzip -q "reference.docx" -d _docx_analysis/extracted/
```

### 1.2 Key Files to Examine

```
_docx_analysis/extracted/
├── word/
│   ├── document.xml       # Document content and structure
│   ├── styles.xml         # Style definitions (MOST IMPORTANT)
│   ├── numbering.xml      # Numbering schemes for lists/headings
│   ├── settings.xml       # Page setup, margins
│   ├── fontTable.xml      # Font mappings
│   └── theme/
│       └── theme1.xml     # Color schemes
└── [Content_Types].xml    # MIME type declarations
```

## Step 2: Analyze styles.xml

### 2.1 Format XML for Readability

```bash
xmllint --format _docx_analysis/extracted/word/styles.xml > _docx_analysis/styles_formatted.xml
```

### 2.2 Identify Paragraph Styles

Look for `<w:style w:type="paragraph">` elements. Key attributes:
- `w:styleId`: The ID Pandoc uses for mapping (e.g., "Heading1", "BodyText")
- `w:name`: Display name in Word UI
- `w:basedOn`: Parent style inheritance
- `w:next`: Default style for next paragraph

### 2.3 Extract Font Settings

Within each style, look for:

```xml
<w:rPr>  <!-- Run properties: character-level formatting -->
  <w:rFonts w:ascii="SimSun" w:eastAsia="宋体" w:hAnsi="SimSun"/>
  <w:sz w:val="32"/>        <!-- Font size in half-points (32 = 16pt) -->
  <w:szCs w:val="32"/>      <!-- Complex script size -->
  <w:b/>                     <!-- Bold -->
  <w:color w:val="000000"/>  <!-- Text color (hex) -->
</w:rPr>
```

**Font Size Conversion:**
- Word uses **half-points** (1pt = 2 half-points)
- 12pt = `<w:sz w:val="24"/>`
- 14pt = `<w:sz w:val="28"/>`
- 16pt = `<w:sz w:val="32"/>`

### 2.4 Extract Paragraph Settings

```xml
<w:pPr>  <!-- Paragraph properties -->
  <w:spacing w:before="240" w:after="120" w:line="360" w:lineRule="auto"/>
  <!-- before/after: spacing in twips (1440 twips = 1 inch = 2.54cm) -->
  <!-- line: line spacing (360 = 1.5x spacing at 240 twips base) -->
  
  <w:ind w:firstLine="480"/>  <!-- First line indent (480 twips ≈ 2 chars) -->
  <w:jc w:val="left"/>         <!-- Alignment: left, center, right, both -->
  
  <w:numPr>                    <!-- Numbering link -->
    <w:ilvl w:val="0"/>        <!-- Numbering level (0-based) -->
    <w:numId w:val="1"/>       <!-- Reference to numbering.xml -->
  </w:numPr>
</w:pPr>
```

**Common Twip Conversions:**
- 240 twips = 0.167 inch = 4.2mm
- 360 twips = 0.25 inch = 6.35mm
- 480 twips = 0.333 inch = 8.5mm (≈ 2 Chinese chars)
- 720 twips = 0.5 inch = 1.27cm

## Step 3: Analyze numbering.xml

### 3.1 Abstract Numbering Definitions

```xml
<w:abstractNum w:abstractNumId="0">
  <w:multiLevelType w:val="multilevel"/>
  
  <w:lvl w:ilvl="0">  <!-- Level 0: 1. -->
    <w:start w:val="1"/>
    <w:numFmt w:val="decimal"/>
    <w:lvlText w:val="%1."/>
    <w:lvlJc w:val="left"/>
    <w:pPr>
      <w:ind w:left="420" w:hanging="420"/>
    </w:pPr>
  </w:lvl>
  
  <w:lvl w:ilvl="1">  <!-- Level 1: 1.1. -->
    <w:numFmt w:val="decimal"/>
    <w:lvlText w:val="%1.%2."/>
    <!-- ... -->
  </w:lvl>
</w:abstractNum>
```

### 3.2 Number Instances

```xml
<w:num w:numId="1">
  <w:abstractNumId w:val="0"/>
</w:num>
```

The `w:numId` in `numbering.xml` is referenced by `<w:numPr>` in `styles.xml`.

## Step 4: Create Template Document

### 4.1 Minimal Template Structure

You need these files:
```
template_build/
├── [Content_Types].xml
├── _rels/
│   └── .rels
└── word/
    ├── document.xml       # Minimal content
    ├── styles.xml         # Your extracted/modified styles
    ├── numbering.xml      # Your numbering definitions
    ├── settings.xml       # Page setup
    ├── fontTable.xml      # Font declarations
    └── _rels/
        └── document.xml.rels
```

### 4.2 Minimal document.xml

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>Sample Heading 1</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:t>Sample Heading 2</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BodyText"/></w:pPr>
      <w:r><w:t>Sample body text paragraph.</w:t></w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>  <!-- A4 size -->
      <w:pgMar w:top="1440" w:right="1814" w:bottom="1440" w:left="1814"/>
    </w:sectPr>
  </w:body>
</w:document>
```

### 4.3 Build Template Package

```bash
cd template_build
zip -r ../template.docx [Content_Types].xml _rels/ word/
```

## Step 5: Style Mapping Reference

### Common Style ID Conventions

| Purpose | Recommended Style ID | Pandoc Default |
|---------|---------------------|----------------|
| Level 1 Heading | `Heading1` | ✅ |
| Level 2 Heading | `Heading2` | ✅ |
| Level 3 Heading | `Heading3` | ✅ |
| Level 4 Heading | `Heading4` | ✅ |
| Body Text | `BodyText` or `Normal` | ✅ Normal |
| First Paragraph | `FirstParagraph` | ❌ |
| Code Block | `SourceCode` | ✅ |
| Block Quote | `BlockText` or `BlockQuote` | ✅ BlockQuote |
| Table Style | `TableGrid` | ✅ |
| Caption | `Caption` | ✅ |

**Important:** Pandoc looks for exact style IDs. If your template uses `Body Text` (with space), Pandoc won't find it. Use `BodyText` or override `Normal`.

## Step 6: Validation & Testing

### 6.1 Test with Pandoc

```bash
echo "# Test Heading\n\nBody text." > test.md
pandoc test.md -o test_output.docx --reference-doc=template.docx
```

### 6.2 Verify Styles Applied

```bash
# Extract output document
unzip -p test_output.docx word/document.xml | xmllint --format - | grep 'w:pStyle'
```

Expected output:
```xml
<w:pStyle w:val="Heading1"/>
<w:pStyle w:val="BodyText"/>
```

### 6.3 Inspect in Word

Open `test_output.docx` in Microsoft Word or LibreOffice:
1. Select a heading → Check style dropdown → Should show "Heading 1"
2. Verify font, size, and numbering match template
3. Check page margins and layout

## Troubleshooting

### Issue: Styles Not Applied

**Cause:** Style IDs don't match Pandoc expectations.

**Fix:** Rename style IDs in `styles.xml`:
```xml
<!-- Change this -->
<w:style w:styleId="Header1" ...>

<!-- To this -->
<w:style w:styleId="Heading1" ...>
```

### Issue: Numbering Missing

**Cause:** Styles not linked to numbering definitions.

**Fix:** Add `<w:numPr>` to heading styles:
```xml
<w:pPr>
  <w:numPr>
    <w:ilvl w:val="0"/>  <!-- Level 0 for H1 -->
    <w:numId w:val="1"/> <!-- Link to num instance -->
  </w:numPr>
</w:pPr>
```

### Issue: Chinese Characters Show as Boxes

**Cause:** Missing font declarations.

**Fix:** Ensure `fontTable.xml` includes SimSun:
```xml
<w:font w:name="SimSun">
  <w:panose1 w:val="02010600030101010101"/>
  <w:charset w:val="86"/>
  <w:family w:val="auto"/>
  <w:pitch w:val="variable"/>
</w:font>
```

And styles reference it:
```xml
<w:rFonts w:ascii="SimSun" w:eastAsia="宋体" w:hAnsi="SimSun" w:cs="SimSun"/>
```

## Advanced Techniques

### Conditional Formatting

Some templates use complex conditional styles (e.g., alternating row colors):
- These require `<w:tblPr>` and `<w:tcPr>` in table definitions
- Simpler to apply via Pandoc's table attributes or post-process

### Linked Styles

Character styles can be linked to paragraph styles:
```xml
<w:style w:type="character" w:styleId="Heading1Char">
  <w:basedOn w:val="DefaultParagraphFont"/>
  <w:link w:val="Heading1"/>  <!-- Links to paragraph style -->
  <!-- ... -->
</w:style>
```

### Style Inheritance

Use `<w:basedOn>` to chain styles:
```xml
<w:style w:styleId="Heading1">
  <w:basedOn w:val="Normal"/>
  <!-- Only specify differences from Normal -->
</w:style>
```

## Quick Reference: XML Entities

When manually editing XML:
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- Smart quotes: `&#x201C;` ("), `&#x201D;` ("), `&#x2018;` ('), `&#x2019;` (')

## Recommended Tools

- **xmllint**: Format and validate XML (libxml2)
- **7-Zip/unzip**: Extract DOCX files
- **VS Code XML Extension**: Syntax highlighting and validation
- **Pandoc**: Test conversions
- **Microsoft Word**: Final visual verification

## Further Reading

- [Office Open XML Specification](http://officeopenxml.com/)
- [Pandoc Manual - DOCX Reader/Writer](https://pandoc.org/MANUAL.html#creating-a-custom-style-reference-docx)
- [WordprocessingML Primer](https://docs.microsoft.com/en-us/office/open-xml/word-processing)
