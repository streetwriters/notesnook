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
import React, { RefObject, useCallback } from "react";
import {
  ColorValue,
  PressableStateCallbackType,
  Pressable as RNPressable,
  PressableProps as RNPressableProps,
  View,
  ViewStyle,
  useWindowDimensions
} from "react-native";
import {
  RGB_Linear_Shade,
  getColorLinearShade,
  hexToRGBA
} from "../../../utils/colors";
import { defaultBorderRadius } from "../../../utils/size";
export interface PressableProps extends RNPressableProps {
  style?: ViewStyle;
  noborder?: boolean;
  type?: ButtonTypes;
  accentColor?: string;
  accentText?: string;
  customColor?: ColorValue;
  customSelectedColor?: ColorValue;
  customAlpha?: number;
  customOpacity?: number;
  fwdRef?: RefObject<View>;
  hidden?: boolean;
}

type ButtonTypes =
  | "plain"
  | "transparent"
  | "accent"
  | "shade"
  | "secondary"
  | "secondaryAccented"
  | "inverted"
  | "white"
  | "error"
  | "errorShade"
  | "warn"
  | "selected";

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
    text: colors.primary.paragraph,
    selected: colors.primary.hover,
    borderWidth: 0.8,
    borderSelectedColor: getColorLinearShade(
      colors.selected.background,
      0.05,
      isDark
    )
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
    text: colors.secondary.paragraph,
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
    text: colors.selected.paragraph,
    selected: colors.selected.background,
    borderWidth: 0.8,
    borderColor: getColorLinearShade(colors.selected.background, 0.05, isDark),
    borderSelectedColor: getColorLinearShade(
      colors.selected.background,
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
  errorShade: {
    primary: "transparent",
    text: colors.error.paragraph,
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

export const Pressable = ({
  children,
  onPress,
  style = {},
  onLongPress,
  hitSlop,
  testID,
  disabled,
  type = "plain",
  noborder,
  accentColor,
  accentText = "#ffffff",
  customColor,
  customSelectedColor,
  customAlpha,
  customOpacity,
  fwdRef,
  hidden,
  ...props
}: PressableProps) => {
  const { isDark } = useThemeColors();
  const {
    primary,
    selected,
    colorOpacity,
    borderColor,
    borderSelectedColor,
    borderWidth
  } = useButton({
    type,
    accent: accentColor,
    text: accentText
  });
  const selectedColor = customSelectedColor || selected;
  const primaryColor = customColor || primary;
  const opacity = customOpacity
    ? customOpacity
    : type === "accent"
    ? 1
    : colorOpacity;
  const alpha = customAlpha ? customAlpha : isDark ? 0.03 : -0.03;
  const { fontScale } = useWindowDimensions();
  const growFactor = 1 + (fontScale - 1) / 8;

  const getStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): ViewStyle | ViewStyle[] => [
      {
        backgroundColor:
          pressed && !disabled
            ? RGB_Linear_Shade(alpha, hexToRGBA(selectedColor, opacity || 1))
            : hexToRGBA(primaryColor, opacity || 1),
        width: "100%",
        alignSelf: "center",
        borderRadius: noborder ? 0 : defaultBorderRadius,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 0,
        borderColor: pressed
          ? customSelectedColor
            ? getColorLinearShade(customSelectedColor, 0.3, false)
            : borderSelectedColor || borderColor
          : borderColor || "transparent",
        borderWidth: noborder ? 0 : borderWidth
      },
      style,
      {
        height:
          typeof style.height === "number"
            ? style.height * growFactor
            : style.height
      }
    ],
    [
      alpha,
      selectedColor,
      opacity,
      primaryColor,
      noborder,
      customSelectedColor,
      borderSelectedColor,
      borderColor,
      borderWidth,
      style,
      growFactor,
      disabled
    ]
  );

  return hidden ? null : (
    <RNPressable
      {...props}
      testID={testID}
      ref={fwdRef}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={onLongPress}
      style={getStyle}
    >
      {children}
    </RNPressable>
  );
};
