import React, {useEffect, useState} from 'react';
import {Dimensions, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import ContextMenu from './src/components/ContextMenu';
import {DialogManager} from './src/components/DialogManager';
import {DummyText} from './src/components/DummyText';
import {Menu} from './src/components/Menu';
import {Toast} from './src/components/Toast';
import {NavigationStack} from './src/navigation/Drawer';
import {NavigatorStack} from './src/navigation/NavigatorStack';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import {DDS} from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/EventManager';
import {editing, setWidthHeight} from './src/utils';
import {
  eCloseFullscreenEditor,
  eCloseSideMenu,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eOpenSideMenu,
} from './src/utils/Events';
import {editorRef, tabBarRef} from './src/utils/Refs';
import {EditorWrapper} from './src/views/Editor/EditorWrapper';
import {getIntent, getNote, post} from './src/views/Editor/Functions';

let {width, height} = Dimensions.get('window');
let movedAway = true;
let layoutTimer = null;

const onChangeTab = async (obj) => {
  if (obj.i === 1) {
    eSendEvent(eCloseSideMenu);
    if (getIntent()) return;
    movedAway = false;
    if (!editing.currentlyEditing || !getNote()) {
      eSendEvent(eOnLoadNote, {type: 'new'});
      editing.currentlyEditing = true;
    }
  } else {
    if (obj.from === 1) {
      movedAway = true;
      editing.currentlyEditing = false;
      post('blur');
    }
    eSendEvent(eOpenSideMenu);
  }
};

export const RootView = () => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <>
      <NavigationStack component={AppStack} />
      <Toast />
      <ContextMenu />
      <DummyText />
      <DialogManager colors={colors} />
    </>
  );
};

const getDefaultDrawerWidth = ({height, width}) => {
  const smallerAxisSize = Math.min(height, width);
  const isLandscape = width > height;
  const isTablet = smallerAxisSize >= 600;
  const appBarHeight = Platform.OS === 'ios' ? (isLandscape ? 32 : 44) : 56;
  const maxWidth = isTablet ? 320 : 280;

  return Math.min(smallerAxisSize - appBarHeight, maxWidth);
};

const GestureHandlerWrapper = GestureHandlerRootView ?? View;

const AppStack = React.memo(
  () => {
    const [state, dispatch] = useTracked();
    const {colors} = state;
    const [mode, setMode] = useState(null);
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
      if (!size || (size.width === dimensions.width && mode !== null)) {
        return;
      }
      layoutTimer = setTimeout(async () => {
        setDimensions({
          width: size.width,
          height: size.height,
        });
        setWidthHeight(size);
        DDS.setSize(size);
        console.log(size.width, size.height);
        DDS.checkSmallTab(size.width > size.height ? 'LANDSCAPE' : 'PORTRAIT');

        if (DDS.isLargeTablet()) {
          setMode('tablet');
          dispatch({type: Actions.DEVICE_MODE, state: 'tablet'});
          dispatch({type: Actions.FULLSCREEN, state: false});
          editorRef.current?.setNativeProps({
            style: {
              position: 'relative',
              width: size.width * 0.55,
              zIndex: null,
              paddingHorizontal: 0,
            },
          });
        } else if (DDS.isSmallTab) {
          setMode('smallTablet');
          dispatch({type: Actions.DEVICE_MODE, state: 'smallTablet'});
          dispatch({type: Actions.FULLSCREEN, state: false});

          editorRef.current?.setNativeProps({
            style: {
              position: 'relative',
              width: size.width,
              zIndex: null,
              paddingHorizontal: 0,
            },
          });

          if (editing.currentlyEditing && !movedAway) {
            tabBarRef.current?.goToPage(1);
          }
        } else {
          eSendEvent(eOpenSideMenu);
          setMode('mobile');
          dispatch({type: Actions.DEVICE_MODE, state: 'mobile'});
          dispatch({type: Actions.FULLSCREEN, state: false});
          editorRef.current?.setNativeProps({
            style: {
              position: 'relative',
              width: size.width,
              zIndex: null,
              paddingHorizontal: 0,
            },
          });
          if (editing.currentlyEditing && !movedAway) {
            tabBarRef.current?.goToPage(1);
          }
        }

        eSendEvent(eOpenSideMenu);
      }, 500);
    };

    return (
      <ScrollableTabView
        ref={tabBarRef}
        style={{
          zIndex: 1,
        }}
        initialPage={0}
        prerenderingSiblingsNumber={Infinity}
        onChangeTab={onChangeTab}
        renderTabBar={() => <></>}>
        {mode && mode !== 'tablet' && (
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
            {mode && mode === 'smallTablet' && (
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
                  mode === 'mobile'
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
          }}
          onLayout={_onLayout}>
          {mode && mode === 'tablet' && (
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
          {mode && <EditorWrapper dimensions={dimensions} />}
        </View>
      </ScrollableTabView>
    );
  },
  () => true,
);
