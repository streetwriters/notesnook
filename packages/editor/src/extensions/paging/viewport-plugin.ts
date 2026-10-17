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
import { EditorState, Plugin, Selection } from "@tiptap/pm/state";
import { Mapping } from "@tiptap/pm/transform";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";
import { containerChildView } from "./child-view.js";
import { childAt, HeightIndex } from "./height-index.js";
import {
  CHILDREN_BEFORE_MEASURING,
  containersWorthWindowing,
  LIST_ITEM_NODE,
  TABLE_ROW_NODE,
  widestChildren,
  WindowedContainer
} from "./containers.js";
import { HeightMap } from "./height-map.js";
import { PAGE_NODE } from "./page.js";
import {
  ChildWindow,
  ViewportState,
  viewportKey,
  WINDOWED_ATTRIBUTE
} from "./state.js";

export { viewportKey } from "./state.js";

type PageRange = { from: number; to: number; index: number };

type Windows = Map<string, ChildWindow>;

type Pin = { position: number; top: number };

type Edges = {
  addTop: number;
  addBottom: number;
  keepTop: number;
  keepBottom: number;
};

const EMPTY_VISIBLE: Set<string> = new Set();
const EMPTY_WINDOWS: Windows = new Map();

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
const WINDOWED_ATTRS = { [WINDOWED_ATTRIBUTE]: "true" };

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

type Gap = { position: number; height: number };

/** Marks the children of one long container that should be rendered. */
function decorateContainerChildren(
  container: ProsemirrorNode,
  window: ChildWindow,
  selection: Selection,
  index: HeightIndex,
  decorations: Decoration[]
): { start: number; end: number; gaps: Gap[] } {
  const count = container.childCount;
  const from = Math.max(0, Math.min(window.from, count));
  const to = Math.max(from, Math.min(window.to, count));
  const kept = widestChildren(container);
  const held = [selection.from, selection.to].filter(
    (position) =>
      position > window.containerStart && position < window.containerEnd
  );
  const last = kept.length ? kept[kept.length - 1] : -1;

  const gaps: Gap[] = [];
  let gapFrom = -1;
  let gapAt = 0;
  let offset = window.containerStart + 1;
  let start = offset;
  let end = offset;

  for (let i = 0; i < count; i++) {
    if (i >= to && i > last && !held.length) {
      const at = gapFrom >= 0 ? gapFrom : i;
      gaps.push({
        position: gapFrom >= 0 ? gapAt : offset,
        height: index.total - index.before[at]
      });
      gapFrom = -1;
      break;
    }

    const size = container.child(i).nodeSize;
    const holdsSelection = held.some(
      (position) => position >= offset && position < offset + size
    );
    const rendered =
      (i >= from && i < to) || holdsSelection || kept.includes(i);

    if (rendered) {
      if (gapFrom >= 0) {
        gaps.push({
          position: gapAt,
          height: index.before[i] - index.before[gapFrom]
        });
        gapFrom = -1;
      }
      decorations.push(renderDecoration(offset, offset + size));
    } else if (gapFrom < 0) {
      gapFrom = i;
      gapAt = offset;
    }

    if (i === from) start = offset;
    if (i < to) end = offset + size;
    offset += size;
  }

  if (gapFrom >= 0)
    gaps.push({ position: gapAt, height: index.total - index.before[gapFrom] });

  return { start, end, gaps };
}

/**
 * Marks the pages that should be rendered, and the part of any long container
 * inside them.
 */
function buildDecorations(
  doc: ProsemirrorNode,
  visible: Set<string>,
  known: Windows,
  expanded: boolean,
  selection: Selection,
  heights: HeightMap
): { decorations: DecorationSet; windows: Windows } {
  const decorations: Decoration[] = [];
  const windows: Windows = new Map();
  const selectionIndex = selection.$from.index(0);
  const lastIndex = doc.childCount - 1;
  let index = -1;

  doc.forEach((block, offset) => {
    index++;
    if (block.type.name === PAGE_NODE) {
      if (!shouldRender(block, index, lastIndex, visible, selectionIndex))
        return;
      decorations.push(renderDecoration(offset, offset + block.nodeSize));
    }

    for (const container of containersWorthWindowing(block)) {
      const containerStart = offset + container.offset;
      const previous = expanded ? undefined : known.get(container.id);
      const window: ChildWindow = {
        containerStart,
        containerEnd: containerStart + container.node.nodeSize,
        from: previous?.from ?? 0,
        to: expanded
          ? container.node.childCount
          : previous?.to ?? CHILDREN_BEFORE_MEASURING,
        childCount: container.node.childCount,
        renderedStart: containerStart,
        renderedEnd: containerStart + container.node.nodeSize
      };
      windows.set(container.id, window);
      decorations.push(
        Decoration.node(containerStart, window.containerEnd, WINDOWED_ATTRS)
      );
      const rendered = decorateContainerChildren(
        container.node,
        window,
        selection,
        heights.runningHeights(container.id, container.node),
        decorations
      );
      window.renderedStart = rendered.start;
      window.renderedEnd = rendered.end;
      addSpacers(container.node, rendered.gaps, decorations);
    }
  });

  const set = DecorationSet.create(doc, decorations);
  return { decorations: set, windows };
}

function mapWindows(windows: Windows, mapping: Mapping): Windows {
  if (!windows.size) return windows;
  const mapped: Windows = new Map();
  for (const [id, window] of windows)
    mapped.set(id, {
      ...window,
      containerStart: mapping.map(window.containerStart),
      containerEnd: mapping.map(window.containerEnd),
      renderedStart: mapping.map(window.renderedStart),
      renderedEnd: mapping.map(window.renderedEnd)
    });
  return mapped;
}

/** Whether the mapped decorations still describe the note. */
function mappedDecorationsHold(
  doc: ProsemirrorNode,
  windows: Windows,
  decorations: DecorationSet,
  selection: Selection
): boolean {
  for (const window of windows.values()) {
    const container = doc.nodeAt(window.containerStart);
    if (!container || container.childCount !== window.childCount) return false;

    const caret = selection.from;
    if (caret <= window.containerStart || caret >= window.containerEnd)
      continue;
    const covered = decorations
      .find(caret, caret)
      .some(
        (decoration) =>
          decoration.from > window.containerStart &&
          decoration.to < window.containerEnd &&
          (decoration.spec as { render?: boolean })?.render
      );
    if (!covered) return false;
  }
  return true;
}

/** One empty element standing in for a run of hidden children. */
function spacer(tag: string, height: number, columns: number): HTMLElement {
  const dom = document.createElement(tag);
  dom.setAttribute("data-virtual-spacer", "true");
  const box =
    tag === "tr" ? dom.appendChild(document.createElement("td")) : dom;
  if (box !== dom) (box as HTMLTableCellElement).colSpan = columns;
  box.style.height = `${Math.round(height)}px`;
  box.style.padding = "0";
  box.style.border = "none";
  return dom;
}

function columnCount(node: ProsemirrorNode): number {
  let total = 0;
  node.forEach((cell) => (total += Number(cell.attrs.colspan) || 1));
  return total || 1;
}

function addSpacers(
  container: ProsemirrorNode,
  gaps: Gap[],
  decorations: Decoration[]
): void {
  const first = container.firstChild;
  if (!first || !gaps.length) return;

  const spec = first.type.spec.toDOM?.(first);
  const tag =
    Array.isArray(spec) && typeof spec[0] === "string" ? spec[0] : "div";
  const columns = tag === "tr" ? columnCount(first) : 1;

  for (const gap of gaps) {
    if (gap.height <= 0) continue;
    decorations.push(
      Decoration.widget(gap.position, () => spacer(tag, gap.height, columns), {
        side: -1,
        key: `spacer:${Math.round(gap.height)}`
      })
    );
  }
}

function sameWindows(a: Windows, b: Windows): boolean {
  if (a.size !== b.size) return false;
  for (const [id, window] of a) {
    const other = b.get(id);
    if (!other || other.from !== window.from || other.to !== window.to)
      return false;
  }
  return true;
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
        const built = buildDecorations(
          state.doc,
          EMPTY_VISIBLE,
          EMPTY_WINDOWS,
          false,
          state.selection,
          heights
        );
        return {
          visible: EMPTY_VISIBLE,
          windows: built.windows,
          expanded: false,
          selectionIndex,
          pageCount: state.doc.childCount,
          decorations: built.decorations
        };
      },
      apply(tr, value, _oldState, newState) {
        const meta = tr.getMeta(viewportKey) as
          | { visible: Set<string>; windows: Windows; expanded: boolean }
          | undefined;
        const visible = meta?.visible ?? value.visible;
        const known = meta?.windows ?? value.windows;
        const expanded = meta?.expanded ?? value.expanded;
        const selectionIndex = newState.selection.$from.index(0);
        const pageCount = tr.doc.childCount;

        const selectionMoved = selectionIndex !== value.selectionIndex;
        const pagesChanged = pageCount !== value.pageCount;
        const windowed = known.size > 0;

        if (
          !meta &&
          !selectionMoved &&
          !pagesChanged &&
          !tr.docChanged &&
          !(windowed && tr.selectionSet)
        ) {
          return value;
        }

        if (!meta && !selectionMoved && !pagesChanged) {
          const windows = mapWindows(known, tr.mapping);
          const mapped = repairSelection(
            value.decorations.map(tr.mapping, tr.doc),
            newState
          );
          if (
            !windowed ||
            mappedDecorationsHold(tr.doc, windows, mapped, newState.selection)
          ) {
            return {
              visible,
              windows,
              expanded,
              selectionIndex,
              pageCount,
              decorations: mapped
            };
          }
        }

        const built = buildDecorations(
          tr.doc,
          visible,
          known,
          expanded,
          newState.selection,
          heights
        );
        return {
          visible,
          windows: built.windows,
          expanded,
          selectionIndex,
          pageCount,
          decorations: built.decorations
        };
      }
    },
    props: {
      decorations(state) {
        return viewportKey.getState(state)?.decorations;
      },
      // Types that draw themselves opt in with `virtualizable` instead.
      nodeViews: {
        [TABLE_ROW_NODE]: containerChildView,
        [LIST_ITEM_NODE]: containerChildView
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

      /** The first child reaching down to `y`, found by halving the child edges. */
      const firstReaching = (children: HTMLCollection, y: number): number => {
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

      const windowsNow = (): Iterable<ChildWindow> =>
        viewportKey.getState(editorView.state)?.windows.values() ?? [];

      /** The element a container's children are laid out in. */
      const childHost = (containerStart: number): HTMLElement | null => {
        const first = editorView.nodeDOM(containerStart + 1);
        return first instanceof Element ? first.parentElement : null;
      };

      /** The stretch of a container's children to render. */
      /**
       * The stretch of a container's children to render, worked out from where
       * the container starts on screen and how tall its children are.
       *
       * The children that are off screen are hidden, so the DOM cannot say
       * where they are. Adding up their heights answers the same question,
       * costs one rectangle rather than one per child, and holds on to children
       * already rendered until they pass the wider margin, so one on the edge
       * cannot flicker. A container with nothing drawn keeps the range it had.
       */
      const visibleChildRange = (
        container: WindowedContainer,
        containerStart: number,
        previous: ChildWindow | undefined,
        edges: Edges
      ): { from: number; to: number } => {
        const kept = previous ?? { from: 0, to: CHILDREN_BEFORE_MEASURING };
        const host = container.node.childCount
          ? childHost(containerStart)
          : null;
        if (!host) {
          return kept;
        }

        const top = host.getBoundingClientRect().top;
        const index = heights.runningHeights(container.id, container.node);
        const count = container.node.childCount;
        const at = (edge: number) =>
          Math.min(count, childAt(index, edge - top));

        const from = at(edges.addTop);
        const to = Math.min(count, at(edges.addBottom) + 1);
        if (!previous) return { from, to };
        return {
          from: Math.min(from, Math.max(previous.from, at(edges.keepTop))),
          to: Math.max(to, Math.min(previous.to, at(edges.keepBottom) + 1))
        };
      };

      const measureContainerWindows = (
        edges: Edges,
        known: Windows,
        windows: Windows
      ): void => {
        let blockStart = 0;
        editorView.state.doc.forEach((block) => {
          const start = blockStart;
          blockStart += block.nodeSize;
          for (const container of containersWorthWindowing(block)) {
            const containerStart = start + container.offset;
            const containerEnd = containerStart + container.node.nodeSize;
            const previous = known.get(container.id);
            windows.set(container.id, {
              containerStart,
              containerEnd,
              childCount: container.node.childCount,
              renderedStart: previous?.renderedStart ?? containerStart,
              renderedEnd: previous?.renderedEnd ?? containerEnd,
              ...visibleChildRange(container, containerStart, previous, edges)
            });
          }
        });
      };

      /** Pages render a screen early and stop half a screen late. */
      const measure = ():
        | { visible: Set<string>; windows: Windows }
        | undefined => {
        const children = editorView.dom.children;
        if (!children.length) return undefined;
        if (!editorView.dom.getBoundingClientRect().height) return undefined;

        const container = scrollParent;
        const bounds = container
          ? container.getBoundingClientRect()
          : { top: 0, height: window.innerHeight };
        const height = container ? container.clientHeight : bounds.height;
        if (!height) return undefined;

        const edges: Edges = {
          addTop: bounds.top - height * SHOW_MARGIN,
          addBottom: bounds.top + height * (1 + SHOW_MARGIN),
          keepTop: bounds.top - height * KEEP_MARGIN,
          keepBottom: bounds.top + height * (1 + KEEP_MARGIN)
        };

        const state = viewportKey.getState(editorView.state);
        const shown = state?.visible;
        const known = state?.windows ?? EMPTY_WINDOWS;
        const visible = new Set<string>();
        const windows: Windows = new Map(known);
        measureContainerWindows(edges, known, windows);

        for (
          let i = firstReaching(children, edges.keepTop);
          i < children.length;
          i++
        ) {
          const element = children[i] as HTMLElement;
          const rect = element.getBoundingClientRect();
          if (rect.top > edges.keepBottom) break;
          const pageId = element.getAttribute("data-block-id");
          if (!pageId) continue;
          if (
            (rect.bottom >= edges.addTop && rect.top <= edges.addBottom) ||
            shown?.has(pageId)
          )
            visible.add(pageId);
        }
        return { visible, windows };
      };

      /** The element at the top of the viewport, remembered across a redraw. */
      const pinFrom = (
        first: Element | null,
        fold: number
      ): Pin | undefined => {
        let element = first;
        while (element instanceof HTMLElement) {
          if (!element.hasAttribute("data-virtual-spacer")) {
            const rect = element.getBoundingClientRect();
            if (rect.bottom > fold)
              return {
                position: editorView.posAtDOM(element, 0) - 1,
                top: rect.top
              };
          }
          element = element.nextElementSibling;
        }
        return undefined;
      };

      /** What to hold on to across a redraw: the top block, or the top row. */
      const pinAtFold = (): Pin | undefined => {
        if (!scrollParent) return undefined;
        const fold = scrollParent.getBoundingClientRect().top;
        const blocks = editorView.dom.children;
        let pin = pinFrom(blocks[firstReaching(blocks, fold)] ?? null, fold);

        for (const window of windowsNow()) {
          const host = childHost(window.containerStart);
          if (!host) continue;
          const rect = host.getBoundingClientRect();
          if (rect.top > fold || rect.bottom < fold) continue;
          const first = editorView.nodeDOM(window.renderedStart);
          pin = pinFrom(first instanceof Element ? first : null, fold) ?? pin;
        }
        return pin;
      };

      /** Moves the scroll by however much the pinned element grew or shrank. */
      const restorePin = (pin?: Pin) => {
        if (!pin || !scrollParent) return;
        const element = editorView.nodeDOM(pin.position);
        if (!(element instanceof HTMLElement)) return;
        if (element.hasAttribute("data-virtual-child")) return;
        const delta = element.getBoundingClientRect().top - pin.top;
        if (!delta) return;
        scrollParent.scrollTop += delta;
      };

      /** What a rendered child actually measures, for the spacer that replaces it. */
      const measureRenderedChildren = () => {
        const doc = editorView.state.doc;
        for (const window of windowsNow()) {
          const container = doc.nodeAt(window.containerStart);
          if (!container) continue;

          let element = editorView.nodeDOM(window.renderedStart);
          const to = Math.min(window.to, container.childCount);
          for (let i = Math.max(0, window.from); i < to; i++) {
            if (!(element instanceof HTMLElement)) break;
            if (!element.hasAttribute("data-virtual-child"))
              heights.record(container.child(i), element.offsetHeight);
            element = element.nextElementSibling;
          }
        }
      };

      const flush = () => {
        frame = 0;
        if (printing) return;
        ensureScrollParent();
        const next = measure();
        if (!next) return;

        const current = viewportKey.getState(editorView.state);
        if (
          current &&
          sameSet(current.visible, next.visible) &&
          sameWindows(current.windows, next.windows)
        ) {
          return;
        }


        const pin = pinAtFold();
        editorView.dispatch(
          editorView.state.tr
            .setMeta(viewportKey, { ...next, expanded: false })
            .setMeta("preventUpdate", true)
            .setMeta("addToHistory", false)
        );
        restorePin(pin);
        updateMetrics();
        measureRenderedPages();
        measureRenderedChildren();
        resizePlaceholders();
      };

      /** Corrects the guessed heights on screen once real measurements come in. */
      const resizePlaceholders = () => {
        if (!heights.placeholdersNeedResizing) return;
        const pin = pinAtFold();
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
        const windows = viewportKey.getState(editorView.state)?.windows;
        editorView.dispatch(
          editorView.state.tr
            .setMeta(viewportKey, {
              visible: everything,
              windows: windows ?? EMPTY_WINDOWS,
              expanded: true
            })
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
