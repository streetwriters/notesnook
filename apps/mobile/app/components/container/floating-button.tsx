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
import { useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect } from "react";
import { Keyboard, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../e2e/test.ids";
import { editorState } from "../../screens/editor/tiptap/utils";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { getElevationStyle } from "../../utils/elevation";
import { SIZE, normalize } from "../../utils/size";
import { Pressable } from "../ui/pressable";

interface FloatingButtonProps {
  onPress: () => void;
  color?: string;
  shouldShow?: boolean;
  alwaysVisible?: boolean;
}

const FloatingButton = ({
  onPress,
  color,
  alwaysVisible = false
}: FloatingButtonProps) => {
  const { colors } = useThemeColors();
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const translate = useSharedValue(0);
  const route = useRoute();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translate.value
        },
        {
          translateY: translate.value
        }
      ]
    };
  });

  const animate = useCallback(
    (toValue: number) => {
      translate.value = withTiming(toValue, {
        duration: 250,
        easing: Easing.elastic(1)
      });
    },
    [translate]
  );

  useEffect(() => {
    animate(selectionMode ? 150 : 0);
  }, [animate, selectionMode]);

  useEffect(() => {
    const onKeyboardHide = () => {
      editorState().keyboardState = false;
      if (deviceMode !== "mobile") return;
      animate(0);
    };

    const onKeyboardShow = () => {
      editorState().keyboardState = true;
      if (deviceMode !== "mobile") return;
      animate(150);
    };

    const sub = [
      Keyboard.addListener("keyboardDidShow", onKeyboardShow),
      Keyboard.addListener("keyboardDidHide", onKeyboardHide)
    ];
    return () => {
      sub.forEach((sub) => sub?.remove?.());
    };
  }, [deviceMode, animate]);

  return deviceMode !== "mobile" && !alwaysVisible ? null : (
    <Animated.View
      style={[
        {
          position: "absolute",
          right: 12,
          bottom: 20,
          zIndex: 10
        },
        animatedStyle
      ]}
    >
      <Pressable
        testID={notesnook.buttons.add}
        type="accent"
        accentColor={color}
        style={{
          ...getElevationStyle(5),
          borderRadius: 100
        }}
        onPress={onPress}
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            height: normalize(60),
            width: normalize(60)
          }}
        >
          <Icon
            name={
              route.name === "Notebooks"
                ? "notebook-plus"
                : route.name === "Trash"
                ? "delete"
                : "plus"
            }
            color={colors.primary.accentForeground}
            size={SIZE.xxl}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export { FloatingButton };
