import { Attrs, Node as ProsemirrorNode } from "prosemirror-model";
import { EditorState, Plugin, PluginKey, Transaction } from "prosemirror-state";
import {
  Decoration,
  DecorationSet,
  DecorationSource,
  EditorView,
  NodeView
} from "prosemirror-view";
import { tableNodeTypes } from "./schema.js";
import { TableMap } from "./tablemap.js";
import { TableView, updateColumnsOnResize } from "./tableview.js";
import { cellAround, CellAttrs, getClientX, pointsAtCell } from "./util.js";

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
  handleWidth?: number;
  /**
   * Minimum width of a cell /column. The column cannot be resized smaller than this.
   */
  cellMinWidth?: number;
  /**
   * The default minWidth of a cell / column when it doesn't have an explicit width (i.e.: it has not been resized manually)
   */
  defaultCellMinWidth?: number;
  lastColumnResizable?: boolean;
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
};

/**
 * @public
 */
export type Dragging = { startX: number; startWidth: number };

/**
 * @public
 */
export function columnResizing({
  handleWidth = 5,
  cellMinWidth = 25,
  defaultCellMinWidth = 100,
  View = TableView,
  lastColumnResizable = true
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
        return new ResizeState(-1, false, DecorationSet.empty);
      },
      apply(tr, prev) {
        return prev.apply(tr);
      }
    },
    view() {
      return {
        update(view) {
          showResizeHandle(view, lastColumnResizable);
        }
      };
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

/**
 * @public
 */
export class ResizeState {
  constructor(
    public activeHandle: number,
    public dragging: Dragging | false,
    public decorations: DecorationSource
  ) {}

  apply(tr: Transaction): ResizeState {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const state = this;
    const action = tr.getMeta(columnResizingPluginKey);
    if (action && action.setHandle != null)
      return new ResizeState(
        action.setHandle,
        false,
        state.decorations.map(tr.mapping, tr.doc)
      );
    if (action && action.setDragging !== undefined)
      return new ResizeState(
        state.activeHandle,
        action.setDragging,
        state.decorations.map(tr.mapping, tr.doc)
      );
    if (action && action.setDecorations !== undefined) {
      return new ResizeState(
        state.activeHandle,
        state.dragging,
        action.setDecorations.map(tr.mapping, tr.doc)
      );
    }
    if (state.activeHandle > -1 && tr.docChanged) {
      let handle = tr.mapping.map(state.activeHandle, -1);
      if (!pointsAtCell(tr.doc.resolve(handle))) {
        handle = -1;
      }
      return new ResizeState(
        handle,
        state.dragging,
        state.decorations.map(tr.mapping, tr.doc)
      );
    }
    return state;
  }
}

function handleMouseDown(
  view: EditorView,
  event: MouseEvent | TouchEvent,
  cellMinWidth: number,
  defaultCellMinWidth: number
): boolean {
  if (!view.editable) return false;

  const win = view.dom.ownerDocument.defaultView ?? window;

  const pluginState = columnResizingPluginKey.getState(view.state);
  if (!pluginState || pluginState.activeHandle == -1 || pluginState.dragging)
    return false;

  if (
    event.target instanceof HTMLElement &&
    event.target.closest(".column-resize-handle") == null
  ) {
    console.log("No handle target");
    return false;
  }

  const clientX = getClientX(event);
  if (clientX === null) return false;

  const cell = view.state.doc.nodeAt(pluginState.activeHandle)!;
  const width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
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

    const pluginState = columnResizingPluginKey.getState(view.state);

    const clientX = getClientX(event);
    if (clientX === null) {
      console.log("No clientX on finish", event);
      return;
    }

    if (pluginState?.dragging) {
      if (event instanceof TouchEvent)
        (view as any).domObserver.connectSelection();
      updateColumnWidth(
        view,
        pluginState.activeHandle,
        draggedWidth(pluginState.dragging, clientX, cellMinWidth)
      );
      view.dispatch(
        view.state.tr.setMeta(columnResizingPluginKey, { setDragging: null })
      );
    }
  }

  function move(event: MouseEvent | TouchEvent): void {
    if (event instanceof MouseEvent && !event.which) return finish(event);
    const pluginState = columnResizingPluginKey.getState(view.state);
    if (!pluginState) return;
    const clientX = getClientX(event);
    if (clientX === null) return;
    if (pluginState.dragging) {
      if (event instanceof TouchEvent)
        (view as any).domObserver.disconnectSelection();
      const dragged = draggedWidth(pluginState.dragging, clientX, cellMinWidth);
      displayColumnWidth(
        view,
        pluginState.activeHandle,
        dragged,
        defaultCellMinWidth
      );
    }
  }

  displayColumnWidth(
    view,
    pluginState.activeHandle,
    width,
    defaultCellMinWidth
  );

  win.addEventListener("mouseup", finish);
  win.addEventListener("mousemove", move);
  win.addEventListener("touchend", finish);
  win.addEventListener("touchcancel", finish);
  win.addEventListener("touchmove", move);
  event.preventDefault();
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
  view: EditorView,
  pos: number,
  side: "left" | "right"
): number {
  const $cell = cellAround(view.state.doc.resolve(pos));
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

function updateHandle(view: EditorView, value: number): void {
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, { setHandle: value })
  );
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, {
      setDecorations: handleDecorations(view.state, value)
    })
  );
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
    tr.setNodeMarkup(start + pos, null, { ...attrs, colwidth: colwidth });
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

export function handleDecorations(
  state: EditorState,
  cell: number
): DecorationSet {
  if (cell === -1) return DecorationSet.empty;
  const decorations = [];
  const $cell = state.doc.resolve(cell);
  const table = $cell.node(-1);
  if (!table) {
    return DecorationSet.empty;
  }
  const map = TableMap.get(table);
  const start = $cell.start(-1);
  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan - 1;
  const cellIndex = map.map.indexOf($cell.pos - start);
  for (let row = 0; row < map.height; row++) {
    const index = col + row * map.width;
    // For positions that have either a different cell or the end
    // of the table to their right, and either the top of the table or
    // a different cell above them, add a decoration
    if (
      (col == map.width - 1 || map.map[index] != map.map[index + 1]) &&
      (row == 0 || map.map[index] != map.map[index - map.width])
    ) {
      const cellPos = map.map[index];
      const pos = start + cellPos + table.nodeAt(cellPos)!.nodeSize - 1;
      const dom = document.createElement("div");
      dom.className = "column-resize-handle";
      if (cellIndex === index) dom.classList.add("active");
      if (columnResizingPluginKey.getState(state)?.dragging) {
        // decorations.push(
        //   Decoration.node(
        //     start + cellPos,
        //     start + cellPos + table.nodeAt(cellPos)!.nodeSize,
        //     {
        //       class: "column-resize-dragging"
        //     }
        //   )
        // );
        //  dom.classList.add("dragging");
      }
      decorations.push(Decoration.widget(pos, dom));
    }
  }
  return DecorationSet.create(state.doc, decorations);
}

function showResizeHandle(
  view: EditorView,
  lastColumnResizable?: boolean
): void {
  if (!view.editable) return;

  const pluginState = columnResizingPluginKey.getState(view.state);
  if (!pluginState) return;

  if (!pluginState.dragging) {
    let cell = edgeCell(view, view.state.selection.from, "right");
    if (cell != pluginState.activeHandle) {
      if (!lastColumnResizable && cell !== -1) {
        const $cell = view.state.doc.resolve(cell);
        const table = $cell.node(-1);
        const map = TableMap.get(table);
        const tableStart = $cell.start(-1);
        const col =
          map.colCount($cell.pos - tableStart) +
          $cell.nodeAfter!.attrs.colspan -
          1;

        if (col == map.width - 1) {
          return;
        }
      }

      updateHandle(view, cell);
    }
  }
}
