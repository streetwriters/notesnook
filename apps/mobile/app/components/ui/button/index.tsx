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
import {
  ActivityIndicator,
  ColorValue,
  DimensionValue,
  TextStyle,
  View,
  ViewStyle,
  useWindowDimensions
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useUserStore } from "../../../stores/use-user-store";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size";
import NativeTooltip from "../../../utils/tooltip";
import { ProTag } from "../../premium/pro-tag";
import { Pressable, PressableProps, useButton } from "../pressable";
import Heading from "../typography/heading";
import Paragraph from "../typography/paragraph";
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
  buttonType?: {
    text?: ColorValue;
    selected?: ColorValue;
    color?: ColorValue;
    opacity?: number;
    alpha?: number;
  };
  bold?: boolean;
  iconColor?: ColorValue;
  iconStyle?: TextStyle;
  proTag?: boolean;
}
export const Button = ({
  height = 45,
  width = null,
  onPress,
  loading = false,
  title = null,
  icon,
  fontSize = AppFontSize.sm,
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
  bold,
  iconColor,
  fwdRef,
  proTag,
  iconStyle,
  ...restProps
}: ButtonProps) => {
  const { colors } = useThemeColors();
  const premium = useUserStore((state) => state.premium);
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
        height: typeof height === "number" ? height * growFactor : height,
        width:
          typeof width === "number"
            ? width * growFactor
            : (width as DimensionValue) || undefined,
        paddingHorizontal: 12,
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
        <Icon
          name={icon}
          allowFontScaling
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
          style={[
            {
              marginLeft: icon || (loading && iconPosition === "left") ? 5 : 0,
              marginRight: icon || (loading && iconPosition === "right") ? 5 : 0
            },
            textStyle
          ]}
        >
          {title}
        </Component>
      )}
      {proTag && !premium ? (
        <View
          style={{
            marginLeft: 10
          }}
        >
          <ProTag size={10} width={40} background={colors.primary.shade} />
        </View>
      ) : null}

      {icon && !loading && iconPosition === "right" ? (
        <Icon
          name={icon}
          allowFontScaling
          style={[{ marginLeft: 0 }, iconStyle as any]}
          color={iconColor || buttonType?.text || textColor}
          size={iconSize}
        />
      ) : null}
    </Pressable>
  );
};
