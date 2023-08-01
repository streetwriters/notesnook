---
title: Obsidian
---

# How do I import notes from Obsidian?

1. Go to [https://importer.notesnook.com/](https://importer.notesnook.com/) on your PC/Laptop.
2. From the list of note apps to import from, select "Obsidian".
   ![](/static/markdown-importer/1.png)
3. Drop your .md files from your Obsidian Vault, or click anywhere inside the box to browse and select your .md files. You can also provide a .zip file containing all your Obsidian .md files. Then click "Start processing".
   ![](/static/markdown-importer/2.png)
4. Once the Importer finishes processing your files, download the .zip file.
   <img src="/static/import-ready.png" alt="Download importer .zip file"/>
5. After you have downloaded the `.zip` file, [go to the Notesnook Web App](https://app.notesnook.com/) > Settings > Notesnook Importer. Select the .zip you downloaded earlier and click "Start import" button.
   <img src="/static/import-zip-app.png" alt="Import .zip in Notesnook app"/>
6. Once importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

- [ ] Internal links
- [x] Embedded files (supporting both `![[path-to-file]]` and `![](path/to/image.png)`)
- [x] Full CommonMark Markdown syntax
- [ ] Callouts
- [x] Metadata (tags etc.)
- [x] Comments (block & inline both get removed)
