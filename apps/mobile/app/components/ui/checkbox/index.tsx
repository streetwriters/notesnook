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
import React from "react";
import { ColorValue, DimensionValue, TextStyle, ViewStyle } from "react-native";
import { FontFamily } from "../../../common/design/font";
import { Radius, Spacing } from "../../../common/design/spacing";
import { AppFontSize } from "../../../utils/size";
import AppIcon from "../AppIcon";
import { Pressable, PressableProps } from "../pressable";
import Paragraph from "../typography/paragraph";

export interface CheckboxProps extends Omit<PressableProps, "style"> {
  checked?: boolean;
  title?: string | null;
  onPress?: () => void;
  type?: PressableProps["type"];
  style?: ViewStyle;
  textStyle?: TextStyle;
  fontSize?: number;
  fontFamily?: keyof typeof FontFamily;
  iconSize?: number;
  iconColor?: ColorValue | ColorValue[];
  width?: DimensionValue | null;
  disabled?: boolean;
  /**
   * Hide the whole component when set to false.
   *
   * @default true
   */
  visible?: boolean;
}

export const Checkbox = ({
  checked,
  title = null,
  onPress,
  type = "shade",
  style,
  textStyle,
  fontSize = AppFontSize.xs,
  fontFamily = "MEDIUM",
  iconSize = 16,
  iconColor,
  width = "100%",
  disabled,
  visible = true,
  ...restProps
}: CheckboxProps) => {
  const { colors } = useThemeColors();

  if (!visible) return null;

  return (
    <Pressable
      {...restProps}
      onPress={onPress}
      disabled={disabled}
      type={type}
      style={{
        width: width || undefined,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        flexShrink: 1,
        gap: Spacing.LEVEL_1,
        paddingHorizontal: Spacing.LEVEL_2,
        paddingVertical: Spacing.LEVEL_2,
        borderRadius: Radius.XS,
        opacity: disabled ? 0.5 : 1,
        ...style
      }}
    >
      <AppIcon
        name={checked ? "checkbox" : "box-empty"}
        iconFamily="notesnook"
        size={iconSize}
        color={
          iconColor ||
          (checked
            ? [colors.primary.accent, colors.primary.accentForeground]
            : colors.primary.icon)
        }
      />

      {title ? (
        <Paragraph
          numberOfLines={1}
          size={fontSize}
          fontFamily={fontFamily}
          color={colors.primary.paragraph}
          style={[{ flexShrink: 1 }, textStyle]}
        >
          {title}
        </Paragraph>
      ) : null}
    </Pressable>
  );
};
