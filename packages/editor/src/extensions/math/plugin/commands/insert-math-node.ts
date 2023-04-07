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

import { Command } from "prosemirror-state";
import { NodeType } from "prosemirror-model";
import {
  EditorState,
  NodeSelection,
  Transaction,
  TextSelection
} from "prosemirror-state";

////////////////////////////////////////////////////////////////////////////////

/**
 * Returns a new command that can be used to inserts a new math node at the
 * user's current document position, provided that the document schema actually
 * allows a math node to be placed there.
 *
 * @param mathNodeType An instance for either your math_inline or math_display
 *     NodeType.  Must belong to the same schema that your EditorState uses!
 * @param initialText (optional) The initial source content for the math editor.
 */
export function insertMathNode(
  mathNodeType: NodeType,
  initialText = ""
): Command {
  return function (
    state: EditorState,
    dispatch: ((tr: Transaction) => void) | undefined
  ) {
    const { $from, empty } = state.selection,
      index = $from.index();
    if (!empty && !$from.parent.canReplaceWith(index, index, mathNodeType)) {
      return false;
    }
    if (dispatch) {
      const mathNode = mathNodeType.create(
        {},
        initialText ? state.schema.text(initialText) : null
      );
      let tr = state.tr.replaceSelectionWith(mathNode);
      if (empty) {
        tr = tr.setSelection(TextSelection.create(tr.doc, $from.pos + 1));
      } else {
        tr = tr.setSelection(NodeSelection.create(tr.doc, $from.pos));
      }
      dispatch(tr);
    }
    return true;
  };
}
