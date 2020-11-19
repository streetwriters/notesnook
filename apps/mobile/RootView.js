import React, {useEffect, useState} from 'react';
import {Dimensions, View} from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import ContextMenu from './src/components/ContextMenu';
import {DialogManager} from './src/components/DialogManager';
import {DummyText} from './src/components/DummyText';
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
const onChangeTab = async (obj) => {
  console.log('tab changed');
  if (obj.i === 1) {
    eSendEvent(eCloseSideMenu);
    if (getIntent()) return;
    if (!editing.currentlyEditing || !getNote()) {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
  } else {
    if (obj.from === 1) {
      post('blur');
      eSendEvent(eOpenSideMenu);
    }
  }
};

export const RootView = () => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <>
      <AppStack />
      <Toast />
      <ContextMenu />
      <DummyText />
      <DialogManager colors={colors} />
    </>
  );
};

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
      let size = event?.nativeEvent?.layout;
      if (!size) return;
      setDimensions({
        width: size.width,
        height: size.height,
      });
      setWidthHeight(size);
      DDS.setSize(size);
      DDS.checkSmallTab(size.width > size.height ? 'LANDSCAPE' : 'PORTRAIT');
      if (DDS.isLargeTablet()) {
        setMode('tablet');
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
        dispatch({type: Actions.FULLSCREEN, state: false});
        editorRef.current?.setNativeProps({
          style: {
            position: 'relative',
            width: size.width,
            zIndex: null,
            paddingHorizontal: 0,
          },
        });

        if (editing.currentlyEditing) {
          tabBarRef.current?.goToPage(1);
        }
      } else {
        setMode('mobile');
        dispatch({type: Actions.FULLSCREEN, state: false});
        editorRef.current?.setNativeProps({
          style: {
            position: 'relative',
            width: size.width,
            zIndex: null,
            paddingHorizontal: 0,
          },
        });
        if (editing.currentlyEditing) {
          tabBarRef.current?.goToPage(1);
        }
      }
    };

    return (
      <ScrollableTabView
        ref={tabBarRef}
        prerenderingSiblingsNumber={Infinity}
        onChangeTab={onChangeTab}
        renderTabBar={() => <></>}>
        {!mode && (
          <View
            style={{
              width: '100%',
              height: '100%',
              flexDirection: 'row',
              backgroundColor: colors.bg,
            }}
          />
        )}
        {mode && mode !== 'tablet' && (
          <NavigationStack component={NavigatorStack} />
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
              }}>
              <NavigationStack component={NavigatorStack} />
            </View>
          )}

          <EditorWrapper dimensions={dimensions} passRef={editorRef} />
        </View>
      </ScrollableTabView>
    );
  },
  () => true,
);
