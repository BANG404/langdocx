只生成 docx ，参考下面的方法来验证页数：

```python
import zipfile
import re

def get_docx_page_count(docx_path):
    with zipfile.ZipFile(docx_path) as docx_zip:
        app_xml = docx_zip.read('docProps/app.xml').decode('utf-8')
        match = re.search(r'<Pages>(\d+)</Pages>', app_xml)
        if match:
            return int(match.group(1))
        return 0  # 未找到则返回 0

# 示例使用
page_count = get_docx_page_count('example.docx')
print(f"页数: {page_count}")
```

构建一个 check script 来验证生成的 docx 是否满足页数要求
