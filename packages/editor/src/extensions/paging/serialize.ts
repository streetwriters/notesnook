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

import {
  DOMSerializer,
  Fragment,
  Node as ProsemirrorNode,
  Schema
} from "@tiptap/pm/model";
import { profiler } from "../../utils/profiler.js";
import { isPage } from "./split.js";

const cache = new WeakMap<ProsemirrorNode, string>();

function fragmentToHTML(fragment: Fragment, serializer: DOMSerializer): string {
  const container = document.createElement("div");
  container.appendChild(serializer.serializeFragment(fragment));
  return container.innerHTML;
}

/**
 * Serializes the document a top-level node at a time and remembers the result
 * for each one. ProseMirror nodes are immutable and shared between document
 * versions, so an unedited node is the same object as before and its HTML can
 * be reused: a keystroke only re-serializes the node it landed in.
 *
 * Pages are serialized as their contents, keeping stored HTML page-free.
 */
export function serializeDocumentHTML(
  doc: ProsemirrorNode,
  schema: Schema
): string {
  const end = profiler.start("serialize.document");
  const serializer = DOMSerializer.fromSchema(schema);
  const parts: string[] = [];

  doc.forEach((node) => {
    const cached = cache.get(node);
    if (cached !== undefined) {
      profiler.count("serialize.cacheHit");
      parts.push(cached);
      return;
    }

    profiler.count("serialize.cacheMiss");
    const html = isPage(node)
      ? fragmentToHTML(node.content, serializer)
      : fragmentToHTML(Fragment.from(node), serializer);
    cache.set(node, html);
    parts.push(html);
  });

  const html = parts.join("");
  end();
  return html;
}
