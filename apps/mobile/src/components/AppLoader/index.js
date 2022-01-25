import React, { useEffect, useRef, useState } from 'react';
import { Appearance, NativeModules, Platform, SafeAreaView } from 'react-native';
import { NavigationBar } from 'react-native-bars';
import RNBootSplash from 'react-native-bootsplash';
import { checkVersion } from 'react-native-check-version';
import Animated from 'react-native-reanimated';
import { useTracked } from '../../provider';
import {
  useFavoriteStore,
  useMessageStore,
  useNoteStore,
  useSettingStore,
  useUserStore
} from '../../provider/stores';
import Backup from '../../services/Backup';
import BiometricService from '../../services/BiometricService';
import { DDS } from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  presentSheet,
  ToastEvent
} from '../../services/EventManager';
import { setRateAppMessage } from '../../services/Message';
import PremiumService from '../../services/PremiumService';
import { editing } from '../../utils';
import { COLOR_SCHEME_DARK } from '../../utils/Colors';
import { db } from '../../utils/database';
import { eOpenAnnouncementDialog, eOpenLoginDialog } from '../../utils/Events';
import { MMKV } from '../../utils/mmkv';
import { tabBarRef } from '../../utils/Refs';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import SettingsBackupAndRestore from '../../views/Settings/backup-restore';
import { Button } from '../Button';
import Input from '../Input';
import Seperator from '../Seperator';
import SplashScreen from '../SplashScreen';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import { Update } from '../Update';

let passwordValue = null;
let didVerifyUser = false;

const AppLoader = ({ onLoad }) => {
  const [state] = useTracked();
  const colors = state.colors;
  const setNotes = useNoteStore(state => state.setNotes);
  const setFavorites = useFavoriteStore(state => state.setFavorites);
  const _setLoading = useNoteStore(state => state.setLoading);
  const _loading = useNoteStore(state => state.loading);
  const user = useUserStore(state => state.user);
  const verifyUser = useUserStore(state => state.verifyUser);
  const setVerifyUser = useUserStore(state => state.setVerifyUser);
  const deviceMode = useSettingStore(state => state.deviceMode);
  const pwdInput = useRef();
  const [requireIntro, setRequireIntro] = useState({
    updated: false,
    value: false
  });

  const load = async () => {
    if (verifyUser) {
      return;
    }
    await restoreEditorState();
    await db.notes.init();
    setNotes();
    setFavorites();
    _setLoading(false);
  };

  const hideSplashScreen = async () => {
    await sleep(requireIntro.value ? 500 : 0);
    await RNBootSplash.hide({ fade: true });
    setTimeout(async () => {
      NativeModules.RNBars.setStatusBarStyle(!colors.night ? 'light-content' : 'dark-content');
      await sleep(5);
      NativeModules.RNBars.setStatusBarStyle(colors.night ? 'light-content' : 'dark-content');
    }, 500);
  };

  useEffect(() => {
    if (requireIntro.updated) {
      hideSplashScreen();
    }
  }, [requireIntro, verifyUser]);

  useEffect(() => {
    (async () => {
      let introCompleted = await MMKV.getItem('introCompleted');
      setRequireIntro({
        updated: true,
        value: !introCompleted
      });
    })();
    if (!_loading) {
      (async () => {
        await sleep(500);
        if ((await MMKV.getItem('loginSessionHasExpired')) === 'expired') {
          eSendEvent(eOpenLoginDialog, 4);
          return;
        }

        if (await checkAppUpdateAvailable()) return;

        let settingsStore = useSettingStore.getState();
        if (await Backup.checkBackupRequired(settingsStore.settings.reminder)) {
          await Backup.checkAndRun();
          return;
        }
        if (await checkForRateAppRequest()) return;
        if (await checkNeedsBackup()) return;
        if (await PremiumService.getRemainingTrialDaysStatus()) return;

        await useMessageStore.getState().setAnnouncement();
        if (!requireIntro) {
          let dialogs = useMessageStore.getState().dialogs;
          if (dialogs.length > 0) {
            eSendEvent(eOpenAnnouncementDialog, dialogs[0]);
          }
        }
      })();
    }
  }, [_loading]);

  const checkAppUpdateAvailable = async () => {
    try {
      const version = await checkVersion();
      if (!version.needsUpdate) return false;
      presentSheet({
        component: ref => <Update version={version} fwdRef={ref} />
      });

      return true;
    } catch (e) {
      return false;
    }
  };

  const restoreEditorState = async () => {
    let appState = await MMKV.getItem('appState');
    if (appState) {
      appState = JSON.parse(appState);
      if (
        appState.note &&
        !appState.note.locked &&
        !appState.movedAway &&
        Date.now() < appState.timestamp + 3600000
      ) {
        editing.isRestoringState = true;
        editing.currentlyEditing = true;
        editing.movedAway = false;
        if (!DDS.isTab) {
          tabBarRef.current?.goToPage(1);
        }
        eSendEvent('loadingNote', appState.note);
      }
    }
  };

  const checkForRateAppRequest = async () => {
    let askForRating = await MMKV.getItem('askForRating');
    if (askForRating !== 'never' || askForRating !== 'completed') {
      askForRating = JSON.parse(askForRating);
      if (askForRating?.timestamp < Date.now()) {
        if (!useMessageStore.getState().message.visible) {
          setRateAppMessage();
        }
        return true;
      }
    }
    return false;
  };

  const checkNeedsBackup = async () => {
    let settingsStore = useSettingStore.getState();
    let askForBackup = await MMKV.getItem('askForBackup');
    if (settingsStore.settings.reminder === 'off' || !settingsStore.settings.reminder) {
      askForBackup = JSON.parse(askForBackup);
      if (askForBackup?.timestamp < Date.now()) {
        presentSheet({
          title: 'Backup & restore',
          paragraph: 'Please enable automatic backups to keep your data safe',
          component: <SettingsBackupAndRestore isSheet={true} />
        });

        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    eSubscribeEvent('load_overlay', load);
    if (!verifyUser) {
      if (!didVerifyUser) {
        onLoad();
      } else {
        load();
      }
    }
    if (verifyUser) {
      onUnlockBiometrics();
    }
    return () => {
      eUnSubscribeEvent('load_overlay', load);
    };
  }, [verifyUser]);

  const onUnlockBiometrics = async () => {
    if (!(await BiometricService.isBiometryAvailable())) {
      ToastEvent.show({
        heading: 'Biometrics unavailable',
        message: 'Try unlocking the app with your account password'
      });
      return;
    }
    let verified = await BiometricService.validateUser('Unlock to access your notes', '');
    if (verified) {
      didVerifyUser = true;
      setVerifyUser(false);
      passwordValue = null;
    }
  };

  const onSubmit = async () => {
    if (!passwordValue) return;
    try {
      let verified = await db.user.verifyPassword(passwordValue);
      if (verified) {
        didVerifyUser = true;
        setVerifyUser(false);
        passwordValue = null;
      }
    } catch (e) {}
  };

  return verifyUser ? (
    <Animated.View
      style={{
        backgroundColor: Appearance.getColorScheme() === 'dark' ? COLOR_SCHEME_DARK.bg : colors.bg,
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: 999,
        borderRadius: 10
      }}
    >
      <Animated.View
        style={{
          backgroundColor:
            Appearance.getColorScheme() === 'dark' ? COLOR_SCHEME_DARK.bg : colors.bg,
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 10
        }}
      >
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: 'center',
            width: deviceMode !== 'mobile' ? '50%' : Platform.OS == 'ios' ? '95%' : '100%',
            paddingHorizontal: 12
          }}
        >
          <Heading
            style={{
              alignSelf: 'center'
            }}
          >
            Verify your identity
          </Heading>

          {user ? (
            <>
              <Paragraph
                style={{
                  alignSelf: 'center'
                }}
              >
                To keep your notes secure, please enter password of the account you are logged in
                to.
              </Paragraph>
              <Seperator />
              <Input
                fwdRef={pwdInput}
                secureTextEntry
                placeholder="Enter account password"
                onChangeText={v => (passwordValue = v)}
                onSubmit={onSubmit}
              />
              <Seperator half />
              <Button
                title="Unlock"
                type="accent"
                onPress={onSubmit}
                width="100%"
                height={50}
                fontSize={SIZE.md}
              />
              <Seperator />
            </>
          ) : (
            <>
              <Paragraph
                style={{
                  alignSelf: 'center'
                }}
              >
                To keep your notes secure, please unlock app the with biometrics.
              </Paragraph>
              <Seperator />
            </>
          )}

          <Button
            title="Unlock with Biometrics"
            width="100%"
            height={50}
            onPress={onUnlockBiometrics}
            icon={'fingerprint'}
            type={!user ? 'accent' : 'transparent'}
            fontSize={SIZE.md}
          />
        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  ) : requireIntro.value && !_loading ? (
    <SplashScreen />
  ) : null;
};

export default AppLoader;
