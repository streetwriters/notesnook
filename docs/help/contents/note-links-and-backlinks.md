---
title: Note links
pageTitle: How to link one note to another in Notesnook
description: Link a note to another note in Notesnook, link to a specific paragraph inside it, and see every note that links back to yours in Linked notes and Referenced in.
keywords:
  - notesnook note links
  - notesnook backlinks
  - link notes together
  - bi-directional note link
schema: howto
---

# How do I link one note to another?

Put the cursor where you want the link, press `Ctrl+Shift+K` (`⌘+Shift+K` on macOS), pick the note you want, and Notesnook inserts a link to it. The link works in both directions: the note you linked to lists your note under `{{referencedIn}}`, so you never have to maintain a back-link by hand.

Note links are internal links. They use the `nn://` scheme instead of `http://`, they never leave your device unencrypted, and they keep working after you rename or move a note because they point at the note's internal ID, not its title.

## Link a note to another note

:::tabs key:platform
== Desktop/Web

1. Open the note and place the cursor where the link should go. Selecting some text first turns that text into the link.
2. Press `Ctrl+Shift+K`, or click `{{noteLink}}` in the editor toolbar — it sits next to `{{link}}`.
3. In the `{{newInternalLink}}` dialog, use the `{{searchNoteToLinkPlaceholder}}` box to find the note.
4. Click the note to select it.
5. Click `{{insertLink}}`.

== Mobile

1. Open the note and place the cursor where the link should go.
2. Tap `{{noteLink}}` in the editor toolbar.
3. Use the `{{searchNoteToLinkPlaceholder}}` box to find the note.
4. Tap the note to select it.
5. Tap `{{createLink}}`.

:::

The link appears as the note's title (or as the text you had selected). Tapping or clicking it opens that note.

## Link to a specific section inside a note <PlanTag plan="essential" />

Every block in a note — paragraph, heading, list, table, callout, code block, image, math block, web clip or embed — carries its own ID, so a link can point at one specific block rather than the top of the note. Opening the link scrolls straight to that block.

Block-level note links are part of the [Essential plan and above](/plans-and-limits). On the free plan you can still link to whole notes.

:::tabs key:platform
== Desktop/Web

1. Press `Ctrl+Shift+K` and select the note, as above.
2. The dialog now lists every block in that note, each tagged with its block type.
3. Use the search box to narrow the list. Type `#` first to search headings only — the placeholder reads `Type # to search for headings`.
4. Click the block you want. The link is inserted immediately, without pressing `{{insertLink}}`.

To pick a different note, click the `{{linkNoteSelectedNote}}` button at the top of the dialog to deselect it.

== Mobile

1. Tap `{{noteLink}}` and select the note, as above.
2. Under `{{linkNoteToSection}}` the sheet lists every block in that note, each tagged with its block type.
3. Use the search box to narrow the list. Type `#` first to search headings only.
4. Tap the block you want. The link is created immediately.

To pick a different note, tap the selected note at the top of the sheet to deselect it.

:::

Blocks with no text show as `{{linkNoteEmptyBlock}}`. If the note you picked is empty you'll see `{{noBlocksOnNote}}`

::: info Locked notes
A note in your [private vault](/lock-notes-with-private-vault) can be linked to as a whole, but not block by block — its content is encrypted, so Notesnook can't list its blocks. The dialog says `Linking to a specific block is not available for locked notes.`

:::

## See which notes link to this one

Every note keeps two lists:

- **`{{linkedNotes}}`** — notes that this note links _out_ to.
- **`{{referencedIn}}`** — notes that link _in_ to this note. These are your backlinks, and they're built automatically.

:::tabs key:platform
== Desktop/Web

1. Open the note.
2. Click `{{properties}}` in the action bar at the top right of the editor.
3. At the top of the panel, switch between the two lists with the two icon buttons. The count and the current list name are shown on the right.
4. Click any note in the list to open it.
5. Click the arrow next to an entry to expand it — under `{{linkedNotes}}` you get the exact blocks you linked to, and under `{{referencedIn}}` you get each sentence containing the link, with the link text highlighted. Click one to open the note scrolled to that spot.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note.
2. Tap `{{references}}`.
3. Switch between the `{{linkedNotes}}` and `{{referencedIn}}` tabs.
4. Tap an entry to open the note, or expand it to see the individual blocks and jump straight to them.

:::

When a note has nothing to show you'll see `{{notLinked}}` or `{{notReferenced}}`

<!-- TODO: screenshot — the Linked notes / Referenced in panel in note properties, with one entry expanded -->

## Copy a note's link

Every note has a permanent internal link of the form `nn://note/<note id>`. A block link adds the block to it: `nn://note/<note id>?blockId=<block id>`. Paste it into any other note to create a link by hand, or keep it somewhere as a stable pointer to that note.

:::tabs key:platform
== Desktop/Web

1. Right click a note to open the `Note properties` menu.
2. Click `{{copyLink}}`.

A `{{linkCopied}}` toast confirms it. The link is copied as plain text, as HTML and as Markdown, so pasting into another note produces a ready-made link.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note.
2. Tap `{{copyLink}}`.

A `{{linkCopied}}` toast shows the copied link.

:::

Notebooks, tags and colors have internal links too — `nn://notebook/<id>`, `nn://tag/<id>` and `nn://color/<id>` — copied the same way from their own menus.

::: tip Opening links from outside the app
Internal links only resolve inside Notesnook. A `nn://` link pasted into a browser or another app will open the Notesnook app. To share a note with someone who doesn't use Notesnook, [publish it as a monograph](/publish-notes-with-monographs) instead.

:::

## Related pages

- [Plans and limits](/plans-and-limits) — which plan unlocks block-level note links
- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — where the link tools live and how to rearrange them
- [Note actions](/notes/note-actions) — copying, duplicating and the rest of the per-note menu
- [Search and navigation](/search-and-navigation) — finding the note you want to link to
- [Organize notes using notebooks](/organizing-notes/organize-notes-using-notebooks) — the other way to connect notes together
