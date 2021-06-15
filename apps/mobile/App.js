import http from 'notes-core/utils/http';
import React, { useEffect } from 'react';
import Orientation from 'react-native-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import { AppRootEvents } from './AppRootEvents';
import { RootView } from './initializer.root';
import AppLoader from './src/components/AppLoader';
import { useTracked } from './src/provider';
import {
  initialize,
  useMessageStore,
  useNoteStore,
  useSettingStore,
  useUserStore
} from './src/provider/stores';
import { DDS } from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from './src/services/EventManager';
import SettingsService from './src/services/SettingsService';
import { db } from './src/utils/DB';
import { eDispatchAction } from './src/utils/Events';
import { MMKV } from './src/utils/mmkv';
import EditorRoot from './src/views/Editor/EditorRoot';

let initStatus = false;
const App = () => {
  const [, dispatch] = useTracked();
  const setDeviceMode = useSettingStore(state => state.setDeviceMode);
  const setVerifyUser = useUserStore(state => state.setVerifyUser);

  useEffect(() => {
    useMessageStore.getState().setAnnouncement();
    (async () => {
      try {
        Orientation.getOrientation((e, r) => {
          DDS.checkSmallTab(r);
          setDeviceMode(
            DDS.isLargeTablet()
              ? 'tablet'
              : DDS.isSmallTab
              ? 'smallTablet'
              : 'mobile',
          );
        });

        let func = async () => {
          SplashScreen.hide();
          await db.init();
          let requireIntro = await MMKV.getItem('introCompleted');
          loadDefaultNotes();
          if (!requireIntro) {
            await MMKV.setItem(
              'askForRating',
              JSON.stringify({
                timestamp: Date.now() + 86400000 * 2,
              }),
            );
          }
        };

        await SettingsService.init();
        if (
          SettingsService.get().appLockMode &&
          SettingsService.get().appLockMode !== 'none'
        ) {
          setVerifyUser(true);
        }
        await func();
      } catch (e) {
      } finally {
        initStatus = true;
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

  const loadMainApp = () => {
    if (initStatus) {
      SettingsService.setAppLoaded();
      eSendEvent('load_overlay');
      initialize();
    }
  };

  async function loadDefaultNotes() {
    try {
      console.log('creating note');
      const isCreated = await MMKV.getItem('defaultNoteCreated');
      if (isCreated) return;
      const notes = await http.get(
        'https://app.notesnook.com/notes/index.json',
      );
      if (!notes) return;
      for (let note of notes) {
        console.log('getting content');
        const content = await http.get(note.mobileContent);
        await db.notes.add({
          title: note.title,
          headline: note.headline,
          localOnly: true,
          content: {type: 'tiny', data: content},
        });
      }
      console.log('default note created');
      await MMKV.setItem('defaultNoteCreated', 'yes');
      useNoteStore.getState().setNotes();
    } catch (e) {
      console.log(e, 'loading note on welcome');
    }
  }

  return (
    <SafeAreaProvider>
      <RootView />
      <EditorRoot />
      <AppRootEvents />
      <AppLoader onLoad={loadMainApp} />
    </SafeAreaProvider>
  );
};

export default App;
