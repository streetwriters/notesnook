---
title: Simplenote
---

# How to import notes from Simplenote notes app?

The following steps will help you import your notes from Simplenote easily.

1. Open Simplenote app on Desktop or Login to [https://app.simplenote.com](https://app.simplenote.com).
2. Go to sidebar and click on Settings.
   ![](/static/simplenote-importer/1.png)
3. Go to `Tools` tab in Settings
   ![](/static/simplenote-importer/2.png)
4. Click on `Export notes` to download your notes as a .zip file.
5. Go to [https://importer.notesnook.com/](https://importer.notesnook.com/) and select `Simplenote` from list of apps.
   ![](/static/simplenote-importer/3.png)
6. Drop the .zip backup file you exported earlier from Simplenote in the box or click anywhere to open system file picker to select the backup and click "Start processing".
   ![](/static/simplenote-importer/4.png)
7. Once importer completes processing, download the .zip file.
   ![](/static/simplenote-importer/5.png)
8. After you have downloaded the `.zip` file, go to Notesnook app > Settings > Notesnook Importer and click on "Import from ZIP file" & select the .zip you downloaded earlier.
   ![](/static/import-zip-app.png)
9. Once importing completes you should see all your notes in Notesnook. If you face any issues during importing, [report it on github](https://github.com/streetwriters/notesnook).

## Supported formats

Simplenote's export is, well, pretty simple and the Notesnook Importer supports 100% of it. It also preserves all the formatting and indenting in the imported notes.

## Troubleshooting

### Some of my notes have weird whitespacing and broken formatting after import. What do I do?

This can happen in notes for which you have enabled Markdown in Simplenote. Notesnook Importer follows this flag during processing and respects Markdown rules during the conversion to HTML. If you want to preserve the formatting of your notes, it is best that you disable the Markdown formatting for all your notes in Simplenote. This will force the Notesnook Importer to import all your notes as plaintext.
