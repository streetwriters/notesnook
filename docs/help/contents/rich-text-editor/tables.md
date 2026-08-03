---
title: Tables
pageTitle: How do I add a table to a note in Notesnook?
description: Insert a table in a Notesnook note and resize, move, merge and split its rows, columns and cells — plus importing and exporting tables as CSV.
keywords:
  - notesnook table
  - insert table in note
  - notes app with tables
  - import csv to note
schema: howto
---

# Tables

![A table in the Notesnook editor with its row and column controls visible](/table-example-22.png)

Tables in Notesnook provide all the basic to advanced functionality. On the left side are the `{{rowProperties}}` and `{{insertRowBelow}}` buttons while on top of the table are `{{tableSettings}}` and `{{insertColumnRight}}` buttons.

The first row of a newly created table is always a header. You can always delete this row if you do not like the header row formatting.

## Insert a table

1. Click the ![Toolbar plus](/toolbar-plus.png) and select the table block.
2. Select the size of the table grid.

![The table size grid in the insert menu](/create-table.png)

## Resizing table columns

Table columns are resizable on all platforms.

:::tabs key:platform
== Desktop

1. Hover on the separator between two columns, it will turn green
2. Click and hold separator to resize the column.

![Resize a table](/resize-table.gif)

== Mobile

1. Tap the separator between the two columns.
2. Drag the separator left or right to resize.

![Resize a table on mobile](/resize-table-mobile.gif)

:::

## Insert a row

1. Click a cell below which you want to insert a new row.
2. Click the `{{insertRowBelow}}` button to insert a new row.

![Insert row in the table](/insert-row-table.gif)

## Delete a row

1. Click a cell of the row you want to delete
2. Click the row properties button and select `{{deleteRow}}`

![Delete a row from the table](/table-row-delete.png)

## Move row

1. Click a cell of the row you want to move.
2. Click the row properties button and select `{{moveRowUp}}` to move the row up or `{{moveRowDown}}` to move the row down.

![Move a row in the table](/table-move-row.gif)

## Insert a column

1. Click a cell in a column after which you want to insert a new column.
2. Click the `{{insertColumnRight}}` button to insert a new column.

![Insert a column in the table](/table-insert-column.gif)

## Delete a column

1. Click a cell of the column you want to delete
2. Click the column properties button and select `{{deleteColumn}}`

![Delete a column from the table](/table-delete-column.png)

## Move column

1. Click a cell of the column you move.
2. Click the column properties button on top and select `{{moveColumnRight}}` to move the column right or `{{moveColumnLeft}}` to move the column left.

![Move a column in the table](/table-move-column.gif)

## Merge cells

1. Drag and select the cells you want to merge
2. Click table properties on top of table and select `{{mergeCells}}`

![Merge table cells](/table-merge-cells.gif)

## Split cells

1. Double click to select the cell you want to split
2. Click table properties on top of table and select `{{splitCells}}`

![Split table cells](/table-split-cell.gif)

## Cell Properties

1. Select the cell you want to customize
2. Click the table properties button on top
3. Select Cell properties
4. You can now change cell background, text color and border color.

![Customize cell properties](/cell-properties.png)

## Import CSV <PlanTag plan="pro" />

`{{importCsv}}` turns a `.csv` file into a new table at the cursor, so you don't have to retype spreadsheet data. The first row of the file becomes the table's header row.

:::tabs key:platform
== Desktop/Web

1. Focus inside the note where you want the table.
2. Click the ![Toolbar plus](/toolbar-plus.png) button and open `{{table}}`.
3. Click `{{importCsv}}` and pick a `.csv` file.

The table is inserted with one row per line and one column per field.

== Mobile

1. Focus inside the note where you want the table.
2. Tap the ![Toolbar plus](/toolbar-plus.png) button and open `{{table}}`.
3. Tap `{{importCsv}}` and pick a `.csv` file.

:::

<!-- TODO: screenshot — the Import CSV item in the toolbar's Table insert menu -->

Importing a CSV into a table requires a Pro plan. See [Plans & limits](/plans-and-limits).

## Export CSV <PlanTag plan="pro" />

`{{exportCsv}}` writes out the table you are in — and only that table — as a `.csv` file you can open in a spreadsheet.

:::tabs key:platform
== Desktop/Web

1. Click a cell in the table.
2. Click the `{{tableSettings}}` button on top of the table.
3. Click `{{exportCsv}}`.

The file is saved as `table.csv`.

== Mobile

1. Tap a cell in the table.
2. Tap the `{{tableSettings}}` button in the toolbar at the bottom.
3. Tap `{{exportCsv}}`.

On Android you are asked where to save `table.csv`. On iOS the file is saved inside the app and a `Table saved to csv` sheet lets you share it from there.

:::

<!-- TODO: screenshot — the Export CSV item in the table settings menu -->

Exporting a table as CSV requires a Pro plan. See [Plans & limits](/plans-and-limits).

## Delete table

1. Select the table
2. Click table properties button on top.
3. Select `{{deleteTable}}` from drop down menu

![Delete a table from the notes editor](/delete-table.png)

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every formatting tool
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — formatting as you type
- [Plans & limits](/plans-and-limits) — what each plan unlocks and the exact limits
