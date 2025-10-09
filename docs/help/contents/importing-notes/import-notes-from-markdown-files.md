---
title: Markdown files
---

# How do I import notes from Markdown files?

1. Open the Notesnook app (web or desktop)
2. Go to `Settings > Notesnook Importer` and select "Markdown".
   ![](/static/markdown-importer/1.png)
3. Drop your .md files, or click anywhere inside the box to browse and select your .md files. You can also provide a .zip file containing all your .md files. Then click "Start processing".
   ![](/static/markdown-importer/2.png)
4. Once the importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

- [x] 100% support for CommonMark syntax
- [x] GitHub flavored markdown (task lists, tables etc.)
- [x] Obsidian flavored markdown (embedded files, comments etc.)
- [x] Subscript and superscript (`H~2~O` and `19^th^`)
- [x] Highlights (`==highlighted==`)
- [x] Images and links (links that point to files get added as attachments)

> Note: For best results, it is recommended to ZIP all your .md files and their attachments so they can be found by the importer.
