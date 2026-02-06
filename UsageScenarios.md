场景 1: 用户请求撰写长文档
    User: "写一份150页的技术方案"
    Agent: [激活 langdocx skill]
       1. 分析需求和参考材料
       2. 创建分层目录结构，使用 init_structure.ts
       3. 逐章节生成内容，替换 content.md 初始化的内容
       4. 合并并转换为 DOCX
       5. 验证页数并原文扩写
场景 2: 样式替换
    User: "把这个文档格式改成和参考文档一样"
    Agent: [激活 langdocx skill]
       1. 提取参考 DOCX 的 document.xml 和 styles.xml
       2. 根据 文本的语义分析 模板的 title，正文等的字体、大小、编号模式等
       3. 创建 template.docx
       4. 用 Pandoc 转换源文档