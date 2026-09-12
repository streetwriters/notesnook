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
export const FontSizes = {
  XXS: 10,
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 32
};

export const FontFamily = {
  REGULAR: "Inter-Regular", // 400
  MEDIUM: "Inter-Medium", // 500
  SEMI_BOLD: "Inter-SemiBold", // 600
  BOLD: "Inter-Bold" // 700
};

const LineHeightMultipliers = {
  "100%": 1,
  "110%": 1.1,
  "120%": 1.2,
  "130%": 1.3,
  "140%": 1.4,
  "150%": 1.5
};
export type LineHeightVariants =
  | "100%"
  | "110%"
  | "120%"
  | "130%"
  | "140%"
  | "150%";
export const getLineHeight = (
  fontSize: keyof typeof FontSizes,
  type: LineHeightVariants
) => {
  return FontSizes[fontSize] * LineHeightMultipliers[type];
};
