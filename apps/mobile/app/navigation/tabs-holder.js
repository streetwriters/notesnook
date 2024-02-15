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
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Platform, StatusBar, View } from "react-native";
import changeNavigationBarColor from "react-native-navigation-bar-color";
import {
  addOrientationListener,
  addSpecificOrientationListener,
  getInitialOrientation,
  getSpecificOrientation,
  removeOrientationListener,
  removeSpecificOrientationListener
} from "react-native-orientation";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { notesnook } from "../../e2e/test.ids";
import { db } from "../common/database";
import { SideMenu } from "../components/side-menu";
import { useSideBarDraggingStore } from "../components/side-menu/dragging-store";
import { FluidTabs } from "../components/tabs";
import useGlobalSafeAreaInsets from "../hooks/use-global-safe-area-insets";
import { useShortcutManager } from "../hooks/use-shortcut-manager";
import { hideAllTooltips } from "../hooks/use-tooltip";
import {
  clearAppState,
  editorController,
  editorState,
  getAppState
} from "../screens/editor/tiptap/utils";
import { EditorWrapper } from "../screens/editor/wrapper";
import { DDS } from "../services/device-detection";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../services/event-manager";
import { useEditorStore } from "../stores/use-editor-store";
import { useSettingStore } from "../stores/use-setting-store";
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor
} from "../utils/events";
import { editorRef, tabBarRef } from "../utils/global-refs";
import { sleep } from "../utils/time";
import { NavigationStack } from "./navigation-stack";

const _TabsHolder = () => {
  const { colors, isDark } = useThemeColors();
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const setFullscreen = useSettingStore((state) => state.setFullscreen);
  const fullscreen = useSettingStore((state) => state.fullscreen);
  const setDeviceModeState = useSettingStore((state) => state.setDeviceMode);
  const dimensions = useSettingStore((state) => state.dimensions);
  const setDimensions = useSettingStore((state) => state.setDimensions);
  const insets = useGlobalSafeAreaInsets();
  const animatedOpacity = useSharedValue(0);
  const animatedTranslateY = useSharedValue(-9999);
  const overlayRef = useRef();
  const [orientation, setOrientation] = useState(getInitialOrientation());

  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );

  useShortcutManager({
    onShortcutPressed: async (item) => {
      if (!item && getAppState()) {
        editorState().movedAway = false;
        tabBarRef.current?.goToPage(1, false);
        return;
      }
      if (item.type === "notesnook.action.newnote") {
        clearAppState();
        if (!tabBarRef.current) {
          await sleep(3000);
          eSendEvent(eOnLoadNote, { newNote: true });
          editorState().movedAway = false;
          tabBarRef.current?.goToPage(1, false);
          return;
        }
        eSendEvent(eOnLoadNote, { newNote: true });
        editorState().movedAway = false;
        tabBarRef.current?.goToPage(1, false);
      }
    }
  });

  const onOrientationChange = (o, o2) => {
    setOrientation(o || o2);
  };

  useEffect(() => {
    if (Platform.OS === "ios") {
      addSpecificOrientationListener(onOrientationChange);
      getSpecificOrientation && getSpecificOrientation(onOrientationChange);
    } else {
      addOrientationListener(onOrientationChange);
    }

    return () => {
      removeSpecificOrientationListener(onOrientationChange);
      removeOrientationListener(onOrientationChange);
    };
  }, []);

  const showFullScreenEditor = useCallback(() => {
    setFullscreen(true);
    if (deviceMode === "smallTablet") {
      tabBarRef.current?.openDrawer(false);
    }
    editorRef.current?.setNativeProps({
      style: {
        width: dimensions.width,
        zIndex: 999,
        paddingHorizontal:
          deviceMode === "smallTablet"
            ? dimensions.width * 0
            : dimensions.width * 0.15
      }
    });
  }, [deviceMode, dimensions.width, setFullscreen]);

  const closeFullScreenEditor = useCallback(
    (current) => {
      const _deviceMode = current || deviceMode;
      if (_deviceMode === "smallTablet") {
        tabBarRef.current?.closeDrawer(false);
      }
      setFullscreen(false);
      editorController.current?.commands.updateSettings({
        fullscreen: false
      });
      editorRef.current?.setNativeProps({
        style: {
          width:
            _deviceMode === "smallTablet"
              ? dimensions.width -
                valueLimiter(dimensions.width * 0.4, 300, 450)
              : dimensions.width > 1100
              ? dimensions.width * 0.55
              : dimensions.width * 0.5,
          zIndex: null,
          paddingHorizontal: 0
        }
      });
      if (_deviceMode === "smallTablet") {
        tabBarRef.current?.goToIndex(1, false);
      }
      if (_deviceMode === "mobile") {
        tabBarRef.current?.goToIndex(2, false);
      }
    },
    [deviceMode, dimensions.width, setFullscreen]
  );

  useEffect(() => {
    if (!tabBarRef.current?.isDrawerOpen()) {
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

  const _onLayout = (event) => {
    let size = event?.nativeEvent?.layout;
    if (!size || (size.width === dimensions.width && deviceMode !== null)) {
      DDS.setSize(size, orientation);
      setDeviceMode(deviceMode, size);
      checkDeviceType(size);
      return;
    }

    checkDeviceType(size);
  };

  if (!deviceMode) {
    const size = Dimensions.get("window");
    checkDeviceType(size);
  }

  function checkDeviceType(size) {
    setDimensions({
      width: size.width,
      height: size.height
    });
    DDS.setSize(size, orientation);
    const nextDeviceMode = DDS.isLargeTablet()
      ? "tablet"
      : DDS.isSmallTab
      ? "smallTablet"
      : "mobile";

    setDeviceMode(nextDeviceMode, size);
  }

  function setDeviceMode(current, size) {
    setDeviceModeState(current);

    let needsUpdate = current !== deviceMode;

    if (fullscreen && current !== "mobile") {
      // Runs after size is set via state.
      setTimeout(() => {
        editorRef.current?.setNativeProps({
          style: {
            width: size.width,
            zIndex: 999,
            paddingHorizontal:
              current === "smallTablet" ? size.width * 0 : size.width * 0.15
          }
        });
      }, 1);
    } else {
      if (fullscreen) eSendEvent(eCloseFullscreenEditor, current);
      editorRef.current?.setNativeProps({
        style: {
          position: "relative",
          width:
            current === "tablet"
              ? size.width > 1100
                ? size.width * 0.55
                : size.width * 0.5
              : current === "smallTablet"
              ? size.width - valueLimiter(size.width * 0.4, 300, 450)
              : size.width,
          zIndex: null,
          paddingHorizontal: 0
        }
      });
    }
    if (!needsUpdate) {
      return;
    }
    setTimeout(() => {
      switch (current) {
        case "tablet":
          tabBarRef.current?.goToIndex(0, false);
          break;
        case "smallTablet":
          if (!fullscreen) {
            tabBarRef.current?.closeDrawer(false);
          } else {
            tabBarRef.current?.openDrawer(false);
          }
          break;
        case "mobile":
          if (
            !editorState().movedAway &&
            useEditorStore.getState().currentEditingNote
          ) {
            tabBarRef.current?.goToIndex(2, false);
          } else {
            tabBarRef.current?.goToIndex(1, false);
          }
          break;
      }
    }, 1000);
  }

  const onScroll = (scrollOffset) => {
    hideAllTooltips();
    if (scrollOffset > offsets[deviceMode].a - 10) {
      animatedOpacity.value = 0;
      toggleView(false);
    } else {
      let o = scrollOffset / 300;
      let op = 0;
      if (o < 0) {
        op = 1;
      } else {
        op = 1 - o;
      }
      animatedOpacity.value = op;
      toggleView(op < 0.1 ? false : true);
    }
  };

  const toggleView = useCallback(
    (show) => {
      animatedTranslateY.value = show ? 0 : -9999;
    },
    [animatedTranslateY]
  );

  const valueLimiter = (value, min, max) => {
    if (value < min) {
      return min;
    }

    if (value > max) {
      return max;
    }

    return value;
  };

  const offsets = {
    mobile: {
      a: dimensions.width * 0.75,
      b: dimensions.width + dimensions.width * 0.75,
      c: dimensions.width * 2 + dimensions.width * 0.75
    },
    smallTablet: {
      a: fullscreen ? 0 : valueLimiter(dimensions.width * 0.3, 300, 350),
      b: fullscreen
        ? 0
        : dimensions.width + valueLimiter(dimensions.width * 0.3, 300, 350),
      c: fullscreen
        ? 0
        : dimensions.width + valueLimiter(dimensions.width * 0.3, 300, 350)
    },
    tablet: {
      a: 0,
      b: 0,
      c: 0
    }
  };
  const widths = {
    mobile: {
      a: dimensions.width * 0.75,
      b: dimensions.width,
      c: dimensions.width
    },
    smallTablet: {
      a: valueLimiter(dimensions.width * 0.3, 300, 350),
      b: valueLimiter(dimensions.width * 0.4, 300, 450),
      c: dimensions.width - valueLimiter(dimensions.width * 0.4, 300, 450)
    },
    tablet: {
      a:
        dimensions.width > 1100
          ? dimensions.width * 0.15
          : dimensions.width * 0.2,
      b: dimensions.width * 0.3,
      c:
        dimensions.width > 1100
          ? dimensions.width * 0.55
          : dimensions.width * 0.5
    }
  };

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

  useEffect(() => {
    function updateSystemBars() {
      changeNavigationBarColor(colors.primary.background, isDark, true);
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }
    updateSystemBars();
    setTimeout(() => {
      updateSystemBars();
    }, 1000);
  }, [colors.primary.background, isDark]);

  return (
    <View
      onLayout={_onLayout}
      testID={notesnook.ids.default.root}
      style={{
        height: "100%",
        width: "100%",
        backgroundColor: colors.primary.background,
        paddingBottom: Platform.OS === "android" ? insets?.bottom : 0,
        marginRight:
          orientation === "LANDSCAPE-RIGHT" && Platform.OS === "ios"
            ? insets.right
            : 0,
        marginLeft:
          orientation === "LANDSCAPE-LEFT" && Platform.OS === "ios"
            ? insets.left
            : 0
      }}
    >
      <StatusBar translucent={true} backgroundColor="transparent" />

      {!introCompleted ? (
        <NavigationStack />
      ) : (
        <>
          {deviceMode && widths[deviceMode] ? (
            <FluidTabs
              ref={tabBarRef}
              dimensions={dimensions}
              widths={widths[deviceMode]}
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
                  width: fullscreen ? 0 : widths[deviceMode]?.a
                }}
              >
                <ScopedThemeProvider value="navigationMenu">
                  <SideMenu />
                </ScopedThemeProvider>
              </View>

              <View
                key="2"
                style={{
                  height: "100%",
                  width: fullscreen ? 0 : widths[deviceMode]?.b
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
                        tabBarRef.current?.closeDrawer();
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

                  <NavigationStack />
                </ScopedThemeProvider>
              </View>

              <ScopedThemeProvider value="editor">
                <EditorWrapper key="3" width={widths} dimensions={dimensions} />
              </ScopedThemeProvider>
            </FluidTabs>
          ) : null}
        </>
      )}
    </View>
  );
};
export const TabHolder = React.memo(_TabsHolder, () => true);

const onChangeTab = async (obj) => {
  if (obj.i === 2) {
    editorState().movedAway = false;
    editorState().isFocused = true;
    activateKeepAwake();
    if (!editorState().currentlyEditing) {
      eSendEvent(eOnLoadNote, {
        newNote: true
      });
    }
  } else {
    if (obj.from === 2) {
      deactivateKeepAwake();
      editorState().movedAway = true;
      editorState().isFocused = false;
      eSendEvent(eClearEditor, "removeHandler");
      setTimeout(() => useEditorStore.getState().setSearchReplace(false), 1);
      let id = useEditorStore.getState().currentEditingNote;
      let note = db.notes.note(id);
      const locked = note && (await db.vaults.itemExists(note));
      if (locked) {
        eSendEvent(eClearEditor);
      }
    }
  }
};
