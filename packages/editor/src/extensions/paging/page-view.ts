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
import { Decoration, NodeView } from "@tiptap/pm/view";
import { profiler } from "../../utils/profiler.js";
import { HeightMap } from "./height-map.js";

export function isRendered(decorations: readonly Decoration[]): boolean {
  return decorations.some((d) => (d.spec as { render?: boolean })?.render);
}

let template: HTMLDivElement | undefined;

function placeholderElement(): HTMLDivElement {
  if (!template) {
    template = document.createElement("div");
    template.setAttribute("data-page-placeholder", "true");
    template.style.width = "100%";
    template.style.contain = "strict";
  }
  return template.cloneNode(false) as HTMLDivElement;
}

/**
 * An empty box standing in for a page. ProseMirror keeps the page and its
 * blocks in the document but renders nothing for them, so the browser lays out
 * and paints one sized div instead of a few hundred elements.
 */
function placeholder(node: ProsemirrorNode, heights: HeightMap): NodeView {
  profiler.count("paging.placeholderCreated");
  const dom = placeholderElement();
  const blockId = node.attrs.blockId as string | undefined;
  if (blockId) dom.setAttribute("data-block-id", blockId);
  dom.style.height = `${heights.heightFor(node)}px`;

  return {
    dom,
    contentDOM: null,
    update(updated, decorations) {
      if (updated.type !== node.type) return false;
      if (isRendered(decorations)) {
        profiler.count("paging.pageShown");
        return false;
      }
      node = updated;
      dom.style.height = `${heights.heightFor(updated)}px`;
      return true;
    },
    ignoreMutation() {
      return true;
    }
  };
}

/** A page shown normally, rendered the way the schema says. */
function rendered(node: ProsemirrorNode): NodeView {
  const spec = node.type.spec.toDOM?.(node);
  if (!spec) return { dom: document.createElement("div") };

  const { dom, contentDOM } = DOMSerializer.renderSpec(document, spec);
  return {
    dom,
    contentDOM,
    update(updated, decorations) {
      if (!isRendered(decorations)) {
        profiler.count("paging.pageHidden");
        return false;
      }
      return node.sameMarkup(updated);
    }
  };
}

export function createPageView(
  node: ProsemirrorNode,
  decorations: readonly Decoration[],
  heights: HeightMap
): NodeView {
  return isRendered(decorations) ? rendered(node) : placeholder(node, heights);
}
