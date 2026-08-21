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

      const scrollParent = findScrollParent(editorView.dom);
      if (scrollParent) scrollParent.style.overflowAnchor = "none";

      const flush = () => {
        frame = 0;
        const current = virtualizationKey.getState(editorView.state)?.visible;
        const next = new Set(intersecting);
        if (current && sameSet(current, next)) return;
        editorView.dispatch(
          editorView.state.tr.setMeta(virtualizationKey, { visible: next })
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

      const observe = () => {
        observer?.disconnect();
        observer = new IntersectionObserver(onIntersect, {
          root: scrollParent,
          // one viewport of overscan in each direction
          rootMargin: "100% 0px 100% 0px",
          threshold: 0
        });
        for (const child of Array.from(editorView.dom.children)) {
          if (child instanceof HTMLElement) observer.observe(child);
        }
      };

      observe();

      return {
        update(view, prevState) {
          // Re-observe whenever the document structure changed, since
          // materialize/dematerialize replaces the top-level DOM elements.
          if (!prevState.doc.eq(view.state.doc)) observe();
        },
        destroy() {
          if (frame) cancelAnimationFrame(frame);
          observer?.disconnect();
          observer = null;
        }
      };
    }
  });
}
