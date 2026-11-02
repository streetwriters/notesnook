---
title: Sync troubleshooting
pageTitle: Why is my note not syncing in Notesnook?
description: Notes not showing up on another device? Fix sync in Notesnook — login and email states, conflicts, rate limits, and when to force push or pull.
keywords:
  - notesnook not syncing
  - notesnook sync failed
  - notesnook sync disabled
  - notesnook note not appearing on other device
  - notesnook attachment not downloading
schema: faq
faqs:
  - q: Why is my note not syncing?
    a: Most often the other device has not synced yet, sync is turned off on one of the two devices, the note itself has "Sync off" enabled, or your email address is not confirmed. Run a manual sync on both devices, then check those three settings in order.
  - q: Why does Notesnook say sync is disabled?
    a: Either you turned on "Disable sync" in sync settings, or your email address is not confirmed. Both show the tooltip "Sync disabled"; a greyed-out icon means the setting, a red alert icon means the email.
  - q: What does "You are being rate limited" mean?
    a: You have made too many requests to the server in a short period. Stop syncing manually, wait a few minutes, and let the app sync on its own.
  - q: Should I use force push or force pull?
    a: Force push when changes made on this device are missing everywhere else. Force pull when changes from your other devices are missing here. Both overwrite data, so take a backup first.
---

# Why is my note not syncing?

Work through this page in order. Nearly every sync problem is one of four things: the other device has not synced, sync is switched off somewhere, your email is not confirmed, or a note is stuck as conflicted. Forcing a push or pull is the last resort, not the first.

## Why is my note not syncing to my other device?

Check these in order — the first three cover most cases.

1. **Sync the other device too.** A note is only on your phone once your phone has fetched it. Open the other device and run a sync manually — click the sync icon in the desktop status bar, or tap your profile → `{{syncNow}}` on mobile.
2. **Confirm both devices are on the same account.** Open `{{settings}}` and check the email address shown on each device.
3. **Check the note is not set to `{{syncOff}}`.** A note with a crossed-out sync icon in the list has been deliberately excluded from sync, and turning that on **deletes it from your other devices**. Open the note's menu and toggle `{{syncOff}}` back off to bring it back into sync.
4. **Check sync is not disabled on either device.** See the next section.
5. **Check the note is not conflicted.** A conflicted note sits at the top of the notes list under the `Conflicted` group and blocks sync until you resolve it.

If all five check out and the note is still missing on the other device only, a [force push](/sync/sync-settings) from the device that _has_ the note is the tool for it — read the warning there first.

## Why does Notesnook say "Sync disabled"?

There are two different causes, and the icon tells you which:

:::tabs key:platform
== Desktop/Web
Both show the same tooltip, `Sync disabled` — the icon is what distinguishes them:

- **Greyed-out sync-off icon** — you turned on `{{disableSync}}` in `{{settings}}` → `{{account}}` → `{{sync}}`. Turn that switch back off.
- **Red alert icon** — your email address is not confirmed. The status bar also shows `{{emailNotConfirmed}}` next to your account dot; click it to confirm your email.

== Mobile

- Open `{{settings}}` → `{{account}}` → `{{syncSettings}}` and check whether `{{disableSync}}` is switched on. If it is, switch it off.
- If your email is not confirmed, Notesnook shows `{{syncDisabled}}` with the message `{{syncDisabledActionText}}`. Tap it to resend the confirmation email.

:::

::: info If you already confirmed your email
Occasionally the server still thinks an already-confirmed address is unconfirmed. Notesnook detects this during sync and refreshes your login token automatically, so the next sync attempt fixes it. If it doesn't, log out and back in.

:::

## Why does it say "not logged in"?

Sync only runs while you are logged in. On mobile, tapping the profile button at the top of the side menu opens a sheet that reads `{{notLoggedIn}}` when you are not; on desktop and web the account dot and sync icon disappear from the status bar.

If you _were_ logged in and got signed out, your session expired. Log in again — your notes are still on the device, and nothing needs re-downloading. If you see `Unauthorized.` or `User encryption keys not generated. Please relogin.`, that is the same thing: log out and log back in.

::: warning Do not delete the app to fix a login problem
Notes that were never uploaded live only on that device. Reinstalling deletes them. Log out and back in from inside the app instead, and take a [backup](/backup-and-restore-notes-in-notesnook) first.

:::

## What does "You are being rate limited" mean?

The server refused the request because too many arrived from your account in a short window. It is temporary and nothing is lost.

Stop pressing sync, wait a few minutes, and let the app sync on its own. If you have been repeatedly running `{{forcePullChanges}}` or `{{forcePushChanges}}`, that is the usual cause — those transfer your whole dataset every time and are not meant to be used routinely.

## Why does sync say "Sync failed"?

`{{syncFailed}}` means the last run did not complete. The error message in the toast tells you which stage failed:

| Message                                                                                                                                                      | What it means                                                                                                                                                                                                                                | What to do                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| _(no message — only the status flips to `{{syncFailed}}`)_                                                                                                   | The app could not open a connection to the sync server within 30 seconds. Connection failures are written to the log as `Could not connect to the Sync server. Please try again.` but are deliberately not shown as a toast.                 | Check your connection, then sync again. Behind a strict firewall or VPN, try another network. |
| `Notesnook Sync Server is not responding. Please check your internet connection.` (the full message goes on to give a support address and a reference error) | The server did not answer at all. Other names you may see are `Authentication Server`, `Eventing Server` and `Monograph Server`. If you have pointed the app at your own servers you get the raw network error instead of this friendly one. | Check your connection.                                                                        |
| `You are being rate limited.`                                                                                                                                | Too many requests.                                                                                                                                                                                                                           | Wait a few minutes.                                                                           |
| `Unauthorized.`                                                                                                                                              | Your session is no longer valid.                                                                                                                                                                                                             | Log out and log back in.                                                                      |
| `Failed to send all items. Sent X out of Y.`                                                                                                                 | The upload stopped partway.                                                                                                                                                                                                                  | Sync again — the remaining items are still queued and go out on the next run.                 |

A failed sync never loses local data. Everything you wrote is on the device and goes out on the next successful run.

## Why is a note stuck as "conflicted"?

A conflicted note stays conflicted until _you_ pick a version — Notesnook will not choose for you, and it will not merge two versions of your text together. Until it is resolved, the desktop status bar keeps showing a red alert icon whose tooltip reads `Merge conflicts`

1. Go to `Notes`.
2. Open the note under the `Conflicted` group at the top of the list.
3. Keep one version, discard the other, or press `{{saveACopy}}` to keep both.
4. Run a sync.

If a note re-conflicts every time you sync, the two devices are each holding an edit the other has not seen. Resolve it on one device, let that device sync fully to completion, _then_ sync the other one.

Full instructions, including what the highlighted diff means, are in [what are merge conflicts?](/faqs/what-are-merge-conflicts).

## Why won't my attachments download?

Attachments sync separately from note text. A note can arrive on a device while its images are still on the server.

- **Images load when you open the note.** By default an attachment is fetched the first time you view it, so it needs a connection at that moment. To have them all downloaded ahead of time, turn on [full offline mode](/sync/sync-settings).
- **Run a file check.** Open the attachments manager and use `{{fileCheck}}` on the affected files — it verifies the file actually exists on the server and is intact.

:::tabs key:platform
== Desktop/Web

1. Open `{{settings}}` → `{{profile}}`.
2. Next to `{{attachments}}` — _"Manage attachments"_ — press `{{open}}`.
3. Select the attachments and choose `{{fileCheck}}`.

== Mobile

1. Open `{{settings}}` → `{{account}}` → `{{manageAccount}}`.
2. Tap `{{manageAttachments}}`.
3. Select the attachments and tap `{{fileCheck}}`.

:::

- **Check the file was uploaded in the first place.** An attachment added while you were logged out or offline stays local until the device that holds it syncs successfully. Sync that device before looking for the file elsewhere.
- **Check your storage.** If your account is over its monthly storage allowance, new uploads are refused — existing attachments stay downloadable. See [plans & limits](/plans-and-limits).

## When should I use force pull instead of force push?

Match the direction to the symptom, and take a [backup](/backup-and-restore-notes-in-notesnook) first.

| Symptom                                                            | Use                    | Effect                                                                  |
| ------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------- |
| Changes made **on this device** are not appearing on other devices | `{{forcePushChanges}}` | Overwrites the data on the server with the data from this device        |
| Changes **from other devices** are not appearing on this device    | `{{forcePullChanges}}` | Overwrites the data on this device with the latest data from the server |

::: danger Both of these overwrite data
The app's own warning: _"This must only be used for troubleshooting. Using this regularly for sync is not recommended and will lead to unexpected data loss and other issues."_ Anything that exists only on the side being overwritten is lost, and **Notesnook cannot recover it for you.** Never run both in sequence, and never use them as a routine "sync harder" button.

:::

Both buttons and the exact steps are documented in [sync settings](/sync/sync-settings).

## Nothing here fixed it

Send the details to support@streetwriters.co — which devices, what the status indicator says on each, and the exact error text.

## Related pages

- [How sync works](/sync/how-sync-works) — when sync runs and what each status state means
- [Sync settings](/sync/sync-settings) — disable switches, full offline mode, force push and force pull
- [What are merge conflicts?](/faqs/what-are-merge-conflicts) — resolving a conflicted note step by step
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — take one before any forced sync
- [Plans & limits](/plans-and-limits) — storage allowances and which sync features need a paid plan
