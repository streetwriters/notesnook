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

import { EditorState, NodeSelection, PluginKey } from "prosemirror-state";

import { Attrs, Node, ResolvedPos } from "prosemirror-model";
import { CellSelection } from "./cellselection.js";
import { tableNodeTypes } from "./schema.js";
import { Rect, TableMap } from "./tablemap.js";

/**
 * @public
 */
export type MutableAttrs = Record<string, unknown>;

/**
 * @public
 */
export interface CellAttrs {
  colspan: number;
  rowspan: number;
  colwidth: number[] | null;
}

/**
 * @public
 */
export const tableEditingKey = new PluginKey<number>("selectingCells");

/**
 * @public
 */
export function cellAround($pos: ResolvedPos): ResolvedPos | null {
  for (let d = $pos.depth - 1; d > 0; d--)
    if ($pos.node(d).type.spec.tableRole == "row")
      return $pos.node(0).resolve($pos.before(d + 1));
  return null;
}

export function cellWrapping($pos: ResolvedPos): null | Node {
  for (let d = $pos.depth; d > 0; d--) {
    // Sometimes the cell can be in the same depth.
    const role = $pos.node(d).type.spec.tableRole;
    if (role === "cell" || role === "header_cell") return $pos.node(d);
  }
  return null;
}

/**
 * @public
 */
export function isInTable(state: EditorState): boolean {
  const $head = state.selection.$head;
  for (let d = $head.depth; d > 0; d--)
    if ($head.node(d).type.spec.tableRole == "row") return true;
  return false;
}

/**
 * @internal
 */
export function selectionCell(state: EditorState): ResolvedPos {
  const sel = state.selection as CellSelection | NodeSelection;
  if ("$anchorCell" in sel && sel.$anchorCell) {
    return sel.$anchorCell.pos > sel.$headCell.pos
      ? sel.$anchorCell
      : sel.$headCell;
  } else if (
    "node" in sel &&
    sel.node &&
    sel.node.type.spec.tableRole == "cell"
  ) {
    return sel.$anchor;
  }
  const $cell = cellAround(sel.$head) || cellNear(sel.$head);
  if ($cell) {
    return $cell;
  }
  throw new RangeError(`No cell found around position ${sel.head}`);
}

/**
 * @public
 */
export function cellNear($pos: ResolvedPos): ResolvedPos | undefined {
  for (
    let after = $pos.nodeAfter, pos = $pos.pos;
    after;
    after = after.firstChild, pos++
  ) {
    const role = after.type.spec.tableRole;
    if (role == "cell" || role == "header_cell") return $pos.doc.resolve(pos);
  }
  for (
    let before = $pos.nodeBefore, pos = $pos.pos;
    before;
    before = before.lastChild, pos--
  ) {
    const role = before.type.spec.tableRole;
    if (role == "cell" || role == "header_cell")
      return $pos.doc.resolve(pos - before.nodeSize);
  }
}

/**
 * @public
 */
export function pointsAtCell($pos: ResolvedPos): boolean {
  return $pos.parent.type.spec.tableRole == "row" && !!$pos.nodeAfter;
}

/**
 * @public
 */
export function moveCellForward($pos: ResolvedPos): ResolvedPos {
  return $pos.node(0).resolve($pos.pos + $pos.nodeAfter!.nodeSize);
}

/**
 * @internal
 */
export function inSameTable($cellA: ResolvedPos, $cellB: ResolvedPos): boolean {
  return (
    $cellA.depth == $cellB.depth &&
    $cellA.pos >= $cellB.start(-1) &&
    $cellA.pos <= $cellB.end(-1)
  );
}

/**
 * @public
 */
export function findCell($pos: ResolvedPos): Rect {
  return TableMap.get($pos.node(-1)).findCell($pos.pos - $pos.start(-1));
}

/**
 * @public
 */
export function colCount($pos: ResolvedPos): number {
  return TableMap.get($pos.node(-1)).colCount($pos.pos - $pos.start(-1));
}

/**
 * @public
 */
export function nextCell(
  $pos: ResolvedPos,
  axis: "horiz" | "vert",
  dir: number
): ResolvedPos | null {
  const table = $pos.node(-1);
  const map = TableMap.get(table);
  const tableStart = $pos.start(-1);

  const moved = map.nextCell($pos.pos - tableStart, axis, dir);
  return moved == null ? null : $pos.node(0).resolve(tableStart + moved);
}

/**
 * @public
 */
export function removeColSpan(attrs: CellAttrs, pos: number, n = 1): CellAttrs {
  const result: CellAttrs = { ...attrs, colspan: attrs.colspan - n };

  if (result.colwidth) {
    result.colwidth = result.colwidth.slice();
    result.colwidth.splice(pos, n);
    if (!result.colwidth.some((w) => w > 0)) result.colwidth = null;
  }
  return result;
}

/**
 * @public
 */
export function addColSpan(attrs: CellAttrs, pos: number, n = 1): Attrs {
  const result = { ...attrs, colspan: attrs.colspan + n };
  if (result.colwidth) {
    result.colwidth = result.colwidth.slice();
    for (let i = 0; i < n; i++) result.colwidth.splice(pos, 0, 0);
  }
  return result;
}

/**
 * @public
 */
export function columnIsHeader(
  map: TableMap,
  table: Node,
  col: number
): boolean {
  const headerCell = tableNodeTypes(table.type.schema).header_cell;
  for (let row = 0; row < map.height; row++)
    if (table.nodeAt(map.map[col + row * map.width])!.type != headerCell)
      return false;
  return true;
}

export function getClientX(event: MouseEvent | TouchEvent): number | null {
  return event instanceof MouseEvent
    ? event.clientX
    : event.touches.length > 0
    ? event.touches[0].clientX
    : event.changedTouches.length > 0
    ? event.changedTouches[0].clientX
    : null;
}

export function getClientY(event: MouseEvent | TouchEvent): number | null {
  return event instanceof MouseEvent
    ? event.clientY
    : event.touches.length > 0
    ? event.touches[0].clientY
    : event.changedTouches.length > 0
    ? event.changedTouches[0].clientY
    : null;
}

export function isTouchEvent(event: Event): event is TouchEvent {
  return "TouchEvent" in window && event instanceof TouchEvent;
}
