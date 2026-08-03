---
title: Note version history
pageTitle: Restore an earlier version of a note
description: Notesnook keeps earlier versions of every note so you can preview and restore them. How it works, how many versions each plan keeps, and how to clear them.
keywords:
  - restore previous version of note
  - note history notes app
  - undo changes to a note
schema: faq
faqs:
  - q: Is note version history synced across my devices?
    a: No. Version history is kept on the device it was created on. Logging out clears the stored versions for all your notes on that device.
  - q: Does note version history count against my storage?
    a: No. Storage limits apply to attachments only. Note versions are stored on your device, not on the server.
  - q: What happens to a note's history when I delete the note?
    a: It goes with the note. Moving a note to trash and then deleting it permanently removes its versions too.
---

# Note version history

Notesnook keeps a log of your editing sessions. Each one is stored as a "version" of the note, so if you delete a paragraph you needed or paste over something important, you can look at an earlier copy and bring it back.

## How it works

Every time you create a new note or open an existing note, Notesnook creates a "session" for it. All the changes made to the note are also stored in that session in addition to the note itself.

In short, if you open a note and edit it at 10 different times during the day, you'll have 10 previous versions of that note.

## View and restore an earlier version

:::tabs key:platform
== Desktop/Web

1. Open the note.
2. Open the `{{properties}}` panel from the editor's action bar.
3. Scroll to `{{noteHistory}}` and click a session to preview it.
4. Click `{{restoreThisVersion}}` to bring it back, or `{{saveACopy}}` to keep both.

== Mobile

1. Open the note.
2. Tap the three dot button to open `Note properties`.
3. Tap `{{history}}` and choose a session to preview it.
4. Tap `{{restore}}` to bring it back. (`{{saveACopy}}` is desktop and web only.)

:::

Restoring replaces the note's current content with the version you picked. To compare instead, `{{saveACopy}}` creates a new note from the old version and leaves the original untouched.

## How many versions are kept

Version history is capped by plan, and versions past the cap are **deleted permanently** — they are not hidden or archived.

| Plan             | Versions kept per note |
| ---------------- | ---------------------- |
| Free             | 100                    |
| Essential        | 1,000                  |
| Pro and Believer | Unlimited              |

See [plans and limits](/plans-and-limits) for the full comparison.

## Clear the history of a note

:::tabs key:platform
== Desktop/Web
There is no button to clear a single note's history on desktop or web. History is cleared when the note is locked, trashed and deleted, or when you log out.

== Mobile

1. Open the note.
2. Tap the three dot button to open `Note properties`.
3. Tap `{{history}}`.
4. Tap `{{clearHistory}}` and confirm.

:::

Clearing is permanent — once cleared, earlier versions of that note are gone.

::: danger Locking a note erases its history
Moving a note into the [private vault](/lock-notes-with-private-vault) deletes every stored version of it. Old unencrypted copies of a note you have chosen to lock would defeat the point of locking it. Restore anything you still need **before** you lock the note.

:::

## FAQs

### Is note history synced to all my devices?

No, at the moment we have decided to keep note version history local only. If you logout from your account, previous versions of all your notes will be cleared.

### Does version history count against my storage?

No. Storage limits apply to [attachments](/attachments-and-files) only. Note versions are stored on your device.

### What happens to history when I delete a note?

It goes with the note. Moving a note to [trash](/trash) and then deleting it permanently removes its versions too.

## Related pages

- [Backup and restore](/backup-and-restore-notes-in-notesnook) — the safety net that does cover every device
- [Private vault](/lock-notes-with-private-vault) — locking notes, and what that does to their history
- [Trash](/trash) — recovering a note you deleted entirely
- [Plans & limits](/plans-and-limits) — how many versions your plan keeps
