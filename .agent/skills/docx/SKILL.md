---
name: docx
description: "DOCX creation, editing, and analysis. Use when working with .docx files — reading content, creating new documents, or editing existing ones."
license: Complete terms in LICENSE.txt
---

# DOCX creation, editing, and analysis

## Overview
A .docx file is a ZIP archive containing XML files.

## Quick Reference
| Task | Approach |
|------|----------|
| Read/analyze content | `pandoc` or unpack for raw XML |
| Create new document | Use `docx-js` |
| Edit existing document | Unpack → edit XML → repack |

## Reading Content
Use python-docx to extract text:
```python
from docx import Document
doc = Document('file.docx')
for p in doc.paragraphs:
    print(p.text)
for table in doc.tables:
    for row in table.rows:
        print([cell.text for cell in row.cells])
```

## Creating New Documents
Use the `docx` npm package (docx-js) for Node.js:
```bash
npm install docx
```

## Editing Existing Documents
1. Unpack the .docx (it's a ZIP)
2. Edit the XML files inside
3. Repack into .docx
