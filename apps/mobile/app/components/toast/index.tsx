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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardEvent,
  Platform,
  useWindowDimensions,
  View
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { notesnook } from "../../../e2e/test.ids";
import { Radius, Spacing } from "../../common/design/spacing";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { DDS } from "../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastOptions
} from "../../services/event-manager";
import { eHideToast, eShowToast } from "../../utils/events";
import AppIcon from "../ui/AppIcon";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

type ToastType = NonNullable<ToastOptions["type"]>;
type ToastMessage = ToastOptions & { id: number };

/**
 * Blend two opaque hex colors so the result stays opaque and adapts to the
 * current (light/dark) surface. Used to derive the tinted toast background and
 * border from a semantic accent color over the theme background.
 */
function blendHex(base: string, overlay: string, ratio: number) {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16)
    ];
  };
  const b = parse(base);
  const o = parse(overlay);
  return `#${b
    .map((c, i) =>
      Math.round(c * (1 - ratio) + o[i] * ratio)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

export const Toast = ({
  context = "global",
  avoidKeyboard = context === "global"
}: {
  context?: string;
  avoidKeyboard?: boolean;
}) => {
  const { colors } = useThemeColors();
  const [toastOptions, setToastOptions] = useState<ToastMessage | undefined>();
  const currentToast = useRef<ToastMessage | undefined>(toastOptions);
  const hideTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const toastMessages = useRef<ToastMessage[]>([]);
  const idCounter = useRef(0);
  const insets = useGlobalSafeAreaInsets();
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
        ? Math.max(keyboardHeight.value, insets.bottom + Spacing.LEVEL_3)
        : insets.bottom + Spacing.LEVEL_3
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

  const showNext = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = undefined;
    }
    const next = toastMessages.current.shift();
    currentToast.current = next;
    setToastOptions(next);
    if (next) {
      hideTimeout.current = setTimeout(() => {
        showNext();
      }, next.duration);
    }
  }, []);

  const showToast = useCallback(
    (data?: ToastOptions) => {
      if (!data || data.context !== context) return;

      const isDuplicate = (message?: ToastMessage) =>
        message?.heading === data.heading && message?.message === data.message;

      if (
        isDuplicate(currentToast.current) ||
        toastMessages.current.findIndex(isDuplicate) !== -1
      )
        return;

      idCounter.current += 1;
      toastMessages.current.push({ ...data, id: idCounter.current });

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

      // Nothing is currently on screen, show the queued message right away.
      if (!currentToast.current) showNext();
    },
    [avoidKeyboard, context, getKeyboardOffset, keyboardHeight, showNext]
  );

  const hideToast = useCallback(() => {
    showNext();
  }, [showNext]);

  useEffect(() => {
    eSubscribeEvent(eShowToast, showToast);
    eSubscribeEvent(eHideToast, hideToast);
    return () => {
      eUnSubscribeEvent(eShowToast, showToast);
      eUnSubscribeEvent(eHideToast, hideToast);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [hideToast, showToast]);

  const type = (toastOptions?.type || "error") as ToastType;

  const variant = useMemo(() => {
    const accents: Record<ToastType, string> = {
      success: colors.static.green,
      error: colors.static.red,
      info: colors.static.blue,
      warning: colors.static.orange
    };
    const icons: Record<
      ToastType,
      { name: string; family: "notesnook" | "material" }
    > = {
      success: { name: "check-circle", family: "notesnook" },
      error: { name: "warning-circle", family: "notesnook" },
      info: { name: "information-outline", family: "material" },
      warning: { name: "warning", family: "notesnook" }
    };
    const accent = accents[type];
    const base = colors.primary.background;
    return {
      accent,
      icon: icons[type],
      background: blendHex(base, accent, 0.09),
      border: blendHex(base, accent, 0.45)
    };
  }, [type, colors.static, colors.primary.background]);

  // When only one line of copy is provided it becomes the title; when both are
  // present the heading is the title and the message becomes the description.
  const title = toastOptions?.heading || toastOptions?.message;
  const description = toastOptions?.heading ? toastOptions?.message : undefined;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          width: DDS.isTab ? dimensions.width / 2 : "100%",
          alignItems: "center",
          alignSelf: "center",
          position: "absolute",
          zIndex: 999,
          paddingHorizontal: Spacing.LEVEL_3
        },
        animatedStyle
      ]}
    >
      {toastOptions ? (
        <Animated.View
          key={toastOptions.id}
          entering={FadeInDown.duration(250)}
          exiting={FadeOutDown.duration(200)}
          style={{
            maxWidth: "100%",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: Spacing.LEVEL_1,
            padding: Spacing.LEVEL_1,
            borderRadius: Radius.S,
            borderWidth: 1,
            borderColor: variant.border,
            backgroundColor: variant.background,
            shadowColor: "#272727",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.06,
            shadowRadius: 13.5,
            elevation: 5
          }}
        >
          <AppIcon
            name={toastOptions.icon || variant.icon.name}
            iconFamily={toastOptions.icon ? "material" : variant.icon.family}
            size={16}
            color={variant.accent}
            style={{
              marginTop: description ? 1 : 0
            }}
          />

          <View
            style={{
              flexShrink: 1,
              gap: Spacing.LEVEL_1
            }}
          >
            <View style={{ gap: Spacing.LEVEL_0, flexShrink: 1 }}>
              {title ? (
                <Heading
                  fontSize="XS"
                  lineHeight="100%"
                  color={colors.primary.heading}
                >
                  {title}
                </Heading>
              ) : null}

              {description ? (
                <Paragraph
                  fontSize="XXS"
                  lineHeight="130%"
                  color={colors.secondary.paragraph}
                >
                  {description}
                </Paragraph>
              ) : null}
            </View>

            {toastOptions.func && toastOptions.actionText ? (
              <Pressable
                testID={notesnook.toast.button}
                type="transparent"
                onPress={() => {
                  toastOptions.func?.();
                  showNext();
                }}
                style={{
                  alignSelf: "flex-start",
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                  width: "auto"
                }}
              >
                <Heading fontSize="XS" lineHeight="100%" color={variant.accent}>
                  {toastOptions.actionText}
                </Heading>
              </Pressable>
            ) : null}
          </View>

          <IconButton
            name="close"
            iconFamily="notesnook"
            size={12}
            color={colors.secondary.icon}
            onPress={showNext}
            style={{
              width: 16,
              height: 16,
              alignSelf: "flex-start"
            }}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};
