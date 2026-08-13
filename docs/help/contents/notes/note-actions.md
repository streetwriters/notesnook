---
title: Note actions
pageTitle: Every per-note action in Notesnook and where to find it
description: Pin, duplicate, print, copy, make read-only, or stop a single note from syncing — every per-note action in Notesnook, on desktop and mobile.
keywords:
  - notesnook read only note
  - duplicate a note
  - copy note as markdown
  - notesnook note menu
schema: howto
---

# What can I do with a single note?

Every note has a menu of actions on it. Right click a note on desktop or web, or press the ![Three dot button](/three-dot-button.png) button on mobile. This page covers the actions that aren't documented elsewhere — making a note read-only, duplicating it, copying it, printing it, fixing its creation date, keeping it off sync, and seeing what links to it.

## Open the note menu

:::tabs key:platform
== Desktop/Web

1. Right click a note in the list to open the `Note properties` menu.

Some of the same switches also live in the editor: open a note, then click `{{properties}}` in the action bar at the top right.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note.

The sheet that opens holds every action for that note.

:::

## Open a note in a new tab

Opening a note in a new tab puts it in its own editor tab instead of replacing whatever is already open, so you can keep two notes on the go at once.

:::tabs key:platform
== Desktop/Web

1. Right click the note.
2. Click `{{openInNewTab}}`. It is the first item in the note menu.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note.
2. Tap the open-in-new icon at the top right of the properties sheet, beside the note's title.

The button only appears for notes, and it has no text label. On a phone, tapping it also takes you straight to the editor; on a tablet the note opens in a new tab beside the list you are already looking at.

:::

## Unlink a note from all its notebooks

`{{unlinkFromAll}}` removes the note from every [notebook](/organizing-notes/organize-notes-using-notebooks) it belongs to in one step, without deleting the note or the notebooks. It works on a multiple selection too.

:::tabs key:platform
== Desktop/Web

1. Right click the note, or select several notes and right click.
2. Open `{{notebooks}}`.
3. Click `{{unlinkFromAll}}`.

The action only appears when at least one of the selected notes is already in a notebook.

== Mobile

There is no single action that unlinks a note from *every* notebook at once. Two ways round it:

- **One note** — tap the ![Three dot button](/three-dot-button.png) button, tap `{{addToNotebook}}`, and unselect the notebooks one by one.
- **Several notes, one notebook** — open the notebook, long press a note to start selecting, tap the rest, then tap `{{unlinkNotebook}}` in the header. That removes every selected note from the notebook you are viewing. The action only appears while you are inside a notebook.

:::

## Remove all tags from a note

`{{removeFromAll}}` strips every [tag](/organizing-notes/organize-notes-using-tags) off the note. The tags themselves are not deleted — they stay in your tags list and on your other notes. It works on a multiple selection too.

:::tabs key:platform
== Desktop/Web

1. Right click the note, or select several notes and right click.
2. Open `Tags`.
3. Click `{{removeFromAll}}`.

The action only appears when at least one of the selected notes already has a tag.

== Mobile

There is no single action that strips *every* tag at once, but tags can be removed from several notes together:

1. Long press a note to start selecting, then tap the other notes you want.
2. Tap `{{manageTags}}` in the header.
3. Tap a tag that is currently applied to remove it from every selected note. Tap it again to put it back.

For a single note, tap the ![Three dot button](/three-dot-button.png) button and `{{addTags}}` instead.

:::

## Make a note read-only

`{{readOnly}}` locks the note against editing. The content stays visible and searchable — you cannot type into it. It is a toggle: turn it off and the note becomes editable again.

:::tabs key:platform
== Desktop/Web

1. Right click the note.
2. Click `{{readOnly}}`.

The editor's `{{properties}}` panel has the same `{{readOnly}}` switch, and it applies to any note tab that is already open.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on the note.
2. Tap `{{readOnly}}`.

:::

A read-only note shows a small pencil-lock icon in the notes list.

## Duplicate a note

`{{duplicate}}` makes a full copy of the note — title, content and formatting — as a new, separate note. Editing the copy does not touch the original.

:::tabs key:platform
== Desktop/Web

1. Right click the note.
2. Click `{{duplicate}}`.

`{{duplicate}}` also works on a multiple selection: select several notes first and every one of them is copied.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on the note.
2. Tap `{{duplicate}}`.

A `{{noteDuplicated}}` toast confirms it.

:::

## Copy a note's link

`{{copyLink}}` copies the note's internal `nn://` link to the clipboard, so you can paste it into another note and have a working [note link](/note-links-and-backlinks). On desktop and web the link is copied as plain text, HTML and Markdown at the same time, so pasting into an editor produces a proper link rather than raw text.

:::tabs key:platform
== Desktop/Web

1. Right click the note.
2. Click `{{copyLink}}`.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on the note.
2. Tap `{{copyLink}}`.

:::

Either way a `{{linkCopied}}` toast confirms it.

## Copy a note as text or Markdown

This copies the note's _content_ to the clipboard, not a link to it — for pasting into an email, a chat, or another app.

:::tabs key:platform
== Desktop/Web

1. Right click the note.
2. Open `{{copyAs}}`.
3. Choose `Text` for plain text, or `Markdown` to keep headings, lists, bold and links as Markdown syntax.

A `{{noteCopied}}` toast confirms it.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on the note.
2. Tap `{{copy}}`.

Mobile copies the note as plain text. There is no Markdown option in the copy action — use `{{export}}` and pick `Markdown` if you need Markdown, or use `{{share}}` to hand the text to another app.

:::

If the note is in your [private vault](/lock-notes-with-private-vault) you'll be asked for your vault password first.

## Print a note

:::tabs key:platform
== Desktop/Web

1. Right click the note.
2. Click `{{print}}`.

The note is rendered as a PDF and handed to your system print dialog, so you can send it to a printer or save it as a PDF file.

== Mobile

There is no print action on mobile. Press the ![Three dot button](/three-dot-button.png) button, press `{{export}}`, choose `PDF`, and print or share the resulting file from there.

:::

## Change a note's creation date

Useful after an import, when notes arrive stamped with the day you imported them rather than the day you wrote them.

:::tabs key:platform
== Desktop/Web

1. Open the note.
2. Click `{{properties}}` in the action bar at the top right.
3. Next to `{{createdAt}}`, click the pencil icon.
4. In the `{{editCreationDate}}` dialog set the `{{date}}` and `{{time}}` fields — the expected formats are shown under each field, and the calendar icon opens a day picker.
5. Click `{{save}}`.

The creation date cannot be later than the note's last edited date. If you pick a later one, Notesnook refuses with `{{creationDateCannotBeAfterLastEditedDate}}`.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note.
2. Scroll to the dates at the bottom of the properties sheet.
3. Tap the date beside `Created at` — it has a pencil icon after it.
4. Pick a date and time in the picker, then confirm.

The picker sets the date and the time together, and uses whichever 12- or 24-hour format you have set in [your date and time settings](/customizing-notesnook). There is no separate save step — confirming the picker saves the change.

The picker won't let you choose anything later than the note's last edited date; those days are unselectable rather than rejected with an error.

:::

The pencil only appears on notes. Notebooks, tags and reminders show their dates read-only.

## Keep a note off sync

`{{syncOff}}` marks a single note as local-only, independently of your global [sync settings](/sync/sync-settings). It stays on the device you're using and stops syncing; future changes to it never leave that device.

::: warning This removes the note from your other devices
Turning `{{syncOff}}` on for a note deletes it from every other device you're signed in on, and any changes you make to it afterwards will not sync. This is exactly what the confirmation asks you: `Prevent note from syncing`. Make sure the device you're keeping it on is the one you want it on, and that you have a [backup](/backup-and-restore-notes-in-notesnook).

:::

:::tabs key:platform
== Desktop/Web

1. Right click the note.
2. Click `{{syncOff}}`.
3. Confirm `Prevent note from syncing` with `{{yes}}`.

Turning it off syncs the note again from that device. The editor `{{properties}}` panel carries the same switch, labelled `{{disableSync}}`. The action only appears when you're logged in.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on the note.
2. Tap `{{syncOff}}`.

The action only does anything when you're logged in.

:::

A local-only note shows a crossed-out sync icon in the notes list.

## See what links to a note

`{{references}}` lists the notes on both sides of a note link: the ones this note links out to, and the ones that link back to it.

:::tabs key:platform
== Desktop/Web

1. Open the note.
2. Click `{{properties}}` in the action bar at the top right.
3. Switch between `{{linkedNotes}}` and `{{referencedIn}}` at the top of the panel.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on the note.
2. Tap `{{references}}`.
3. Switch between the `{{linkedNotes}}` and `{{referencedIn}}` tabs.

:::

See [note links](/note-links-and-backlinks) for what these lists contain and how to jump to an individual paragraph.

## Related pages

- [Note links](/note-links-and-backlinks) — linking notes together and reading backlinks
- [Expiring notes](/notes/note-expiry) — have a note delete itself on a date you choose
- [Export notes](/export-notes-from-notesnook) — saving notes as PDF, Markdown, HTML or text files
- [Note version history](/note-version-history) — recovering an earlier version of a note
- [Sync settings](/sync/sync-settings) — the app-wide controls behind per-note `{{syncOff}}`
- [Archive notes](/organizing-notes/archive-notes) — moving a note out of the way without deleting it
