---
title: Monographs
pageTitle: Share a note as an encrypted link with Monographs
description: Publish any Notesnook note as a public link, optionally password-protected or set to self-destruct after one read. Your reader needs no account and no app.
keywords:
  - share encrypted note link
  - password protected note sharing
  - publish note to web
schema: howto
---

# Publish notes with monographs

Sharing a note with someone can be such a tedious task. You have to copy/download/export it to a file and then attach it in an email or upload it to some cloud storage.

With Notesnook, you don't need to do that anymore. Monographs enable you to share your notes with anyone in a single click. Once a note is published as a monograph, you get a public URL which you can share with anyone. They don't need to download Notesnook or install any extra software — it's just like a blog, only simpler.

::: warning Size limit
Currently, monographs are limited to 15 MB in size. This includes attachments as well. If you try to publish a note larger than 15 MB, you'll get an error.
:::

## How to publish a note?

:::tabs key:platform
== Desktop/Web
1. Right click on a note
2. Click on `{{publish}}` from Note properties to open publish note dialog.
3. Click on `{{publish}}` button to publish note.
4. Copy the URL and send it to respective person.
== Mobile
1. Tap on ![Three dot button](/three-dot-button.png) button on a note.
2. Tap on `{{publish}}` to open Publish note sheet
3. Tap on `{{publish}}` button to publish note.
4. Copy the URL and send it to respective person.
:::

## Password protection

When you are sharing sensitive information with someone, you can encrypt the monograph with a password. Only someone who has the password can decrypt and read the contents of the note. While you are on the Publish note dialog, turn on password protection and enter a password for the monograph. Then click publish to publish the note.

## Self destruct

Self destruct means that the published note can be viewed only once. Once someone visits the public URL to see the contents of the note, the monograph is deleted and it cannot be viewed again.

## Unpublish a monograph

:::tabs key:platform
== Desktop/Web
1. Right click on a note
2. Click on `{{publish}}` to open publish note popup
3. Click on `{{unpublish}}` button to unpublish note
== Mobile
1. Tap on ![Three dot button](/three-dot-button.png) button on a published note
2. Tap on `{{publish}}` to open Publish note sheet
3. Tap on `{{unpublish}}` button to unpublish note
:::

## Once a note is published

Opening `{{publish}}` on a note that is already published gives you the full set of actions rather than a single toggle:

- **Open** — view the monograph as your reader sees it
- **Copy link** — copy the public URL, as plain text, HTML or Markdown on desktop and web
- **Update** — push the note's latest edits to the published copy
- **Unpublish** — take it offline

Edits you make after publishing are **not** live until you choose `{{update}}`.

## View counts <PlanTag plan="pro" />

The publish view shows how many times a monograph has been opened. View counts are part of the [Pro plan and above](/plans-and-limits); on desktop and web the counter is replaced by an upgrade link on other plans, and on mobile it is simply hidden. View counts are not shown for self-destructing monographs.

## Links and embeds in a published note <PlanTag plan="essential" />

Links and embedded content inside a note are preserved in the published monograph on the [Essential plan and above](/plans-and-limits).

## What cannot be published

- **Locked notes.** A note in the [private vault](/lock-notes-with-private-vault) cannot be published — unlock it first if you want to share it.
- A **published note cannot be moved to trash**. Unpublish it first, then delete it.

::: warning A monograph is a public URL
Anyone with the link can open a monograph unless you set a password. Notesnook cannot tell who has opened it, and an unprotected monograph can be indexed if the link is posted publicly. Use password protection for anything sensitive, and unpublish when you are done.
:::

## Related pages

- [Exporting notes](/export-notes-from-notesnook) — sharing a note as a file instead of a link
- [Private vault](/lock-notes-with-private-vault) — locking notes you don't want to share
- [How is my data encrypted?](/how-is-my-data-encrypted) — how password-protected monographs are encrypted
- [Plans & limits](/plans-and-limits) — what Essential and Pro add to monographs
