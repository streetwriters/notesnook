---
title: Google Keep
---

# How do I import notes from Google Keep?

The following steps will help you quickly import your notes from Google Keep into Notesnook.

## Exporting your Google Keep notes

1. Go to [Google Takeout](https://takeout.google.com/settings/takeout) and log into your Google account.
2. On the Google Takeout page, first deselect all the items by clicking on `Deselect all`, and then scroll down and select only `Keep` from the list. Once selected, click on `Next Step` by scrolling to the very bottom of the page.
   ![](/static/google-keep-importer/1.png)
3. On the next section, leave everything as is and just click on the "Create export" button:
   ![](/static/google-keep-importer/2.png)
4. Download the exported .zip file once it becomes available:
   ![](/static/google-keep-importer/3.png)

## Importing Google Takeout into Notesnook

Once you have the Google Takeout containing your Google Keep notes, its time to import them into Notesnook.

1. Go to [https://importer.notesnook.com/](https://importer.notesnook.com/) and select `Google Keep` from list of apps.
   ![](/static/google-keep-importer/4.png)
2. Drop the .zip backup file(s) you exported earlier from Google Takeout in the box or click anywhere to open system file picker to select the backup.
   ![](/static/google-keep-importer/5.png)
3. Once the Importer finishes processing your files, download the .zip file.
   ![](/static/import-ready.png)
4. After you have downloaded the `.zip` file, [go to the Notesnook Web App](https://app.notesnook.com/) > Settings > Notesnook Importer. Select the .zip you downloaded earlier and click "Start import" button.
   ![](/static/import-zip-app.png)
5. Once importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

Notesnook Importer is one of the most robust Google Keep importers around supporting almost 100% of Google Keep formats. Here's a list of everything that can (or can't be) imported into Notesnook:

- [x] Attachments
- [x] Images
- [x] Checklists & other lists
- [x] Links
- [x] Tags/Labels
- [x] Pinned status
- [x] Colors
