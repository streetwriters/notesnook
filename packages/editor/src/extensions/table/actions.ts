import { Editor } from "@tiptap/core";
import { selectedRect, TableRect } from "@_ueberdosis/prosemirror-tables";
import { Transaction } from "prosemirror-state";

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
  if (rect.top + 1 === rect.map.height) return;

  const transaction = moveRow(tr, rect, rect.top, rect.top + 1);
  if (!transaction) return;

  editor.view.dispatch(transaction);
}

function moveRowUp(editor: Editor) {
  const { tr } = editor.state;
  const rect = selectedRect(editor.state);
  if (rect.top === 0) return;

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
  let fromCells = getColumnCells(rect, from);
  let toCells = getColumnCells(rect, to);

  return moveCells(tr, rect, fromCells, toCells);
}

function getColumnCells({ map, table }: TableRect, col: number) {
  let cells = [];
  for (let row = 0; row < map.height; ) {
    let index = row * map.width + col;
    if (index >= map.map.length) break;

    let pos = map.map[index];

    let cell = table.nodeAt(pos);
    if (!cell) continue;
    cells.push({ cell, pos });

    row += cell.attrs.rowspan;
  }

  return cells;
}

function moveRow(tr: Transaction, rect: TableRect, from: number, to: number) {
  let fromCells = getRowCells(rect, from);
  let toCells = getRowCells(rect, to);
  return moveCells(tr, rect, fromCells, toCells);
}

function getRowCells({ map, table }: TableRect, row: number) {
  let cells = [];
  for (let col = 0, index = row * map.width; col < map.width; col++, index++) {
    if (index >= map.map.length) break;

    let pos = map.map[index];
    let cell = table.nodeAt(pos);

    if (!cell) continue;
    cells.push({ cell, pos });

    col += cell.attrs.colspan - 1;
  }

  return cells;
}

function moveCells(
  tr: Transaction,
  rect: TableRect,
  fromCells: any[],
  toCells: any[]
) {
  if (fromCells.length !== toCells.length) return;
  let mapStart = tr.mapping.maps.length;

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

export { moveColumnLeft, moveColumnRight, moveRowDown, moveRowUp };
