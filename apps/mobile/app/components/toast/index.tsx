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
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../e2e/test.ids";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import useKeyboard from "../../hooks/use-keyboard";
import { DDS } from "../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastOptions
} from "../../services/event-manager";
import { getElevationStyle } from "../../utils/elevation";
import { eHideToast, eShowToast } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

export const Toast = ({ context = "global" }) => {
  const { colors, isDark } = useThemeColors();
  const [toastOptions, setToastOptions] = useState<ToastOptions | undefined>();
  const hideTimeout = useRef<NodeJS.Timeout | undefined>();
  const insets = useGlobalSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const toastMessages = useRef<ToastOptions[]>([]);
  const dimensions = useWindowDimensions();
  const keyboard = useKeyboard();

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
      setVisible(true);
      const nextToastMessage = toastMessages.current.shift();
      setToastOptions(nextToastMessage);
      hideTimeout.current = setTimeout(() => {
        hideToast();
      }, nextToastMessage?.duration);
    },
    [context, hideToast]
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
    <TouchableOpacity
      onPress={() => {
        hideToast();
      }}
      activeOpacity={1}
      style={{
        width: DDS.isTab ? dimensions.width / 2 : "100%",
        alignItems: "center",
        alignSelf: "center",
        bottom:
          Platform.OS === "android"
            ? Math.max(insets.bottom, 40)
            : Math.max(insets.bottom, 40) +
              (keyboard.keyboardShown ? keyboard.keyboardHeight : 0),
        position: "absolute",
        zIndex: 999,
        elevation: 15
      }}
    >
      <View
        style={{
          ...getElevationStyle(5),
          backgroundColor: isDark ? colors.static.black : colors.static.white,
          alignSelf: "center",
          borderRadius: 100,
          paddingVertical: 12,
          paddingHorizontal: 12,
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          maxWidth: "95%",
          gap: 10,
          flexShrink: 1
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
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
              paddingRight: toastOptions?.func ? 0 : 12,
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
                size={AppFontSize.xs}
              >
                {toastOptions.message || toastOptions.heading}
              </Paragraph>
            ) : null}
          </View>
        </View>

        {toastOptions.func ? (
          <Button
            testID={notesnook.toast.button}
            fontSize={AppFontSize.md}
            type={toastOptions.type === "error" ? "errorShade" : "transparent"}
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
  ) : null;
};
