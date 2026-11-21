/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Editor } from "@tiptap/core";
import { EditorState, TextSelection, Transaction } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { selectedRect, TableRect } from "./prosemirror-tables/commands.js";
import { saveAs } from "file-saver";
import { unparse, parse } from "papaparse";
import {
  hasPermission,
  useToolbarStore,
  registerTableActions
} from "@notesnook/editor-ui";
import { getTableNodeTypes } from "./utilities/getTableNodeTypes.js";
import { createCell } from "./utilities/createCell.js";

type TableCell = {
  cell: Node;
  pos: number;
};

/**
 * The move actions are Tiptap commands: they edit the transaction they are
 * given and return whether they moved anything, so the toolbar runs them
 * through `EditorController.run` and never dispatches itself.
 */
function moveColumnRight(tr: Transaction, state: EditorState) {
  const rect = selectedRect(state);
  if (rect.right === rect.map.width) return false;
  return !!moveColumn(tr, rect, rect.left, rect.left + 1);
}

function moveColumnLeft(tr: Transaction, state: EditorState) {
  const rect = selectedRect(state);
  if (rect.left === 0) return false;
  return !!moveColumn(tr, rect, rect.left, rect.left - 1);
}

function moveRowDown(tr: Transaction, state: EditorState) {
  const rect = selectedRect(state);
  if (rect.top + 1 === rect.map.height || rect.top === 0) return false;
  return !!moveRow(tr, rect, rect.top, rect.top + 1);
}

function moveRowUp(tr: Transaction, state: EditorState) {
  const rect = selectedRect(state);
  if (rect.top === 0 || rect.top === 1) return false;
  return !!moveRow(tr, rect, rect.top, rect.top - 1);
}

function moveColumn(
  tr: Transaction,
  rect: TableRect,
  from: number,
  to: number
) {
  const fromCells = getColumnCells(rect, from);
  const toCells = getColumnCells(rect, to);

  return moveCells(tr, rect, fromCells, toCells);
}

function getColumnCells({ map, table }: TableRect, col: number): TableCell[] {
  const cells: TableCell[] = [];
  for (let row = 0; row < map.height; ) {
    const index = row * map.width + col;
    if (index >= map.map.length) break;

    const pos = map.map[index];

    const cell = table.nodeAt(pos);
    if (!cell) continue;
    cells.push({ cell, pos });

    row += cell.attrs.rowspan;
  }

  return cells;
}

function moveRow(tr: Transaction, rect: TableRect, from: number, to: number) {
  const fromCells = getRowCells(rect, from);
  const toCells = getRowCells(rect, to);
  return moveCells(tr, rect, fromCells, toCells);
}

function getRowCells({ map, table }: TableRect, row: number): TableCell[] {
  const cells: TableCell[] = [];
  for (let col = 0, index = row * map.width; col < map.width; col++, index++) {
    if (index >= map.map.length) break;

    const pos = map.map[index];
    const cell = table.nodeAt(pos);

    if (!cell) continue;
    cells.push({ cell, pos });

    col += cell.attrs.colspan - 1;
  }

  return cells;
}

function moveCells(
  tr: Transaction,
  rect: TableRect,
  fromCells: TableCell[],
  toCells: TableCell[]
) {
  if (fromCells.length !== toCells.length) return;
  const mapStart = tr.mapping.maps.length;

  for (let i = 0; i < toCells.length; ++i) {
    const fromCell = fromCells[i];
    const toCell = toCells[i];

    let fromStart = tr.mapping
      .slice(mapStart)
      .map(rect.tableStart + fromCell.pos);
    let fromEnd = fromStart + fromCell.cell.nodeSize;
    const fromSlice = tr.doc.slice(fromStart, fromEnd);

    const toStart = tr.mapping
      .slice(mapStart)
      .map(rect.tableStart + toCell.pos);
    const toEnd = toStart + toCell.cell.nodeSize;
    const toSlice = tr.doc.slice(toStart, toEnd);

    tr.replace(toStart, toEnd, fromSlice);

    fromStart = tr.mapping.slice(mapStart).map(rect.tableStart + fromCell.pos);
    fromEnd = fromStart + fromCell.cell.nodeSize;
    tr.replace(fromStart, fromEnd, toSlice);
  }

  return tr;
}

function selectRow(
  tr: Transaction,
  state: EditorState,
  direction: "prev" | "next"
) {
  const rect = selectedRect(state);
  const currentCellIndex = rect.map.width * (rect.bottom - 1) + rect.right;
  const nextCellIndex =
    direction === "prev"
      ? currentCellIndex - rect.map.width
      : currentCellIndex + rect.map.width;
  const pos = rect.map.map[nextCellIndex - 1];
  tr.setSelection(new TextSelection(tr.doc.resolve(rect.tableStart + pos + 1)));
  tr.scrollIntoView();
  return true;
}

function selectColumn(
  tr: Transaction,
  state: EditorState,
  direction: "prev" | "next"
) {
  const rect = selectedRect(state);
  const currentCellIndex = rect.map.width * (rect.bottom - 1) + rect.right;
  const nextCellIndex =
    direction === "prev" ? currentCellIndex - 1 : currentCellIndex + 1;
  const pos = rect.map.map[nextCellIndex - 1];
  tr.setSelection(new TextSelection(tr.doc.resolve(rect.tableStart + pos + 1)));
  tr.scrollIntoView();
  return true;
}

function importCsvToTable(csvText: string, editor: Editor) {
  const result = parse<string[]>(csvText, {
    skipEmptyLines: true
  });
  if (!result.data || result.data.length === 0) return "";

  const { schema } = editor.state;
  const types = getTableNodeTypes(schema);

  const tableRows = result.data.map((row, rowIndex) => {
    const isHeaderRow = rowIndex === 0;
    const cellType = isHeaderRow ? types.header_cell : types.cell;

    const cells = row
      .map((cellText) => {
        const paragraphNode = cellText
          ? schema.nodes.paragraph.create(null, schema.text(cellText))
          : schema.nodes.paragraph.create();
        return createCell(cellType, paragraphNode);
      })
      .filter((cell): cell is Node => cell != null);

    return types.row.createChecked(null, cells);
  });

  const tableNode = types.table.createChecked(null, tableRows);

  editor.chain().focus().insertContent(tableNode.toJSON()).run();
}

function exportToCSV(editor?: Editor) {
  if (!hasPermission("exportTableAsCsv")) return;
  if (!editor) return;

  const rect = selectedRect(editor.state);

  const rows: string[][] = [];
  rect.table.forEach((node) => {
    const row: string[] = [];
    node.forEach((cell) => row.push(cell.textContent));
    rows.push(row);
  });
  const csv = unparse(rows);
  if (useToolbarStore.getState().isMobile) {
    editor.storage.downloadCsvTable?.(csv);
  } else {
    saveAs(new Blob([new TextEncoder().encode(csv)]), "table.csv");
  }
}

registerTableActions({ importCsvToTable });

export {
  moveColumnLeft,
  moveColumnRight,
  moveRowDown,
  moveRowUp,
  selectRow,
  selectColumn,
  exportToCSV,
  importCsvToTable
};
