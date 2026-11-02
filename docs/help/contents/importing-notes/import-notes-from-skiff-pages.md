---
title: Skiff Pages
description: Skiff is gone — export your Skiff Pages and import them into Notesnook so your notes survive the shutdown.
pageTitle: How to import Skiff Pages into Notesnook
keywords:
  - import skiff pages
  - skiff shut down notes
  - skiff alternative
schema: howto
---

# How do I import notes from Skiff Pages?

The following steps will help you quickly import your notes from Skiff Pages into Notesnook.

## Exporting your Skiff Pages

1. Open the [Skiff Pages](https://app.skiff.com) app
2. Open Settings > Export, or go straight to [https://app.skiff.com/dashboard/?settingTab=export](https://app.skiff.com/dashboard/?settingTab=export)
   ![The Export tab in Skiff settings](/static/skiff-importer/1.png)
3. Click the Export button next to `Pages and Files` — this might take a few minutes depending on how many pages you have.
4. Once the export is complete, save the `Skiff.zip` file at your preferred location.
   ![The finished Skiff export, ready to save as Skiff.zip](/static/skiff-importer/2.png)

## Importing Skiff.zip file into Notesnook

Once you have the `Skiff.zip` file containing your Skiff pages, its time to import them into Notesnook.

1. Open the Notesnook app (web or desktop)
2. Go to `Settings > Import & export > Notesnook Importer` and select "Skiff Pages".
   ![The Notesnook Importer app list with Skiff Pages selected](/static/skiff-importer/3.png)
3. Drop your Skiff.zip file, or click anywhere inside the box to browse and select your Skiff.zip file. Then click "Start importing".
   ![The Notesnook Importer drop zone, ready to accept the export file](/static/skiff-importer/4.png)
4. Once the importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

- [x] Images
- [x] Code blocks
- [ ] Math blocks (Skiff Pages doesn't mark them properly so there's no way to detect them.)
- [x] Tables
- [x] Rich text (bold, italic, headings, lists etc.)
- [x] Task lists

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your Skiff Pages export is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import from Evernote](/importing-notes/import-notes-from-evernote) — moving notes out of Evernote
- [Import from Google Keep](/importing-notes/import-notes-from-googlekeep) — moving notes out of Google Keep
- [Import from Joplin](/importing-notes/import-notes-from-joplin) — moving notes out of Joplin
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to your notes after the import
