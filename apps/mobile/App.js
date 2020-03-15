import React, {useEffect, useState} from 'react';
import {Platform, StatusBar, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {getColorScheme, scale, updateSize} from './src/common/common';
import {DialogManager} from './src/components/DialogManager';
import {Menu} from './src/components/Menu';
import {ModalMenu} from './src/components/ModalMenu';
import SideMenu from './src/components/SideMenu';
import {Toast} from './src/components/Toast';
import {useTracked} from './src/provider';
import {ACTIONS} from './src/provider/actions';
import Orientation from 'react-native-orientation';
import {eSubscribeEvent, eUnSubscribeEvent} from './src/services/eventManager';
import {
  eCloseFullscreenEditor,
  eDispatchAction,
  eOpenFullscreenEditor,
} from './src/services/events';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {w, DDS, db} from './src/utils/utils';
import Editor from './src/views/Editor';
import Animated from 'react-native-reanimated';
import MMKV from 'react-native-mmkv-storage';
import {defaultState} from './src/provider/defaultState';
import {EditorPosition} from './src/utils/animations';
import {sideMenuRef} from './src/utils/refs';
import {Loading} from './Loading';

let editorRef;
let outColors;

const App = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [init, setInit] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const showFullScreenEditor = () => {
    setFullscreen(true);

    editorRef.setNativeProps({
      style: {
        position: 'absolute',
        width: '100%',
        zIndex: 999,
        paddingHorizontal: 100,
        backgroundColor: outColors.bg,
      },
    });
  };

  useEffect(() => {
    outColors = colors;
  }, [colors]);

  const closeFullScreenEditor = () => {
    setFullscreen(false);
    editorRef.setNativeProps({
      style: {
        position: 'relative',
        width: '68%',
        zIndex: null,
        paddingHorizontal: 0,
        backgroundColor: 'transparent',
      },
    });
  };

  const _onOrientationChange = o => {
    // Currently orientation is locked on tablet.
    /* DDS.checkOrientation();
    setTimeout(() => {
     
      forceUpdate();
    }, 1000); */
  };
  useEffect(() => {
    Orientation.addOrientationListener(_onOrientationChange);
    eSubscribeEvent(eDispatchAction, type => {
      dispatch(type);
    });
    return () => {
      eUnSubscribeEvent(eDispatchAction, type => {
        dispatch(type);
      });
      Orientation.removeOrientationListener(_onOrientationChange);
    };
  }, []);

  useEffect(() => {
    DDS.isTab ? Orientation.lockToLandscape() : Orientation.lockToPortrait();

    eSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
    eSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);

    return () => {
      eUnSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
      eUnSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    }
  }, []);

  useEffect(() => {
    updateAppTheme().then(() => {
      db.init().then(async () => {
        let user = await db.user.get();
        dispatch({type: ACTIONS.USER, user: user});

        setInit(true);
      });
    });
  }, []);

  async function updateAppTheme(colors = colors) {
    let newColors = await getColorScheme(colors);
    let s = await MMKV.getString('settings');
    if (typeof s !== 'string') {
      s = defaultState.settings;

      s = JSON.stringify(s);
      await MMKV.setString('settings', s);
      dispatch({type: ACTIONS.SETTINGS, s});
    } else {
      s = JSON.parse(s);
      scale.fontScale = s.fontScale;

      updateSize();

      dispatch({type: ACTIONS.SETTINGS, settings: {...s}});
    }
    dispatch({type: ACTIONS.THEME, colors: newColors});
  }

  if (!init) {
    return <></>;
  }
  return (
    <>
      <Animatable.View
        transition="backgroundColor"
        duration={300}
        style={{
          width: '100%',
          height: '100%',
          flexDirection: 'row',
          backgroundColor: colors.bg,
        }}>
        <Loading />
        {DDS.isTab ? (
          <>
            <ModalMenu colors={colors} />
            <Animatable.View
              animation="fadeIn"
              useNativeDriver={true}
              duration={500}
              delay={450}
              style={{
                width: '4%',
              }}>
              <Menu
                hide={false}
                noTextMode={true}
                colors={colors}
                close={() => {
                  //setSidebar('0%');
                }}
              />
            </Animatable.View>

            <Animatable.View
              transition="backgroundColor"
              duration={300}
              style={{
                width: '28%',
                height: '100%',
                borderRightColor: colors.nav,
                borderRightWidth: 2,
              }}>
              <AppContainer
                style={{
                  width: '100%',
                  height: '100%',
                }}
                ref={navigatorRef => {
                  NavigationService.setTopLevelNavigator(navigatorRef);
                }}
              />
            </Animatable.View>

            <View
              ref={ref => (editorRef = ref)}
              style={{
                width: '68%',
                height: '100%',
                backgroundColor: 'transparent',
              }}>
              <Editor noMenu={fullscreen ? false : true} />
            </View>
          </>
        ) : (
          <SideMenu
            ref={sideMenuRef}
            bounceBackOnOverdraw={false}
            contentContainerStyle={{
              opacity: 0,
              backgroundColor: colors.bg,
            }}
            menu={
              <Menu
                hide={false}
                colors={colors}
                close={() =>
                  sideMenuRef.current?.openMenu(!sideMenuRef.current?.isOpen)
                }
              />
            }
            openMenuOffset={w / 1.5}>
            <AppContainer
              style={{
                width: DDS.isTab ? '70%' : '100%',
                height: '100%',
                backgroundColor: colors.bg,
              }}
              ref={navigatorRef => {
                NavigationService.setTopLevelNavigator(navigatorRef);
              }}
            />
          </SideMenu>
        )}

        <Animated.View
          ref={ref => (editorRef = ref)}
          onResponderTerminationRequest={true}
          onStartShouldSetResponderCapture={false}
          onStartShouldSetResponder={false}
          onMoveShouldSetResponder={false}
          onMoveShouldSetResponderCapture={false}
          style={{
            width: '100%',
            height: '100%',
            alignSelf: 'flex-end',
            position: 'absolute',
            backgroundColor: colors.bg,
            elevation: 10,

            transform: [
              {
                translateX: EditorPosition,
              },
            ],
          }}>
          <Editor noMenu={false} />
        </Animated.View>

        <Toast />

        <DialogManager colors={colors} />
      </Animatable.View>
    </>
  );
};

export default App;
