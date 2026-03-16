# langdocx

[English](#english) | [中文](#中文)

## English

`langdocx` is an expert-level agent skill for authoring long-form technical documents. It provides automated directory structure generation, multi-file Markdown merging, DOCX output via Pandoc, and character count validation to ensure documents meet length requirements.

### Key Features
- **Long-form Authoring**: Automated generation of hierarchical folders and Markdown content stubs.
- **Structure-driven Workflow**: `structure.json` defines the document outline; scripts scaffold the folders and merge content into a single Markdown file.
- **DOCX Output**: Converts merged Markdown to Word format via Pandoc with a reference template.
- **Character Count Validation**: Monitors total character count and flags incomplete placeholders to ensure drafts meet minimum length requirements.

### Environment Requirements
- **Bun**: For running TypeScript scripts.
- **Pandoc**: Core document conversion engine.

### Workflow Overview

```
structure.json
      ↓  bun run scripts/init_structure.ts
 Prefixed folders + content.md stubs
      ↓  (write content into content.md files)
 bun run scripts/check_stats.ts --md <dir> [min-chars]
      ↓  bun run scripts/md2docx.ts all
 output/<name>_Complete_Draft.docx
```

### Installation & Setup

`langdocx` follows the **Agent Skills open standard**. Install it by placing this folder into the skills directory of your AI agent.

#### 1. Claude Code
- **Project-level**: `mkdir -p .claude/skills/ && cp -r langdocx .claude/skills/`
- **Global-level**: `mkdir -p ~/.claude/skills/ && cp -r langdocx ~/.claude/skills/`
- **Verify**: Restart Claude and type `/skills`.

#### 2. LangGraph DeepAgents
- **CLI Installation**: `cp -r langdocx ~/.deepagents/agent/skills/`
- **In Code**: Load via `skills=["./skills/"]`.
- **Verify**: Run `deepagents skills list`.

#### 3. Cursor
- **Installation**: Place the folder in `.cursor/skills/langdocx/` within your project root.
- **Verify**: Use the `/skills` command in the agent interface.

#### 4. VSCode Copilot
- **Installation**: Place the folder in `.vscode-copilot/skills/langdocx/` (project or global).
- **Verify**: Type `/skills` in the Copilot Chat.

#### 5. Google Antigravity
- **Installation**: Place the folder in the `skills/` directory of your workspace.
- **Verify**: Run `/skills list`.

---

## 中文

`langdocx` 是一个专为编写长篇技术文档设计的专家级 Agent 技能。提供自动化目录结构生成、多文件 Markdown 合并、通过 Pandoc 输出 DOCX，以及字数校验功能，确保文档满足最低篇幅要求。

### 功能特性
- **长文档编写**：自动生成符合层级结构的文件夹和 Markdown 内容框架。
- **结构驱动流程**：通过 `structure.json` 定义文档大纲，脚本负责脚手架搭建与内容合并。
- **DOCX 输出**：通过 Pandoc 结合参考模板将合并后的 Markdown 转换为 Word 格式。
- **字数校验**：监控总字符数并标记未填写的占位符，确保草稿满足最低篇幅要求。

### 环境要求
- **Bun**: 用于运行 TypeScript 脚本。
- **Pandoc**: 核心文档转换引擎。

### 流程概览

```
structure.json
      ↓  bun run scripts/init_structure.ts
 带前缀文件夹 + content.md 占位文件
      ↓  （向各 content.md 填写内容）
 bun run scripts/check_stats.ts --md <dir> [min-chars]
      ↓  bun run scripts/md2docx.ts all
 output/<name>_Complete_Draft.docx
```

### 安装与配置

`langdocx` 遵循 **Agent Skills 开放标准**。将此文件夹放入对应 AI Agent 的技能目录即可安装。

#### 1. Claude Code
- **项目级**: `mkdir -p .claude/skills/ && cp -r langdocx .claude/skills/`
- **全局级**: `mkdir -p ~/.claude/skills/ && cp -r langdocx ~/.claude/skills/`
- **验证**: 重启 Claude 并输入 `/skills`。

#### 2. LangGraph DeepAgents
- **CLI 安装**: `cp -r langdocx ~/.deepagents/agent/skills/`
- **代码调用**: 通过 `skills=["./skills/"]` 加载。
- **验证**: 运行 `deepagents skills list`。

#### 3. Cursor
- **安装**: 在项目根目录创建 `.cursor/skills/langdocx/` 并放入此文件夹。
- **验证**: 在 Agent 界面使用 `/skills` 命令。

#### 4. VSCode Copilot
- **安装**: 将文件夹放入 `.vscode-copilot/skills/langdocx/`（项目或全局）。
- **验证**: 在 Copilot Chat 中输入 `/skills`。

#### 5. Google Antigravity
- **安装**: 将文件夹放入工作区的 `skills/` 目录。
- **验证**: 运行 `/skills list`。


## 许可证 / License

本项目采用 [Apache-2.0](LICENSE) 许可证。
