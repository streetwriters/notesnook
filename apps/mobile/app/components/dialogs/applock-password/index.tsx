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
import React, { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
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
import { useSettingStore } from "../../../stores/use-setting-store";
import { getElevationStyle } from "../../../utils/elevation";
import {
  eCloseAppLocKPasswordDailog,
  eOpenAppLockPasswordDialog
} from "../../../utils/events";
import { AppFontSize } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import BaseDialog from "../../dialog/base-dialog";
import DialogButtons from "../../dialog/dialog-buttons";
import DialogHeader from "../../dialog/dialog-header";
import { Toast } from "../../toast";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import Input from "../../ui/input";
import Seperator from "../../ui/seperator";
import { strings } from "@notesnook/intl";

export const AppLockPassword = () => {
  const { colors } = useThemeColors();
  const [mode, setMode] = useState<"create" | "change" | "remove">("create");
  const [keyboardType, setKeyboardType] = useState<"pin" | "password">(
    useSettingStore.getState().settings.applockKeyboardType === "default"
      ? "password"
      : "pin"
  );
  const [visible, setVisible] = useState(false);
  const currentPasswordInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const values = useRef<{
    currentPassword?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [accountPass, setAccountPass] = useState(false);

  useEffect(() => {
    const subs = [
      eSubscribeEvent(
        eOpenAppLockPasswordDialog,
        (mode: "create" | "change" | "remove") => {
          setMode(mode);
          setAccountPass(false);
          setVisible(true);
        }
      ),
      eSubscribeEvent(eCloseAppLocKPasswordDailog, () => {
        values.current = {};
        setVisible(false);
      })
    ];
    return () => {
      subs.forEach((sub) => sub?.unsubscribe());
    };
  }, []);

  const close = () => {
    values.current = {};
    setVisible(false);
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
          borderRadius: 10,
          backgroundColor: colors.primary.background,
          paddingTop: 12
        }}
      >
        <DialogHeader
          title={strings.changeAppLockCredentials(mode, keyboardType)}
          icon="shield"
          padding={12}
        />
        <Seperator half />

        <View
          style={{
            paddingHorizontal: 12
          }}
        >
          {mode === "change" ? (
            <Input
              fwdRef={currentPasswordInputRef}
              autoCapitalize="none"
              onChangeText={(value) => {
                values.current.currentPassword = value;
              }}
              onSubmit={() => {
                passwordInputRef.current?.focus();
              }}
              defaultValue={values.current.currentPassword}
              autoComplete="password"
              returnKeyLabel={strings.next()}
              keyboardType={keyboardType === "pin" ? "number-pad" : "default"}
              returnKeyType="next"
              secureTextEntry={secureTextEntry}
              placeholder={
                keyboardType === "pin"
                  ? strings.currentPin()
                  : strings.currentPassword()
              }
            />
          ) : null}

          <Input
            fwdRef={passwordInputRef}
            autoCapitalize="none"
            onChangeText={(value) => {
              values.current.password = value;
            }}
            onSubmit={() => {
              confirmPasswordInputRef.current?.focus();
            }}
            defaultValue={values.current.password}
            keyboardType={
              keyboardType === "pin" && !accountPass ? "number-pad" : "default"
            }
            autoComplete="password"
            returnKeyLabel={
              mode !== "remove" ? strings.next() : strings.remove()
            }
            returnKeyType={mode !== "remove" ? "next" : "done"}
            secureTextEntry={secureTextEntry}
            buttonLeft={
              accountPass ? null : (
                <IconButton
                  name={keyboardType === "password" ? "numeric" : "keyboard"}
                  onPress={() => {
                    setKeyboardType(
                      keyboardType === "password" ? "pin" : "password"
                    );
                    setSecureTextEntry(false);
                    setImmediate(() => {
                      setSecureTextEntry(true);
                    });
                  }}
                  style={{
                    width: 25,
                    height: 25,
                    marginRight: 5
                  }}
                  size={AppFontSize.lg}
                />
              )
            }
            placeholder={
              accountPass
                ? strings.enterAccountPassword()
                : mode === "change"
                ? keyboardType === "pin"
                  ? strings.newPin()
                  : strings.newPassword()
                : `${
                    keyboardType === "pin" ? strings.pin() : strings.password()
                  }`
            }
          />

          {mode !== "remove" ? (
            <Input
              fwdRef={confirmPasswordInputRef}
              autoCapitalize="none"
              onChangeText={(value) => {
                values.current.confirmPassword = value;
              }}
              onSubmit={() => {
                confirmPasswordInputRef.current?.focus();
              }}
              defaultValue={values.current.confirmPassword}
              keyboardType={keyboardType === "pin" ? "number-pad" : "default"}
              customValidator={() => values.current.password || ""}
              validationType="confirmPassword"
              autoComplete="password"
              returnKeyLabel={strings.done()}
              returnKeyType="done"
              secureTextEntry={secureTextEntry}
              placeholder={
                keyboardType === "pin"
                  ? strings.confirmPin()
                  : strings.confirmPassword()
              }
            />
          ) : null}

          {mode === "remove" ? (
            <>
              <Button
                icon={
                  accountPass ? "checkbox-marked" : "checkbox-blank-outline"
                }
                onPress={() => {
                  setSecureTextEntry(false);
                  setAccountPass(!accountPass);
                  setTimeout(() => {
                    setSecureTextEntry(true);
                  });
                }}
                iconSize={AppFontSize.lg}
                type="plain"
                iconColor={
                  accountPass ? colors.primary.accent : colors.primary.icon
                }
                title={strings.useAccountPassword()}
                style={{
                  width: "100%",
                  alignSelf: "flex-start",
                  justifyContent: "flex-start",
                  paddingHorizontal: 0,
                  height: 30
                }}
              />
            </>
          ) : null}
        </View>

        <DialogButtons
          onPressNegative={close}
          onPressPositive={async () => {
            if (mode === "create") {
              if (!values.current.password || !values.current.confirmPassword) {
                ToastManager.error(
                  new Error(strings.allFieldsRequired()),
                  undefined,
                  "local"
                );
                return;
              }

              if (values.current.password !== values.current.confirmPassword) {
                ToastManager.error(
                  new Error(strings.mismatch(keyboardType)),
                  undefined,
                  "local"
                );
                return;
              }
              const password = values.current.password;
              setAppLockVerificationCipher(password);
              SettingsService.setProperty("appLockHasPasswordSecurity", true);
            } else if (mode === "change") {
              if (
                !values.current.currentPassword ||
                !values.current.password ||
                !values.current.confirmPassword
              ) {
                ToastManager.error(
                  new Error(strings.allFieldsRequired()),
                  undefined,
                  "local"
                );
                return;
              }

              if (values.current.password !== values.current.confirmPassword) {
                ToastManager.error(
                  new Error(strings.mismatch(keyboardType)),
                  undefined,
                  "local"
                );
                return;
              }
              const isCurrentPasswordCorrect = await validateAppLockPassword(
                values.current.currentPassword
              );

              if (!isCurrentPasswordCorrect) {
                ToastManager.error(
                  new Error(strings.incorrect(keyboardType)),
                  undefined,
                  "local"
                );
                return;
              }

              const password = values.current.password;
              await clearAppLockVerificationCipher();
              SettingsService.setProperty("appLockHasPasswordSecurity", true);
              await setAppLockVerificationCipher(password);
            } else if (mode === "remove") {
              if (!values.current.password) {
                ToastManager.error(
                  new Error(strings.allFieldsRequired()),
                  undefined,
                  "local"
                );
                return;
              }

              const isCurrentPasswordCorrect = accountPass
                ? await db.user.verifyPassword(values.current.password)
                : await validateAppLockPassword(values.current.password);

              if (!isCurrentPasswordCorrect) {
                ToastManager.error(
                  new Error(
                    accountPass
                      ? strings.passwordIncorrect()
                      : strings.incorrect(keyboardType)
                  ),
                  undefined,
                  "local"
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
                SettingsService.setPrivacyScreen(SettingsService.get());
                ToastManager.show({
                  message: strings.applockDisabled(),
                  type: "success"
                });
              }
            }

            SettingsService.setProperty(
              "applockKeyboardType",
              keyboardType === "password" ? "default" : "numeric"
            );

            close();
          }}
          positiveTitle={
            mode === "remove"
              ? strings.remove()
              : mode === "change"
              ? strings.change()
              : strings.save()
          }
          negativeTitle={strings.cancel()}
          positiveType="transparent"
          loading={false}
          doneText=""
        />
      </View>

      <Toast context="local" />
    </BaseDialog>
  );
};

AppLockPassword.present = (mode: "create" | "change" | "remove") => {
  eSendEvent(eOpenAppLockPasswordDialog, mode);
};
