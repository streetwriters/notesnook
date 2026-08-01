---
title: Simplenote
description: Export your Simplenote notes and import them into Notesnook, keeping tags and note history intact where possible.
pageTitle: How to import Simplenote notes into Notesnook
keywords:
  - import simplenote notes
  - simplenote to notesnook
  - simplenote alternative
schema: howto
---

# How to import notes from Simplenote notes app?

Here is how to move your notes from Simplenote into Notesnook.

1. Open Simplenote app on Desktop or Login to [https://app.simplenote.com](https://app.simplenote.com).
2. Go to sidebar and click Settings.
   ![The Settings entry in the Simplenote sidebar](/static/simplenote-importer/1.png)
3. Go to `Tools` tab in Settings
   ![The Tools tab in Simplenote settings, where Export notes lives](/static/simplenote-importer/2.png)
4. Click `Export notes` to download your notes as a .zip file.
5. Open the Notesnook app (web or desktop)
6. Go to `Settings > Import & export > Notesnook Importer` and select `Simplenote` from list of apps.
   ![The Notesnook Importer app list with Simplenote selected](/static/simplenote-importer/3.png)
7. Drop the .zip backup file you exported earlier from Simplenote in the box or click anywhere to open system file picker to select the backup and click "Start importing".
   ![The Notesnook Importer drop zone, ready to accept the export file](/static/simplenote-importer/4.png)
8. Once importing completes you should see all your notes in Notesnook. If you face any issues during importing, [report it on github](https://github.com/streetwriters/notesnook).

## Supported formats

Simplenote's export is, well, pretty simple and the Notesnook Importer supports 100% of it. It also preserves all the formatting and indenting in the imported notes.

## Troubleshooting

### Some of my notes have weird whitespacing and broken formatting after import. What do I do?

This can happen in notes for which you have enabled Markdown in Simplenote. Notesnook Importer follows this flag during processing and respects Markdown rules during the conversion to HTML. If you want to preserve the formatting of your notes, it is best that you disable the Markdown formatting for all your notes in Simplenote. This will force the Notesnook Importer to import all your notes as plaintext.

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your Simplenote export is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import from Evernote](/importing-notes/import-notes-from-evernote) — moving notes out of Evernote
- [Import from Google Keep](/importing-notes/import-notes-from-googlekeep) — moving notes out of Google Keep
- [Import from Joplin](/importing-notes/import-notes-from-joplin) — moving notes out of Joplin
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to your notes after the import
