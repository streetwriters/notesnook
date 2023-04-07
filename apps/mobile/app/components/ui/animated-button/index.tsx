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
import { ActivityIndicator, ColorValue, ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  LightSpeedInLeft
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ColorKey, useThemeStore } from "../../../stores/use-theme-store";
import { showTooltip, TOOLTIP_POSITIONS } from "../../../utils";
import { BUTTON_TYPES } from "../../../utils/constants";
import { SIZE } from "../../../utils/size";
import { ButtonProps } from "../button";
import { PressableButton } from "../pressable";
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
  const colors = useThemeStore((state) => state.colors);

  const textColor = buttonType?.text
    ? buttonType.text
    : (colors[
        type === "accent"
          ? (BUTTON_TYPES[type](accentColor, accentText).text as ColorKey)
          : (BUTTON_TYPES[type].text as ColorKey)
      ] as ColorValue);
  const Component = bold ? Heading : Paragraph;

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={Layout.springify()}
    >
      <PressableButton
        {...restProps}
        fwdRef={fwdRef}
        onPress={onPress}
        onLongPress={(event) => {
          if (onLongPress) {
            onLongPress(event);
            return;
          }
          if (tooltipText) {
            showTooltip(event, tooltipText, TOOLTIP_POSITIONS.TOP);
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
        customStyle={{
          height: height,
          width: width || undefined,
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
      </PressableButton>
    </Animated.View>
  );
};
