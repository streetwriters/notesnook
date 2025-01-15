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

import { ScopedThemeProvider, useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import ActionSheet from "react-native-actions-sheet";
import useGlobalSafeAreaInsets from "../../../hooks/use-global-safe-area-insets";
import { useSettingStore } from "../../../stores/use-setting-store";
import { PremiumToast } from "../../premium/premium-toast";
import { Toast } from "../../toast";
import { useAppState } from "../../../hooks/use-app-state";
import SettingsService from "../../../services/settings";
import { useUserStore } from "../../../stores/use-user-store";
import { getContainerBorder } from "../../../utils/colors";

/**
 *
 * @param {any} param0
 * @returns
 */
const SheetWrapper = ({
  children,
  fwdRef,
  gestureEnabled = true,
  onClose,
  onOpen,
  closeOnTouchBackdrop = true,
  onHasReachedTop,
  overlay,
  overlayOpacity = 0.3,
  enableGesturesInScrollView = false,
  bottomPadding = true,
  keyboardHandlerDisabled
}) => {
  const localRef = useRef(null);
  const { colors } = useThemeColors("sheet");
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const sheetKeyboardHandler = useSettingStore(
    (state) => state.sheetKeyboardHandler
  );
  const largeTablet = deviceMode === "tablet";
  const smallTablet = deviceMode === "smallTablet";
  const dimensions = useSettingStore((state) => state.dimensions);
  const insets = useGlobalSafeAreaInsets();
  const lockEvents = useRef(false);
  const locked = useUserStore((state) => state.appLocked);

  let width = dimensions.width > 600 ? 600 : 500;

  const style = React.useMemo(() => {
    return {
      width: largeTablet || smallTablet ? width : "100%",
      backgroundColor: colors.primary.background,
      zIndex: 10,
      paddingTop: 5,
      paddingBottom: 0,
      borderTopRightRadius: 15,
      borderTopLeftRadius: 15,
      alignSelf: "center",
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
      ...getContainerBorder(colors.primary.border, 0.5),
      borderBottomWidth: 0
    };
  }, [
    colors.primary.background,
    colors.primary.border,
    largeTablet,
    smallTablet,
    width
  ]);

  const _onOpen = () => {
    if (lockEvents.current) return;
    onOpen && onOpen();
  };

  const _onClose = async () => {
    if (lockEvents.current) return;
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (locked) {
      const ref = fwdRef || localRef;
      ref?.current?.hide();
      if (useUserStore.getState().appLocked) {
        lockEvents.current = true;
        const unsub = useUserStore.subscribe((state) => {
          if (!state.appLocked) {
            ref?.current?.show();
            unsub();
            lockEvents.current = false;
          }
        });
      }
    }
  }, [locked, fwdRef]);

  return (
    <ScopedThemeProvider value="sheet">
      <ActionSheet
        ref={fwdRef || localRef}
        testIDs={{
          backdrop: "sheet-backdrop"
        }}
        indicatorStyle={{
          width: 100,
          backgroundColor: colors.secondary.background
        }}
        statusBarTranslucent
        drawUnderStatusBar={true}
        containerStyle={style}
        gestureEnabled={gestureEnabled}
        initialOffsetFromBottom={1}
        onPositionChanged={onHasReachedTop}
        closeOnTouchBackdrop={closeOnTouchBackdrop}
        keyboardHandlerEnabled={
          keyboardHandlerDisabled ? false : sheetKeyboardHandler
        }
        closeOnPressBack={closeOnTouchBackdrop}
        indicatorColor={colors.secondary.background}
        onOpen={_onOpen}
        keyboardDismissMode="none"
        enableGesturesInScrollView={enableGesturesInScrollView}
        defaultOverlayOpacity={overlayOpacity}
        overlayColor={colors.primary.backdrop}
        keyboardShouldPersistTaps="always"
        openAnimationConfig={{
          friction: 9
        }}
        ExtraOverlayComponent={
          <>
            {overlay}
            <PremiumToast
              context="sheet"
              close={() => fwdRef?.current?.hide()}
              offset={50}
            />
            <Toast context="local" />
          </>
        }
        onClose={_onClose}
      >
        {children}
        {bottomPadding ? (
          <View
            style={{
              height:
                Platform.OS === "ios" && insets.bottom !== 0
                  ? insets.bottom + 5
                  : 20
            }}
          />
        ) : null}
      </ActionSheet>
    </ScopedThemeProvider>
  );
};

export default SheetWrapper;
