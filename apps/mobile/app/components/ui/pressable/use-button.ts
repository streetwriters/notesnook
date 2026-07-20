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
import { VariantsWithStaticColors, useThemeColors } from "@notesnook/theme";
import { getColorLinearShade } from "../../../utils/colors";

export type ButtonTypes =
  | "plain"
  | "plain-outline"
  | "accent-background"
  | "transparent"
  | "accent"
  | "shade"
  | "shade-plain"
  | "secondary"
  | "tertiary"
  | "selectedAccent"
  | "secondaryAccented"
  | "inverted"
  | "white"
  | "error"
  | "errorShade"
  | "error-outline"
  | "warn"
  | "selected"
  | "accent-outline"
  | "secondary-outline"
  | "secondary-simple"
  | "error-shade-outline";

type ButtonVariant = {
  primary: string;
  text: string;
  selected: string;
  colorOpacity?: number;
  borderWidth?: number;
  borderColor?: string;
  borderSelectedColor?: string;
};

const buttonTypes = (
  colors: VariantsWithStaticColors<true>,
  accent?: string,
  text?: string,
  isDark?: boolean
): {
  [name: string]: ButtonVariant;
} => ({
  plain: {
    primary: "transparent",
    text: colors.primary.buttonForeground,
    selected: colors.primary.hover,
    borderWidth: 0.8,
    borderSelectedColor: getColorLinearShade(
      colors.selected.background,
      0.05,
      isDark
    )
  },
  "plain-outline": {
    primary: "transparent",
    text: colors.primary.buttonForeground,
    selected: colors.primary.hover,
    borderWidth: 1,
    borderColor: colors.primary.border,
    borderSelectedColor: colors.primary.border
  },
  "secondary-outline": {
    primary: "transparent",
    text: colors.secondary.paragraph,
    selected: colors.primary.hover,
    borderWidth: 1,
    borderColor: colors.secondary.border,
    borderSelectedColor: colors.secondary.border
  },
  transparent: {
    primary: "transparent",
    text: colors.primary.accent,
    selected: colors.secondary.background,
    borderWidth: 0.8,
    borderSelectedColor: getColorLinearShade(
      colors.selected.background,
      0.05,
      isDark
    )
  },
  secondary: {
    primary: colors.secondary.background,
    text: colors.primary.heading,
    selected: colors.secondary.background,
    borderWidth: 0.8,
    borderColor: getColorLinearShade(colors.secondary.background, 0.05, isDark),
    borderSelectedColor: getColorLinearShade(
      colors.selected.background,
      0.05,
      isDark
    )
  },
  "secondary-simple": {
    primary: colors.secondary.background,
    text: colors.primary.heading,
    selected: colors.secondary.background,
    borderWidth: 0
  },
  tertiary: {
    primary: colors.tertiary.background,
    text: colors.secondary.buttonForeground,
    selected: colors.secondary.background,
    borderWidth: 0.8,
    borderColor: getColorLinearShade(colors.secondary.background, 0.05, isDark),
    borderSelectedColor: getColorLinearShade(
      colors.selected.background,
      0.05,
      isDark
    )
  },
  selected: {
    primary: colors.selected.background,
    text: colors.selected.buttonForeground,
    selected: colors.selected.background,
    borderWidth: 0.8,
    borderColor: getColorLinearShade(colors.selected.background, 0.05, isDark),
    borderSelectedColor: getColorLinearShade(
      colors.selected.background,
      0.05,
      isDark
    )
  },
  selectedAccent: {
    primary: colors.selected.accent,
    text: colors.selected.accentForeground,
    selected: colors.selected.accent,
    borderWidth: 0.8,
    borderColor: getColorLinearShade(colors.selected.accent, 0.05, isDark),
    borderSelectedColor: getColorLinearShade(
      colors.selected.accent,
      0.05,
      isDark
    )
  },
  secondaryAccented: {
    primary: colors.secondary.background,
    text: colors.primary.accent,
    selected: colors.secondary.background,
    borderWidth: 0.8,
    borderColor: getColorLinearShade(colors.secondary.background, 0.05, isDark),
    borderSelectedColor: getColorLinearShade(
      colors.secondary.background,
      0.05,
      isDark
    )
  },
  accent: {
    primary: accent || colors.primary.accent,
    text: text || colors.primary.accentForeground,
    selected: accent || colors.primary.accent,
    borderWidth: 0.8,
    borderColor: getColorLinearShade(
      accent || colors.primary.accent,
      0.3,
      false
    ),
    borderSelectedColor: getColorLinearShade(
      accent || colors.primary.accent,
      0.3,
      false
    )
  },
  "accent-background": {
    primary: colors.primary.background,
    text: colors.primary.accent,
    selected: colors.primary.background,
    borderWidth: 0
  },
  "accent-outline": {
    primary: "transparent",
    text: colors.primary.accent,
    selected: "transparent",
    borderWidth: 1,
    borderColor: accent || colors.primary.accent,
    borderSelectedColor: accent || colors.primary.accent
  },
  inverted: {
    primary: colors.primary.background,
    text: colors.primary.accent,
    selected: colors.primary.background
  },
  white: {
    primary: "transparent",
    text: colors.static.white,
    selected: colors.primary.hover
  },
  shade: {
    primary: colors.primary.shade,
    text: colors.primary.accent,
    selected: colors.primary.accent,
    colorOpacity: 0.12,
    borderWidth: 0.8,
    borderColor: getColorLinearShade(colors.primary.shade, 0.3, isDark),
    borderSelectedColor: getColorLinearShade(colors.primary.shade, 0.3, isDark)
  },
  "shade-plain": {
    primary: colors.primary.shade,
    text: colors.primary.heading,
    selected: colors.primary.accent,
    colorOpacity: 0.12,
    borderWidth: 0
    // borderColor: getColorLinearShade(colors.primary.shade, 0.3, isDark),
    // borderSelectedColor: getColorLinearShade(colors.primary.shade, 0.3, isDark)
  },
  error: {
    primary: colors.error.background,
    text: colors.error.paragraph,
    selected: colors.error.background,
    borderWidth: 0.8,
    borderColor: getColorLinearShade(colors.error.background, 0.05, isDark),
    borderSelectedColor: getColorLinearShade(
      colors.error.background,
      0.07,
      isDark
    )
  },
  "error-shade-outline": {
    primary: colors.error.background,
    text: colors.error.paragraph,
    selected: colors.error.background,
    borderWidth: 0.8,
    borderColor: colors.error.border,
    borderSelectedColor: getColorLinearShade(colors.error.border, 0.07, isDark)
  },
  "error-outline": {
    primary: "transparent",
    text: colors.error.paragraph,
    selected: "transparent",
    borderWidth: 0.8,
    borderColor: colors.error.border,
    borderSelectedColor: getColorLinearShade(colors.error.border, 0.07, isDark)
  },
  errorShade: {
    primary: "transparent",
    text: colors.error.buttonForeground,
    selected: colors.error.background,
    borderWidth: 0.8,
    borderSelectedColor: getColorLinearShade(
      colors.error.background,
      0.05,
      isDark
    )
  },
  warn: {
    primary: colors.static.orange,
    text: colors.static.white,
    selected: colors.static.orange
  }
});

export const useButton = ({
  type,
  accent,
  text
}: {
  accent?: string;
  text?: string;
  type: ButtonTypes;
}): ButtonVariant => {
  const { colors, isDark } = useThemeColors();
  const types = buttonTypes(colors, accent, text, isDark);
  return types[type] || types["plain"];
};
