---
title: Home screen widgets
pageTitle: Notesnook home screen widgets on Android and iOS
description: Add the Notesnook quick note, notes, note preview and reminders widgets to your Android or iOS home screen, and choose which notes each one shows.
keywords:
  - notesnook widget
  - android notes widget
  - ios notes widget
  - quick note widget
  - note preview widget
schema: howto
---

# Home screen widgets

Notesnook widgets put a new note, a list of notes, one note or your reminders on your home screen. Android and iOS both have a quick note, notes, note preview and reminders widget. Android also has a pinned notes widget.

## Which widgets are available?

| Widget                             | Android | iOS | What it does                                                                                 |
| ---------------------------------- | ------- | --- | -------------------------------------------------------------------------------------------- |
| `{{quickNoteTitle}}`               | Yes     | Yes | Starts a new note straight from the home screen.                                             |
| Notes                              | Yes     | Yes | Lists the notes of a source you choose: recent, pinned, favorites, a notebook, tag or color. |
| `{{note}}` (`Note preview` on iOS) | Yes     | Yes | Shows one note you pick, and opens it when tapped.                                           |
| `{{reminders}}`                    | Yes     | Yes | Lists your upcoming reminders and lets you add a new one.                                    |
| Pinned notes                       | Yes     | No  | Lists your pinned notes. On iOS, use the Notes widget with `{{pinned}}`.                     |

::: info
On iOS, the Notes and note preview widgets need iOS 17 or later. The quick note and reminders widgets do not.
:::

## Add the quick note widget

:::tabs key:platform
== iOS

1. Long press the home screen.
2. Tap the + button on the top left.
3. Select Notesnook `Quick Note` and add it to the home screen.

![The Notesnook Quick Note widget on an iOS home screen](/static/mobile-integration/ios-quick-note-widget.png)

4. Tap the widget to launch the editor with a new note.

The quick note widget can also be added to the lock screen as a circular widget.

== Android

1. Long press the home screen.
2. Tap widgets.
3. Add the Notesnook `{{quickNoteTitle}}` widget to the home screen.

![The Notesnook quick note widget on an Android home screen](/static/mobile-integration/android-quick-note-widget.png)

4. Tap the widget to take a note without launching the app.

:::

## Show a list of notes with the Notes widget

The Notes widget shows the notes of one source at a time. A source is one of:

- `{{recent}}` — your latest notes, without pinned or conflicted ones
- `{{pinned}}`
- Favorites
- A notebook, a tag or a color

The widget keeps up to 30 notes per source. Locked notes show `Note locked` instead of their first line.

:::tabs key:platform
== Android

1. Long press the home screen and open the widget picker.
2. Drag the Notesnook Notes widget onto the home screen.
3. A list of sources opens. Search or scroll, then tap the source you want.
4. Scroll the widget to browse the notes, and tap a note to open it in the app. See [create and open from the Notes widget](#create-and-open-from-the-notes-widget) for the `+` and open buttons.

The title of the widget is the name of the source. Each widget has its own source, so you can add several Notes widgets, one for a notebook and another for `{{pinned}}`, for example.

To change the source later, long press the widget and use the reconfigure option your launcher offers. Launchers that do not offer it need the widget removed and added again.

== iOS

The Notes widget needs iOS 17 or later.

1. Long press the home screen.
2. Tap the + button on the top left.
3. Select Notesnook `Notes` and pick a size: small, medium or large.

![The medium Notes widget on an iOS home screen showing the Recent source, three notes and page arrows](/static/mobile-integration/ios-notes-widget-medium.png)

4. Tap the widget title. Notesnook opens a list of sources.

![The list of sources with Recent, Pinned and Favorites followed by notebooks, each with its own icon](/static/mobile-integration/ios-notes-widget-source-picker.png)

5. Tap the source you want. A message confirms the choice and the widget updates.
6. Tap a note in the widget to open it in the app.

![The large Notes widget on an iOS home screen showing seven recent notes and page arrows](/static/mobile-integration/ios-notes-widget-large.png)

On the medium and large widgets, when a source has more notes than fit, arrows with a page count such as `1/3` appear in the header. Tap them to move between pages. The small widget shows only the first note of the source.

:::

### Create and open from the Notes widget

The header of the Notes widget has a `+` button, and an open icon next to it when the widget shows a notebook, tag or color. On iOS these are on the medium and large widgets.

- Tap `+` to start a new note. When the widget shows a notebook, tag or color, the note is created inside it. For `{{recent}}`, `{{pinned}}` and Favorites it is a regular new note.
- Tap the open icon to go to that notebook, tag or color in the app.

### Choose different sources on iOS

On iOS, the source you pick in the app is saved for a slot. By default the slot is `Automatic (by size)`, so every small widget shares one choice, every medium widget shares one, and every large widget shares one. Two medium widgets would show the same source.

To show different sources on widgets of the same size, give each a slot:

1. Long press the widget and tap `Edit Widget`.

![The Edit Widget sheet of the Notes widget with Show and Slot options](/static/mobile-integration/ios-notes-widget-edit.png)

2. Set `Slot` to a different number for each widget, for example `Slot 1` and `Slot 2`.
3. Tap the title of each widget and pick its source.

You can also pick the source from `Edit Widget` with `Show`. This list has `{{recent}}`, `{{pinned}}` and Favorites, plus the notebooks, tags and colors you have already picked by tapping a widget title. If a notebook, tag or color is missing, tap a widget title and pick it there once.

A source picked by tapping the widget title takes priority over `Show` for that slot.

::: tip
If a widget shows the wrong source, check its `Slot` in `Edit Widget`. Another widget of the same size using the same slot changes it.
:::

## Show a single note with the note widget

:::tabs key:platform
== Android

1. Long press the home screen and open the widget picker.
2. Drag the Notesnook `{{note}}` widget onto the home screen.
3. The `{{selectANote}}` screen opens. Search with `{{searchForNotes}}` or scroll, then tap a note.
4. Tap the widget to open that note in the app.

The widget shows the title and the first lines of the note, and updates when you edit the note. Before you pick a note it shows `Tap to choose a note`. You can change the note later by long pressing the widget and using the reconfigure option your launcher offers.

== iOS

The `Note preview` widget needs iOS 17 or later.

1. Long press the home screen.
2. Tap the + button on the top left.
3. Select Notesnook `Note preview` and pick a size.
4. Tap the widget. `{{selectANote}}` opens in the app. Search or scroll, then tap a note.

![The Select a note screen listing notes, each with a note icon](/static/mobile-integration/ios-note-preview-picker.png)

5. The widget shows the note. Tap it to open the note in the app.

![The medium Note preview widget on an iOS home screen showing a note title and a callout](/static/mobile-integration/ios-note-preview-widget.png)

Each note you pick in the app is added to a list of up to 20 notes. To show another note on a second widget:

1. Add another `Note preview` widget.
2. Tap it and pick a note in the app, or long press it, tap `Edit Widget` and choose from `Note`.

The `Note` list in `Edit Widget` holds only notes you have picked in the app. If you leave `Note` empty, the widget shows the note you picked last. On the medium and large sizes a `+` icon in the corner opens the picker to add another note.

:::

Locked notes show `Note locked` instead of their content. Headings, lists, checklists, quotes, code blocks and tables are shown in the widget in a simplified form.

## Add the reminders widget

:::tabs key:platform
== Android

1. Long press the home screen and open the widget picker.
2. Drag the Notesnook `{{reminders}}` widget onto the home screen.
3. Scroll the list and tap a reminder to open it in the app.
4. Tap the `+` button on the widget to create a new reminder.

== iOS

1. Long press the home screen.
2. Tap the + button on the top left.
3. Select Notesnook `{{reminders}}` and pick a size.
4. Tap a reminder to open it in the app. On the small widget, tap to open the first reminder, or to add one when there are none.
5. On the medium and large widgets, tap `+` in the header to create a new reminder.

:::

The widget shows when each reminder is due, such as `Upcoming: Today, 5:00 PM`, `Snoozed until` a time, or `Ongoing`. Repeating reminders show their next occurrence. See [reminders](/reminders) for how to create them.

## Add the pinned notes widget _(Android only)_

1. Long press the home screen and open the widget picker.
2. Drag the Notesnook `Pinned notes` widget onto the home screen.
3. Scroll the list and tap a note to open it in the app.

The widget shows `No pinned notes` until you [pin a note](/organizing-notes/pin-notes).

## Why is my widget not updating?

- Open Notesnook once after installing or updating. Widgets read the data the app saves for them.
- On iOS, the lists refresh when the app saves changes. Opening the app refreshes them if a widget looks stale.
- Logging out clears the note and reminder widgets.
- If a widget on iOS says `Tap to pick the note shown here.`, tap it and pick a note.

## Related pages

- [Android quick actions](/mobile-integration/android-quick-actions) — tiles, shortcuts and the share sheet
- [Quick notes](/mobile-integration/quick-note-from-notification) — writing without opening the app
- [Pin notes to notifications](/mobile-integration/pin-notes-to-notifications) — keep a note in the notification shade
- [Reminders](/reminders) — getting notified about a note
