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

A monograph turns any note into a link you can send to anyone. Your reader needs no account, no app and no Notesnook — they open the URL and read the note, and you can protect it with a password or have it self-destruct after one read. Once a note is published as a monograph, you get a public URL which you can share with anyone. They don't need to download Notesnook or install any extra software — it works like a blog, only simpler.

::: warning Size limit
Currently, monographs are limited to 15 MB in size. This also includes attachments, like images. If you try to publish a note larger than 15 MB, you'll get an error.

:::

## How to publish a note?

::: warning A monograph is a public URL
Anyone with the link can open a monograph unless you set a password. Notesnook cannot tell who has opened it, and an unprotected monograph can be indexed if the link is posted publicly. Use password protection for anything sensitive, and unpublish when you are done.

:::

:::tabs key:platform
== Desktop/Web

1. Right click a note
2. Click `{{publish}}` from Note properties to open publish note dialog.
3. Click `{{publish}}` button to publish note.
4. Copy the URL and send it to the person you are sharing with.

== Mobile

1. Tap ![Three dot button](/three-dot-button.png) button on a note.
2. Tap `{{publish}}` to open Publish note sheet
3. Tap `{{publish}}` button to publish note.
4. Copy the URL and send it to the person you are sharing with.

:::

## Password protection

When you are sharing sensitive information with someone, you can encrypt the monograph with a password. Only someone who has the password can decrypt and read the contents of the note. While you are on the Publish note dialog, enter a password for the monograph. Then click publish to publish the note.

## Self destruct

Self destruct means that the published note can be viewed only once. Once someone visits the public URL to see the contents of the note, the monograph is deleted and it cannot be viewed again.

## Unpublish a monograph

:::tabs key:platform
== Desktop/Web

1. Right click a note
2. Click `{{publish}}` to open publish note popup
3. Click `{{unpublish}}` button to unpublish note

== Mobile

1. Tap ![Three dot button](/three-dot-button.png) button on a published note
2. Tap `{{publish}}` to open Publish note sheet
3. Tap `{{unpublish}}` button to unpublish note

:::

## Once a note is published

:::warning
**Published notes cannot be deleted while published.**

:::

Opening `{{publish}}` on a note that is already published gives you the full set of actions rather than a single toggle:

- **Open** — view the monograph as your reader sees it
- **Copy link** — copy the public URL, as plain text, HTML or Markdown on desktop and web
- **Update** — push the note's latest edits to the published copy
- **Unpublish** — take it offline

Edits you make after publishing are **not** live until you choose `{{update}}`.

## View counts <PlanTag plan="pro" />

The publish view shows how many times a monograph has been opened. View counts are part of the [Pro plan and above](/plans-and-limits); on desktop and web the counter is replaced by an upgrade link on other plans, and on mobile it is hidden. View counts are not shown for self-destructing monographs.

## Links and embeds in a published note <PlanTag plan="essential" />

Links and embedded content inside a note are preserved in the published monograph on the [Essential plan and above](/plans-and-limits).

## Related pages

- [Exporting notes](/export-notes-from-notesnook) — sharing a note as a file instead of a link
- [Private vault](/lock-notes-with-private-vault) — locking notes you don't want to share
- [How is my data encrypted?](/how-is-my-data-encrypted) — how password-protected monographs are encrypted
- [Plans & limits](/plans-and-limits) — what Essential and Pro add to monographs
