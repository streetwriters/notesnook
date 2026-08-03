---
title: Find & replace
pageTitle: Find and replace text inside a note in Notesnook
description: Search inside the note you're editing with Ctrl+F, match case, whole words or a regular expression, and replace one match or all of them at once.
keywords:
  - notesnook find and replace
  - search inside a note
  - notesnook regex search
schema: howto
---

# How do I find and replace text in a note?

Press `Ctrl+F` while the editor is focused to search the note you're writing, or `Ctrl+Alt+F` to open the same box with a replace field. On macOS use `Command` instead of `Ctrl`. This searches **inside the open note only** — to search across every note, see [searching and navigating](/search-and-navigation).

<!-- TODO: screenshot — the find and replace popup open over a note, with the match counter visible -->

## Find text in the note

:::tabs key:platform
== Desktop/Web

1. Click into the note, then press `Ctrl+F`. You can also click the search button in the editor's top bar.
2. Type what you're looking for. Matches are highlighted as you type and the counter beside the field shows which match you're on, for example `3/12`.
3. Press `Enter` for the next match, `Shift+Enter` for the previous one — or use the `{{nextMatch}}` and `{{previousMatch}}` buttons.
4. Press `Escape`, or click `{{close}}`, when you're done.

::: tip Start from a selection
If you select some text before pressing `Ctrl+F`, that text is put into the search field for you.

:::

== Mobile

1. Tap the `⋮` menu in the editor header.
2. Tap the magnifying glass in the row at the top of the menu.
3. The find box opens as a sheet at the bottom of the screen. Type your search term; matches are highlighted and counted the same way.
4. Use `{{nextMatch}}` and `{{previousMatch}}` to step through the results, and `{{close}}` to dismiss the sheet.

:::

Notesnook scrolls to each match as you move through them, and reveals matches that are hidden inside a [collapsed heading](/rich-text-editor/headings-and-collapsible-sections), a collapsed [callout](/rich-text-editor/callouts) or a collapsed [outline list](/rich-text-editor/outline-lists) item.

## Narrow the search with match case, whole word or regex

The three matching options are folded away until you ask for them.

1. Click the `{{expand}}` chevron inside the search field.
2. Turn on any combination of:
   - `{{matchCase}}` — `{{note}}` no longer matches `note`.
   - `{{matchWholeWord}}` — `cat` matches `cat` but not `catalogue`.
   - `{{enableRegex}}` — your search term is treated as a regular expression instead of literal text.
3. The result count updates immediately.

::: info About regular expressions
With `{{enableRegex}}` off, regular expression characters are escaped so the term is matched literally. With it on, the term is compiled as a JavaScript regular expression with the `g`, `u` and `m` flags, so patterns like `\d+` or `^Chapter` work and `^`/`$` anchor to each line. `.` does not match across line breaks. An expression that doesn't compile returns no matches.

:::

## Replace one match or all of them

:::tabs key:platform
== Desktop/Web

1. Press `Ctrl+Alt+F`, or press `Ctrl+F` and then click `{{toggleReplace}}`.
2. Type the search term in the first field and the replacement in the second.
3. Click `{{replace}}` to replace the match you're on — Notesnook then jumps to the next match, so you can work through the note by clicking `{{replace}}` repeatedly.
4. Click `{{replaceAll}}` to replace every match in the note in one step.

== Mobile

1. Tap the `⋮` menu, then the magnifying glass.
2. In the sheet, tap `{{toggleReplace}}` to reveal the replacement field.
3. Use `{{replace}}` for the current match, or `{{replaceAll}}` for every match in the note.

:::

::: warning Replace all cannot be undone from the search box
`{{replaceAll}}` rewrites every match at once. If it wasn't what you wanted, close the search box and press `Ctrl+Z` (`Command+Z`) in the editor to undo, or restore an earlier version from [note history](/note-version-history).

:::

## Why is there no replace field on this note?

`{{toggleReplace}}`, `{{replace}}` and `{{replaceAll}}` only appear when the note can be edited. On a note in read-only mode you still get the full find experience — searching, match counting, and the matching options — but nothing can be rewritten until you turn read-only off.

## Find & replace versus searching all your notes

| You want to…                           | Use                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Find a word in the note you're editing | `Ctrl+F` **inside** the editor                                            |
| Find notes by their content or title   | `Ctrl+F` outside the editor, which opens [search](/search-and-navigation) |
| Jump to a heading in a long note       | The [table of contents pane](/rich-text-editor/editor-tabs-and-panes)     |

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every formatting tool and how to customize the toolbar
- [Searching and navigating](/search-and-navigation) — finding notes across your whole account
- [Tabs & panes](/rich-text-editor/editor-tabs-and-panes) — the editor top bar, side panes and focus mode
- [Headings](/rich-text-editor/headings-and-collapsible-sections) — collapsing sections, and how search reveals them
- [Keyboard shortcuts](/keyboard-shortcuts) — the full list for desktop and web
