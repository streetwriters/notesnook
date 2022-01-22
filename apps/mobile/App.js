import React, { useEffect } from 'react';
import Orientation from 'react-native-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLoader from './src/components/AppLoader';
import { RootView } from './src/navigation/RootView';
import { useTracked } from './src/provider';
import {
  initialize, useSettingStore,
  useUserStore
} from './src/provider/stores';
import { DDS } from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from './src/services/EventManager';
import Notifications from './src/services/Notifications';
import SettingsService from './src/services/SettingsService';
import { Tracker } from './src/utils';
import { db } from './src/utils/database';
import { eDispatchAction } from './src/utils/Events';
import { MMKV } from './src/utils/mmkv';
import { useAppEvents } from './src/utils/use-app-events';
import RNBootSplash from "react-native-bootsplash";

let databaseHasLoaded = false;

const loadDatabase = async () => {
  RNBootSplash.hide({fade:true})
  await db.init();
  Notifications.get();
  await checkFirstLaunch();
};

async function checkFirstLaunch() {
  let requireIntro = await MMKV.getItem('introCompleted');
  useSettingStore.getState().setIntroCompleted(requireIntro ? true : false);
  if (!requireIntro) {
    await MMKV.setItem(
      'askForRating',
      JSON.stringify({
        timestamp: Date.now() + 86400000 * 2
      })
    );
    await MMKV.setItem(
      'askForBackup',
      JSON.stringify({
        timestamp: Date.now() + 86400000 * 3
      })
    );
  }
}

function checkOrientation() {
  Orientation.getOrientation((e, r) => {
    DDS.checkSmallTab(r);
    useSettingStore
      .getState()
      .setDimensions({width: DDS.width, height: DDS.height});
    useSettingStore
      .getState()
      .setDeviceMode(
        DDS.isLargeTablet()
          ? 'tablet'
          : DDS.isSmallTab
          ? 'smallTablet'
          : 'mobile'
      );
  });
}

const loadMainApp = () => {
  if (databaseHasLoaded) {
    SettingsService.setAppLoaded();
    eSendEvent('load_overlay');
    initialize();
  }
};
checkOrientation();
const App = () => {
  const [, dispatch] = useTracked();
  const setVerifyUser = useUserStore(state => state.setVerifyUser);
  const appEvents = useAppEvents();

  useEffect(() => {
    databaseHasLoaded = false;
    (async () => {
      try {
        await SettingsService.init();
        if (
          SettingsService.get().appLockMode &&
          SettingsService.get().appLockMode !== 'none'
        ) {
          setVerifyUser(true);
        }
        await loadDatabase();
        useUserStore.getState().setUser(await db.user.getUser());
        if (SettingsService.get().telemetry) {
          Tracker.record('3c6890ce-8410-49d5-8831-15fb2eb28a21');
        }
      } catch (e) {
      } finally {
        databaseHasLoaded = true;
        loadMainApp();
      }
    })();
  }, []);

  const _dispatch = data => {
    dispatch(data);
  };

  useEffect(() => {
    eSubscribeEvent(eDispatchAction, _dispatch);
    return () => {
      eUnSubscribeEvent(eDispatchAction, _dispatch);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <RootView />
      <AppLoader onLoad={loadMainApp} />
    </SafeAreaProvider>
  );
};

export default App;
