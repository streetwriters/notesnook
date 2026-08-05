---
title: Math & formulas
pageTitle: How do I write math formulas in Notesnook?
description: Write LaTeX math in Notesnook — inline expressions inside a sentence, centered math blocks, and chemistry equations with mhchem, rendered by KaTeX.
keywords:
  - notesnook latex
  - notes app with math support
  - katex notes
  - write equations in notes
schema: howto
---

# Math & formulas

Notesnook renders LaTeX math with [KaTeX](https://katex.org/), so you can write `\frac{a}{b}` in a note and see a real fraction. There are two kinds: **inline math**, which sits inside a line of text, and a **math block**, which is centered on its own line in display mode.

## Insert inline math

Inline math flows with the sentence around it, the way `$E = mc^2$` would in a paper.

:::tabs key:platform
== Desktop/Web

1. Put the cursor where the formula should go.
2. Click the `{{more}}` button in the first toolbar group (the one holding `{{bold}}`, `{{italic}}` and `{{underline}}`) and choose `{{mathInline}}`.
3. Type the LaTeX into the editor that opens under the formula.
4. Click anywhere outside it to render.

There is no keyboard shortcut for inline math. With [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) on, typing `$$2 + 2 = 4$$` converts to inline math as soon as you close the second pair of dollar signs.

== Mobile

1. Put the cursor where the formula should go.
2. Tap the `{{more}}` button in the bottom toolbar's first group (`{{bold}}`, `{{italic}}`, `{{underline}}`) and tap `{{mathInline}}`.
3. Type the LaTeX into the editor that opens under the formula.
4. Tap outside it to render.

:::

The `{{mathInline}}` button is disabled while the cursor is inside a [code block](/rich-text-editor/code-blocks).

![The editor toolbar overflow menu, with the fx Math (inline) tool at the end of the row](/screenshots/editor-toolbar-more-menu.png)

## Insert a math block

A math block is rendered in display mode — centered, on its own line, with full-size operators.

:::tabs key:platform
== Desktop/Web

1. Place the cursor on an empty line.
2. Click the `+` (Insert) button in the toolbar.
3. Choose `{{mathAndFormulas}}`.
4. Type the LaTeX and click outside the block.

`Ctrl+Shift+M` (`⌘+Shift+M` on macOS) inserts a math block from anywhere in the note.

== Mobile

1. Place the cursor on an empty line.
2. Tap the `+` (Insert) button in the bottom toolbar.
3. Choose `{{mathAndFormulas}}` from the `{{chooseBlockToInsert}}` sheet.
4. Type the LaTeX and tap outside the block.

:::

With Markdown shortcuts on, typing `$$$` followed by a space also creates a math block.

::: info Markdown shortcuts need Essential
The `$$…$$` and `$$$` shortcuts are [Markdown shortcuts](/rich-text-editor/markdown-notes-editing), part of the [Essential plan and above](/plans-and-limits), and they are **off by default on web and desktop** — switch on `{{mardownShortcuts}}` in `{{settings}}` → `{{customization}}` → `{{editor}}`. They are on by default on mobile. The toolbar buttons and `Ctrl+Shift+M` work on every plan.

:::

## Edit a formula you already wrote

Click (or tap) a rendered formula. It expands to show its LaTeX source in a small editor in place, with the rendered result above it. Change the source, then click outside the formula — or move the cursor away — and it re-renders immediately.

An empty formula renders as an empty placeholder rather than disappearing, so you can always find it again.

## Write chemistry equations

The mhchem extension is loaded alongside KaTeX, so `\ce{...}` notation works out of the box:

```
\ce{2H2 + O2 -> 2H2O}
\ce{SO4^2- + Ba^2+ -> BaSO4 v}
```

## What happens when the LaTeX is invalid

Notesnook never throws away your input over a typo. KaTeX renders unrecognized commands in red inside the formula and leaves everything it _could_ parse rendered normally, so a stray `\frac{1}` shows you exactly where the problem is. The raw LaTeX you typed is untouched — click the formula and fix it.

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every tool and block available in a note
- [Code blocks](/rich-text-editor/code-blocks) — syntax-highlighted code, with 297 languages
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — the full shortcut list and how to enable it
- [Plans & limits](/plans-and-limits) — which editor features need a paid plan
- [Personalizing the editor](/rich-text-editor/personalizing-rich-text-editor) — fonts and title formats
