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

import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";
import { HeightMap } from "./height-map.js";
import { PAGE_NODE } from "./page.js";

export const viewportKey = new PluginKey<ViewportState>("notesnook-paging");

type ViewportState = {
  visible: Set<string>;
  selectionIndex: number;
  pageCount: number;
  decorations: DecorationSet;
};

type PageRange = { from: number; to: number; index: number };

const EMPTY_VISIBLE: Set<string> = new Set();

const pending = new WeakMap<EditorView, () => void>();
const calibrations = new WeakMap<EditorView, () => void>();

/** Sizes the empty pages without changing which pages are rendered. */
export function calibrateHeightsNow(view: EditorView): void {
  calibrations.get(view)?.();
}

/** Works out what is on screen now instead of waiting for the next frame. */
export function renderViewportNow(view: EditorView): void {
  pending.get(view)?.();
}
const SHOW_MARGIN = 1;
const KEEP_MARGIN = 1.5;
const RENDER_ATTRS = {};
const RENDER_SPEC = { render: true };

export function findScrollParent(node: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = node.parentElement;
  while (current) {
    const overflowY = getComputedStyle(current).overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

function shouldRender(
  node: ProsemirrorNode,
  index: number,
  lastIndex: number,
  visible: Set<string>,
  selectionIndex: number
): boolean {
  if (index === 0 || index === lastIndex) {
    return true;
  }
  if (Math.abs(index - selectionIndex) <= 1) {
    return true;
  }
  const blockId = node.attrs.blockId as string | undefined;
  if (!blockId) {
    return true;
  }
  if (visible.has(blockId)) {
    return true;
  }
  return false;
}

function renderDecoration(from: number, to: number): Decoration {
  return Decoration.node(from, to, RENDER_ATTRS, RENDER_SPEC);
}

/** Marks the pages that should be rendered. */
function buildDecorations(
  doc: ProsemirrorNode,
  visible: Set<string>,
  selectionIndex: number
): DecorationSet {
  const decorations: Decoration[] = [];
  const lastIndex = doc.childCount - 1;
  let index = -1;

  doc.forEach((node, offset) => {
    index++;
    if (node.type.name !== PAGE_NODE) return;
    if (!shouldRender(node, index, lastIndex, visible, selectionIndex)) return;
    decorations.push(renderDecoration(offset, offset + node.nodeSize));
  });

  const set = DecorationSet.create(doc, decorations);
  return set;
}

/** The pages around the caret, from the selection rather than a walk. */
function selectionRanges(state: EditorState): PageRange[] {
  const { $from } = state.selection;
  const doc = state.doc;
  const index = $from.index(0);
  if (index >= doc.childCount) return [];

  const start = $from.depth > 0 ? $from.before(1) : $from.pos;
  const node = doc.child(index);
  const ranges: PageRange[] = [];

  if (index > 0) {
    const previous = doc.child(index - 1);
    ranges.push({
      from: start - previous.nodeSize,
      to: start,
      index: index - 1
    });
  }
  ranges.push({ from: start, to: start + node.nodeSize, index });
  if (index < doc.childCount - 1) {
    const next = doc.child(index + 1);
    ranges.push({
      from: start + node.nodeSize,
      to: start + node.nodeSize + next.nodeSize,
      index: index + 1
    });
  }
  return ranges;
}

function hasRenderDecoration(set: DecorationSet, range: PageRange): boolean {
  return set
    .find(range.from, range.to)
    .some(
      (decoration) =>
        decoration.from === range.from &&
        decoration.to === range.to &&
        (decoration.spec as { render?: boolean })?.render
    );
}

/** Puts back render decorations that mapping dropped for the caret's page. */
function repairSelection(
  set: DecorationSet,
  state: EditorState
): DecorationSet {
  const missing: Decoration[] = [];
  for (const range of selectionRanges(state)) {
    if (state.doc.child(range.index).type.name !== PAGE_NODE) continue;
    if (hasRenderDecoration(set, range)) continue;
    missing.push(renderDecoration(range.from, range.to));
  }
  if (!missing.length) return set;

  return set.add(state.doc, missing);
}

export function viewportPlugin(heights: HeightMap): Plugin<ViewportState> {
  return new Plugin<ViewportState>({
    key: viewportKey,
    state: {
      init(_config, state) {
        const selectionIndex = state.selection.$from.index(0);
        return {
          visible: EMPTY_VISIBLE,
          selectionIndex,
          pageCount: state.doc.childCount,
          decorations: buildDecorations(
            state.doc,
            EMPTY_VISIBLE,
            selectionIndex
          )
        };
      },
      apply(tr, value, _oldState, newState) {
        const meta = tr.getMeta(viewportKey) as
          | { visible: Set<string> }
          | undefined;
        const visible = meta?.visible ?? value.visible;
        const selectionIndex = newState.selection.$from.index(0);
        const pageCount = tr.doc.childCount;

        const selectionMoved = selectionIndex !== value.selectionIndex;
        const pagesChanged = pageCount !== value.pageCount;

        if (!meta && !selectionMoved && !pagesChanged && !tr.docChanged) {
          return value;
        }

        if (meta || selectionMoved || pagesChanged) {
          return {
            visible,
            selectionIndex,
            pageCount,
            decorations: buildDecorations(tr.doc, visible, selectionIndex)
          };
        }

        const mapped = repairSelection(
          value.decorations.map(tr.mapping, tr.doc),
          newState
        );

        return { visible, selectionIndex, pageCount, decorations: mapped };
      }
    },
    props: {
      decorations(state) {
        return viewportKey.getState(state)?.decorations;
      }
    },
    view(editorView) {
      let frame = 0;
      let printing = false;
      let scrollParent: HTMLElement | null = null;
      const measuredPages = new Set<string>();

      const ensureScrollParent = () => {
        const resolved = findScrollParent(editorView.dom);
        if (!resolved || resolved === scrollParent) return;
        scrollParent?.removeEventListener("scroll", schedule);
        resolved.style.overflowAnchor = "none";
        resolved.addEventListener("scroll", schedule, { passive: true });
        scrollParent = resolved;
      };

      /** The first page reaching down to `y`, found by halving the page edges. */
      const firstPageBelow = (children: HTMLCollection, y: number): number => {
        let low = 0;
        let high = children.length - 1;
        let result = children.length - 1;
        while (low <= high) {
          const middle = (low + high) >> 1;
          const element = children[middle] as HTMLElement;
          if (element.getBoundingClientRect().bottom >= y) {
            result = middle;
            high = middle - 1;
          } else {
            low = middle + 1;
          }
        }
        return result;
      };

      /** Pages render a screen early and stop half a screen late. */
      const measure = (): Set<string> | undefined => {
        const children = editorView.dom.children;
        if (!children.length) return undefined;
        if (!editorView.dom.getBoundingClientRect().height) return undefined;

        const container = scrollParent;
        const bounds = container
          ? container.getBoundingClientRect()
          : { top: 0, height: window.innerHeight };
        const height = container ? container.clientHeight : bounds.height;
        if (!height) return undefined;

        const addTop = bounds.top - height * SHOW_MARGIN;
        const addBottom = bounds.top + height * (1 + SHOW_MARGIN);
        const keepTop = bounds.top - height * KEEP_MARGIN;
        const keepBottom = bounds.top + height * (1 + KEEP_MARGIN);

        const shown = viewportKey.getState(editorView.state)?.visible;
        const next = new Set<string>();
        for (
          let i = firstPageBelow(children, keepTop);
          i < children.length;
          i++
        ) {
          const element = children[i] as HTMLElement;
          const rect = element.getBoundingClientRect();
          if (rect.top > keepBottom) break;
          const pageId = element.getAttribute("data-block-id");
          if (!pageId) continue;
          if (
            (rect.bottom >= addTop && rect.top <= addBottom) ||
            shown?.has(pageId)
          )
            next.add(pageId);
        }
        return next;
      };

      /** The top page on screen, remembered so it can be found after a redraw. */
      const pinnedPage = (): { index: number; top: number } | undefined => {
        if (!scrollParent) return undefined;
        const children = editorView.dom.children;
        const fold = scrollParent.getBoundingClientRect().top;
        for (let i = firstPageBelow(children, fold); i < children.length; i++) {
          const rect = (children[i] as HTMLElement).getBoundingClientRect();
          if (rect.bottom > fold) return { index: i, top: rect.top };
        }
        return undefined;
      };

      /** Moves the scroll by however much the pinned page grew or shrank. */
      const restorePin = (pin?: { index: number; top: number }) => {
        if (!pin || !scrollParent) return;
        const element = editorView.dom.children[pin.index] as
          | HTMLElement
          | undefined;
        if (!element) return;
        const delta = element.getBoundingClientRect().top - pin.top;
        if (!delta) return;
        scrollParent.scrollTop += delta;
      };

      const flush = () => {
        frame = 0;
        if (printing) return;
        ensureScrollParent();
        const next = measure();
        if (!next) return;

        const current = viewportKey.getState(editorView.state)?.visible;
        if (current && sameSet(current, next)) {
          return;
        }


        const pin = pinnedPage();
        editorView.dispatch(
          editorView.state.tr
            .setMeta(viewportKey, { visible: next })
            .setMeta("preventUpdate", true)
            .setMeta("addToHistory", false)
        );
        restorePin(pin);
        updateMetrics();
        measureRenderedPages();
        resizePlaceholders();
      };

      /** Corrects the guessed heights on screen once real measurements come in. */
      const resizePlaceholders = () => {
        if (!heights.placeholdersNeedResizing) return;
        const pin = pinnedPage();
        const children = editorView.dom.children;
        const doc = editorView.state.doc;
        const count = Math.min(children.length, doc.childCount);
        for (let i = 0; i < count; i++) {
          const element = children[i] as HTMLElement;
          if (!element.hasAttribute("data-page-placeholder")) continue;
          element.style.height = `${heights.heightFor(doc.child(i))}px`;
        }
        heights.markPlaceholdersResized();
        restorePin(pin);
      };

      /** The layout text is wrapped in, read from the editor itself. */
      const updateMetrics = () => {
        const style = getComputedStyle(editorView.dom);
        const fontSize = parseFloat(style.fontSize);
        const lineHeight = parseFloat(style.lineHeight);
        heights.setMetrics({
          width: editorView.dom.clientWidth,
          fontSize,
          lineHeight: Number.isFinite(lineHeight) ? lineHeight : fontSize * 1.5
        });
      };

      const measureRenderedPages = () => {
        const children = editorView.dom.children;
        const doc = editorView.state.doc;
        const count = Math.min(children.length, doc.childCount);
        for (let i = 0; i < count; i++) {
          const element = children[i] as HTMLElement;
          if (element.hasAttribute("data-page-placeholder")) continue;
          const node = doc.child(i);
          heights.record(node, element.offsetHeight);

          const pageId = node.attrs.blockId as string | undefined;
          if (
            node.type.name !== PAGE_NODE ||
            !pageId ||
            measuredPages.has(pageId)
          )
            continue;
          measuredPages.add(pageId);
          const blocks = element.children;
          const blockCount = Math.min(blocks.length, node.childCount);
          for (let j = 0; j < blockCount; j++)
            heights.record(
              node.child(j),
              (blocks[j] as HTMLElement).offsetHeight
            );
        }
      };

      function schedule() {
        if (frame) return;
        frame = requestAnimationFrame(flush);
      }

      /** Renders every page before the browser prints it. */
      const beforePrint = () => {
        if (printing) return;
        printing = true;
        const everything = new Set<string>();
        editorView.state.doc.forEach((page) => {
          const pageId = page.attrs.blockId as string | undefined;
          if (pageId) everything.add(pageId);
        });
        editorView.dispatch(
          editorView.state.tr
            .setMeta(viewportKey, { visible: everything })
            .setMeta("preventUpdate", true)
            .setMeta("addToHistory", false)
        );
      };

      const afterPrint = () => {
        if (!printing) return;
        printing = false;
        schedule();
      };

      pending.set(editorView, flush);
      calibrations.set(editorView, () => {
        updateMetrics();
        measureRenderedPages();
        resizePlaceholders();
      });
      window.addEventListener("beforeprint", beforePrint);
      window.addEventListener("afterprint", afterPrint);

      const printMedia = window.matchMedia?.("print");
      const onPrintMedia = (event: MediaQueryListEvent) =>
        event.matches ? beforePrint() : afterPrint();
      printMedia?.addEventListener?.("change", onPrintMedia);
      window.addEventListener("resize", schedule, { passive: true });

      let layout: ResizeObserver | undefined;
      try {
        if (typeof ResizeObserver !== "undefined") {
          layout = new ResizeObserver(() => schedule());
          layout.observe(editorView.dom);
        }
      } catch (e) {
        layout = undefined;
      }

      schedule();

      return {
        update() {
          schedule();
        },
        destroy() {
          if (frame) cancelAnimationFrame(frame);
          window.removeEventListener("beforeprint", beforePrint);
          window.removeEventListener("afterprint", afterPrint);
          printMedia?.removeEventListener?.("change", onPrintMedia);
          pending.delete(editorView);
          calibrations.delete(editorView);
          window.removeEventListener("resize", schedule);
          scrollParent?.removeEventListener("scroll", schedule);
          layout?.disconnect();
          layout = undefined;
          scrollParent = null;
        }
      };
    }
  });
}
