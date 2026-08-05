---
title: Search & navigation
pageTitle: How to search your notes and move around Notesnook fast
description: Search your notes in Notesnook, narrow results with filters like tag, color, date and favorite, and jump anywhere with the command palette and quick open.
keywords:
  - notesnook search notes
  - notesnook search filters
  - notesnook command palette
  - search inside notes
  - notesnook sort notes
---

# How do I search my notes in Notesnook?

Every list view has a search box at the top of it. Type into it and Notesnook searches the notes in _that_ view — the whole notes list, one notebook, one tag, favorites, trash — matching both note titles and the text inside notes, and showing you the matching passages.

Search runs on your device against the local database. Nothing about what you search for is sent anywhere.

You can also [narrow a search with filters](#narrow-a-search-with-filters) — by tag, color, date, or whether a note is favorited, archived or filed in a notebook.

## Search inside a view

:::tabs key:platform
== Desktop/Web

1. Click the search box at the top of the list. It's labelled after the view you're in — `Search in Notes`, `Search in Notebook`, `Search in Trash` and so on.
2. Type your query. Results appear as you type.
3. Press `Escape`, or click the ✕ in the box, to clear the search and go back to the full list.

`Ctrl+F` (`⌘+F` on macOS) puts the cursor in that box whenever the editor isn't focused. If you're in a note, `Ctrl+F` opens the editor's own find bar instead.

== Mobile

1. Tap the bar at the top of the screen — it reads `Search in Notes`, `Search in Notebook` and so on, depending on the view.
2. Type your query. Results appear as you type.
3. Tap the back arrow to return to the list.

:::

## What is actually searched

| You're searching | Matched on                          |
| ---------------- | ----------------------------------- |
| Notes            | Title and the full text of the note |
| Notebooks        | Title and description               |
| Tags             | Title                               |
| Reminders        | Title and description               |
| Attachments      | Filename, file type and hash        |
| Trash            | Deleted notes and notebooks         |

::: info Locked notes
The content of a note in your [private vault](/lock-notes-with-private-vault) is encrypted, so it is never added to the search index. Locked notes are found by their titles only. This is a limitation of end-to-end encryption, not a bug.

:::

## Narrow a search with filters

Search understands filters — `field:value` pairs you add to a search to cut the results down. Filters only work when you are **searching notes**.

::: warning Put your words first, filters last
A word typed _after_ a filter is swallowed into it, and the whole search silently returns nothing:

- `favorite:true meeting` — finds nothing at all
- `meeting favorite:true` — finds favorite notes containing "meeting" ✓

Always write what you're looking for, then the filters.

:::

### Filters you can use

**Where to look**

| Filter           | Finds                             |
| ---------------- | --------------------------------- |
| `title:budget`   | Notes whose **title** matches     |
| `content:budget` | Notes whose **body text** matches |

Without either of these, your words are matched against both `content` and `title`.

**Tags and colors**

| Filter      | Finds                      |
| ----------- | -------------------------- |
| `tag:work`  | Notes with the tag _work_  |
| `color:red` | Notes with the color _red_ |

Values match the tag or color's exact title. Quote anything with a space: `tag:"work stuff"`.

**Dates**

| Filter                      | Finds                         |
| --------------------------- | ----------------------------- |
| `created_after:2026-01-01`  | Notes created after that date |
| `created_before:2026-01-01` | Notes created before it       |
| `edited_after:2026-01-01`   | Notes edited after it         |
| `edited_before:2026-01-01`  | Notes edited before it        |

Write dates as `YYYY-MM-DD`. Words like `yesterday` are not understood and will make the search return nothing.

**Yes / no filters**

Each takes exactly `true` or `false`.

| Filter         | `true` finds                                          | `false` finds               |
| -------------- | ----------------------------------------------------- | --------------------------- |
| `favorite:`    | Favorited notes                                       | Notes that aren't favorited |
| `pinned:`      | Pinned notes                                          | Unpinned notes              |
| `archived:`    | Archived notes                                        | Notes not archived          |
| `readonly:`    | Read-only notes                                       | Editable notes              |
| `locked:`      | Notes in your [vault](/lock-notes-with-private-vault) | Notes outside it            |
| `tagged:`      | Notes with **any** tag                                | Notes with no tags at all   |
| `colored:`     | Notes with **any** color                              | Notes with no color         |
| `in_notebook:` | Notes filed in **any** notebook                       | Notes in no notebook        |

The last three are the quickest way to find notes you never filed: `in_notebook:false` lists every loose note, `tagged:false` every untagged one.

`locked:` only works once you have created a vault.

### Combine filters

Add as many as you like — a note has to satisfy all of them:

```
roadmap tag:work favorite:true edited_after:2026-06-01
```

That reads: notes containing "roadmap", tagged _work_, favorited, and edited since 1 June 2026.

You can also search with filters **and no words at all**, which lists everything that matches:

```
in_notebook:false archived:false
```

### Useful searches

| Search                                  | What it gives you                          |
| --------------------------------------- | ------------------------------------------ |
| `in_notebook:false`                     | Notes you never filed into a notebook      |
| `tagged:false`                          | Notes with no tags                         |
| `favorite:true edited_after:2026-07-01` | Recently edited favorites                  |
| `tag:receipts created_after:2026-01-01` | This year's receipts                       |
| `budget content:quarterly`              | "budget" anywhere, "quarterly" in the body |
| `locked:true`                           | Everything in your vault                   |

### Things to watch out for

- **`true` and `false` must be lowercase.** `favorite:TRUE` or `favorite:yes` makes the search return nothing.
- **A filter Notesnook doesn't recognise is treated as plain text.** `colour:red` searches for the literal words rather than filtering by color — the spelling is `color:`.
- Filter names are case-sensitive: `Tag:work` returns nothing.

## Read the results and jump to a match

A note that matched shows its title with the matching words highlighted, and the number of matches found inside the note on the right.

:::tabs key:platform
== Desktop/Web

1. Click the arrow next to a result to expand it. Each matching passage in the note is listed underneath, with the matched words highlighted.
2. Click a passage to open the note scrolled straight to that spot.
3. Middle-click a passage to open it in a new tab instead.

Passages are only shown in the detailed list. Switching the notes list to compact view collapses results to titles.

== Mobile

1. Tap a result to open the note.

Matching passages are highlighted in the result so you can see the context before opening it.

:::

<!-- TODO: screenshot — an expanded search result showing highlighted matches under the note title -->

## Run a command from the keyboard

The command palette is a desktop and web feature. Press `Ctrl+Shift+P` (`⌘+Shift+P` on macOS) — `Ctrl+Shift+:` works too — to open it. Start typing and it fuzzy-matches every command in the app:

- **Navigate** — `Notes`, `{{notebooks}}`, `Tags`, `Favorites`, `{{reminders}}`, `{{monographs}}`, `{{trash}}`, `{{settings}}`, `{{helpAndSupport}}`, `Keyboard shortcuts`, `{{attachmentManager}}`.
- **Create** — `{{newNote}}`, `{{newNotebook}}`, `{{newTag}}`, `{{newReminder}}`, `{{newColor}}`.
- **Editor** — when a note is open: `{{newTab}}`, `{{nextTab}}`, `{{previousTab}}`, `{{closeCurrentTab}}`, `{{closeAllTabs}}`, `{{undo}}`, `{{redo}}`, `{{goBackInTab}}`, `{{goForwardInTab}}`, `{{toggleFocusMode}}`.
- **General** — `{{toggleTheme}}`.
- **Every action of whatever you have open** — the entire note menu for the note in the editor, and the notebook or tag menu for the notebook or tag you're viewing, appear as commands too.
- **Recents** — the commands you ran last, at the top.

Move with `↑` and `↓`, run with `⏎`. Press `Delete` on an entry under recents, or click the ✕ on it, to drop it from the list.

::: info Not on mobile
The command palette and quick open are only features of the **desktop and web apps**. On mobile, use the search bar and the side menu.

:::

## Jump to a note by name

Quick open is a desktop and web feature. Press `Ctrl+P` (`⌘+P` on macOS) for **quick open**. It searches your notes, notebooks, tags and reminders by title and opens whatever you pick. With the box empty it lists your recent items and the notes already open in tabs.

| Key              | What it does                                  |
| ---------------- | --------------------------------------------- |
| `⏎`              | Open the highlighted item                     |
| `Ctrl+⏎` / `⌘+⏎` | Open the highlighted note in a new tab        |
| `Shift+⏎`        | Open a new tab titled with whatever you typed |

`Shift+⏎` is the fast way to turn a search that found nothing into a new note: type the title you were looking for, press `Shift+⏎`, and start writing.

## Search your settings

:::tabs key:platform
== Desktop/Web

1. Press `Ctrl+,` (`⌘+,` on macOS), or open `{{settings}}` from the side menu.
2. Type into the `{{search}}` box at the top of the settings sidebar.

The search covers every section at once — section names, group headings, setting titles, their descriptions and their keywords — so you can find a setting without knowing which section it lives in. `{{noResultsFound}}` means nothing matched.

== Mobile

Settings on mobile has no search box. Open `{{settings}}` from the side menu and pick the section you need.

:::

## Filter notebooks and tags

The notebooks and tags lists have their own filter box, separate from note search.

:::tabs key:platform
== Desktop/Web

1. Open `{{notebooks}}` or `Tags` from the side menu.
2. Type into the `Filter notebooks...` or `Filter tags...` box at the bottom of the list.

== Mobile

1. Open `{{notebooks}}` or `Tags` in the side menu.
2. Type into the `Filter notebooks...` or `Filter tags...` box at the bottom of the list.

:::

Clearing the box restores the full list.

## Sort a list

Sorting is set per view, and separately for each individual notebook, tag and color — so you can keep one notebook alphabetical and everything else newest-first.

:::tabs key:platform
== Desktop/Web

1. Click the sort icon in the group header at the top of the list.
2. Open `{{orderBy}}` and choose the direction.
3. Open `{{sortBy}}` and choose the key.

== Mobile

1. Tap the sort icon in the group header at the top of the list.
2. Tap the direction button next to `{{sortBy}}` to flip between ascending and descending.
3. Tap a key under `{{sortBy}}`.

:::

There are seven sort keys. Which ones are offered depends on the list you're in:

| Sort by         | Available in                                                        |
| --------------- | ------------------------------------------------------------------- |
| `Date created`  | Everywhere except trash                                             |
| `Date edited`   | Everywhere except trash and tags — and, on mobile, except reminders |
| `Date modified` | Tags, and reminders on mobile                                       |
| `Date deleted`  | Trash                                                               |
| `Due date`      | Reminders                                                           |
| `{{title}}`     | Everywhere                                                          |
| `Relevance`     | Search results                                                      |

The direction labels change with the key: `{{aToZ}}` / `{{zToA}}` for `{{title}}`, `{{earliestFirst}}` / `{{latestFirst}}` for `Due date`, `{{mostRelevantFirst}}` / `{{leastRelevantFirst}}` for `Relevance`, and `{{oldestToNewest}}` / `{{newestToOldest}}` for the date keys.

## Group a list

Grouping splits the list into labelled sections. Six modes are available:

| `{{groupBy}}` | Result                                 |
| ------------- | -------------------------------------- |
| `{{default}}` | Today, Yesterday, This week, and so on |
| `{{none}}`    | One flat list, no headers              |
| `Abc`         | One section per first letter           |
| `Year`        | One section per year                   |
| `{{month}}`   | One section per month                  |
| `Week`        | One section per week                   |

:::tabs key:platform
== Desktop/Web

1. Click the sort icon in the group header.
2. Open `{{groupBy}}` and pick a mode.

Clicking the group header itself opens `{{jumpToGroup}}`, which scrolls the list straight to any section.

== Mobile

1. Tap the sort icon in the group header.
2. Scroll to `{{groupBy}}` and pick a mode.

Tapping the group title opens the jump-to-group list.

:::

Grouping isn't offered for reminders or for search results — those are always sorted, never grouped.

## Switch to compact mode

Compact mode drops each row to a single line: title, plus small icons for locked, favorite, read-only and expiring notes, and the time. It fits far more notes on screen.

:::tabs key:platform
== Desktop/Web

1. Click the view icon next to the sort icon in the group header.

It's available on the notes, favorites and notebooks lists, and it also collapses search results to their titles.

== Mobile

1. Tap the list-view icon next to the sort icon in the group header.

Notes, notebooks and search results each remember their own setting.

:::

## Related pages

- [Keyboard shortcuts](/keyboard-shortcuts) — the full list of shortcuts on desktop and web
- [Note links](/note-links-and-backlinks) — navigating between notes with internal links
- [Note actions](/notes/note-actions) — what you can do with a note once you've found it
- [Organize notes using notebooks](/organizing-notes/organize-notes-using-notebooks) — structure that makes search unnecessary
- [Organize notes using tags](/organizing-notes/organize-notes-using-tags) — filtering by tag instead of searching
- [Archive notes](/organizing-notes/archive-notes) — getting old notes out of your search results
