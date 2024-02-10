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
import {
  clearAppLockVerificationCipher,
  setAppLockVerificationCipher,
  validateAppLockPassword
} from "../../../common/database/encryption";
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
import { SIZE } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import BaseDialog from "../../dialog/base-dialog";
import DialogButtons from "../../dialog/dialog-buttons";
import DialogHeader from "../../dialog/dialog-header";
import { Toast } from "../../toast";
import { IconButton } from "../../ui/icon-button";
import Input from "../../ui/input";
import Seperator from "../../ui/seperator";
import { useUserStore } from "../../../stores/use-user-store";
import BiometicService from "../../../services/biometrics";

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

  useEffect(() => {
    const subs = [
      eSubscribeEvent(
        eOpenAppLockPasswordDialog,
        (mode: "create" | "change" | "remove") => {
          setMode(mode);
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

  return (
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
          title={
            mode === "change"
              ? `Change app lock ${keyboardType}`
              : mode === "remove"
              ? `Remove app lock ${keyboardType}`
              : `Set up app lock ${keyboardType}`
          }
          paragraph={
            mode === "change"
              ? `Change app lock ${keyboardType}`
              : mode === "remove"
              ? `Remove app lock ${keyboardType}`
              : `Set up a custom app lock ${keyboardType} to unlock the app`
          }
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
              returnKeyLabel="Next"
              keyboardType={keyboardType === "pin" ? "number-pad" : "default"}
              returnKeyType="next"
              secureTextEntry={secureTextEntry}
              placeholder={`Current ${keyboardType}`}
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
            keyboardType={keyboardType === "pin" ? "number-pad" : "default"}
            autoComplete="password"
            returnKeyLabel={mode !== "remove" ? "Next" : "Remove"}
            returnKeyType={mode !== "remove" ? "next" : "done"}
            secureTextEntry={secureTextEntry}
            buttonLeft={
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
                customStyle={{
                  width: 25,
                  height: 25,
                  marginRight: 5
                }}
                size={SIZE.lg}
              />
            }
            placeholder={
              mode === "change"
                ? `New ${keyboardType}`
                : `${keyboardType === "pin" ? "Pin" : "Password"}`
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
              returnKeyLabel="Done"
              returnKeyType="done"
              secureTextEntry={secureTextEntry}
              placeholder={`Confirm ${keyboardType}`}
            />
          ) : null}
        </View>

        <DialogButtons
          onPressNegative={close}
          onPressPositive={async () => {
            if (mode === "create") {
              if (!values.current.password || !values.current.confirmPassword) {
                ToastManager.error(
                  new Error("All inputs are required"),
                  undefined,
                  "local"
                );
                return;
              }

              if (values.current.password !== values.current.confirmPassword) {
                ToastManager.error(
                  new Error(
                    `${
                      keyboardType === "pin" ? "Pin" : "Password"
                    } does not match`
                  ),
                  undefined,
                  "local"
                );
                return;
              }
              await setAppLockVerificationCipher(values.current.password);
              SettingsService.setProperty("appLockHasPasswordSecurity", true);
            } else if (mode === "change") {
              if (
                !values.current.currentPassword ||
                !values.current.password ||
                !values.current.confirmPassword
              ) {
                ToastManager.error(
                  new Error("All inputs are required"),
                  undefined,
                  "local"
                );
                return;
              }

              if (values.current.password !== values.current.confirmPassword) {
                ToastManager.error(
                  new Error(
                    `${
                      keyboardType === "pin" ? "Pin" : "Password"
                    } does not match`
                  ),
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
                  new Error(
                    `${keyboardType === "pin" ? "Pin" : "Password"} incorrect`
                  ),
                  undefined,
                  "local"
                );
                return;
              }

              SettingsService.setProperty("appLockHasPasswordSecurity", true);
              await setAppLockVerificationCipher(values.current.password);
            } else if (mode === "remove") {
              if (!values.current.password) {
                ToastManager.error(
                  new Error("All inputs are required"),
                  undefined,
                  "local"
                );
                return;
              }

              const isCurrentPasswordCorrect = await validateAppLockPassword(
                values.current.password
              );

              if (!isCurrentPasswordCorrect) {
                ToastManager.error(
                  new Error(
                    `${keyboardType === "pin" ? "Pin" : "Password"} incorrect`
                  ),
                  "local"
                );
                return;
              }
              clearAppLockVerificationCipher();
              SettingsService.setProperty("appLockHasPasswordSecurity", false);

              if (!useUserStore.getState().user) {
                if (
                  !(await BiometicService.isBiometryAvailable()) ||
                  !SettingsService.getProperty("biometricsAuthEnabled")
                ) {
                  SettingsService.setProperty("appLockEnabled", false);
                }
              }
            }

            SettingsService.setProperty(
              "applockKeyboardType",
              keyboardType === "password" ? "default" : "numeric"
            );

            close();
          }}
          positiveTitle="Save"
          negativeTitle="Cancel"
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
