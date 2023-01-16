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

import tinycolor from "tinycolor2";
import { SchemeColors } from ".";
import { getStaticColors } from "./static";

export function getDarkScheme(accent: string): SchemeColors {
  return {
    primary: accent,
    placeholder: tinycolor("#ffffff").setAlpha(0.6).toRgbString(),
    background: "#1b1b1b",
    bgTransparent: "#1f1f1f99",
    accent: "#000",
    bgSecondary: "#2b2b2b",
    bgSecondaryText: "#A1A1A1",
    bgSecondaryHover: "#3d3d3d",
    border: "#353535",
    hover: "#2f2f2f",
    fontSecondary: "#000",
    fontTertiary: "#A1A1A1",
    text: "#d3d3d3",
    overlay: "rgba(53, 53, 53, 0.5)",
    secondary: "black",
    icon: "#dbdbdb",
    disabled: "#5b5b5b",
    checked: "#6b6b6b",
    ...getStaticColors(accent),

    // COLORS
    red: "#f44336",
    orange: "#FF9800",
    yellow: "#FFD600",
    green: "#4CAF50",
    blue: "#2196F3",
    purple: "#9568ED",
    gray: "#9E9E9E"
  };
}
