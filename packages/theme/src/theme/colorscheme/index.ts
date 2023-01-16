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

import { getDarkScheme } from "./dark";
import { getLightScheme } from "./light";
import { StaticColors } from "./static";

const colorSchemes = {
  dark: getDarkScheme,
  light: getLightScheme
};

export type ColorSchemes = keyof typeof colorSchemes;
export function getColors(theme: ColorSchemes, accent: string) {
  return colorSchemes[theme](accent);
}

export type SchemeColors = StaticColors & {
  primary: string;
  placeholder: string;
  background: string;
  bgTransparent: string;
  accent: string;
  bgSecondary: string;
  bgSecondaryText: string;
  bgSecondaryHover: string;
  border: string;
  hover: string;
  fontSecondary: string;
  fontTertiary: string;
  text: string;
  overlay: string;
  secondary: string;
  icon: string;
  disabled: string;
  checked: string;

  red: string;
  orange: string;
  yellow: string;
  green: string;
  blue: string;
  purple: string;
  gray: string;
};
