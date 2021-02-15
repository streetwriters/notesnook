import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Orientation from 'react-native-orientation';
import Animated, {Easing} from 'react-native-reanimated';
import AnimatedProgress from 'react-native-reanimated-progress-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {AppRootEvents} from './AppRootEvents';
import {RootView} from './initializer.root';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import {DDS} from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/EventManager';
import SettingsService from './src/services/SettingsService';
import {changeAppScale} from './src/utils/Animations';
import {db} from './src/utils/DB';
import {eDispatchAction, eOpenSideMenu} from './src/utils/Events';
import {sleep} from './src/utils/TimeUtils';
import EditorRoot from './src/views/Editor/EditorRoot';

let initStatus = false;
const App = () => {
  const [, dispatch] = useTracked();

  useEffect(() => {
    (async () => {
      try {
        scaleV.setValue(0.95);
        opacityV.setValue(1);
        Orientation.getOrientation((e, r) => {
          DDS.checkSmallTab(r);
          dispatch({
            type: Actions.DEVICE_MODE,
            state: DDS.isLargeTablet()
              ? 'tablet'
              : DDS.isSmallTab
              ? 'smallTablet'
              : 'mobile',
          });
          SplashScreen.hide();
        });
        await SettingsService.init();
        await db.init();
      } catch (e) {
      } finally {
        initStatus = true;
        loadMainApp();
      }
    })();
  }, []);

  const _dispatch = (data) => {
    dispatch(data);
  };

  useEffect(() => {
    eSubscribeEvent(eDispatchAction, _dispatch);
    return () => {
      eUnSubscribeEvent(eDispatchAction, _dispatch);
    };
  }, []);

  const loadMainApp = (origin) => {
    if (initStatus) {
      eSendEvent('load_overlay', origin);
      dispatch({type: Actions.ALL});
    }
  };

  return (
    <SafeAreaProvider>
      <RootView />
      <EditorRoot />
      <AppRootEvents />
      <Overlay onLoad={loadMainApp} />
    </SafeAreaProvider>
  );
};

export default App;

const scaleV = new Animated.Value(0.95);
const opacityV = new Animated.Value(1);

const Overlay = ({onLoad}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(4);
  const [opacity, setOpacity] = useState(true);

  const load = async () => {
    db.notes.init().then(() => {
      init = true;
      if (SettingsService.get().homepage === 'Notes') {
        dispatch({type: Actions.NOTES});
      } else {
        dispatch({type: Actions.FAVORITES});
      }
      // if (!animation) {
      dispatch({type: Actions.LOADING, loading: false});
      // }
    });
    eSendEvent(eOpenSideMenu);
    SettingsService.setAppLoaded();
    setOpacity(false);
    await sleep(150);
    Animated.timing(opacityV, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.ease),
    }).start();
    Animated.timing(scaleV, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.ease),
    }).start();
    changeAppScale(1, 250);
    await sleep(150);
    setLoading(false);
    animation = false;
    //if (init) {
    //  dispatch({type: Actions.LOADING, loading: false});
    //}
  };

  useEffect(() => {
    eSubscribeEvent('load_overlay', load);
    onLoad();
    return () => {
      eUnSubscribeEvent('load_overlay', load);
    };
  }, []);

  return (
    loading && (
      <Animated.View
        style={{
          backgroundColor: opacity ? colors.bg : 'rgba(0,0,0,0)',
          width: '100%',
          height: '100%',
          position: 'absolute',
          zIndex: 999,
          borderRadius: 10,
        }}>
        <Animated.View
          onTouchStart={() => {
            setLoading(false);
          }}
          style={{
            backgroundColor: colors.bg,
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            opacity: opacityV,
          }}>
          <View
            style={{
              height: 10,
              flexDirection: 'row',
              width: 100,
            }}>
            <AnimatedProgress
              fill={colors.accent}
              current={progress}
              total={4}
            />
          </View>
        </Animated.View>
      </Animated.View>
    )
  );
};
