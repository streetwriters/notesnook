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
import {
  ColorKey,
  ThemeStore,
  useThemeStore
} from "../../../stores/use-theme-store";
import { hexToRGBA, RGB_Linear_Shade } from "../../../utils/color-scheme/utils";
import { BUTTON_TYPES } from "../../../utils/constants";
import { br } from "../../../utils/size";
export interface PressableButtonProps extends PressableProps {
  customStyle?: ViewStyle;
  noborder?: boolean;
  type?: keyof typeof BUTTON_TYPES;
  accentColor?: keyof ThemeStore["colors"];
  accentText?: keyof ThemeStore["colors"];
  customColor?: ColorValue;
  customSelectedColor?: ColorValue;
  customAlpha?: number;
  customOpacity?: number;
  fwdRef?: RefObject<View>;
  animatedViewProps?: Animated.AnimateProps<View>;
  hidden?: boolean;
}

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
  accentColor = "accent",
  accentText = "light",
  customColor,
  customSelectedColor,
  customAlpha,
  customOpacity,
  fwdRef,
  hidden
}: PressableButtonProps) => {
  const colors = useThemeStore((state) => state.colors);

  const selectedColor =
    customSelectedColor ||
    colors[
      type === "accent"
        ? (BUTTON_TYPES[type](accentColor, accentText).selected as ColorKey)
        : (BUTTON_TYPES[type].selected as ColorKey)
    ];
  const primaryColor =
    customColor ||
    colors[
      type === "accent"
        ? (BUTTON_TYPES[type](accentColor, accentText).primary as ColorKey)
        : (BUTTON_TYPES[type].primary as ColorKey)
    ];
  const opacity = customOpacity
    ? customOpacity
    : type === "accent"
    ? 1
    : //@ts-ignore
      BUTTON_TYPES[type].opacity;
  const alpha = customAlpha ? customAlpha : colors.night ? 0.04 : -0.04;

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
