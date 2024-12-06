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

import React, { useCallback, useEffect, useRef } from "react";
import {
  AppStateStatus,
  Platform,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
//@ts-ignore
import { useThemeColors } from "@notesnook/theme";
import { DatabaseLogger } from "../../common/database";
import {
  decrypt,
  encrypt,
  getCryptoKey,
  getDatabaseKey,
  setAppLockVerificationCipher,
  validateAppLockPassword
} from "../../common/database/encryption";
import { MMKV } from "../../common/database/mmkv";
import { useAppState } from "../../hooks/use-app-state";
import BiometricService from "../../services/biometrics";
import { ToastManager } from "../../services/event-manager";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useUserStore } from "../../stores/use-user-store";
import { NotesnookModule } from "../../utils/notesnook-module";
import { SIZE } from "../../utils/size";
import { Toast } from "../toast";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { strings } from "@notesnook/intl";

const getUser = () => {
  const user = MMKV.getString("user");
  if (user) {
    return JSON.parse(user);
  }
};

const verifyUserPassword = async (password: string) => {
  try {
    await getDatabaseKey();
    const key = await getCryptoKey();
    const user = getUser();
    const cipher = await encrypt(
      {
        key: key,
        salt: user.salt
      },
      "notesnook"
    );
    const plainText = await decrypt({ password }, cipher);
    return plainText === "notesnook";
  } catch (e) {
    DatabaseLogger.error(e as Error);
    return false;
  }
};

const AppLockedScreen = () => {
  const initialLaunchBiometricRequest = useRef(true);
  const { colors } = useThemeColors();
  const user = getUser();
  const appLocked = useUserStore((state) => state.appLocked);
  const lockApp = useUserStore((state) => state.lockApp);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const passwordInputRef = useRef<TextInput>(null);
  const password = useRef<string>();
  const appState = useAppState();
  const lastAppState = useRef<AppStateStatus>(appState);
  const biometricUnlockAwaitingUserInput = useRef(false);
  const { height } = useWindowDimensions();
  const keyboardType = useSettingStore(
    (state) => state.settings.applockKeyboardType
  );
  const appLockHasPasswordSecurity = useSettingStore(
    (state) => state.settings.appLockHasPasswordSecurity
  );
  const biometricsAuthEnabled = useSettingStore(
    (state) =>
      state.settings.biometricsAuthEnabled === true ||
      (state.settings.biometricsAuthEnabled === undefined &&
        !state.settings.appLockHasPasswordSecurity)
  );

  const onUnlockAppRequested = useCallback(async () => {
    if (
      !biometricsAuthEnabled ||
      !(await BiometricService.isBiometryAvailable())
    ) {
      return;
    }

    biometricUnlockAwaitingUserInput.current = true;

    if (Platform.OS === "android") {
      const activityName = await NotesnookModule.getActivityName();
      if (
        activityName !== "MainActivity" &&
        activityName !== "NotePreviewConfigureActivity"
      )
        return;
    }
    useSettingStore.getState().setRequestBiometrics(true);

    const unlocked = await BiometricService.validateUser(
      "Unlock to access your notes",
      ""
    );
    if (unlocked) {
      lockApp(false);
      password.current = undefined;
    }
    biometricUnlockAwaitingUserInput.current = false;
    setTimeout(() => {
      if (biometricUnlockAwaitingUserInput.current) return;
      useSettingStore.getState().setRequestBiometrics(false);
    }, 500);
  }, [biometricsAuthEnabled, lockApp]);

  const onSubmit = async () => {
    if (!password.current) return;
    try {
      const unlocked = appLockHasPasswordSecurity
        ? await validateAppLockPassword(password.current)
        : await verifyUserPassword(password.current);
      if (unlocked) {
        if (!appLockHasPasswordSecurity) {
          await setAppLockVerificationCipher(password.current);
          SettingsService.set({
            appLockHasPasswordSecurity: true,
            applockKeyboardType: "default"
          });
          DatabaseLogger.info("App lock migrated to password security");
        }

        lockApp(false);
        password.current = undefined;
      } else {
        ToastManager.show({
          heading: strings.invalid(keyboardType),
          type: "error",
          context: "local"
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const prevState = lastAppState.current;
    lastAppState.current = appState;

    if (
      appState === "active" &&
      (prevState === "background" || initialLaunchBiometricRequest.current)
    ) {
      if (SettingsService.shouldLockAppOnEnterForeground()) {
        DatabaseLogger.info("Locking app on entering foreground");
        useUserStore.getState().lockApp(true);
      }
      if (
        !(
          biometricUnlockAwaitingUserInput.current ||
          useUserStore.getState().disableAppLockRequests ||
          !appLocked ||
          useSettingStore.getState().requestBiometrics ||
          useSettingStore.getState().appDidEnterBackgroundForAction
        )
      ) {
        initialLaunchBiometricRequest.current = false;
        DatabaseLogger.info("Biometric unlock request");
        onUnlockAppRequested();
      }
    } else {
      SettingsService.appEnteredBackground();
    }
  }, [appState, onUnlockAppRequested, appLocked]);

  return (
    <KeyboardAwareScrollView
      style={{
        backgroundColor: colors.primary.background,
        width: "100%",
        height: "100%"
      }}
      contentContainerStyle={{
        justifyContent: "center",
        minHeight: height
      }}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <Toast context="local" />
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
          style={{
            width: 100,
            height: 100,
            marginBottom: 20,
            marginTop: user ? 0 : 50
          }}
          onPress={onUnlockAppRequested}
          color={colors.primary.border}
        />
        <Heading
          color={colors.primary.heading}
          style={{
            alignSelf: "center",
            textAlign: "center"
          }}
        >
          {strings.unlockNotes()}
        </Heading>

        <Paragraph
          style={{
            alignSelf: "center",
            textAlign: "center",
            maxWidth: "90%"
          }}
        >
          {strings.verifyItsYou()}
        </Paragraph>
        <Seperator />
        <View
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: colors.primary.background
          }}
        >
          {user || appLockHasPasswordSecurity ? (
            <>
              <Input
                fwdRef={passwordInputRef}
                secureTextEntry
                keyboardType={
                  appLockHasPasswordSecurity ? keyboardType : "default"
                }
                placeholder={
                  appLockHasPasswordSecurity
                    ? keyboardType === "numeric"
                      ? strings.enterApplockPassword()
                      : strings.enterApplockPin()
                    : strings.enterAccountPassword()
                }
                onChangeText={(v) => (password.current = v)}
                onSubmit={() => {
                  onSubmit();
                }}
              />
            </>
          ) : null}

          <View
            style={{
              marginTop: user ? 25 : 25
            }}
          >
            {user || appLockHasPasswordSecurity ? (
              <>
                <Button
                  title={strings.continue()}
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

            {biometricsAuthEnabled ? (
              <Button
                title={strings.unlockWithBiometrics()}
                width={250}
                onPress={onUnlockAppRequested}
                icon={"fingerprint"}
                type="transparent"
              />
            ) : null}
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default AppLockedScreen;
