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

import { Colors } from "../../theme-engine/types";
import * as CSS from "csstype";

export type SchemeColors = keyof Colors | CSS.Property.Color;
export function isThemeColor(
  color: string,
  colors: Colors
): color is keyof Colors {
  return color in colors;
}

// export function getColors(variants: Variants): Colors {
//   const colorScheme: ColorModesScale = {};

//   // for (const variant in variants) {
//   //   const colors = variants[variant as keyof Variants];
//   //   for (const color in colors) {
//   //     const colorValue = colors[color as keyof Colors];
//   //     colorScheme[`${variant}.${color}`] = colorValue;
//   //   }
//   // }
//   // return colorScheme;
// }
