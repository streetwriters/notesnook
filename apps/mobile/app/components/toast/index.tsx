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
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardEvent,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../e2e/test.ids";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { DDS } from "../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastOptions
} from "../../services/event-manager";
import { getElevationStyle } from "../../utils/elevation";
import { eHideToast, eShowToast } from "../../utils/events";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

export const Toast = ({
  context = "global",
  avoidKeyboard = context === "global"
}: {
  context?: string;
  avoidKeyboard?: boolean;
}) => {
  const { colors, isDark } = useThemeColors();
  const [toastOptions, setToastOptions] = useState<ToastOptions | undefined>();
  const hideTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const insets = useGlobalSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const toastMessages = useRef<ToastOptions[]>([]);
  const dimensions = useWindowDimensions();
  const keyboardHeight = useSharedValue(0);

  const getKeyboardOffset = useCallback(
    (e?: KeyboardEvent | null) => {
      const metrics =
        e?.endCoordinates ||
        (Keyboard.isVisible?.() ? Keyboard.metrics?.() : undefined);
      const rawHeight = metrics?.height || 0;
      const screenY = metrics?.screenY;
      const screenHeight = Dimensions.get("screen").height;
      const windowHeight = Dimensions.get("window").height;

      let calculatedHeight = 0;
      if (screenY != null && screenY > 0) {
        calculatedHeight = Math.max(
          screenHeight - screenY,
          windowHeight - screenY
        );
      }

      const actualKeyboardHeight = Math.max(rawHeight, calculatedHeight);
      if (!actualKeyboardHeight) return 0;

      // Ensure clearance above software keyboard + editor toolbar (~50px) + margin (~20px)
      return actualKeyboardHeight + 70;
    },
    []
  );

  const animatedStyle = useAnimatedStyle(() => ({
    bottom:
      avoidKeyboard && keyboardHeight.value > 0
        ? Math.max(keyboardHeight.value, insets.bottom + 15)
        : insets.bottom + 15
  }));

  useEffect(() => {
    if (!avoidKeyboard) return;

    const onKeyboardHide = () => {
      keyboardHeight.value = withTiming(0, {
        duration: 250
      });
    };

    const onKeyboardShow = (e: KeyboardEvent) => {
      const offset = getKeyboardOffset(e);
      if (!offset) return;
      keyboardHeight.value = withTiming(offset, {
        duration: 250
      });
    };

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const sub = [
      Keyboard.addListener(showEvent, onKeyboardShow),
      Keyboard.addListener(hideEvent, onKeyboardHide)
    ];
    if (Platform.OS === "ios") {
      sub.push(Keyboard.addListener("keyboardDidShow", onKeyboardShow));
      sub.push(Keyboard.addListener("keyboardDidHide", onKeyboardHide));
    }
    return () => {
      sub.forEach((s) => s.remove());
    };
  }, [avoidKeyboard, getKeyboardOffset, keyboardHeight]);

  const hideToast = useCallback(() => {
    const nextToastMessage = toastMessages.current.shift();
    if (nextToastMessage) {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
      setVisible(true);
      setToastOptions(nextToastMessage);
      hideTimeout.current = setTimeout(() => {
        hideToast();
      }, nextToastMessage?.duration);
    } else {
      setVisible(false);
      setToastOptions(undefined);
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    }
  }, []);

  const showToast = useCallback(
    (data?: ToastOptions) => {
      if (
        !data ||
        data.context !== context ||
        toastMessages.current.findIndex((m) => m.message === data.message) != -1
      )
        return;

      toastMessages.current.push(data);
      if (toastMessages.current?.length > 1) return;

      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
      if (
        avoidKeyboard &&
        keyboardHeight.value === 0 &&
        Keyboard.isVisible?.()
      ) {
        const offset = getKeyboardOffset();
        if (offset > 0) {
          keyboardHeight.value = offset;
        }
      }
      setVisible(true);
      const nextToastMessage = toastMessages.current.shift();
      setToastOptions(nextToastMessage);
      hideTimeout.current = setTimeout(() => {
        hideToast();
      }, nextToastMessage?.duration);
    },
    [avoidKeyboard, context, getKeyboardOffset, hideToast, keyboardHeight]
  );

  useEffect(() => {
    eSubscribeEvent(eShowToast, showToast);
    eSubscribeEvent(eHideToast, hideToast);
    return () => {
      eUnSubscribeEvent(eShowToast, showToast);
      eUnSubscribeEvent(eHideToast, hideToast);
    };
  }, [hideToast, showToast]);

  const isFullToastMessage = toastOptions?.heading && toastOptions?.message;

  return visible && toastOptions ? (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          width: DDS.isTab ? dimensions.width / 2 : "100%",
          alignItems: "center",
          alignSelf: "center",
          position: "absolute",
          zIndex: 999,
          elevation: 15
        },
        animatedStyle
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          hideToast();
        }}
        activeOpacity={1}
        style={{
          width: "100%",
          alignItems: "center"
        }}
      >
        <View
        style={{
          ...getElevationStyle(5),
          backgroundColor: isDark ? colors.static.black : colors.static.white,
          alignSelf: "center",
          borderRadius: defaultBorderRadius * 2,
          paddingVertical: DefaultAppStyles.GAP_VERTICAL,
          paddingHorizontal: DefaultAppStyles.GAP,
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          maxWidth: "90%",
          gap: DefaultAppStyles.GAP_SMALL,
          flexShrink: 1
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: DefaultAppStyles.GAP_SMALL,
            flexShrink: 1
          }}
        >
          <Icon
            name={
              toastOptions.icon
                ? toastOptions.icon
                : toastOptions.type === "success"
                  ? "check"
                  : toastOptions.type === "info"
                    ? "information"
                    : "close"
            }
            size={isFullToastMessage ? AppFontSize.xxxl : AppFontSize.xl}
            color={
              toastOptions?.icon
                ? toastOptions?.icon
                : toastOptions.type === "error"
                  ? colors.error.icon
                  : toastOptions.type === "info"
                    ? isDark
                      ? colors.static.white
                      : colors.static.black
                    : colors.success.icon
            }
          />

          <View
            style={{
              flexShrink: 1
            }}
          >
            {isFullToastMessage ? (
              <Heading
                color={!isDark ? colors.static.black : colors.static.white}
                size={AppFontSize.sm}
              >
                {toastOptions.heading}
              </Heading>
            ) : null}

            {toastOptions.message || toastOptions.heading ? (
              <Paragraph
                color={!isDark ? colors.static.black : colors.static.white}
                size={AppFontSize.sm}
              >
                {toastOptions.message || toastOptions.heading}
              </Paragraph>
            ) : null}
          </View>
        </View>

        {toastOptions.func ? (
          <Button
            testID={notesnook.toast.button}
            fontSize={AppFontSize.xs}
            type={
              toastOptions.type === "error" ? "errorShade" : "secondaryAccented"
            }
            onPress={toastOptions.func}
            title={toastOptions.actionText}
            height={35}
            style={{
              zIndex: 10
            }}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  </Animated.View>
  ) : null;
};
