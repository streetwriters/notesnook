// This file defines a number of helpers for wiring up user input to
// table-related functionality.

import { keydownHandler } from "prosemirror-keymap";
import { Fragment, ResolvedPos, Slice } from "prosemirror-model";
import {
  Command,
  EditorState,
  Selection,
  TextSelection,
  Transaction
} from "prosemirror-state";

import { EditorView } from "prosemirror-view";
import { CellSelection } from "./cellselection.js";
import { deleteCellSelection } from "./commands.js";
import { clipCells, fitSlice, insertCells, pastedCells } from "./copypaste.js";
import { tableNodeTypes } from "./schema.js";
import { TableMap } from "./tablemap.js";
import {
  cellAround,
  getClientX,
  getClientY,
  inSameTable,
  isInTable,
  nextCell,
  selectionCell,
  tableEditingKey
} from "./util.js";
import { columnResizingPluginKey } from "./columnresizing.js";

type Axis = "horiz" | "vert";

/**
 * @public
 */
export type Direction = -1 | 1;

export const handleKeyDown = keydownHandler({
  ArrowLeft: arrow("horiz", -1),
  ArrowRight: arrow("horiz", 1),
  ArrowUp: arrow("vert", -1),
  ArrowDown: arrow("vert", 1),

  "Shift-ArrowLeft": shiftArrow("horiz", -1),
  "Shift-ArrowRight": shiftArrow("horiz", 1),
  "Shift-ArrowUp": shiftArrow("vert", -1),
  "Shift-ArrowDown": shiftArrow("vert", 1),

  Backspace: deleteCellSelection,
  "Mod-Backspace": deleteCellSelection,
  Delete: deleteCellSelection,
  "Mod-Delete": deleteCellSelection
});

function maybeSetSelection(
  state: EditorState,
  dispatch: undefined | ((tr: Transaction) => void),
  selection: Selection
): boolean {
  if (selection.eq(state.selection)) return false;
  if (dispatch) dispatch(state.tr.setSelection(selection).scrollIntoView());
  return true;
}

/**
 * @internal
 */
export function arrow(axis: Axis, dir: Direction): Command {
  return (state, dispatch, view) => {
    if (!view) return false;
    const sel = state.selection;
    if (sel instanceof CellSelection) {
      return maybeSetSelection(
        state,
        dispatch,
        Selection.near(sel.$headCell, dir)
      );
    }
    if (axis != "horiz" && !sel.empty) return false;
    const end = atEndOfCell(view, axis, dir);
    if (end == null) return false;
    if (axis == "horiz") {
      return maybeSetSelection(
        state,
        dispatch,
        Selection.near(state.doc.resolve(sel.head + dir), dir)
      );
    } else {
      const $cell = state.doc.resolve(end);
      const $next = nextCell($cell, axis, dir);
      let newSel;
      if ($next) newSel = Selection.near($next, 1);
      else if (dir < 0)
        newSel = Selection.near(state.doc.resolve($cell.before(-1)), -1);
      else newSel = Selection.near(state.doc.resolve($cell.after(-1)), 1);
      return maybeSetSelection(state, dispatch, newSel);
    }
  };
}

function shiftArrow(axis: Axis, dir: Direction): Command {
  return (state, dispatch, view) => {
    if (!view) return false;
    const sel = state.selection;
    let cellSel: CellSelection;
    if (sel instanceof CellSelection) {
      cellSel = sel;
    } else {
      const end = atEndOfCell(view, axis, dir);
      if (end == null) return false;
      cellSel = new CellSelection(state.doc.resolve(end));
    }

    const $head = nextCell(cellSel.$headCell, axis, dir);
    if (!$head) return false;
    return maybeSetSelection(
      state,
      dispatch,
      new CellSelection(cellSel.$anchorCell, $head)
    );
  };
}

export function handleTripleClick(view: EditorView, pos: number): boolean {
  const doc = view.state.doc,
    $cell = cellAround(doc.resolve(pos));
  if (!$cell) return false;
  view.dispatch(view.state.tr.setSelection(new CellSelection($cell)));
  return true;
}

/**
 * @public
 */
export function handlePaste(
  view: EditorView,
  _: ClipboardEvent,
  slice: Slice
): boolean {
  if (!isInTable(view.state)) return false;
  let cells = pastedCells(slice);
  const sel = view.state.selection;
  if (sel instanceof CellSelection) {
    if (!cells)
      cells = {
        width: 1,
        height: 1,
        rows: [
          Fragment.from(fitSlice(tableNodeTypes(view.state.schema).cell, slice))
        ]
      };
    const table = sel.$anchorCell.node(-1);
    const start = sel.$anchorCell.start(-1);
    const rect = TableMap.get(table).rectBetween(
      sel.$anchorCell.pos - start,
      sel.$headCell.pos - start
    );
    cells = clipCells(cells, rect.right - rect.left, rect.bottom - rect.top);
    insertCells(view.state, view.dispatch, start, rect, cells);
    return true;
  } else if (cells) {
    const $cell = selectionCell(view.state);
    const start = $cell.start(-1);
    insertCells(
      view.state,
      view.dispatch,
      start,
      TableMap.get($cell.node(-1)).findCell($cell.pos - start),
      cells
    );
    return true;
  } else {
    return false;
  }
}

export function handleMouseDown(
  view: EditorView,
  startEvent: MouseEvent | TouchEvent
): void {
  if (startEvent.ctrlKey || startEvent.metaKey) return;
  if (columnResizingPluginKey.getState(view.state)?.dragging) return;

  const startDOMCell = domInCell(view, startEvent.target as Node);
  let $anchor;
  if (startEvent.shiftKey && view.state.selection instanceof CellSelection) {
    // Adding to an existing cell selection
    setCellSelection(view.state.selection.$anchorCell, startEvent);
    startEvent.preventDefault();
  } else if (
    startEvent.shiftKey &&
    startDOMCell &&
    ($anchor = cellAround(view.state.selection.$anchor)) != null &&
    cellUnderMouse(view, startEvent)?.pos != $anchor.pos
  ) {
    // Adding to a selection that starts in another cell (causing a
    // cell selection to be created).
    setCellSelection($anchor, startEvent);
    startEvent.preventDefault();
  } else if (startEvent instanceof TouchEvent) {
    const selectedCell = view.domAtPos(view.state.selection.from).node;
    if (startDOMCell?.contains(selectedCell)) {
      $anchor = cellUnderMouse(view, startEvent);
      if (!$anchor) return;
      setCellSelection($anchor, startEvent);
    }
  } else if (!startDOMCell) {
    // Not in a cell, let the default behavior happen.
    return;
  }

  // Create and dispatch a cell selection between the given anchor and
  // the position under the mouse.
  function setCellSelection(
    $anchor: ResolvedPos,
    event: MouseEvent | DragEvent | TouchEvent
  ): void {
    let $head = cellUnderMouse(view, event);
    const starting = tableEditingKey.getState(view.state) == null;
    if (!$head || !inSameTable($anchor, $head)) {
      if (starting) $head = $anchor;
      else return;
    }
    const selection = new CellSelection($anchor, $head);
    if (starting || !view.state.selection.eq(selection)) {
      const tr = view.state.tr.setSelection(selection);
      if (starting) tr.setMeta(tableEditingKey, $anchor.pos);
      view.dispatch(tr);
    }
  }

  // Stop listening to mouse motion events.
  function stop(): void {
    view.root.removeEventListener("mouseup", stop);
    view.root.removeEventListener("dragstart", stop);
    view.root.removeEventListener("mousemove", move);
    view.root.removeEventListener("touchmove", move);
    view.root.removeEventListener("touchend", stop);
    view.root.removeEventListener("touchcancel", stop);
    if (tableEditingKey.getState(view.state) != null) {
      (view as any).domObserver.suppressSelectionUpdates();
      view.dispatch(view.state.tr.setMeta(tableEditingKey, -1));
    }
  }

  function move(_event: Event): void {
    const event = _event as MouseEvent | DragEvent | TouchEvent;
    const anchor = tableEditingKey.getState(view.state);
    let $anchor;
    if (anchor != null) {
      // Continuing an existing cross-cell selection
      $anchor = view.state.doc.resolve(anchor);
    } else if (domInCell(view, event.target as Node) != startDOMCell) {
      // Moving out of the initial cell -- start a new cell selection
      $anchor = cellUnderMouse(view, startEvent);
      if (!$anchor) return stop();
    }
    if ($anchor) setCellSelection($anchor, event);
  }

  view.root.addEventListener("mouseup", stop);
  view.root.addEventListener("dragstart", stop);
  view.root.addEventListener("mousemove", move);
  view.root.addEventListener("touchmove", move);
  view.root.addEventListener("touchend", stop);
  view.root.addEventListener("touchcancel", stop);
}

// Check whether the cursor is at the end of a cell (so that further
// motion would move out of the cell)
function atEndOfCell(view: EditorView, axis: Axis, dir: number): null | number {
  if (!(view.state.selection instanceof TextSelection)) return null;
  const { $head } = view.state.selection;
  for (let d = $head.depth - 1; d >= 0; d--) {
    const parent = $head.node(d),
      index = dir < 0 ? $head.index(d) : $head.indexAfter(d);
    if (index != (dir < 0 ? 0 : parent.childCount)) return null;
    if (
      parent.type.spec.tableRole == "cell" ||
      parent.type.spec.tableRole == "header_cell"
    ) {
      const cellPos = $head.before(d);
      const dirStr: "up" | "down" | "left" | "right" =
        axis == "vert" ? (dir > 0 ? "down" : "up") : dir > 0 ? "right" : "left";
      return view.endOfTextblock(dirStr) ? cellPos : null;
    }
  }
  return null;
}

function domInCell(view: EditorView, dom: Node | null): Node | null {
  for (; dom && dom != view.dom; dom = dom.parentNode) {
    if (dom.nodeName == "TD" || dom.nodeName == "TH") {
      return dom;
    }
  }
  return null;
}

function cellUnderMouse(
  view: EditorView,
  event: MouseEvent | DragEvent | TouchEvent
): ResolvedPos | null {
  const clientX = getClientX(event);
  const clientY = getClientY(event);
  if (clientX == null || clientY == null) return null;

  const mousePos = view.posAtCoords({
    left: clientX,
    top: clientY
  });
  if (!mousePos) return null;
  return mousePos ? cellAround(view.state.doc.resolve(mousePos.pos)) : null;
}
