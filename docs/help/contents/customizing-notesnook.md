---
title: Customizing the app
pageTitle: How do I customize the Notesnook app?
description: Choose which screen Notesnook opens on, reorder or hide side menu items, switch to compact lists, and change how dates, times and sorting work.
keywords:
  - notesnook custom home screen
  - notesnook default sidebar tab
  - notesnook hide side menu items
  - notesnook compact list view
  - notesnook date format
schema: howto
---

# How do I customize the Notesnook app?

Notesnook lets you decide what it opens on, what your side menu contains and in what order, how dense your note lists are, and how dates and times are written. Everything on this page is per-device — none of it changes the notes themselves.

## Set your home screen <PlanTag plan="pro" />

The home screen is the screen Notesnook opens on when you launch it. By default that is your notes list, but you can point it at any side menu item, or at a specific notebook, tag or color.

:::tabs key:platform
== Desktop/Web

1. Right click the item you want as your home screen — a side menu item such as `Notes` or `Favorites`, a color, a shortcut, or a notebook or tag in the list.
2. Click `{{setAsHomepage}}`.
3. A checkmark appears next to `{{setAsHomepage}}`. Click it again to go back to the default home screen.

== Mobile

1. Long press the item you want as your home screen.
2. For a side menu item, tap `{{setAsHomepage}}` in the sheet that opens. For a notebook, tag or color, tap `{{setAsHomepage}}` in its properties sheet.
3. For a notebook, tag or color you can undo it by opening the same menu and tapping `{{unsetAsHomepage}}`. For a side menu item there is no reset — set a different item as your home screen instead.

:::

Next time you open Notesnook it lands on the screen you picked.

::: info What happens if your plan expires
A custom home screen is a Pro feature. If your subscription ends, Notesnook resets the home screen to the default. See [plans & limits](/plans-and-limits).

:::

## Choose the default sidebar tab <PlanTag plan="pro" />

The sidebar has three tabs — notes, notebooks and tags. This setting decides which one is selected when the app starts.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{customization}}` → `{{behaviour}}`.
3. Under `{{general}}`, set `{{defaultSidebarTab}}` to `Notes`, `{{notebooks}}` or `Tags`.

== Mobile

1. Go to `{{settings}}`.
2. Open `{{customization}}` → `{{behavior}}`.
3. Tap `{{defaultSidebarTab}}` and pick `Home`, `{{notebooks}}` or `Tags`.

:::

## Reorder and hide side menu items <PlanTag plan="essential" />

You can drag the items in your side menu into the order you want, and hide the ones you never use. This covers the built-in items (`Notes`, `Favorites`, `{{reminders}}`, `{{monographs}}`, `{{trash}}`, `{{archive}}`) and your [colors](/organizing-notes/organize-notes-using-colors). `{{notebooks}}` and `Tags` are sidebar tabs rather than menu items, so they cannot be reordered or hidden. Hiding an item only removes it from the menu; nothing inside it is deleted.

:::tabs key:platform
== Desktop/Web

1. Drag a side menu item up or down to move it.
2. To hide items, right click any side menu item — the menu lists every item and color with a checkmark next to the visible ones.
3. Click an item to uncheck it and hide it. Click it again to bring it back.
4. To undo everything, right click a side menu item and click `{{resetSidebar}}`.

== Mobile

1. Long press a side menu item and tap `{{reorder}}`.
2. Drag items into the order you want.
3. Tap the **−** button beside an item to hide it, or the **+** button to show it again. Hidden items stay visible while you're reordering, dimmed.
4. Tap `{{done}}` at the bottom of the side menu to leave reorder mode.

:::

<!-- TODO: screenshot — the side menu right click menu on desktop showing checked/unchecked items and Reset sidebar -->

::: info Shortcuts are separate
Pinning notebooks and tags to the side menu is a different feature — see [side menu shortcuts](/organizing-notes/side-menu-shortcuts). Free plans can keep 10 shortcuts; Essential and above are unlimited.

:::

## Switch between detailed and compact lists

Compact mode strips a list down to one line per item, so more fits on screen. It is remembered per list type: on desktop and web there is one setting for notes (shared by the notes, favorites and search lists) and one for notebooks; on mobile, notes, notebooks and search results each have their own.

:::tabs key:platform
== Desktop/Web

1. Find the list view icon at the top right of the list, next to the sort icon.
2. Click it. The tooltip reads `Switch to compact view`, and `Switch to detailed view` once compact mode is on.

== Mobile

1. Tap the list view icon at the top right of the list, next to the sort icon.
2. Tap it again to go back to the detailed list.

:::

## Change how notes are sorted and grouped

Sorting and grouping are stored per list, and separately for each notebook, tag and color you open — so your notebooks can be alphabetical while your notes stay newest-first.

:::tabs key:platform
== Desktop/Web

1. Click the sort icon at the top right of the list. The menu is titled `Group & sort`, or `{{sort}}` where grouping doesn't apply.
2. Use `{{orderBy}}` to flip the direction — `{{oldestToNewest}}` / `{{newestToOldest}}`, or `{{aToZ}}` / `{{zToA}}` when sorting by title.
3. Use `{{sortBy}}` to choose `Date created`, `Date edited`, `Date modified`, `Date deleted`, `Due date`, `{{title}}` or `Relevance`, depending on the list.
4. Use `{{groupBy}}` to choose `{{none}}`, `{{default}}`, `Year`, `{{month}}`, `Week` or `Abc`.

== Mobile

1. Tap the sort icon at the top right of the list.
2. Tap the button beside `{{sortBy}}` to flip the direction between ascending and descending.
3. Pick a field under `{{sortBy}}`, and a grouping under `{{groupBy}}`.

:::

Reminders and search results can be sorted but not grouped.

## Change the date, time, day and week formats

These settings control how every date in the app is written — in note lists, reminders and note properties.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{customization}}` → `{{behaviour}}`.
3. Under `{{dateAndTime}}`, set:
   - `{{dateFormat}}` — day/month/year, month/day/year or year/month/day, each with `-`, `/` or `.` as the separator, plus `MMM D, YYYY`. Every option previews today's date beside it.
   - `{{timeFormat}}` — `12h` or `24h`.
   - `{{dayFormat}}` — `Short (Mon, Tue)` or `Long (Monday, Tuesday)`.
   - `{{weekFormat}}` — whether the week starts on `Sunday` or `Monday`.

== Mobile

1. Go to `{{settings}}`.
2. Open `{{customization}}` → `{{behavior}}`.
3. Tap `{{dateFormat}}`, `{{timeFormat}}`, `{{dayFormat}}` or `{{weekFormat}}` and pick an option.

:::

## Mobile-only settings

Three behaviour settings exist only in the mobile apps, under `{{settings}}` → `{{customization}}` → `{{behavior}}`:

- `{{keepScreenOn}}` — stops the screen from dimming while you're in the app.
- `{{autoUpdateCheck}}` — turn off the update check on app start.
- `{{clearDefaultNotebook}}` — clears the notebook new notes are filed into by default.

## Related pages

- [Plans & limits](/plans-and-limits) — which customizations need Essential or Pro
- [Side menu shortcuts](/organizing-notes/side-menu-shortcuts) — pin notebooks and tags to the side menu
- [Using themes](/custom-themes/using-themes) — light, dark and themes from the theme store
- [Personalizing the editor](/rich-text-editor/personalizing-rich-text-editor) — font, size and line spacing while you write
- [Organize notes using colors](/organizing-notes/organize-notes-using-colors) — the colors that appear in your side menu
