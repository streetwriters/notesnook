import React, {useEffect, useRef, useState} from 'react';
import {Appearance, Linking, Platform, SafeAreaView, View} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import AnimatedProgress from 'react-native-reanimated-progress-bar';
import {useTracked} from '../../provider';
import {
  useFavoriteStore,
  useMessageStore,
  useNoteStore,
  useSettingStore,
  useUserStore
} from '../../provider/stores';
import Backup from '../../services/Backup';
import BiometricService from '../../services/BiometricService';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  presentSheet,
  ToastEvent
} from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import {editing, STORE_LINK} from '../../utils';
import {COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT} from '../../utils/Colors';
import {db} from '../../utils/database';
import {
  eOpenAnnouncementDialog,
  eOpenLoginDialog,
  eOpenRateDialog
} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {tabBarRef} from '../../utils/Refs';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import SettingsBackupAndRestore from '../../views/Settings/backup-restore';
import {Button} from '../Button';
import Input from '../Input';
import Seperator from '../Seperator';
import SplashScreen from '../SplashScreen';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {checkVersion} from 'react-native-check-version';
import {Placeholder, SvgToPngView} from '../ListPlaceholders';
import {Update} from '../Update';
import {setRateAppMessage} from '../../services/Message';

let passwordValue = null;
let didVerifyUser = false;
const opacityV = new Animated.Value(1);
const AppLoader = ({onLoad}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const [loading, setLoading] = useState(true);
  const setNotes = useNoteStore(state => state.setNotes);
  const setFavorites = useFavoriteStore(state => state.setFavorites);
  const _setLoading = useNoteStore(state => state.setLoading);
  const _loading = useNoteStore(state => state.loading);
  const user = useUserStore(state => state.user);
  const verifyUser = useUserStore(state => state.verifyUser);
  const setVerifyUser = useUserStore(state => state.setVerifyUser);
  const deviceMode = useSettingStore(state => state.deviceMode);
  const isIntroCompleted = useSettingStore(state => state.isIntroCompleted);
  const pwdInput = useRef();

  const load = async value => {
    if (verifyUser) return;
    if (value === 'hide') {
      setLoading(true);
      opacityV.setValue(1);
      return;
    }
    await restoreEditorState();
    if (value === 'show') {
      opacityV.setValue(0);
      setLoading(false);
      return;
    }
    Animated.timing(opacityV, {
      toValue: 0,
      duration: 100,
      easing: Easing.out(Easing.ease)
    }).start();
    setLoading(false);
    await db.notes.init();
    setNotes();
    setFavorites();
    _setLoading(false);
  };

  useEffect(() => {
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
        if (isIntroCompleted) {
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
    if (
      settingsStore.settings.reminder === 'off' ||
      !settingsStore.settings.reminder
    ) {
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
    let verified = await BiometricService.validateUser(
      'Unlock to access your notes',
      ''
    );
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

  return loading ? (
    <Animated.View
      style={{
        backgroundColor:
          Appearance.getColorScheme() === 'dark'
            ? COLOR_SCHEME_DARK.bg
            : colors.bg,
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: 999,
        borderRadius: 10
      }}>
      <Animated.View
        style={{
          backgroundColor:
            Appearance.getColorScheme() === 'dark'
              ? COLOR_SCHEME_DARK.bg
              : colors.bg,
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 10,
          opacity: opacityV
        }}>
        {verifyUser ? (
          <SafeAreaView
            style={{
              flex: 1,
              justifyContent: 'center',
              width:
                deviceMode !== 'mobile'
                  ? '50%'
                  : Platform.OS == 'ios'
                  ? '95%'
                  : '100%',
              paddingHorizontal: 12
            }}>
            <Heading
              style={{
                alignSelf: 'center'
              }}>
              Verify your identity
            </Heading>

            {user ? (
              <>
                <Paragraph
                  style={{
                    alignSelf: 'center'
                  }}>
                  To keep your notes secure, please enter password of the
                  account you are logged in to.
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
                  }}>
                  To keep your notes secure, please unlock app the with
                  biometrics.
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
        ) : (
          <View
            style={{
              height: 10,
              flexDirection: 'row',
              width: 100
            }}>
            <AnimatedProgress
              style={{
                backgroundColor:
                  Appearance.getColorScheme() === 'dark'
                    ? COLOR_SCHEME_DARK.nav
                    : COLOR_SCHEME_LIGHT.nav
              }}
              fill={colors.accent}
              current={4}
              total={4}
            />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  ) : (
    <SplashScreen />
  );
};

export default AppLoader;
