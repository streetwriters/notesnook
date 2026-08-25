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
import { EditorView } from "@tiptap/pm/view";
import { profiler } from "../../utils/profiler.js";
import { findScrollParent, virtualizationKey } from "./viewport-plugin.js";

export type ScrollAnchor = {
  /** The block that was at the top of the viewport. */
  blockId: string;
  /** How far above the viewport top that block started, in pixels. */
  offset: number;
};

function containerOf(view: EditorView) {
  const container = findScrollParent(view.dom);
  const top = container ? container.getBoundingClientRect().top : 0;
  return { container, top };
}

/**
 * Records the position as "this block, this far up" rather than a pixel offset.
 * Placeholder heights are estimates, so a document's total height changes as it
 * renders — a saved pixel offset points somewhere else entirely next time the
 * note is opened, while a block is always the same block.
 */
export function getScrollAnchor(view: EditorView): ScrollAnchor | undefined {
  const { top } = containerOf(view);
  const blocks = view.dom.querySelectorAll<HTMLElement>("[data-block-id]");

  for (const element of blocks) {
    // Pages carry a block id too, but theirs is regenerated every time a note
    // is opened and split, so only real blocks make a durable anchor.
    if (
      element.hasAttribute("data-page") ||
      element.hasAttribute("data-virtual-placeholder")
    )
      continue;
    const rect = element.getBoundingClientRect();
    if (rect.bottom <= top) continue;
    const blockId = element.getAttribute("data-block-id");
    if (!blockId) continue;
    return { blockId, offset: Math.round(top - rect.top) };
  }
  return undefined;
}

function findBlock(
  doc: ProsemirrorNode,
  blockId: string
): { pageId?: string; found: boolean } {
  let result: { pageId?: string; found: boolean } = { found: false };
  doc.forEach((node) => {
    if (result.found) return;
    if (node.attrs.blockId === blockId) {
      result = { found: true };
      return;
    }
    node.forEach((child) => {
      if (result.found) return;
      if (child.attrs.blockId === blockId)
        result = { found: true, pageId: node.attrs.blockId as string };
    });
  });
  return result;
}

/**
 * Brings the anchored block back to where it was. The page holding it is
 * revealed first: a block inside a placeholder has no element to scroll to.
 */
export function restoreScrollAnchor(
  view: EditorView,
  anchor: ScrollAnchor
): boolean {
  const end = profiler.start("virtualization.restoreAnchor");
  const { container, top } = containerOf(view);
  if (!container) {
    end();
    return false;
  }

  const target = findBlock(view.state.doc, anchor.blockId);
  if (!target.found) {
    end();
    profiler.count("virtualization.restoreAnchorMissed");
    return false;
  }

  if (target.pageId) {
    const visible = virtualizationKey.getState(view.state)?.visible;
    if (!visible?.has(target.pageId)) {
      const next = new Set(visible ?? []);
      next.add(target.pageId);
      view.dispatch(
        view.state.tr
          .setMeta(virtualizationKey, { visible: next })
          .setMeta("preventUpdate", true)
          .setMeta("addToHistory", false)
      );
    }
  }

  const element = view.dom.querySelector<HTMLElement>(
    `[data-block-id="${anchor.blockId}"]`
  );
  if (!element) {
    end();
    profiler.count("virtualization.restoreAnchorMissed");
    return false;
  }

  container.scrollTop +=
    element.getBoundingClientRect().top - top - anchor.offset;
  end();
  profiler.count("virtualization.restoreAnchors");
  return true;
}
