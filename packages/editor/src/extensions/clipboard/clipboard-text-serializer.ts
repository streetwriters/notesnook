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

import { TextSerializer } from "@tiptap/core";
import { Schema, Slice } from "prosemirror-model";
import { ListItem } from "../list-item/index.js";
import { EditorView } from "@tiptap/pm/view";

export function clipboardTextSerializer(content: Slice, view: EditorView) {
  return getTextBetween(content, view.state.schema);
}

export function getTextBetween(slice: Slice, schema: Schema): string {
  const range = { from: 0, to: slice.size };
  const separator = "\n";
  let text = "";
  let separated = true;

  slice.content.nodesBetween(0, slice.size, (node, pos, parent, index) => {
    const textSerializer = schema.nodes[node.type.name]?.spec
      .toText as TextSerializer;

    if (textSerializer) {
      if (node.isBlock && !separated) {
        text += separator;
        separated = true;
      }

      if (parent) {
        text += textSerializer({
          node,
          pos,
          parent,
          index,
          range
        });
      }
    } else if (node.isText) {
      text += node?.text;
      separated = false;
    } else if (node.isBlock && !!text) {
      // we don't want double spaced list items when pasting
      if (index === 0 && parent?.type.name === ListItem.name) return;

      text += separator;
      if (node.attrs.spacing === "double" && node.childCount > 0)
        text += separator;
      separated = true;
    }
  });

  return text;
}
