---
title: Google Keep
description: Export Google Keep with Google Takeout and import the archive into Notesnook, keeping labels, images and checklists.
pageTitle: How to import Google Keep notes into Notesnook
keywords:
  - import google keep notes
  - google takeout notes
  - google keep alternative
schema: howto
---

# How do I import notes from Google Keep?

The following steps will help you quickly import your notes from Google Keep into Notesnook.

## Exporting your Google Keep notes

1. Go to [Google Takeout](https://takeout.google.com/settings/takeout) and log into your Google account.
2. On the Google Takeout page, first deselect all the items by clicking on `Deselect all`, and then scroll down and select only `{{keep}}` from the list. Once selected, click `Next Step` by scrolling to the very bottom of the page.
   ![The Google Takeout page with every product deselected except Keep](/static/google-keep-importer/1.png)
3. Leave everything in the next section as it is and click the "Create export" button:
   ![The Google Takeout export options, with the Create export button at the bottom](/static/google-keep-importer/2.png)
4. Download the exported .zip file once it becomes available:
   ![The finished Google Takeout export, ready to download as a .zip file](/static/google-keep-importer/3.png)

## Importing Google Takeout into Notesnook

Once you have the Google Takeout containing your Google Keep notes, its time to import them into Notesnook.

1. Open the Notesnook app (web or desktop)
2. Go to `Settings > Import & export > Notesnook Importer` and select `Google Keep` from list of apps.
   ![The Notesnook Importer app list with Google Keep selected](/static/google-keep-importer/4.png)
3. Drop the .zip backup file(s) you exported earlier from Google Takeout in the box or click anywhere to open system file picker to select the backup.
   ![The Notesnook Importer drop zone, ready to accept the export file](/static/google-keep-importer/5.png)
4. Once the importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

Notesnook Importer is one of the most robust Google Keep importers around supporting almost 100% of Google Keep formats. Here's a list of everything that can (or can't be) imported into Notesnook:

- [x] Attachments
- [x] Images
- [x] Checklists & other lists
- [x] Links
- [x] Tags/Labels
- [x] Pinned status
- [x] Colors

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your Google Keep export is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import from Evernote](/importing-notes/import-notes-from-evernote) — moving notes out of Evernote
- [Import from Joplin](/importing-notes/import-notes-from-joplin) — moving notes out of Joplin
- [Import from Obsidian](/importing-notes/import-notes-from-obsidian) — moving notes out of Obsidian
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to your notes after the import
