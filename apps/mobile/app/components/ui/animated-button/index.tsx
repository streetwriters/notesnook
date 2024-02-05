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
import { ActivityIndicator, DimensionValue, ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  LightSpeedInLeft
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SIZE } from "../../../utils/size";
import NativeTooltip from "../../../utils/tooltip";
import { ButtonProps } from "../button";
import { Pressable, useButton } from "../pressable";
import Heading from "../typography/heading";
import Paragraph from "../typography/paragraph";
const AnimatedIcon = Animated.createAnimatedComponent(Icon);

export const AnimatedButton = ({
  height = 45,
  width = null,
  onPress,
  loading = false,
  title = null,
  icon,
  fontSize = SIZE.sm,
  type = "transparent",
  iconSize = SIZE.md,
  style = {},
  accentColor = "accent",
  accentText = "light",
  onLongPress,
  tooltipText,
  textStyle,
  iconPosition = "left",
  buttonType,
  bold,
  iconColor,
  fwdRef,
  ...restProps
}: ButtonProps) => {
  const { text } = useButton({
    type,
    accent: accentColor,
    text: accentText
  });
  const textColor = buttonType?.text ? buttonType.text : text;
  const Component = bold ? Heading : Paragraph;

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={Layout.springify()}
    >
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
        disabled={loading}
        type={type}
        accentColor={accentColor}
        accentText={accentText}
        customColor={buttonType?.color}
        customSelectedColor={buttonType?.selected}
        customOpacity={buttonType?.opacity}
        customAlpha={buttonType?.alpha}
        style={{
          height: height,
          width: (width as DimensionValue) || undefined,
          paddingHorizontal: 12,
          borderRadius: 5,
          alignSelf: "center",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          ...(style as ViewStyle)
        }}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size={fontSize + 4} />
        ) : null}
        {icon && !loading && iconPosition === "left" ? (
          <AnimatedIcon
            exiting={FadeOut.duration(100)}
            entering={LightSpeedInLeft}
            layout={Layout.springify()}
            name={icon}
            style={{
              marginRight: 0
            }}
            color={iconColor || buttonType?.text || textColor}
            size={iconSize}
          />
        ) : null}

        {!title ? null : (
          <Component
            layout={Layout.springify()}
            animated={true}
            color={textColor as string}
            size={fontSize}
            numberOfLines={1}
            style={[
              {
                marginLeft:
                  icon || (loading && iconPosition === "left") ? 5 : 0,
                marginRight:
                  icon || (loading && iconPosition === "right") ? 5 : 0
              },
              textStyle
            ]}
          >
            {title}
          </Component>
        )}

        {icon && !loading && iconPosition === "right" ? (
          <Icon
            name={icon}
            style={{
              marginLeft: 0
            }}
            color={iconColor || buttonType?.text || textColor}
            size={iconSize}
          />
        ) : null}
      </Pressable>
    </Animated.View>
  );
};
