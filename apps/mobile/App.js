import http from 'notes-core/utils/http';
import React, {useEffect} from 'react';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {useAppEvents} from './src/utils/use-app-events';
import {RootView} from './src/navigation/RootView';
import AppLoader from './src/components/AppLoader';
import {useTracked} from './src/provider';
import {
  initialize,
  useMessageStore,
  useNoteStore,
  useSettingStore,
  useUserStore
} from './src/provider/stores';
import {DDS} from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from './src/services/EventManager';
import Notifications from './src/services/Notifications';
import SettingsService from './src/services/SettingsService';
import {Tracker} from './src/utils';
import {db} from './src/utils/DB';
import {eDispatchAction} from './src/utils/Events';
import {MMKV} from './src/utils/mmkv';

let databaseHasLoaded = false;

async function loadDefaultNotes() {
  try {
    const isCreated = await MMKV.getItem('defaultNoteCreated');
    if (isCreated) return;
    const notes = await http.get(
      'https://app.notesnook.com/notes/index_v14.json'
    );
    if (!notes) return;
    for (let note of notes) {
      const content = await http.get(note.mobileContent);
      await db.notes.add({
        title: note.title,
        headline: note.headline,
        localOnly: true,
        content: {type: 'tiny', data: content}
      });
    }
    await MMKV.setItem('defaultNoteCreated', 'yes');
    useNoteStore.getState().setNotes();
  } catch (e) {}
}

const loadDatabase = async () => {
  SplashScreen.hide();
  await db.init();
  Notifications.get();
  loadDefaultNotes();
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
    useMessageStore.getState().setAnnouncement();
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
          Tracker.record('50bf361f-dba0-41f1-9570-93906249a6d3');
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
