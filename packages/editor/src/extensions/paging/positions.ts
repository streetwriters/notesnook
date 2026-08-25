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
import { isPage } from "./split.js";

/**
 * Positions are persisted (restored selections, saved scroll targets) and must
 * survive a note being paged differently — or not at all — next time it is
 * opened. Both conversions are the identity for an unpaged document.
 *
 * Positions inside a textblock convert exactly in both directions. A position
 * on a page boundary does not: the gap between two pages collapses to a single
 * position once the wrappers are gone, and converting back lands inside the
 * following page.
 */
export function toFlatPosition(doc: ProsemirrorNode, pos: number): number {
  let flat = 0;
  let at = 0;
  for (let i = 0; i < doc.childCount; i++) {
    const child = doc.child(i);
    const size = child.nodeSize;
    if (pos < at + size) {
      if (!isPage(child)) return flat + (pos - at);
      const inner = pos - at - 1;
      return flat + Math.max(0, Math.min(inner, child.content.size));
    }
    flat += isPage(child) ? child.content.size : size;
    at += size;
  }
  return flat;
}

export function fromFlatPosition(doc: ProsemirrorNode, flat: number): number {
  if (flat <= 0) return 0;
  let seen = 0;
  let at = 0;
  for (let i = 0; i < doc.childCount; i++) {
    const child = doc.child(i);
    const size = child.nodeSize;
    const flatSize = isPage(child) ? child.content.size : size;
    if (flat < seen + flatSize)
      return isPage(child) ? at + 1 + (flat - seen) : at + (flat - seen);
    seen += flatSize;
    at += size;
  }
  return Math.min(doc.content.size, at);
}
