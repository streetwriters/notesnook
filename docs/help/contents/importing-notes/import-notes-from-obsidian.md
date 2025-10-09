---
title: Obsidian
---

# How do I import notes from Obsidian?

1. Open the Notesnook app (web or desktop)
2. Go to `Settings > Notesnook Importer` and select "Obsidian".
   ![](/static/obsidian-importer/1.png)
3. Drop your .md files from your Obsidian Vault, or click anywhere inside the box to browse and select your .md files. You can also provide a .zip file containing all your Obsidian .md files. Then click "Start processing".
   ![](/static/obsidian-importer/2.png)
4. Once the importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

- [ ] Internal links
- [x] Embedded files (supporting both `![[path-to-file]]` and `![](path/to/image.png)`)
- [x] Full CommonMark Markdown syntax
- [ ] Callouts
- [x] Metadata (tags etc.)
- [x] Comments (block & inline both get removed)
