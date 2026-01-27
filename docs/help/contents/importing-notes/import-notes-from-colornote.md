---
title: ColorNote
---

# How to import notes from ColorNote notes app?

The following steps will help you import your notes from ColorNote easily.

1. Download the ColorNote mobile app.
2. Go to `Settings > Backup` and create a backup. 
3. The ColorNote backup file is encrypted, so you'll need to use a decryptor tool which converts it into `.json` file of your notes. You can use [olejorgenb's ColorNote-backup-decryptor](https://github.com/olejorgenb/ColorNote-backup-decryptor). There's also a [script by CrazySqueak](https://github.com/CrazySqueak/ColorNote-backup-decryptor.sh) that uses the same tool.
4. Open the Notesnook app (web or desktop).
5. Go to `Settings > Notesnook Importer` and select `ColorNote` from list of apps.
6. Drop the `.json` file you exported earlier in the box or click anywhere to open system file picker to select the backup and click "Start processing".
7. Once importing completes you should see all your notes in Notesnook. If you face any issues during importing, [report it on github](https://github.com/streetwriters/notesnook).