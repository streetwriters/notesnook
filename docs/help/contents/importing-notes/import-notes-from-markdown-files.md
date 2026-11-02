---
title: Markdown files
description: Import .md files from any app or folder into Notesnook — headings, lists, code blocks and links are preserved.
pageTitle: How to import Markdown files into Notesnook
keywords:
  - import markdown files
  - markdown notes app import
  - md files to notes
schema: howto
---

# How do I import notes from Markdown files?

1. Open the Notesnook app (web or desktop)
2. Go to `Settings > Import & export > Notesnook Importer` and select "Markdown".
   ![The Notesnook Importer app list with Markdown selected](/static/markdown-importer/1.png)
3. Drop your .md files, or click anywhere inside the box to browse and select your .md files. You can also provide a .zip file containing all your .md files. Then click "Start importing".
   ![The Notesnook Importer drop zone, ready to accept the export file](/static/markdown-importer/2.png)
4. Once the importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

- [x] 100% support for CommonMark syntax
- [x] GitHub flavored markdown (task lists, tables etc.)
- [x] Obsidian flavored markdown (embedded files, comments etc.)
- [x] Subscript and superscript (`H~2~O` and `19^th^`)
- [x] Highlights (`==highlighted==`)
- [x] Images and links (links that point to files get added as attachments)

> Note: For best results, it is recommended to ZIP all your .md files and their attachments so they can be found by the importer.

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your Markdown files export is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import from Evernote](/importing-notes/import-notes-from-evernote) — moving notes out of Evernote
- [Import from Google Keep](/importing-notes/import-notes-from-googlekeep) — moving notes out of Google Keep
- [Import from Joplin](/importing-notes/import-notes-from-joplin) — moving notes out of Joplin
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to your notes after the import
