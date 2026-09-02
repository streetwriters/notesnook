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

import { Node, mergeAttributes } from "@tiptap/core";

export const PAGE_NODE = "page";

/**
 * A run of top-level blocks, grouped so the editor can treat them as one unit.
 *
 * Pages exist only in the editor's document: they are created when a note is
 * opened and removed again on serialization, so stored content is unchanged and
 * older clients are unaffected. There is deliberately no `parseHTML` rule for
 * the same reason.
 */
export const Page = Node.create({
  name: PAGE_NODE,
  content: "block+",
  group: "page",
  selectable: false,

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-page": "true" }), 0];
  }
});
