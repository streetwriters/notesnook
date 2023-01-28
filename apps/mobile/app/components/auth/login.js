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
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { DDS } from "../../services/device-detection";
import { eSendEvent } from "../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
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
import { useLogin } from "./use-login";

const LoginSteps = {
  emailAuth: 1,
  mfaAuth: 2,
  passwordAuth: 3
};

export const Login = ({ changeMode }) => {
  const colors = useThemeColors();
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
    eSendEvent("userLoggedIn", true);
    await sleep(500);
    Progress.present();
  });

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
      <Animated.View
        entering={FadeInDown}
        exiting={FadeOutUp}
        style={{
          borderRadius: DDS.isTab ? 5 : 0,
          backgroundColor: colors.primary.background,
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
            src={SVG(colors.primary.icon)}
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
            color={colors.primary.heading}
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
              if (loading) return;
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
            backgroundColor: colors.primary.background,
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
              onPress={() => {
                if (loading) return;
                login();
              }}
              type="accent"
              title={
                loading
                  ? null
                  : step === LoginSteps.emailAuth
                  ? "Login"
                  : "Continue"
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
          </View>
        </View>
      </Animated.View>
    </>
  );
};
