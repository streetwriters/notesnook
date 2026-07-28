---
title: Self-hosting
pageTitle: How do I self-host Notesnook?
description: Point the Notesnook apps at your own sync, auth, events and monograph servers. What each server does, why you must be logged out, and what Test connection checks.
keywords:
  - self host notesnook
  - notesnook sync server
  - notesnook custom server url
  - notesnook server configuration
---

# How do I self-host Notesnook?

Every Notesnook app — web, desktop and mobile — lets you replace the servers it talks to with your own. You point the app at four URLs, test them, save, and the app restarts against your infrastructure. Your notes stay end-to-end encrypted either way; self-hosting means the encrypted data never touches Notesnook's machines.

## Which servers can I point elsewhere?

Exactly four, all four required:

| Server | What it does |
| --- | --- |
| `{{syncServer}}` | *"Server used to sync your notes & other data between devices."* |
| `{{authServer}}` | *"Server used for login/sign up and authentication."* |
| `{{sseServer}}` | *"Server used to receive important notifications & events."* |
| `{{monographServer}}` | *"Server used to host your published notes."* |

By default these are `https://api.notesnook.com`, `https://auth.streetwriters.co`, `https://events.streetwriters.co` and `https://monogr.ph`.

The apps validate all four together — you cannot self-host the sync server and leave the others pointing at Notesnook. `{{allServerUrlsRequired}}`

::: info Where the server side lives
The apps in this repository are the client half. The servers themselves — and their setup instructions — are in the [notesnook-sync-server](https://github.com/streetwriters/notesnook-sync-server) repository. Set those up and get them reachable before you touch the app settings below.
:::

## You must be logged out to change server URLs

Every field and button on the servers screen is disabled while you are signed in, and the app tells you so: `{{logoutToChangeServerUrls}}`

This is not an arbitrary restriction. Your account, your keys and your data live on whichever backend you were using; switching backends while logged in would leave the app holding a session the new server knows nothing about.

::: warning Log out first, and back up first
Log out of Notesnook before changing these URLs, and take a [backup](/backup-and-restore-notes-in-notesnook) beforehand. An account on Notesnook's servers does not exist on your own — you sign up again on your instance, and you bring your notes over by restoring your backup. **Notesnook cannot move an account between backends for you.**
:::

## Point Notesnook at your own servers

:::tabs key:platform
== Desktop/Web
1. Log out.
2. Open `{{settings}}` → `{{customization}}` → `{{servers}}`.
3. Fill in all four URLs — `{{syncServer}}`, `{{authServer}}`, `{{sseServer}}` and `{{monographServer}}`. Each field shows an example such as `e.g. http://localhost:4326`.
4. Press `{{testConnection}}`. On success you see `{{connectedToServer}}`
5. Press `{{save}}`.

`{{save}}` stays disabled until `{{testConnection}}` has passed. After saving, a dialog reads `App will reload in 5 seconds` — *"Your changes have been saved and will be reflected after the app has refreshed."* — and the app reloads itself.
== Mobile
1. Log out.
2. Open `{{settings}}` → `{{customization}}` → `{{servers}}`.
3. Fill in all four URLs. Each field is labelled with the server id and an example, such as `notesnook-sync e.g. http://localhost:4326`.
4. Tap `{{testConnection}}`. On success you see `{{connectedToServer}}`
5. Tap `{{save}}`.

Tapping `{{save}}` before testing shows `{{testConnectionBeforeSave}}`. After saving you get a `{{serverUrlChanged}}` dialog reading `{{restartAppToTakeEffect}}` — close the app fully and reopen it.
:::

<!-- TODO: screenshot — the Servers configuration screen with the four URL fields and the Test connection button -->

## What does "Test connection" actually check?

For each of the four servers in turn, the app requests that server's version endpoint — `/version`, or `/api/version` for the monograph server — and checks three things:

1. **Is it reachable?** If the request fails or returns something that isn't JSON: `Could not connect to <server>.`
2. **Is it the right server?** The response identifies which server it is. If the sync URL answers with the auth server's identity, you get `The URL you have given (<url>) does not point to the <server>.` This catches the classic copy-paste mistake of putting the same host in every field.
3. **Does it speak this app's protocol version?** If the server's API version doesn't match what this build of the app expects: `The <server> at <url> is not compatible with this client.` Update the server, or use an app build from the matching release.

Only when all four pass does the app report `{{connectedToServer}}` and let you save.

## Go back to Notesnook's servers

:::tabs key:platform
== Desktop/Web
1. Log out.
2. Open `{{settings}}` → `{{customization}}` → `{{servers}}`.
3. Press `{{reset}}`.

The app reloads after 5 seconds, back on the default hosts.
== Mobile
1. Log out.
2. Open `{{settings}}` → `{{customization}}` → `{{servers}}`.
3. Tap `{{resetServerUrls}}`.

You get a `{{serverUrlsReset}}` dialog reading `{{restartAppToTakeEffect}}` — close and reopen the app.
:::

Your local notes are untouched by a reset, but the account you used on your own instance does not exist on Notesnook's servers. You log in (or sign up) again, and restore a backup.

## Can I self-host the Inbox API too?

Yes, and separately from the four servers above. The inbox service — the one that accepts notes posted in from scripts and automations — can run on your own machine, or you can skip it entirely and encrypt payloads locally before posting them. See [self-hosting the Inbox API](/inbox-api/self-hosting-inbox-api).

## Related pages

- [How sync works](/sync/how-sync-works) — what the sync server actually receives from your device
- [Sync troubleshooting](/sync/troubleshooting-sync) — connection errors, including ones naming a specific server
- [Sync settings](/sync/sync-settings) — offline mode and sync controls, which work the same self-hosted
- [Self-hosting the Inbox API](/inbox-api/self-hosting-inbox-api) — running your own inbox endpoint
- [How is my data encrypted?](/how-is-my-data-encrypted) — why the server never sees your notes, hosted or not
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — how you carry notes between backends
