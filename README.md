# langdocx

[English](#english) | [中文](#中文)

## English

`langdocx` is an expert-level agent skill designed for authoring long-form technical proposals (50-200 pages) and performing high-fidelity document format cloning. It features automated directory structure generation, multi-file merging, and semantic style extraction from reference DOCX files.

### Key Features
- **Long-form Authoring**: Automated generation of hierarchical folders and Markdown content.
- **Style Cloning**: Extract styles (headers, footers, fonts, indentation) from existing Word templates and apply them to generated documents.
- **Progress Monitoring**: Real-time statistics tools to monitor character counts and estimate page counts.
- **Standardized Workflow**: Enforces a "structure-driven" authoring pattern for consistency across massive documents.

### Environment Requirements
- **Bun**: For running TypeScript scripts.
- **Pandoc**: Core document conversion engine.
- **Unzip**: For extracting Docx reference files for style analysis.

### Installation & Setup

`langdocx` follows the **Agent Skills open standard**. You can install it into various AI agents by placing this folder into their specific skills directory.

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

`langdocx` 是一个专为编写长篇技术建议书（50-200页）和执行高保真文档格式克隆而设计的专家级技能。它提供了自动化目录结构生成、多文件合并以及从参考 DOCX 文件中提取语义样式的功能。

### 功能特性
- **长文档编写**：自动化生成符合层级结构的文件夹和 Markdown 文件。
- **样式克隆**：能够从现有的 Word 模板中提取样式（如页眉、页脚、字体、缩进），并将其应用于生成的文档。
- **进度监控**：提供实时统计工具，监控字符数和预估页数。
- **标准化流程**：强制执行“结构驱动”的编写模式，确保大型文档的一致性。

### 环境要求
- **Bun**: 用于运行 TypeScript 脚本。
- **Pandoc**: 核心文档转换引擎。
- **Unzip**: 用于解压 Docx 参考文件进行样式提取。

### 安装与配置

`langdocx` 遵循 **Agent Skills 开放标准**。您可以将此文件夹放入特定 AI Agent 的技能目录中进行安装。

#### 1. Claude Code
- **项目级**: `mkdir -p .claude/skills/ && cp -r langdocx .claude/skills/`
- **全局级**: `mkdir -p ~/.claude/skills/ && cp -r langdocx ~/.claude/skills/`
- **验证**: 重启 Claude 并输入 `/skills` [code.claude](https://code.claude.com/docs/en/skills)。

#### 2. LangGraph DeepAgents
- **CLI 安装**: `cp -r langdocx ~/.deepagents/agent/skills/` [docs.langchain](https://docs.langchain.com/oss/python/deepagents/cli)
- **代码调用**: 通过 `skills=["./skills/"]` 加载。
- **验证**: 运行 `deepagents skills list`。

#### 3. Cursor
- **安装**: 在项目根目录创建 `.cursor/skills/langdocx/` 并放入此文件夹 [cursor.com](https://cursor.com/docs/get-started/quickstart)。
- **验证**: 在 Agent 界面使用 `/skills` 命令。

#### 4. VSCode Copilot
- **安装**: 将文件夹放入 `.vscode-copilot/skills/langdocx/`（项目或全局） [docs.github](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)。
- **验证**: 在 Copilot Chat 中输入 `/skills`。

#### 5. Google Antigravity
- **安装**: 将文件夹放入工作区的 `skills/` 目录 [codelabs.developers.google](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)。
- **验证**: 运行 `/skills list`。


## 许可证 / License

本项目采用 [Apache-2.0](LICENSE) 许可证。
