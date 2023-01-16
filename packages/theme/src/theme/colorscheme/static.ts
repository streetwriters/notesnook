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

export type StaticColors = {
  shade: string;
  textSelection: string;
  dimPrimary: string;
  transparent: string;
  static: string;
  error: string;
  errorBg: string;
  success: string;
  warn: string;
  warnBg: string;
  info: string;
  infoBg: string;
  favorite: string;

  codeBg: string;
  codeFg: string;
  codeHighlight: string;
  codeSelectionBg: string;
  codeSelectionFg: string;
  codeBorder: string;
  codeSelection: string;
};
export function getStaticColors(accent: string): StaticColors {
  return {
    shade: tinycolor(accent).setAlpha(0.1).toRgbString(),
    textSelection: tinycolor(accent).setAlpha(0.2).toRgbString(),
    dimPrimary: tinycolor(accent).setAlpha(0.7).toRgbString(),
    transparent: "transparent",
    static: "white",
    error: "#E53935",
    errorBg: "#E5393520",
    success: "#4F8A10",
    warn: "#FF5722",
    warnBg: "#FF572220",
    info: "#17a2b8",
    infoBg: "#17a2b820",
    favorite: "#ffd700",

    // dracula colors
    codeBg: "#282a36",
    codeFg: "#6c7393",
    codeHighlight: "#50fa7b",
    codeSelectionFg: "#f8f8f2",
    codeSelectionBg: "#44475a",
    codeBorder: "#6c7393",
    codeSelection: "#9580ff1a"
  };
}
