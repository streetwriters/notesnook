---
title: Notebooks
pageTitle: How do I organize notes with notebooks in Notesnook?
description: Create nested notebooks in Notesnook, add one note to several notebooks at once, set a default notebook, and move a notebook out of its parent.
keywords:
  - notesnook notebooks
  - nested notebooks notes app
  - organize notes notebooks
schema: howto
---

# Organizing notes with notebooks

Notebooks are a quick and easy way for nested organization of notes.

In Notesnook, one note can belong to multiple notebooks. This allows for very flexible organization structures. For example, an author can "link" the character list to all the chapters instead of duplicating it for each chapter. Similarly, a user can link common notes between multiple notebooks without any duplication.

Free accounts can keep up to 50 notebooks. Essential raises the cap to 500, and Pro and Believer are unlimited — see [Plans & limits](/plans-and-limits).

## Creating a notebook

:::tabs key:platform
== Desktop/Web

1. Click the Notebook icon at the top of the side menu.
2. Click the `+` button on top right corner of the side menu.
3. Add a title for your notebook, and optionally, a description.
4. Click the `{{create}}` button
5. You have created your first notebook in Notesnook

== Mobile

1. Tap the Notebook icon at the bottom of the side menu.
2. Tap the `+` button on the bottom right corner
3. Add a title for your notebook, and optionally, a description.
4. Tap the `{{add}}` button.
5. You have created your first notebook in Notesnook.

:::

::: info
You can create notebooks inside other notebooks. Open any notebook's properties and click `{{addNotebook}}`.

:::

## Editing a notebook

:::tabs key:platform
== Desktop/Web

1. Click the Notebook icon at the top of the side menu.
2. Right click the Notebook you want to edit and select "Edit" from dropdown.
3. Edit your notebook.
4. Click `{{save}}` button to save the changes.

== Mobile

1. Tap the Notebook icon at the bottom of the side menu.
2. Hold down on the notebook you wish to edit.
3. Tap `{{editNotebook}}`
4. Edit your notebook
5. Tap `{{save}}` button to save changes

:::

## Creating a new note in a notebook

:::tabs key:platform
== Desktop/Web

1. Go to the notebooks section by clicking on the notebook icon, and open a notebook
2. Click the ![Add a note](/plus-button-desktop.png) button at the top right of the notebook.
3. Start writing in editor to create a note in the notebook

== Mobile

1. Go to the notebooks section by tapping on the notebook icon, and open a notebook
2. Tap the ![Add a note](/plus-button-desktop.png) button at the bottom right to open the editor, or **swipe from right to left**.
3. Start writing in editor to create a note in the notebook

:::

::: info
Once a note is added to a notebook, you will see its path on the bottom of the note in the list. Clicking on it will take you to the respective notebook. Tags are always displayed first.

![A note in the list showing the notebook it belongs to along the bottom of the row](/notebook-ref.png)

:::

## Linking an existing note to a notebook

:::tabs key:platform
== Desktop/Web

1. Right click a note
2. Click `{{notebooks}}` > `{{linkNotebooks}}`
3. Select the notebook you want to link the note to (you can select multiple)
4. Click `{{done}}` to save your changes.

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button
2. Tap `{{addToNotebook}}` button.
3. Select the notebook you want to link the note to (you can select multiple)
4. Tap the checkmark button in the bottom right to save your changes.

:::

::: info
In Notesnook a single note can exist in multiple Notebooks. However, a note will show only one reference on top.

:::

## Linking multiple notes to a notebook

:::tabs key:platform
== Desktop/Web

1. Hold `Ctrl` key and click on all the notes you want to link
2. Right click selected notes
3. Click `{{notebooks}}` > `{{linkNotebooks}}`
4. Select the notebook you want to link the note to (you can select multiple)
5. Click `{{done}}` to save your changes.

== Mobile

1. Long press a note to enter multi selection mode.
2. Tap all the notes you want to link to select them
3. Tap the `+` button in top header
4. Select the notebook you want to link the note to (you can select multiple)
5. Tap the `{{save}}` button at the top right corner to save your changes.

:::

## Remove note from a notebook

:::tabs key:platform
== Desktop/Web

1. Right click a note
2. Click `{{notebooks}}` in the context menu
3. Click the notebook you want to remove the note from

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button
2. Tap `{{addToNotebook}}`.
3. Unselect the notebooks you wish to remove this note from, and press the checkmark in the bottom right corner.

:::

::: warning You can only add or remove a note from a notebook.
Attempting to do both at the same time will not work, and the note will not be removed from _any_ notebook.
:::

## Set a default notebook <PlanTag plan="pro" />

Every new note you create outside a notebook is added to your default notebook automatically, so quick notes don't pile up in an unsorted list. Only one notebook can be the default at a time.

:::tabs key:platform
== Desktop/Web

1. Go to the notebooks section by clicking on the notebook icon.
2. Right click the notebook.
3. Click `{{setAsDefault}}`.

A checkmark appears next to `{{setAsDefault}}` for the notebook that is currently the default. Click it again to clear the default.

== Mobile

1. Go to the notebooks section by tapping on the notebook icon.
2. Hold down on the notebook.
3. Tap `{{setAsDefault}}`.

The action reads `{{removeAsDefault}}` on the notebook that is already the default — tap it to clear the default.

:::

Setting a default notebook requires a Pro plan. See [Plans & limits](/plans-and-limits).

## Move a notebook to top

A notebook nested inside another notebook can be pulled back out to the top level of the notebooks list.

:::tabs key:platform
== Desktop/Web

1. Open the parent notebook so the nested notebook is visible.
2. Right click the nested notebook.
3. Click `{{moveToTop}}`.

The notebook is unlinked from its parent and appears at the root of the notebooks list. The action is hidden for notebooks that are already at the root.

== Mobile

1. Hold down on the nested notebook and tap `{{moveNotebookFix}}`.
2. On the `{{moveNotebookFix}}` screen, tap `{{moveToTop}}`.

:::

## Move a notebook to trash

:::tabs key:platform
== Desktop/Web

1. Go to the notebooks section by clicking on the notebook icon.
2. Right click the notebook
3. Click `{{moveToTrash}}`.
4. Select whether you also want to move the notes inside this notebook to the trash.

== Mobile

1. Go to the notebooks section by tapping on the notebook icon.
2. Hold down on the notebook.
3. Tap `{{moveToTrash}}` to delete the notebook.
4. Select whether you also want to move the notes inside this notebook to the trash.

:::

## Related pages

- [Tags](/organizing-notes/organize-notes-using-tags) — cross-cutting labels
- [Side menu shortcuts](/organizing-notes/side-menu-shortcuts) — pinning notebooks and tags to the sidebar
- [Note actions](/notes/note-actions) — pin, duplicate, read-only, print and more
- [Plans & limits](/plans-and-limits) — what each plan unlocks and the exact limits
