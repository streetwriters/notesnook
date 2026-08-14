---
title: Code blocks
pageTitle: How do I add a code block to a note in Notesnook?
description: Insert syntax-highlighted code blocks in Notesnook, pick from 297 languages, switch between spaces and tabs, and copy the whole block in one click.
keywords:
  - notesnook code block
  - syntax highlighting notes app
  - notes app for code snippets
schema: howto
---

# Code blocks

A code block keeps code as code: monospaced, syntax highlighted, indentation preserved, and never touched by spellcheck or autocorrect. Insert one from the toolbar's `+` button, with `Ctrl+Shift+C`, or by typing ` ``` ` on an empty line.

## Insert a code block

:::tabs key:platform
== Desktop/Web

1. Place the cursor on an empty line.
2. Click the `+` (Insert) button in the toolbar.
3. Choose `Code block`.

You can also press `Ctrl+Shift+C` (`⌘+Shift+C` on macOS). If you press it with text selected, the selected text becomes the code block's contents, line breaks and all. Pressing it again while the cursor is inside a code block turns the block back into normal paragraphs.

== Mobile

1. Place the cursor on an empty line.
2. Tap the `+` (Insert) button in the bottom toolbar.
3. Choose `Code block` from the `Choose a block to insert` sheet.

:::

![The insert block menu in the Notesnook editor, with Code block listed alongside Task list, Outline list, Math & formulas and Callout](/screenshots/editor-insert-block-menu.png)

### Type ` ``` ` instead <PlanTag plan="essential"/>

On an empty line, type three backticks followed by a space or Enter — ` ``` ` — and the line becomes a code block. Add a language name straight after the backticks to set the language at the same time: ` ```javascript `. The name has to be plain lowercase letters, so ` ```c++ ` and ` ```objective-c ` won't trigger it — pick those from the language menu instead. Three tildes (`~~~`) work the same way.

::: info Markdown shortcuts need to be enabled.
Typing ` ``` ` relies on [Markdown shortcuts.](/rich-text-editor/markdown-notes-editing) They are **off by default on web and desktop** — turn on `{{mardownShortcuts}}` in `{{settings}}` → `{{customization}}` → `{{editor}}` first. On mobile they are on by default. The toolbar button and `Ctrl+Shift+C` work on every plan.

:::

## Choose the language

![A code block in the Notesnook editor showing the footer bar with the caret position, indentation mode, language and copy button](/screenshots/editor-code-block.png)

Every code block has a language button in the bar along its bottom edge showing the current language. The default is `Plaintext` until you change the language once.

:::tabs key:platform
== Desktop/Web

1. Click the language name at the bottom of the code block.
2. Type in the `{{searchLanguages}}` box to filter the list — it matches both language names and their aliases (searching `js` finds JavaScript).
3. Click the language you want, or press `Enter` to take the first result.

== Mobile

1. Tap the language name at the bottom of the code block.
2. In the `{{selectLanguage}}` sheet, type in `{{searchLanguages}}` to filter the list.
3. Tap the language you want.

:::

There are **297 languages** to choose from, each highlighted with its own grammar.

::: tip The last language becomes the default
The language you pick is remembered on that device and used for every code block you create afterwards, so you only have to set your usual language once.

:::

<!-- TODO: screenshot — the language picker with the search languages field -->

## Read the line and column indicator

The bar along the bottom of a code block shows `Line 1, Column 1` for wherever the cursor is. When you select code, the count of selected characters is appended — `Line 4, Column 12 (37 selected)`.

## Switch between spaces and tabs

Next to the line indicator is a button reading `Spaces: 2` or `Tabs: 2` — this is the `{{toggleIndentationMode}}` control.

1. Click (or tap) the `{{spaces}}` / `{{tabs}}` button.
2. Every indented line in that block is rewritten to use the other character.

The setting is per code block, so one block can use tabs while another uses spaces. Inside a block, `Tab` inserts one indent level at the cursor, or indents every line when you have several selected, and `Shift+Tab` removes one level from the start of each selected line.

## Copy a code block

Once a code block has content, a `{{copy}}` button appears in its bottom bar. Click it and the label changes to `{{copied}}` for a second. It copies the code only — no surrounding note text.

## Paste code from VS Code or GitHub

Paste code copied out of VS Code or from a GitHub file view and Notesnook creates a code block for it automatically, using the language the source reported. Indentation is normalized to the block's own indentation settings, and carriage returns are stripped.

Short single-line snippets are treated as [inline code](/rich-text-editor/rich-text-editor-toolbar) instead of a full block. Pasting into an existing code block always inserts plain text, so highlighting stays intact.

::: tip Leaving a code block
Press `Enter` three times at the end of a block, or press the down arrow at the very bottom of the last block in a note, and the cursor moves out into a new paragraph. `Ctrl+A` inside a code block selects that block's code rather than the whole note.

:::

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every block you can insert into a note
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — the full list of shortcuts, and how to switch them on
- [Math & formulas](/rich-text-editor/math-and-formulas) — LaTeX expressions inline and as blocks
- [Personalizing the editor](/rich-text-editor/personalizing-rich-text-editor) — change the fonts the editor uses
- [Plans & limits](/plans-and-limits) — which editor features need a paid plan
- [Keyboard shortcuts](/keyboard-shortcuts) — the complete shortcut reference
