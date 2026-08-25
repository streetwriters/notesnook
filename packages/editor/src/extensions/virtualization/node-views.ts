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

import { DOMSerializer, Node as ProsemirrorNode } from "@tiptap/pm/model";
import {
  Decoration,
  DecorationSource,
  EditorView,
  NodeView,
  NodeViewConstructor
} from "@tiptap/pm/view";
import { HeightMap } from "./height-map.js";

export const TOP_LEVEL_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "checkList",
  "taskList",
  "outlineList",
  "codeblock",
  "table",
  "image",
  "webclip",
  "embed",
  "mathBlock",
  "callout"
];

function isMaterialized(decorations: readonly Decoration[]): boolean {
  return decorations.some((d) => (d.spec as { materialize?: boolean })?.materialize);
}

function isTopLevel(view: EditorView, getPos: () => number | undefined): boolean {
  const pos = getPos();
  if (pos == null || pos < 0 || pos > view.state.doc.content.size) return false;
  return view.state.doc.resolve(pos).depth === 0;
}

/**
 * A content-less placeholder. ProseMirror keeps the node in state but renders
 * nothing for its children, so the browser lays out and paints only an empty
 * box of the node's estimated height. See prosemirror-view domFromPos /
 * ignoreMutation handling of contentDOM-less node views.
 */
function createPlaceholder(
  node: ProsemirrorNode,
  getPos: () => number | undefined,
  heightMap: HeightMap
): NodeView {
  const dom = document.createElement("div");
  dom.setAttribute("data-virtual-placeholder", "true");
  const blockId = node.attrs.blockId as string | undefined;
  if (blockId) dom.setAttribute("data-block-id", blockId);
  dom.style.height = `${heightMap.heightFor(node)}px`;
  dom.style.width = "100%";

  return {
    dom,
    contentDOM: null,
    update(updatedNode: ProsemirrorNode, decorations: readonly Decoration[]) {
      if (updatedNode.type !== node.type) return false;
      if (isMaterialized(decorations)) return false;
      node = updatedNode;
      dom.style.height = `${heightMap.heightFor(updatedNode)}px`;
      return true;
    },
    ignoreMutation() {
      return true;
    }
  };
}

/**
 * Renders a block that has no custom node view (paragraph, heading, etc.) the
 * same way ProseMirror would by default — via the schema's DOM spec — so it can
 * be materialized/dematerialized on viewport entry like the custom ones.
 */
function createMaterializedDefault(
  node: ProsemirrorNode,
  heightMap: HeightMap
): NodeView {
  const spec = node.type.spec.toDOM?.(node);
  if (!spec) {
    const dom = document.createElement("div");
    return { dom };
  }
  const { dom, contentDOM } = DOMSerializer.renderSpec(document, spec);

  const record = () => {
    if (dom instanceof HTMLElement) heightMap.record(node, dom.offsetHeight);
  };

  return {
    dom,
    contentDOM,
    update(updatedNode: ProsemirrorNode, decorations: readonly Decoration[]) {
      if (updatedNode.type !== node.type) return false;
      if (!isMaterialized(decorations)) return false;
      if (!node.sameMarkup(updatedNode)) return false;
      node = updatedNode;
      record();
      return true;
    },
    destroy() {
      record();
    }
  };
}

/**
 * Wraps a custom node view so it de-materializes (returns false -> rebuild as a
 * placeholder) when its materialize decoration disappears, and records its real
 * height. The custom view keeps full ownership while materialized.
 */
function wrapCustom(
  inner: NodeView,
  node: ProsemirrorNode,
  heightMap: HeightMap
): NodeView {
  const originalUpdate = inner.update?.bind(inner);
  const originalDestroy = inner.destroy?.bind(inner);

  const record = () => {
    if (inner.dom instanceof HTMLElement)
      heightMap.record(node, inner.dom.offsetHeight);
  };

  inner.update = (
    updatedNode: ProsemirrorNode,
    decorations: readonly Decoration[],
    innerDecorations: DecorationSource
  ) => {
    if (!isMaterialized(decorations)) return false;
    node = updatedNode;
    record();
    return originalUpdate
      ? originalUpdate(updatedNode, decorations, innerDecorations)
      : updatedNode.type === node.type;
  };

  inner.destroy = () => {
    record();
    originalDestroy?.();
  };

  return inner;
}

export function withVirtualization(
  nodeViews: Record<string, NodeViewConstructor>,
  heightMap: HeightMap,
  thresholdBlocks: number
): Record<string, NodeViewConstructor> {
  const wrapped: Record<string, NodeViewConstructor> = { ...nodeViews };

  for (const type of TOP_LEVEL_BLOCK_TYPES) {
    const inner = nodeViews[type];
    wrapped[type] = (node, view, getPos, decorations, innerDecorations) => {
      const topLevel = isTopLevel(view, getPos as () => number | undefined);
      const materialize = isMaterialized(decorations);

      const belowThreshold = view.state.doc.childCount <= thresholdBlocks;

      if (!topLevel || belowThreshold) {
        return inner
          ? inner(node, view, getPos, decorations, innerDecorations)
          : createMaterializedDefault(node, heightMap);
      }

      if (materialize) {
        return inner
          ? wrapCustom(
              inner(node, view, getPos, decorations, innerDecorations),
              node,
              heightMap
            )
          : createMaterializedDefault(node, heightMap);
      }

      return createPlaceholder(
        node,
        getPos as () => number | undefined,
        heightMap
      );
    };
  }

  return wrapped;
}
