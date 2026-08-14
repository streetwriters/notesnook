---
title: Importing notes
pageTitle: Import notes into Notesnook from any app
description: Move your notes into Notesnook from Evernote, Google Keep, Obsidian, Simplenote, Joplin, UpNote and more — or from Markdown, HTML and text files.
keywords:
  - import notes to notesnook
  - migrate notes app
  - notesnook importer
schema: faq
faqs:
  - q: Is it safe to import my notes into Notesnook?
    a: Yes. The Notesnook Importer runs entirely on your device. Not a single byte of your export file is sent to Notesnook's servers — the notes are encrypted on your device before anything is synced.
  - q: Which apps can I import from?
    a: Evernote, Simplenote, Google Keep, Joplin, Obsidian, ColorNote, UpNote, Zoho Notebook, Fusebase (Nimbus Note) and Skiff Pages, plus plain text, HTML, Markdown and TextBundle files.
  - q: Can I import notes on my phone?
    a: No. The Notesnook Importer runs in the web and desktop apps only. Import there, and your notes sync to your phone automatically.
  - q: Will my notebooks and tags survive the import?
    a: In most cases yes. Notebooks, tags, attachments and formatting are carried over where the source app's export format includes them; the page for each app lists exactly what is supported.
---

# Import notes from any notes app

Notesnook supports importing from most of the popular note apps and common export formats such as markdown, html and text files. Imports run **on your device** — your old notes are never uploaded to us in the clear.

## Try it out

You can try out the importer by opening the web or desktop app and going to `Settings > Import & export > Notesnook Importer`.

::: info Import from a computer
The Notesnook Importer is available in the **web and desktop apps only**. Import on a computer and your notes will sync down to your phone and tablet automatically.

:::

## Supported note apps and formats

| App or format                           | Guide                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| Evernote (`.enex`)                      | [Import from Evernote](/importing-notes/import-notes-from-evernote)            |
| Google Keep                             | [Import from Google Keep](/importing-notes/import-notes-from-googlekeep)       |
| Simplenote                              | [Import from Simplenote](/importing-notes/import-notes-from-simplenote)        |
| Joplin                                  | [Import from Joplin](/importing-notes/import-notes-from-joplin)                |
| Obsidian                                | [Import from Obsidian](/importing-notes/import-notes-from-obsidian)            |
| ColorNote                               | [Import from ColorNote](/importing-notes/import-notes-from-colornote)          |
| UpNote                                  | [Import from UpNote](/importing-notes/import-notes-from-upnote)                |
| Zoho Notebook                           | [Import from Zoho Notebook](/importing-notes/import-notes-from-zoho-notebook)  |
| Skiff Pages                             | [Import from Skiff Pages](/importing-notes/import-notes-from-skiff-pages)      |
| Fusebase (Nimbus Note)                  | [Import from Fusebase](/importing-notes/import-notes-from-fusebase)            |
| TextBundle (`.textbundle`, `.textpack`) | [Import TextBundle files](/importing-notes/import-notes-from-textbundle-files) |
| Markdown (`.md`) files                  | [Import Markdown files](/importing-notes/import-notes-from-markdown-files)     |
| HTML files                              | [Import HTML files](/importing-notes/import-notes-from-html-files)             |
| Plain text (`.txt`) files               | [Import plaintext files](/importing-notes/import-notes-from-plaintext-files)   |

**Don't see your notes app?** No worries, create an issue on [Github](https://github.com/streetwriters/notesnook/issues)

## Is it safe to import?

Not a single byte of your data from other apps is sent to our servers. Everything is processed 100% on the client side inside this browser.

Once the import finishes, your notes are [end-to-end encrypted](/how-is-my-data-encrypted) like everything else in Notesnook, and they sync to every device you sign in on.

## What happens after the import

- Imported notebooks and tags appear alongside your existing ones — see [organizing with notebooks](/organizing-notes/organize-notes-using-notebooks).
- Attachments count towards your [storage limit](/plans-and-limits), so a large Evernote library may need a paid plan.
- Take a [backup](/backup-and-restore-notes-in-notesnook) once you're happy with the result.

<GetNotesnook title="Bring your notes somewhere private" text="Notesnook is free, open source, and encrypts every note on your device before it syncs. Import once and your notes are readable only by you — on every device you own." />

## Related pages

- [Exporting notes](/export-notes-from-notesnook) — leaving with your notes takes the same few steps as arriving
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — your safety net after a big import
- [Attachments & files](/attachments-and-files) — what imported images and files count against
- [How is my data encrypted?](/how-is-my-data-encrypted) — what protects your notes once they're in
