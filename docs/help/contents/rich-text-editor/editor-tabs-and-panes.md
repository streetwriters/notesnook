---
title: Tabs & panes
pageTitle: Editor tabs, split panes and focus mode in Notesnook
description: Open notes in editor tabs, pin them, split the editor with the table of contents, properties or a PDF preview, and use focus mode, zoom and word counts.
keywords:
  - notesnook editor tabs
  - notesnook focus mode
  - notesnook table of contents
  - notesnook word count
---

# Editor tabs and panes

The Notesnook editor keeps every note you open in a tab, so you can jump between notes without losing your place. Beside the editor you can open a table of contents, a note's properties or a PDF preview, and you can strip the app back to the writing surface alone with focus mode.

<!-- TODO: screenshot — the editor tab strip on desktop with three tabs, one pinned and one with unsaved changes -->

## Open a note in a new tab

:::tabs key:platform
== Desktop/Web

1. Right click a note in the list and choose `{{openInNewTab}}`. Middle-clicking the note does the same thing.
2. Or click the `{{newTab}}` button in the editor's top bar to open an empty tab, then start writing.

You can also drag a note from the list onto the tab strip to open it in a new tab, or drop it **onto an existing tab** to open it in that tab. Double-clicking the empty part of the tab strip opens a new tab.

In the desktop app there are keyboard shortcuts for all of this:

| Action               | Shortcut         |
| -------------------- | ---------------- |
| New tab              | `Ctrl+T`         |
| Close the active tab | `Ctrl+W`         |
| Close all tabs       | `Ctrl+Shift+W`   |
| Next tab             | `Ctrl+Tab`       |
| Previous tab         | `Ctrl+Shift+Tab` |

In the web app the browser owns most of those combinations, so only tab switching is bound: `Ctrl+Alt+→` for the next tab and `Ctrl+Alt+←` for the previous one. On macOS use `Command` wherever the table says `Ctrl`.

== Mobile

1. Open a note. It takes over the current tab.
2. To keep it and start another note, tap the **number badge** in the editor header — it shows how many tabs are open — and then tap `+` in the `Tabs` sheet.

Every open tab is listed in that sheet. Tap one to switch to it, tap the close icon to close it, or use the close-all button beside `+` to close everything at once.

To open a **specific note** in its own tab rather than a blank one, tap the ![Three dot button](/three-dot-button.png) button on that note and then the open-in-new icon at the top right of the properties sheet. See [note actions](/notes/note-actions) for the rest of that menu.

:::

## Manage tabs from the tab menu

:::tabs key:platform
== Desktop/Web
Right click any tab for its menu:

- `{{save}}` — only shown when that tab has unsaved changes
- `{{close}}`
- `{{closeOthers}}`
- `{{closeToRight}}`
- `{{closeToLeft}}`
- `{{closeAll}}`
- `{{revealInList}}` — scrolls the notes list to the note in this tab, and highlights it
- `{{pin}}`

::: info Pinned tabs survive every "close" command
`{{closeOthers}}`, `{{closeToRight}}`, `{{closeToLeft}}` and `{{closeAll}}` all skip pinned tabs. `{{revealInList}}` is unavailable while focus mode is on, because the notes list is hidden.

:::

Middle-clicking a tab closes it, and tabs can be dragged left and right to reorder them.

== Mobile

The `{{tabs}}` sheet gives you a pin button and a close button on each tab, plus a close-all button and `+` in its header. There is no equivalent of `Close others`, `Close to the right`, `Close to the left` or `Reveal in list` on mobile.

:::

## Pin a tab

Pinning keeps a note where you put it. A pinned tab:

- moves to the front of the tab strip and stays there;
- shows a pin icon in place of its close button, so it can't be closed by accident;
- is skipped by every bulk close command;
- never gets replaced — while a pinned tab is active, opening another note always opens a **new** tab.

:::tabs key:platform
== Desktop/Web
Right click the tab and choose `{{pin}}`. Click the pin icon on the tab to unpin it again.

== Mobile

Tap the number badge in the editor header, then tap the pin icon on the tab you want to pin. Tap it again to unpin.

:::

## Move back and forward inside a tab

Each tab remembers the notes you opened in it, exactly like browser history — useful when you follow a [note link](/note-links-and-backlinks) and want to get back.

:::tabs key:platform
== Desktop/Web
Use the back and forward arrows to the left of the tab strip. They're greyed out when there is nothing to go back or forward to.

== Mobile

Tap the `⋮` menu in the editor header. The back and forward arrows are in the row at the top of that menu.

:::

::: info
Back and forward are disabled in a pinned tab — a pinned tab is meant to stay on the note you pinned it to.

:::

## Split the editor with a side pane

:::tabs key:platform
== Desktop/Web
Three panes can open to the right of the editor:

- **Table of contents** — click the table-of-contents button in the top bar. It lists every heading in the note as a tree; click a heading to scroll to it, and use the chevrons to collapse a branch. If the note has no headings it says `{{noHeadingsFound}}`.
- **Properties** — click the `{{properties}}` button in the top bar for tags, notebooks, colors, reminders, attachments, `{{noteHistory}}` and note settings.
- **PDF preview** — opens by itself when you preview a PDF [attachment](/attachments-and-files) in the note, so you can read the PDF and write at the same time. See [reading a PDF](/attachments-and-files#read-a-pdf-without-downloading-it) for the pane's own toolbar.

Drag the divider between two panes to resize them; the widths are remembered for next time. The table of contents and the properties pane share the same space, so opening one closes the other.

== Mobile

There are no side panes on a phone. The same information is available as sheets from the `⋮` menu in the editor header:

- `{{toc}}` — listed only when the note actually has headings
- `{{properties}}`

Previewing a PDF attachment opens it in a full-screen viewer instead of a pane.

:::

## Write without distractions

:::tabs key:platform
== Desktop/Web
Click the sunglasses in the status bar at the bottom of the window. The side menu and the notes list disappear and only the editor is left. Click the glasses again to bring them back.

While focus mode is on, a second button appears next to it: `{{enterFullScreen}}`. That one hands the whole screen to Notesnook; `{{exitFullScreen}}` or the `Esc` key returns you to the window.

== Mobile

Phones have no focus mode — the editor is already full screen. On a tablet, where the editor sits beside the notes list, tap the expand icon in the editor header to make the editor full screen.

:::

## Change the editor width and text size

:::tabs key:platform
== Desktop/Web
The status bar at the bottom of the window holds both controls:

- `{{enableEditorMargins}}` / `{{disableEditorMargins}}` — switch between a comfortable centered column and using the full width of the pane.
- The `−` and `+` buttons zoom the editor text between **30%** and **500%** in steps of 10%. Click the percentage itself to reset it to 100%.

![The editor status bar at the bottom right, showing the word count and last saved time](/editor-status-bar-desktop.png)

== Mobile

Editor margins and zoom aren't available on mobile. Set your preferred text size instead in `{{settings}}` > `{{customization}}` > `{{editor}}`, as described in [personalizing the editor](/rich-text-editor/personalizing-rich-text-editor).

:::

## Check the word and character count

:::tabs key:platform
== Desktop/Web
The status bar always shows the total word count for the note, plus a count of the words in your selection when you have text selected.

Click that word count to open the full statistics popup:

- `{{words}}`
- `{{characters}}`
- `{{paragraphs}}`
- `{{spaces}}`

Each one shows the total, and how many are inside your current selection.

::: warning Very long notes stop saving automatically
Above **100,000 words** the status bar shows `{{autoSaveOff}}`. From then on the note is saved only when you ask it to — press `Ctrl+S`, or click the save indicator at the right of the status bar (`{{clickToSave}}`). The same indicator tells you whether the current note is saved.
Even when autosave is off, notes are still saved when you switch away from the current editor tab.

== Mobile

Word statistics are shown at the top left of the editor. Tapping the count flips the view to the current character count.

:::

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every formatting tool and how to customize the toolbar
- [Headings](/rich-text-editor/headings-and-collapsible-sections) — what feeds the table of contents, and how to collapse a section
- [Find & replace](/rich-text-editor/search-and-replace) — searching inside the note that's open in a tab
- [Personalizing the editor](/rich-text-editor/personalizing-rich-text-editor) — fonts, spacing and title formats
- [Keyboard shortcuts](/keyboard-shortcuts) — the full list for desktop and web
