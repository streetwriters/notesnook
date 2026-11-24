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
import { Node } from "prosemirror-model";
import { Command } from "prosemirror-state";
import { CellSelection } from "../prosemirror-tables/cellselection.js";
import { isInTable, selectionCell } from "../prosemirror-tables/util.js";

export function setCellBorderColor(color: string): Command {
  return function (state, dispatch) {
    if (!isInTable(state)) return false;
    const $cell = selectionCell(state);
    const cell = $cell.nodeAfter;
    if (!cell) return false;
    const tr = state.tr;
    let changed = false;
    const updateCell = (node: Node, pos: number) => {
      const attrs: Record<string, unknown> = {
        ...node.attrs,
        borderColor: color
      };
      // Imported cells can explicitly hide their borders. Choosing a color
      // should make those borders visible without restyling visible borders.
      if (attrs.borderStyle === "none" || attrs.borderStyle === "hidden")
        attrs.borderStyle = "solid";
      if (attrs.borderWidth === "0" || attrs.borderWidth === 0)
        attrs.borderWidth = 1;
      if (Object.keys(attrs).every((key) => attrs[key] === node.attrs[key]))
        return;
      changed = true;
      if (dispatch) tr.setNodeMarkup(pos, null, attrs);
    };
    if (state.selection instanceof CellSelection)
      state.selection.forEachCell(updateCell);
    else updateCell(cell, $cell.pos);
    if (changed && dispatch) dispatch(tr);
    return changed;
  };
}
