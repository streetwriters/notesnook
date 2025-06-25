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

import { ScopedThemeProvider } from "@notesnook/theme";
import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import {
  ColorValue,
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
import { useUserStore } from "../../stores/use-user-store";
import { BouncingView } from "../ui/transitions/bouncing-view";

export interface BaseDialogProps extends PropsWithChildren {
  animation?: "fade" | "none" | "slide" | undefined;
  visible?: boolean;
  onRequestClose?: () => void;
  onShow?: () => void;
  premium?: boolean;
  statusBarTranslucent?: boolean;
  transparent?: boolean;
  centered?: boolean;
  bottom?: boolean;
  background?: string | ColorValue;
  animated?: boolean;
  bounce?: boolean;
  closeOnTouch?: boolean;
  useSafeArea?: boolean;
  avoidKeyboardResize?: boolean;
  enableSheetKeyboardHandler?: boolean;
}

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
  animated = true,
  bounce = true,
  closeOnTouch = true,
  useSafeArea = true,
  avoidKeyboardResize = false,
  enableSheetKeyboardHandler,
  background
}: BaseDialogProps) => {
  const floating = useIsFloatingKeyboard();
  const lockEvents = useRef(false);
  const [internalVisible, setIntervalVisible] = useState(true);
  const locked = useUserStore((state) => state.appLocked);

  useEffect(() => {
    return () => {
      useSettingStore.getState().setSheetKeyboardHandler(true);
    };
  }, []);

  useEffect(() => {
    if (locked) {
      setIntervalVisible(false);
      lockEvents.current = true;
      const unsub = useUserStore.subscribe((state) => {
        if (!state.appLocked) {
          setIntervalVisible(true);
          unsub();
          setTimeout(() => {
            lockEvents.current = false;
          });
        }
      });
    }
  }, [locked]);

  const Wrapper = useSafeArea ? SafeAreaView : View;

  return (
    <ScopedThemeProvider value="dialog">
      <Modal
        visible={visible && internalVisible}
        transparent={true}
        statusBarTranslucent={statusBarTranslucent}
        supportedOrientations={[
          "portrait",
          "portrait-upside-down",
          "landscape",
          "landscape-left",
          "landscape-right"
        ]}
        onShow={() => {
          if (lockEvents.current) return;
          if (onShow) {
            onShow();
            if (!enableSheetKeyboardHandler) {
              useSettingStore.getState().setSheetKeyboardHandler(false);
            }
          }
        }}
        animationType={animation}
        onRequestClose={() => {
          if (lockEvents.current) return;
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
            enabled={!floating && Platform.OS === "ios" && !avoidKeyboardResize}
            behavior="padding"
          >
            <BouncingView
              duration={400}
              animated={animated}
              initialScale={bounce ? 0.9 : 1}
              style={[
                styles.backdrop,
                {
                  alignItems: centered ? "center" : undefined,
                  justifyContent: centered
                    ? "center"
                    : bottom
                    ? "flex-end"
                    : "flex-start"
                }
              ]}
            >
              <TouchableOpacity
                onPress={closeOnTouch ? onRequestClose : undefined}
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
    justifyContent: "center"
  },
  overlayButton: {
    width: "100%",
    height: "100%",
    position: "absolute"
  }
});

export default BaseDialog;
