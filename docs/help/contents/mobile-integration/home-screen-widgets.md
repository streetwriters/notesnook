---
title: Home screen widgets
pageTitle: Notesnook home screen widgets on Android and iOS
description: Add the Notesnook quick note, note preview and reminders widgets to your Android or iOS home screen, and pick which note a widget shows.
keywords:
  - notesnook widget
  - android notes widget
  - ios notes widget
  - quick note widget
schema: howto
---

# Home screen widgets

Basic home screen widgets are available on both Android and iOS for quick note taking.

:::tabs key:platform
== iOS

1. Long press home screen
2. Tap the + button on top left
3. Select Notesnook Quick Note widget and add it to home screen

![The Notesnook Quick Note widget on an iOS home screen](/static/mobile-integration/ios-quick-note-widget.png)

4. Tap the widget to directly launch the editor in the app.

== Android

1. Long press home screen
2. Tap widgets
3. Add Notesnook widget to home screen

![The Notesnook quick note widget on an Android home screen](/static/mobile-integration/android-quick-note-widget.png)

4. Tap the widget to quickly take a note without launching the app.

:::

## Which widgets are available?

Android ships three widgets; iOS ships one.

| Widget                                     | Android | iOS | What it does                                                                        |
| ------------------------------------------ | ------- | --- | ----------------------------------------------------------------------------------- |
| `{{quickNoteTitle}}` (`Quick Note` on iOS) | Yes     | Yes | Opens a small note-taking screen straight from the home screen.                     |
| `{{note}}`                                 | Yes     | No  | Shows the title and first line of a note you pick, and opens that note when tapped. |
| `{{reminders}}`                            | Yes     | No  | Lists your upcoming reminders and lets you add a new one.                           |

### Quick note

On Android the widget is listed as `{{quickNoteTitle}}`, described as `Take a quick note.` in the widget picker, and appears as a single-line bar. Tapping it opens Notesnook's lightweight note screen without starting the full app.

On iOS the widget is listed as `Quick Note`, described as `A widget to add notes quickly.`, and shows a plus icon over `Add a quick note`. Tapping it launches the app straight into the editor with a new note.

### Note _(Android only)_

The `{{note}}` widget — `Add a note to home screen` in the widget picker — pins one specific note to your home screen and shows its title and headline. It updates whenever you edit the note.

1. Long press the home screen and open the widget picker.
2. Drag the Notesnook `{{note}}` widget onto your home screen.
3. The `Select a note` screen opens — pick the note you want on the widget.
4. Tap the widget to open that note in the app.

Because the widget is reconfigurable, you can long press it later and choose a different note.

<!-- TODO: screenshot — the Android note preview widget on a home screen -->

### Reminders _(Android only)_

The `{{reminders}}` widget — `Quick overview of upcoming reminders` in the widget picker — shows a scrollable list of your upcoming [reminders](/reminders).

1. Long press the home screen and open the widget picker.
2. Drag the Notesnook `{{reminders}}` widget onto your home screen.
3. Tap a reminder in the list to open it in the app, or tap the `+` button on the widget to create a new reminder.

<!-- TODO: screenshot — the Android reminders widget on a home screen -->

## Related pages

- [Android quick actions](/mobile-integration/android-quick-actions) — tiles, shortcuts and the share sheet
- [Quick notes](/mobile-integration/quick-note-from-notification) — writing without opening the app
- [Reminders](/reminders) — getting notified about a note
