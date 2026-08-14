---
title: Callouts
pageTitle: How do I add a callout box to a note in Notesnook?
description: Add colored, collapsible callout boxes — info, tip, warning, error, quote and more — to any note in Notesnook, from the toolbar or with a markdown shortcut.
keywords:
  - notesnook callout
  - admonition notes app
  - info box in notes
schema: howto
---

# Callouts <PlanTag plan="essential" />

A callout is a colored, titled box that pulls one part of a note out of the flow — a warning, a tip, a definition you keep forgetting. Each callout has a heading you can rename and a body that can hold paragraphs, lists, code and other blocks, and it can be collapsed down to its title alone.

Callouts are part of the [Essential plan and above](/plans-and-limits).

## Insert a callout

:::tabs key:platform
== Desktop/Web

1. Place the cursor where you want the callout, or select the text you want to put inside it.
2. Click the `+` (Insert) button in the toolbar.
3. Hover `{{callout}}` in the menu.
4. Pick a type from the submenu.

== Mobile

1. Place the cursor where you want the callout, or select the text you want to put inside it.
2. Tap the `+` (Insert) button in the bottom toolbar.
3. Tap `{{callout}}` in the `{{chooseBlockToInsert}}` sheet.
4. Pick a type from the list.

:::

The new callout is titled with the type name in capitals — `INFO`, `WARN` — and the cursor lands in that title so you can type a real one straight away. If you had text selected, that text becomes the callout's body.

![The insert block menu in the Notesnook editor; Callout opens a submenu of callout types](/screenshots/editor-insert-block-menu.png)

### The eight types in the menu

| Type        | Use it for                                   |
| ----------- | -------------------------------------------- |
| `Abstract`  | a summary at the top of a long note          |
| `Hint`      | an aside that helps but isn't required       |
| `Info`      | neutral context                              |
| `Success`   | something that worked, or a confirmed result |
| `Warn`      | something that can go wrong                  |
| `{{error}}` | something that failed or must not be done    |
| `Example`   | a worked example                             |
| `{{quote}}` | a quotation or citation                      |

## Write a callout with a markdown shortcut <PlanTag plan="essential" />

On an empty line, type `>` immediately followed by the callout type — no space — then press `Enter`:

```
>warning
```

To give it a title in the same step, add the title after the type:

```
>warning Back up before you upgrade
```

The first form titles the callout `WARNING`; the second titles it `Back up before you upgrade`. Either way the cursor ends up in the body, ready for content.

::: info Markdown shortcuts need Essential too
This is a [Markdown shortcut](/rich-text-editor/markdown-notes-editing), so it needs the same [Essential plan](/plans-and-limits) as callouts themselves, plus the setting switched on. Markdown shortcuts are **off by default on web and desktop** — turn on `{{mardownShortcuts}}` in `{{settings}}` → `{{customization}}` → `{{editor}}`. On mobile they are on by default. Typing `>` followed by a _space_ still makes a plain blockquote, on any plan.

:::

### Types the shortcut accepts

The shortcut understands far more type names than the menu offers — many of them aliases that map onto the same styling, so you can write whichever word comes naturally:

`note`, `abstract`, `summary`, `tldr`, `info`, `todo`, `tip`, `hint`, `important`, `success`, `check`, `done`, `question`, `help`, `faq`, `warning`, `warn`, `caution`, `attention`, `failure`, `fail`, `missing`, `danger`, `error`, `bug`, `example`, `quote`, `cite`

So `>tldr`, `>faq`, `>caution` and `>bug` all work even though none of them appear in the insert menu.

## Collapse and expand a callout

Callouts fold away to a single title line, which is useful for long asides you only need occasionally.

:::tabs key:platform
== Desktop/Web

1. Move the pointer to the right-hand end of the callout's title row.
2. Click the collapse control there.

Click it again to expand. The collapsed state is saved with the note content, so a callout you collapsed is still collapsed the next time you open the note, on any device.

== Mobile

1. Tap the right-hand end of the callout's title row.

Tap again to expand.

:::

<!-- TODO: screenshot — a collapsed callout showing only its title -->

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every block you can insert into a note
- [Outline lists](/rich-text-editor/outline-lists) — the other collapsible block in the editor
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — the full shortcut list and how to switch it on
- [Tasks and todo lists](/rich-text-editor/task-and-todo-lists) — checkable to-do blocks inside a note
- [Plans & limits](/plans-and-limits) — what Essential unlocks, and everything else
