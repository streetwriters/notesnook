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

import type { EditorCommand } from "../../controller.js";

/** The cell attributes the cell properties popup edits, one per tab. */
export const CELL_PROPERTY_ATTRIBUTES = [
  "backgroundColor",
  "color",
  "borderColor"
] as const;

export type CellPropertyAttribute = (typeof CELL_PROPERTY_ATTRIBUTES)[number];

/**
 * The command a colour pick (or a clear, with `undefined`) sends to the
 * editor: `setCellAttribute(name, value)`, which both the Tiptap and the
 * native editor implement.
 */
export function setCellAttributeCommand(
  name: CellPropertyAttribute,
  value: string | undefined
): EditorCommand {
  return { name: "setCellAttribute", args: [name, value] };
}
