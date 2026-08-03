---
title: How sync works
pageTitle: How does sync work in Notesnook?
description: How Notesnook syncs your notes across devices — when it runs, what the status indicator means, and how conflicting edits are resolved.
keywords:
  - notesnook sync
  - how does notesnook sync work
  - notesnook encrypted sync
  - notesnook sync between devices
schema: faq
faqs:
  - q: Is sync free in Notesnook?
    a: Yes. Sync is included on the free plan and works on an unlimited number of devices. There is no device cap on any plan.
  - q: Can the Notesnook server read my notes while syncing?
    a: No. Every note, notebook, tag and attachment is encrypted on your device with a key derived from your password before it is sent. The server only ever stores encrypted blobs.
  - q: When does Notesnook sync?
    a: Automatically a moment after you change something, in realtime while you type in an open note, when the app starts or comes back to the foreground, when the internet reconnects, and whenever you trigger a sync yourself.
  - q: Why did I get a merge conflict instead of my edits merging?
    a: If the same note is edited on two devices more than 60 seconds apart, Notesnook marks it as conflicted and asks you to choose. Edits closer together than that are merged silently, keeping the most recent version.
---

# How does sync work in Notesnook?

Sync is free in Notesnook, on an unlimited number of devices, on every plan. Your notes are encrypted on your device _before_ they are sent, so the sync server stores nothing it can read — it only moves encrypted blobs between the devices you are logged in on.

## Is sync free?

Yes. Sync is on the free plan, and every plan — Free, Essential, Pro and Believer — allows **unlimited devices**. Nothing about syncing itself is behind a paywall. Only the [sync settings](/sync/sync-settings) that turn parts of syncing _off_, and full offline mode, need a paid plan.

## What gets encrypted, and when

Everything is encrypted on your device, with a key derived from your password, before it leaves it. That includes note content, titles, notebooks, tags, colors, reminders and attachments. The server receives ciphertext and hands the same ciphertext to your other devices, which decrypt it locally.

This is why nobody at Notesnook can read your notes, and why nobody can recover them for you if you lose your password and your recovery key. See [how your data is encrypted](/how-is-my-data-encrypted) for the full picture.

## When does Notesnook sync?

Sync is not on a fixed timer. It runs when something actually happens:

- **After a change.** Editing a note, creating a notebook, adding a tag or setting a reminder schedules a sync a moment later. Several quick changes are collapsed into one sync instead of one sync per keystroke.
- **In realtime.** While a note is open, changes arriving from your other devices are applied to the editor as they come in, so you can watch a note update on your laptop while you type on your phone.
- **On app start, and when the app comes back.** The app syncs when it starts, when you switch back to it, and when it detects that the internet came back after being offline.
- **Manually,** whenever you want to force the issue.

::: info
Automatic and realtime sync can both be switched off individually on a paid plan — see [sync settings](/sync/sync-settings).

:::

### Sync now

:::tabs key:platform
== Desktop/Web

1. Look at the status bar along the bottom of the window.
2. Click the sync icon next to your account indicator.

The icon starts spinning and its tooltip changes to `{{syncing}}` — or `{{downloading}}` / `{{uploading}}` — until it finishes.

== Mobile

1. Tap your profile picture — or the cog icon, if you have not set one — at the top of the side menu.
2. Tap `{{syncNow}}`.

You can also pull down on any list of notes to start a sync.

:::

## What the sync status indicator means

:::tabs key:platform
== Desktop/Web
Only the icon is drawn in the status bar at the bottom of the window — hover it and the tooltip tells you the state. There are seven:

| Tooltip                                             | What it means                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `Synced <time> ago`                                 | Everything is up to date.                                                                                            |
| `{{syncing}}`, `{{downloading}}` or `{{uploading}}` | A sync is running right now. The number in brackets is how many items have been transferred.                         |
| `Merge conflicts`                                   | Sync stopped because two versions of a note need your decision. The icon becomes a red alert triangle.               |
| `Sync disabled`, with a red alert icon              | Your email address is not confirmed yet. The status bar also shows `{{emailNotConfirmed}}` next to your account dot. |
| `{{syncFailed}}`                                    | The last sync did not finish.                                                                                        |
| `Synced <time> ago (offline)`                       | You have no internet connection.                                                                                     |
| `Sync disabled`, with a greyed-out icon             | You turned sync off in settings.                                                                                     |

Clicking the icon starts a sync, unless sync is disabled.

== Mobile

Mobile does not have a status bar icon. Tap your profile picture — or the cog icon, if you have not set one — at the top of the side menu. Under your email you will see one of:

- `{{syncing}}` — a sync is running, with the number of items transferred so far, and a spinner beside it
- `{{synced}}` followed by how long ago it finished
- `{{syncFailed}}` followed by how long ago it was last successful
- `{{never}}` — this device has not completed a sync yet
- `(Offline)` appended to any of the above when you have no connection

A colored dot sits at the end of the line: green when the last sync passed, orange when you are offline, red when it failed or you are not logged in.

:::

<!-- TODO: screenshot — the sync status icon in the desktop status bar, showing "Synced 2m ago" -->

## Sync while the app is closed

On mobile there is an extra setting called `{{backgroundSync}}`: _"Sync your notes in the background even when the app is closed. This is an experimental feature. If you face any issues, please turn it off."_

With it on, the operating system wakes Notesnook up periodically — at most every 15 minutes, and only when the OS decides it is a good moment — to run a full sync, refresh your reminders and update note widgets. It also restarts after your phone reboots.

Because the OS controls the schedule, background sync is best-effort: it is not a guarantee that your notes are current the second you open another device. Desktop and web have no equivalent — they sync for as long as the app is running, which on desktop includes when the window is closed to the system tray.

::: info
`{{backgroundSync}}` lives under `{{settings}}` → `{{account}}` → `{{syncSettings}}`, on mobile only. It is available on every plan. The three `Disable …` switches next to it are not — see [sync settings](/sync/sync-settings).

:::

## Keep a single note off sync

Any individual note can be excluded from sync entirely. This is useful for a scratchpad or something you want to exist on one device only.

:::tabs key:platform
== Desktop/Web

1. Right click the note in the notes list, or open its properties.
2. Choose `{{syncOff}}`.
3. Confirm — the dialog warns that the note _"will be automatically deleted from all other devices & any future changes won't get synced."_

The note now shows a crossed-out sync icon in the list. Choose `{{syncOff}}` again to turn syncing back on.

== Mobile

1. Tap the three dot menu on the note.
2. Tap `{{syncOff}}`.

The note shows a crossed-out sync icon in the list. Tap `{{syncOff}}` again to re-enable syncing for it.

:::

::: warning This removes the note from your other devices
Turning `{{syncOff}}` on a note deletes it from every other device. Only the copy on the device where you switched it off remains, and it will not be in any backup taken on another device.

:::

## What happens when two devices edit the same note

Notesnook never merges the text of two versions together and never silently throws one away.

When a note comes in from another device, Notesnook compares when each side was last edited:

- If the two edits are **less than 60 seconds apart**, or the content is identical, the more recent version wins and no conflict is raised. This is why typing on two devices at the same time, with sync working on both, does not create conflicts.
- If they are **more than 60 seconds apart**, the note is marked **conflicted**. It moves to the top of your notes list under a `Conflicted` group, and sync will keep flagging it until you pick a version.

Resolving a conflict is a two-click job — keep one version, discard the other, or save both. See [what are merge conflicts?](/faqs/what-are-merge-conflicts) for the full walkthrough of the resolution screen.

## Do I need an internet connection to use Notesnook?

No. Notesnook is a local-first app: everything you write is saved to your device first and works with no connection at all. Sync catches up the moment you are online again. If you also want every attachment available offline, turn on [full offline mode](/sync/sync-settings).

## Related pages

- [Sync settings](/sync/sync-settings) — full offline mode, turning off automatic, realtime or all syncing, and force push/pull
- [Sync troubleshooting](/sync/troubleshooting-sync) — fixes for notes that won't appear on another device
- [What are merge conflicts?](/faqs/what-are-merge-conflicts) — resolving two versions of the same note
- [How is my data encrypted?](/how-is-my-data-encrypted) — what happens to a note before it is uploaded
- [Plans & limits](/plans-and-limits) — which sync-related features need a paid plan
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — keeping your own copy alongside sync
