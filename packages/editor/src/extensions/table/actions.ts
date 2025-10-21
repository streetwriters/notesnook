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
import { selectedRect, TableRect } from "@tiptap/pm/tables";
import { EditorState, TextSelection, Transaction } from "prosemirror-state";
import { Node } from "prosemirror-model";

type TableCell = {
  cell: Node;
  pos: number;
};

function moveColumnRight(editor: Editor) {
  const { tr } = editor.state;
  const rect = selectedRect(editor.state);
  if (rect.right === rect.map.width) return;

  const transaction = moveColumn(tr, rect, rect.left, rect.left + 1);
  if (!transaction) return;

  editor.view.dispatch(transaction);
}

function moveColumnLeft(editor: Editor) {
  const { tr } = editor.state;
  const rect = selectedRect(editor.state);
  if (rect.left === 0) return;

  const transaction = moveColumn(tr, rect, rect.left, rect.left - 1);
  if (!transaction) return;

  editor.view.dispatch(transaction);
}

function moveRowDown(editor: Editor) {
  const { tr } = editor.state;
  const rect = selectedRect(editor.state);
  if (rect.top + 1 === rect.map.height || rect.top === 0) return;

  const transaction = moveRow(tr, rect, rect.top, rect.top + 1);
  if (!transaction) return;

  editor.view.dispatch(transaction);
}

function moveRowUp(editor: Editor) {
  const { tr } = editor.state;
  const rect = selectedRect(editor.state);
  if (rect.top === 0 || rect.top === 1) return;

  const transaction = moveRow(tr, rect, rect.top, rect.top - 1);
  if (!transaction) return;

  editor.view.dispatch(transaction);
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
  return true;
}

export {
  moveColumnLeft,
  moveColumnRight,
  moveRowDown,
  moveRowUp,
  selectRow,
  selectColumn
};
