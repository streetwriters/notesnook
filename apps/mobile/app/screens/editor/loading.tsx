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
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import Paragraph from "../../components/ui/typography/paragraph";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useSettingStore } from "../../stores/use-setting-store";
import { eClearEditor } from "../../utils/events";
import { defaultBorderRadius, AppFontSize } from "../../utils/size";
import { useEditor } from "./tiptap/use-editor";
import { editorState } from "./tiptap/utils";
import { strings } from "@notesnook/intl";

const EditorOverlay = ({
  editorId = "",
  editor
}: {
  editorId: string;
  editor: ReturnType<typeof useEditor>;
}) => {
  const { colors } = useThemeColors();
  const [error, setError] = useState(false);
  const opacity = useSharedValue(1);
  const translateValue = useSharedValue(0);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const isTablet = deviceMode !== "mobile";
  const insets = useGlobalSafeAreaInsets();
  const isDefaultEditor = editorId === "";
  const timers = useRef<{
    loading?: NodeJS.Timeout;
    error?: NodeJS.Timeout;
    closing?: NodeJS.Timeout;
  }>({});
  const loadingState = useRef({
    startTime: 0
  });

  const clearTimers = () => {
    clearTimeout(timers.current.loading);
    clearTimeout(timers.current.error);
    clearTimeout(timers.current.closing);
  };

  const load = useCallback(
    async (isLoading: boolean) => {
      editorState().overlay = true;
      clearTimers();
      if (isLoading) {
        loadingState.current.startTime = Date.now();
        opacity.value = 1;
        translateValue.value = 0;
        timers.current.error = setTimeout(() => {
          setError(true);
        }, 60 * 1000);
      } else {
        clearTimers();
        const timeDiffSinceLoadStarted =
          Date.now() - loadingState.current.startTime > 300 ? 300 : 0;
        if (!timeDiffSinceLoadStarted) {
          setError(false);
          editorState().overlay = false;
          opacity.value = 0;
          translateValue.value = 6000;
        } else {
          setError(false);
          editorState().overlay = false;
          opacity.value = withTiming(0, {
            duration: 500
          });
          setTimeout(() => {
            translateValue.value = 6000;
          }, 500);
        }
      }
    },
    [opacity, translateValue]
  );

  useEffect(() => {
    setTimeout(() => {
      if (!loadingState.current.startTime) {
        translateValue.value = 6000;
        opacity.value = 0;
      }
    }, 3000);
    eSubscribeEvent("loadingNote" + editorId, load);
    return () => {
      clearTimers();
      eUnSubscribeEvent("loadingNote" + editorId, load);
    };
  }, [editorId, load, translateValue, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {
          translateY: translateValue.value
        }
      ]
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: colors.primary.background,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100
        },
        animatedStyle
      ]}
    >
      <View
        style={{
          width: "100%",
          backgroundColor: colors.primary.background,
          borderRadius: defaultBorderRadius,
          height: "100%",
          alignItems: "flex-start",
          paddingTop: insets.top
        }}
      >
        {isDefaultEditor ? (
          <View
            style={{
              flexDirection: "row",
              height: 50,
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingLeft: 6,
              paddingRight: 12
            }}
          >
            {isTablet ? (
              <View />
            ) : (
              <IconButton
                onPress={() => {
                  eSendEvent(eClearEditor);
                  opacity.value = 0;
                  translateValue.value = 6000;
                }}
                name="arrow-left"
                color={colors.primary.paragraph}
              />
            )}

            <View
              style={{
                flexDirection: "row",
                height: 50,
                alignItems: "center"
              }}
            >
              <IconButton
                name="dots-horizontal"
                color={colors.primary.paragraph}
              />
            </View>
          </View>
        ) : null}

        <View
          style={{
            paddingHorizontal: 12,
            width: "100%",
            alignItems: "flex-start"
          }}
        >
          {isDefaultEditor ? (
            <View
              style={{
                height: 30,
                backgroundColor: colors.secondary.background,
                borderRadius: 100,
                marginBottom: 10,
                justifyContent: "flex-start",
                alignItems: "center",
                flexDirection: "row",
                paddingHorizontal: 10,
                marginTop: 5,
                borderWidth: 1,
                borderColor: colors.primary.border
              }}
            >
              <Paragraph color={colors.secondary.paragraph} size={13}>
                {strings.addItem("tag")}
              </Paragraph>
              <IconButton
                size={20}
                style={{
                  width: 26,
                  height: 26
                }}
                name="plus"
                color={colors.primary.accent}
              />
            </View>
          ) : null}

          <View
            style={{
              height: 25,
              width: "100%",
              backgroundColor: colors.secondary.background,
              borderRadius: defaultBorderRadius
            }}
          />

          <View
            style={{
              height: 12,
              width: "100%",
              marginTop: 10,
              flexDirection: "row"
            }}
          >
            <View
              style={{
                height: 12,
                width: 60,
                backgroundColor: colors.secondary.background,
                borderRadius: defaultBorderRadius,
                marginRight: 10
              }}
            />
            <View
              style={{
                height: 12,
                width: 60,
                backgroundColor: colors.secondary.background,
                borderRadius: defaultBorderRadius,
                marginRight: 10
              }}
            />
            <View
              style={{
                height: 12,
                width: 60,
                backgroundColor: colors.secondary.background,
                borderRadius: defaultBorderRadius,
                marginRight: 10
              }}
            />
          </View>

          <View
            style={{
              height: 16,
              width: "100%",
              backgroundColor: colors.secondary.background,
              borderRadius: defaultBorderRadius,
              marginTop: 10
            }}
          />

          <View
            style={{
              height: 16,
              width: "100%",
              backgroundColor: colors.secondary.background,
              borderRadius: defaultBorderRadius,
              marginTop: 10
            }}
          />

          <View
            style={{
              height: 16,
              width: 200,
              backgroundColor: colors.secondary.background,
              borderRadius: defaultBorderRadius,
              marginTop: 10
            }}
          />

          {error ? (
            <>
              <Button
                type="error"
                style={{
                  marginTop: 20,
                  alignSelf: "flex-start",
                  borderRadius: 100,
                  height: 40
                }}
                onPress={() => {
                  setError(false);
                  editor.setLoading(true);
                  setTimeout(() => editor.setLoading(false), 10);
                }}
                title={strings.reloadEditor()}
              />
              <Paragraph
                textBreakStrategy="balanced"
                size={AppFontSize.xs}
                color={colors.secondary.paragraph}
                style={{
                  maxWidth: "100%",
                  marginTop: 5
                }}
              >
                {strings.editorFailedToLoad()}
              </Paragraph>
            </>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
};

export default EditorOverlay;
