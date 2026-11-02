---
title: Evernote
description: Export your Evernote notebooks as .enex files and import them into Notesnook — attachments, web clips, tags and notebooks included.
pageTitle: How to import Evernote notes into Notesnook (.enex)
keywords:
  - import enex
  - how to export evernote notes
  - evernote to notesnook
  - evernote alternative import
schema: howto
---

# How do I import notes from Evernote?

Here is how to move your notes from Evernote into Notesnook.

## Exporting your Evernote notebooks

::: info
If you are tech savvy and know your way around a computer, you can use a tool like [evernote-backup](https://github.com/vzhd1701/evernote-backup) to quickly export all your Evernote notes as .ENEX files.

:::

1. Open the Evernote desktop app — exporting is not possible from the Evernote web app — and go to `{{notebooks}}` in the side menu:
   ![The Notebooks section in the Evernote desktop app side menu](/static/evernote-importer/1.png)
2. Click the three dot button on each notebook and click `Export Notebook`
   ![The three dot menu on an Evernote notebook, showing Export Notebook](/static/evernote-importer/2.png)
3. Choose `ENEX format` then click `{{export}}`, and save it to your desired location. Repeat this for all the Notebooks you want to import into Notesnook.
   ![The Evernote export dialog with ENEX chosen as the format](/static/evernote-importer/3.png)

## Importing .ENEX files into Notesnook

Once you have the `.enex` files containing your Evernote notes, it is time to import them.

1. Open the Notesnook app (web or desktop)
2. Go to `Settings > Import & export > Notesnook Importer` and select Evernote from the list of apps.
   ![The Notesnook Importer app list with Evernote selected](/static/evernote-importer/4.png)
3. Drop (or select) the `.enex` files you exported earlier from Evernote, and click the "Start importing" button.
   ![The Notesnook Importer drop zone, ready to accept the export file](/static/evernote-importer/5.png)
4. Once the importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

Notesnook Importer is one of the most robust Evernote importers, supporting almost 100% of Evernote formats. Here's a list of everything that can (or can't be) imported into Notesnook:

- [x] Attachments
- [x] Web clips (full page, screenshot, bookmark, article, & simplified article are all supported)
- [x] Tasks (currently only the task items get imported without any metadata)
- [x] Links
- [x] Images
- [x] Rich text (bold, italic, lists etc.)
- [ ] Reminders
- [x] Internal note links (limitation: links only resolve correctly if the link text exactly matches the Evernote note title)
- [x] Notebooks
- [x] Tags

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your Evernote export is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import from Google Keep](/importing-notes/import-notes-from-googlekeep) — moving notes out of Google Keep
- [Import from Joplin](/importing-notes/import-notes-from-joplin) — moving notes out of Joplin
- [Import from Obsidian](/importing-notes/import-notes-from-obsidian) — moving notes out of Obsidian
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to your notes after the import
