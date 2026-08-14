---
title: Obsidian
description: Import an Obsidian vault into Notesnook — your Markdown files, folders and attachments become encrypted notes.
pageTitle: How to import an Obsidian vault into Notesnook
keywords:
  - import obsidian vault
  - obsidian to notesnook
  - obsidian markdown import
schema: howto
---

# How do I import notes from Obsidian?

1. Open the Notesnook app (web or desktop)
2. Go to `Settings > Import & export > Notesnook Importer` and select "Obsidian".
   ![The Notesnook Importer app list with Obsidian selected](/static/obsidian-importer/1.png)
3. Drop your .md files from your Obsidian Vault, or click anywhere inside the box to browse and select your .md files. You can also provide a .zip file containing all your Obsidian .md files. Then click "Start importing".
   ![The Notesnook Importer drop zone, ready to accept the export file](/static/obsidian-importer/2.png)
4. Once the importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

- [ ] Internal links
- [x] Embedded files (supporting both `![[path-to-file]]` and `![Image in Notesnook](path/to/image.png)`)
- [x] Full CommonMark Markdown syntax
- [ ] Callouts
- [x] Metadata (tags etc.)
- [x] Comments (block & inline both get removed)

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your Obsidian export is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import from Evernote](/importing-notes/import-notes-from-evernote) — moving notes out of Evernote
- [Import from Google Keep](/importing-notes/import-notes-from-googlekeep) — moving notes out of Google Keep
- [Import from Joplin](/importing-notes/import-notes-from-joplin) — moving notes out of Joplin
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to your notes after the import
