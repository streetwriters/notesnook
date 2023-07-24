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

import { useThemeColors } from "@notesnook/theme";
import React, { RefObject, useCallback } from "react";
import {
  ColorValue,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  View,
  ViewStyle
} from "react-native";
import Animated from "react-native-reanimated";
import { hexToRGBA, RGB_Linear_Shade } from "../../../utils/color-scheme/utils";
import { br } from "../../../utils/size";
export interface PressableButtonProps extends PressableProps {
  customStyle?: ViewStyle;
  noborder?: boolean;
  type?: ButtonTypes;
  accentColor?: string;
  accentText?: string;
  customColor?: ColorValue;
  customSelectedColor?: ColorValue;
  customAlpha?: number;
  customOpacity?: number;
  fwdRef?: RefObject<View>;
  animatedViewProps?: Animated.AnimateProps<View>;
  hidden?: boolean;
}

type ButtonTypes =
  | "transparent"
  | "accent"
  | "shade"
  | "gray"
  | "grayBg"
  | "grayAccent"
  | "inverted"
  | "white"
  | "error"
  | "errorShade"
  | "warn"
  | "selected";
export const useButton = ({
  type,
  accent,
  text
}: {
  accent?: string;
  text?: string;
  type: ButtonTypes;
}): {
  primary: string;
  text: string;
  selected: string;
  colorOpacity?: number;
} => {
  const { colors } = useThemeColors();
  const buttonTypes: {
    [name: string]: {
      primary: string;
      text: string;
      selected: string;
      colorOpacity?: number;
    };
  } = {
    transparent: {
      primary: "transparent",
      text: colors.primary.accent,
      selected: colors.secondary.background
    },
    gray: {
      primary: "transparent",
      text: colors.secondary.paragraph,
      selected: colors.primary.hover
    },
    grayBg: {
      primary: colors.secondary.background,
      text: colors.secondary.paragraph,
      selected: colors.secondary.background
    },
    selected: {
      primary: colors.selected.background,
      text: colors.selected.paragraph,
      selected: colors.selected.background
    },
    grayAccent: {
      primary: colors.secondary.background,
      text: colors.primary.accent,
      selected: colors.secondary.background
    },
    accent: {
      primary: accent || colors.primary.accent,
      text: text || colors.primary.paragraph,
      selected: accent || colors.primary.accent
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
      colorOpacity: 0.12
    },
    error: {
      primary: colors.error.background,
      text: colors.error.paragraph,
      selected: colors.error.background
    },
    errorShade: {
      primary: "transparent",
      text: colors.error.paragraph,
      selected: colors.error.background
    },
    warn: {
      primary: colors.static.orange,
      text: colors.static.white,
      selected: colors.static.orange
    }
  };

  return buttonTypes[type];
};

export const PressableButton = ({
  children,
  onPress,
  customStyle = {},
  onLongPress,
  hitSlop,
  testID,
  disabled,
  type = "gray",
  noborder,
  accentColor,
  accentText = "#ffffff",
  customColor,
  customSelectedColor,
  customAlpha,
  customOpacity,
  fwdRef,
  hidden
}: PressableButtonProps) => {
  const { isDark } = useThemeColors();
  const { primary, selected, colorOpacity } = useButton({
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
  const alpha = customAlpha ? customAlpha : isDark ? 0.04 : -0.04;

  const getStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): ViewStyle | ViewStyle[] => [
      {
        backgroundColor: pressed
          ? RGB_Linear_Shade(alpha, hexToRGBA(selectedColor, opacity || 1))
          : hexToRGBA(primaryColor, opacity || 1 - 0.02),
        width: "100%",
        alignSelf: "center",
        borderRadius: noborder ? 0 : br,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 0
      },
      customStyle
    ],
    [alpha, selectedColor, opacity, primaryColor, noborder, customStyle]
  );

  return hidden ? null : (
    <Pressable
      testID={testID}
      ref={fwdRef}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={onLongPress}
      style={getStyle}
    >
      {children}
    </Pressable>
  );
};
