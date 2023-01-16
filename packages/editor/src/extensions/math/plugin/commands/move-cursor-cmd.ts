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
import { EditorState, TextSelection, Transaction } from "prosemirror-state";

////////////////////////////////////////////////////////////////////////////////

/**
 * Some browsers (cough firefox cough) don't properly handle cursor movement on
 * the edges of a NodeView, so we need to make the desired behavior explicit.
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1252108
 */
export function nudgeCursorCmd(dir: -1 | 0 | 1): Command {
  return (
    innerState: EditorState,
    dispatch: ((tr: Transaction) => void) | undefined
  ) => {
    const { to, from } = innerState.selection;

    // compute target position
    const emptySelection: boolean = to === from;
    const currentPos: number = dir < 0 ? from : to;
    const increment: number = emptySelection ? dir : 0;
    const nodeSize: number = innerState.doc.nodeSize;
    const targetPos: number = Math.max(
      0,
      Math.min(nodeSize, currentPos + increment)
    );

    if (dispatch) {
      dispatch(
        innerState.tr.setSelection(
          TextSelection.create(innerState.doc, targetPos)
        )
      );
    }
    return true;
  };
}

export const nudgeCursorForwardCmd: Command = nudgeCursorCmd(+1);
export const nudgeCursorBackCmd: Command = nudgeCursorCmd(-1);
