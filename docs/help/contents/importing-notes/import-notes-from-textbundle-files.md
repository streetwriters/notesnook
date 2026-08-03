---
title: TextBundle files
pageTitle: How to import TextBundle and TextPack files into Notesnook
description: Import .textbundle and .textpack files into Notesnook — the portable note format used by Bear, Ulysses, iA Writer and other Markdown editors.
keywords:
  - import textbundle
  - textpack import notes
  - bear notes export import
schema: howto
---

# How do I import TextBundle files?

TextBundle is an open format for moving a note and its images between apps as a single package. Editors such as Bear, Ulysses and iA Writer export it, and the Notesnook Importer reads both `.textbundle` folders and their zipped form, `.textpack`.

## Exporting a TextBundle

Export from your current app as **TextBundle** or **TextPack**. Each package holds the note's text plus an `assets` folder with its images and files.

If your app offers both, `.textpack` is easier to move around because it's a single file.

## Importing into Notesnook

:::tabs key:platform
== Desktop/Web

1. Open the Notesnook web or desktop app.
2. Go to `Settings > Import & export > Notesnook Importer`.
3. Select `TextBundle` from the list of apps.
4. Drag and drop your `.textbundle` or `.textpack` files, or click to browse for them. You can add as many as you like.
5. Click `Start importing` and wait for the import to finish.

== Mobile

The Notesnook Importer runs in the **web and desktop apps only**. Import on a computer and the notes will sync down to your phone automatically.

:::

## Supported formats

The importer reads whichever text file the package contains, so a TextBundle written as Markdown, HTML or plain text all import correctly.

- [x] Markdown notes, including headings, lists, code blocks, tables and links
- [x] HTML notes
- [x] Plain text notes
- [x] Images and attachments stored in the package

::: info macOS export folders
Files inside a `__MACOSX` folder — the metadata macOS adds when zipping — are ignored automatically, so you can import an archive straight from Finder.

:::

## Related pages

- [Importing notes](/importing-notes/) — every app and file format Notesnook can import
- [Import Markdown files](/importing-notes/import-notes-from-markdown-files) — loose `.md` files instead of packages
- [Import HTML files](/importing-notes/import-notes-from-html-files) — for `.html` exports
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — writing Markdown once your notes are in
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — protecting your notes once they're in

<GetNotesnook title="Your notes, encrypted the moment they land" text="Notesnook imports run entirely on your device — not one byte of your TextBundle is sent to our servers. Once imported, everything is end-to-end encrypted and syncs to all your devices for free." />
