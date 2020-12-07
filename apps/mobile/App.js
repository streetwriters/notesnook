import * as NetInfo from '@react-native-community/netinfo';
import {CHECK_IDS, EV} from 'notes-core/common';
import React, {useEffect, useState} from 'react';
import {
  Appearance,
  AppState,
  Linking,
  NativeModules,
  Platform,
  StatusBar,
} from 'react-native';
import {enabled} from 'react-native-privacy-snapshot';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from './src/services/EventManager';
import {setLoginMessage} from './src/services/Message';
import {editing} from './src/utils';
import {ACCENT, COLOR_SCHEME} from './src/utils/Colors';
import {db} from './src/utils/DB';
import {
  eDispatchAction,
  eOnLoadNote,
  eOpenPremiumDialog,
  eShowGetPremium,
  eStartSyncer,
} from './src/utils/Events';
import {MMKV} from './src/utils/mmkv';
import {sleep} from './src/utils/TimeUtils';
import {getNote} from './src/views/Editor/Functions';
import IntentService from './src/services/IntentService';
import {tabBarRef} from './src/utils/Refs';
import Navigation from './src/services/Navigation';
import SplashScreen from 'react-native-splash-screen';
import PremiumService from './src/services/PremiumService';
const {ReceiveSharingIntent} = NativeModules;

let AppRootView = require('./initializer.root').RootView;
let SettingsService = null;
let Sentry = null;
let appInit = false;
let intentInit = false;

const onAppStateChanged = async (state) => {
  console.log('app state', state);
  if (state === 'active') {
    StatusBar.setBarStyle(
      COLOR_SCHEME.night ? 'light-content' : 'dark-content',
      true,
    );
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent', true);
      StatusBar.setTranslucent(true, true);
    }
    if (SettingsService.get().privacyScreen) {
      enabled(false);
    }
    console.log('clearing state', await MMKV.getItem('appState'));
    if (appInit) {
      await MMKV.removeItem('appState');
    }
    try {
      if (intentInit) {
        if (Platform.OS === 'android') {
          _data = await ReceiveSharingIntent.getFileNames();
          if (_data) {
            IntentService.setIntent(_data);
            IntentService.check((event) => {
              console.log(event);
              if (event) {
                eSendEvent(eOnLoadNote, event);
                tabBarRef.current?.goToPage(1);
                Navigation.closeDrawer();
              } else {
                eSendEvent('nointent');
                SplashScreen.hide();
              }
            });
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  } else {
    if (editing.currentlyEditing && appInit) {
      let state = JSON.stringify({
        editing: editing.currentlyEditing,
        note: getNote(),
      });
      console.log('putting items in state', state);
      await MMKV.setItem('appState', state);
    }

    if (SettingsService.get().privacyScreen) {
      enabled(true);
    }
  }
};

const onNetworkStateChanged = (netInfo) => {
  let message = 'Internet connection restored';
  let type = 'success';
  if (!netInfo.isConnected || !netInfo.isInternetReachable) {
    message = 'No internet connection';
    type = 'error';
  }
  db.user?.get().then((user) => {
    if (user) {
      ToastEvent.show(message, type);
    }
  });
};

const App = () => {
  const [, dispatch] = useTracked(),
    [init, setInit] = useState(true),
    [intent, setIntent] = useState(false);

  const syncChanges = async () => {
    dispatch({type: Actions.ALL});
  };
  const startSyncer = async () => {
    try {
      let user = await db.user.get();
      if (user) {
        EV.subscribe('db:refresh', syncChanges);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const onSystemThemeChanged = async () => {
    await SettingsService.setTheme();
  };

  const _handleIntent = async (res) => {

    if (intentInit) {
      let url = res ? res.url : '';

      try {
        if (url.startsWith('ShareMedia://dataUrl')) {
        console.log(url);
          _data = await ReceiveSharingIntent.getFileNames(url);
          _data = IntentService.iosSortedData(_data)
          console.log("DONE","DATA GETTING");
        }
        if (_data) {
          IntentService.setIntent(_data);
          IntentService.check((event) => {
            eSendEvent(eOnLoadNote, event);
            tabBarRef.current?.goToPage(1);
            Navigation.closeDrawer();
          });
        }
      } catch (e) {
        console.log(e,"ERROR HERE")
      }
    }
  };

  const handlePremiumAccess = async (type) => {
    let status = PremiumService.get();
    let message = null;
    if (!status) {
      switch (type) {
        case CHECK_IDS.noteColor:
          message = {
            context: 'sheet',
            title: 'Get Notesnook Pro',
            desc: 'To assign colors to a note get Notesnook Pro today.',
          };
          break;
        case CHECK_IDS.noteExport:
          message = {
            context: 'export',
            title: 'Export in PDF, MD & HTML',
            desc:
              'Get Notesnook Pro to export your notes in PDF, Markdown and HTML formats!',
          };
          break;
        case CHECK_IDS.noteTag:
          message = {
            context: 'sheet',
            title: 'Get Notesnook Pro',
            desc: 'To create more tags for your notes become a Pro user today.',
          };
          break;
        case CHECK_IDS.notebookAdd:
          eSendEvent(eOpenPremiumDialog);
          break;
        case CHECK_IDS.vaultAdd:
          message = {
            context: 'sheet',
            title: 'Add Notes to Vault',
            desc:
              'With Notesnook Pro you can add notes to your vault and do so much more! Get it now.',
          };
          break;
      }
      if (message) {
        eSendEvent(eShowGetPremium, message);
      }
    }

    return {type, result: status};
  };

  useEffect(() => {
    eSubscribeEvent(eStartSyncer, startSyncer);
    eSubscribeEvent(eDispatchAction, (type) => {
      dispatch(type);
    });
    AppState.addEventListener('change', onAppStateChanged);
    eSubscribeEvent('nointent', loadMainApp);
    Appearance.addChangeListener(onSystemThemeChanged);
    let unsub = NetInfo.addEventListener(onNetworkStateChanged);
    if (Platform.OS === 'ios') {
      Linking.addEventListener('url', _handleIntent);
    }
    EV.subscribe('user:checkStatus', handlePremiumAccess);
    return () => {
      EV.unsubscribe('db:refresh', syncChanges);
      eUnSubscribeEvent(eStartSyncer, startSyncer);
      eUnSubscribeEvent(eDispatchAction, (type) => {
        dispatch(type);
      });
      eUnSubscribeEvent('nointent', loadMainApp);
      AppState.removeEventListener('change', onAppStateChanged);
      Appearance.removeChangeListener(onSystemThemeChanged);
      if (Platform.OS === 'ios') {
        Linking.removeEventListener('url', _handleIntent);
      }
      unsub();
    };
  }, []);

  const loadMainApp = () => {
    dispatch({type: Actions.ALL});
    AppRootView = require('./initializer.root').RootView;
    getUser().then(console.log).catch(console.log);
    backupData().then((r) => r);
    sleep(500).then(() => (appInit = true));
    db.notes.init().then(() => {
      dispatch({type: Actions.NOTES});
      console.log('setting loading to false');
      dispatch({type: Actions.LOADING, loading: false});
      SettingsService.setAppLoaded();
    });

    //Sentry = require('@sentry/react-native');
    // Sentry.init({
    //   dsn:
    //     'https://317a5c31caf64d1e9b27abf15eb1a554@o477952.ingest.sentry.io/5519681',
    // });
  };

  const getUser = async () => {
    try {
      let user = await db.user.get();
      if (user) {
        dispatch({type: Actions.USER, user: user});
        dispatch({type: Actions.SYNCING, syncing: true});
        await db.sync();
        dispatch({type: Actions.SYNCING, syncing: false});
        dispatch({type: Actions.ALL});
        await startSyncer();
      } else {
        setLoginMessage(dispatch);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    SettingsService = require('./src/services/SettingsService').default;
    SettingsService.init();
    db.init().finally(runAfterInit);
  }, []);

  const runAfterInit = () => {
    IntentService.getIntent()
      .then(() => {
        AppRootView = require('./initializer.intent').IntentView;
        console.log('found intent');
        setInit(false);
        intentInit = true;
        dispatch({type: Actions.ALL});
        setIntent(true);
        ReceiveSharingIntent.clearFileNames();
      })
      .catch((e) => {
        console.log(e, 'no intent recieved');
        ReceiveSharingIntent.clearFileNames();
        intentInit = true;
        loadMainApp();
      });
  };

  async function backupData() {
    let settings = SettingsService.get();
    let Backup = require('./src/services/Backup').default;
    if (await Backup.checkBackupRequired(settings.reminder)) {
      try {
        await Backup.run();
      } catch (e) {
        console.log(e);
      }
    }
  }

  return (
    <SafeAreaProvider>
      {intent ? <AppRootView /> : null}
      {init && !intent ? <AppRootView /> : null}
    </SafeAreaProvider>
  );
};

export default App;
