---
title: Tasks and todo lists
pageTitle: Task lists and to-do lists in Notesnook
description: Build to-do lists inside any note in Notesnook — with titles, progress counts, subtasks, drag-and-drop reordering and one-click clearing of completed tasks.
keywords:
  - notesnook task list
  - encrypted to do list
  - notes app with todo lists
schema: howto
---

# Task and todo lists <PlanTag plan="essential" />

Create todo lists and manage your tasks in Notesnook with ease using task lists. A task list lives inside a note, so your checklist sits alongside the notes that explain it — and it is [encrypted](/how-is-my-data-encrypted) like everything else.

Task lists are part of the [Essential plan and above](/plans-and-limits). On the free plan you can still use a simple checklist: type `[] ` inside an existing bullet list, or pick `{{checklist}}` from the toolbar.

## Add a task list to a note

:::tabs key:platform
== Desktop/Web

1. Place the cursor on an empty line.
2. Click the `+` (Insert) button in the toolbar.
3. Choose `{{taskList}}`.

You can also press `Ctrl+Shift+T`, or type `[] ` on an empty line if you have [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) turned on.

== Mobile

1. Place the cursor on an empty line.
2. Tap the `+` (Insert) button in the toolbar.
3. Choose `{{taskList}}`.

Typing `[] ` on an empty line also works — Markdown shortcuts are on by default on mobile.

:::

## Track your progress

Every task list carries a header showing how many of its items are done, with a progress bar that fills as you check things off. Checking a parent task checks all of its subtasks, and clearing the last subtask unchecks the parent.

## Adding a title to the task list

When you add a task list to a note, a header is added on top of each task list. You can add a title to the task list.

![A task list in the editor with a title typed into its header and a progress bar beneath it](/task-header-title.png)

## Sort completed tasks in task list

Sort completed tasks to the bottom of the list with the ![Sort completed tasks](/sort-task-icon.png) button in the task list header.

## Clear completed tasks from task list

Remove every completed item at once with the ![Clear completed tasks](/clear-task-icon.png) button in the task list header.

## Moving task items with drag and drop

You can move task items and change the order by drag and drop using the drag handle at the start of each task item.

![Dragging a task by the handle at the start of the row to reorder it within the list](/drag-drop.gif)

## Adding a subtask to a parent task

Notesnook supports unlimited subtasks under a single task item.

:::tabs key:platform
== Desktop/Web

1. Move selection to the end of the parent task item
2. Press `Enter` to create a new task item
3. Press `Tab` to indent it into a sub task

== Mobile

1. Move selection to the end of the parent task item
2. Press `Enter` to create a new task item
3. Tap the Indent tool button in the toolbar to indent it into a sub task

:::

Subtasks support the following features:

1. Completing a parent task will automatically complete all the sub tasks and vice versa.
2. You can select multiple sub tasks & mark them as completed/uncompleted together

## Make a task list read-only

Once a list is final, you can lock it against accidental edits with the `{{readonlyTaskList}}` button in the task list header — useful for a checklist you follow but don't change, like a packing list or a release checklist. The setting applies to nested task lists too, and you toggle it back off from the same button.

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — where the insert menu lives, and how to customize it
- [Outline lists](/rich-text-editor/outline-lists) — collapsible nested lists for structuring longer notes
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — type `[] ` instead of using the menu
- [Reminders](/reminders) — get notified about a note at a specific time
- [Plans & limits](/plans-and-limits) — what the Essential plan unlocks
