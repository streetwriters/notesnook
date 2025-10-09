---
title: Evernote
---

# How do I import notes from Evernote?

The following steps will help you quickly import your notes from Evernote into Notesnook.

## Exporting your Evernote notebooks

> info
>
> If you are tech savvy and know your way around a computer, you can use a tool like [evernote-backup](https://github.com/vzhd1701/evernote-backup) to quickly export all your Evernote notes as .ENEX files.

1. Open the Evernote Desktop app (its not possible to export notes from the Evernote web app), and go to `Notebooks` from the side menu:
   ![](/static/evernote-importer/1.png)
2. Click on the `three-dot` button on each notebook and click on `Export Notebook`
   ![](/static/evernote-importer/2.png)
3. Choose `ENEX format` then click on `Export`, and save it to your desired location. Repeat this for all the Notebooks you want to import into Notesnook.
   ![](/static/evernote-importer/3.png)

## Importing .ENEX files into Notesnook

Once you have all the .ENEX files containing your Evernote notes, its time to import them into Notesnook.

1. Open the Notesnook app (web or desktop)
2. Go to `Settings > Notesnook Importer` and select Evernote from the list of apps.
   ![](/static/evernote-importer/4.png)
3. Drop (or select) the `.enex` files you exported earlier from Evernote, and click the "Start processing" button.
   ![](/static/evernote-importer/5.png)
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
- [x] Internal note links
- [x] Notebooks
- [x] Tags
