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

import React from "react";
import {
  ActivityIndicator,
  ColorValue,
  DimensionValue,
  TextStyle,
  ViewStyle,
  useWindowDimensions
} from "react-native";
import { AppFontSize, defaultBorderRadius } from "../../../utils/size";
import NativeTooltip from "../../../utils/tooltip";
import { Pressable, PressableProps } from "../pressable";
import Heading from "../typography/heading";
import Paragraph from "../typography/paragraph";
import { Spacing } from "../../../common/design/spacing";
import { FontFamily } from "../../../common/design/font";
import AppIcon, { IconProps } from "../AppIcon";
import { useButton } from "../pressable/use-button";
export interface ButtonProps extends PressableProps {
  height?: number;
  icon?: string;
  fontSize?: number;
  tooltipText?: string;
  textStyle?: TextStyle;
  iconPosition?: "left" | "right";
  iconSize?: number;
  title?: string | null;
  loading?: boolean;
  width?: string | number | null;
  fontFamily?: keyof typeof FontFamily;
  buttonType?: {
    text?: ColorValue;
    selected?: ColorValue;
    color?: ColorValue;
    opacity?: number;
    alpha?: number;
  };
  bold?: boolean;
  iconColor?: ColorValue | ColorValue[];
  iconStyle?: TextStyle;
  iconFamily?: IconProps["iconFamily"];
  proTag?: boolean;
  allowFontScaling?: boolean;
}
export const Button = ({
  height = 45,
  width = null,
  onPress,
  loading = false,
  title = null,
  icon,
  fontFamily = "SEMI_BOLD",
  fontSize = AppFontSize.md,
  type = "transparent",
  iconSize = AppFontSize.md,
  style = {},
  accentColor,
  accentText = "#ffffff",
  onLongPress,
  tooltipText,
  textStyle,
  iconPosition = "left",
  buttonType,
  bold = true,
  iconColor,
  fwdRef,
  proTag,
  iconStyle,
  iconFamily,
  allowFontScaling = true,
  ...restProps
}: ButtonProps) => {
  const { text } = useButton({
    type,
    accent: accentColor,
    text: accentText
  });
  const textColor = buttonType?.text ? buttonType.text : text;

  const { fontScale } = useWindowDimensions();
  const growFactor = 1 + (fontScale - 1) / 10;

  const Component = bold ? Heading : Paragraph;

  return (
    <Pressable
      {...restProps}
      fwdRef={fwdRef}
      onPress={onPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress(event);
          return;
        }
        if (tooltipText) {
          NativeTooltip.show(event, tooltipText, NativeTooltip.POSITIONS.TOP);
        }
      }}
      disabled={loading || restProps.disabled}
      type={type}
      accentColor={accentColor}
      accentText={accentText}
      customColor={buttonType?.color}
      customSelectedColor={buttonType?.selected}
      customOpacity={buttonType?.opacity}
      customAlpha={buttonType?.alpha}
      style={{
        width:
          typeof width === "number"
            ? width * growFactor
            : (width as DimensionValue) || undefined,
        paddingHorizontal: Spacing.LEVEL_3,
        paddingVertical: Spacing.LEVEL_2,
        borderRadius: defaultBorderRadius,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        opacity: restProps?.disabled ? 0.5 : 1,
        ...(style as ViewStyle)
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size={fontSize + 4} />
      ) : null}
      {icon && !loading && iconPosition === "left" ? (
        <AppIcon
          name={icon}
          iconFamily={iconFamily}
          allowFontScaling={allowFontScaling}
          style={[{ marginRight: 0 }, iconStyle as any]}
          color={iconColor || buttonType?.text || textColor}
          size={iconSize}
        />
      ) : null}

      {!title ? null : (
        <Component
          color={textColor as string}
          size={fontSize}
          numberOfLines={1}
          fontFamily={fontFamily}
          allowFontScaling={allowFontScaling}
          style={[
            {
              marginLeft:
                icon || (loading && iconPosition === "left")
                  ? Spacing.LEVEL_1
                  : 0,
              marginRight:
                icon || (loading && iconPosition === "right")
                  ? Spacing.LEVEL_1
                  : 0
            },
            textStyle
          ]}
        >
          {title}
        </Component>
      )}

      {icon && !loading && iconPosition === "right" ? (
        <AppIcon
          name={icon}
          iconFamily={iconFamily}
          allowFontScaling
          style={[iconStyle as any]}
          color={iconColor || buttonType?.text || textColor}
          size={iconSize}
        />
      ) : null}
    </Pressable>
  );
};
