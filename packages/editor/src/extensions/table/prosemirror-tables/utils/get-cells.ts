import type { Selection } from "prosemirror-state";

import { TableMap } from "../tablemap.js";
import { FindNodeResult, findTable } from "./query.js";

/**
 * Returns an array of cells in a column at the specified column index.
 *
 * @internal
 */
export function getCellsInColumn(
  columnIndex: number,
  selection: Selection
): FindNodeResult[] | undefined {
  const table = findTable(selection.$from);
  if (!table) {
    return;
  }

  const map = TableMap.get(table.node);

  if (columnIndex < 0 || columnIndex > map.width - 1) {
    return;
  }

  const cells = map.cellsInRect({
    left: columnIndex,
    right: columnIndex + 1,
    top: 0,
    bottom: map.height
  });

  return cells.map((nodePos) => {
    const node = table.node.nodeAt(nodePos)!;
    const pos = nodePos + table.start;
    return { pos, start: pos + 1, node, depth: table.depth + 2 };
  });
}

/**
 * Returns an array of cells in a row at the specified row index.
 *
 * @internal
 */
export function getCellsInRow(
  rowIndex: number,
  selection: Selection
): FindNodeResult[] | undefined {
  const table = findTable(selection.$from);
  if (!table) {
    return;
  }

  const map = TableMap.get(table.node);

  if (rowIndex < 0 || rowIndex > map.height - 1) {
    return;
  }

  const cells = map.cellsInRect({
    left: 0,
    right: map.width,
    top: rowIndex,
    bottom: rowIndex + 1
  });

  return cells.map((nodePos) => {
    const node = table.node.nodeAt(nodePos)!;
    const pos = nodePos + table.start;
    return { pos, start: pos + 1, node, depth: table.depth + 2 };
  });
}
