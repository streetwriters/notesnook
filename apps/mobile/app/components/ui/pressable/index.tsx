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
import { ButtonTypes, useButton } from "./use-button";
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
  fwdRef?: RefObject<View | null>;
  hidden?: boolean;
}


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
      onPress={(e) => {
        if (disabled) return;
        onPress?.(e);
      }}
      onLongPress={onLongPress}
      style={getStyle}
    >
      {children}
    </RNPressable>
  );
};
