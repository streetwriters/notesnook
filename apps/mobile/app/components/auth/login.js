/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { eSendEvent, ToastEvent } from "../../services/event-manager";
import { clearMessage } from "../../services/message";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import BaseDialog from "../dialog/base-dialog";
import SheetProvider from "../sheet-provider";
import { Progress } from "../sheets/progress";
import { Button } from "../ui/button";
import Input from "../ui/input";
import { SvgView } from "../ui/svg";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { SVG } from "./background";
import { hideAuth } from "./common";
import { ForgotPassword } from "./forgot-password";
import TwoFactorVerification from "./two-factor";

const LoginSteps = {
  emailAuth: 1,
  mfaAuth: 2,
  passwordAuth: 3
};

export const Login = ({ changeMode }) => {
  const colors = useThemeStore((state) => state.colors);
  const [step, setStep] = useState(LoginSteps.emailAuth);
  const email = useRef();
  const emailInputRef = useRef();
  const passwordInputRef = useRef();
  const password = useRef();
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const setUser = useUserStore((state) => state.setUser);

  const validateInfo = () => {
    if (
      (!password.current && step === LoginSteps.passwordAuth) ||
      (!email.current && step === LoginSteps.emailAuth)
    ) {
      ToastEvent.show({
        heading: "All fields required",
        message: "Fill all the fields and try again",
        type: "error",
        context: "local"
      });

      return false;
    }

    return true;
  };

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
  }, []);

  const login = async () => {
    if (!validateInfo() || error) return;
    try {
      setLoading(true);
      switch (step) {
        case LoginSteps.emailAuth: {
          const mfaInfo = await db.user.authenticateEmail(email.current);
          if (mfaInfo) {
            TwoFactorVerification.present(async (mfa, callback) => {
              try {
                const success = await db.user.authenticateMultiFactorCode(
                  mfa.code,
                  mfa.method
                );
                if (success) {
                  setStep(LoginSteps.passwordAuth);
                  setLoading(false);
                  setTimeout(() => {
                    passwordInputRef.current?.focus();
                  }, 1);
                  callback && callback(true);
                }
                callback && callback(false);
              } catch (e) {
                callback && callback(false);
                if (e.message === "invalid_grant") {
                  eSendEvent(eCloseProgressDialog, "two_factor_verify");
                  setLoading(false);
                }
              }
            }, mfaInfo);
          }
        }
        case LoginSteps.passwordAuth: {
          await db.user.authenticatePassword(email.current, password.current);
          finishLogin();
        }
      }
      setLoading(false);
    } catch (e) {
      finishWithError(e);
    }
  };

  const finishWithError = async (e) => {
    setLoading(false);
    ToastEvent.show({
      heading: user ? "Failed to sync" : "Login failed",
      message: e.message,
      type: "error",
      context: "local"
    });
  };

  const finishLogin = async () => {
    const user = await db.user.getUser();
    if (!user) throw new Error("Email or password incorrect!");
    PremiumService.setPremiumStatus();
    setUser(user);
    clearMessage();
    ToastEvent.show({
      heading: "Login successful",
      message: `Logged in as ${user.email}`,
      type: "success",
      context: "global"
    });
    hideAuth();
    SettingsService.set({
      sessionExpired: false,
      userEmailConfirmed: user?.isEmailConfirmed
    });
    eSendEvent("userLoggedIn", true);
    await sleep(500);
    Progress.present();
    setLoading(false);
  };

  return (
    <>
      <ForgotPassword />
      <SheetProvider context="two_factor_verify" />
      {loading ? (
        <BaseDialog transparent={true} visible={true} animation="fade" />
      ) : null}
      <Animated.View
        entering={FadeInDown}
        exiting={FadeOutUp}
        style={{
          borderRadius: DDS.isTab ? 5 : 0,
          backgroundColor: colors.bg,
          zIndex: 10,
          width: "100%",
          minHeight: "100%"
        }}
      >
        <View
          style={{
            height: 250,
            overflow: "hidden"
          }}
        >
          <SvgView
            src={SVG(colors.night ? colors.icon : "black")}
            height={700}
          />
        </View>
        <View
          style={{
            width: "100%",
            justifyContent: "center",
            alignSelf: "center",
            paddingHorizontal: 12,
            marginBottom: 30,
            marginTop: 15
          }}
        >
          <Heading
            style={{
              textAlign: "center"
            }}
            size={30}
            color={colors.heading}
          >
            Welcome back!
          </Heading>
          <Paragraph
            style={{
              textDecorationLine: "underline",
              textAlign: "center",
              marginTop: 5
            }}
            onPress={() => {
              changeMode(1);
            }}
            size={SIZE.md}
          >
            {"Don't have an account? Sign up"}
          </Paragraph>
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
            padding: 12,
            backgroundColor: colors.bg,
            flexGrow: 1,
            alignSelf: "center"
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
            editable={step === LoginSteps.emailAuth}
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
              marginTop: 25,
              alignSelf: "center"
            }}
          >
            <Button
              style={{
                width: 250,
                borderRadius: 100
              }}
              loading={loading}
              onPress={login}
              type="accent"
              title={
                loading
                  ? null
                  : step === LoginSteps.emailAuth
                  ? "Login to your account"
                  : "Complete login"
              }
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
          </View>
        </View>
      </Animated.View>
    </>
  );
};
