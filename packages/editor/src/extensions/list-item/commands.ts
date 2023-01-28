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
import {
  findParentNodeOfType,
  hasParentNodeOfType
} from "../../utils/prosemirror";

// WORKAROUND: if we're at the start of a list item, we need to either
// backspace directly to an empty list item above, or outdent this node
export function onBackspacePressed(
  editor: Editor,
  name: string,
  type: NodeType
) {
  const { selection } = editor.state;
  const { empty, $from } = selection;
  if (
    !empty ||
    !isInside(name, type, editor.state) ||
    $from.parentOffset !== 0 ||
    !isFirstChildOfParent(editor.state) ||
    !editor.can().liftListItem(type)
  )
    return false;

  const isEmpty = isListItemEmpty(type, editor.state);

  if (isEmpty) {
    if (isFirstOfType(type, editor.state)) {
      const parentList = getListFromListItem(type, editor.state);
      if (!parentList) return false;
      if (parentList.childCount > 1) {
        return editor.commands.liftListItem(type);
      }
      return editor.commands.deleteNode(parentList.type);
    }

    return editor.commands.deleteNode(type);
  } else if (isFirstOfType(type, editor.state)) {
    return false;
  } else {
    const block = findParentNodeOfType(type)(selection);
    if (block && block.start === $from.pos - 1) {
      // we have to run join backward twice because on the first join
      // the two list items are joined i.e., the editor just puts their
      // paragraphs next to each other. The next join merges the paragraphs
      // like it should be.
      return editor.chain().joinBackward().joinBackward().run();
    }
  }
}

export function onArrowUpPressed(editor: Editor, name: string, type: NodeType) {
  const { selection } = editor.state;
  const { empty } = selection;

  if (!empty || !isFirstOfType(type, editor.state)) return false;
  const parentList = getListFromListItem(type, editor.state);
  if (editor.state.doc.firstChild === parentList)
    return editor.commands.insertContentAt(0, "<p></p>");
  return false;
}

function isInside(name: string, type: NodeType, state: EditorState) {
  const { $from } = state.selection;

  const node = type || state.schema.nodes[name];
  const { paragraph } = state.schema.nodes;

  return (
    hasParentNodeOfType(node)(state.selection) &&
    $from.parent.type === paragraph
  );
}

function isFirstChildOfParent(state: EditorState): boolean {
  const { $from } = state.selection;
  return $from.depth > 1
    ? $from.parentOffset === 0 || $from.index($from.depth - 1) === 0
    : true;
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

function isListItemEmpty(type: NodeType, state: EditorState) {
  const block = findParentNodeOfType(type)(state.selection);
  if (!block) return false;
  const { node } = block;
  return !node.textContent.length;
}
