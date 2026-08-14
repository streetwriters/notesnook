---
title: Joplin
description: Export your Joplin notebooks and import them into Notesnook without losing notebooks, tags or attachments.
pageTitle: How to import Joplin notes into Notesnook
keywords:
  - import joplin notes
  - joplin to notesnook
  - joplin jex import
schema: howto
---

# How do I import notes from Joplin notes app?

Here is how to move your notes from Joplin into Notesnook.

1. Open the Joplin Desktop app.
2. Click `File > Export All -> JEX - Joplin Export File` and save the .JEX file at your desired location.
   ![The Joplin export menu, with JEX chosen as the export format](/static/joplin-importer/1.png)
3. Open the Notesnook app (web or desktop)
4. Go to `Settings > Import & export > Notesnook Importer` and select `Joplin` from list of apps.
   ![The Notesnook Importer app list with Joplin selected](/static/joplin-importer/2.png)
5. Drop (or select) the .jex backup file you exported earlier from Joplin:
   ![The Notesnook Importer drop zone, ready to accept the export file](/static/joplin-importer/3.png)
6. Once the importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

- [x] Rich text (lists, links, bold, italic etc.)
- [x] Images & attachments
- [x] Tags
- [x] Folders (currently only 2 levels of nesting is supported)
- [ ] Internal links to other notes

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your Joplin export is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import from Evernote](/importing-notes/import-notes-from-evernote) — moving notes out of Evernote
- [Import from Google Keep](/importing-notes/import-notes-from-googlekeep) — moving notes out of Google Keep
- [Import from Obsidian](/importing-notes/import-notes-from-obsidian) — moving notes out of Obsidian
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to your notes after the import
