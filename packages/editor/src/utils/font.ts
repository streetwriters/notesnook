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

import { getFontConfig } from "@notesnook/theme";

const FONTS = [
  {
    title: "Monospace",
    id: "monospace",
    font: getFontConfig().fonts.monospace
  },
  {
    title: "Sans-serif",
    id: "sans-serif",
    font: getFontConfig().fonts.body
  },
  {
    title: "Serif",
    id: "serif",
    font: `Noto Serif, Times New Roman, serif`
  }
];

export function getFonts() {
  return FONTS;
}

export function getFontById(id: string) {
  return FONTS.find((a) => a.id === id);
}

export function getFontIds() {
  return FONTS.map((a) => a.id);
}
