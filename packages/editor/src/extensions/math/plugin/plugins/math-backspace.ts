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

import { NodeSelection } from "prosemirror-state";
import { Command as ProseCommand } from "prosemirror-state";

export const mathBackspaceCmd: ProseCommand = (state, dispatch) => {
  // check node before
  const { $from } = state.selection;
  const nodeBefore = $from.nodeBefore;
  if (!nodeBefore) {
    return false;
  }

  if (nodeBefore.type.name == "math_inline") {
    // select math node
    const index = $from.index($from.depth);
    const $beforePos = state.doc.resolve($from.posAtIndex(index - 1));
    if (dispatch) {
      dispatch(state.tr.setSelection(new NodeSelection($beforePos)));
    }
    return true;
  } else if (nodeBefore.type.name == "math_block") {
    /** @todo (8/1/20) implement backspace for math blocks
     * check how code blocks behave when pressing backspace
     */
    return false;
  }

  return false;
};
