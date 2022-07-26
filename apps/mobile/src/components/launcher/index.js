import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import { checkVersion } from 'react-native-check-version';
import { editorState } from '../../screens/editor/tiptap/utils';
import BackupService from '../../services/backup';
import BiometricService from '../../services/biometrics';
import { DDS } from '../../services/device-detection';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/event-manager';
import { setRateAppMessage } from '../../services/message';
import PremiumService from '../../services/premium';
import SettingsService from '../../services/settings';
import { initialize } from '../../stores';
import { useMessageStore } from '../../stores/use-message-store';
import { useNoteStore } from '../../stores/use-notes-store';
import { useSettingStore } from '../../stores/use-setting-store';
import { useThemeStore } from '../../stores/use-theme-store';
import { useUserStore } from '../../stores/use-user-store';
import { DatabaseLogger, db, loadDatabase } from '../../utils/database';
import { MMKV } from '../../utils/database/mmkv';
import { eOpenAnnouncementDialog } from '../../utils/events';
import { tabBarRef } from '../../utils/global-refs';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { SVG } from '../auth/background';
import Migrate from '../sheets/migrate';
import NewFeature from '../sheets/new-feature/index';
import { Update } from '../sheets/update';
import { Button } from '../ui/button';
import { IconButton } from '../ui/icon-button';
import Input from '../ui/input';
import Seperator from '../ui/seperator';
import { SvgView } from '../ui/svg';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
import { Walkthrough } from '../walkthroughs';

const Launcher = React.memo(
  () => {
    const colors = useThemeStore(state => state.colors);
    const setLoading = useNoteStore(state => state.setLoading);
    const loading = useNoteStore(state => state.loading);
    const user = useUserStore(state => state.user);
    const verifyUser = useUserStore(state => state.verifyUser);
    const setVerifyUser = useUserStore(state => state.setVerifyUser);
    const deviceMode = useSettingStore(state => state.deviceMode);
    const passwordInputRef = useRef();
    const password = useRef();
    const introCompleted = useSettingStore(state => state.settings.introCompleted);
    const dbInitCompleted = useRef(false);
    const loadNotes = async () => {
      if (verifyUser) {
        return;
      }
      await restoreEditorState();
      setImmediate(() => {
        db.notes.init().then(() => {
          Walkthrough.init();
          initialize();
          setImmediate(() => {
            setLoading(false);
            setImmediate(() => doAppLoadActions());
          });
        });
      });
    };

    const init = async () => {
      if (!dbInitCompleted.current) {
        await RNBootSplash.hide({ fade: true });
        await loadDatabase();
        DatabaseLogger.info('Initializing database');
        await db.init();
        dbInitCompleted.current = true;
      }

      if (db.migrations.required() && !verifyUser) {
        presentSheet({
          component: <Migrate />,
          onClose: () => {
            loadNotes();
          },
          disableClosing: true
        });
        return;
      }

      if (!verifyUser) {
        loadNotes();
      } else {
        useUserStore.getState().setUser(await db.user?.getUser());
      }
    };

    // useEffect(() => {
    //   hideSplashScreen();
    // }, [verifyUser]);

    useEffect(() => {
      if (!loading) {
        doAppLoadActions();
      }
      return () => {
        dbInitCompleted.current = false;
      };
    }, [loading]);

    const doAppLoadActions = async () => {
      await sleep(500);
      if (SettingsService.get().sessionExpired) {
        eSendEvent('session_expired');
        return;
      }
      const user = await db.user.getUser();
      await useMessageStore.getState().setAnnouncement();
      if (PremiumService.get() && user) {
        if (SettingsService.get().reminder === 'off') {
          SettingsService.set({ reminder: 'daily' });
        }
        if (BackupService.checkBackupRequired()) {
          sleep(2000).then(() => BackupService.run());
        }
      }
      if (NewFeature.present()) return;
      if (await checkAppUpdateAvailable()) return;
      if (await checkForRateAppRequest()) return;
      if (await checkNeedsBackup()) return;
      if (await PremiumService.getRemainingTrialDaysStatus()) return;

      if (introCompleted) {
        useMessageStore.subscribe(state => {
          let dialogs = state.dialogs;
          if (dialogs.length > 0) {
            eSendEvent(eOpenAnnouncementDialog, dialogs[0]);
          }
        });
      }
    };

    const checkAppUpdateAvailable = async () => {
      if (__DEV__) return;
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
      let appState = MMKV.getString('appState');
      if (appState) {
        appState = JSON.parse(appState);
        if (
          appState.note &&
          !appState.note.locked &&
          !appState.movedAway &&
          Date.now() < appState.timestamp + 3600000
        ) {
          editorState().currentlyEditing = true;
          editorState().isRestoringState = true;
          editorState().movedAway = false;
          if (!DDS.isTab) {
            tabBarRef.current?.goToPage(1);
          }
          eSendEvent('loadingNote', appState.note);
        }
      }
    };

    const checkForRateAppRequest = async () => {
      let rateApp = SettingsService.get().rateApp;
      if (rateApp && rateApp < Date.now() && !useMessageStore.getState().message?.visible) {
        setRateAppMessage();
        return false;
      }
      return false;
    };

    const checkNeedsBackup = async () => {
      return false;
      // let { nextBackupRequestTime, reminder } = SettingsService.get();
      // if (reminder === 'off' || !reminder) {
      //   if (nextBackupRequestTime < Date.now()) {
      //     presentSheet({
      //       title: 'Backup & restore',
      //       paragraph: 'Please enable automatic backups to keep your data safe',
      //       component: <SettingsBackupAndRestore isSheet={true} />
      //     });

      //     return true;
      //   }
      // }
      // return false;
    };

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
        setVerifyUser(false);
        password.current = null;
      }
    };

    useEffect(() => {
      if (verifyUser) {
        onUnlockBiometrics();
      }
      init();
    }, [verifyUser]);

    const onSubmit = async () => {
      if (!password.current) return;
      try {
        let verified = await db.user.verifyPassword(password.current);
        if (verified) {
          setVerifyUser(false);
          password.current = null;
        }
      } catch (e) {}
    };

    return verifyUser ? (
      <View
        style={{
          backgroundColor: colors.bg,
          width: '100%',
          height: '100%',
          position: 'absolute',
          zIndex: 999
        }}
      >
        <View
          style={{
            height: 250,
            overflow: 'hidden'
          }}
        >
          <SvgView src={SVG(colors.night ? 'white' : 'black')} height={700} />
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            width: deviceMode !== 'mobile' ? '50%' : Platform.OS == 'ios' ? '95%' : '100%',
            paddingHorizontal: 12,
            marginBottom: 30,
            marginTop: 15
          }}
        >
          <IconButton
            name="fingerprint"
            size={100}
            customStyle={{
              width: 100,
              height: 100,
              marginBottom: 20,
              marginTop: user ? 0 : 50
            }}
            onPress={onUnlockBiometrics}
            color={colors.border}
          />
          <Heading
            color={colors.heading}
            style={{
              alignSelf: 'center',
              textAlign: 'center'
            }}
          >
            Unlock to access your notes
          </Heading>

          <Paragraph
            style={{
              alignSelf: 'center',
              textAlign: 'center',
              fontSize: SIZE.md,
              maxWidth: '90%'
            }}
          >
            Please verify it's you
          </Paragraph>
          <Seperator />
          <View
            style={{
              width: '100%',
              padding: 12,
              backgroundColor: colors.bg,
              flexGrow: 1
            }}
          >
            {user ? (
              <>
                <Input
                  fwdRef={passwordInputRef}
                  secureTextEntry
                  placeholder="Enter account password"
                  onChangeText={v => (password.current = v)}
                  onSubmit={onSubmit}
                />
              </>
            ) : null}

            <View
              style={{
                marginTop: user ? 50 : 25
              }}
            >
              {user ? (
                <>
                  <Button
                    title="Continue"
                    type="accent"
                    onPress={onSubmit}
                    width={250}
                    height={45}
                    style={{
                      borderRadius: 150,
                      marginBottom: 10
                    }}
                    fontSize={SIZE.md}
                  />
                </>
              ) : null}

              <Button
                title="Unlock with Biometrics"
                width={250}
                height={45}
                style={{
                  borderRadius: 100
                }}
                onPress={onUnlockBiometrics}
                icon={'fingerprint'}
                type={user ? 'grayAccent' : 'accent'}
                fontSize={SIZE.md}
              />
            </View>
          </View>
        </View>
      </View>
    ) : null;
  },
  () => true
);

export default Launcher;
