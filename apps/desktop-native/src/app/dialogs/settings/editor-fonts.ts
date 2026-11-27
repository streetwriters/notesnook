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

// The fonts the editor offers; web takes this list from @notesnook/editor
// (Tiptap), which the native editor does not ship.

import { strings } from "@notesnook/intl";
import { getFontConfig } from "@notesnook/theme";

export function getFonts() {
  return [
    {
      title: strings.monospace(),
      id: "monospace",
      font: getFontConfig().fonts.monospace
    },
    {
      title: strings.sansSerif(),
      id: "sans-serif",
      font: getFontConfig().fonts.body
    },
    {
      title: strings.serif(),
      id: "serif",
      font: `Noto Serif, Times New Roman, serif`
    }
  ];
}
