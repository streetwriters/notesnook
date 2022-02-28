import React, { useEffect } from 'react';
import Orientation from 'react-native-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Launcher from './src/components/launcher';
import { RootView } from './src/navigation/RootView';
import { useTracked } from './src/provider';
import { initialize, useSettingStore, useUserStore } from './src/provider/stores';
import { DDS } from './src/services/DeviceDetection';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from './src/services/EventManager';
import Notifications from './src/services/Notifications';
import SettingsService from './src/services/SettingsService';
import { TipManager } from './src/services/tip-manager';
import { db } from './src/utils/database';
import { eDispatchAction } from './src/utils/events';
import { useAppEvents } from './src/utils/hooks/use-app-events';
import { MMKV } from './src/utils/database/mmkv';

let databaseHasLoaded = false;

const loadDatabase = async () => {
  let requireIntro = await MMKV.getItem('introCompleted');
  useSettingStore.getState().setIntroCompleted(requireIntro ? true : false);
  await db.init();
  Notifications.get();
  await checkFirstLaunch();
};

async function checkFirstLaunch() {
  let requireIntro = useSettingStore.getState().isIntroCompleted;
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
    useSettingStore.getState().setDimensions({ width: DDS.width, height: DDS.height });
    useSettingStore
      .getState()
      .setDeviceMode(DDS.isLargeTablet() ? 'tablet' : DDS.isSmallTab ? 'smallTablet' : 'mobile');
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
        if (SettingsService.get().appLockMode && SettingsService.get().appLockMode !== 'none') {
          setVerifyUser(true);
        }
        await TipManager.init();
        await loadDatabase();
        useUserStore.getState().setUser(await db.user.getUser());
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
      <Launcher onLoad={loadMainApp} />
    </SafeAreaProvider>
  );
};

export default App;
