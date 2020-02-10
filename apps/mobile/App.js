import Storage from 'notes-core/api/index';
import React, {useEffect, useState} from 'react';
import {Platform, StatusBar, View, Text} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {getColorScheme, WEIGHT, SIZE} from './src/common/common';
import {DialogManager} from './src/components/DialogManager';
import {Menu} from './src/components/Menu';
import {ModalMenu} from './src/components/ModalMenu';
import SideMenu from './src/components/SideMenu';
import {Toast} from './src/components/Toast';
import {useTracked} from './src/provider';
import {ACTIONS} from './src/provider/actions';
import {eSubscribeEvent, eUnSubscribeEvent} from './src/services/eventManager';
import {
  eCloseFullscreenEditor,
  eCloseSideMenu,
  eDisableGestures,
  eDispatchAction,
  eEnableGestures,
  eOpenFullscreenEditor,
  eOpenSideMenu,
} from './src/services/events';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {DeviceDetectionService} from './src/utils/deviceDetection';
import StorageInterface from './src/utils/storage';
import {w} from './src/utils/utils';
import Editor from './src/views/Editor';
import Animated, {Easing} from 'react-native-reanimated';

export const DDS = new DeviceDetectionService();
export const db = new Storage(StorageInterface);

let sideMenuRef;
let editorRef;
let outColors;

const {color, Value, timing, interpolate} = Animated;

const App = () => {
  const [state, dispatch] = useTracked();
  const {colors, loading} = state;

  const [init, setInit] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const openSidebar = () => {
    DDS.isTab ? null : sideMenuRef.openMenu(true);
  };
  const closeSidebar = () => {
    DDS.isTab ? null : sideMenuRef.openMenu(false);
  };

  const disableGestures = () => {
    DDS.isTab ? null : sideMenuRef.setGestureEnabled(false);
  };

  const enableGestures = () => {
    DDS.isTab ? null : sideMenuRef.setGestureEnabled(true);
  };

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

  useEffect(() => {
    eSubscribeEvent(eDispatchAction, type => {
      dispatch(type);
    });
    return () => {
      eUnSubscribeEvent(eDispatchAction, type => {
        dispatch(type);
      });
    };
  }, []);

  useEffect(() => {
    eSubscribeEvent(eOpenSideMenu, openSidebar);
    eSubscribeEvent(eCloseSideMenu, closeSidebar);

    eSubscribeEvent(eDisableGestures, disableGestures);
    eSubscribeEvent(eEnableGestures, enableGestures);

    eSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
    eSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);

    return () => {
      eUnSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
      eUnSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);

      eUnSubscribeEvent(eOpenSideMenu, openSidebar);
      eUnSubscribeEvent(eCloseSideMenu, closeSidebar);

      eUnSubscribeEvent(eDisableGestures, disableGestures);
      eUnSubscribeEvent(eEnableGestures, enableGestures);
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
      db.init().then(() => {
        setInit(true);
      });
    });
  }, []);

  async function updateAppTheme(colors = colors) {
    let newColors = await getColorScheme(colors);
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
        <Animatable.View
          transition={['translateX']}
          useNativeDriver={true}
          duration={1000}
          delay={2500}
          style={{
            width: '50%',
            left: 0,
            height: '100%',
            position: 'absolute',
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'flex-end',
            zIndex: 999,
            transform: [
              {
                translateX: loading ? 0 : -w * 2,
              },
            ],
          }}>
          <Animatable.Text
            animation="fadeIn"
            duration={300}
            delay={150}
            style={{
              color: 'white',
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.xxl,
            }}>
            notes
          </Animatable.Text>
          <Animatable.Text
            animation="fadeIn"
            duration={300}
            delay={600}
            style={{
              color: 'white',
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.md,
              marginTop: 15,
            }}>
            A safe plac
          </Animatable.Text>
        </Animatable.View>
        <Animatable.View
          transition={['translateX']}
          useNativeDriver={true}
          duration={1000}
          delay={2500}
          style={{
            width: '50%',
            right: 0,
            height: '100%',
            position: 'absolute',
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'flex-start',
            zIndex: 999,
            transform: [
              {
                translateX: loading ? 0 : w * 2,
              },
            ],
          }}>
          <Animatable.Text
            animation="fadeIn"
            duration={300}
            delay={150}
            style={{
              color: 'white',
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.xxl,
            }}>
            nook
          </Animatable.Text>
          <Animatable.Text
            animation="fadeIn"
            duration={300}
            delay={600}
            style={{
              color: 'white',
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.md,
              marginTop: 15,
            }}>
            e to write
          </Animatable.Text>
        </Animatable.View>

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
            ref={ref => (sideMenuRef = ref)}
            bounceBackOnOverdraw={false}
            contentContainerStyle={{
              opacity: 0,
              backgroundColor: colors.bg,
            }}
            menu={
              <Menu
                hide={false}
                colors={colors}
                close={() => sideMenuRef.openMenu(!sideMenuRef.isOpen)}
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
        <Toast />
        <DialogManager colors={colors} />
      </Animatable.View>
    </>
  );
};

export default App;
