# Project Structure Examples

## Example 1: Government Technical Proposal (150-page target)

### Directory Structure

```
project_root/
├── 01_技术方案/
│   ├── 01_项目概述/
│   │   ├── content.md
│   │   ├── 01_项目背景/
│   │   │   └── content.md
│   │   ├── 02_建设目标/
│   │   │   └── content.md
│   │   └── 03_建设依据/
│   │       └── content.md
│   ├── 02_总体设计/
│   │   ├── content.md
│   │   ├── 01_设计思路/
│   │   │   └── content.md
│   │   ├── 02_总体架构/
│   │   │   └── content.md
│   │   └── 03_技术路线/
│   │       └── content.md
│   ├── 03_数据资源体系/
│   │   ├── content.md
│   │   ├── 01_数据标准/
│   │   │   └── content.md
│   │   └── 02_数据治理/
│   │       └── content.md
│   └── ... (7 more chapters)
├── merge_docx.ts
├── md2docx.ts
├── check_stats.ts
├── template.docx
└── Package_Complete_Draft.md  (generated)
```

### Content Organization Rules

1. **Hierarchical Naming Convention:**
   - `01_`, `02_`, `03_` prefixes for ordering
   - Descriptive Chinese names
   - Each folder contains either:
     - `content.md` (leaf content)
     - Subfolders with further structure

2. **Heading Level Mapping:**
   - `01_项目概述/content.md` → Uses `#` (H1) headings
   - `01_项目概述/01_项目背景/content.md` → Auto-adjusted to `##` (H2)
   - `01_项目概述/01_项目背景/01_政策背景/content.md` → `###` (H3)

3. **Content per File:**
   - Each `content.md` should be 300-800 words
   - Larger sections split into subfolders
   - Aim for 5-10 subsections per chapter

### Sample content.md

```markdown
# 项目概述

## 背景分析

本项目旨在建设智能化的审计平台系统，满足新时代审计工作的需求。

### 政策背景

党的二十大报告明确指出...

### 行业现状

当前审计信息化建设面临以下挑战:
- **数据孤岛问题**: 各部门数据分散，缺乏统一管理
- **分析手段单一**: 依赖传统Excel工具，效率低下
- **知识沉淀不足**: 审计经验难以传承

## 建设目标

打造"数据驱动、智能赋能"的审计平台，实现:
1. 数据全覆盖采集
2. 智能化分析建模
3. 风险精准预警

| 目标维度 | 具体指标 | 完成时间 |
|---------|---------|----------|
| 数据接入 | 覆盖20+部门 | 2026年6月 |
| 模型库 | 100+审计模型 | 2026年12月 |
```

---

## Example 2: Enterprise System Design Specification (80-page target)

### Directory Structure

```
system_design/
├── 00_Executive_Summary/
│   └── content.md
├── 01_Requirements/
│   ├── content.md
│   ├── 01_Functional/
│   │   └── content.md
│   └── 02_Non_Functional/
│       └── content.md
├── 02_Architecture/
│   ├── content.md
│   ├── 01_System_Overview/
│   │   └── content.md
│   ├── 02_Component_Design/
│   │   ├── content.md
│   │   ├── 01_Frontend/
│   │   │   └── content.md
│   │   ├── 02_Backend/
│   │   │   └── content.md
│   │   └── 03_Database/
│   │       └── content.md
│   └── 03_Deployment/
│       └── content.md
├── 03_Implementation/
│   ├── content.md
│   ├── 01_Phase1/
│   │   └── content.md
│   ├── 02_Phase2/
│   │   └── content.md
│   └── 03_Phase3/
│       └── content.md
├── 04_Testing/
│   └── content.md
└── 05_Appendices/
    ├── 01_API_Reference/
    │   └── content.md
    └── 02_Glossary/
        └── content.md
```

### Configuration File (merge_docx.ts)

```typescript
export const TARGET_ROOTS = [
    {
        id: "SystemDesign_v1",
        name: "Enterprise System Design Specification",
        path: "/path/to/system_design"
    }
];

export const WORDS_PER_PAGE = 450;  // Adjusted for technical content
```

---

## Example 3: Multi-Package Bidding Document (Package A: 60 pages, Package B: 90 pages)

### Directory Structure

```
bidding_project/
├── 分包一/
│   ├── 01_技术方案/
│   │   ├── 01_方案概述/
│   │   │   └── content.md
│   │   ├── 02_技术实现/
│   │   │   └── content.md
│   │   └── 03_项目管理/
│   │       └── content.md
│   └── Package_A_Complete_Draft.md  (generated)
├── 分包二/
│   ├── 01_技术方案/
│   │   ├── 01_系统设计/
│   │   │   └── content.md
│   │   ├── 02_功能详述/
│   │   │   └── content.md
│   │   └── 03_运维方案/
│   │       └── content.md
│   └── Package_B_Complete_Draft.md  (generated)
├── merge_docx.ts
├── md2docx.ts
├── check_stats.ts
└── template.docx
```

### Multi-Package Configuration

```typescript
export const TARGET_ROOTS = [
    {
        id: "Package_A_Platform",
        name: "分包一: 智能平台建设",
        path: "/path/to/bidding_project/分包一/01_技术方案"
    },
    {
        id: "Package_B_DataWarehouse",
        name: "分包二: 数据仓库建设",
        path: "/path/to/bidding_project/分包二/01_技术方案"
    }
];
```

### Batch Processing Commands

```bash
# Merge all packages
bun run merge_docx.ts

# Convert all to DOCX
bun run md2docx.ts --all

# Check statistics for all packages
bun run check_stats.ts
```

---

## Example 4: Research Paper with Appendices (50-page target)

### Directory Structure

```
research_paper/
├── 01_Abstract/
│   └── content.md
├── 02_Introduction/
│   ├── content.md
│   ├── 01_Background/
│   │   └── content.md
│   └── 02_Related_Work/
│       └── content.md
├── 03_Methodology/
│   ├── content.md
│   ├── 01_Data_Collection/
│   │   └── content.md
│   ├── 02_Model_Design/
│   │   └── content.md
│   └── 03_Evaluation/
│       └── content.md
├── 04_Results/
│   ├── content.md
│   ├── 01_Quantitative/
│   │   └── content.md
│   └── 02_Qualitative/
│       └── content.md
├── 05_Discussion/
│   └── content.md
├── 06_Conclusion/
│   └── content.md
├── 07_References/
│   └── content.md
└── 08_Appendices/
    ├── 01_Dataset_Details/
    │   └── content.md
    ├── 02_Code_Listings/
    │   └── content.md
    └── 03_Supplementary_Tables/
        └── content.md
```

### Content Characteristics

- **Shorter sections**: 200-400 words per file
- **More tables/figures**: ~30% of content
- **Code blocks**: ~15% of content
- **Dense references**: Separate bibliography section

---

## Common Patterns

### Pattern 1: Overview + Details

```
Chapter/
├── content.md           # High-level overview (200 words)
├── 01_Subsection_A/
│   └── content.md       # Detailed content (500 words)
├── 02_Subsection_B/
│   └── content.md       # Detailed content (500 words)
└── 03_Subsection_C/
    └── content.md       # Detailed content (500 words)
```

### Pattern 2: Flat Structure (Small Documents)

```
project/
├── 01_Introduction.md
├── 02_Requirements.md
├── 03_Design.md
├── 04_Implementation.md
└── 05_Conclusion.md
```

**Note:** For flat structures, manually merge files or adjust script to read `*.md` instead of `content.md` only.

### Pattern 3: Deep Nesting (Large Specifications)

```
Chapter/
├── content.md           # Chapter intro
├── 01_Section/
│   ├── content.md       # Section intro
│   ├── 01_Subsection/
│   │   ├── content.md   # Subsection intro
│   │   ├── 01_Detail/
│   │   │   └── content.md   # Detailed content
│   │   └── 02_Detail/
│   │       └── content.md   # Detailed content
│   └── 02_Subsection/
│       └── content.md
└── 02_Section/
    └── content.md
```

**Warning:** Deep nesting (>4 levels) can create overly granular headings. Limit to H1-H4.

---

## Naming Conventions Best Practices

### ✅ Good Examples
- `01_项目概述` (Numbered + Descriptive)
- `02_System_Architecture` (Mixed language OK)
- `03_数据资源体系建设` (Long but clear)

### ❌ Avoid
- `Chapter1` (Not descriptive)
- `背景` (No number, hard to sort)
- `01-项目概述` (Use `_` not `-` for consistency)
- `1_Overview` (Single digit, use `01`)

---

## File Size Guidelines

| Document Type | Total Pages | Files | Avg Words/File |
|--------------|-------------|-------|----------------|
| Technical Proposal | 150 | 40-60 | 400-600 |
| System Spec | 80 | 25-40 | 450-550 |
| Research Paper | 50 | 15-25 | 350-500 |
| User Manual | 120 | 50-80 | 300-400 |

**Rule of Thumb:** 
- Small files (200-300 words) → Easy to edit, but many files
- Large files (800+ words) → Fewer files, but harder to reorganize
- **Optimal:** 400-600 words per `content.md` file

---

## Automation Scripts Integration

### Directory Scaffolding Script

```typescript
// setup_structure.ts
const outline = {
    "01_Introduction": {
        "01_Background": null,
        "02_Objectives": null
    },
    "02_Design": {
        "01_Architecture": null,
        "02_Components": null
    }
};

async function createStructure(base: string, tree: any) {
    for (const [key, value] of Object.entries(tree)) {
        const dir = join(base, key);
        await mkdir(dir, { recursive: true });
        
        if (value === null) {
            await write(join(dir, "content.md"), "# " + key.split("_")[1]);
        } else {
            await write(join(dir, "content.md"), "# Overview\n\n");
            await createStructure(dir, value);
        }
    }
}
```

### Word Count Validator

```typescript
// validate_content.ts
const MIN_WORDS_PER_FILE = 200;
const MAX_WORDS_PER_FILE = 800;

async function validateWordCounts(root: string) {
    const files = await getFiles(root);
    for (const f of files) {
        const content = await file(f).text();
        const words = content.split(/\s+/).length;
        if (words < MIN_WORDS_PER_FILE) {
            console.warn(`⚠️ File too short: ${f} (${words} words)`);
        }
        if (words > MAX_WORDS_PER_FILE) {
            console.warn(`⚠️ File too long: ${f} (${words} words)`);
        }
    }
}
```

---

## Version Control Strategy

```bash
# Branch per package
git checkout -b package-a-draft
git checkout -b package-b-draft

# Commit after each chapter
git add 分包一/01_技术方案/01_项目概述/
git commit -m "完成项目概述章节初稿"

# Tag milestones
git tag v1.0-draft-complete
git tag v1.1-review-complete
git tag v2.0-final-deliverable
```

---

## Further Reading

- See `STYLE_EXTRACTION_GUIDE.md` for template creation
- See main `SKILL.md` for conversion commands
- Review actual project structures in parent workspace
