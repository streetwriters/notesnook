---
title: Skiff Pages
---

# How do I import notes from Skiff Pages?

The following steps will help you quickly import your notes from Skiff Pages into Notesnook.

## Exporting your Skiff Pages

1. Open the [Skiff Pages](https://app.skiff.com) app
2. Open Settings > Export or just go directly to [https://app.skiff.com/dashboard/?settingTab=export](https://app.skiff.com/dashboard/?settingTab=export)
   ![](/static/skiff-importer/1.png)
3. Click on the Export button next to `Pages and Files` — this might take a few minutes depending on how many pages you have.
4. Once the export is complete, save the `Skiff.zip` file at your preferred location.
   ![](/static/skiff-importer/2.png)

## Importing Skiff.zip file into Notesnook

Once you have the `Skiff.zip` file containing your Skiff pages, its time to import them into Notesnook.

1. Go to [https://importer.notesnook.com/](https://importer.notesnook.com/) on your PC/Laptop.
2. From the list of note apps to import from, select "Markdown".
   ![](/static/skiff-importer/3.png)
3. Drop your Skiff.zip file, or click anywhere inside the box to browse and select your Skiff.zip file. Then click "Start processing".
   ![](/static/skiff-importer/4.png)
4. Once the Importer finishes processing your files, download the .zip file.
   ![](/static/import-ready.png)
5. After you have downloaded the `.zip` file, [go to the Notesnook Web App](https://app.notesnook.com/) > Settings > Notesnook Importer. Select the .zip you downloaded earlier and click "Start import" button.
   ![](/static/import-zip-app.png)
6. Once importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

- [x] Images
- [x] Code blocks
- [ ] Math blocks (Skiff Pages doesn't mark them properly so there's no way to detect them.)
- [x] Tables
- [x] Rich text (bold, italic, headings, lists etc.)
- [x] Task lists
