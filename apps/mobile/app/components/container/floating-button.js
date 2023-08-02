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

import React, { useCallback, useEffect } from "react";
import { Keyboard, Platform, View } from "react-native";
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
import NativeTooltip from "../../utils/tooltip";
import { PressableButton } from "../ui/pressable";
import { useThemeColors } from "@notesnook/theme";

export const FloatingButton = ({
  title,
  onPress,
  color,
  shouldShow = false
}) => {
  const { colors } = useThemeColors();
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const translate = useSharedValue(0);

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

  useEffect(() => {
    animate(selectionMode ? 150 : 0);
  }, [animate, selectionMode]);

  const animate = useCallback(
    (toValue) => {
      translate.value = withTiming(toValue, {
        duration: 250,
        easing: Easing.elastic(1)
      });
    },
    [translate]
  );

  const onKeyboardHide = useCallback(async () => {
    editorState().keyboardState = false;
    if (deviceMode !== "mobile") return;
    animate(0);
  }, [animate, deviceMode]);

  const onKeyboardShow = useCallback(async () => {
    editorState().keyboardState = true;
    if (deviceMode !== "mobile") return;
    animate(150);
  }, [animate, deviceMode]);

  useEffect(() => {
    let sub1 = Keyboard.addListener("keyboardDidShow", onKeyboardShow);
    let sub2 = Keyboard.addListener("keyboardDidHide", onKeyboardHide);
    return () => {
      sub1?.remove();
      sub2?.remove();
    };
  }, [deviceMode, onKeyboardHide, onKeyboardShow]);
  const paddings = {
    ios: 20,
    android: 20,
    iPad: 20
  };

  return deviceMode !== "mobile" && !shouldShow ? null : (
    <Animated.View
      style={[
        {
          position: "absolute",
          right: 12,
          bottom: paddings[Platform.isPad ? "iPad" : Platform.OS],
          zIndex: 10
        },
        animatedStyle
      ]}
    >
      <PressableButton
        testID={notesnook.buttons.add}
        type="accent"
        buttonType={{
          color: colors.static[color],
          text: colors.static.white
        }}
        customStyle={{
          ...getElevationStyle(5),
          borderRadius: 100
        }}
        onLongPress={(event) => {
          NativeTooltip.show(event, title, NativeTooltip.POSITIONS.LEFT);
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
            name={title === "Clear all trash" ? "delete" : "plus"}
            color="white"
            size={SIZE.xxl}
          />
        </View>
      </PressableButton>
    </Animated.View>
  );
};
