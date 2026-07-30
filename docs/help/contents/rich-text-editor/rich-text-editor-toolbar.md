---
title: Editor toolbar
description: Add blocks to a note and customize the editor toolbar's groups and tools to fit how you write.
---

# Editor Toolbar

The notes editor toolbar has all the basic tools for rich formatting of your notes. It also lets you add various blocks to your notes like task lists, images, videos etc.

![Toolbar](/toolbar-editor.png)

## Adding blocks to a note

1. Focus inside the note where you want to insert a block.
2. Click the ![Toolbar plus](/toolbar-plus.png) button on the toolbar.
3. Select the block you want to insert; for example a task list.

![Toolbar](/toolbar-blocks.png)

## Customzing editor toolbar <PlanTag plan="pro"/>

::: info
Toolbar configuration is automatically synced across all your devices. Notesnook does not sync the desktop toolbars to mobile, and vice versa.
:::

One of the great features of the editor is the ability to customize the editor toolbar to fit your own needs. There's usually many tools in an editor toolbar and being able to hide the tools you never use and just keep what you use more frequently on top helps focus on your note taking.

:::tabs key:platform
== Desktop/Web
To customize the toolbar go to `{{settings}}` > `{{customization}}` > `{{editor}}` and click `{{customizeToolbar}}`.

![Configure editor toolbar](/config-toolbar-desktop.png)
== Mobile
To customize the toolbar go to `{{settings}}` > `{{customization}}` > `{{editor}}` and click `{{customizeToolbar}}`.
:::

**Groups** - Tools are distrubted across groups. You can add, remove and reorder the groups in the toolbar. You can move tools between groups with drag and drop.

**Subgroup** - Each group can have a single sub group. Tools in a subgroup are collapsed into a drop down menu in the toolbar.

:::tabs key:platform
== Desktop/Web
**Disabled Items** - Tools that are hidden from the toolbar. You can drag and drop a tool into this section to remove it from the toolbar.
== Mobile
**Disabled Items** - Tools that are hidden from the toolbar. Click the `+` button on a group to view disabled tools and add them back to the toolbar.
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
Scroll down the bottom of all groups. Click `{{createAGroup}}` button to add a new group.
:::

### Adding tools to a group

:::tabs key:platform
== Desktop/Web
Drag and drop tools from other groups or the `Disabled item` section into a group to add them to the group.
== Mobile
Click the `+` button on a group header to add any disabled tools into the group. You can also drag and drop tools from other groups.
:::

### Creating a subgroup

:::tabs key:platform
== Desktop/Web

1. Hover on a group header.
2. Click the `+` button to add a subgroup.
3. Drag and drop tools into the subgroup.
4. Tools in the subgroup will be collapsed into a drop down.

== Mobile
You can create a subgroup by clicking on collapse button on a tool. Tools in the subgroup will be collapsed into a popup.
:::

### Deleting a group

:::tabs key:platform
== Desktop/Web
You can remove a group and all it's tools from the toolbar.

1. Hover on a group header
2. Click the trash icon to delete the group.
3. All the tools in the group will be moved to `Disabled items` section at the bottom.

== Mobile

1. Click the `-` button on a group header to remove the group
2. Tools removed from a group can be added back with the `+` button on the group header.
   :::

### Disable a tool

:::tabs key:platform
== Desktop/Web

1. Hover on a tool header
2. Click the trash icon to disable the tool.
3. Deleted tools in the group will be moved to `Disabled items` section at the bottom.

== Mobile
A tool can be disabled from the toolbar by clicking on the `-` button on the tool.
:::

## Related pages

- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — formatting as you type
- [Tables](/rich-text-editor/tables) — rows, columns, merging and CSV
- [Images & embeds](/rich-text-editor/images-attachments-and-embeds) — pictures, files and embedded content
- [Keyboard shortcuts](/keyboard-shortcuts) — every shortcut in one place
- [Plans & limits](/plans-and-limits) — what each plan unlocks and the exact limits
