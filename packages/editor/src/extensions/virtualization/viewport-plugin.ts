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

import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";
import { TOP_LEVEL_BLOCK_TYPES } from "./node-views.js";

export const virtualizationKey = new PluginKey<VirtualizationState>(
  "notesnook-virtualization"
);

type VirtualizationState = {
  visible: Set<string>;
};

function isPageable(typeName: string): boolean {
  return TOP_LEVEL_BLOCK_TYPES.includes(typeName);
}

function findScrollParent(node: HTMLElement): HTMLElement | null {
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

export function virtualizationPlugin(): Plugin<VirtualizationState> {
  return new Plugin<VirtualizationState>({
    key: virtualizationKey,
    state: {
      init: () => ({ visible: new Set<string>() }),
      apply(tr, value) {
        const meta = tr.getMeta(virtualizationKey) as
          | VirtualizationState
          | undefined;
        return meta ?? value;
      }
    },
    props: {
      decorations(state) {
        const pluginState = virtualizationKey.getState(state);
        const visible = pluginState?.visible ?? new Set<string>();
        const doc = state.doc;

        // Top-level index of the selection so we can always keep the block the
        // caret is in (and its neighbours) rendered.
        const selectionIndex = state.selection.$from.index(0);

        const decorations: Decoration[] = [];
        let index = -1;
        doc.forEach((node, offset) => {
          index++;
          const nearSelection = Math.abs(index - selectionIndex) <= 1;
          const isEdge = index === 0 || index === doc.childCount - 1;
          const blockId = node.attrs.blockId as string | undefined;

          const materialize =
            !isPageable(node.type.name) ||
            isEdge ||
            nearSelection ||
            (blockId ? visible.has(blockId) : true);

          if (materialize) {
            decorations.push(
              Decoration.node(
                offset,
                offset + node.nodeSize,
                {},
                { materialize: true }
              )
            );
          }
        });

        return DecorationSet.create(doc, decorations);
      }
    },
    view(editorView) {
      let observer: IntersectionObserver | null = null;
      let frame = 0;
      const intersecting = new Set<string>();
      let scrollParent: HTMLElement | null = null;

      const flush = () => {
        frame = 0;
        const current = virtualizationKey.getState(editorView.state)?.visible;
        const next = new Set(intersecting);
        if (current && sameSet(current, next)) return;
        // This transaction only records which blocks are on-screen; it changes
        // no content. It carries no steps (docChanged is false), and we mark it
        // preventUpdate + addToHistory:false as belt-and-suspenders so it can
        // never trigger a save, never enter the undo history, and never touch
        // user data — virtualization is a pure view concern.
        editorView.dispatch(
          editorView.state.tr
            .setMeta(virtualizationKey, { visible: next })
            .setMeta("preventUpdate", true)
            .setMeta("addToHistory", false)
        );
      };

      const schedule = () => {
        if (frame) return;
        frame = requestAnimationFrame(flush);
      };

      const onIntersect: IntersectionObserverCallback = (entries) => {
        for (const entry of entries) {
          const blockId = (entry.target as HTMLElement).getAttribute(
            "data-block-id"
          );
          if (!blockId) continue;
          if (entry.isIntersecting) intersecting.add(blockId);
          else intersecting.delete(blockId);
        }
        schedule();
      };

      const observed = new Set<Element>();

      const ensureObserver = () => {
        // Resolve the scroll container lazily: at view-init the document may be
        // empty (no overflow yet), so it must be re-resolved once content grows.
        const resolved = findScrollParent(editorView.dom);
        if (resolved && resolved !== scrollParent) {
          // Keep the browser's scroll anchoring ON: when an off-screen
          // placeholder above the viewport materializes to its real height, the
          // browser compensates scrollTop so the visible content stays put
          // instead of jumping.
          resolved.style.overflowAnchor = "auto";
          scrollParent = resolved;
          // The observer's root is fixed at construction, so it must be rebuilt
          // when the scroll container changes.
          observer?.disconnect();
          observer = null;
          observed.clear();
        }
        if (!observer) {
          observer = new IntersectionObserver(onIntersect, {
            root: scrollParent,
            // one viewport of overscan in each direction
            rootMargin: "100% 0px 100% 0px",
            threshold: 0
          });
        }
      };

      // Keep a single observer alive and only add/remove the blocks that
      // actually changed. Disconnecting and re-observing every block on each
      // materialization resets all intersection state; during a scroll that
      // never converges and leaves visible blocks stuck as blank placeholders.
      const syncObserved = () => {
        ensureObserver();
        if (!observer) return;
        const children = editorView.dom.children;
        const current = new Set<Element>(children as unknown as Element[]);
        for (const el of observed) {
          if (!current.has(el)) {
            observer.unobserve(el);
            observed.delete(el);
          }
        }
        for (const el of Array.from(children)) {
          if (el instanceof HTMLElement && !observed.has(el)) {
            observer.observe(el);
            observed.add(el);
          }
        }
      };

      const childrenChanged = () => {
        const children = editorView.dom.children;
        if (children.length !== observed.size) return true;
        for (const child of children) if (!observed.has(child)) return true;
        return false;
      };

      syncObserved();

      return {
        update() {
          // Materialize/dematerialize swaps the top-level DOM elements without
          // changing the document, so re-sync whenever the child element set
          // changes identity — but only the delta, not the whole observer.
          if (childrenChanged()) syncObserved();
        },
        destroy() {
          if (frame) cancelAnimationFrame(frame);
          observer?.disconnect();
          observer = null;
          observed.clear();
        }
      };
    }
  });
}
