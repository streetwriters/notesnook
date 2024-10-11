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

import { FontSizes, getFontSizes } from "./fontsize.js";

const SANS_FONT_STACK = [
  `"Open Sans"`,
  `"Noto Sans"`,
  "Frutiger",
  "Calibri",
  "Myriad",
  "Arial",
  "Ubuntu",
  "Helvetica",
  "-apple-system",
  "BlinkMacSystemFont",
  "sans-serif"
];
const MONOSPACE_FONT_STACK = [
  "Hack",
  "Consolas",
  '"Andale Mono"',
  '"Lucida Console"',
  '"Liberation Mono"',
  '"Courier New"',
  "Courier",
  "monospace"
];

export type FontConfig = {
  fontSizes: FontSizes;
  fontWeights: {
    normal: number;
    body: number;
    heading: number;
    bold: number;
  };
  fonts: { body: string; monospace: string; heading: string };
};
export function getFontConfig(): FontConfig {
  return {
    fontSizes: getFontSizes(),
    fontWeights: {
      normal: 400,
      body: 400,
      heading: 600,
      bold: 600
    },
    fonts: {
      body: SANS_FONT_STACK.join(","),
      monospace: MONOSPACE_FONT_STACK.join(","),
      heading: SANS_FONT_STACK.join(",")
    }
  };
}
