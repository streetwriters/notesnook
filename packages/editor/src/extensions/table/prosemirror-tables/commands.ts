// This file defines a number of table-related commands.

import {
  Fragment,
  Node,
  NodeType,
  ResolvedPos,
  Slice
} from "prosemirror-model";
import {
  Command,
  EditorState,
  TextSelection,
  Transaction
} from "prosemirror-state";

import { CellSelection } from "./cellselection.js";
import type { Direction } from "./input.js";
import { tableNodeTypes, TableRole } from "./schema.js";
import { Rect, TableMap } from "./tablemap.js";
import {
  addColSpan,
  cellAround,
  CellAttrs,
  cellWrapping,
  columnIsHeader,
  isInTable,
  moveCellForward,
  removeColSpan,
  selectionCell
} from "./util.js";
import { moveColumn } from "./utils/move-column.js";
import { moveRow } from "./utils/move-row.js";

/**
 * @public
 */
export type TableRect = Rect & {
  tableStart: number;
  map: TableMap;
  table: Node;
};

/**
 * Helper to get the selected rectangle in a table, if any. Adds table
 * map, table node, and table start offset to the object for
 * convenience.
 *
 * @public
 */
export function selectedRect(state: EditorState): TableRect {
  const sel = state.selection;
  const $pos = selectionCell(state);
  const table = $pos.node(-1);
  const tableStart = $pos.start(-1);
  const map = TableMap.get(table);
  const rect =
    sel instanceof CellSelection
      ? map.rectBetween(
          sel.$anchorCell.pos - tableStart,
          sel.$headCell.pos - tableStart
        )
      : map.findCell($pos.pos - tableStart);
  return { ...rect, tableStart, map, table };
}

/**
 * Add a column at the given position in a table.
 *
 * @public
 */
export function addColumn(
  tr: Transaction,
  { map, tableStart, table }: TableRect,
  col: number,
  defaultCellAttrs?: { colwidth?: number[] }
): Transaction {
  let refColumn: number | null = col > 0 ? -1 : 0;
  if (columnIsHeader(map, table, col + refColumn)) {
    refColumn = col == 0 || col == map.width ? null : 0;
  }

  for (let row = 0; row < map.height; row++) {
    const index = row * map.width + col;
    // If this position falls inside a col-spanning cell
    if (col > 0 && col < map.width && map.map[index - 1] == map.map[index]) {
      const pos = map.map[index];
      const cell = table.nodeAt(pos)!;
      tr.setNodeMarkup(
        tr.mapping.map(tableStart + pos),
        null,
        addColSpan(cell.attrs as CellAttrs, col - map.colCount(pos))
      );
      // Skip ahead if rowspan > 1
      row += cell.attrs.rowspan - 1;
    } else {
      const type =
        refColumn == null
          ? tableNodeTypes(table.type.schema).cell
          : table.nodeAt(map.map[index + refColumn])!.type;
      const pos = map.positionAt(row, col, table);
      tr.insert(
        tr.mapping.map(tableStart + pos),
        type.createAndFill(defaultCellAttrs)!
      );
    }
  }
  return tr;
}

/**
 * Command to add a column before the column with the selection.
 *
 * @public
 */
export function addColumnBefore(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  defaultCellAttrs?: { colwidth?: number[] }
): boolean {
  if (!isInTable(state)) return false;
  if (dispatch) {
    const rect = selectedRect(state);
    dispatch(addColumn(state.tr, rect, rect.left, defaultCellAttrs));
  }
  return true;
}

/**
 * Command to add a column after the column with the selection.
 *
 * @public
 */
export function addColumnAfter(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  defaultCellAttrs?: { colwidth?: number[] }
): boolean {
  if (!isInTable(state)) return false;
  if (dispatch) {
    const rect = selectedRect(state);
    dispatch(addColumn(state.tr, rect, rect.right, defaultCellAttrs));
  }
  return true;
}

/**
 * @public
 */
export function removeColumn(
  tr: Transaction,
  { map, table, tableStart }: TableRect,
  col: number
) {
  const mapStart = tr.mapping.maps.length;
  for (let row = 0; row < map.height; ) {
    const index = row * map.width + col;
    const pos = map.map[index];
    const cell = table.nodeAt(pos)!;
    const attrs = cell.attrs as CellAttrs;
    // If this is part of a col-spanning cell
    if (
      (col > 0 && map.map[index - 1] == pos) ||
      (col < map.width - 1 && map.map[index + 1] == pos)
    ) {
      tr.setNodeMarkup(
        tr.mapping.slice(mapStart).map(tableStart + pos),
        null,
        removeColSpan(attrs, col - map.colCount(pos))
      );
    } else {
      const start = tr.mapping.slice(mapStart).map(tableStart + pos);
      tr.delete(start, start + cell.nodeSize);
    }
    row += attrs.rowspan;
  }
}

/**
 * Command function that removes the selected columns from a table.
 *
 * @public
 */
export function deleteColumn(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  if (!isInTable(state)) return false;
  if (dispatch) {
    const rect = selectedRect(state);
    const tr = state.tr;
    if (rect.left == 0 && rect.right == rect.map.width) return false;
    for (let i = rect.right - 1; ; i--) {
      removeColumn(tr, rect, i);
      if (i == rect.left) break;
      const table = rect.tableStart
        ? tr.doc.nodeAt(rect.tableStart - 1)
        : tr.doc;
      if (!table) {
        throw RangeError("No table found");
      }
      rect.table = table;
      rect.map = TableMap.get(table);
    }
    dispatch(tr);
  }
  return true;
}

/**
 * @public
 */
export function rowIsHeader(map: TableMap, table: Node, row: number): boolean {
  const headerCell = tableNodeTypes(table.type.schema).header_cell;
  for (let col = 0; col < map.width; col++)
    if (table.nodeAt(map.map[col + row * map.width])?.type != headerCell)
      return false;
  return true;
}

/**
 * @public
 */
export function addRow(
  tr: Transaction,
  { map, tableStart, table }: TableRect,
  row: number,
  defaultCellAttrs?: { colwidth?: number[] }
): Transaction {
  let rowPos = tableStart;
  for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize;
  const cells = [];
  let refRow: number | null = row > 0 ? -1 : 0;
  if (rowIsHeader(map, table, row + refRow))
    refRow = row == 0 || row == map.height ? null : 0;
  for (let col = 0, index = map.width * row; col < map.width; col++, index++) {
    // Covered by a rowspan cell
    if (
      row > 0 &&
      row < map.height &&
      map.map[index] == map.map[index - map.width]
    ) {
      const pos = map.map[index];
      const attrs = table.nodeAt(pos)!.attrs;
      tr.setNodeMarkup(tableStart + pos, null, {
        ...attrs,
        rowspan: attrs.rowspan + 1
      });
      col += attrs.colspan - 1;
    } else {
      const type =
        refRow == null
          ? tableNodeTypes(table.type.schema).cell
          : table.nodeAt(map.map[index + refRow * map.width])?.type;
      const node = type?.createAndFill(defaultCellAttrs);
      if (node) cells.push(node);
    }
  }
  tr.insert(rowPos, tableNodeTypes(table.type.schema).row.create(null, cells));
  return tr;
}

/**
 * Add a table row before the selection.
 *
 * @public
 */
export function addRowBefore(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  defaultCellAttrs?: { colwidth?: number[] }
): boolean {
  if (!isInTable(state)) return false;
  if (dispatch) {
    const rect = selectedRect(state);
    dispatch(addRow(state.tr, rect, rect.top, defaultCellAttrs));
  }
  return true;
}

/**
 * Add a table row after the selection.
 *
 * @public
 */
export function addRowAfter(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  defaultCellAttrs?: { colwidth?: number[] }
): boolean {
  if (!isInTable(state)) return false;
  if (dispatch) {
    const rect = selectedRect(state);
    dispatch(addRow(state.tr, rect, rect.bottom, defaultCellAttrs));
  }
  return true;
}

/**
 * @public
 */
export function removeRow(
  tr: Transaction,
  { map, table, tableStart }: TableRect,
  row: number
): void {
  let rowPos = 0;
  for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize;
  const nextRow = rowPos + table.child(row).nodeSize;

  const mapFrom = tr.mapping.maps.length;
  tr.delete(rowPos + tableStart, nextRow + tableStart);

  const seen = new Set<number>();

  for (let col = 0, index = row * map.width; col < map.width; col++, index++) {
    const pos = map.map[index];

    // Skip cells that are checked already
    if (seen.has(pos)) continue;
    seen.add(pos);

    if (row > 0 && pos == map.map[index - map.width]) {
      // If this cell starts in the row above, simply reduce its rowspan
      const attrs = table.nodeAt(pos)!.attrs as CellAttrs;
      tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + tableStart), null, {
        ...attrs,
        rowspan: attrs.rowspan - 1
      });
      col += attrs.colspan - 1;
    } else if (row < map.height && pos == map.map[index + map.width]) {
      // Else, if it continues in the row below, it has to be moved down
      const cell = table.nodeAt(pos)!;
      const attrs = cell.attrs as CellAttrs;
      const copy = cell.type.create(
        { ...attrs, rowspan: cell.attrs.rowspan - 1 },
        cell.content
      );
      const newPos = map.positionAt(row + 1, col, table);
      tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), copy);
      col += attrs.colspan - 1;
    }
  }
}

/**
 * Remove the selected rows from a table.
 *
 * @public
 */
export function deleteRow(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  if (!isInTable(state)) return false;
  if (dispatch) {
    const rect = selectedRect(state),
      tr = state.tr;
    if (rect.top == 0 && rect.bottom == rect.map.height) return false;
    for (let i = rect.bottom - 1; ; i--) {
      removeRow(tr, rect, i);
      if (i == rect.top) break;
      const table = rect.tableStart
        ? tr.doc.nodeAt(rect.tableStart - 1)
        : tr.doc;
      if (!table) {
        throw RangeError("No table found");
      }
      rect.table = table;
      rect.map = TableMap.get(rect.table);
    }
    dispatch(tr);
  }
  return true;
}

function isEmpty(cell: Node): boolean {
  const c = cell.content;

  return (
    c.childCount == 1 && c.child(0).isTextblock && c.child(0).childCount == 0
  );
}

function cellsOverlapRectangle({ width, height, map }: TableMap, rect: Rect) {
  let indexTop = rect.top * width + rect.left,
    indexLeft = indexTop;
  let indexBottom = (rect.bottom - 1) * width + rect.left,
    indexRight = indexTop + (rect.right - rect.left - 1);
  for (let i = rect.top; i < rect.bottom; i++) {
    if (
      (rect.left > 0 && map[indexLeft] == map[indexLeft - 1]) ||
      (rect.right < width && map[indexRight] == map[indexRight + 1])
    )
      return true;
    indexLeft += width;
    indexRight += width;
  }
  for (let i = rect.left; i < rect.right; i++) {
    if (
      (rect.top > 0 && map[indexTop] == map[indexTop - width]) ||
      (rect.bottom < height && map[indexBottom] == map[indexBottom + width])
    )
      return true;
    indexTop++;
    indexBottom++;
  }
  return false;
}

/**
 * Merge the selected cells into a single cell. Only available when
 * the selected cells' outline forms a rectangle.
 *
 * @public
 */
export function mergeCells(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const sel = state.selection;
  if (
    !(sel instanceof CellSelection) ||
    sel.$anchorCell.pos == sel.$headCell.pos
  )
    return false;
  const rect = selectedRect(state),
    { map } = rect;
  if (cellsOverlapRectangle(map, rect)) return false;
  if (dispatch) {
    const tr = state.tr;
    const seen: Record<number, boolean> = {};
    let content = Fragment.empty;
    let mergedPos: number | undefined;
    let mergedCell: Node | undefined;
    for (let row = rect.top; row < rect.bottom; row++) {
      for (let col = rect.left; col < rect.right; col++) {
        const cellPos = map.map[row * map.width + col];
        const cell = rect.table.nodeAt(cellPos);
        if (seen[cellPos] || !cell) continue;
        seen[cellPos] = true;
        if (mergedPos == null) {
          mergedPos = cellPos;
          mergedCell = cell;
        } else {
          if (!isEmpty(cell)) content = content.append(cell.content);
          const mapped = tr.mapping.map(cellPos + rect.tableStart);
          tr.delete(mapped, mapped + cell.nodeSize);
        }
      }
    }
    if (mergedPos == null || mergedCell == null) {
      return true;
    }

    tr.setNodeMarkup(mergedPos + rect.tableStart, null, {
      ...addColSpan(
        mergedCell.attrs as CellAttrs,
        mergedCell.attrs.colspan,
        rect.right - rect.left - mergedCell.attrs.colspan
      ),
      rowspan: rect.bottom - rect.top
    });
    if (content.size) {
      const end = mergedPos + 1 + mergedCell.content.size;
      const start = isEmpty(mergedCell) ? mergedPos + 1 : end;
      tr.replaceWith(start + rect.tableStart, end + rect.tableStart, content);
    }
    tr.setSelection(
      new CellSelection(tr.doc.resolve(mergedPos + rect.tableStart))
    );
    dispatch(tr);
  }
  return true;
}

/**
 * Split a selected cell, whose rowpan or colspan is greater than one,
 * into smaller cells. Use the first cell type for the new cells.
 *
 * @public
 */
export function splitCell(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const nodeTypes = tableNodeTypes(state.schema);
  return splitCellWithType(({ node }) => {
    return nodeTypes[node.type.spec.tableRole as TableRole];
  })(state, dispatch);
}

/**
 * @public
 */
export interface GetCellTypeOptions {
  node: Node;
  row: number;
  col: number;
}

/**
 * Split a selected cell, whose rowpan or colspan is greater than one,
 * into smaller cells with the cell type (th, td) returned by getType function.
 *
 * @public
 */
export function splitCellWithType(
  getCellType: (options: GetCellTypeOptions) => NodeType
): Command {
  return (state, dispatch) => {
    const sel = state.selection;
    let cellNode: Node | null | undefined;
    let cellPos: number | undefined;
    if (!(sel instanceof CellSelection)) {
      cellNode = cellWrapping(sel.$from);
      if (!cellNode) return false;
      cellPos = cellAround(sel.$from)?.pos;
    } else {
      if (sel.$anchorCell.pos != sel.$headCell.pos) return false;
      cellNode = sel.$anchorCell.nodeAfter;
      cellPos = sel.$anchorCell.pos;
    }
    if (cellNode == null || cellPos == null) {
      return false;
    }
    if (cellNode.attrs.colspan == 1 && cellNode.attrs.rowspan == 1) {
      return false;
    }
    if (dispatch) {
      let baseAttrs = cellNode.attrs;
      const attrs = [];
      const colwidth = baseAttrs.colwidth;
      if (baseAttrs.rowspan > 1) baseAttrs = { ...baseAttrs, rowspan: 1 };
      if (baseAttrs.colspan > 1) baseAttrs = { ...baseAttrs, colspan: 1 };
      const rect = selectedRect(state),
        tr = state.tr;
      for (let i = 0; i < rect.right - rect.left; i++)
        attrs.push(
          colwidth
            ? {
                ...baseAttrs,
                colwidth: colwidth && colwidth[i] ? [colwidth[i]] : null
              }
            : baseAttrs
        );
      let lastCell;
      for (let row = rect.top; row < rect.bottom; row++) {
        let pos = rect.map.positionAt(row, rect.left, rect.table);
        if (row == rect.top) pos += cellNode.nodeSize;
        for (let col = rect.left, i = 0; col < rect.right; col++, i++) {
          if (col == rect.left && row == rect.top) continue;
          tr.insert(
            (lastCell = tr.mapping.map(pos + rect.tableStart, 1)),
            getCellType({ node: cellNode, row, col }).createAndFill(attrs[i])!
          );
        }
      }
      tr.setNodeMarkup(
        cellPos,
        getCellType({ node: cellNode, row: rect.top, col: rect.left }),
        attrs[0]
      );
      if (sel instanceof CellSelection)
        tr.setSelection(
          new CellSelection(
            tr.doc.resolve(sel.$anchorCell.pos),
            lastCell ? tr.doc.resolve(lastCell) : undefined
          )
        );
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Returns a command that sets the given attribute to the given value,
 * and is only available when the currently selected cell doesn't
 * already have that attribute set to that value.
 *
 * @public
 */
export function setCellAttr(name: string, value: unknown): Command {
  return function (state, dispatch) {
    if (!isInTable(state)) return false;
    const $cell = selectionCell(state);
    if ($cell.nodeAfter!.attrs[name] === value) return false;
    if (dispatch) {
      const tr = state.tr;
      if (state.selection instanceof CellSelection)
        state.selection.forEachCell((node, pos) => {
          if (node.attrs[name] !== value)
            tr.setNodeMarkup(pos, null, {
              ...node.attrs,
              [name]: value
            });
        });
      else
        tr.setNodeMarkup($cell.pos, null, {
          ...$cell.nodeAfter!.attrs,
          [name]: value
        });
      dispatch(tr);
    }
    return true;
  };
}

function deprecated_toggleHeader(type: ToggleHeaderType): Command {
  return function (state, dispatch) {
    if (!isInTable(state)) return false;
    if (dispatch) {
      const types = tableNodeTypes(state.schema);
      const rect = selectedRect(state),
        tr = state.tr;
      const cells = rect.map.cellsInRect(
        type == "column"
          ? {
              left: rect.left,
              top: 0,
              right: rect.right,
              bottom: rect.map.height
            }
          : type == "row"
          ? {
              left: 0,
              top: rect.top,
              right: rect.map.width,
              bottom: rect.bottom
            }
          : rect
      );
      const nodes = cells.map((pos) => rect.table.nodeAt(pos)!);
      for (
        let i = 0;
        i < cells.length;
        i++ // Remove headers, if any
      )
        if (nodes[i].type == types.header_cell)
          tr.setNodeMarkup(
            rect.tableStart + cells[i],
            types.cell,
            nodes[i].attrs
          );
      if (tr.steps.length == 0)
        for (
          let i = 0;
          i < cells.length;
          i++ // No headers removed, add instead
        )
          tr.setNodeMarkup(
            rect.tableStart + cells[i],
            types.header_cell,
            nodes[i].attrs
          );
      dispatch(tr);
    }
    return true;
  };
}

function isHeaderEnabledByType(
  type: "row" | "column",
  rect: TableRect,
  types: Record<string, NodeType>
): boolean {
  // Get cell positions for first row or first column
  const cellPositions = rect.map.cellsInRect({
    left: 0,
    top: 0,
    right: type == "row" ? rect.map.width : 1,
    bottom: type == "column" ? rect.map.height : 1
  });

  for (let i = 0; i < cellPositions.length; i++) {
    const cell = rect.table.nodeAt(cellPositions[i]);
    if (cell && cell.type !== types.header_cell) {
      return false;
    }
  }

  return true;
}

/**
 * @public
 */
export type ToggleHeaderType = "column" | "row" | "cell";

/**
 * Toggles between row/column header and normal cells (Only applies to first row/column).
 * For deprecated behavior pass `useDeprecatedLogic` in options with true.
 *
 * @public
 */
export function toggleHeader(
  type: ToggleHeaderType,
  options?: { useDeprecatedLogic: boolean } | undefined
): Command {
  options = options || { useDeprecatedLogic: false };

  if (options.useDeprecatedLogic) return deprecated_toggleHeader(type);

  return function (state, dispatch) {
    if (!isInTable(state)) return false;
    if (dispatch) {
      const types = tableNodeTypes(state.schema);
      const rect = selectedRect(state),
        tr = state.tr;

      const isHeaderRowEnabled = isHeaderEnabledByType("row", rect, types);
      const isHeaderColumnEnabled = isHeaderEnabledByType(
        "column",
        rect,
        types
      );

      const isHeaderEnabled =
        type === "column"
          ? isHeaderRowEnabled
          : type === "row"
          ? isHeaderColumnEnabled
          : false;

      const selectionStartsAt = isHeaderEnabled ? 1 : 0;

      const cellsRect =
        type == "column"
          ? {
              left: 0,
              top: selectionStartsAt,
              right: 1,
              bottom: rect.map.height
            }
          : type == "row"
          ? {
              left: selectionStartsAt,
              top: 0,
              right: rect.map.width,
              bottom: 1
            }
          : rect;

      const newType =
        type == "column"
          ? isHeaderColumnEnabled
            ? types.cell
            : types.header_cell
          : type == "row"
          ? isHeaderRowEnabled
            ? types.cell
            : types.header_cell
          : types.cell;

      rect.map.cellsInRect(cellsRect).forEach((relativeCellPos) => {
        const cellPos = relativeCellPos + rect.tableStart;
        const cell = tr.doc.nodeAt(cellPos);

        if (cell) {
          tr.setNodeMarkup(cellPos, newType, cell.attrs);
        }
      });

      dispatch(tr);
    }
    return true;
  };
}

/**
 * Toggles whether the selected row contains header cells.
 *
 * @public
 */
export const toggleHeaderRow: Command = toggleHeader("row", {
  useDeprecatedLogic: true
});

/**
 * Toggles whether the selected column contains header cells.
 *
 * @public
 */
export const toggleHeaderColumn: Command = toggleHeader("column", {
  useDeprecatedLogic: true
});

/**
 * Toggles whether the selected cells are header cells.
 *
 * @public
 */
export const toggleHeaderCell: Command = toggleHeader("cell", {
  useDeprecatedLogic: true
});

function findNextCell($cell: ResolvedPos, dir: Direction): number | null {
  if (dir < 0) {
    const before = $cell.nodeBefore;
    if (before) return $cell.pos - before.nodeSize;
    for (
      let row = $cell.index(-1) - 1, rowEnd = $cell.before();
      row >= 0;
      row--
    ) {
      const rowNode = $cell.node(-1).child(row);
      const lastChild = rowNode.lastChild;
      if (lastChild) {
        return rowEnd - 1 - lastChild.nodeSize;
      }
      rowEnd -= rowNode.nodeSize;
    }
  } else {
    if ($cell.index() < $cell.parent.childCount - 1) {
      return $cell.pos + $cell.nodeAfter!.nodeSize;
    }
    const table = $cell.node(-1);
    for (
      let row = $cell.indexAfter(-1), rowStart = $cell.after();
      row < table.childCount;
      row++
    ) {
      const rowNode = table.child(row);
      if (rowNode.childCount) return rowStart + 1;
      rowStart += rowNode.nodeSize;
    }
  }
  return null;
}

/**
 * Returns a command for selecting the next (direction=1) or previous
 * (direction=-1) cell in a table.
 *
 * @public
 */
export function goToNextCell(direction: Direction): Command {
  return function (state, dispatch) {
    if (!isInTable(state)) return false;
    const cell = findNextCell(selectionCell(state), direction);
    if (cell == null) return false;
    if (dispatch) {
      const $cell = state.doc.resolve(cell);
      dispatch(
        state.tr
          .setSelection(TextSelection.between($cell, moveCellForward($cell)))
          .scrollIntoView()
      );
    }
    return true;
  };
}

/**
 * Deletes the table around the selection, if any.
 *
 * @public
 */
export function deleteTable(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const $pos = state.selection.$anchor;
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    if (node.type.spec.tableRole == "table") {
      if (dispatch)
        dispatch(
          state.tr.delete($pos.before(d), $pos.after(d)).scrollIntoView()
        );
      return true;
    }
  }
  return false;
}

/**
 * Deletes the content of the selected cells, if they are not empty.
 *
 * @public
 */
export function deleteCellSelection(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const sel = state.selection;
  if (!(sel instanceof CellSelection)) return false;
  if (dispatch) {
    const tr = state.tr;
    const baseContent = tableNodeTypes(state.schema).cell.createAndFill()!
      .content;
    sel.forEachCell((cell, pos) => {
      if (!cell.content.eq(baseContent))
        tr.replace(
          tr.mapping.map(pos + 1),
          tr.mapping.map(pos + cell.nodeSize - 1),
          new Slice(baseContent, 0, 0)
        );
    });
    if (tr.docChanged) dispatch(tr);
  }
  return true;
}

/**
 * Options for moveTableRow
 *
 * @public
 */
export interface MoveTableRowOptions {
  /**
   * The source row index to move from.
   */
  from: number;

  /**
   * The destination row index to move to.
   */
  to: number;

  /**
   * Whether to select the moved row after the operation.
   *
   * @default true
   */
  select?: boolean;

  /**
   * Optional position to resolve table from. If not provided, uses the current selection.
   */
  pos?: number;
}

/**
 * Move a table row from index `from` to index `to`.
 *
 * @public
 */
export function moveTableRow(options: MoveTableRowOptions): Command {
  return (state, dispatch) => {
    const {
      from: originIndex,
      to: targetIndex,
      select = true,
      pos = state.selection.from
    } = options;
    const tr = state.tr;
    if (moveRow({ tr, originIndex, targetIndex, select, pos })) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };
}

/**
 * Options for moveTableColumn
 *
 * @public
 */
export interface MoveTableColumnOptions {
  /**
   * The source column index to move from.
   */
  from: number;

  /**
   * The destination column index to move to.
   */
  to: number;

  /**
   * Whether to select the moved column after the operation.
   *
   * @default true
   */
  select?: boolean;

  /**
   * Optional position to resolve table from. If not provided, uses the current selection.
   */
  pos?: number;
}

/**
 * Move a table column from index `from` to index `to`.
 *
 * @public
 */
export function moveTableColumn(options: MoveTableColumnOptions): Command {
  return (state, dispatch) => {
    const {
      from: originIndex,
      to: targetIndex,
      select = true,
      pos = state.selection.from
    } = options;
    const tr = state.tr;
    if (moveColumn({ tr, originIndex, targetIndex, select, pos })) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };
}
