import type { Node } from "prosemirror-model";
import type { Transaction } from "prosemirror-state";

import {
  convertArrayOfRowsToTableNode,
  convertTableNodeToArrayOfRows
} from "./convert.js";
import { getSelectionRangeInColumn } from "./selection-range.js";
import { moveRowInArrayOfRows } from "./move-row-in-array-of-rows.js";
import { findTable } from "./query.js";
import { transpose } from "./transpose.js";
import { TableMap } from "../tablemap.js";
import { CellSelection } from "../cellselection.js";

/**
 * Parameters for moving a column in a table.
 *
 * @internal
 */
export interface MoveColumnParams {
  tr: Transaction;
  originIndex: number;
  targetIndex: number;
  select: boolean;
  pos: number;
}

/**
 * Move a column from index `origin` to index `target`.
 *
 * @internal
 */
export function moveColumn(moveColParams: MoveColumnParams): boolean {
  const { tr, originIndex, targetIndex, select, pos } = moveColParams;
  const $pos = tr.doc.resolve(pos);
  const table = findTable($pos);
  if (!table) return false;

  const indexesOriginColumn = getSelectionRangeInColumn(
    tr,
    originIndex
  )?.indexes;
  const indexesTargetColumn = getSelectionRangeInColumn(
    tr,
    targetIndex
  )?.indexes;

  if (!indexesOriginColumn || !indexesTargetColumn) return false;

  if (indexesOriginColumn.includes(targetIndex)) return false;

  const newTable = moveTableColumn(
    table.node,
    indexesOriginColumn,
    indexesTargetColumn,
    0
  );

  tr.replaceWith(table.pos, table.pos + table.node.nodeSize, newTable);

  if (!select) return true;

  const map = TableMap.get(newTable);
  const start = table.start;
  const index = targetIndex;
  const lastCell = map.positionAt(map.height - 1, index, newTable);
  const $lastCell = tr.doc.resolve(start + lastCell);

  const firstCell = map.positionAt(0, index, newTable);
  const $firstCell = tr.doc.resolve(start + firstCell);

  tr.setSelection(CellSelection.colSelection($lastCell, $firstCell));
  return true;
}

function moveTableColumn(
  table: Node,
  indexesOrigin: number[],
  indexesTarget: number[],
  direction: -1 | 1 | 0
) {
  let rows = transpose(convertTableNodeToArrayOfRows(table));

  rows = moveRowInArrayOfRows(rows, indexesOrigin, indexesTarget, direction);
  rows = transpose(rows);

  return convertArrayOfRowsToTableNode(table, rows);
}
