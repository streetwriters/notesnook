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

import { NodeViewRenderer, NodeViewRendererProps } from "@tiptap/core";
import { DOMSerializer, Node as ProsemirrorNode } from "@tiptap/pm/model";
import {
  Decoration,
  EditorView,
  NodeView,
  NodeViewConstructor
} from "@tiptap/pm/view";
import { profiler } from "../../utils/profiler.js";
import { isRendered } from "./page-view.js";
import {
  hasWindowedContainers,
  isInsideWindowedContainer,
  WINDOWED_ATTRIBUTE
} from "./state.js";

type GetPos = (() => number | undefined) | boolean | undefined;

/**
 * Whether this child sits in a container that is being windowed.
 *
 * Asking a child for its position is only cheap while it is being built --
 * afterwards ProseMirror works it out by counting siblings, which a container
 * of ten thousand rows makes ruinous. So once the child has a place in the DOM
 * the container is found there instead, where the window marks it.
 */
function isInWindowedContainer(
  view: EditorView,
  getPos: GetPos,
  dom: Node | null
): boolean {
  if (!hasWindowedContainers(view)) return false;

  const parent = dom?.parentElement;
  if (parent) return !!parent.closest(`[${WINDOWED_ATTRIBUTE}]`);

  const position = typeof getPos === "function" ? getPos() : undefined;
  return (
    typeof position === "number" && isInsideWindowedContainer(view, position)
  );
}

function tagFor(node: ProsemirrorNode): string {
  const spec = node.type.spec.toDOM?.(node);
  return Array.isArray(spec) && typeof spec[0] === "string" ? spec[0] : "div";
}

/**
 * An empty, hidden element standing in for a child that is off screen.
 *
 * It is `display: none`, so the browser gives it no layout box at all -- the
 * point of leaving a child out is lost if the browser still has to lay it out,
 * and a table of twelve thousand rows is twelve thousand layout boxes. The
 * space the hidden children would have taken is held by one spacer per run
 * instead. The tag still matches what the child would have been: a row that is
 * not a `tr` is torn out of its table by the browser.
 */
function standInFor(
  node: ProsemirrorNode,
  isLeftOut: (decorations: readonly Decoration[]) => boolean
): NodeView {
  profiler.count("paging.childStandIns");
  const dom = document.createElement(tagFor(node));
  dom.setAttribute("data-virtual-child", "true");
  dom.style.display = "none";

  return {
    dom,
    contentDOM: null,
    update(updated, decorations) {
      if (updated.type !== node.type) return false;
      if (!isLeftOut(decorations)) return false;
      node = updated;
      return true;
    },
    ignoreMutation() {
      return true;
    }
  };
}

/** The child drawn the way the schema says, for types with no view of their own. */
function drawnFromSchema(node: ProsemirrorNode): NodeView {
  const spec = node.type.spec.toDOM?.(node);
  if (!spec) return { dom: document.createElement("div") };
  return DOMSerializer.renderSpec(document, spec);
}

/**
 * Stand-in views for container children that no extension renders itself.
 * Registered only while paging is on, and a no-op for every container small
 * enough to be rendered whole.
 */
export const containerChildView: NodeViewConstructor = (
  node,
  view,
  getPos,
  decorations
) => {
  let dom: Node | null = null;
  const isLeftOut = (current: readonly Decoration[]) =>
    !isRendered(current) && isInWindowedContainer(view, getPos, dom);

  if (isLeftOut(decorations)) {
    const standIn = standInFor(node, isLeftOut);
    dom = standIn.dom;
    return standIn;
  }

  const drawn = drawnFromSchema(node);
  dom = drawn.dom;
  return {
    ...drawn,
    update: (updated, current) =>
      !isLeftOut(current) && updated.sameMarkup(node)
  };
};

/**
 * Lets an extension's own node view be left out of a windowed container. Does
 * nothing at all unless paging is on and the child's container is long enough
 * to be windowed.
 */
export function virtualizable(render: NodeViewRenderer): NodeViewRenderer {
  return (props: NodeViewRendererProps) => {
    const view = props.editor.view;
    let dom: Node | null = null;
    const isLeftOut = (current: readonly Decoration[]) =>
      !isRendered(current) && isInWindowedContainer(view, props.getPos, dom);

    if (isLeftOut(props.decorations)) {
      const standIn = standInFor(props.node, isLeftOut);
      dom = standIn.dom;
      return standIn;
    }

    const drawn = render(props) as NodeView;
    dom = drawn.dom;
    const update = drawn.update?.bind(drawn);
    drawn.update = (updated, current, inner) => {
      if (isLeftOut(current)) return false;
      return update
        ? update(updated, current, inner)
        : updated.sameMarkup(props.node);
    };
    return drawn;
  };
}
