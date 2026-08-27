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
 * Serializes pages as if they were not there, so stored HTML, the clipboard and
 * drag-and-drop all keep the flat shape older clients expect. ProseMirror has no
 * transparent node spec — `renderSpec` requires every node to produce an
 * element — so the wrapper has to be dropped here instead of in `renderHTML`.
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
 * `DOMSerializer.fromSchema` memoizes on `schema.cached.domSerializer`, so
 * seeding it makes every consumer (getHTML, the clipboard, drag-and-drop) use
 * the flattening serializer without touching their call sites.
 */
export function installFlatteningSerializer(schema: Schema): void {
  const cached = schema.cached as { domSerializer?: DOMSerializer };
  if (cached.domSerializer instanceof FlatteningDOMSerializer) return;
  cached.domSerializer = new FlatteningDOMSerializer(
    DOMSerializer.nodesFromSchema(schema),
    DOMSerializer.marksFromSchema(schema)
  );
}
