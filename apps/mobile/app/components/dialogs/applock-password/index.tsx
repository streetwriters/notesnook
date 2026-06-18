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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { Radius, Spacing } from "../../../common/design/spacing";
import { db } from "../../../common/database";
import {
  clearAppLockVerificationCipher,
  setAppLockVerificationCipher,
  validateAppLockPassword
} from "../../../common/database/encryption";
import BiometricService from "../../../services/biometrics";
import { DDS } from "../../../services/device-detection";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent
} from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { PASSWORD_PLACEHOLDER } from "../../../utils/constants";
import { getElevationStyle } from "../../../utils/elevation";
import {
  eCloseAppLocKPasswordDailog,
  eOpenAppLockPasswordDialog
} from "../../../utils/events";
import { AppFontSize } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import BaseDialog from "../../dialog/base-dialog";
import { Toast } from "../../toast";
import { Button } from "../../ui/button";
import FormInput, {
  createFormRef,
  validators
} from "../../ui/input/form-input";
import Heading from "../../ui/typography/heading";

export const AppLockPassword = () => {
  const { colors } = useThemeColors();
  const [mode, setMode] = useState<"create" | "change" | "remove">("create");
  const [visible, setVisible] = useState(false);
  const currentPasswordInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const formRef = useRef(
    createFormRef({
      currentPassword: "",
      password: "",
      confirmPassword: ""
    })
  );
  const [accountPass, setAccountPass] = useState(false);
  const enableApplock = useRef(false);

  useEffect(() => {
    const subs = [
      eSubscribeEvent(
        eOpenAppLockPasswordDialog,
        (mode: "create" | "change" | "remove", _enableApplock = false) => {
          setMode(mode);
          setAccountPass(false);
          setVisible(true);
          enableApplock.current = _enableApplock;
        }
      ),
      eSubscribeEvent(eCloseAppLocKPasswordDailog, () => {
        close();
      })
    ];
    return () => {
      subs.forEach((sub) => sub?.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    formRef.current.setValue("currentPassword", "");
    formRef.current.setValue("password", "");
    formRef.current.setValue("confirmPassword", "");
    formRef.current.clearErrors();
    setVisible(false);
  };

  const onSubmit = async () => {
    if (!formRef.current.validate()) return;

    const currentPassword = formRef.current.getValue("currentPassword");
    const password = formRef.current.getValue("password");

    if (mode === "create") {
      setAppLockVerificationCipher(password);
      SettingsService.setProperty("appLockHasPasswordSecurity", true);
      if (enableApplock.current) {
        SettingsService.setProperty("appLockEnabled", true);
      }
    } else if (mode === "change") {
      const isCurrentPasswordCorrect =
        await validateAppLockPassword(currentPassword);

      if (!isCurrentPasswordCorrect) {
        formRef.current.setError(
          "currentPassword",
          strings.incorrect("password")
        );
        return;
      }

      await clearAppLockVerificationCipher();
      SettingsService.setProperty("appLockHasPasswordSecurity", true);
      await setAppLockVerificationCipher(password);
    } else if (mode === "remove") {
      const isCurrentPasswordCorrect = accountPass
        ? await db.user.verifyPassword(password)
        : await validateAppLockPassword(password);

      if (!isCurrentPasswordCorrect) {
        formRef.current.setError(
          "password",
          accountPass
            ? strings.passwordIncorrect()
            : strings.incorrect("password")
        );
        return;
      }
      clearAppLockVerificationCipher();
      SettingsService.setProperty("appLockHasPasswordSecurity", false);

      if (
        !(await BiometricService.isBiometryAvailable()) ||
        SettingsService.getProperty("biometricsAuthEnabled") === false
      ) {
        SettingsService.setProperty("appLockEnabled", false);
        SettingsService.setPrivacyScreen(
          SettingsService.getProperty("privacyScreen")
        );
        ToastManager.show({
          message: strings.applockDisabled(),
          type: "success"
        });
      }
    }

    close();
  };

  return !visible ? null : (
    <BaseDialog
      onShow={async () => {
        await sleep(100);
        if (mode !== "change") {
          passwordInputRef.current?.focus();
        } else {
          currentPasswordInputRef.current?.focus();
        }
      }}
      statusBarTranslucent={false}
      onRequestClose={close}
      visible={visible}
    >
      <View
        style={{
          ...getElevationStyle(10),
          width: DDS.isTab ? 350 : "85%",
          borderRadius: Radius.MD,
          backgroundColor: colors.primary.background,
          paddingHorizontal: Spacing.LEVEL_3,
          paddingVertical: Spacing.LEVEL_4,
          gap: Spacing.LEVEL_4
        }}
      >
        <Heading fontSize="XL" lineHeight="100%">
          {strings.changeAppLockCredentials(mode, "password")}
        </Heading>

        <View style={{ gap: Spacing.LEVEL_2 }}>
          {mode === "change" ? (
            <FormInput
              name="currentPassword"
              formRef={formRef}
              label={strings.currentPassword()}
              fwdRef={currentPasswordInputRef}
              autoCapitalize="none"
              autoComplete="password"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              returnKeyLabel={strings.next()}
              returnKeyType="next"
              secureTextEntry
              placeholder={PASSWORD_PLACEHOLDER}
              containerStyle={{ borderRadius: Radius.XS }}
              validators={[validators.required(strings.passwordRequired())]}
            />
          ) : null}

          <FormInput
            name="password"
            formRef={formRef}
            label={
              mode === "change"
                ? strings.newPassword()
                : strings.enterPassword()
            }
            fwdRef={passwordInputRef}
            autoCapitalize="none"
            autoComplete="password"
            onSubmitEditing={() => {
              if (mode !== "remove") {
                confirmPasswordInputRef.current?.focus();
              } else {
                onSubmit();
              }
            }}
            returnKeyLabel={
              mode !== "remove" ? strings.next() : strings.remove()
            }
            returnKeyType={mode !== "remove" ? "next" : "done"}
            secureTextEntry
            placeholder={PASSWORD_PLACEHOLDER}
            containerStyle={{ borderRadius: Radius.XS }}
            validators={[validators.required(strings.passwordRequired())]}
          />

          {mode !== "remove" ? (
            <FormInput
              name="confirmPassword"
              formRef={formRef}
              label={
                mode === "change"
                  ? strings.confirmNewPassword()
                  : strings.confirmPassword()
              }
              fwdRef={confirmPasswordInputRef}
              autoCapitalize="none"
              autoComplete="password"
              onSubmitEditing={() => onSubmit()}
              returnKeyLabel={strings.done()}
              returnKeyType="done"
              secureTextEntry
              placeholder={PASSWORD_PLACEHOLDER}
              containerStyle={{ borderRadius: Radius.XS }}
              validators={[
                validators.required(strings.confirmPasswordRequired()),
                validators.matchField("password", strings.passwordNotMatched())
              ]}
            />
          ) : null}

          {mode === "remove" ? (
            <Button
              icon={accountPass ? "checkbox" : "box-empty"}
              iconFamily="notesnook"
              onPress={() => setAccountPass(!accountPass)}
              iconSize={AppFontSize.sm}
              fontFamily="MEDIUM"
              fontSize={AppFontSize.xs}
              type="plain"
              iconColor={
                accountPass
                  ? [colors.primary.accent, colors.primary.accentForeground]
                  : colors.primary.icon
              }
              textStyle={{
                color: colors.primary.paragraph
              }}
              title={strings.useAccountPassword()}
              style={{
                width: "100%",
                alignSelf: "flex-start",
                justifyContent: "flex-start",
                paddingHorizontal: 0,
                paddingVertical: 0
              }}
            />
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: Spacing.LEVEL_2 }}>
          <Button
            title={strings.cancel()}
            type="plain-outline"
            onPress={close}
            style={{ flex: 1, paddingVertical: Spacing.LEVEL_3 }}
          />
          <Button
            title={mode === "remove" ? strings.remove() : strings.save()}
            type="accent"
            onPress={onSubmit}
            style={{ flex: 1, paddingVertical: Spacing.LEVEL_3 }}
          />
        </View>
      </View>

      <Toast context="local" />
    </BaseDialog>
  );
};

AppLockPassword.present = (
  mode: "create" | "change" | "remove",
  enableAppLock?: boolean
) => {
  eSendEvent(eOpenAppLockPasswordDialog, mode, enableAppLock);
};
