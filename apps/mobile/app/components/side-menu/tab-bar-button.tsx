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
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { Radius, Spacing } from "../../common/design/spacing";
import AppIcon from "../ui/AppIcon";

type TabBarButtonProps = {
  icon: string;
  label?: string;
  onPress: () => void;
  isActive?: boolean;
  testID?: string;
};

export const TabBarButton = ({
  icon,
  label,
  onPress,
  isActive = false,
  testID
}: TabBarButtonProps) => {
  const { colors } = useThemeColors();
  const scale = useSharedValue(1);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePress = () => {
    scale.value = withSpring(0.85, {
      damping: 100,
      mass: 1,
      overshootClamping: false
    });

    setTimeout(() => {
      scale.value = withSpring(1, {
        damping: 100,
        mass: 1,
        overshootClamping: false
      });
    }, 100);

    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      style={{
        borderRadius: 10,
        paddingVertical: 2,
        width: undefined,
        gap: label ? Spacing.LEVEL_1 : 0,
        backgroundColor: "transparent",
        borderWidth: 0
      }}
      type={"plain"}
    >
      <Animated.View
        style={[
          {
            backgroundColor: isActive ? colors.primary.shade : undefined,
            borderRadius: Radius.XS,
            padding: Spacing.LEVEL_1
          },
          animatedIconStyle
        ]}
      >
        <AppIcon
          name={icon}
          iconFamily="notesnook"
          color={isActive ? colors.primary.icon : colors.secondary.icon}
          size={16}
        />
      </Animated.View>

      {label && (
        <Paragraph
          color={isActive ? colors.primary.heading : colors.secondary.heading}
          fontFamily={isActive ? "MEDIUM" : "REGULAR"}
          fontSize={"XS"}
        >
          {label}
        </Paragraph>
      )}
    </Pressable>
  );
};
