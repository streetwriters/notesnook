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

import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import { DDS } from "../../services/device-detection";
import { eSendEvent } from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import SheetProvider from "../sheet-provider";
import { Progress } from "../sheets/progress";
import { Button } from "../ui/button";
import Input from "../ui/input";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { hideAuth } from "./common";
import { ForgotPassword } from "./forgot-password";
import { useLogin } from "./use-login";
import { useSettingStore } from "../../stores/use-setting-store";
import { eUserLoggedIn } from "../../utils/events";
import { useUserStore } from "../../stores/use-user-store";
import Sync from "../../services/sync";

const LoginSteps = {
  emailAuth: 1,
  mfaAuth: 2,
  passwordAuth: 3
};

export const Login = ({ changeMode }) => {
  const colors = useThemeStore((state) => state.colors);
  const [focused, setFocused] = useState(false);
  const {
    step,
    setStep,
    password,
    email,
    emailInputRef,
    passwordInputRef,
    loading,
    setLoading,
    setError,
    login
  } = useLogin(async () => {
    hideAuth();
    eSendEvent(eUserLoggedIn, true);
    await sleep(500);
    Progress.present();
    setTimeout(() => {
      if (!useUserStore.getState().syncing) {
        Sync.run("global", false, true);
      }
    }, 5000);
  });
  const deviceMode = useSettingStore((state) => state.deviceMode);

  useEffect(() => {
    async () => {
      setStep(LoginSteps.emailAuth);
      await sleep(500);
      emailInputRef.current?.focus();
      setFocused(true);
    };
    return () => {
      setStep(LoginSteps.emailAuth);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ForgotPassword />
      <SheetProvider context="two_factor_verify" />
      <View
        style={{
          borderRadius: DDS.isTab ? 5 : 0,
          backgroundColor: colors.bg,
          zIndex: 10,
          width: "100%",
          alignSelf: "center",
          height: "100%",
          minHeight: "100%"
        }}
      >
        <View
          style={{
            flexGrow: 0.8,
            justifyContent: "flex-end",
            paddingHorizontal: 20,
            backgroundColor: colors.nav,
            borderBottomWidth: 1,
            marginBottom: 12,
            borderBottomColor: colors.border,
            alignSelf: deviceMode !== "mobile" ? "center" : undefined,
            borderWidth: deviceMode !== "mobile" ? 1 : null,
            borderColor: deviceMode !== "mobile" ? colors.border : null,
            borderRadius: deviceMode !== "mobile" ? 20 : null,
            marginTop: deviceMode !== "mobile" ? 50 : null,
            width: deviceMode === "mobile" ? null : "50%"
          }}
        >
          <View
            style={{
              flexDirection: "row"
            }}
          >
            <View
              style={{
                width: 100,
                height: 5,
                backgroundColor: colors.accent,
                borderRadius: 2,
                marginRight: 7
              }}
            />

            <View
              style={{
                width: 20,
                height: 5,
                backgroundColor: colors.nav,
                borderRadius: 2
              }}
            />
          </View>
          <Heading
            style={{
              marginBottom: 25,
              marginTop: 10
            }}
            extraBold
            size={SIZE.xxl}
          >
            Login to your {"\n"}account
          </Heading>
        </View>

        <View
          style={{
            width: DDS.isTab
              ? focused
                ? "50%"
                : "49.99%"
              : focused
              ? "100%"
              : "99.9%",
            backgroundColor: colors.bg,
            alignSelf: "center",
            paddingHorizontal: 20,
            flexGrow: 1
          }}
        >
          <Input
            fwdRef={emailInputRef}
            onChangeText={(value) => {
              email.current = value;
            }}
            testID="input.email"
            onErrorCheck={(e) => setError(e)}
            returnKeyLabel="Next"
            returnKeyType="next"
            autoComplete="email"
            validationType="email"
            autoCorrect={false}
            autoCapitalize="none"
            errorMessage="Email is invalid"
            placeholder="Enter your email"
            defaultValue={email.current}
            editable={step === LoginSteps.emailAuth && !loading}
            onSubmit={() => {
              passwordInputRef.current?.focus();
            }}
          />

          {step === LoginSteps.passwordAuth && (
            <>
              <Input
                fwdRef={passwordInputRef}
                onChangeText={(value) => {
                  password.current = value;
                }}
                testID="input.password"
                returnKeyLabel="Done"
                returnKeyType="done"
                secureTextEntry
                autoComplete="password"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Password"
                marginBottom={0}
                editable={!loading}
                defaultValue={password.current}
                onSubmit={() => login()}
              />
              <Button
                title="Forgot your password?"
                style={{
                  alignSelf: "flex-end",
                  height: 30,
                  paddingHorizontal: 0
                }}
                onPress={() => {
                  if (loading) return;
                  SheetManager.show("forgotpassword_sheet", email.current);
                }}
                textStyle={{
                  textDecorationLine: "underline"
                }}
                fontSize={SIZE.xs}
                type="gray"
              />
            </>
          )}

          <View
            style={{
              marginTop: 25
            }}
          >
            <Button
              loading={loading}
              onPress={() => {
                if (loading) return;
                login();
              }}
              style={{
                width: 250,
                borderRadius: 100
              }}
              fontSize={SIZE.md}
              type="accent"
              title={!loading ? "Continue" : null}
            />

            {step === LoginSteps.passwordAuth && (
              <Button
                title="Cancel logging in"
                style={{
                  alignSelf: "center",
                  height: 30,
                  marginTop: 10
                }}
                onPress={() => {
                  if (loading) return;
                  setStep(LoginSteps.emailAuth);
                  setLoading(false);
                }}
                textStyle={{
                  textDecorationLine: "underline"
                }}
                fontSize={SIZE.xs}
                type="errorShade"
              />
            )}

            {!loading ? (
              <TouchableOpacity
                onPress={() => {
                  if (loading) return;
                  changeMode(1);
                }}
                activeOpacity={0.8}
                style={{
                  alignSelf: "center",
                  marginTop: 12,
                  paddingVertical: 12
                }}
              >
                <Paragraph size={SIZE.xs + 1} color={colors.icon}>
                  Don't have an account?{" "}
                  <Paragraph
                    size={SIZE.xs + 1}
                    style={{ color: colors.accent }}
                  >
                    Sign up
                  </Paragraph>
                </Paragraph>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </>
  );
};
