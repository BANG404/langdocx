设计一个 Agent Skill（智能体技能）主要涉及创建一个符合特定结构的文件夹，并编写核心的 `SKILL.md` 文件。以下是设计一个 Skill 的完整指南和步骤：

### 1. 建立基本目录结构
设计技能的第一步是创建一个文件夹。根据规范，技能本质上就是一个包含 `SKILL.md` 文件的文件夹。

*   **命名规则**：文件夹名称应作为技能的名称。
*   **核心文件**：必须包含一个名为 `SKILL.md` 的文件。
*   **扩展目录**（可选）：你可以根据需要创建 `scripts/`（脚本）、`references/`（参考文档）和 `assets/`（资源）子文件夹。

**示例结构**：
```text
my-skill/
├── SKILL.md       # 必须：包含元数据和指令
├── scripts/       # 可选：可执行代码（如 Python, Bash）
├── references/    # 可选：详细文档
└── assets/        # 可选：模板或静态资源
```

### 2. 编写 `SKILL.md` 文件
这是技能的核心，由 **YAML Frontmatter（前置元数据）** 和 **Markdown 正文** 组成。

#### A. 配置 Frontmatter (必须)
在文件顶部使用 YAML 格式定义元数据。Agent 在启动时只会读取这部分内容，因此必须简洁准确。

*   **必需字段**：
    *   `name`：技能的唯一标识符。
        *   长度限制 1-64 字符。
        *   仅限小写字母、数字和连字符（`a-z` 和 `-`）。
        *   不能以连字符开头或结尾，也不能包含连续连字符。
        *   必须与父文件夹名称匹配。
    *   `description`：描述技能的功能以及**何时使用**它。
        *   长度限制 1-1024 字符。
        *   这对于 Agent 识别任务是否匹配该技能至关重要。
*   **可选字段**：
    *   `license`：许可证名称。
    *   `compatibility`：环境要求（如需要特定软件或网络访问）。
    *   `metadata`：自定义键值对（如作者、版本）。
    *   `allowed-tools`：预批准使用的工具列表（实验性功能）。

**Frontmatter 示例**：
```yaml
---
name: pdf-processing
description: Extracts text and tables from PDF files, fills forms, merge documents. Use when working with PDF documents.
license: Apache-2.0
metadata:
  version: "1.0"
---
```

#### B. 编写正文指令 (Markdown)
Frontmatter 之后的内容是给 Agent看的具体操作指南。当 Agent 决定激活该技能时，会加载这部分内容。

*   **内容建议**：
    *   **分步说明**：清晰的操作步骤。
    *   **示例**：输入和输出的例子。
    *   **边缘情况**：如何处理常见错误或特殊情况。
*   **格式**：没有严格限制，只要有助于 Agent 有效执行任务即可。

### 3. 扩展技能能力 (可选目录)
如果技能需要执行复杂逻辑或参考大量信息，不要将所有内容塞进 `SKILL.md`，而应使用辅助文件。

*   **Scripts (`scripts/`)**：包含 Agent 可以运行的可执行代码。
    *   支持 Python, Bash, JavaScript 等（取决于 Agent 实现）。
    *   脚本应包含错误处理并且自包含（或明确记录依赖）。
*   **References (`references/`)**：包含额外的文本文档。
    *   例如：`FORMS.md`（表格模板）、`legal.md`（法律条款）。
    *   Agent 会按需读取这些文件，从而节省上下文窗口。
*   **Assets (`assets/`)**：包含静态资源。
    *   例如：文档模板、图片、数据查找表。

**引用文件的技巧**：在 `SKILL.md` 中引用这些文件时，使用相对于技能根目录的相对路径。尽量保持引用层级只有一层（例如 `scripts/extract.py`），避免深层嵌套。

### 4. 设计原则：渐进式披露 (Progressive Disclosure)
为了让 Agent 高效运行，设计时应遵循“渐进式披露”原则，分层管理上下文的使用：

1.  **发现层 (Metadata)**：Agent 启动时仅加载 `name` 和 `description`（约 100 tokens）。因此描述要精准，不仅写“做什么”，还要写“何时用”。
2.  **激活层 (Instructions)**：仅当任务匹配时，Agent 才加载 `SKILL.md` 全文。建议全文控制在 5000 tokens 以内，行数控制在 500 行以内。
3.  **执行层 (Resources)**：具体的脚本和参考文件只有在执行具体步骤需要时才被加载。

### 5. 安全性考虑
在设计包含脚本执行的技能时，需要考虑安全性：
*   脚本应该在沙盒环境中运行。
*   对于潜在的危险操作（如删除文件），应设计为在执行前征求用户确认。

通过遵循上述结构和原则，你可以设计出一个既强大又便于 Agent 理解和使用的 Skill。
