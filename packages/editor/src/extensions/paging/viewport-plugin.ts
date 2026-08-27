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
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { profiler } from "../../utils/profiler.js";
import { HeightMap } from "./height-map.js";
import { PAGE_NODE } from "./page.js";

export const viewportKey = new PluginKey<ViewportState>("notesnook-paging");

type ViewportState = {
  visible: Set<string>;
  selectionIndex: number;
  blockCount: number;
  decorations: DecorationSet;
};

type BlockRange = { from: number; to: number; index: number };

const EMPTY_VISIBLE: Set<string> = new Set();
const ADD_OVERSCAN = 1;
const KEEP_OVERSCAN = 1.5;
const MATERIALIZE_ATTRS = {};
const MATERIALIZE_SPEC = { materialize: true };

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

function shouldMaterialize(
  node: ProsemirrorNode,
  index: number,
  lastIndex: number,
  visible: Set<string>,
  selectionIndex: number
): boolean {
  if (index === 0 || index === lastIndex) {
    profiler.count("paging.materializedBy.edge");
    return true;
  }
  if (Math.abs(index - selectionIndex) <= 1) {
    profiler.count("paging.materializedBy.selection");
    return true;
  }
  const blockId = node.attrs.blockId as string | undefined;
  if (!blockId) {
    profiler.count("paging.materializedBy.missingBlockId");
    return true;
  }
  if (visible.has(blockId)) {
    profiler.count("paging.materializedBy.visible");
    return true;
  }
  return false;
}

function materializeDecoration(from: number, to: number): Decoration {
  return Decoration.node(from, to, MATERIALIZE_ATTRS, MATERIALIZE_SPEC);
}

/**
 * Only pageable types get a decoration: every other node type is rendered by
 * its own node view, which never reads the materialize spec. DecorationSet
 * construction is O(blocks x decorations), so each unnecessary decoration costs
 * a full pass over the document.
 */
function buildDecorations(
  doc: ProsemirrorNode,
  visible: Set<string>,
  selectionIndex: number
): DecorationSet {
  const end = profiler.start("paging.decorations");
  const decorations: Decoration[] = [];
  const lastIndex = doc.childCount - 1;
  let index = -1;

  doc.forEach((node, offset) => {
    index++;
    if (node.type.name !== PAGE_NODE) return;
    if (!shouldMaterialize(node, index, lastIndex, visible, selectionIndex))
      return;
    decorations.push(materializeDecoration(offset, offset + node.nodeSize));
  });

  const set = DecorationSet.create(doc, decorations);
  end();
  profiler.count("paging.decorationBuilds");
  profiler.gauge("paging.materializedBlocks", decorations.length);
  profiler.gauge("paging.blocksInDoc", doc.childCount);
  return set;
}

/**
 * The blocks around the caret, resolved in constant time from the (already
 * resolved) selection rather than by walking the document.
 */
function selectionRanges(state: EditorState): BlockRange[] {
  const { $from } = state.selection;
  const doc = state.doc;
  const index = $from.index(0);
  if (index >= doc.childCount) return [];

  const start = $from.depth > 0 ? $from.before(1) : $from.pos;
  const node = doc.child(index);
  const ranges: BlockRange[] = [];

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

function hasMaterializeDecoration(
  set: DecorationSet,
  range: BlockRange
): boolean {
  return set
    .find(range.from, range.to)
    .some(
      (decoration) =>
        decoration.from === range.from &&
        decoration.to === range.to &&
        (decoration.spec as { materialize?: boolean })?.materialize
    );
}

/**
 * Mapping can drop a node decoration whose range no longer lines up with its
 * node, which would blank out the block the caret is in. Re-add only the ones
 * that went missing.
 */
function repairSelection(
  set: DecorationSet,
  state: EditorState
): DecorationSet {
  const missing: Decoration[] = [];
  for (const range of selectionRanges(state)) {
    if (state.doc.child(range.index).type.name !== PAGE_NODE) continue;
    if (hasMaterializeDecoration(set, range)) continue;
    missing.push(materializeDecoration(range.from, range.to));
  }
  if (!missing.length) return set;

  profiler.count("paging.decorationRepairs", missing.length);
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
          blockCount: state.doc.childCount,
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
        const blockCount = tr.doc.childCount;

        const selectionMoved = selectionIndex !== value.selectionIndex;
        const structural = blockCount !== value.blockCount;

        if (!meta && !selectionMoved && !structural && !tr.docChanged) {
          profiler.count("paging.decorationReuses");
          return value;
        }

        if (meta || selectionMoved || structural) {
          return {
            visible,
            selectionIndex,
            blockCount,
            decorations: buildDecorations(tr.doc, visible, selectionIndex)
          };
        }

        const end = profiler.start("paging.decorationMap");
        const mapped = repairSelection(
          value.decorations.map(tr.mapping, tr.doc),
          newState
        );
        end();
        profiler.count("paging.decorationMaps");

        return { visible, selectionIndex, blockCount, decorations: mapped };
      }
    },
    props: {
      decorations(state) {
        return viewportKey.getState(state)?.decorations;
      }
    },
    view(editorView) {
      let frame = 0;
      let scrollParent: HTMLElement | null = null;
      let visible: Set<string> = EMPTY_VISIBLE;
      const measuredPages = new Set<string>();

      const ensureScrollParent = () => {
        const resolved = findScrollParent(editorView.dom);
        if (!resolved || resolved === scrollParent) return;
        scrollParent?.removeEventListener("scroll", schedule);
        resolved.style.overflowAnchor = "auto";
        resolved.addEventListener("scroll", schedule, { passive: true });
        scrollParent = resolved;
      };

      /**
       * Finds the first child whose bottom edge reaches `y`, in viewport
       * coordinates. Top-level blocks are stacked, so their edges increase
       * monotonically and can be bisected instead of scanned.
       */
      const firstChildBelow = (children: HTMLCollection, y: number): number => {
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

      /**
       * Blocks are added to the window one viewport beyond the visible area and
       * only dropped half a viewport further out, so a block sitting on the
       * boundary cannot flip on every frame.
       */
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

        const addTop = bounds.top - height * ADD_OVERSCAN;
        const addBottom = bounds.top + height * (1 + ADD_OVERSCAN);
        const keepTop = bounds.top - height * KEEP_OVERSCAN;
        const keepBottom = bounds.top + height * (1 + KEEP_OVERSCAN);

        const next = new Set<string>();
        for (
          let i = firstChildBelow(children, keepTop);
          i < children.length;
          i++
        ) {
          const element = children[i] as HTMLElement;
          const rect = element.getBoundingClientRect();
          if (rect.top > keepBottom) break;
          const blockId = element.getAttribute("data-block-id");
          if (!blockId) continue;
          if (
            (rect.bottom >= addTop && rect.top <= addBottom) ||
            visible.has(blockId)
          )
            next.add(blockId);
        }
        return next;
      };

      /**
       * The top-most unit on screen, remembered by index so it can be found
       * again after the DOM is rebuilt.
       */
      const pinnedUnit = (): { index: number; top: number } | undefined => {
        if (!scrollParent) return undefined;
        const children = editorView.dom.children;
        const fold = scrollParent.getBoundingClientRect().top;
        for (
          let i = firstChildBelow(children, fold);
          i < children.length;
          i++
        ) {
          const rect = (children[i] as HTMLElement).getBoundingClientRect();
          if (rect.bottom > fold) return { index: i, top: rect.top };
        }
        return undefined;
      };

      /**
       * A placeholder's height is an estimate, so a unit that renders resizes
       * and shoves everything after it. Putting the pinned unit back where it
       * was keeps the reader's position still through that.
       */
      const restorePin = (pin?: { index: number; top: number }) => {
        if (!pin || !scrollParent) return;
        const element = editorView.dom.children[pin.index] as
          | HTMLElement
          | undefined;
        if (!element) return;
        const delta = element.getBoundingClientRect().top - pin.top;
        if (!delta) return;
        scrollParent.scrollTop += delta;
        profiler.record("paging.pinCorrection", Math.abs(delta));
      };

      const flush = () => {
        frame = 0;
        const end = profiler.start("paging.measure");
        ensureScrollParent();
        const next = measure();
        end();
        profiler.count("paging.measures");
        if (!next) return;

        const current = viewportKey.getState(editorView.state)?.visible;
        if (current && sameSet(current, next)) {
          profiler.count("paging.measuresUnchanged");
          return;
        }

        visible = next;
        profiler.count("paging.visibilityFlushes");
        profiler.gauge("paging.visibleBlocks", next.size);

        const pin = pinnedUnit();
        editorView.dispatch(
          editorView.state.tr
            .setMeta(viewportKey, { visible: next })
            .setMeta("preventUpdate", true)
            .setMeta("addToHistory", false)
        );
        restorePin(pin);
        recordRenderedHeights();
        resizePlaceholders();
      };

      /**
       * Placeholders created before anything had been measured are sized from a
       * guess. Once real measurements move that ratio, the ones still on screen
       * are resized so the scrollbar stops lying; the pin keeps the reader in
       * place while they change.
       */
      const resizePlaceholders = () => {
        if (!heights.needsRecalibration) return;
        const pin = pinnedUnit();
        const children = editorView.dom.children;
        const doc = editorView.state.doc;
        const count = Math.min(children.length, doc.childCount);
        for (let i = 0; i < count; i++) {
          const element = children[i] as HTMLElement;
          if (!element.hasAttribute("data-virtual-placeholder")) continue;
          element.style.height = `${heights.heightFor(doc.child(i))}px`;
        }
        heights.markRecalibrated();
        restorePin(pin);
        profiler.count("paging.placeholderResizes");
      };

      /**
       * Whatever is rendered right now has a real height; remembering it means
       * its placeholder is the right size when it scrolls away again.
       */
      const recordRenderedHeights = () => {
        const style = getComputedStyle(editorView.dom);
        const fontSize = parseFloat(style.fontSize);
        const lineHeight = parseFloat(style.lineHeight);
        heights.setMetrics({
          width: editorView.dom.clientWidth,
          fontSize,
          lineHeight: Number.isFinite(lineHeight) ? lineHeight : fontSize * 1.5
        });
        const children = editorView.dom.children;
        const doc = editorView.state.doc;
        const count = Math.min(children.length, doc.childCount);
        for (let i = 0; i < count; i++) {
          const element = children[i] as HTMLElement;
          if (element.hasAttribute("data-virtual-placeholder")) continue;
          const node = doc.child(i);
          heights.record(node, element.offsetHeight);

          const pageId = node.attrs.blockId as string | undefined;
          if (node.type.name !== "page" || !pageId || measuredPages.has(pageId))
            continue;
          measuredPages.add(pageId);
          const blocks = element.children;
          const blockCount = Math.min(blocks.length, node.childCount);
          for (let j = 0; j < blockCount; j++)
            heights.record(
              node.child(j),
              (blocks[j] as HTMLElement).offsetHeight
            );
          profiler.count("paging.pagesMeasured");
        }
      };

      function schedule() {
        if (frame) return;
        frame = requestAnimationFrame(flush);
      }

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
