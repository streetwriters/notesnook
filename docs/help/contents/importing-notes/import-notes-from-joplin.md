---
title: Joplin
---

# How do I import notes from Joplin notes app?

The following steps will help you import your notes from Joplin easily.

1. Open the Joplin Desktop app.
2. Click on `File > Export All -> JEX - Joplin Export File` and save the .JEX file at your desired location.
   ![](/static/joplin-importer/1.png)
3. Go to [https://importer.notesnook.com/](https://importer.notesnook.com/) and select `Joplin` from list of apps.
   ![](/static/joplin-importer/2.png)
4. Drop (or select) the .jex backup file you exported earlier from Joplin:
   ![](/static/joplin-importer/3.png)
5. Once the Importer finishes processing your files, download the .zip file.
   ![](/static/import-ready.png)
6. After you have downloaded the `.zip` file, [go to the Notesnook Web App](https://app.notesnook.com/) > Settings > Notesnook Importer. Select the .zip you downloaded earlier and click "Start import" button.
   ![](/static/import-zip-app.png)
7. Once importing completes you should see all your notes in Notesnook. If you face any issues during importing, feel free to [report them on GitHub](https://github.com/streetwriters/notesnook-importer).

## Supported formats

- [x] Rich text (lists, links, bold, italic etc.)
- [x] Images & attachments
- [x] Tags
- [x] Folders (currently only 2 levels of nesting is supported)
- [ ] Internal links to other notes
