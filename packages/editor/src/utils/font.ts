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
import { strings } from "@notesnook/intl";

const getFontsList = () => [
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

export function getFonts() {
  return getFontsList();
}

export function getFontById(id: string) {
  return getFontsList().find((a) => a.id === id);
}

export function getFont(font: string) {
  return getFontsList().find(
    (a) => normalizeFontFamily(a.font) === normalizeFontFamily(font)
  );
}

export function getFontIds() {
  return getFontsList().map((a) => a.id);
}

function normalizeFontFamily(fontFamily: string) {
  return fontFamily.replace(/['",\s]+/g, "");
}
