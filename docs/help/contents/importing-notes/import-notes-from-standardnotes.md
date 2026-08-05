---
title: Standard Notes
description: Moving from Standard Notes to Notesnook — export a decrypted backup and import it with the Markdown or plaintext importer.
pageTitle: How to import Standard Notes into Notesnook
keywords:
  - import standard notes
  - standard notes to notesnook
  - standard notes alternative
schema: howto
---

# How do I import notes from Standard Notes?

Export a **decrypted backup** from Standard Notes, unzip it, and bring the files in with Notesnook's Markdown or plaintext importer.

::: warning There is no longer a Standard Notes importer
Recent versions of the Notesnook Importer don't list Standard Notes as a source app, so you import the files it exports rather than the backup itself. The steps below take that route.

:::

## Export a decrypted backup from Standard Notes

1. Open the Standard Notes desktop app, or go to [https://app.standardnotes.com](https://app.standardnotes.com) and sign in.
2. Select all your notes, right click, and choose `{{export}}`.
3. Choose the **decrypted** backup option. An encrypted backup can only be read by Standard Notes, so nothing can import it.
4. Save the `.zip` file somewhere you can find it.

## Import the files into Notesnook

1. Unzip the backup. Inside it, your notes are plain text and Markdown files.
2. Open Notesnook on web or desktop.
3. Go to `Settings > Import & export > Notesnook Importer`.
4. Choose **Markdown** for `.md` files, or **Text** for `.txt` files. Run the importer once for each type you have.
5. Drop the files in, or click the box to pick them, and start the import.

Full steps for each importer are on [import Markdown files](/importing-notes/import-notes-from-markdown-files) and [import plaintext files](/importing-notes/import-notes-from-plaintext-files).

## What carries across

|                               | Imported |
| ----------------------------- | -------- |
| Note titles and content       | Yes      |
| Plain text and Markdown notes | Yes      |
| Tags                          | No       |
| Notebooks or folders          | No       |

Your notes arrive as a flat list, so plan to re-file them into [notebooks](/organizing-notes/organize-notes-using-notebooks) and re-apply [tags](/organizing-notes/organize-notes-using-tags) afterwards.

If you'd like a proper Standard Notes importer back, [open an issue](https://github.com/streetwriters/notesnook/issues/new/choose) — that is where importer requests are tracked.

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your Standard Notes export is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import Markdown files](/importing-notes/import-notes-from-markdown-files) — the importer this page routes you to
- [Import plaintext files](/importing-notes/import-notes-from-plaintext-files) — for `.txt` exports
- [Import from Joplin](/importing-notes/import-notes-from-joplin) — moving notes out of Joplin
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to your notes after the import
