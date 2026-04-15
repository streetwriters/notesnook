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
  isTouchEvent,
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
  } else if (!startDOMCell) {
    // Not in a cell, let the default behavior happen.
    return;
  }

  if (isTouchEvent(startEvent)) {
    // For touch, only begin tracking cross-cell selection if the touch started
    // inside the cell that already holds the active cursor/selection. Any other
    // touch is a scroll or plain tap — leave it alone.
    // Use ProseMirror cell positions rather than DOM containment so the check
    // is robust regardless of what domAtPos returns (text node, <p>, etc.).
    const $selectionCell = cellAround(view.state.selection.$anchor);
    const $touchedCell = cellUnderMouse(view, startEvent);
    if (
      !$selectionCell ||
      !$touchedCell ||
      $selectionCell.pos !== $touchedCell.pos ||
      !view.state.selection.empty
    )
      return;
  }

  // Auto-scroll state for touch cell selection. While the user is dragging a
  // cell selection, normal scroll is suppressed (event.preventDefault). Instead
  // we watch how close the finger is to the edges of the nearest scrollable
  // ancestor and scroll that container programmatically.
  const SCROLL_THRESHOLD = 40; // px from edge before scroll kicks in
  const SCROLL_MAX_SPEED = 4; // px per animation frame at the very edge
  let autoScrollRAF: number | null = null;
  let autoScrollX = 0;
  let autoScrollY = 0;
  let scrollTarget: Element | null = null;

  function scrollStep(): void {
    autoScrollRAF = null;
    if (!scrollTarget) return;
    const rect = scrollTarget.getBoundingClientRect();
    const leftDist = autoScrollX - rect.left;
    const rightDist = rect.right - autoScrollX;
    const topDist = autoScrollY - rect.top;
    const bottomDist = rect.bottom - autoScrollY;
    const dx =
      leftDist < SCROLL_THRESHOLD
        ? -SCROLL_MAX_SPEED * (1 - leftDist / SCROLL_THRESHOLD)
        : rightDist < SCROLL_THRESHOLD
        ? SCROLL_MAX_SPEED * (1 - rightDist / SCROLL_THRESHOLD)
        : 0;
    const dy =
      topDist < SCROLL_THRESHOLD
        ? -SCROLL_MAX_SPEED * (1 - topDist / SCROLL_THRESHOLD)
        : bottomDist < SCROLL_THRESHOLD
        ? SCROLL_MAX_SPEED * (1 - bottomDist / SCROLL_THRESHOLD)
        : 0;
    if (dx !== 0 || dy !== 0) {
      scrollTarget.scrollBy(dx, dy);
      autoScrollRAF = requestAnimationFrame(scrollStep);
    }
  }

  function updateAutoScroll(x: number, y: number): void {
    autoScrollX = x;
    autoScrollY = y;
    if (!scrollTarget)
      // Walk up from the starting cell, not from view.dom. The table's scroll
      // container (.scroll-bar) is an ancestor of the <td>, whereas view.dom is
      // the editor root which sits *inside* the scroll container — walking up
      // from it would skip past the table scroller and find the page scroller.
      scrollTarget = findScrollableAncestor(startDOMCell ?? view.dom);
    // Only schedule a new frame if one isn't already pending.
    if (autoScrollRAF == null)
      autoScrollRAF = requestAnimationFrame(scrollStep);
  }

  function stopAutoScroll(): void {
    if (autoScrollRAF != null) {
      cancelAnimationFrame(autoScrollRAF);
      autoScrollRAF = null;
    }
    scrollTarget = null;
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
  function stop(event?: Event): void {
    view.root.removeEventListener("mouseup", stop);
    view.root.removeEventListener("dragstart", stop);
    view.root.removeEventListener("mousemove", move);
    view.root.removeEventListener("touchmove", move);
    view.root.removeEventListener("touchend", stop);
    view.root.removeEventListener("touchcancel", stop);
    const hadActiveSelection = tableEditingKey.getState(view.state) != null;
    stopAutoScroll();
    if (hadActiveSelection) {
      (view as any).domObserver.suppressSelectionUpdates();
      view.dispatch(view.state.tr.setMeta(tableEditingKey, -1));
    }
    // Prevent native drag-and-drop from moving/deleting selected text when the
    // browser interprets a cell-selection drag as a text drag (Bug: content
    // becomes empty). Also prevent the browser's synthetic tap after a
    // touch-based cell selection from collapsing the CellSelection back to a
    // text cursor in the last touched cell (Bug: cell selection disappears).
    if (
      event &&
      (event.type === "dragstart" ||
        (event.type === "touchend" && hadActiveSelection))
    ) {
      event.preventDefault();
    }
  }

  function move(_event: Event): void {
    const event = _event as MouseEvent | DragEvent | TouchEvent;

    // For touch: we've already committed this gesture to cell-selection tracking
    // (the guard at touchstart ensured that). Suppress the browser scroll on
    // every touchmove — this must happen here because:
    //   a) touchstart preventDefault is ignored when registered as passive (the
    //      default on most mobile browsers for ProseMirror's event dispatch), and
    //   b) our own touchmove listener is registered with { passive: false } so
    //      preventDefault() here is guaranteed to work.
    if (isTouchEvent(event)) {
      event.preventDefault();
      // Always feed the current finger position to auto-scroll regardless of
      // whether a cross-cell selection has started yet. This must be outside the
      // branch below because once tableEditingKey has state (anchor != null) we
      // no longer enter the isTouchEvent branch, so coordinates would go stale.
      const x = getClientX(event);
      const y = getClientY(event);
      if (x != null && y != null) updateAutoScroll(x, y);
    }

    const anchor = tableEditingKey.getState(view.state);
    let $anchor;
    if (anchor != null) {
      // Continuing an existing cross-cell selection
      $anchor = view.state.doc.resolve(anchor);
    } else if (isTouchEvent(event)) {
      // For touch events, event.target stays fixed at the touchstart element,
      // so use coordinates to detect movement into a different cell.
      const $startCell = cellUnderMouse(view, startEvent);
      const $currentCell = cellUnderMouse(view, event);
      if ($startCell && $currentCell && $startCell.pos !== $currentCell.pos) {
        $anchor = $startCell;
      }
    } else if (domInCell(view, event.target as Node) != startDOMCell) {
      // Moving out of the initial cell -- start a new cell selection
      $anchor = cellUnderMouse(view, startEvent);
      if (!$anchor) return stop();
    }
    if ($anchor) {
      // For mouse: prevent native drag-and-drop from interfering.
      if (!isTouchEvent(event)) event.preventDefault();
      setCellSelection($anchor, event);
    }
  }

  view.root.addEventListener("mouseup", stop);
  view.root.addEventListener("dragstart", stop);
  view.root.addEventListener("mousemove", move);
  // { passive: false } is required for touchmove/touchend so that
  // event.preventDefault() inside the handlers actually suppresses scroll.
  // Without it, modern browsers treat the listener as passive by default and
  // silently ignore any preventDefault() calls.
  view.root.addEventListener("touchmove", move, { passive: false });
  view.root.addEventListener("touchend", stop, { passive: false });
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

function findScrollableAncestor(el: HTMLElement | Node): Element {
  return (
    el.parentElement?.closest(".scroll-bar") ||
    document.scrollingElement ||
    document.documentElement
  );
}
