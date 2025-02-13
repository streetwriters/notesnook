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

import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { MMKV } from "../../common/database/mmkv";
import BiometricService from "../../services/biometrics";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent
} from "../../services/event-manager";
import { setLoginMessage } from "../../services/message";
import SettingsService from "../../services/settings";
import Sync from "../../services/sync";
import { clearAllStores } from "../../stores";
import { useUserStore } from "../../stores/use-user-store";
import { eLoginSessionExpired, eUserLoggedIn } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Dialog } from "../dialog";
import BaseDialog from "../dialog/base-dialog";
import { presentDialog } from "../dialog/functions";
import SheetProvider from "../sheet-provider";
import { Toast } from "../toast";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { LoginSteps, useLogin } from "./use-login";
import { strings } from "@notesnook/intl";
import { getObfuscatedEmail } from "../../utils/functions";

export const SessionExpired = () => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const { step, password, email, passwordInputRef, loading, login } = useLogin(
    () => {
      eSendEvent(eUserLoggedIn, true);
      setVisible(false);
      setFocused(false);
      useUserStore.setState({
        disableAppLockRequests: false
      });
    },
    true
  );

  const logout = async () => {
    try {
      await db.user.logout();
      await BiometricService.resetCredentials();
      setLoginMessage();
      SettingsService.resetSettings();
      useUserStore.getState().setUser(null);
      useUserStore.getState().setSyncing(false);
      MMKV.clearStore();
      clearAllStores();
      setVisible(false);
      useUserStore.setState({
        disableAppLockRequests: false
      });
    } catch (e) {
      ToastManager.show({
        heading: e.message,
        type: "error",
        context: "local"
      });
    }
  };

  useEffect(() => {
    const sub = eSubscribeEvent(eLoginSessionExpired, open);
    return () => {
      sub.unsubscribe?.();
    };
  }, [visible, open]);

  const open = React.useCallback(async () => {
    try {
      let res = await db.tokenManager.getToken();
      if (!res) throw new Error("no token found");
      if (db.tokenManager._isTokenExpired(res))
        throw new Error("token expired");

      const key = await db.user.getEncryptionKey();
      if (!key) throw new Error("No encryption key found.");

      Sync.run("global", false, "full", async (complete) => {
        if (!complete) {
          let user = await db.user.getUser();
          if (!user) return;
          email.current = user.email;
          setVisible(true);
          setFocused(false);
          return;
        }
        SettingsService.set({
          sessionExpired: false
        });
        setVisible(false);
      });
    } catch (e) {
      let user = await db.user.getUser();
      if (!user) return;
      email.current = user.email;
      setFocused(false);
      setVisible(true);
      useUserStore.setState({
        disableAppLockRequests: true
      });
    }
  }, [email]);

  return (
    visible && (
      <BaseDialog
        transparent={false}
        background={colors.primary.background}
        bounce={false}
        animated={false}
        centered={false}
        onShow={async () => {
          useUserStore.setState({
            disableAppLockRequests: true
          });
          await sleep(300);
          passwordInputRef.current?.focus();
          setFocused(true);
          useUserStore.setState({
            disableAppLockRequests: true
          });
        }}
        enableSheetKeyboardHandler={true}
        visible={true}
      >
        <View
          style={{
            width: focused ? "100%" : "99.9%",
            padding: 12,
            justifyContent: "center",
            flex: 1,
            backgroundColor: colors.primary.background
          }}
        >
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              marginBottom: 20,
              borderRadius: 10,
              paddingVertical: 20
            }}
          >
            <IconButton
              style={{
                width: 60,
                height: 60
              }}
              name="alert"
              color={colors.error.icon}
              size={50}
            />
            <Heading size={AppFontSize.xxxl} color={colors.primary.heading}>
              {strings.sessionExpired()}
            </Heading>
            <Paragraph
              style={{
                textAlign: "center"
              }}
            >
              {strings.sessionExpiredDesc(getObfuscatedEmail(email.current))}
            </Paragraph>
          </View>

          {step === LoginSteps.passwordAuth ? (
            <Input
              fwdRef={passwordInputRef}
              onChangeText={(value) => {
                password.current = value;
              }}
              returnKeyLabel={strings.done()}
              returnKeyType="next"
              secureTextEntry
              autoComplete="password"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={strings.password()}
              onSubmit={() => login()}
            />
          ) : null}

          <Button
            style={{
              marginTop: 10,
              width: 250,
              borderRadius: 100
            }}
            loading={loading}
            onPress={() => login()}
            type="accent"
            title={loading ? null : strings.login()}
          />

          <Button
            style={{
              marginTop: 10,
              width: "100%"
            }}
            onPress={() => {
              presentDialog({
                context: "session_expiry",
                title: strings.logoutFromDevice(),
                paragraph: strings.logoutDesc(),
                positiveText: strings.logout(),
                positiveType: "errorShade",
                positivePress: logout
              });
            }}
            type="errorShade"
            title={loading ? null : strings.logoutFromDevice()}
          />
        </View>
        <Toast context="local" />
        <Dialog context="session_expiry" />

        <SheetProvider context="two_factor_verify" />
      </BaseDialog>
    )
  );
};
