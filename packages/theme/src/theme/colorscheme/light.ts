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

export function getLightScheme(accent: string): SchemeColors {
  return {
    primary: accent,
    background: "white",
    bgTransparent: "#f7f7f799",
    accent: "white",
    bgSecondary: "#f7f7f7",
    bgSecondaryText: "#5E5E5E",
    bgSecondaryHover: "#dbdbdb",
    border: "#e5e5e5",
    hover: "#f0f0f0",
    fontSecondary: "white",
    fontTertiary: "#656565",
    text: "#202124",
    overlay: "rgba(0, 0, 0, 0.1)",
    secondary: "white",
    icon: "#3b3b3b",
    disabled: "#9b9b9b",
    placeholder: tinycolor("#000000").setAlpha(0.6).toRgbString(),
    checked: "#505050",
    ...getStaticColors(accent),

    red: "#f44336",
    orange: "#FF9800",
    yellow: "#f0c800",
    green: "#4CAF50",
    blue: "#2196F3",
    purple: "#9568ED",
    gray: "#9E9E9E"
  };
}
