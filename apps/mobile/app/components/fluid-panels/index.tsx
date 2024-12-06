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

import React, {
  forwardRef,
  RefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import { BackHandler, Platform, ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  withTiming
} from "react-native-reanimated";
import { useTabStore } from "../../screens/editor/tiptap/use-tab-store";
import { getAppState } from "../../screens/editor/tiptap/utils";
import { eSendEvent } from "../../services/event-manager";
import { useSettingStore } from "../../stores/use-setting-store";
import { eClearEditor } from "../../utils/events";
import { useSideBarDraggingStore } from "../side-menu/dragging-store";

interface TabProps extends ViewProps {
  dimensions: { width: number; height: number };
  widths: { sidebar: number; list: number; editor: number };
  onChangeTab: (data: { i: number; from: number }) => void;
  onScroll: (offset: number) => void;
  enabled: boolean;
  onDrawerStateChange: (state: boolean) => void;
}

export interface TabsRef {
  goToPage: (page: number, animated?: boolean) => void;
  goToIndex: (index: number, animated?: boolean) => 0 | undefined;
  unlock: () => boolean;
  lock: () => boolean;
  openDrawer: (animated?: boolean) => void;
  closeDrawer: (animated?: boolean) => void;
  page: () => number;
  setScrollEnabled: () => true;
  isDrawerOpen: () => boolean;
  node: RefObject<Animated.View>;
}

export const FluidPanels = forwardRef<TabsRef, TabProps>(function FluidTabs(
  {
    children,
    dimensions,
    widths,
    onChangeTab,
    onScroll,
    enabled,
    onDrawerStateChange
  }: TabProps,
  ref
) {
  const appState = useMemo(() => getAppState(), []);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const fullscreen = useSettingStore((state) => state.fullscreen);
  const translateX = useSharedValue(
    widths
      ? appState &&
        appState?.movedAway === false &&
        useTabStore.getState().getCurrentNoteId()
        ? widths.sidebar + widths.list
        : widths.sidebar
      : 0
  );
  const startX = useSharedValue(0);
  const currentTab = useSharedValue(1);
  const previousTab = useSharedValue(1);
  const isDrawerOpen = useSharedValue(false);
  const gestureStartValue = useSharedValue({
    x: 0,
    y: 0
  });
  const locked = useSharedValue(false);
  const forcedLock = useSharedValue(false);
  const [disabled, setDisabled] = useState(false);
  const node = useRef<Animated.View>(null);
  const containerWidth = widths
    ? widths.sidebar + widths.list + widths.editor
    : dimensions.width;

  const drawerPosition = 0;
  const homePosition = widths.sidebar;
  const editorPosition = widths.sidebar + widths.list;
  const isSmallTab = deviceMode === "smallTablet";
  const isLoaded = useRef(false);
  const prevWidths = useRef(widths);
  const isIPhone = Platform.OS === "ios";

  useEffect(() => {
    if (deviceMode === "tablet" || fullscreen) {
      translateX.value = 0;
    } else {
      if (prevWidths.current?.sidebar !== widths.sidebar) {
        translateX.value =
          appState && appState?.movedAway === false
            ? editorPosition
            : widths.sidebar;
        if (translateX.value === editorPosition) {
          onChangeTab?.({ i: 2, from: 1 });
        }
      }
    }
    isLoaded.current = true;
    prevWidths.current = widths;
  }, [
    deviceMode,
    widths,
    fullscreen,
    translateX,
    editorPosition,
    appState,
    onChangeTab
  ]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isDrawerOpen.value && !forcedLock.value) {
        translateX.value = withTiming(homePosition);
        onDrawerStateChange(false);
        isDrawerOpen.value = false;
        return true;
      }
      return false;
    });
    return () => {
      sub && sub.remove();
    };
  }, [
    forcedLock.value,
    homePosition,
    isDrawerOpen,
    onDrawerStateChange,
    translateX
  ]);

  useImperativeHandle(
    ref,
    (): TabsRef => ({
      goToPage: (page: number, animated = true) => {
        if (deviceMode === "tablet") {
          translateX.value = animated ? withTiming(0) : 0;
          return;
        }
        page = page + 1;
        if (page === 1) {
          onDrawerStateChange(false);
          translateX.value = !animated
            ? homePosition
            : withTiming(homePosition);
          currentTab.value = 1;
        } else if (page === 2) {
          onDrawerStateChange(false);
          translateX.value = !animated
            ? editorPosition
            : withTiming(editorPosition);
          currentTab.value = 2;
        }
      },
      goToIndex: (index: number, animated = true) => {
        if (deviceMode === "tablet") {
          translateX.value = animated ? withTiming(0) : 0;
          return;
        }
        if (index === 0) {
          onDrawerStateChange(true);
          return (translateX.value = animated ? withSpring(0) : 0);
        }
        if (index === 1) {
          translateX.value = animated ? withTiming(homePosition) : homePosition;
          currentTab.value = 1;
        } else if (index === 2) {
          translateX.value = animated
            ? withTiming(editorPosition)
            : editorPosition;
          currentTab.value = 2;
        }
      },
      unlock: () => {
        forcedLock.value = false;
        return false;
      },
      lock: () => {
        forcedLock.value = true;
        return true;
      },
      isDrawerOpen: () => isDrawerOpen.value,
      openDrawer: (animated = true) => {
        if (deviceMode === "tablet") {
          translateX.value = animated ? withTiming(0) : 0;
          return;
        }
        translateX.value = animated
          ? withSpring(drawerPosition, {
              mass: 0.5
            })
          : drawerPosition;
        isDrawerOpen.value = true;
        onDrawerStateChange(true);
      },
      closeDrawer: (animated = true) => {
        if (forcedLock.value) return;
        if (deviceMode === "tablet") {
          translateX.value = animated ? withTiming(0) : 0;
          return;
        }
        translateX.value = animated ? withTiming(homePosition) : homePosition;
        if (!animated) {
          translateX.value = 299;
          translateX.value = 300;
        }
        useSideBarDraggingStore.setState({
          dragging: false
        });
        onDrawerStateChange(false);
        isDrawerOpen.value = false;
      },
      page: () => currentTab.value,
      setScrollEnabled: () => true,
      node: node
    }),
    [
      currentTab,
      deviceMode,
      translateX,
      onDrawerStateChange,
      homePosition,
      editorPosition,
      forcedLock,
      isDrawerOpen
    ]
  );

  useAnimatedReaction(
    () => currentTab.value,
    (result) => {
      if (setDisabled) {
        if (result === 2) {
          runOnJS(setDisabled)(!isIPhone);
        } else {
          runOnJS(setDisabled)(false);
        }
      }

      if (onChangeTab) {
        runOnJS(onChangeTab)({ i: result, from: previousTab.value });
        previousTab.value = result;
      }
    },
    []
  );

  useAnimatedReaction(
    () => translateX.value,
    (value) => {
      runOnJS(onScroll)(value);
    },
    []
  );

  const clearEditor = () => {
    setTimeout(() => {
      eSendEvent(eClearEditor);
    }, 300);
  };

  const gesture = Gesture.Pan()
    .maxPointers(1)
    .enabled(enabled && !disabled)
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onBegin((event) => {
      locked.value = false;
      gestureStartValue.value = {
        x: event.absoluteX,
        y: event.absoluteY
      };
    })
    .onStart((event) => {
      let vx = event.velocityX;
      let vy = event.velocityY;

      if (vx < 0) vx = vx * -1;
      if (vy < 0) vy = vy * -1;
      // if vy is greater than vx, user is swiping vertically. lock swiping.
      if (vy > vx) locked.value = true;
      // if dividend of vx/vy is less than 4, user is swiping diagonally. lock swiping
      if (vx / vy < 1.5) locked.value = true;
      startX.value = translateX.value;
    })
    .onChange((event) => {
      if (locked.value || forcedLock.value) return;
      const value = translateX.value + event.changeX * -1;
      if (
        value < 0 ||
        (currentTab.value === 2 && Platform.OS === "android") ||
        (currentTab.value === 2 &&
          gestureStartValue.value.x > 25 &&
          Platform.OS === "ios") ||
        (value >= homePosition && isSmallTab) ||
        value > editorPosition
      )
        return;
      translateX.value = value;
    })
    .onEnd((event) => {
      if (locked.value || forcedLock.value) return;
      if (currentTab.value === 2 && Platform.OS === "android") return;
      const velocityX =
        event.velocityX < 0 ? event.velocityX * -1 : event.velocityX;
      const isSwipeLeft = startX.value > translateX.value;
      const finalValue = isSwipeLeft
        ? translateX.value - velocityX / 40.0
        : translateX.value + velocityX / 40.0;

      const animationConfig: WithSpringConfig = {
        velocity: velocityX,
        mass: 0.5,
        overshootClamping: true,
        damping: 800,
        stiffness: 800
      };

      if (finalValue < homePosition) {
        if (isSwipeLeft && finalValue < homePosition - 100) {
          translateX.value = withSpring(0, animationConfig);
          isDrawerOpen.value = true;
          currentTab.value = 1;
          runOnJS(onDrawerStateChange)(true);
          return;
        } else if (!isSwipeLeft && finalValue > 100) {
          translateX.value = withSpring(homePosition, animationConfig);
          isDrawerOpen.value = false;
          currentTab.value = 1;
          runOnJS(onDrawerStateChange)(false);

          return;
        } else if (!isSwipeLeft && finalValue < 100) {
          translateX.value = withSpring(0, animationConfig);
          isDrawerOpen.value = true;
          currentTab.value = 1;
          return;
        }
      }

      if (finalValue > homePosition && currentTab.value === 1) {
        const sizeOfEditorInView = finalValue - homePosition;
        if (!isSwipeLeft && sizeOfEditorInView > 150) {
          translateX.value = withSpring(editorPosition, animationConfig);
          currentTab.value = 2;
          isDrawerOpen.value = false;
          return;
        }
      }

      if (currentTab.value === 2) {
        if (finalValue < editorPosition - 100 && isSwipeLeft) {
          translateX.value = withSpring(homePosition, animationConfig);
          currentTab.value = 1;
          isDrawerOpen.value = false;
          runOnJS(clearEditor)();
        } else {
          translateX.value = withSpring(editorPosition, animationConfig);
          currentTab.value = 2;
        }
        return;
      }

      runOnJS(onDrawerStateChange)(false);
      translateX.value = withSpring(homePosition, animationConfig);
      currentTab.value = 1;
      isDrawerOpen.value = false;
      startX.value = 0;
    });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value * -1
        }
      ]
    };
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        ref={node}
        removeClippedSubviews={false}
        collapsable={false}
        style={[
          {
            flex: 1,
            width: containerWidth,
            flexDirection: "row"
          },
          deviceMode === "tablet"
            ? {
                transform: [
                  {
                    translateX: 0
                  }
                ]
              }
            : animatedStyles
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
});
