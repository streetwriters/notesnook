---
title: Editor toolbar
pageTitle: The Notesnook editor toolbar, and how to customize it
description: Insert blocks from the Notesnook editor toolbar, and rearrange its groups, subgroups and tools — or switch between the default, minimal and custom presets.
keywords:
  - notesnook editor toolbar
  - customize notes toolbar
  - notesnook insert block
---

# Editor toolbar

The editor toolbar holds every formatting tool, and the `+` button on it inserts blocks — task lists, tables, images, code blocks and more.

![The Notesnook editor toolbar, with its formatting tools grouped along the top of a note](/toolbar-editor.png)

## Add a block to a note

1. Focus inside the note where you want to insert a block.
2. Click the ![Toolbar plus](/toolbar-plus.png) button on the toolbar.
3. Select the block you want to insert; for example a task list.

![The insert menu open in the editor, listing the blocks you can add to a note](/toolbar-blocks.png)

## Customize the editor toolbar <PlanTag plan="pro" />

An editor toolbar carries a lot of tools. Hiding the ones you never use, and keeping the ones you reach for at the front, leaves you with a toolbar that matches how you actually write.

::: info Desktop and mobile keep separate toolbars
Your toolbar layout syncs to your other devices, but desktop and mobile are stored separately — changing the toolbar on your laptop does not change the one on your phone, and the other way round.

:::

On every platform the toolbar editor lives in the same place: `{{settings}}` > `{{customization}}` > `{{editor}}` > `{{customizeToolbar}}`.

![The Customize toolbar screen on desktop, showing the toolbar's groups and the tools inside each one](/config-toolbar-desktop.png)

**Groups** — tools are distributed across groups. You can add, remove and reorder the groups in the toolbar. You can move tools between groups with drag and drop.

**Subgroups** — each group can have a single subgroup. Tools in a subgroup are collapsed into a drop down menu in the toolbar.

:::tabs key:platform
== Desktop/Web
**Disabled items** — tools that are hidden from the toolbar. Drag a tool into this section to remove it from the toolbar.

== Mobile

**Disabled items** — tools that are hidden from the toolbar. Tap the `+` button on a group to see them and add them back.

:::

### Choose a toolbar preset

The toolbar always uses one of three presets, shown at the top of the `{{customizeToolbar}}` screen:

- `{{default}}` — the full set of groups and tools.
- `{{minimal}}` — a trimmed-down toolbar with only the most-used tools.
- `{{custom}}` <PlanTag plan="pro" /> — your own arrangement of groups, subgroups and tools.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` > `{{customization}}` > `{{editor}}` > `{{customizeToolbar}}`.
2. Select `{{default}}`, `{{minimal}}` or `{{custom}}`.

Editing groups or tools while `{{default}}` or `{{minimal}}` is selected switches you to `{{custom}}` automatically.

== Mobile

1. Go to `{{settings}}` > `{{customization}}` > `{{editor}}` > `{{customizeToolbar}}`.
2. Under `{{presets}}`, tap `{{default}}`, `{{minimal}}` or `{{custom}}`.

:::

Saving a `{{custom}}` preset requires a Pro plan — `{{default}}` and `{{minimal}}` are available on every plan. See [Plans & limits](/plans-and-limits).

### Toolbar layouts on mobile are per device class

Mobile keeps a separate toolbar layout for each device class — phone, small tablet and tablet — and picks the one that matches the current window size. Customizing the toolbar on your phone therefore does not change the layout you see on a tablet, and a tablet that switches between split-screen and full screen can move between the small tablet and tablet layouts.

### Reset the toolbar

:::tabs key:platform
== Desktop/Web
There is no reset action. Select the `{{default}}` preset on the `{{customizeToolbar}}` screen to go back to the stock toolbar.

== Mobile

1. Go to `{{settings}}` > `{{customization}}` > `{{editor}}`.
2. Tap `{{resetToolbar}}`.

The toolbar goes back to the `{{default}}` preset and a `{{toolbarReset}}` toast confirms it.

:::

### Add a new group

:::tabs key:platform
== Desktop/Web
To add a new group to the toolbar, click the `+` button in the header.

== Mobile

Scroll to the bottom of the group list and tap `{{createAGroup}}`.

:::

### Add tools to a group

:::tabs key:platform
== Desktop/Web
Drag tools from other groups or from `Disabled items` into a group to add them.

== Mobile

Tap the `+` button on a group header to add any disabled tools into the group. You can also drag tools in from other groups.

:::

### Create a subgroup

:::tabs key:platform
== Desktop/Web

1. Hover on a group header.
2. Click the `+` button to add a subgroup.
3. Drag and drop tools into the subgroup.
4. Tools in the subgroup are collapsed into a drop down.

== Mobile

Create a subgroup by tapping the collapse button on a tool. Tools in the subgroup are collapsed into a popup.

:::

### Delete a group

:::tabs key:platform
== Desktop/Web
You can remove a group and all its tools from the toolbar.

1. Hover on a group header
2. Click the trash icon to delete the group.
3. All the tools in the group are moved to the `Disabled items` section at the bottom.

== Mobile

1. Tap the `-` button on a group header to remove the group.
2. Tools removed from a group can be added back with the `+` button on the group header.

:::

### Disable a tool

:::tabs key:platform
== Desktop/Web

1. Hover on a tool header
2. Click the trash icon to disable the tool.
3. The tool is moved to the `Disabled items` section at the bottom.

== Mobile

Tap the `-` button on a tool to disable it.

:::

## Related pages

- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — formatting as you type
- [Tables](/rich-text-editor/tables) — rows, columns, merging and CSV
- [Images & embeds](/rich-text-editor/images-attachments-and-embeds) — pictures, files and embedded content
- [Keyboard shortcuts](/keyboard-shortcuts) — every shortcut in one place
- [Plans & limits](/plans-and-limits) — what each plan unlocks and the exact limits
