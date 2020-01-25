import Storage from 'notes-core/api/database';
import React, {useEffect, useState} from 'react';
import {Platform, StatusBar, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {getColorScheme} from './src/common/common';
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

export const DDS = new DeviceDetectionService();
export const db = new Storage(StorageInterface);

let sideMenuRef;
let editorRef;
const App = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  // Local State

  const [init, setInit] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Effects

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

  const showFullScreenEditor = () => {
    setFullscreen(true);
    editorRef.setNativeProps({
      style: {
        position: 'absolute',
        width: '100%',
        zIndex: 999,
        paddingHorizontal: 100,
        backgroundColor: colors.bg,
      },
    });
  };

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
    //setColors(newColors);
  }

  // Render

  if (!init) {
    return <></>;
  }
  return (
    <>
      <Animatable.View animation="fadeIn" useNativeDriver={true} duration={600}>
        <Animatable.View
          transition="backgroundColor"
          duration={300}
          style={{
            width: '100%',
            height: '100%',
            flexDirection: 'row',
            backgroundColor: colors.bg,
          }}>
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
              openMenuOffset={w / 1.3}>
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
      </Animatable.View>
    </>
  );
};

export default App;
