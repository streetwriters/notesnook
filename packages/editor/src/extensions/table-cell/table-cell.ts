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

import TiptapTableCell from "@tiptap/extension-table-cell";
import { addStyleAttribute } from "./utils.js";

export const TableCell = TiptapTableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: addStyleAttribute("backgroundColor", "background-color"),
      color: addStyleAttribute("color", "color"),
      borderWidth: addStyleAttribute("borderWidth", "border-width", "px"),
      borderStyle: addStyleAttribute("borderStyle", "border-style"),
      borderColor: addStyleAttribute("borderColor", "border-color")
    };
  }
});
