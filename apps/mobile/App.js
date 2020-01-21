import React, {useState, useEffect} from 'react';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {
  StatusBar,
  View,
  Platform,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {w, SideMenuEvent} from './src/utils/utils';
import {Toast} from './src/components/Toast';
import {Menu} from './src/components/Menu';
import SideMenu from './src/components/SideMenu';
import Storage from 'notes-core/api/database';
import StorageInterface from './src/utils/storage';
import {useTracked, ACTIONS} from './src/provider';
import {DeviceDetectionService} from './src/utils/deviceDetection';
import Animated, {Easing} from 'react-native-reanimated';
import {
  DialogManager,
  _recieveEvent,
  _unSubscribeEvent,
} from './src/components/DialogManager';
import {getColorScheme} from './src/common/common';
import Editor from './src/views/Editor';
import {ModalMenu} from './src/components/ModalMenu';

export const DDS = new DeviceDetectionService();
export const db = new Storage(StorageInterface);
const {
  Clock,
  Value,
  set,
  cond,
  startClock,
  clockRunning,
  timing,
  debug,
  stopClock,
  block,
} = Animated;

let sideMenuRef;
let editorRef;
const App = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [width, setWidth] = useState(w);
  // Local State

  const [init, setInit] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  let animatedSidebarWidth = new Value(w * 0.04);
  let animatedAppContainerWidth = new Value(w * 0.96);

  let isShown = true;
  // Effects

  const openSidebar = () => {
    DDS.isTab ? sidebarAnimation() : sideMenuRef.openMenu(true);
  };
  const closeSidebar = () => {
    DDS.isTab ? sidebarAnimation() : sideMenuRef.openMenu(false);
  };

  const disableGestures = () => {
    DDS.isTab ? null : sideMenuRef.setGestureEnabled(false);
  };

  const enableGestures = () => {
    DDS.isTab ? null : sideMenuRef.setGestureEnabled(true);
  };

  useEffect(() => {
    _recieveEvent('openSidebar', openSidebar);
    _recieveEvent('closeSidebar', closeSidebar);

    _recieveEvent('disableGesture', disableGestures);
    _recieveEvent('enableGesture', enableGestures);

    _recieveEvent('showFullScreenEditor', showFullScreenEditor);
    _recieveEvent('closeFullScreenEditor', closeFullScreenEditor);

    return () => {
      _unSubscribeEvent('showFullScreenEditor', showFullScreenEditor);
      _unSubscribeEvent('closeFullScreenEditor', closeFullScreenEditor);

      _unSubscribeEvent('openSidebar', openSidebar);
      _unSubscribeEvent('closeSidebar', closeSidebar);

      _unSubscribeEvent('disableGesture', disableGestures);
      _unSubscribeEvent('enableGesture', enableGestures);
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
    _recieveEvent('updateEvent', type => {
      dispatch(type);
    });
    return () => {
      _unSubscribeEvent('updateEvent', type => {
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

  async function updateAppTheme(colors = state.colors) {
    let newColors = await getColorScheme(colors);
    dispatch({type: ACTIONS.THEME, colors: newColors});
  }

  const sidebarAnimation = () => {
    let sValue;
    let aValue;
    if (isShown) {
      sValue = w * 0.04;
      aValue = w * 0.96;
      isShown = false;
    } else {
      sValue = w * 0.25;
      aValue = w * 0.75;
      isShown = true;
    }

    let _anim = timing(animatedSidebarWidth, {
      duration: 200,
      toValue: sValue,
      easing: Easing.in(Easing.ease),
    });

    let _animS = timing(animatedAppContainerWidth, {
      duration: 0,
      toValue: aValue,
      easing: Easing.inOut(Easing.ease),
    });

    if (isShown) {
      _animS.start();
      _anim.start();
    } else {
      _anim.start();
      _animS.start();
    }
  };

  // Render

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
        }}
        onLayout={e => {
          setWidth(Dimensions.get('window').width);
        }}>
        {DDS.isTab ? (
          <>
            <ModalMenu colors={colors} />

            <View
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
            </View>

            <View
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
            </View>

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
    </>
  );
};

export default App;
