---
title: Trash
pageTitle: How do I restore a deleted note in Notesnook?
description: Deleted notes and notebooks go to Trash. Restore them, delete them permanently, empty the trash, or change how long items are kept.
keywords:
  - notesnook restore deleted note
  - notesnook trash
  - notesnook empty trash
  - how long does notesnook keep deleted notes
schema: faq
faqs:
  - q: How do I restore a deleted note in Notesnook?
    a: Open Trash from the side menu, open the context menu on the note and choose Restore. It goes back where it was, with its content and notebook links intact.
  - q: How long does Notesnook keep deleted notes?
    a: Seven days by default. You can change the clear trash interval to Daily, 7 days, 30 days or 365 days, and Pro and Believer plans can set it to Never so nothing is ever cleared automatically.
  - q: What goes to the trash in Notesnook?
    a: Only notes and notebooks. Tags, colors, reminders and attachments are removed immediately when you delete them and do not pass through the trash.
  - q: Does clearing the trash free up my storage?
    a: No. Your storage limit counts attachments only, and attachments never go to the trash — so notes and notebooks sitting in the trash cost you nothing against it.
---

# How do I restore a deleted note in Notesnook?

Deleting a note or a notebook moves it to `{{trash}}` instead of erasing it. Open `{{trash}}` from the side menu, open the item's menu and press `{{restore}}` to put it back. Items left in the trash are cleared automatically after **7 days** by default.

## What goes to the trash

Only two things: **notes** and **notebooks**. Deleting a notebook also moves its sub-notebooks with it.

Tags, colors, reminders and attachments do not pass through the trash — deleting those removes them straight away. Notes that delete themselves on a date you set with [note expiry](/notes/note-expiry) land in the trash the same way manually deleted notes do.

## Restore a note or notebook

:::tabs key:platform
== Desktop/Web

1. Open `{{trash}}` from the side menu.
2. Right click the item to open its menu.
3. Press `{{restore}}`.

Restoring a notebook also restores every sub-notebook that went to the trash with it.

== Mobile

1. Open `{{trash}}` from the side menu.
2. Tap the ![Three dot button](/three-dot-button.png) button on the item.
3. Tap `{{restore}}`.

Tapping a trashed **notebook** opens a `{{restore}}` prompt directly, with `{{restore}}` and `{{delete}}` as the two choices.

:::

Restored notes keep their content, their tags and their place in notebooks — nothing is re-created from scratch.

### Restoring a notebook re-checks your notebook limit

Free plans allow 50 notebooks and Essential allows 500; Pro and Believer are unlimited. On the desktop and web apps, restoring notebooks counts what you are about to restore against that limit, so a restore that would push you over is blocked until you free up notebooks or upgrade. See [Plans & limits](/plans-and-limits).

## Delete a single item permanently

:::tabs key:platform
== Desktop/Web

1. Open `{{trash}}` from the side menu.
2. Right click the item and press `{{delete}}`, or select it and press the `{{delete}}` key.
3. Confirm the prompt.

== Mobile

1. Open `{{trash}}` from the side menu.
2. Tap the ![Three dot button](/three-dot-button.png) button on the item.
3. Tap `{{delete}}` and confirm.

:::

Permanently deleting a note also removes its content and its whole [version history](/note-version-history).

## Clear the trash

:::tabs key:platform
== Desktop/Web

1. Open `{{trash}}` from the side menu.
2. Press the clear trash button on the list.
3. Read the prompt and press `{{clear}}`.

You should see `{{trashCleared}}`.

== Mobile

1. Open `{{trash}}` from the side menu.
2. Tap the floating button at the bottom right.
3. Read the prompt and press `{{clear}}`.

You should see `{{trashCleared}}`.

:::

::: danger This cannot be undone
`Clearing trash will permanently delete all the items in your trash. This action is IRREVERSIBLE.` Notesnook has no server-side copy to restore from — the only other copy is one you made yourself with a [backup](/backup-and-restore-notes-in-notesnook).

:::

## Change how long the trash keeps things

The `{{clearTrashInterval}}` setting automatically clears trash after a certain period of time. The options are `{{daily}}`, `7 days`, `30 days`, `365 days` and `{{never}}`. **The default is `7 days`.**

Cleanup measures from the start of the day an item was deleted, and runs against everything already in the trash, not only items deleted from now on.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{behaviour}}`.
2. Under `{{trash}}`, open the `{{clearTrashInterval}}` dropdown.
3. Pick an interval.

== Mobile

1. Go to `{{settings}}` → `{{customization}}` → `{{behavior}}`.
2. Open `{{clearTrashInterval}}`.
3. Pick an interval.

:::

### Keep trash forever <PlanTag plan="pro" />

`{{never}}` turns automatic cleanup off entirely, so deleted notes stay in the trash until you remove them yourself. It is available on **Pro** and **Believer** — on free and Essential plans, choosing it shows an upgrade prompt. See [Plans & limits](/plans-and-limits).

<!-- TODO: screenshot — the Clear trash interval dropdown in Settings → Behaviour -->

## Does clearing the trash free up my storage?

No. Storage limits count [attachments](/attachments-and-files) only, and attachments never go to the trash. Notes cost you nothing against your storage whether they are live or trashed, so emptying the trash does not change your storage figure.

## Related pages

- [Attachments and files](/attachments-and-files) — what actually counts against your storage
- [Note version history](/note-version-history) — recovering an earlier draft instead of a deleted note
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — the only copy that survives a cleared trash
- [Notebooks](/organizing-notes/organize-notes-using-notebooks) — how deleting a notebook affects its notes
- [Plans & limits](/plans-and-limits) — notebook limits and the plans that unlock `{{never}}`
