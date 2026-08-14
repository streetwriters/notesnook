---
title: Exporting notes
pageTitle: Export notes from Notesnook as PDF, Markdown or HTML
description: Export one note or your whole Notesnook library as PDF, Markdown, HTML or plain text — on Windows, macOS, Linux, Android and iOS.
keywords:
  - export notes to markdown
  - export notes as pdf
  - notes app no lock in
schema: howto
---

# Exporting notes

You can export some or all your notes as **PDF**, **HTML**, **Markdown**, **Markdown + Frontmatter** and **Plain text** files on all Notesnook apps. Notesnook is zero lock-in — your notes leave in open formats that any other app can read.

::: info PDF is for one note at a time on desktop and web
On desktop and web, PDF is only offered when you export a **single note** — multi-select exports and "export all notes" produce a `.zip` in Markdown, Markdown + Frontmatter, HTML or plain text. To get a PDF of several notes there, export them one at a time, or print the note from the desktop app. On mobile, PDF is available for multi-select and "export all notes" as well.

:::

## Exporting a single note

:::tabs key:platform
== Desktop/Web

1. Right click a note
2. Click `{{exportAs}}`
3. Select the desired format
4. Wait a few moments while your note is exported
5. Save the note at your desired location

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note
2. Tap `{{export}}`
3. Select the desired format
4. Wait a few moments while your note is exported
5. Exported notes are stored in `Notesnook/exported` folder.

:::

## Exporting multiple notes

:::tabs key:platform
== Desktop/Web

1. Hold `Ctrl` & click on all the notes you want to export
2. Right click & click `{{exportAs}}`
3. Select your desired export format
4. Wait a few moments while your notes are exported
5. Save the `.zip` file at your desired location

== Mobile

1. Long press a note to enter multi selection mode
2. Tap all the notes you want to export
3. Tap the Export button on top right corner
4. Select the desired format
5. Exported notes are stored in `Notesnook/exported` folder

:::

## Exporting all your notes

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{importExport}}`
3. Click `{{backupExport}}`
4. Click `Select format` dropdown next to `{{exportAllNotes}}` heading
5. Select the desired format
6. Enter account password for authentication
7. Save the `.zip` file at your desired location

== Mobile

1. Go to `{{settings}}`.
2. Open `{{backupRestore}}`
3. Tap `{{exportAllNotes}}`
4. Select the desired format
5. Enter account password for authentication
6. Exported notes are stored in `Notesnook/exported` folder as a single .zip file

:::

::: info Exporting everything needs your password
"Export all notes" asks for your account password before it runs. Locked notes are included only after you unlock the [vault](/lock-notes-with-private-vault) when prompted.

:::

## Related pages

- [Backup and restore](/backup-and-restore-notes-in-notesnook) — encrypted backups you can restore into Notesnook, as opposed to exports for other apps
- [Importing notes](/importing-notes/) — moving notes in from another app
- [Publishing with monographs](/publish-notes-with-monographs) — sharing a single note as a link instead of a file
- [Attachments & files](/attachments-and-files) — what happens to files attached to exported notes
