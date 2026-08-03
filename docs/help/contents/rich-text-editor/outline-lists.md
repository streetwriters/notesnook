---
title: Outline lists
pageTitle: How do I make a collapsible outline list in Notesnook?
description: Build collapsible, nested outlines inside a note in Notesnook — fold whole branches away, nest with Tab, and keep long structures readable.
keywords:
  - notesnook outline list
  - collapsible list notes app
  - nested outline notes
schema: howto
---

# Outline lists <PlanTag plan="essential" />

An outline list is a nested list whose items **fold**. Any item with children gets a collapse arrow, so a hundred-line outline can sit in a note as five visible lines until you open the branch you need.

That is the whole difference from a normal bullet list: a bullet list nests too, but everything in it is always visible. An outline list hides and shows branches, which makes it the better choice for meeting structures, project breakdowns, book outlines and anything else you scroll past more often than you read.

## Create an outline list

:::tabs key:platform
== Desktop/Web

1. Place the cursor on an empty line, or select the lines you want to convert.
2. Click the `+` (Insert) button in the toolbar.
3. Choose `{{outlineList}}`.

`Ctrl+Shift+O` (`⌘+Shift+O` on macOS) does the same thing, and toggles the list back to plain paragraphs if you press it inside one.

== Mobile

1. Place the cursor on an empty line, or select the lines you want to convert.
2. Tap the `+` (Insert) button in the bottom toolbar.
3. Choose `{{outlineList}}` from the `{{chooseBlockToInsert}}` sheet.

:::

Press `Enter` to start the next item, exactly as in any other list.

![The insert block menu in the Notesnook editor, with Outline list near the top](/screenshots/editor-insert-block-menu.png)

### Type `-o` instead

On an empty line, type `-o` followed by a space and the line becomes the first item of an outline list.

::: info Markdown shortcuts need to be enabled
`-o ` is a [Markdown shortcut.](/rich-text-editor/markdown-notes-editing) Markdown shortcuts are **off by default on web and desktop**: turn on `{{mardownShortcuts}}` in `{{settings}}` → `{{customization}}` → `{{editor}}`. On mobile they are on by default. The toolbar button and `Ctrl+Shift+O` do not depend on that setting.

:::

## Nest an item under another

:::tabs key:platform
== Desktop/Web

1. Put the cursor in the item you want to move in.
2. Press `Tab` to nest it under the item above.
3. Press `Shift+Tab` to move it back out one level.

== Mobile

1. Tap into the item you want to move in.
2. Tap `{{indent}}` in the bottom toolbar to nest it one level deeper.
3. Tap `{{outdent}}` to move it back out.

These two buttons only appear while the cursor is inside a list item.

:::

As soon as an item has something nested under it, it becomes a parent and grows a collapse arrow.

## Collapse and expand a branch

:::tabs key:platform
== Desktop/Web

1. Click the arrow in the margin to the left of a parent item — or put the cursor anywhere in that item and press `Ctrl+Space` (`⌘+Space` on macOS).
2. Everything nested under it folds away; the item itself stays visible.

Repeat to expand it again.

== Mobile

1. Tap the arrow in the margin to the left of a parent item.
2. Everything nested under it folds away.

Tap the arrow again to expand.

:::

Items with no children have nothing to fold, so no arrow appears on them. The collapsed state is saved with the note, so a branch you folded is still folded next time you open the note, on any device.

<!-- TODO: screenshot — an outline list with one branch collapsed -->

::: tip `⌘+Space` on macOS
macOS assigns `⌘+Space` to Spotlight by default. If nothing happens when you press it in the editor, use the collapse arrow instead, or rebind Spotlight in `System Settings` → `Keyboard` → `Keyboard Shortcuts`.

:::

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every block you can insert into a note
- [Tasks and todo lists](/rich-text-editor/task-and-todo-lists) — checkable to-do blocks, also nestable
- [Callouts](/rich-text-editor/callouts) — the other collapsible block in the editor
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — the full shortcut list and how to switch it on
- [Plans & limits](/plans-and-limits) — what Essential unlocks, and everything else
