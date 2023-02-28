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

import { Editor, Extension } from "@tiptap/core";
import { isInTable } from "@tiptap/pm/tables";
import { LIST_ITEM_NODE_TYPES, LIST_NODE_TYPES } from "../../utils/node-types";
import { isListActive } from "../../utils/prosemirror";

export const KeyMap = Extension.create({
  name: "key-map",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (isListActive(editor) || isInTable(editor.state)) return false;
        return editor.commands.insertContent("\t");
      },
      "Shift-Tab": ({ editor }) => {
        if (isListActive(editor)) return false;
        return true;
      },
      Backspace: ({ editor }) => {
        return joinUpWithLastListItem(editor);
      }
    };
  }
});

/**
 * By default, in ProseMirror, if the cursor is right below a list,
 * pressing Backspace creates a new empty list item at the end.
 * This function corrects this behavior and moves the cursor to the
 * end of the list.
 */
export function joinUpWithLastListItem(editor: Editor) {
  const { selection, doc } = editor.state;
  const { $from, empty } = selection;

  const parentPos = $from.pos - $from.parentOffset - 1;
  const before = doc.resolve(parentPos).nodeBefore;

  if (
    empty &&
    $from.parentOffset === 0 &&
    before &&
    LIST_NODE_TYPES.includes(before.type.name)
  ) {
    // The last list item can be at any depth and the number of joinBackwards
    // depend on how deep it is.
    let lastItemDepth = 0;
    before.descendants((node, pos) => {
      if (LIST_ITEM_NODE_TYPES.includes(node.type.name)) {
        const { depth } = before.resolve(pos);
        lastItemDepth = depth / 2;
      }
    });
    // The depth of the last list item does not take into account
    // the parent depth (i.e. 1) so we have to increment it.
    lastItemDepth++;

    let commands = editor.chain().joinBackward();
    for (let i = 0; i < lastItemDepth; ++i) {
      commands = commands.joinBackward().joinBackward();
    }

    return commands.run();
  }

  return false;
}
