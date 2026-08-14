---
title: Sync settings
pageTitle: Notesnook sync settings — offline mode and sync controls
description: Turn on full offline mode, disable automatic, realtime or all syncing, and use force push and force pull to repair a device that is out of step.
keywords:
  - notesnook full offline mode
  - notesnook disable sync
  - notesnook force push changes
  - notesnook force pull changes
  - notesnook offline attachments
---

# Notesnook sync settings

Sync works out of the box with nothing to configure. These settings exist for the cases where you want more of your data kept on the device, less automatic network activity, or a way to repair a device that has fallen out of step with the server.

## Where sync settings live

:::tabs key:platform
== Desktop/Web

1. Open `{{settings}}`.
2. Under `{{account}}`, select `{{sync}}`.

Everything on this page is in the `{{sync}}` group.

== Mobile

1. Open `{{settings}}`.
2. Under `{{account}}`, tap `{{syncSettings}}` — _"Manage your sync settings here"_.

:::

<!-- TODO: screenshot — the Sync section of desktop settings showing all four toggles -->

## Turn on full offline mode <PlanTag plan="essential" />

`{{fullOfflineMode}}` — _"Download everything including attachments on sync"_ — makes every sync also download your attachments, not only your notes. Without it, an image or file is fetched from the server the first time you open it, which needs a connection.

Turn it on if you want your notes **and** every image, file and audio recording readable with no internet at all — on a flight, or on a laptop you deliberately keep offline.

:::tabs key:platform
== Desktop/Web

1. Open `{{settings}}` → `{{account}}` → `{{sync}}`.
2. Switch on `{{fullOfflineMode}}`.

Notesnook immediately starts downloading everything you have not cached yet. Switching it back off cancels any download still in progress.

== Mobile

1. Open `{{settings}}` → `{{account}}` → `{{syncSettings}}`.
2. Switch on `{{fullOfflineMode}}`.

A progress indicator appears at the top of the screen while attachments download. Switching it back off cancels the remaining downloads.

:::

::: info Full offline mode uses disk space
Your attachments are downloaded in full, so the app's storage footprint grows to roughly the size of everything you have uploaded. Attachments already downloaded stay downloaded when you turn the setting off.

:::

Full offline mode needs Essential or above — see [plans & limits](/plans-and-limits).

## Turn off automatic, realtime or all syncing <PlanTag plan="pro" />

Three separate switches, from least to most drastic. All three need Pro or above.

| Setting                   | What it does                                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{{disableAutoSync}}`     | _"Turn off automatic syncing. Changes from this client will be synced only when you run sync manually."_                                                    |
| `{{disableRealtimeSync}}` | _"Changes from other devices won't be updated in the editor in real-time."_                                                                                 |
| `{{disableSync}}`         | _"Turns off syncing completely on this device. Any changes made will remain local only and new changes from your other devices won't sync to this device."_ |

Each is worded as a _disable_ switch: turning the switch **on** turns that piece of syncing **off**.

- Use `{{disableAutoSync}}` on a metered or unreliable connection. You keep manual sync, so nothing is stranded permanently — you decide when it goes out.
- Use `{{disableRealtimeSync}}` if you find notes changing under your cursor distracting while someone else's device (or your own) is editing the same note.
- Use `{{disableSync}}` to make a device local-only for a while. When you switch it back on, everything queued up on that device syncs then.

:::tabs key:platform
== Desktop/Web

1. Open `{{settings}}` → `{{account}}` → `{{sync}}`.
2. Switch on `{{disableSync}}`, `{{disableAutoSync}}` or `{{disableRealtimeSync}}`.

With `{{disableSync}}` on, the sync icon in the status bar greys out and its tooltip reads `Sync disabled`. Clicking it no longer starts a sync.

== Mobile

1. Open `{{settings}}` → `{{account}}` → `{{syncSettings}}`.
2. Switch on `{{disableAutoSync}}`, `{{disableRealtimeSync}}` or `{{disableSync}}`.

:::

::: warning Nothing leaves the device while sync is off
A device with `{{disableSync}}` on does not send changes anywhere, and does not receive them. If that device is lost or reset before you turn sync back on, the changes made on it are gone. Take a [backup](/backup-and-restore-notes-in-notesnook) if you plan to leave sync off for any length of time.

:::

## Sync in the background

Mobile has one extra switch on the same screen, `{{backgroundSync}}` — _"Sync your notes in the background even when the app is closed. This is an experimental feature. If you face any issues, please turn it off."_

It is available on every plan, and it is **mobile only** — there is no equivalent on desktop or web, which sync while the app or tab is open. See [how sync works](/sync/how-sync-works) for what background sync can and cannot promise.

## Force push or force pull your data

These two buttons exist for one purpose: repairing a device whose data has drifted out of step with the server. They are available on every plan, and both overwrite data.

| Button                 | What it does                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{{forcePushChanges}}` | _"Use this if changes made on this device are not appearing on other devices. This will overwrite the data on the server with the data from this device."_     |
| `{{forcePullChanges}}` | _"Use this if changes from other devices are not appearing on this device. This will overwrite the data on this device with the latest data from the server."_ |

::: danger These are not a stronger "sync now"
From the app's own warning: _"This must only be used for troubleshooting. Using this regularly for sync is not recommended and will lead to unexpected data loss and other issues."_

A force push replaces what is on the server with this device's copy — anything on the server that this device never received can be lost. A force pull replaces this device's copy with the server's — anything on this device that was never uploaded can be lost. **Notesnook cannot recover data destroyed this way.** Take a [backup](/backup-and-restore-notes-in-notesnook) before you press either one.

:::

:::tabs key:platform
== Desktop/Web

1. Open `{{settings}}` → `{{account}}` → `{{sync}}`.
2. Scroll to `{{havingProblemsWithSync}}`.
3. Press `{{forcePushChanges}}` or `{{forcePullChanges}}`.
4. Read the warning, tick `{{understand}}`, then press `{{continue}}`.

The sync icon in the status bar shows the run in progress. Both buttons are styled in red — that is deliberate.

== Mobile

1. Open `{{settings}}` → `{{account}}` → `{{syncSettings}}`.
2. Tap `{{forcePullChanges}}` or `{{forcePushChanges}}`.
3. Read the warning in the dialog, then tap `{{start}}`.

A progress sheet shows the run and closes when it finishes.

:::

If you are here because something is not syncing, try the ordinary fixes in [sync troubleshooting](/sync/troubleshooting-sync) first — a force push or pull is rarely the right first move.

## Related pages

- [How sync works](/sync/how-sync-works) — when Notesnook syncs and what the status indicator means
- [Sync troubleshooting](/sync/troubleshooting-sync) — what to try before forcing a push or pull
- [Plans & limits](/plans-and-limits) — full offline mode needs Essential, sync controls need Pro
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — take one before any forced sync
- [What are merge conflicts?](/faqs/what-are-merge-conflicts) — resolving two versions of the same note
