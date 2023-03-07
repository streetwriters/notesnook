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

import React, { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import useIsFloatingKeyboard from "../../hooks/use-is-floating-keyboard";
import { useSettingStore } from "../../stores/use-setting-store";
import { BouncingView } from "../ui/transitions/bouncing-view";
import { ScopedThemeProvider } from "@notesnook/theme";

const BaseDialog = ({
  visible,
  onRequestClose,
  children,
  onShow,
  animation = "fade",
  premium,
  statusBarTranslucent = true,
  transparent,
  centered = true,
  bottom = false,
  background = null,
  animated = true,
  bounce = true,
  closeOnTouch = true,
  useSafeArea = true
}) => {
  const floating = useIsFloatingKeyboard();

  useEffect(() => {
    return () => {
      useSettingStore.getState().setSheetKeyboardHandler(true);
    };
  }, []);

  const Wrapper = useSafeArea ? SafeAreaView : View;

  return (
    <ScopedThemeProvider value="dialog">
      <Modal
        visible={visible}
        transparent={true}
        animated
        statusBarTranslucent={statusBarTranslucent}
        supportedOrientations={[
          "portrait",
          "portrait-upside-down",
          "landscape",
          "landscape-left",
          "landscape-right"
        ]}
        onShow={() => {
          if (onShow) {
            onShow();
            useSettingStore.getState().setSheetKeyboardHandler(false);
          }
        }}
        animationType={animation}
        onRequestClose={() => {
          if (!closeOnTouch) return null;
          useSettingStore.getState().setSheetKeyboardHandler(true);
          onRequestClose && onRequestClose();
        }}
      >
        <Wrapper
          style={{
            backgroundColor: background
              ? background
              : transparent
              ? "transparent"
              : "rgba(0,0,0,0.3)"
          }}
        >
          <KeyboardAvoidingView
            enabled={!floating && Platform.OS === "ios"}
            behavior="padding"
          >
            <BouncingView
              duration={400}
              animated={animated}
              initialScale={bounce ? 0.9 : 1}
              style={[
                styles.backdrop,
                {
                  justifyContent: centered
                    ? "center"
                    : bottom
                    ? "flex-end"
                    : "flex-start"
                }
              ]}
            >
              <TouchableOpacity
                onPress={closeOnTouch ? onRequestClose : null}
                style={styles.overlayButton}
              />
              {premium}
              {children}
            </BouncingView>
          </KeyboardAvoidingView>
        </Wrapper>
      </Modal>
    </ScopedThemeProvider>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  overlayButton: {
    width: "100%",
    height: "100%",
    position: "absolute"
  }
});

export default BaseDialog;
