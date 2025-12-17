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
import React, { useEffect, useRef } from "react";
import {
  AppState,
  AppStateStatus,
  KeyboardAvoidingView,
  TextInput,
  View
} from "react-native";
import Editor from ".";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import useIsFloatingKeyboard from "../../hooks/use-is-floating-keyboard";
import { DDS } from "../../services/device-detection";
import { useSettingStore } from "../../stores/use-setting-store";
import { editorRef } from "../../utils/global-refs";
import { editorController, textInput } from "./tiptap/utils";

export type PaneWidths = {
  mobile: {
    sidebar: number;
    list: number;
    editor: number;
  };
  smallTablet: {
    sidebar: number;
    list: number;
    editor: number;
  };
  tablet: {
    sidebar: number;
    list: number;
    editor: number;
  };
};

export const EditorWrapper = ({ widths }: { widths: PaneWidths }) => {
  const { colors } = useThemeColors();
  const { colors: toolBarColors } = useThemeColors("editorToolbar");
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const loading = false;
  const insets = useGlobalSafeAreaInsets();
  const floating = useIsFloatingKeyboard();
  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );
  const prevState = useRef<AppStateStatus>(undefined);
  const isFullscreen = useSettingStore((state) => state.fullscreen);
  const dimensions = useSettingStore((state) => state.dimensions);

  const onAppStateChanged = async (state: AppStateStatus) => {
    if (!prevState.current) {
      prevState.current = state;
      return;
    }
    if (useSettingStore.getState().appDidEnterBackgroundForAction) return;
    if (state === "active") {
      editorController.current.onReady();
      editorController.current.overlay(false);
    } else {
      prevState.current = state;
    }
  };

  useEffect(() => {
    if (loading) return;
    const sub = AppState.addEventListener("change", onAppStateChanged);
    return () => {
      sub?.remove();
    };
  }, [loading]);

  return (
    <View
      testID="editor-wrapper"
      ref={editorRef}
      style={[
        {
          width: isFullscreen
            ? dimensions.width
            : widths[
                !introCompleted ? "mobile" : (deviceMode as keyof PaneWidths)
              ]?.editor,
          height: "100%",
          minHeight: "100%",
          backgroundColor: toolBarColors.primary.background,
          paddingLeft: isFullscreen
            ? deviceMode === "smallTablet"
              ? 0
              : dimensions.width * 0.15
            : null,
          paddingRight: isFullscreen
            ? deviceMode === "smallTablet"
              ? 0
              : dimensions.width * 0.15
            : insets.right,
          borderLeftWidth: DDS.isTab ? 1 : 0,
          borderLeftColor: DDS.isTab
            ? colors.secondary.background
            : "transparent",
          paddingBottom: insets.bottom
        }
      ]}
    >
      {loading || !introCompleted ? null : (
        <KeyboardAvoidingView
          behavior="padding"
          style={{
            backgroundColor: colors.primary.background,
            flex: 1
          }}
          enabled={!floating}
          keyboardVerticalOffset={0}
        >
          <TextInput
            key="input"
            ref={textInput}
            style={{ height: 1, padding: 0, width: 1, position: "absolute" }}
            blurOnSubmit={false}
          />
          <Editor key="editor" withController={true} />
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

export default EditorWrapper;
