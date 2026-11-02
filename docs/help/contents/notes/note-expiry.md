---
title: Expiring notes
pageTitle: How to make a note delete itself on a date — Notesnook
description: Set an expiry date on a Notesnook note and it moves itself to trash on that day. How to set, change and remove an expiry date, and exactly when it runs.
keywords:
  - notesnook expiring notes
  - self destructing note
  - note expiry date
  - auto delete note
schema: howto
---

# Expiring notes <PlanTag plan="pro" />

An expiring note deletes itself. You pick a date, and on that date Notesnook moves the note to trash for you — useful for a temporary password, a one-off address, or anything you don't want sitting in your notes forever.

Expiring notes are part of the [Pro plan and above](/plans-and-limits).

::: warning This deletes your notes
An expiry date is a scheduled deletion. On the day it falls due the note leaves your notes list on every device without asking you again. It lands in [trash](/trash) first, so you have a window to restore it — but once trash is emptied, either by you or by automatic trash cleanup, the note is gone. Notesnook cannot recover deleted notes for you.

:::

## Set a note to expire

:::tabs key:platform
== Desktop/Web

1. Right click a note to open the `Note properties` menu.
2. Click `{{setExpiry}}`.
3. In the `{{setExpiry}}` dialog, type a date into the `{{date}}` field — the format shown under the field is your own date format from settings — or click the calendar icon and pick a day.
4. Click `{{done}}`.

The earliest date you can choose is tomorrow, and the latest is one year from today. Notesnook refuses anything else with `{{expiryDateMustBeInTheFuture}}` or `{{expiryDateCannotBeMoreThan1YearInTheFuture}}`.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note.
2. Tap `{{setExpiry}}`.
3. Scroll the date picker to the day you want. It opens one week ahead by default, and the earliest date you can choose is tomorrow.
4. Tap `{{setExpiry}}`.

:::

An `{{expiryDateSet}}` toast confirms it, and the note now carries an expiry badge in the notes list.

## Spot a note that is going to expire

:::tabs key:platform
== Desktop/Web
In the detailed notes list the note shows a bomb icon followed by the expiry date. In compact view only the bomb icon is shown.

== Mobile

The note shows a bomb icon with the expiry date next to it, in the same row as its tags and notebooks.

:::

<!-- TODO: screenshot — a note in the list showing the expiry badge -->

## Change or remove an expiry date

:::tabs key:platform
== Desktop/Web

1. Right click the note. The menu entry now reads `{{expiryDate}}` instead of `{{setExpiry}}`.
2. Open `{{expiryDate}}` and choose:
   - `{{change}}` — reopens the date dialog with the current date filled in.
   - `{{remove}}` — clears the expiry date and leaves the note alone.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on the note. The entry now reads `{{unsetExpiry}}`.
2. Tap `{{unsetExpiry}}` to clear the date.

To move the date instead, clear it with `{{unsetExpiry}}` and then set a new one with `{{setExpiry}}`.

:::

Removing an expiry date takes effect immediately — the badge disappears and the note will not be deleted.

## What happens on the day a note expires

The note is **moved to trash**, not erased. It is recorded as having been deleted because it expired, and it sits in trash under your normal trash retention rules until it is cleaned up or you delete it permanently. Restoring it from trash brings it back with its content intact, and without an expiry date.

Notesnook checks for expired notes on your device — there is no server-side job, because the server can't read your notes.

:::tabs key:platform
== Desktop/Web
The check runs when the app starts and then once a day at midnight, for as long as the app is running.

== Mobile

The check runs when the app starts, and again whenever the app notices that the calendar day has changed while it is open.

:::

Because the check is local, a note whose date has passed while the app was closed is cleared out the next time you open Notesnook on that device, and the deletion then syncs to your other devices.

::: info Expired notes and sync
Deletion syncs like any other change. If a note is set to expire and you are offline, nothing happens until a device with the note on it runs the check and then syncs.

:::

## Related pages

- [Plans and limits](/plans-and-limits) — which plan unlocks expiring notes
- [Note actions](/notes/note-actions) — the rest of the per-note menu, including read-only and per-note sync
- [Trash](/trash) — restoring an expired note, and how long trash keeps things
- [Archive notes](/organizing-notes/archive-notes) — get a note out of the way without deleting it
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — keeping a copy before a note deletes itself
- [Reminders](/reminders) — be told about a note on a date instead of deleting it
