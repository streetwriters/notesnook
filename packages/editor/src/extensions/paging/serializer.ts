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

import { DOMSerializer, Fragment, Schema } from "@tiptap/pm/model";
import { flattenPages } from "./split.js";

/**
 * Writes pages out as if they were not there, so saved notes, the clipboard
 * and drag-and-drop keep the plain shape every other client expects. A node
 * always renders an element in ProseMirror, so the wrapper has to be dropped
 * here rather than in the page's own `renderHTML`.
 */
class FlatteningDOMSerializer extends DOMSerializer {
  serializeFragment(
    fragment: Fragment,
    options?: { document?: Document },
    target?: HTMLElement | DocumentFragment
  ) {
    return super.serializeFragment(flattenPages(fragment), options, target);
  }
}

/**
 * ProseMirror keeps one serializer per schema, so replacing it here is enough
 * for everything that writes HTML: getHTML, the clipboard, drag-and-drop.
 */
export function installFlatteningSerializer(schema: Schema): void {
  const cached = schema.cached as { domSerializer?: DOMSerializer };
  if (cached.domSerializer instanceof FlatteningDOMSerializer) return;
  cached.domSerializer = new FlatteningDOMSerializer(
    DOMSerializer.nodesFromSchema(schema),
    DOMSerializer.marksFromSchema(schema)
  );
}
