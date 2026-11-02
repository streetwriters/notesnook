---
title: Headings
pageTitle: Headings and collapsible sections in the Notesnook editor
description: Apply headings 1 to 6 from the toolbar or with Ctrl+Alt+1..6, go back to a paragraph, and collapse everything under a heading to fold a long note.
keywords:
  - notesnook headings
  - collapsible headings notes
  - fold sections in a note
---

# Headings and collapsible sections

Headings give a note its structure. Notesnook supports six levels, each one available from the toolbar, from a keyboard shortcut, or by typing `#` characters. Every heading also acts as a fold: click the chevron beside it and everything underneath collapses out of the way.

<!-- TODO: screenshot — a note with a collapsed Heading 2 showing the rotated chevron -->

## Apply a heading

:::tabs key:platform
== Desktop/Web

1. Put the cursor on the line you want to turn into a heading, or select several lines.
2. Open the `{{headings}}` dropdown in the toolbar — it shows the current block, either `{{paragraph}}` or `Heading 1` to `Heading 6`.
3. Choose the level you want.

Or skip the toolbar entirely:

| Block               | Shortcut     |
| ------------------- | ------------ |
| Heading 1           | `Ctrl+Alt+1` |
| Heading 2           | `Ctrl+Alt+2` |
| Heading 3           | `Ctrl+Alt+3` |
| Heading 4           | `Ctrl+Alt+4` |
| Heading 5           | `Ctrl+Alt+5` |
| Heading 6           | `Ctrl+Alt+6` |
| Back to a paragraph | `Ctrl+Alt+0` |

On macOS use `Command+Option` in place of `Ctrl+Alt`.

== Mobile

1. Tap the line you want to turn into a heading.
2. Open the `{{headings}}` dropdown in the toolbar at the bottom of the screen. On mobile the levels are labelled `H1` to `H6`.
3. Tap a level to apply it, or `{{paragraph}}` to turn a heading back into ordinary text.

:::

Applying a heading keeps the line's alignment and text direction, and clears any custom font size on the selection so the heading uses its own size.

::: info Headings are unavailable inside a code block
The `{{headings}}` dropdown is disabled while the cursor is inside a [code block](/rich-text-editor/code-blocks), where `#` is an ordinary character.

:::

## Type a heading with Markdown <PlanTag plan="essential" />

With [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) turned on, type one to six `#` characters followed by a space at the start of a line and it becomes a heading of that level — `# ` for Heading 1, `###### ` for Heading 6. Markdown shortcuts need the [Essential plan or higher](/plans-and-limits), and on desktop and web they're switched off until you turn them on in `{{settings}}` > `{{customization}}` > `{{editor}}`.

The toolbar dropdown and the keyboard shortcuts work on every plan.

## Collapse everything under a heading

Every heading with text in it has a chevron at the end of the line.

:::tabs key:platform
== Desktop/Web

1. Hover over the heading — the chevron fades in immediately after the last word.
2. Click it. Everything below the heading is hidden and the chevron rotates to point right.
3. Click it again to unfold the section.

== Mobile

1. The chevron is always visible at the end of a heading line.
2. Tap it to collapse the section, tap it again to expand it.

:::

A collapsed heading hides everything after it **until the next heading of the same or a higher level**. So collapsing a `Heading 2` folds away the paragraphs, lists and any `Heading 3` blocks that belong to it, and stops at the next `Heading 2` or `Heading 1`.

These block types are hidden when a section is collapsed:

- paragraphs and headings
- bullet lists, numbered lists, check lists, [task lists](/rich-text-editor/task-and-todo-lists) and [outline lists](/rich-text-editor/outline-lists)
- [tables](/rich-text-editor/tables), [code blocks](/rich-text-editor/code-blocks), math blocks and [callouts](/rich-text-editor/callouts)
- quotes, horizontal rules, images, embeds and web clips

Nested folds are remembered: if a `Heading 3` was already collapsed inside a section, expanding the parent heading leaves that inner section folded.

::: info The fold is stored in the note
Collapsing a section is a change to the note's content, so the fold state is saved and syncs to your other devices. It doesn't delete or move anything — expanding the heading brings everything back exactly as it was.

:::

## Keep writing after a collapsed section

Pressing `Enter` at the **end of a collapsed heading's text** doesn't push a new line into the hidden content. Notesnook adds a new paragraph _after_ the whole collapsed section and puts the cursor there, so you can carry on writing beneath a folded chapter without unfolding it first.

Pressing `Enter` anywhere else in the heading behaves normally.

## Navigate a long note

Headings are what the table of contents is built from.

:::tabs key:platform
== Desktop/Web
Click the table-of-contents button in the editor's top bar. The pane opens beside the note, lists every heading as a tree, follows along as you scroll, and jumps to a heading when you click it. A note with no headings shows `{{noHeadingsFound}}`.

== Mobile

Tap the `⋮` menu in the editor header and choose `Table of contents`. The entry only appears when the note actually has headings. `{{scrollToTop}}` and `{{scrollToBottom}}` in the same menu move you through the note quickly.

:::

[Find & replace](/rich-text-editor/search-and-replace) also expands collapsed headings automatically when a match is hidden inside one.

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every formatting tool and how to customize the toolbar
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — the full list of shortcuts, including `#` headings
- [Tabs & panes](/rich-text-editor/editor-tabs-and-panes) — the table of contents pane and focus mode
- [Find & replace](/rich-text-editor/search-and-replace) — searching inside a note, including folded sections
- [Plans & limits](/plans-and-limits) — what Essential, Pro and Believer unlock
