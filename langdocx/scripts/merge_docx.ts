
import { file, write } from "bun";
import { join, relative } from "path";
import { readdir } from "node:fs/promises";

export let TARGET_ROOTS = [
    {
        id: process.env.DOCX_PKG_ID || "Package1_Platform",
        name: process.env.DOCX_PKG_NAME || "分包一：智能审计服务平台",
        path: process.env.DOCX_PKG_PATH || "/Users/ss/Documents/常州市审计电子数据综合管理与分析应用平台/分包一/01_技术方案"
    },
    {
        id: "Package2_DataWarehouse",
        name: "分包二：审计数据仓库与建模",
        path: "/Users/ss/Documents/常州市审计电子数据综合管理与分析应用平台/分包二/01_技术方案"
    }
];

// 如果环境变量中有具体的配置，甚至可以覆盖整个数组
if (process.env.DOCX_CONFIG) {
    try {
        TARGET_ROOTS = JSON.parse(process.env.DOCX_CONFIG);
    } catch (e) {
        console.warn("解析 DOCX_CONFIG 失败，使用默认配置");
    }
}

export const WORDS_PER_PAGE = parseInt(process.env.WORDS_PER_PAGE || "550");
export const AUTHOR = process.env.DOCX_AUTHOR || "常州市审计局";

async function getFiles(dir: string): Promise<string[]> {
    const dirents = await readdir(dir, { withFileTypes: true });

    // 排序逻辑：content.md 优先，其余按数字编号排序
    dirents.sort((a, b) => {
        if (a.name === "content.md") return -1;
        if (b.name === "content.md") return 1;

        const numA = parseInt(a.name.match(/^\d+/)?.[0] || "999");
        const numB = parseInt(b.name.match(/^\d+/)?.[0] || "999");

        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
    });

    const files: string[] = [];
    for (const dirent of dirents) {
        const res = join(dir, dirent.name);
        if (dirent.isDirectory()) {
            files.push(...await getFiles(res));
        } else if (dirent.name === "content.md") {
            files.push(res);
        }
    }
    return files;
}

export function countContentChars(text: string) {
    return text
        .replace(/<!--.*?-->/gs, "") // 移除注释
        .replace(/\s+/g, "")         // 移除所有空白符
        .length;
}

export async function mergePackage(pkgPath: string, pkgName: string, pkgId: string) {
    console.log(`\n📦 正在合并 ${pkgName}...`);
    const files = await getFiles(pkgPath);
    let fullContent = "";

    fullContent += `---\n`;
    fullContent += `title: "${pkgName}"\n`;
    fullContent += `author: "${AUTHOR}"\n`;
    fullContent += `date: "${new Date().toLocaleDateString()}"\n`;
    fullContent += `toc: true\n`;
    fullContent += `toc-title: "目录"\n`;
    fullContent += `--- \n\n`;

    for (const f of files) {
        const relPath = relative(pkgPath, f);
        // 目录层级: 01_项目概述/content.md → depth 0 (章节级, H1 不变)
        //           01_项目概述/01_子节/content.md → depth 1 (# 升为 ##)
        const depth = Math.max(0, relPath.split("/").length - 2);
        let rawContent = await file(f).text();

        // 优化：在每个一级章节前增加分页符
        if (depth === 0 && fullContent.length > 500) {
            fullContent += `\n\n\\newpage\n\n`; 
        }

        if (depth > 0) {
            const headerPrefix = "#".repeat(depth);
            rawContent = rawContent.replace(/^(#+ )/gm, headerPrefix + "$1");
        }

        fullContent += `\n\n<!-- Source: ${relPath} -->\n\n`;
        fullContent += rawContent;
        fullContent += "\n";
    }

    const charCount = countContentChars(fullContent);
    const estimatedPages = (charCount / WORDS_PER_PAGE).toFixed(1);

    console.log(`✅ ${pkgId} 合并完成:`);
    console.log(`   - 包含文件: ${files.length} 个`);
    console.log(`   - 总字符数: ${charCount}`);
    console.log(`   - 预估页数: ${estimatedPages}`);

    const outputPath = join(pkgPath, "../", `${pkgId}_Complete_Draft.md`);
    await write(outputPath, fullContent);
    return outputPath;
}

if (import.meta.main) {
    const args = process.argv.slice(2);
    
    // 支持直接传参: bun run merge_docx.ts <path> <name> <id>
    if (args.length >= 3) {
        try {
            await mergePackage(args[0], args[1], args[2]);
        } catch (e) {
            console.error(`❌ 合并失败: `, e);
        }
    } else {
        for (const root of TARGET_ROOTS) {
            try {
                await mergePackage(root.path, root.name, root.id);
            } catch (e) {
                console.error(`❌ 处理 ${root.name} 时出错: `, e);
            }
        }
    }
}

