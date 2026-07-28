---
title: Standard Notes
description: Moving from Standard Notes to Notesnook — export a decrypted backup and import it as Markdown or plain text files.
pageTitle: How to import Standard Notes into Notesnook
keywords:
  - import standard notes
  - standard notes to notesnook
  - standard notes alternative
schema: howto
---

# How do I import notes from Standard Notes?

::: warning Standard Notes is no longer in the importer list
Recent versions of the Notesnook Importer no longer offer Standard Notes as a source app, so the steps below cannot be completed as written.

Import your notes this way instead:

1. In Standard Notes, export a **decrypted backup** as described below.
2. Unzip it — the notes are plain text and Markdown files.
3. Import those with the [Markdown files](/importing-notes/import-notes-from-markdown-files) or [plaintext files](/importing-notes/import-notes-from-plaintext-files) importer.

Notebooks and tags won't carry across that way. If you need them, [tell us](https://github.com/streetwriters/notesnook/issues/new/choose) — we track importer requests there.
:::

The following steps will help you import your notes from Standard notes easily.

1. Open Standard Notes app on Desktop or visit [https://app.standardnotes.org](https://app.standardnotes.org) and login to your account.
2. Select all your notes, right click, and select `{{export}}`.
3. Open the Notesnook (app or desktop).
4. Go to `Settings > Import & export > Notesnook Importer` and select `Standard Notes` from list of apps.
   ![ in Notesnook](/static/standard-notes-importer/3.png)
5. Drop the .zip file you exported earlier from Standard Notes in the box or click anywhere to open system file picker to select the backup.
   ![ in Notesnook](/static/standard-notes-importer/4.png)
6. Once importing completes you should see all your notes in Notesnook. If you face any issues during importing, [report it on github](https://github.com/streetwriters/notesnook).

## Supported formats

- [x] Text files
- [x] Authentication notes
- [x] Spreadsheets
- [ ] Tags

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your Standard Notes export is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import from Evernote](/importing-notes/import-notes-from-evernote) — moving notes out of Evernote
- [Import from Google Keep](/importing-notes/import-notes-from-googlekeep) — moving notes out of Google Keep
- [Import from Joplin](/importing-notes/import-notes-from-joplin) — moving notes out of Joplin
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to your notes after the import
