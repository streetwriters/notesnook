---
title: Markdown shortcuts
pageTitle: Markdown shortcuts in the Notesnook editor
description: Format notes as you type with Markdown shortcuts in Notesnook — headings, bold, lists, code blocks, tables and math, on desktop, web and mobile.
keywords:
  - notesnook markdown
  - markdown shortcuts notes app
  - markdown note taking
schema: faq
faqs:
  - q: Does Notesnook support Markdown editing?
    a: Not as a raw editing mode. The Markdown shortcuts convert what you type into rich text blocks as you go, but the note itself is not stored or edited as raw Markdown.
  - q: Can I import and export Markdown files in Notesnook?
    a: Yes. You can import Markdown files and export any note as Markdown, with or without frontmatter.
---

# Markdown shortcuts in notes <PlanTag plan="essential" />

Markdown shortcuts turn what you type into formatting. Type `# ` for a heading, `**bold**` for bold text, `- ` for a bullet list, and Notesnook applies the formatting the moment you finish the pattern — you never have to reach for the toolbar.

![Typing markdown in the editor and watching it turn into formatting](/markdown-editing.gif)

## Turn Markdown shortcuts on

Markdown shortcuts are part of the [Essential plan and above](/plans-and-limits), and on the **web and desktop apps they are switched off until you turn them on**. On mobile they are on by default.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{customization}}` > `{{editor}}`.
3. Turn on `{{mardownShortcuts}}`.

== Mobile

1. Go to `{{settings}}`.
2. Open `{{customization}}` > `{{editor}}`.
3. Make sure `{{mardownShortcuts}}` is on.

:::

::: warning Nothing formats as you type until this is on
While Markdown shortcuts are off, **every** shortcut in the table below stops working — `#` headings, `**bold**`, list markers, code fences and math included. The toolbar and the keyboard shortcuts keep working either way.

:::

## Available shortcuts

Notesnook supports the following (Markdown) shortcuts in the editor:

| Block                             | Markdown shortcut                                               |
| --------------------------------- | --------------------------------------------------------------- |
| Heading 1                         | #                                                               |
| Heading 2                         | ##                                                              |
| Heading 3                         | ###                                                             |
| Heading 4                         | ####                                                            |
| Heading 5                         | #####                                                           |
| Heading 6                         | ######                                                          |
| Bold                              | \*\*bold text\*\*                                               |
| Italic                            | \_italicized text\_                                             |
| Strikethrough                     | \~\~strikethrough\~\~                                           |
| Blockquote                        | > blockquote                                                    |
| Ordered list                      | 1. First item<br>2. Second item<br>3. Third item                |
| Unordered list                    | - First item<br>- Second item<br>- Third item                   |
| Task list                         | \[x] Write the note<br>[ ] Update the help<br>[ ] Call the team |
| Outline list                      | -o Write the note<br>-o Update the help<br>-o Call the team     |
| Inline code                       | \`inline code\`                                                 |
| Inline Math                       | \$\$2 + 2 = 4\$\$                                               |
| Horizontal rule                   | ---                                                             |
| Link                              | \[title](https://www.example.com)                               |
| Codeblock                         | \`\`\`javascript<br>function hello() { }<br>\`\`\`              |
| Math block                        | $$$ followed by a space                                         |
| Current Date                      | `/date`                                                         |
| Current Day                       | `/day`                                                          |
| Current Time                      | `/time`                                                         |
| Current Date & Time               | `/now`                                                          |
| Current Date & Time with timezone | `/nowz`                                                         |
| Callout                           | \>info Heads up<br>\>warn Careful<br>\>tip Try this             |

## Checklists and task lists share one shortcut

`[] ` behaves differently depending on where you type it:

- inside an existing bullet list, it turns those bullets into a **simple checklist**;
- on an empty line, it creates a full [task list](/rich-text-editor/task-and-todo-lists) with a title, a progress counter and sorting.

Task lists, [outline lists](/rich-text-editor/outline-lists) and [callouts](/rich-text-editor/callouts) all need the [Essential plan or higher](/plans-and-limits).

## FAQs

### Does Notesnook support Markdown editing?

No. The Markdown shortcuts listed above are exactly that: shortcuts. They'll help you to quickly use the various formats & blocks in the editor but they aren't raw Markdown.

### Can I import and export Markdown files?

Yes. You can [import Markdown files](/importing-notes/import-notes-from-markdown-files) and [export any note as Markdown](/export-notes-from-notesnook), with or without frontmatter.

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every formatting tool and how to customize the toolbar
- [Code blocks](/rich-text-editor/code-blocks) — syntax highlighting for 297 languages
- [Math & formulas](/rich-text-editor/math-and-formulas) — writing LaTeX in a note
- [Personalizing the editor](/rich-text-editor/personalizing-rich-text-editor) — fonts, spacing and title formats
- [Plans & limits](/plans-and-limits) — what Essential, Pro and Believer unlock
