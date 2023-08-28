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

import { EditorState } from "prosemirror-state";
import { NodeType } from "prosemirror-model";
import { Editor } from "@tiptap/core";
import { findParentNodeOfType } from "../../utils/prosemirror";

export function onArrowUpPressed(editor: Editor, name: string, type: NodeType) {
  const { selection } = editor.state;
  const { empty } = selection;

  if (!empty || !isFirstOfType(type, editor.state)) return false;
  const parentList = getListFromListItem(type, editor.state);
  if (editor.state.doc.firstChild === parentList)
    return editor.commands.insertContentAt(0, "<p></p>");
  return false;
}

const isFirstOfType = (type: NodeType, state: EditorState) => {
  const block = findParentNodeOfType(type)(state.selection);
  if (!block) return false;
  const { pos } = block;
  const resolved = state.doc.resolve(pos);
  return !resolved.nodeBefore;
};

const getListFromListItem = (type: NodeType, state: EditorState) => {
  const block = findParentNodeOfType(type)(state.selection);
  if (!block) return undefined;
  const { pos } = block;
  const resolved = state.doc.resolve(pos);
  if (
    !resolved.parent.type.spec.group ||
    resolved.parent.type.spec.group?.indexOf("list") <= -1
  )
    return undefined;

  return resolved.parent;
};
