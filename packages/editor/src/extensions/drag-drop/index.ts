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

import { Editor, Extension } from "@tiptap/core";
import { NodeSelection, Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { isAndroid, isiOS } from "../../utils/platform.js";

/**
 * Drags a node by its `[data-drag-handle]` with pointer events instead of
 * the browser's HTML5 drag & drop, which on iOS and Android loses the
 * gesture to text selection and in Firefox never starts inside
 * `contenteditable` at all. The drop target is a real gap in the document,
 * so the content moves apart the way it will once the node is dropped.
 *
 * NOTE: only task list items use this so far, see their component.
 */
export const DragDrop = Extension.create({
  name: "dragDrop",
  addProseMirrorPlugins: () => [dropGapPlugin()]
});

const DROP_GAP_CLASS = "drop-gap";
// how far the pointer has to move before this is a drag and not a tap, or
// how long it has to stay down without moving (touch only)
const DRAG_THRESHOLD = 4;
const HOLD_DELAY = 150;
// how far to the right the pointer travels to nest the item, and by how
// much the gap is indented to show it
const NEST_THRESHOLD = 60;
const NEST_INDENT = 24;
// distance from the edge of the scroller at which auto scrolling starts
const SCROLL_ZONE = 60;
const SCROLL_SPEED = 12;

type DropGap = { pos: number; height: number; indent: number };
const gapKey = new PluginKey<DropGap | null>("drop-gap");

function dropGapPlugin() {
  return new Plugin<DropGap | null>({
    key: gapKey,
    state: {
      init: () => null,
      apply: (tr, value) => {
        const meta = tr.getMeta(gapKey);
        return meta === undefined ? value : meta;
      }
    },
    props: {
      decorations(state) {
        const gap = gapKey.getState(state);
        if (!gap || gap.pos > state.doc.content.size) return null;
        return DecorationSet.create(state.doc, [
          Decoration.widget(gap.pos, () => createGap(gap), {
            side: -1,
            ignoreSelection: true,
            key: `drop-gap-${gap.pos}`
          })
        ]);
      }
    }
  });
}

function createGap({ height, indent }: DropGap) {
  const element = document.createElement("li");
  element.className = DROP_GAP_CLASS;
  element.contentEditable = "false";
  element.style.marginInlineStart = `${indent}px`;
  element.style.height = "0px";
  requestAnimationFrame(() => (element.style.height = `${height}px`));
  return element;
}

function setGap(view: EditorView, gap: DropGap | null) {
  const current = gapKey.getState(view.state);
  if (current === gap) return;
  if (current && gap && current.pos === gap.pos) {
    const element = view.dom.querySelector<HTMLElement>(`.${DROP_GAP_CLASS}`);
    if (element) {
      element.style.marginInlineStart = `${gap.indent}px`;
      current.indent = gap.indent;
      return;
    }
  }
  view.dispatch(view.state.tr.setMeta(gapKey, gap));
}

type Drag = {
  item: HTMLElement;
  pos: number;
  end: number;
  /** where the item's top edge is, relative to the pointer */
  offsetY: number;
  /** measured before the item is hidden, when it still has a size */
  height: number;
  startX: number;
  gap?: DropGap;
  preview: HTMLElement;
  /** what the preview is currently as wide as */
  previewWidth: number;
  scroller: HTMLElement | null;
  frame?: number;
};

/**
 * Picks up the task item at `getPos` and moves it wherever it is dropped.
 */
export function startItemDrag(
  editor: Editor,
  getPos: () => number,
  event: PointerEvent
) {
  const handle = event.currentTarget as HTMLElement;
  const item = handle.closest<HTMLElement>("li");
  if (!editor.isEditable || event.button !== 0 || !item) return;

  event.stopPropagation();
  if (event.pointerType === "mouse") event.preventDefault();

  const { view } = editor;
  let drag: Drag | undefined;
  let hold: number | undefined;

  const start = () => {
    clearTimeout(hold);
    if (drag) return drag;

    const pos = getPos();
    const node = pos >= 0 && view.state.doc.nodeAt(pos);
    if (!node) return undefined;

    view.dispatch(
      view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos))
    );
    if (isAndroid || isiOS) setTimeout(() => editor.commands.blur());

    const box = item.getBoundingClientRect();
    const { preview, row } = createPreview(view, item, box);
    drag = {
      item,
      pos,
      end: pos + node.nodeSize,
      offsetY: box.top - event.clientY,
      height: row.getBoundingClientRect().height,
      startX: event.clientX,
      preview,
      previewWidth: box.width,
      scroller: getScroller(view.dom)
    };

    item.style.display = "none";
    document.body.style.setProperty("user-select", "none");
    return drag;
  };

  const move = (e: PointerEvent) => {
    const state =
      drag ??
      (Math.hypot(e.clientX - event.clientX, e.clientY - event.clientY) <
      DRAG_THRESHOLD
        ? undefined
        : start());
    if (!state) return;
    e.preventDefault();
    const top = e.clientY + state.offsetY;
    state.preview.style.transform = `translate3d(0, ${top}px, 0)`;

    const target = findGap(view, state, e.clientX, top);
    if (target) setGap(view, (state.gap = target));
    fitPreview(view, state);
    autoScroll(state, e.clientY);
  };

  const end = () => {
    const dropped = drag;
    cleanup();
    if (!dropped?.gap) return;

    const at = moveItem(view, dropped.pos, dropped.gap.pos);
    if (at !== null && dropped.gap.indent) nestItem(editor, at);
  };

  const cleanup = () => {
    clearTimeout(hold);
    handle.removeEventListener("pointermove", move);
    handle.removeEventListener("pointerup", end);
    handle.removeEventListener("pointercancel", cleanup);
    if (!drag) return;
    cancelAnimationFrame(drag.frame ?? 0);
    drag.preview.remove();
    drag.item.style.removeProperty("display");
    document.body.style.removeProperty("user-select");
    setGap(view, null);
    drag = undefined;
  };

  handle.setPointerCapture?.(event.pointerId);
  handle.addEventListener("pointermove", move, { passive: false });
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", cleanup);
  if (event.pointerType !== "mouse")
    hold = setTimeout(start, HOLD_DELAY) as unknown as number;
}

/**
 * A copy of the item that follows the pointer, with its nested items left
 * out so that tall items stay easy to place.
 */
function createPreview(view: EditorView, item: HTMLElement, box: DOMRect) {
  const style = getComputedStyle(item);
  const preview = document.createElement("div");
  preview.className = `drag-preview ${view.dom.className}`;
  preview.style.left = `${box.left}px`;
  preview.style.width = `${box.width}px`;
  preview.style.font = style.font;
  preview.style.color = style.color;

  const list = (item.parentElement ?? document.createElement("ul")).cloneNode(
    false
  ) as HTMLElement;
  list.style.margin = list.style.padding = "0";
  preview.appendChild(list);

  const clone = item.cloneNode(true) as HTMLElement;
  clone.style.margin = "0";
  let children = 0;
  clone.querySelectorAll("ul, ol").forEach((nested) => {
    children += nested.querySelectorAll("li").length;
    (nested.closest("[class$='-view-content-wrap']") ?? nested).remove();
  });
  if (children) {
    const badge = document.createElement("span");
    badge.className = "drag-preview-badge";
    badge.textContent = `+${children}`;
    clone.appendChild(badge);
  }
  list.appendChild(clone);

  document.body.appendChild(preview);
  return { preview, row: clone };
}

/**
 * Where the item would land: the sibling top edge nearest to the top edge
 * of the item being dragged. The gap counts as one of those edges, which
 * is what keeps it in place while the item is over it — moving it would
 * move everything below it, putting a different edge under the item, and
 * it would flicker between the two.
 */
function findGap(view: EditorView, drag: Drag, x: number, top: number) {
  const element = document.elementFromPoint(
    Math.max(x, view.dom.getBoundingClientRect().left + 1),
    top
  );
  const list = element?.closest("ul");
  if (!list || !view.dom.contains(list)) return drag.gap ?? null;

  let closest: number | null = null;
  let distance = Infinity;
  const consider = (edge: number, pos: number) => {
    if (Math.abs(edge - top) >= distance) return;
    distance = Math.abs(edge - top);
    closest = pos;
  };

  const children = Array.from(list.children) as HTMLElement[];
  for (const child of children) {
    const box = child.getBoundingClientRect();
    if (!box.height) continue;
    if (child.classList.contains(DROP_GAP_CLASS)) {
      if (drag.gap) consider(box.top, drag.gap.pos);
      continue;
    }

    const pos = posOf(view, child);
    if (pos === null) continue;
    consider(box.top, pos.before);
    if (child === children.at(-1)) consider(box.bottom, pos.after);
  }

  if (closest === null || (closest > drag.pos && closest < drag.end))
    return drag.gap ?? null;

  const nest = x - drag.startX > NEST_THRESHOLD && canNest(view, closest, drag);
  return { pos: closest, height: drag.height, indent: nest ? NEST_INDENT : 0 };
}

/** the item is as wide as the gap it will land in, and as indented */
function fitPreview(view: EditorView, drag: Drag) {
  const box = view.dom
    .querySelector(`.${DROP_GAP_CLASS}`)
    ?.getBoundingClientRect();
  if (!box?.width || box.width === drag.previewWidth) return;

  drag.previewWidth = box.width;
  drag.preview.style.left = `${box.left}px`;
  drag.preview.style.width = `${box.width}px`;
}

/** the positions around the node `element` renders */
function posOf(view: EditorView, element: HTMLElement) {
  try {
    const $pos = view.state.doc.resolve(view.posAtDOM(element, 0));
    for (let depth = $pos.depth; depth > 0; depth--)
      if (view.nodeDOM($pos.before(depth)) === element)
        return { before: $pos.before(depth), after: $pos.after(depth) };
  } catch (e) {
    // the element is not part of the document (yet)
  }
  return null;
}

/** an item can only nest under a sibling it will still have once moved */
function canNest(view: EditorView, pos: number, drag: Drag) {
  const $pos = view.state.doc.resolve(pos);
  let at = $pos.start();
  for (let index = 0; index < $pos.index(); index++) {
    if (at !== drag.pos) return true;
    at += $pos.parent.child(index).nodeSize;
  }
  return false;
}

/** moves the item at `from` to `to`, returning where it ended up */
function moveItem(view: EditorView, from: number, to: number) {
  const item = view.state.doc.nodeAt(from);
  if (!item) return null;

  const tr = view.state.tr.deleteRange(from, from + item.nodeSize);
  const at = tr.mapping.map(to);
  const deleted = tr.doc;

  tr.replaceRangeWith(at, at, item);
  if (tr.doc.eq(deleted)) return null;
  if (tr.doc.eq(view.state.doc)) return at;

  tr.setSelection(NodeSelection.create(tr.doc, at));
  view.dispatch(tr.setMeta("uiEvent", "drop"));
  return at;
}

function nestItem(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (node)
    editor
      .chain()
      .setTextSelection(pos + 1)
      .sinkListItem(node.type.name)
      .run();
}

/** dragging past the edge of the note scrolls it */
function autoScroll(drag: Drag, y: number) {
  const box = drag.scroller?.getBoundingClientRect();
  const top = (box?.top ?? 0) + SCROLL_ZONE;
  const bottom = (box?.bottom ?? window.innerHeight) - SCROLL_ZONE;
  const speed = y < top ? -SCROLL_SPEED : y > bottom ? SCROLL_SPEED : 0;

  cancelAnimationFrame(drag.frame ?? 0);
  if (!speed) return;
  const step = () => {
    (drag.scroller ?? window).scrollBy(0, speed);
    drag.frame = requestAnimationFrame(step);
  };
  drag.frame = requestAnimationFrame(step);
}

function getScroller(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (/auto|scroll/.test(overflowY) && node.scrollHeight > node.clientHeight)
      return node;
  }
  return null;
}
