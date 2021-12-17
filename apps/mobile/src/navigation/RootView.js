import {
  activateKeepAwake,
  deactivateKeepAwake
} from '@sayem314/react-native-keep-awake';
import React, {useEffect, useRef} from 'react';
import {View} from 'react-native';
import Animated, {useValue} from 'react-native-reanimated';
import {notesnook} from '../../e2e/test.ids';
import ContextMenu from '../components/ContextMenu';
import CustomTabs from '../components/CustomTabs';
import {DialogManager} from '../components/DialogManager';
import {DummyText} from '../components/DummyText';
import {Menu} from '../components/Menu';
import {Toast} from '../components/Toast';
import {NavigatorStack} from './NavigatorStack';
import {useTracked} from '../provider';
import {useSettingStore} from '../provider/stores';
import {DDS} from '../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../services/EventManager';
import {editing, setWidthHeight} from '../utils';
import {updateStatusBarColor} from '../utils/Colors';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor
} from '../utils/Events';
import {editorRef, tabBarRef} from '../utils/Refs';
import {sleep} from '../utils/TimeUtils';
import {EditorWrapper} from '../views/Editor/EditorWrapper';
import {EditorWebView, getNote} from '../views/Editor/Functions';
import tiny from '../views/Editor/tiny/tiny';
let layoutTimer = null;

const onChangeTab = async obj => {
  if (obj.i === 1) {
    editing.movedAway = false;
    activateKeepAwake();
    eSendEvent('navigate');
    eSendEvent(eClearEditor, 'addHandler');
    if (
      !editing.isRestoringState &&
      (!editing.currentlyEditing || !getNote())
    ) {
      if (editing.overlay) {
        editing.overlay = false;
        return;
      }
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
      if (editing.currentlyEditing) {
        tiny.call(EditorWebView, tiny.blur);
      }
    }
    editing.isFocused = false;
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
  () => true
);

const NativeStack = React.memo(
  () => {
    const [state] = useTracked();
    const {colors} = state;

    const deviceMode = useSettingStore(state => state.deviceMode);
    const setFullscreen = useSettingStore(state => state.setFullscreen);
    const fullscreen = useSettingStore(state => state.fullscreen);
    const setDeviceModeState = useSettingStore(state => state.setDeviceMode);
    const dimensions = useSettingStore(state => state.dimensions);
    const setDimensions = useSettingStore(state => state.setDimensions);
    const animatedOpacity = useValue(0);
    const animatedTranslateY = useValue(-9999);
    const overlayRef = useRef();

    const showFullScreenEditor = () => {
      setFullscreen(true);
      editorRef.current?.setNativeProps({
        style: {
          width: dimensions.width,
          zIndex: 999,
          paddingHorizontal:
            deviceMode === 'smallTablet'
              ? dimensions.width * 0
              : dimensions.width * 0.15
        }
      });
    };

    const closeFullScreenEditor = () => {
      setFullscreen(false);
      editorRef.current?.setNativeProps({
        style: {
          width:
            deviceMode === 'smallTablet'
              ? dimensions.width -
                valueLimiter(dimensions.width * 0.4, 300, 450)
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
      toggleView(false);
      eSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
      eSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);

      return () => {
        eUnSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
        eUnSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);
      };
    }, [deviceMode, dimensions, colors]);

    const _onLayout = async event => {
      if (layoutTimer) {
        clearTimeout(layoutTimer);
        layoutTimer = null;
      }
      let size = event?.nativeEvent?.layout;
      updatedDimensions = size;
      if (!size || (size.width === dimensions.width && deviceMode !== null)) {
        DDS.setSize(size);
        setDeviceMode(deviceMode, size);
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

      setWidthHeight(size);
      DDS.setSize(size);

      if (DDS.isLargeTablet()) {
        setDeviceMode('tablet', size);
      } else if (DDS.isSmallTab) {
        setDeviceMode('smallTablet', size);
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
            paddingHorizontal:
              current === 'smallTablet' ? size.width * 0 : size.width * 0.15
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
          if (!editing.movedAway) {
            tabBarRef.current?.goToIndex(2);
          } else {
            console.log('index one', editing.movedAway);
            tabBarRef.current?.goToIndex(1);
          }
        }
      }, 1);
    }

    const onScroll = scrollOffset => {
      if (scrollOffset > offsets[deviceMode].a - 10) {
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
        toggleView(op < 0.1 ? false : true);
      }
    };

    const toggleView = show => {
      animatedTranslateY.setValue(show ? 0 : -9999);
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
        a: dimensions.width * 0.15,
        b: dimensions.width * 0.3,
        c: dimensions.width * 0.55
      }
    };

    const listItems = [
      <View
        style={{
          height: '100%',
          width: fullscreen ? 0 : widths[deviceMode].a
        }}>
        <Menu />
      </View>,
      <View
        style={{
          height: '100%',
          width: fullscreen ? 0 : widths[deviceMode].b
        }}>
        {deviceMode === 'mobile' ? (
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
                  translateY: animatedTranslateY
                }
              ]
            }}
            ref={overlayRef}
          />
        ) : null}

        <NavigatorStack />
      </View>,
      <EditorWrapper width={widths} dimensions={dimensions} />
    ];

    return (
      <View
        onLayout={_onLayout}
        testID={notesnook.ids.default.root}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg
        }}>
        {deviceMode ? (
          <CustomTabs
            ref={tabBarRef}
            dimensions={dimensions}
            widths={widths[deviceMode]}
            style={{
              zIndex: 1
            }}
            initialIndex={
              deviceMode === 'smallTablet' || deviceMode === 'tablet' ? 0 : 1
            }
            toggleOverlay={toggleView}
            offsets={offsets[deviceMode]}
            items={listItems}
            onScroll={onScroll}
            onChangeTab={onChangeTab}
          />
        ) : null}
      </View>
    );
  },
  () => true
);
