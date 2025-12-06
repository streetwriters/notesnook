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
import {
  activateKeepAwake,
  deactivateKeepAwake
} from "@sayem314/react-native-keep-awake";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { LayoutChangeEvent, View } from "react-native";
import Orientation, {
  OrientationType,
  useDeviceOrientationChange
} from "react-native-orientation-locker";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { notesnook } from "../../e2e/test.ids";
import { db } from "../common/database";
import { FluidPanels } from "../components/fluid-panels";
import { useSideBarDraggingStore } from "../components/side-menu/dragging-store";
import useGlobalSafeAreaInsets from "../hooks/use-global-safe-area-insets";
import { useShortcutManager } from "../hooks/use-shortcut-manager";
import { hideAllTooltips } from "../hooks/use-tooltip";
import { useTabStore } from "../screens/editor/tiptap/use-tab-store";
import {
  clearAppState,
  editorController,
  editorState,
  getAppState
} from "../screens/editor/tiptap/utils";
import { DDS } from "../services/device-detection";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../services/event-manager";
import { useSettingStore } from "../stores/use-setting-store";
import {
  eCloseFullscreenEditor,
  eOnEnterEditor,
  eOnExitEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eUnlockNote
} from "../utils/events";
import { valueLimiter } from "../utils/functions";
import { fluidTabsRef } from "../utils/global-refs";
import { AppNavigationStack } from "./navigation-stack";
import type { PaneWidths } from "../screens/editor/wrapper";

const MOBILE_SIDEBAR_SIZE = 0.85;

let SideMenu: any = null;
let EditorWrapper: any = null;

export const FluidPanelsView = React.memo(
  () => {
    const { colors } = useThemeColors();
    const deviceMode = useSettingStore((state) => state.deviceMode);
    const setFullscreen = useSettingStore((state) => state.setFullscreen);
    const fullscreen = useSettingStore((state) => state.fullscreen);
    const setDeviceModeState = useSettingStore((state) => state.setDeviceMode);
    const dimensions = useSettingStore((state) => state.dimensions);
    const setDimensions = useSettingStore((state) => state.setDimensions);
    const insets = useGlobalSafeAreaInsets();
    const animatedOpacity = useSharedValue(0);
    const animatedTranslateY = useSharedValue(-9999);
    const overlayRef = useRef<Animated.View>(null);
    const [orientation, setOrientation] = useState<OrientationType>(
      Orientation.getInitialOrientation()
    );
    const appLoading = useSettingStore((state) => state.isAppLoading);
    const [isLoading, setIsLoading] = useState(false);

    useDeviceOrientationChange((o) => {
      if (
        o !== OrientationType.UNKNOWN &&
        o !== OrientationType["FACE-UP"] &&
        o !== OrientationType["FACE-DOWN"] &&
        o !== OrientationType["PORTRAIT-UPSIDEDOWN"]
      ) {
        setOrientation(o);
      }
    });

    useEffect(() => {
      if (!appLoading) {
        setTimeout(() => {
          setIsLoading(false);
        }, 200);
      }
    }, [appLoading]);

    useShortcutManager({
      onShortcutPressed: async (item) => {
        if (!item && getAppState()) {
          editorState().movedAway = false;
          fluidTabsRef.current?.goToPage("editor", false);
          return;
        }
        if (item?.type === "notesnook.action.newnote") {
          clearAppState();
          if (!fluidTabsRef.current) {
            setTimeout(() => {
              eSendEvent(eOnLoadNote, { newNote: true });
              editorState().movedAway = false;
              fluidTabsRef.current?.goToPage("editor", false);
            }, 1000);
            return;
          }
          eSendEvent(eOnLoadNote, { newNote: true });
          editorState().movedAway = false;
          setTimeout(
            () => fluidTabsRef.current?.goToPage("editor", false),
            300
          );
        }
      }
    });

    const showFullScreenEditor = useCallback(() => {
      setFullscreen(true);
      if (deviceMode === "smallTablet") {
        fluidTabsRef.current?.openDrawer(false);
      }
    }, [deviceMode, dimensions.width, setFullscreen]);

    const closeFullScreenEditor = useCallback(
      (current: string) => {
        const _deviceMode = current || deviceMode;
        if (_deviceMode === "smallTablet") {
          fluidTabsRef.current?.closeDrawer(false);
        }
        setFullscreen(false);
        editorController.current?.commands.updateSettings({
          fullscreen: false
        });
        if (_deviceMode === "smallTablet") {
          fluidTabsRef.current?.goToIndex(1, false);
        }
        if (_deviceMode === "mobile") {
          fluidTabsRef.current?.goToIndex(2, false);
        }
      },
      [deviceMode, dimensions.width, setFullscreen]
    );

    const toggleView = useCallback(
      (show: boolean) => {
        animatedTranslateY.value = show ? 0 : -9999;
      },
      [animatedTranslateY]
    );

    useEffect(() => {
      if (!fluidTabsRef.current?.isDrawerOpen()) {
        toggleView(false);
      }
      eSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
      eSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);

      return () => {
        eUnSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
        eUnSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);
      };
    }, [
      deviceMode,
      dimensions,
      colors,
      showFullScreenEditor,
      closeFullScreenEditor,
      toggleView
    ]);

    const setDeviceMode = React.useCallback(
      (current: string | null, size: { width: number; height: number }) => {
        setDeviceModeState(current);

        if (fullscreen && current === "mobile") {
          eSendEvent(eCloseFullscreenEditor, current);
        }

        const state = getAppState();
        setTimeout(() => {
          switch (current) {
            case "tablet":
              fluidTabsRef.current?.goToIndex(0, false);
              break;
            case "smallTablet":
              if (!fullscreen) {
                fluidTabsRef.current?.closeDrawer(false);
              }
              break;
            case "mobile":
              if (
                state &&
                editorState().movedAway === false &&
                useTabStore.getState().getCurrentNoteId()
              ) {
                fluidTabsRef.current?.goToPage("editor", false);
              } else {
                fluidTabsRef.current?.goToPage(
                  fluidTabsRef.current?.page(),
                  false
                );
              }
              break;
          }
        }, 0);
      },
      [deviceMode, fullscreen, setDeviceModeState]
    );

    const checkDeviceType = React.useCallback(
      (size: { width: number; height: number }) => {
        if (DDS.width === size.width && orientation === DDS.orientation) return;
        DDS.setSize(size, orientation);
        const nextDeviceMode = DDS.isLargeTablet()
          ? "tablet"
          : DDS.isSmallTab
            ? "smallTablet"
            : "mobile";
        setDeviceMode(nextDeviceMode, size);
      },
      [orientation, setDeviceMode, setDimensions]
    );

    useEffect(() => {
      if (orientation !== "UNKNOWN") {
        checkDeviceType(dimensions);
      }
    }, [orientation, dimensions]);

    const _onLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        const size = event?.nativeEvent?.layout;
        setDimensions({
          width: size.width,
          height: size.height
        });
        if (size.width > size.height) {
          setOrientation(OrientationType["LANDSCAPE-RIGHT"]);
        } else {
          setOrientation(OrientationType["PORTRAIT"]);
        }
      },
      [
        checkDeviceType,
        deviceMode,
        dimensions.width,
        orientation,
        setDeviceMode
      ]
    );

    const PANE_OFFSET = useMemo(
      () => ({
        mobile: {
          sidebar: dimensions.width * MOBILE_SIDEBAR_SIZE,
          list: dimensions.width + dimensions.width * MOBILE_SIDEBAR_SIZE,
          editor: dimensions.width * 2 + dimensions.width * MOBILE_SIDEBAR_SIZE
        },
        smallTablet: {
          sidebar: fullscreen
            ? 0
            : valueLimiter(dimensions.width * 0.3, 300, 350),
          list: fullscreen
            ? 0
            : dimensions.width + valueLimiter(dimensions.width * 0.3, 300, 350),
          editor: fullscreen
            ? 0
            : dimensions.width + valueLimiter(dimensions.width * 0.3, 300, 350)
        },
        tablet: {
          sidebar: 0,
          list: 0,
          editor: 0
        }
      }),
      [dimensions.width, fullscreen]
    );

    const PANE_WIDTHS: PaneWidths = useMemo(
      () => ({
        mobile: {
          sidebar: dimensions.width * MOBILE_SIDEBAR_SIZE,
          list: dimensions.width,
          editor: dimensions.width
        },
        smallTablet: {
          sidebar: valueLimiter(dimensions.width * 0.3, 300, 350),
          list: valueLimiter(dimensions.width * 0.4, 300, 450),
          editor:
            dimensions.width - valueLimiter(dimensions.width * 0.4, 300, 450)
        },
        tablet: {
          sidebar: dimensions.width * 0.22,
          list: dimensions.width * 0.3,
          editor: dimensions.width * 0.48
        }
      }),
      [dimensions.width]
    );

    const onScroll = React.useCallback(
      (scrollOffset: number) => {
        if (!deviceMode) return;
        hideAllTooltips();

        if (
          scrollOffset >
          PANE_OFFSET[deviceMode as keyof typeof PANE_OFFSET].sidebar - 10
        ) {
          animatedOpacity.value = 0;
          toggleView(false);
        } else {
          const o = scrollOffset / 300;
          const opacity = o < 0 ? 1 : 1 - o;
          animatedOpacity.value = opacity;
          toggleView(opacity < 0.1 ? false : true);
        }
      },
      [PANE_OFFSET, animatedOpacity, deviceMode, toggleView]
    );

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: animatedOpacity.value,
        transform: [
          {
            translateY: animatedTranslateY.value
          }
        ]
      };
    }, []);

    if (!isLoading && !SideMenu && !EditorWrapper) {
      SideMenu = require("../components/side-menu").SideMenu;
      EditorWrapper = require("../screens/editor/wrapper").EditorWrapper;
    }

    return (
      <View
        onLayout={_onLayout}
        testID={notesnook.ids.default.root}
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: colors.primary.background
        }}
      >
        {deviceMode && PANE_WIDTHS[deviceMode as keyof typeof PANE_WIDTHS] ? (
          <FluidPanels
            ref={fluidTabsRef}
            dimensions={dimensions}
            widths={PANE_WIDTHS[deviceMode as keyof typeof PANE_WIDTHS]}
            enabled={deviceMode !== "tablet" && !fullscreen}
            onScroll={onScroll}
            onChangeTab={onChangeTab}
            onDrawerStateChange={(state) => {
              if (!state) {
                useSideBarDraggingStore.setState({
                  dragging: false
                });
              }
            }}
          >
            <View
              key="1"
              style={{
                height: "100%",
                width: fullscreen
                  ? 0
                  : PANE_WIDTHS[deviceMode as keyof typeof PANE_WIDTHS]?.sidebar
              }}
            >
              <ScopedThemeProvider value="navigationMenu">
                {isLoading ? null : <SideMenu />}
              </ScopedThemeProvider>
            </View>

            <View
              key="2"
              style={{
                height: "100%",
                width: fullscreen
                  ? 0
                  : PANE_WIDTHS[deviceMode as keyof typeof PANE_WIDTHS]?.list
              }}
            >
              <ScopedThemeProvider value="list">
                {deviceMode === "mobile" ? (
                  <Animated.View
                    onTouchEnd={() => {
                      if (useSideBarDraggingStore.getState().dragging) {
                        useSideBarDraggingStore.setState({
                          dragging: false
                        });
                        return;
                      }
                      fluidTabsRef.current?.closeDrawer();
                      animatedOpacity.value = withTiming(0);
                      animatedTranslateY.value = withTiming(-9999);
                    }}
                    style={[
                      {
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        zIndex: 999,
                        backgroundColor: colors.primary.backdrop
                      },
                      animatedStyle
                    ]}
                    ref={overlayRef}
                  />
                ) : null}

                <View
                  style={{
                    flex: 1,
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom
                  }}
                >
                  <AppNavigationStack />
                </View>
              </ScopedThemeProvider>
            </View>

            <ScopedThemeProvider value="editor">
              {isLoading ? null : <EditorWrapper widths={PANE_WIDTHS} />}
            </ScopedThemeProvider>
          </FluidPanels>
        ) : null}
      </View>
    );
  },
  () => true
);
FluidPanelsView.displayName = "FluidPanelsView";

export default FluidPanelsView;

const onChangeTab = async (event: { i: number; from: number }) => {
  if (event.i === 2) {
    editorState().movedAway = false;
    editorState().isFocused = true;
    activateKeepAwake();
    eSendEvent(eOnEnterEditor);

    if (
      useTabStore.getState().getTab(useTabStore.getState().currentTab)?.session
        ?.locked
    ) {
      eSendEvent(eUnlockNote);
    }

    if (
      fluidTabsRef.current?.tabChangedFromSwipeAction.value &&
      !useTabStore.getState().getNoteIdForTab(useTabStore.getState().currentTab)
    ) {
      editorController?.current?.commands?.focus(
        useTabStore.getState().currentTab
      );
    }
  } else {
    if (event.from === 2) {
      deactivateKeepAwake();
      editorState().movedAway = true;
      editorState().isFocused = false;
      eSendEvent(eOnExitEditor);

      // Lock all tabs with locked notes...
      for (const tab of useTabStore.getState().tabs) {
        const noteId = useTabStore.getState().getTab(tab.id)?.session?.noteId;
        if (!noteId) continue;
        const note = await db.notes.note(noteId);
        const locked = note && (await db.vaults.itemExists(note));
        if (locked) {
          useTabStore.getState().updateTab(tab.id, {
            session: {
              locked: true
            }
          });
        }
      }
    }
  }
};
