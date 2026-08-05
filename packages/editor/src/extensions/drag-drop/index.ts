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
const NEST_THRESHOLD = 40;
const NEST_INDENT = 24;
// distance from the edge of the scroller at which auto scrolling starts
const SCROLL_ZONE = 60;
const SCROLL_SPEED = 12;
// how far below a list the pointer can be and still drop into its last slot
const LIST_SLOP = 24;

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
  // a task list is made of list items, so the gap is one too
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
  /** the list reads right to left, so nesting is a drag to the left */
  rtl: boolean;
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
  // the handle has no tap action of its own, so cancelling the default is
  // safe — and on touch it is what stops the WebView from starting a text
  // selection instead of the drag
  if (event.cancelable) event.preventDefault();

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

    const rtl = getComputedStyle(item).direction === "rtl";
    const { preview, row } = createPreview(view, item, box);
    preview.style.direction = rtl ? "rtl" : "ltr";
    drag = {
      item,
      pos,
      end: pos + node.nodeSize,
      offsetY: box.top - event.clientY,
      height: row.getBoundingClientRect().height,
      startX: event.clientX,
      rtl,
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

    // undefined means "leave the gap as it is"; null clears it, so a drop
    // outside any task list has no target and is cancelled
    const target = findGap(view, state, e.clientX, e.clientY, top);
    if (target !== undefined) {
      state.gap = target ?? undefined;
      setGap(view, target);
    }
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
    // NOTE: on `window`, not the handle. The handle is re-rendered whenever
    // the gap moves (a decoration change re-renders the node views), and
    // listeners on the old element would be lost — the drag would freeze.
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", cleanup);
    if (!drag) return;
    cancelAnimationFrame(drag.frame ?? 0);
    drag.preview.remove();
    drag.item.style.removeProperty("display");
    document.body.style.removeProperty("user-select");
    setGap(view, null);
    drag = undefined;
  };

  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", cleanup);
  if (event.pointerType !== "mouse")
    hold = setTimeout(start, HOLD_DELAY) as unknown as number;
}

/**
 * A copy of the item that follows the pointer, with its nested items left
 * out so that tall items stay easy to place.
 */
function createPreview(view: EditorView, item: HTMLElement, box: DOMRect) {
  const preview = document.createElement("div");
  preview.className = "drag-preview";
  preview.style.left = `${box.left}px`;
  preview.style.width = `${box.width}px`;

  const context = document.createElement("div");
  context.className = view.dom.className;
  // `.ProseMirror:first-child` adds a top margin to the editor content; the
  // wrapper is not that, so drop it or the card gains a top gap
  context.style.margin = "0";
  preview.appendChild(context);

  const list = (item.parentElement ?? document.createElement("ul")).cloneNode(
    false
  ) as HTMLElement;
  list.style.margin = list.style.padding = "0";
  context.appendChild(list);

  const clone = item.cloneNode(true) as HTMLElement;
  clone.style.margin = "0";
  // the handle is what is being held, not part of the item, so leave it out
  // of the copy — otherwise it takes up an empty slot on the start side
  clone.querySelector("[data-drag-handle]")?.remove();
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

  (view.dom.parentElement ?? document.body).appendChild(preview);
  return { preview, row: clone };
}

/**
 * Where the item would land: the sibling top edge nearest to the top edge
 * of the item being dragged, within the task list under the pointer. The
 * gap counts as one of those edges, which is what keeps it in place while
 * the item is over it — moving it would move everything below it, putting a
 * different edge under the item, and it would flicker between the two.
 *
 * Returns `undefined` to leave the gap where it is (the pointer is over the
 * item itself, or off the document for a frame), and `null` to clear it —
 * a task item only drops into a task list, so anywhere else is cancelled.
 *
 * The list is found under the pointer (`pointerY`), but the slot within it
 * from the item's own top edge (`top`). The item's top rises above the list
 * before the pointer does, so hit testing with the pointer is what lets the
 * item reach the very first slot.
 */
function findGap(
  view: EditorView,
  drag: Drag,
  x: number,
  pointerY: number,
  top: number
): DropGap | null | undefined {
  const hx = Math.max(x, view.dom.getBoundingClientRect().left + 1);

  // The list under the pointer, or the item's top (the handle is grabbed
  // near the top, so they are close).
  let list = listAt(view, hx, pointerY) ?? listAt(view, hx, top);

  // ...but a list ending just above the point wins if it is deeper. This is
  // how the last slot is reached: past the last row the point is over the
  // parent, yet dropping there should land the item after the nested list's
  // last row, not after the whole parent.
  const above = listAbove(view, hx, Math.max(pointerY, top));
  if (above && (!list || list.contains(above))) list = above;

  if (!list) {
    // off the document for a frame (keep the gap) vs. genuinely elsewhere
    const element = document.elementFromPoint(hx, pointerY);
    return !element || !view.dom.contains(element) ? undefined : null;
  }

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

  if (closest === null) return null;
  // dropping the item into itself is a no-op: leave the gap alone
  if (closest > drag.pos && closest < drag.end) return undefined;

  const toEnd = drag.rtl ? drag.startX - x : x - drag.startX;
  const nest = toEnd > NEST_THRESHOLD && canNest(view, closest, drag);
  return { pos: closest, height: drag.height, indent: nest ? NEST_INDENT : 0 };
}

/**
 * The task list at the given point, if any. When the point is on a list's
 * header (the tools bar sits above the first item, outside the `ul`) it
 * still resolves to that list, so the item can be dropped into its first
 * slot.
 */
function listAt(view: EditorView, x: number, y: number) {
  const element = document.elementFromPoint(x, y);
  if (!element || !view.dom.contains(element)) return null;

  const list =
    element.closest<HTMLElement>("ul.tasklist-content-wrapper") ||
    element
      .closest(".taskList-view-content-wrap")
      ?.querySelector<HTMLElement>("ul.tasklist-content-wrapper");
  return list && view.dom.contains(list) ? list : null;
}

/**
 * The task list whose bottom edge is just above `y` (within a slop) —
 * nothing is under the point past the last row, so this is what makes the
 * last slot reachable there. The deepest such list wins, so the last slot
 * of a nested list is preferred to its parent's.
 *
 * `x` is not used to pick the list: the handle sits at the far left, well
 * left of an indented nested list, and a note is a single column anyway —
 * only that the point is not off to the right of the list.
 */
function listAbove(view: EditorView, x: number, y: number) {
  let match: HTMLElement | null = null;
  let matchTop = -Infinity;
  const lists = view.dom.querySelectorAll<HTMLElement>(
    "ul.tasklist-content-wrapper"
  );
  for (const list of lists) {
    const r = list.getBoundingClientRect();
    if (x > r.right) continue;
    if (y < r.bottom || y > r.bottom + LIST_SLOP) continue;
    // the deepest (lowest starting) list wins
    if (r.top > matchTop) {
      matchTop = r.top;
      match = list;
    }
  }
  return match;
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
  const { state } = view;
  const item = state.doc.nodeAt(from);
  if (!item) return null;

  if (to === from || to === from + item.nodeSize) return from;

  // NOTE: `deleteRange`, not `delete`: taking the only child out of a
  // nested list leaves the list empty, and an empty list is not valid
  // content, so it would be filled with a blank item. This takes the list
  // itself away instead.
  const tr = state.tr.deleteRange(from, from + item.nodeSize);
  const at = Math.min(tr.mapping.map(to), tr.doc.content.size);

  // the target is always a task list, but guard anyway: dropping the item
  // where it does not fit would put it somewhere unexpected
  const $at = tr.doc.resolve(at);
  if (!$at.parent.canReplaceWith($at.index(), $at.index(), item.type))
    return null;

  const steps = tr.steps.length;
  tr.replaceRangeWith(at, at, item);

  if (tr.steps.length === steps) return null;

  // select the item, but only if it really landed where we think it did:
  // NodeSelection throws if there is no node right after `at`
  const node = tr.doc.resolve(at).nodeAfter;
  if (node?.type === item.type) {
    tr.setSelection(NodeSelection.create(tr.doc, at));
  }

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
    if (node.scrollHeight <= node.clientHeight) continue;
    if (/auto|scroll/.test(getComputedStyle(node).overflowY)) return node;
  }
  return null;
}
