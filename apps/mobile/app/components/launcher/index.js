/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import notifee from "@notifee/react-native";
import React, { useCallback, useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import RNBootSplash from "react-native-bootsplash";
import { checkVersion } from "react-native-check-version";
import Config from "react-native-config";
import { enabled } from "react-native-privacy-snapshot";
import { DatabaseLogger, db } from "../../common/database";
import { useAppState } from "../../hooks/use-app-state";
import BiometricService from "../../services/biometrics";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import { setRateAppMessage } from "../../services/message";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import { initialize } from "../../stores";
import { useMessageStore } from "../../stores/use-message-store";
import { useNoteStore } from "../../stores/use-notes-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
import { AndroidModule } from "../../utils";
import { eOpenAnnouncementDialog } from "../../utils/events";
import { getGithubVersion } from "../../utils/github-version";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { SVG } from "../auth/background";
import Migrate from "../sheets/migrate";
import NewFeature from "../sheets/new-feature/index";
import { Update } from "../sheets/update";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import { SvgView } from "../ui/svg";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { Walkthrough } from "../walkthroughs";

const Launcher = React.memo(
  function Launcher() {
    const colors = useThemeStore((state) => state.colors);
    const setLoading = useNoteStore((state) => state.setLoading);
    const loading = useNoteStore((state) => state.loading);
    const user = useUserStore((state) => state.user);
    const verifyUser = useUserStore((state) => state.verifyUser);
    const setVerifyUser = useUserStore((state) => state.setVerifyUser);
    const deviceMode = useSettingStore((state) => state.deviceMode);
    const appState = useAppState();
    const passwordInputRef = useRef();
    const password = useRef();
    const introCompleted = useSettingStore(
      (state) => state.settings.introCompleted
    );
    const verifying = useRef(false);

    const loadNotes = useCallback(async () => {
      if (verifyUser) {
        return;
      }
      setImmediate(() => {
        db.notes.init().then(() => {
          Walkthrough.init();
          initialize();
          setImmediate(() => {
            setLoading(false);
          });
        });
      });
    }, [setLoading, verifyUser]);

    const init = useCallback(async () => {
      if (!db.isInitialized) {
        await RNBootSplash.hide({ fade: true });
        DatabaseLogger.info("Initializing database");
        await db.init();
      }

      if (db.migrations.required() && !verifyUser) {
        presentSheet({
          component: <Migrate />,
          onClose: async () => {
            if (!db.isInitialized) {
              await db.init();
            }
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
    }, [loadNotes, verifyUser]);

    useEffect(() => {
      if (!loading) {
        doAppLoadActions();
      }
    }, [doAppLoadActions, loading]);

    const doAppLoadActions = useCallback(async () => {
      await sleep(500);
      if (SettingsService.get().sessionExpired) {
        eSendEvent("session_expired");
        return;
      }
      notifee.setBadgeCount(0);
      await useMessageStore.getState().setAnnouncement();
      if (NewFeature.present()) return;
      if (await checkAppUpdateAvailable()) return;
      if (await checkForRateAppRequest()) return;
      if (await checkNeedsBackup()) return;
      if (await PremiumService.getRemainingTrialDaysStatus()) return;

      if (introCompleted) {
        useMessageStore.subscribe((state) => {
          let dialogs = state.dialogs;
          if (dialogs.length > 0) {
            eSendEvent(eOpenAnnouncementDialog, dialogs[0]);
          }
        });
      }
    }, [introCompleted]);

    const checkAppUpdateAvailable = async () => {
      if (__DEV__ || Config.isTesting === "true") return;
      try {
        const version =
          Config.GITHUB_RELEASE === "true"
            ? await getGithubVersion()
            : await checkVersion();
        if (!version || !version?.needsUpdate) return false;
        presentSheet({
          component: (ref) => <Update version={version} fwdRef={ref} />
        });
        return true;
      } catch (e) {
        return false;
      }
    };

    const checkForRateAppRequest = async () => {
      let rateApp = SettingsService.get().rateApp;
      if (
        rateApp &&
        rateApp < Date.now() &&
        !useMessageStore.getState().message?.visible
      ) {
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

    const onUnlockBiometrics = useCallback(async () => {
      if (!(await BiometricService.isBiometryAvailable())) return;
      if (Platform.OS === "android") {
        const activityName = await AndroidModule.getActivityName();
        if (activityName !== "MainActivity") return;
      }

      let verified = await BiometricService.validateUser(
        "Unlock to access your notes",
        ""
      );
      if (verified) {
        setVerifyUser(false);
        enabled(false);
        password.current = null;
        setTimeout(() => {
          verifying.current = false;
        }, 1);
      }
    }, [setVerifyUser]);

    useEffect(() => {
      init();
    }, [init, verifyUser]);

    useEffect(() => {
      if (verifying.current) return;
      if (verifyUser && appState === "active") {
        verifying.current = true;
        onUnlockBiometrics();
      }
    }, [appState, onUnlockBiometrics, verifyUser]);

    const onSubmit = async () => {
      if (!password.current) return;
      try {
        let verified = await db.user.verifyPassword(password.current);
        if (verified) {
          setVerifyUser(false);
          enabled(false);
          password.current = null;
        }
      } catch (e) {
        console.error(e);
      }
    };

    return verifyUser ? (
      <View
        style={{
          backgroundColor: colors.bg,
          width: "100%",
          height: "100%",
          position: "absolute",
          zIndex: 999
        }}
      >
        <View
          style={{
            height: 250,
            overflow: "hidden"
          }}
        >
          <SvgView src={SVG(colors.night ? "white" : "black")} height={700} />
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            width:
              deviceMode !== "mobile"
                ? "50%"
                : Platform.OS == "ios"
                ? "95%"
                : "100%",
            paddingHorizontal: 12,
            marginBottom: 30,
            marginTop: 15,
            alignSelf: "center"
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
              alignSelf: "center",
              textAlign: "center"
            }}
          >
            Unlock to access your notes
          </Heading>

          <Paragraph
            style={{
              alignSelf: "center",
              textAlign: "center",
              fontSize: SIZE.md,
              maxWidth: "90%"
            }}
          >
            {"Please verify it's you"}
          </Paragraph>
          <Seperator />
          <View
            style={{
              width: "100%",
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
                  onChangeText={(v) => (password.current = v)}
                  onSubmit={onSubmit}
                />
              </>
            ) : null}

            <View
              style={{
                marginTop: user ? 25 : 25
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
                icon={"fingerprint"}
                type={user ? "grayAccent" : "accent"}
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
