---
title: Android quick actions
pageTitle: Notesnook quick actions on Android
description: Start a note from the Android quick settings tile or the share sheet, and pin notes, notebooks and tags to your launcher.
keywords:
  - notesnook android quick settings tile
  - notesnook android shortcut
  - notesnook make note share
  - pin note to android home screen
---

# Quick actions on Android

::: info This page is Android only.
The iOS app has its own share extension — see [share things from other apps.](/mobile-integration/share-things-from-other-apps)

:::

Android gives Notesnook three ways to start writing without opening the app first, plus a way to pin any note, notebook, tag or color to your launcher.

## Add the quick settings tile

Notesnook ships a quick settings tile labelled `{{newNote}}`. Tapping it collapses the shade and opens the same quick-compose screen the `Make Note` share target uses.

1. Pull down the notification shade twice to show the full quick settings panel.
2. Tap the edit (pencil) button to see the available tiles.
3. Drag the `{{newNote}}` tile into your active tiles.
4. Tap it any time to start a note.

The tile requires Android 7.0 or newer.

<!-- TODO: screenshot — the New note tile in the Android quick settings editor -->

## Send text and files to Notesnook with "Make Note"

Notesnook registers as a share target under the name **Make Note**, for text, images, video and other files, including multiple items at once.

1. In any app, tap `{{share}}`.
2. Choose `Make Note` from the share sheet.
3. Edit the note that opens, then save it.

The same **Make Note** action appears in the text selection menu: highlight text anywhere in Android, tap the overflow (⋮) in the selection toolbar, and choose `Make Note` to drop the selection into a new note.

Details on what gets saved are on [share things from other apps](/mobile-integration/share-things-from-other-apps).

## Pin a note, notebook or tag to your launcher <PlanTag plan="pro" note="Android only" />

You can put a note, notebook, tag or color on your home screen as its own icon. Tapping it opens that item directly in Notesnook.

1. Long press the note, notebook, tag or color — or open its ⋮ menu.
2. Tap `{{addToHome}}`.
3. Android asks whether to add the shortcut. Confirm it.

The shortcut gets a generated icon based on the item's title and color, and its long label is the note headline or the notebook description. Pinned shortcuts need Android 8.0 or newer.

::: info What happens if your plan expires
Launcher shortcuts are a Pro feature. See [plans & limits](/plans-and-limits) for everything each plan unlocks.

:::

## Related pages

- [Share things from other apps](/mobile-integration/share-things-from-other-apps) — what the Make Note share target saves
- [Quick notes from notifications](/mobile-integration/quick-note-from-notification) — write from the notification shade
- [Home screen widgets](/mobile-integration/home-screen-widgets) — the quick note, note preview and reminder widgets
- [Pin notes to notifications](/mobile-integration/pin-notes-to-notifications) — keep a note in your notification shade
- [Plans & limits](/plans-and-limits) — which of these need a paid plan
