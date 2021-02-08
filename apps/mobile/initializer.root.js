import {
  activateKeepAwake,
  deactivateKeepAwake
} from '@sayem314/react-native-keep-awake';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import { notesnook } from './e2e/test.ids';
import ContextMenu from './src/components/ContextMenu';
import { DialogManager } from './src/components/DialogManager';
import { DummyText } from './src/components/DummyText';
import { Menu } from './src/components/Menu';
import Splash from './src/components/SplashScreen';
import { Toast } from './src/components/Toast';
import { NavigationStack } from './src/navigation/Drawer';
import { NavigatorStack } from './src/navigation/NavigatorStack';
import { useTracked } from './src/provider';
import { Actions } from './src/provider/Actions';
import { DDS } from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from './src/services/EventManager';
import { editing, setWidthHeight } from './src/utils';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eCloseSideMenu,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eOpenSideMenu
} from './src/utils/Events';
import { editorRef, tabBarRef } from './src/utils/Refs';
import { EditorWrapper } from './src/views/Editor/EditorWrapper';
import { EditorWebView, getNote } from './src/views/Editor/Functions';
import tiny from './src/views/Editor/tiny/tiny';
let {width, height} = Dimensions.get('window');
let layoutTimer = null;
let currentTab = 0;

const onChangeTab = async (obj) => {
  if (obj.i === 1) {
    eSendEvent(eCloseSideMenu);
    editing.movedAway = false;
    currentTab = 1;
    activateKeepAwake();
    eSendEvent('navigate');

    if (!editing.currentlyEditing || !getNote()) {
      eSendEvent(eOnLoadNote, {type: 'new'});
      editing.currentlyEditing = true;
    }
  } else {
    if (obj.from === 1) {
      deactivateKeepAwake();
      if (getNote()?.locked) {
        eSendEvent(eClearEditor);
      }
      editing.movedAway = true;
      tiny.call(EditorWebView, tiny.blur);
    }
    editing.isFocused = false;
    currentTab = 0;
    eSendEvent(eOpenSideMenu);
  }
};

export const RootView = React.memo(
  () => {
    return (
      <>
        <NavigationStack component={AppStack} />
        <Toast />
        <ContextMenu />
        <DummyText />
        <DialogManager />
        <Splash />
      </>
    );
  },
  () => true,
);

let updatedDimensions = {
  width: width,
  height: height,
};

let currentScroll = 0;
let startLocation = 0;
let startLocationX = 0;
const _responder = (e) => {
  startLocation = e.nativeEvent.pageY;
  startLocationX = e.nativeEvent.pageX;
  _handleTouch();
  return false;
};
const _moveResponder = (e) => {
  _handleTouch();
  return false;
};

let touchEndTimer = null;

const _handleTouch = () => {
  {
    let heightCheck = !editing.tooltip
      ? updatedDimensions.height - 70
      : updatedDimensions.height - 140;
    if (
      (currentTab === 1 && startLocation > heightCheck) ||
      (currentTab === 1 && startLocationX > 50) ||
      (currentTab === 0 && startLocationX < 150)
    ) {
      if (currentScroll === 0 || currentScroll === 1) {
        tabBarRef.current?.setScrollEnabled(false);
      }
    } else {
      tabBarRef.current?.setScrollEnabled(true);
    }
  }
};

const _onTouchEnd = (e) => {
  startLocation = 0;
  clearTimeout(touchEndTimer);
  touchEndTimer = null;
  touchEndTimer = setTimeout(() => {
    tabBarRef.current?.setScrollEnabled(true);
  }, 200);
};

const AppStack = React.memo(
  () => {
    const [state, dispatch] = useTracked();
    const {colors, deviceMode} = state;
    const [dimensions, setDimensions] = useState({width, height});

    const showFullScreenEditor = () => {
      dispatch({type: Actions.FULLSCREEN, state: true});
      editorRef.current?.setNativeProps({
        style: {
          position: 'absolute',
          width: dimensions.width,
          zIndex: 999,
          paddingHorizontal: dimensions.width * 0.15,
          backgroundColor: colors.bg,
        },
      });
    };

    const closeFullScreenEditor = () => {
      dispatch({type: Actions.FULLSCREEN, state: false});
      editorRef.current?.setNativeProps({
        style: {
          position: 'relative',
          width: dimensions.width * 0.55,
          zIndex: null,
          paddingHorizontal: 0,
        },
      });
    };

    useEffect(() => {
      eSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
      eSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);

      return () => {
        eUnSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
        eUnSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);
      };
    }, []);

    const _onLayout = async (event) => {
      if (layoutTimer) {
        clearTimeout(layoutTimer);
        layoutTimer = null;
      }

      let size = event?.nativeEvent?.layout;
      updatedDimensions = size;
      if (!size || (size.width === dimensions.width && deviceMode !== null)) {
        console.log(
          size.width,
          dimensions.width,
          dimensions.height,
          size.height,
          'before mode',
        );
        DDS.setSize(size);
        console.log(deviceMode, 'MODE__');
        dispatch({type: Actions.DEVICE_MODE, state: deviceMode});
        return;
      }

      layoutTimer = setTimeout(async () => {
        checkDeviceType(size);
      }, 500);
    };

    function checkDeviceType(size) {
      setDimensions({
        width: size.width,
        height: size.height,
      });

      setWidthHeight(size);
      DDS.setSize(size);
      console.log(DDS.isLargeTablet(), size, DDS.isSmallTab);
      if (DDS.isLargeTablet()) {
        console.log('setting large tab');
        setDeviceMode('tablet', size);
      } else if (DDS.isSmallTab) {
        console.log('setting small tab');
        setDeviceMode('smallTablet', size);
      } else {
        setDeviceMode('mobile', size);
      }
    }

    function setDeviceMode(current, size) {
      eSendEvent(current !== 'mobile' ? eCloseSideMenu : eOpenSideMenu);
      dispatch({type: Actions.DEVICE_MODE, state: current});
      dispatch({type: Actions.FULLSCREEN, state: false});

      editorRef.current?.setNativeProps({
        style: {
          position: 'relative',
          width: current === 'tablet' ? size.width * 0.55 : size.width,
          zIndex: null,
          paddingHorizontal: 0,
        },
      });
      if (!editing.movedAway && current !== 'tablet') {
        tabBarRef.current?.goToPage(1);
      }
    }

    const onScroll = (scroll) => {
      currentScroll = scroll;
      if (scroll === 0) {
        eSendEvent(eOpenSideMenu);
      } else {
        eSendEvent(eCloseSideMenu);
      }
    };

    const renderTabBar = useCallback(() => <></>, []);

    return (
      <View
        onLayout={_onLayout}
        testID={notesnook.ids.default.root}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
        }}
        onMoveShouldSetResponderCapture={_moveResponder}
        onTouchEnd={_onTouchEnd}
        onStartShouldSetResponderCapture={_responder}>
        {deviceMode && (
          <ScrollableTabView
            ref={tabBarRef}
            style={{
              zIndex: 1,
            }}
            onScroll={onScroll}
            initialPage={0}
            prerenderingSiblingsNumber={Infinity}
            onChangeTab={onChangeTab}
            renderTabBar={renderTabBar}>
            {deviceMode !== 'tablet' && (
              <View
                style={{
                  width: dimensions.width,
                  height: '100%',
                  borderRightColor: colors.nav,
                  borderRightWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                {deviceMode === 'smallTablet' && (
                  <View
                    style={{
                      height: '100%',
                      width: dimensions.width * 0.35,
                    }}>
                    <Menu />
                  </View>
                )}

                <View
                  style={{
                    height: '100%',
                    width:
                      deviceMode === 'mobile'
                        ? dimensions.width
                        : dimensions.width * 0.65,
                  }}>
                  <NavigatorStack />
                </View>
              </View>
            )}

            <View
              style={{
                width: '100%',
                height: '100%',
                flexDirection: 'row',
                backgroundColor: colors.bg,
              }}>
              {deviceMode === 'tablet' && (
                <View
                  style={{
                    width: dimensions.width * 0.45,
                    height: '100%',
                    borderRightColor: colors.nav,
                    borderRightWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <View
                    style={{
                      height: '100%',
                      width: dimensions.width * 0.15,
                    }}>
                    <Menu />
                  </View>

                  <View
                    style={{
                      height: '100%',
                      width: dimensions.width * 0.3,
                    }}>
                    <NavigatorStack />
                  </View>
                </View>
              )}
              <EditorWrapper dimensions={dimensions} />
            </View>
          </ScrollableTabView>
        )}
      </View>
    );
  },
  () => true,
);
