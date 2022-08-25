import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, StatusBar } from 'react-native';
import {
  addSpecificOrientationListener,
  getInitialOrientation,
  getSpecificOrientation,
  removeSpecificOrientationListener
} from 'react-native-orientation';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notesnook } from '../../e2e/test.ids';
import { SideMenu } from '../components/side-menu';
import { FluidTabs } from '../components/tabs';
import { editorController, editorState } from '../screens/editor/tiptap/utils';
import { EditorWrapper } from '../screens/editor/wrapper';
import { DDS } from '../services/device-detection';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../services/event-manager';
import { useEditorStore } from '../stores/use-editor-store';
import { useSettingStore } from '../stores/use-setting-store';
import { useThemeStore } from '../stores/use-theme-store';
import { setWidthHeight } from '../utils';
import { db } from '../common/database';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor
} from '../utils/events';
import { editorRef, tabBarRef } from '../utils/global-refs';
import { hideAllTooltips } from '../hooks/use-tooltip';
import { NavigationStack } from './navigation-stack';
export const TabsHolder = React.memo(
  () => {
    const colors = useThemeStore(state => state.colors);

    const deviceMode = useSettingStore(state => state.deviceMode);
    const setFullscreen = useSettingStore(state => state.setFullscreen);
    const fullscreen = useSettingStore(state => state.fullscreen);
    const setDeviceModeState = useSettingStore(state => state.setDeviceMode);
    const dimensions = useSettingStore(state => state.dimensions);
    const setDimensions = useSettingStore(state => state.setDimensions);
    const insets = useSafeAreaInsets();
    const animatedOpacity = useSharedValue(0);
    const animatedTranslateY = useSharedValue(-9999);
    const overlayRef = useRef();
    const [orientation, setOrientation] = useState(getInitialOrientation());
    const introCompleted = useSettingStore(state => state.settings.introCompleted);

    const onOrientationChange = (o, o2) => {
      setOrientation(o || o2);
    };

    useEffect(() => {
      if (Platform.OS === 'ios') {
        addSpecificOrientationListener(onOrientationChange);
        getSpecificOrientation && getSpecificOrientation(onOrientationChange);
      }
      return () => {
        removeSpecificOrientationListener(onOrientationChange);
      };
    }, []);

    const showFullScreenEditor = () => {
      setFullscreen(true);
      if (deviceMode === 'smallTablet') {
        tabBarRef.current?.openDrawer();
      }
      editorRef.current?.setNativeProps({
        style: {
          width: dimensions.width,
          zIndex: 999,
          paddingHorizontal:
            deviceMode === 'smallTablet' ? dimensions.width * 0 : dimensions.width * 0.15
        }
      });
    };

    const closeFullScreenEditor = () => {
      if (deviceMode === 'smallTablet') {
        tabBarRef.current?.closeDrawer();
      }
      setFullscreen(false);
      editorController.current?.commands.updateSettings({
        fullscreen: false
      });
      editorRef.current?.setNativeProps({
        style: {
          width:
            deviceMode === 'smallTablet'
              ? dimensions.width - valueLimiter(dimensions.width * 0.4, 300, 450)
              : dimensions.width * 0.55,
          zIndex: null,
          paddingHorizontal: 0
        }
      });
      if (deviceMode === 'smallTablet') {
        setTimeout(() => {
          tabBarRef.current?.goToIndex(1);
        }, 100);
      }
    };

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
    }, [deviceMode, dimensions, colors]);

    const _onLayout = async event => {
      console.log('layout called here');
      if (layoutTimer) {
        clearTimeout(layoutTimer);
        layoutTimer = null;
      }
      let size = event?.nativeEvent?.layout;
      if (!size || (size.width === dimensions.width && deviceMode !== null)) {
        DDS.setSize(size);
        setDeviceMode(deviceMode, size);
        checkDeviceType(size);
        return;
      }

      layoutTimer = setTimeout(async () => {
        checkDeviceType(size);
      }, 500);
    };

    function checkDeviceType(size) {
      setDimensions({
        width: size.width,
        height: size.height
      });
      console.log('height change', size.width, size.height);
      setWidthHeight(size);
      DDS.setSize(size);

      if (DDS.isLargeTablet()) {
        setDeviceMode('tablet', size);
        setTimeout(() => {
          introCompleted && tabBarRef.current?.goToIndex(0);
        }, 500);
      } else if (DDS.isSmallTab) {
        setDeviceMode('smallTablet', size);
        if (!fullscreen) {
          setTimeout(() => {
            introCompleted && tabBarRef.current?.closeDrawer();
          }, 500);
        } else {
          setTimeout(() => {
            introCompleted && tabBarRef.current?.openDrawer();
          }, 500);
        }
      } else {
        setDeviceMode('mobile', size);
      }
    }

    function setDeviceMode(current, size) {
      setDeviceModeState(current);
      let needsUpdate = current !== deviceMode;

      if (fullscreen) {
        editorRef.current?.setNativeProps({
          style: {
            width: size.width,
            zIndex: 999,
            paddingHorizontal: current === 'smallTablet' ? size.width * 0 : size.width * 0.15
          }
        });
      } else {
        editorRef.current?.setNativeProps({
          style: {
            position: 'relative',
            width:
              current === 'tablet'
                ? size.width * 0.55
                : current === 'smallTablet'
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
        if (current === 'tablet') {
          tabBarRef.current?.goToIndex(0);
        } else {
          if (!editorState().movedAway) {
            tabBarRef.current?.goToIndex(2);
          } else {
            console.log('index one', editorState().movedAway);
            tabBarRef.current?.goToIndex(1);
          }
        }
      }, 1);
    }

    const onScroll = scrollOffset => {
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

    const toggleView = show => {
      animatedTranslateY.value = show ? 0 : -9999;
    };

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
        b: fullscreen ? 0 : dimensions.width + valueLimiter(dimensions.width * 0.3, 300, 350),
        c: fullscreen ? 0 : dimensions.width + valueLimiter(dimensions.width * 0.3, 300, 350)
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
        a: dimensions.width * 0.15,
        b: dimensions.width * 0.3,
        c: dimensions.width * 0.55
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

    return (
      <View
        onLayout={_onLayout}
        testID={notesnook.ids.default.root}
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingBottom: Platform.OS === 'android' ? insets?.bottom : 0,
          marginRight:
            orientation === 'LANDSCAPE-RIGHT' && Platform.OS === 'ios' ? insets.right : 0,
          marginLeft: orientation === 'LANDSCAPE-LEFT' && Platform.OS === 'ios' ? insets.left : 0
        }}
      >
        <StatusBar
          barStyle={colors.night ? 'light-content' : 'dark-content'}
          translucent={true}
          backgroundColor="transparent"
        />

        {deviceMode && widths[deviceMode] ? (
          <FluidTabs
            ref={tabBarRef}
            dimensions={dimensions}
            widths={!introCompleted ? widths['mobile'] : widths[deviceMode]}
            enabled={deviceMode !== 'tablet' && !fullscreen}
            onScroll={onScroll}
            onChangeTab={onChangeTab}
            onDrawerStateChange={state => true}
          >
            <View
              key="1"
              style={{
                height: '100%',
                width: fullscreen ? 0 : widths[!introCompleted ? 'mobile' : deviceMode]?.a
              }}
            >
              <SideMenu />
            </View>

            <View
              key="2"
              style={{
                height: '100%',
                width: fullscreen ? 0 : widths[!introCompleted ? 'mobile' : deviceMode]?.b
              }}
            >
              {deviceMode === 'mobile' ? (
                <Animated.View
                  onTouchEnd={() => {
                    tabBarRef.current?.closeDrawer();
                    animatedOpacity.value = withTiming(0);
                    animatedTranslateY.value = withTiming(-9999);
                  }}
                  style={[
                    {
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      zIndex: 999,
                      backgroundColor: 'rgba(0,0,0,0.2)'
                    },
                    animatedStyle
                  ]}
                  ref={overlayRef}
                />
              ) : null}

              <NavigationStack />
            </View>
            <EditorWrapper key="3" width={widths} dimensions={dimensions} />
          </FluidTabs>
        ) : null}
      </View>
    );
  },
  () => true
);

let layoutTimer = null;

const onChangeTab = async obj => {
  if (obj.i === 2) {
    editorState().movedAway = false;
    editorState().isFocused = true;
    activateKeepAwake();
    if (!editorState().currentlyEditing) {
      eSendEvent(eOnLoadNote, { type: 'new' });
    }
  } else {
    if (obj.from === 2) {
      deactivateKeepAwake();
      editorState().movedAway = true;
      editorState().isFocused = false;
      eSendEvent(eClearEditor, 'removeHandler');
      setTimeout(() => useEditorStore.getState().setSearchReplace(false), 1);
      let id = useEditorStore.getState().currentEditingNote;
      let note = db.notes.note(id);
      if (note?.locked) {
        eSendEvent(eClearEditor);
      }
    }
  }
};
