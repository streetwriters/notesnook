import React, {
  forwardRef,
  RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { BackHandler, Platform, ViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  withTiming
} from 'react-native-reanimated';
import { useSettingStore } from '../../stores/use-setting-store';
import { eSendEvent } from '../../services/event-manager';
import { eClearEditor } from '../../utils/events';

interface TabProps extends ViewProps {
  dimensions: { width: number; height: number };
  widths: { a: number; b: number; c: number };
  onChangeTab: (data: { i: number; from: number }) => void;
  onScroll: (offset: number) => void;
  enabled: boolean;
  onDrawerStateChange: (state: boolean) => void;
}

export interface TabsRef {
  goToPage: (page: number) => void;
  goToIndex: (index: number) => 0 | undefined;
  unlock: () => boolean;
  lock: () => boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  page: number;
  setScrollEnabled: () => true;
  isDrawerOpen: () => boolean;
  node: RefObject<Animated.View>;
}

export const FluidTabs = forwardRef<TabsRef, TabProps>(
  (
    { children, dimensions, widths, onChangeTab, onScroll, enabled, onDrawerStateChange }: TabProps,
    ref
  ) => {
    const deviceMode = useSettingStore(state => state.deviceMode);
    const fullscreen = useSettingStore(state => state.fullscreen);
    const introCompleted = useSettingStore(state => state.settings.introCompleted);
    const translateX = useSharedValue(widths ? widths.a : 0);
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
    const containerWidth = widths ? widths.a + widths.b + widths.c : dimensions.width;

    const drawerPosition = 0;
    const homePosition = widths.a;
    const editorPosition = widths.a + widths.b;
    const isSmallTab = deviceMode === 'smallTablet';
    const isLoaded = useRef(false);
    const prevWidths = useRef(widths);
    const isIPhone = Platform.OS === 'ios';

    useEffect(() => {
      if (introCompleted) {
        if (deviceMode === 'tablet' || fullscreen) {
          translateX.value = 0;
        } else {
          if (prevWidths.current?.a !== widths.a) translateX.value = widths.a;
        }
        isLoaded.current = true;
        prevWidths.current = widths;
      }

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isDrawerOpen.value) {
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
    }, [introCompleted, deviceMode, widths]);

    useImperativeHandle(
      ref,
      (): TabsRef => ({
        goToPage: (page: number) => {
          if (deviceMode === 'tablet') {
            translateX.value = withTiming(0);
            return;
          }
          page = page + 1;
          if (page === 1) {
            onDrawerStateChange(false);
            translateX.value = withTiming(homePosition);
            currentTab.value = 1;
          } else if (page === 2) {
            onDrawerStateChange(false);
            translateX.value = withTiming(editorPosition);
            currentTab.value = 2;
          }
        },
        goToIndex: (index: number) => {
          if (deviceMode === 'tablet') {
            translateX.value = withTiming(0);
            return;
          }
          if (index === 0) {
            onDrawerStateChange(true);
            return (translateX.value = withSpring(0));
          }
          if (index === 1) {
            translateX.value = withTiming(homePosition);
            currentTab.value = 1;
          } else if (index === 2) {
            translateX.value = withTiming(editorPosition);
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
        openDrawer: () => {
          translateX.value = withSpring(drawerPosition, {
            mass: 0.5
          });
          isDrawerOpen.value = true;
          onDrawerStateChange(true);
        },
        closeDrawer: () => {
          if (deviceMode === 'tablet') {
            translateX.value = withTiming(0);
            return;
          }
          translateX.value = withTiming(homePosition);
          onDrawerStateChange(false);
          isDrawerOpen.value = false;
        },
        page: currentTab.value,
        setScrollEnabled: () => true,
        node: node
      }),
      [deviceMode, homePosition, editorPosition]
    );

    useAnimatedReaction(
      () => currentTab.value,
      result => {
        if (setDisabled) {
          if (result === 2) {
            runOnJS(setDisabled)(!isIPhone);
          } else {
            runOnJS(setDisabled)(false);
          }
        }

        if (onChangeTab) {
          runOnJS(onChangeTab)({ i: result, from: previousTab.value });
        }
      },
      []
    );

    useAnimatedReaction(
      () => translateX.value,
      value => {
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
      .activeOffsetX([-5, 5])
      .failOffsetY([-15, 15])
      .onBegin(event => {
        locked.value = false;
        gestureStartValue.value = {
          x: event.absoluteX,
          y: event.absoluteY
        };
      })
      .onStart(event => {
        console.log('gesture activated');
        let diffX = gestureStartValue.value.x - event.absoluteX;
        let diffY = gestureStartValue.value.y - event.absoluteY;

        let vx = event.velocityX;
        let vy = event.velocityY;

        if (vx < 0) vx = vx * -1;
        if (vy < 0) vy = vy * -1;
        // if vy is greater than vx, user is swiping vertically. lock swiping.
        if (vy > vx) locked.value = true;
        // if dividend of vx/vy is less than 4, user is swiping diagonally. lock swiping
        console.log(vx / vy);
        if (vx / vy < 1.5) locked.value = true;
        startX.value = translateX.value;
      })
      .onChange(event => {
        if (locked.value || forcedLock.value) return;
        let value = translateX.value + event.changeX * -1;
        if (
          value < 0 ||
          (currentTab.value === 2 && Platform.OS === 'android') ||
          (currentTab.value === 2 && gestureStartValue.value.x > 25 && Platform.OS === 'ios') ||
          (value >= homePosition && isSmallTab) ||
          value > editorPosition
        )
          return;
        translateX.value = value;
      })
      .onEnd(event => {
        if (currentTab.value === 2 && Platform.OS === 'android') return;
        let velocityX = event.velocityX < 0 ? event.velocityX * -1 : event.velocityX;
        let isSwipeLeft = startX.value > translateX.value;
        let finalValue = isSwipeLeft
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
              flexDirection: 'row'
            },
            animatedStyles
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    );
  }
);
