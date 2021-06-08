import {
  activateKeepAwake,
  deactivateKeepAwake,
} from '@sayem314/react-native-keep-awake';
import React, {useEffect, useRef, useState} from 'react';
import {Dimensions, TouchableOpacity, View} from 'react-native';
import Animated, {useValue} from 'react-native-reanimated';
import {notesnook} from './e2e/test.ids';
import ContextMenu from './src/components/ContextMenu';
import CustomTabs from './src/components/CustomTabs';
import {DialogManager} from './src/components/DialogManager';
import {DummyText} from './src/components/DummyText';
import {Menu} from './src/components/Menu';
import {Toast} from './src/components/Toast';
import {NavigatorStack} from './src/navigation/NavigatorStack';
import {useTracked} from './src/provider';
import {useSettingStore} from './src/provider/stores';
import {DDS} from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/EventManager';
import {editing, setWidthHeight} from './src/utils';
import {updateStatusBarColor} from './src/utils/Colors';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eCloseSideMenu,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eOpenSideMenu,
} from './src/utils/Events';
import {editorRef, tabBarRef} from './src/utils/Refs';
import {sleep} from './src/utils/TimeUtils';
import {EditorWrapper} from './src/views/Editor/EditorWrapper';
import {EditorWebView, getNote} from './src/views/Editor/Functions';
import tiny from './src/views/Editor/tiny/tiny';
let {width, height} = Dimensions.get('window');
let layoutTimer = null;
let currentTab = 0;

const onChangeTab = async obj => {
  console.log(obj.i);
  if (obj.i === 1) {
    console.log('going to editor')
    console.log('making note');
    eSendEvent(eCloseSideMenu);
    editing.movedAway = false;
    currentTab = 1;
    activateKeepAwake();
    eSendEvent('navigate');
    eSendEvent(eClearEditor, 'addHandler');
    if (
      !editing.isRestoringState &&
      (!editing.currentlyEditing || !getNote())
    ) {
      eSendEvent(eOnLoadNote, {type: 'new'});
      editing.currentlyEditing = true;
    }
    sleep(1000).then(() => {
      updateStatusBarColor();
    });
  } else {
    if (obj.from === 1) {
      updateStatusBarColor();
      deactivateKeepAwake();
      eSendEvent(eClearEditor, 'removeHandler');
      if (getNote()?.locked) {
        eSendEvent(eClearEditor);
      }
      eSendEvent('showTooltip');
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
        <NativeStack />
        <Toast />
        <ContextMenu />
        <DummyText />
        <DialogManager />
      </>
    );
  },
  () => true,
);

const NativeStack = React.memo(
  () => {
    const [state] = useTracked();
    const {colors} = state;

    const deviceMode = useSettingStore(state => state.deviceMode);
    const setFullscreen = useSettingStore(state => state.setFullscreen);
    const setDeviceModeState = useSettingStore(state => state.setDeviceMode);

    const [dimensions, setDimensions] = useState({width, height});
    const animatedOpacity = useValue(0);
    const animatedTranslateY = useValue(-9999);
    const overlayRef = useRef();

    const showFullScreenEditor = () => {
      setFullscreen(true);
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
      setFullscreen(false);
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
      toggleView(false);
      eSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
      eSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);

      return () => {
        eUnSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
        eUnSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);
      };
    }, []);

    const _onLayout = async event => {
      if (layoutTimer) {
        clearTimeout(layoutTimer);
        layoutTimer = null;
      }

      let size = event?.nativeEvent?.layout;
      updatedDimensions = size;
      if (!size || (size.width === dimensions.width && deviceMode !== null)) {
        DDS.setSize(size);
        //console.log(deviceMode, 'MODE__');
        setDeviceMode(current, size);
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
      //console.log(DDS.isLargeTablet(), size, DDS.isSmallTab);
      if (DDS.isLargeTablet()) {
        //console.log('setting large tab');
        setDeviceMode('tablet', size);
        sleep(300).then(r => eSendEvent(eOpenSideMenu));
      } else if (DDS.isSmallTab) {
        //console.log('setting small tab');
        setDeviceMode('smallTablet', size);

        sleep(300).then(r => eSendEvent(eOpenSideMenu));
      } else {
        setDeviceMode('mobile', size);

        sleep(300).then(r => eSendEvent(eOpenSideMenu));
      }
    }

    function setDeviceMode(current, size) {
      eSendEvent(current !== 'mobile' ? eCloseSideMenu : eOpenSideMenu);
      setDeviceModeState(current);
      setFullscreen(false);

      editorRef.current?.setNativeProps({
        style: {
          position: 'relative',
          width: current === 'tablet' ? size.width * 0.55 : size.width,
          zIndex: null,
          paddingHorizontal: 0,
        },
      });
      if (current === 'tablet') {
        tabBarRef.current?.goToIndex(0);
      } else {
        if (!editing.movedAway) {
          tabBarRef.current?.goToIndex(2);
        } else {
          tabBarRef.current?.goToIndex(current === 'smallTablet' ? 0 : 1);
        }
      }
    }

    const onScroll = scrollOffset => {
      if (scrollOffset > 299) {
        animatedOpacity.setValue(0);
        toggleView(false);
      } else {
        let o = scrollOffset / 300;
        let op = 0;
        if (o < 0) {
          op = 1;
        } else {
          op = 1 - o;
        }
        animatedOpacity.setValue(op);
        toggleView(op < 0.05 ? false : true); 
      }
    };

    const toggleView = show => {
      //console.log('toggling overlay view',show);
      animatedTranslateY.setValue(show ? 0 : -9999);
    };

    const offsets = {
      mobile: {
        a: dimensions.width * 0.75,
        b: dimensions.width + dimensions.width * 0.75,
        c: dimensions.width * 2 + dimensions.width * 0.75,
      },
      smallTablet: {
        a: dimensions.width,
        b: dimensions.width,
        c: dimensions.width * 2,
      },
      tablet: {
        a: dimensions.width,
        b: dimensions.width,
        c: dimensions.width,
      },
    };

    return (
      <View
        onLayout={_onLayout}
        testID={notesnook.ids.default.root}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
        }}>
        {deviceMode && (
          <CustomTabs
            ref={tabBarRef}
            dimensions={dimensions}
            style={{
              zIndex: 1,
            }}
            initialIndex={
              deviceMode === 'smallTablet' || deviceMode === 'tablet' ? 0 : 1
            }
            toggleOverlay={toggleView}
            offsets={offsets[deviceMode]}
            items={[
              <View
                style={{
                  height: '100%',
                  width:
                    deviceMode === 'smallTablet'
                      ? dimensions.width * 0.35
                      : deviceMode === 'smallTablet'
                      ? dimensions.width * 0.15
                      : dimensions.width * 0.75,
                }}>
                <Menu />
              </View>,
              <View
                style={{
                  height: '100%',
                  width:
                    deviceMode === 'mobile'
                      ? dimensions.width
                      : deviceMode === 'tablet'
                      ? dimensions.width * 0.3
                      : dimensions.width * 0.65,
                }}>
                {deviceMode === 'mobile' && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      zIndex: 999,
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      opacity: animatedOpacity,
                      transform: [
                        {
                          translateY: animatedTranslateY,
                        },
                      ],
                    }}
                    ref={overlayRef}>
                   
                  </Animated.View>
                )}

                <NavigatorStack />
              </View>,
              <EditorWrapper dimensions={dimensions} />,
            ]}
            onScroll={onScroll}
            onChangeTab={onChangeTab}
          />
        )}
      </View>
    );
  },
  () => true,
);
