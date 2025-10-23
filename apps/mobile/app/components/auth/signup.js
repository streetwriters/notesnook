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
import { useRoute } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import { TouchableOpacity, View, useWindowDimensions } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { ToastManager } from "../../services/event-manager";
import { clearMessage, setEmailVerifyMessage } from "../../services/message";
import Navigation from "../../services/navigation";
import { useUserStore } from "../../stores/use-user-store";
import { openLinkInBrowser } from "../../utils/functions";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Loading } from "../loading";
import { Button } from "../ui/button";
import Input from "../ui/input";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { AuthHeader } from "./header";
import { SignupContext } from "./signup-context";
import SettingsService from "../../services/settings";

const SignupSteps = {
  signup: 0,
  selectPlan: 1,
  createAccount: 2
};

export const Signup = ({ changeMode, welcome }) => {
  const [currentStep, setCurrentStep] = useState(SignupSteps.signup);
  const { colors } = useThemeColors();
  const email = useRef();
  const emailInputRef = useRef();
  const passwordInputRef = useRef();
  const password = useRef();
  const confirmPasswordInputRef = useRef();
  const confirmPassword = useRef();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const setLastSynced = useUserStore((state) => state.setLastSynced);
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;
  const route = useRoute();

  const validateInfo = () => {
    if (!password.current || !email.current || !confirmPassword.current) {
      ToastManager.show({
        heading: strings.allFieldsRequired(),
        message: strings.allFieldsRequiredDesc(),
        type: "error",
        context: "local"
      });

      return false;
    }

    return true;
  };

  const signup = async () => {
    if (!validateInfo() || error) return;
    if (loading) return;

    setLoading(true);
    try {
      setCurrentStep(SignupSteps.createAccount);
      await db.user.signup(email.current.toLowerCase(), password.current);
      let user = await db.user.getUser();
      setUser(user);
      setLastSynced(await db.lastSynced());
      clearMessage();
      setEmailVerifyMessage();
      if (!SettingsService.getProperty("serverUrls")) {
        Navigation.navigate("PayWall", {
          canGoBack: false,
          state: route.params.state,
          context: "signup"
        });
      }
      return true;
    } catch (e) {
      setCurrentStep(SignupSteps.signup);
      setLoading(false);
      ToastManager.show({
        heading: strings.signupFailed(),
        message: e.message,
        type: "error",
        context: "local"
      });
      return false;
    }
  };

  return (
    <SignupContext.Provider
      value={{
        signup: signup
      }}
    >
      {currentStep === SignupSteps.signup ? (
        <>
          <AuthHeader welcome={welcome} />
          <KeyboardAwareScrollView
            style={{
              width: "100%"
            }}
            contentContainerStyle={{
              minHeight: "90%"
            }}
            nestedScrollEnabled
            enableAutomaticScroll={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                borderRadius: DDS.isTab ? 5 : 0,
                backgroundColor: colors.primary.background,
                zIndex: 10,
                width: "100%",
                alignSelf: "center",
                height: "100%"
              }}
            >
              <View
                style={{
                  justifyContent: "flex-end",
                  paddingHorizontal: 16,
                  marginBottom: DefaultAppStyles.GAP_VERTICAL,
                  borderBottomWidth: 0.8,
                  borderBottomColor: colors.primary.border,
                  alignSelf: isTablet ? "center" : undefined,
                  borderWidth: isTablet ? 1 : null,
                  borderColor: isTablet ? colors.primary.border : null,
                  borderRadius: isTablet ? 20 : null,
                  marginTop: isTablet ? 50 : null,
                  width: !isTablet ? null : "50%",
                  minHeight: height * 0.25
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
                      backgroundColor: colors.primary.accent,
                      borderRadius: 2,
                      marginRight: 7
                    }}
                  />

                  <View
                    style={{
                      width: 20,
                      height: 5,
                      backgroundColor: colors.secondary.background,
                      borderRadius: 2
                    }}
                  />
                </View>
                <Heading
                  extraBold
                  style={{
                    marginBottom: 25,
                    marginTop: 10
                  }}
                  size={AppFontSize.xxl}
                >
                  {strings.createAccount()}
                </Heading>
              </View>

              <View
                style={{
                  width: DDS.isTab ? "50%" : "100%",
                  paddingHorizontal: DDS.isTab ? 0 : 16,
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
                  defaultValue={email.current}
                  testID="input.email"
                  onErrorCheck={(e) => setError(e)}
                  returnKeyLabel="Next"
                  returnKeyType="next"
                  autoComplete="email"
                  validationType="email"
                  autoCorrect={false}
                  autoCapitalize="none"
                  errorMessage={strings.emailInvalid()}
                  placeholder={strings.email()}
                  blurOnSubmit={false}
                  onSubmit={() => {
                    if (!email.current) return;
                    passwordInputRef.current?.focus();
                  }}
                />

                <Input
                  fwdRef={passwordInputRef}
                  onChangeText={(value) => {
                    password.current = value;
                  }}
                  defaultValue={password.current}
                  testID="input.password"
                  onErrorCheck={(e) => setError(e)}
                  returnKeyLabel="Next"
                  returnKeyType="next"
                  secureTextEntry
                  autoComplete="password"
                  autoCapitalize="none"
                  blurOnSubmit={false}
                  validationType="password"
                  autoCorrect={false}
                  placeholder={strings.password()}
                  onSubmit={() => {
                    if (!password.current) return;
                    confirmPasswordInputRef.current?.focus();
                  }}
                />

                <Input
                  fwdRef={confirmPasswordInputRef}
                  onChangeText={(value) => {
                    confirmPassword.current = value;
                  }}
                  defaultValue={confirmPassword.current}
                  testID="input.confirmPassword"
                  onErrorCheck={(e) => setError(e)}
                  returnKeyLabel="Signup"
                  returnKeyType="done"
                  secureTextEntry
                  autoComplete="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  validationType="confirmPassword"
                  customValidator={() => password.current}
                  placeholder={strings.confirmPassword()}
                  marginBottom={12}
                  onSubmit={signup}
                />

                <Button
                  title={!loading ? "Continue" : null}
                  type="accent"
                  loading={loading}
                  onPress={() => {
                    signup();
                  }}
                  width="100%"
                />

                <TouchableOpacity
                  onPress={() => {
                    if (loading) return;
                    changeMode(0);
                  }}
                  activeOpacity={0.8}
                  style={{
                    alignSelf: "center",
                    marginTop: 12,
                    paddingVertical: 12
                  }}
                >
                  <Paragraph
                    size={AppFontSize.xs + 1}
                    color={colors.secondary.paragraph}
                  >
                    {strings.alreadyHaveAccount()}{" "}
                    <Paragraph
                      size={AppFontSize.xs + 1}
                      style={{ color: colors.primary.accent }}
                    >
                      {strings.login()}
                    </Paragraph>
                  </Paragraph>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  paddingHorizontal: DefaultAppStyles.GAP
                }}
              >
                <Paragraph
                  style={{
                    marginBottom: 25,
                    textAlign: "center"
                  }}
                  size={AppFontSize.xxs}
                  color={colors.secondary.paragraph}
                >
                  {strings.signupAgreement[0]()}
                  <Paragraph
                    size={AppFontSize.xxs}
                    onPress={() => {
                      openLinkInBrowser("https://notesnook.com/tos", colors);
                    }}
                    style={{
                      textDecorationLine: "underline"
                    }}
                    color={colors.primary.accent}
                  >
                    {" "}
                    {strings.signupAgreement[1]()}
                  </Paragraph>{" "}
                  {strings.signupAgreement[2]()}
                  <Paragraph
                    size={AppFontSize.xxs}
                    onPress={() => {
                      openLinkInBrowser(
                        "https://notesnook.com/privacy",
                        colors
                      );
                    }}
                    style={{
                      textDecorationLine: "underline"
                    }}
                    color={colors.primary.accent}
                  >
                    {" "}
                    {strings.signupAgreement[3]()}
                  </Paragraph>{" "}
                  {strings.signupAgreement[4]()}
                </Paragraph>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </>
      ) : (
        <>
          <Loading
            title={"Setting up your account..."}
            description="Your account is almost ready, please wait..."
          />
        </>
      )}
    </SignupContext.Provider>
  );
};
