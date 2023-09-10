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
import { Platform, View } from "react-native";
import { enabled } from "react-native-privacy-snapshot";
import { db } from "../../common/database";
import { useAppState } from "../../hooks/use-app-state";
import BiometricService from "../../services/biometrics";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { useUserStore } from "../../stores/use-user-store";
import { NotesnookModule } from "../../utils/notesnook-module";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

const AppLockedOverlay = () => {
  const { colors } = useThemeColors();
  const user = useUserStore((state) => state.user);
  const appLocked = useUserStore((state) => state.appLocked);
  const lockApp = useUserStore((state) => state.lockApp);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const passwordInputRef = useRef();
  const password = useRef();
  const appState = useAppState();

  const biometricUnlockAwaitingUserInput = useRef(false);

  const onUnlockAppRequested = useCallback(async () => {
    if (!(await BiometricService.isBiometryAvailable())) return;
    if (Platform.OS === "android") {
      const activityName = await NotesnookModule.getActivityName();
      if (activityName !== "MainActivity") return;
    }
    useSettingStore.getState().setRequestBiometrics(true);

    let unlocked = await BiometricService.validateUser(
      "Unlock to access your notes",
      ""
    );
    if (unlocked) {
      lockApp(false);
      enabled(false);
      password.current = null;
    }
    setTimeout(() => {
      biometricUnlockAwaitingUserInput.current = false;
      useSettingStore.getState().setRequestBiometrics(false);
    }, 1);
  }, [lockApp]);

  const onSubmit = async () => {
    if (!password.current) return;
    try {
      let unlocked = await db.user.verifyPassword(password.current);
      if (unlocked) {
        lockApp(false);
        enabled(false);
        password.current = null;
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (
      biometricUnlockAwaitingUserInput.current ||
      useUserStore.getState().disableAppLockRequests
    )
      return;
    if (appLocked && appState === "active") {
      biometricUnlockAwaitingUserInput.current = true;
      onUnlockAppRequested();
    }
  }, [appState, onUnlockAppRequested, appLocked]);

  return (
    appLocked && (
      <View
        style={{
          backgroundColor: colors.primary.background,
          width: "100%",
          height: "100%",
          position: "absolute",
          zIndex: 999,
          justifyContent: "center"
        }}
      >
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
            Unlock your notes
          </Heading>

          <Paragraph
            style={{
              alignSelf: "center",
              textAlign: "center",
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
              backgroundColor: colors.primary.background
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
                onPress={onUnlockAppRequested}
                icon={"fingerprint"}
                type="transparent"
              />
            </View>
          </View>
        </View>
      </View>
    )
  );
};

export default AppLockedOverlay;
