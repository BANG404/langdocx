/**
 * md2docx.ts - Markdown 转 DOCX 转换脚本
 * 
 * 使用 pandoc + reference-doc 模板将 Markdown 转为符合技术方案格式的 DOCX 文件
 * 
 * 样式映射 (来自 技术方案(4).docx 分析):
 *   - Heading 1: 一级标题 16pt 宋体加粗, 编号 1.
 *   - Heading 2: 二级标题 15pt 宋体加粗, 编号 1.1.
 *   - Heading 3: 三级标题 14pt 宋体加粗, 编号 1.1.1.
 *   - Heading 4: 四级标题 12pt 宋体加粗, 编号 1.1.1.1.
 *   - Body Text: 正文 12pt 宋体, 首行缩进2字符, 1.5倍行距
 *   - First Paragraph: 标题后第一段 (继承 Body Text)
 *   - Compact: 紧凑列表段落
 *   - Source Code: 代码块 (Consolas 10pt, 灰底边框)
 *   - Block Text: 引用块 (左侧灰色竖线)
 *   - Table Grid: 表格 (全边框)
 *   - Title/Subtitle: 封面标题
 * 
 * 页面设置: A4, 上下边距 2.54cm, 左右边距 3.17cm
 * 
 * Usage:
 *   bun run md2docx.ts <input.md> [output.docx]
 *   bun run md2docx.ts --all          # 转换所有分包
 */

import { $ } from "bun";
import { join, dirname, basename, resolve } from "path";
import { existsSync } from "fs";
import { TARGET_ROOTS, mergePackage } from "./merge_docx";

const PROJECT_ROOT = dirname(import.meta.path);
const TEMPLATE_PATH = process.env.DOCX_TEMPLATE || join(PROJECT_ROOT, "../assets/template.docx");
const TOC_DEPTH = parseInt(process.env.DOCX_TOC_DEPTH || "4");

/**
 * 预处理 Markdown: 移除与 pandoc 不兼容的内容，清理标题编号冲突
 */
function preprocessMarkdown(content: string): string {
    // 移除 HTML 注释
    let processed = content.replace(/<!--.*?-->/gs, "");

    // 移除 \newpage 并替换为 pandoc 分页符
    processed = processed.replace(/\\newpage/g, "");

    // 移除标题中的手动编号，避免与 DOCX 模板自动编号冲突
    // 匹配模式：
    //   ## 2.1 标题    → ## 标题
    //   ### 2.1.1 标题 → ### 标题
    //   ## 1. 标题     → ## 标题
    //   ### 3.2.1. 标题 → ### 标题
    processed = processed.replace(
        /^(#{1,6})\s+\d+(?:\.\d+)*\.?\s+/gm,
        "$1 "
    );

    // 处理连续空行（超过2个合并为2个）
    processed = processed.replace(/\n{4,}/g, "\n\n\n");

    return processed;
}

/**
 * 使用 pandoc 将 Markdown 文件转换为 DOCX
 */
async function convertMdToDocx(
    inputMd: string,
    outputDocx: string,
    options: {
        toc?: boolean;
        tocDepth?: number;
        numberSections?: boolean;
    } = {}
): Promise<void> {
    const {
        toc = true,
        tocDepth = 4,
        numberSections = false,
    } = options;

    if (!existsSync(TEMPLATE_PATH)) {
        throw new Error(`模板文件不存在: ${TEMPLATE_PATH}`);
    }

    if (!existsSync(inputMd)) {
        throw new Error(`输入文件不存在: ${inputMd}`);
    }

    // 预处理 Markdown
    const rawContent = await Bun.file(inputMd).text();
    const processed = preprocessMarkdown(rawContent);
    const tmpInput = inputMd + ".tmp.md";
    await Bun.write(tmpInput, processed);

    // 构建 pandoc 命令参数
    const args: string[] = [
        tmpInput,
        "-o", outputDocx,
        "--reference-doc", TEMPLATE_PATH,
        "--from", "markdown+yaml_metadata_block+pipe_tables+grid_tables+table_captions+fenced_code_blocks+backtick_code_blocks+fenced_divs+bracketed_spans",
        "--to", "docx",
        "--wrap=none",
    ];

    if (toc) {
        args.push("--toc");
        args.push("--toc-depth", String(tocDepth));
    }

    if (numberSections) {
        args.push("--number-sections");
    }

    console.log(`📝 正在转换: ${basename(inputMd)} → ${basename(outputDocx)}`);
    console.log(`   模板: ${basename(TEMPLATE_PATH)}`);

    try {
        const proc = Bun.spawn(["pandoc", ...args], {
            stdout: "pipe",
            stderr: "pipe",
        });
        const exitCode = await proc.exited;
        const stderr = await new Response(proc.stderr).text();
        const stdout = await new Response(proc.stdout).text();

        if (exitCode !== 0) {
            throw new Error(`pandoc exit code ${exitCode}: ${stderr || stdout}`);
        }
        if (stderr.trim()) {
            console.log(`   pandoc 警告: ${stderr.trim()}`);
        }
    } catch (err: any) {
        if (err.message?.startsWith("pandoc exit code")) throw err;
        throw new Error(`pandoc 转换失败: ${err.message || err}`);
    } finally {
        // 清理临时文件
        try {
            await $`rm -f ${tmpInput}`.quiet();
        } catch {}
    }

    if (!existsSync(outputDocx)) {
        throw new Error(`输出文件未生成: ${outputDocx}`);
    }

    const stat = Bun.file(outputDocx);
    console.log(`✅ 转换成功: ${outputDocx}`);
    console.log(`   文件大小: ${(stat.size / 1024).toFixed(1)} KB`);
}

/**
 * 转换单个 Markdown 文件
 */
async function convertSingle(inputPath: string, outputPath?: string): Promise<void> {
    const input = resolve(inputPath);
    const output = outputPath
        ? resolve(outputPath)
        : input.replace(/\.md$/, ".docx");

    await convertMdToDocx(input, output);
}

/**
 * 合并并转换所有分包
 */
async function convertAll(): Promise<void> {
    console.log("🚀 开始合并并转换所有分包...\n");

    for (const root of TARGET_ROOTS) {
        try {
            // 先合并 Markdown
            const mergedMdPath = await mergePackage(root.path, root.name, root.id);

            // 再转为 DOCX
            const docxPath = mergedMdPath.replace(/\.md$/, ".docx");
            await convertMdToDocx(mergedMdPath, docxPath, {
                toc: true,
                tocDepth: TOC_DEPTH,
            });

            console.log(`\n📦 ${root.name} 完成!`);
            console.log(`   MD:   ${mergedMdPath}`);
            console.log(`   DOCX: ${docxPath}\n`);
        } catch (e) {
            console.error(`❌ 处理 ${root.name} 时出错:`, e);
        }
    }

    console.log("\n🎉 全部转换完成!");
}

// ============ CLI 入口 ============
if (import.meta.main) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
用法:
  bun run md2docx.ts <input.md> [output.docx]    转换单个文件
  bun run md2docx.ts --all                        合并并转换所有分包

模板样式说明 (来自 技术方案(4).docx):
  # 标题       → Heading 1 (16pt 宋体加粗, 编号 1.)
  ## 标题      → Heading 2 (15pt 宋体加粗, 编号 1.1.)
  ### 标题     → Heading 3 (14pt 宋体加粗, 编号 1.1.1.)
  #### 标题    → Heading 4 (12pt 宋体加粗, 编号 1.1.1.1.)
  正文段落     → Body Text (12pt 宋体, 首行缩进2字符, 1.5倍行距)
  > 引用       → Block Text (左侧灰色竖线)
  \`\`\`代码\`\`\`    → Source Code (Consolas 10pt, 灰底)
  | 表格 |     → Table Grid (全边框)

页面: A4, 上下 2.54cm, 左右 3.17cm
`);
        process.exit(1);
    }

    if (args[0] === "--all") {
        await convertAll();
    } else if (args[0] === "--merge-run" && args.length >= 4) {
        // 支持直接从路径合并并转换: bun run md2docx.ts --merge-run <path> <name> <id>
        const pkgPath = args[1];
        const pkgName = args[2];
        const pkgId = args[3];
        console.log(`🚀 开始处理分包: ${pkgName}`);
        const mergedMdPath = await mergePackage(pkgPath, pkgName, pkgId);
        const docxPath = mergedMdPath.replace(/\.md$/, ".docx");
        await convertMdToDocx(mergedMdPath, docxPath, {
            toc: true,
            tocDepth: TOC_DEPTH,
        });
    } else {
        await convertSingle(args[0], args[1]);
    }
}
