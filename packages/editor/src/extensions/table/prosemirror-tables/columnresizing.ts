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

import { Attrs, Node as ProsemirrorNode } from "prosemirror-model";
import { EditorState, Plugin, PluginKey, Transaction } from "prosemirror-state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  NodeView
} from "prosemirror-view";
import { tableNodeTypes } from "./schema.js";
import { TableMap } from "./tablemap.js";
import { TableView, updateColumnsOnResize } from "./tableview.js";
import { cellAround, CellAttrs, getClientX, isTouchEvent } from "./util.js";

/**
 * @public
 */
export const columnResizingPluginKey = new PluginKey<ResizeState>(
  "tableColumnResizing"
);

/**
 * @public
 */
export type ColumnResizingOptions = {
  /**
   * Minimum width of a cell /column. The column cannot be resized smaller than this.
   */
  cellMinWidth?: number;
  /**
   * The default minWidth of a cell / column when it doesn't have an explicit width (i.e.: it has not been resized manually)
   */
  defaultCellMinWidth?: number;
  /**
   * A custom node view for the rendering table nodes. By default, the plugin
   * uses the {@link TableView} class. You can explicitly set this to `null` to
   * not use a custom node view.
   */
  View?:
    | (new (
        node: ProsemirrorNode,
        cellMinWidth: number,
        view: EditorView
      ) => NodeView)
    | null;
  showResizeHandleOnSelection?: boolean;
};

/**
 * @public
 */
export type Dragging = { startX: number; startWidth: number };

/**
 * @public
 */
export function columnResizing({
  cellMinWidth = 25,
  defaultCellMinWidth = 100,
  View = TableView,
  showResizeHandleOnSelection = false
}: ColumnResizingOptions = {}): Plugin {
  const plugin = new Plugin<ResizeState>({
    key: columnResizingPluginKey,
    state: {
      init(_, state) {
        const nodeViews = plugin.spec?.props?.nodeViews;
        const tableName = tableNodeTypes(state.schema).table.name;
        if (View && nodeViews) {
          nodeViews[tableName] = (node, view) => {
            return new View(node, defaultCellMinWidth, view);
          };
        }

        return { dragging: false, decorations: DecorationSet.empty };
      },
      apply(tr, prev, _, state) {
        return createResizeState(tr, state, prev, showResizeHandleOnSelection);
      }
    },
    props: {
      handleDOMEvents: {
        touchstart: (view, event) => {
          handleMouseDown(view, event, cellMinWidth, defaultCellMinWidth);
        },
        mousedown: (view, event) => {
          handleMouseDown(view, event, cellMinWidth, defaultCellMinWidth);
        }
      },

      decorations: (state) => {
        const pluginState = columnResizingPluginKey.getState(state);
        return pluginState?.decorations || DecorationSet.empty;
      },

      nodeViews: {}
    }
  });
  return plugin;
}

type ResizeState = {
  dragging: Dragging | false;
  decorations: DecorationSet;
};

function createResizeState(
  tr: Transaction,
  state: EditorState,
  prevState: ResizeState,
  showResizeHandleOnSelection: boolean
): ResizeState {
  const action = tr.getMeta(columnResizingPluginKey);
  const copy: ResizeState = { ...prevState };
  copy.decorations = tr.docChanged
    ? copy.decorations.map(tr.mapping, tr.doc)
    : copy.decorations;

  if (!copy.dragging) {
    const cell = edgeCell(state, state.selection.from, "right");
    if (cell === -1) {
      copy.decorations = DecorationSet.empty;
    } else {
      const handles = createColumnResizeHandles(
        state,
        cell,
        prevState,
        showResizeHandleOnSelection
      );
      if (handles) {
        copy.decorations = handles;
      }
    }
  }

  if (action && action.setDragging !== undefined)
    copy.dragging = action.setDragging;
  return copy;
}

function handleMouseDown(
  view: EditorView,
  event: MouseEvent | TouchEvent,
  cellMinWidth: number,
  defaultCellMinWidth: number
): boolean {
  const win = view.dom.ownerDocument.defaultView ?? window;

  const pluginState = columnResizingPluginKey.getState(view.state);
  if (!pluginState || pluginState.dragging) return false;

  if (
    event.target instanceof Element &&
    event.target.closest(".column-resize-handle") == null
  ) {
    console.log("No handle target");
    return false;
  }

  const clientX = getClientX(event);
  if (clientX === null) return false;

  const activeHandle = edgeCell(
    view.state,
    view.posAtDOM(event.target as Node, 0),
    "right"
  );
  const cell = view.state.doc.nodeAt(activeHandle);
  if (!cell) {
    console.log("No cell at handle");
    return false;
  }

  const width = currentColWidth(view, activeHandle, cell.attrs);
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, {
      setDragging: { startX: clientX, startWidth: width }
    })
  );

  function finish(event: MouseEvent | TouchEvent) {
    win.removeEventListener("mouseup", finish);
    win.removeEventListener("mousemove", move);
    win.removeEventListener("touchend", finish);
    win.removeEventListener("touchcancel", finish);
    win.removeEventListener("touchmove", move);

    const clientX = getClientX(event);
    if (clientX === null) {
      console.log("No clientX on finish", event);
      return;
    }

    const pluginState = columnResizingPluginKey.getState(view.state);
    if (pluginState?.dragging) {
      if (isTouchEvent(event)) (view as any).domObserver.connectSelection();
      updateColumnWidth(
        view,
        activeHandle,
        draggedWidth(pluginState.dragging, clientX, cellMinWidth)
      );
      view.dispatch(
        view.state.tr.setMeta(columnResizingPluginKey, { setDragging: null })
      );
    }
  }

  function move(event: MouseEvent | TouchEvent): void {
    if (event instanceof MouseEvent && !event.which) return finish(event);
    const clientX = getClientX(event);
    if (clientX === null) return;
    const pluginState = columnResizingPluginKey.getState(view.state);
    if (pluginState?.dragging) {
      const dragged = draggedWidth(pluginState.dragging, clientX, cellMinWidth);
      displayColumnWidth(view, activeHandle, dragged, defaultCellMinWidth);
    }
  }

  displayColumnWidth(view, activeHandle, width, defaultCellMinWidth);

  win.addEventListener("mouseup", finish);
  win.addEventListener("mousemove", move);
  win.addEventListener("touchend", finish);
  win.addEventListener("touchcancel", finish);
  win.addEventListener("touchmove", move);
  event.preventDefault();
  if (isTouchEvent(event)) (view as any).domObserver.disconnectSelection();
  return true;
}

function currentColWidth(
  view: EditorView,
  cellPos: number,
  { colspan, colwidth }: Attrs
): number {
  const width = colwidth && colwidth[colwidth.length - 1];
  if (width) return width;
  const dom = view.domAtPos(cellPos);
  const node = dom.node.childNodes[dom.offset] as HTMLElement;
  let domWidth = node.offsetWidth,
    parts = colspan;
  if (colwidth)
    for (let i = 0; i < colspan; i++)
      if (colwidth[i]) {
        domWidth -= colwidth[i];
        parts--;
      }
  return domWidth / parts;
}

function edgeCell(
  state: EditorState,
  pos: number,
  side: "left" | "right"
): number {
  const $cell = cellAround(state.doc.resolve(pos));
  if (!$cell) return -1;
  if (side == "right") return $cell.pos;
  const map = TableMap.get($cell.node(-1)),
    start = $cell.start(-1);
  const index = map.map.indexOf($cell.pos - start);
  return index % map.width == 0 ? -1 : start + map.map[index - 1];
}

function draggedWidth(
  dragging: Dragging,
  clientX: number,
  resizeMinWidth: number
): number {
  const offset = clientX - dragging.startX;
  return Math.max(resizeMinWidth, dragging.startWidth + offset);
}

function updateColumnWidth(
  view: EditorView,
  cell: number,
  width: number
): void {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    map = TableMap.get(table),
    start = $cell.start(-1);
  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan - 1;
  const tr = view.state.tr;
  for (let row = 0; row < map.height; row++) {
    const mapIndex = row * map.width + col;
    // Rowspanning cell that has already been handled
    if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) continue;
    const pos = map.map[mapIndex];
    const attrs = table.nodeAt(pos)!.attrs as CellAttrs;
    const index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
    if (attrs.colwidth && attrs.colwidth[index] == width) continue;
    const colwidth = attrs.colwidth
      ? attrs.colwidth.slice()
      : zeroes(attrs.colspan);
    colwidth[index] = width;
    tr.setNodeAttribute(start + pos, "colwidth", colwidth);
  }
  if (tr.docChanged) view.dispatch(tr);
}

function displayColumnWidth(
  view: EditorView,
  cell: number,
  width: number,
  defaultCellMinWidth: number
): void {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    start = $cell.start(-1);
  const col =
    TableMap.get(table).colCount($cell.pos - start) +
    $cell.nodeAfter!.attrs.colspan -
    1;
  let dom: Node | null = view.domAtPos($cell.start(-1)).node;
  while (dom && dom.nodeName != "TABLE") {
    dom = dom.parentNode;
  }
  if (!dom) return;
  const tableElement = dom as HTMLTableElement;
  updateColumnsOnResize(
    table,
    dom.firstChild as HTMLTableColElement,
    tableElement,
    defaultCellMinWidth,
    col,
    width
  );
}

function zeroes(n: number): 0[] {
  return Array(n).fill(0);
}

export function createColumnResizeHandles(
  state: EditorState,
  activeCellPos: number,
  resizeState: ResizeState,
  showResizeHandleOnSelection: boolean
): DecorationSet | null {
  if (activeCellPos === -1) return null;
  const decorations = [];
  const activeCell = state.doc.resolve(activeCellPos);
  const table = activeCell.node(-1);
  if (!table) return null;

  const map = TableMap.get(table);
  const start = activeCell.start(-1);
  const totalCells = map.height * map.width;
  const cellIndex = map.map.indexOf(activeCell.pos - start);

  const oldDecorations = resizeState.decorations.find();
  if (oldDecorations.length === totalCells) {
    const activeCellDecoration = oldDecorations.find(
      (c) => c.spec.index === cellIndex
    );
    if (!activeCellDecoration?.spec.active && showResizeHandleOnSelection) {
      const oldActiveIndex = oldDecorations.findIndex((d) => d.spec.active);
      const oldActive = oldDecorations[oldActiveIndex];
      if (oldActive)
        oldDecorations[oldActiveIndex] = Decoration.widget(
          oldActive.from,
          createResizeHandle(false),
          {
            active: false,
            index: oldActive.spec.index
          }
        );

      oldDecorations[cellIndex] = Decoration.widget(
        oldDecorations[cellIndex].from,
        createResizeHandle(true),
        {
          active: true,
          index: cellIndex
        }
      );

      return DecorationSet.create(state.doc, oldDecorations);
    }

    return null;
  }

  for (let i = 0; i < totalCells; i++) {
    const cellPos = map.map[i];
    const pos = start + cellPos + table.nodeAt(cellPos)!.nodeSize - 1;
    decorations.push(
      Decoration.widget(
        pos,
        createResizeHandle(showResizeHandleOnSelection && cellIndex === i),
        {
          active: showResizeHandleOnSelection && cellIndex === i,
          index: i
        }
      )
    );
  }
  return DecorationSet.create(state.doc, decorations);
}

function createResizeHandle(active: boolean) {
  const dom = document.createElement("div");
  dom.className = "column-resize-handle";
  if (active) dom.classList.add("active");
  dom.onmouseenter = () => {
    dom.classList.add("active");
  };
  dom.onmouseleave = () => {
    dom.classList.remove("active");
  };
  return dom;
}
