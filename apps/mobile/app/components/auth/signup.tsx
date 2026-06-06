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
import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { clearMessage, setEmailVerifyMessage } from "../../services/message";
import Navigation from "../../services/navigation";
import { useUserStore } from "../../stores/use-user-store";
import { openLinkInBrowser } from "../../utils/functions";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Loading } from "../loading";
import { Button } from "../ui/button";
import FormInput, { createFormRef, validators } from "../ui/input/form-input";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { AuthHeader } from "./header";
import { SignupContext } from "./signup-context";
import { RouteParams } from "../../stores/use-navigation-store";
import SettingsService from "../../services/settings";
import AppIcon from "../ui/AppIcon";
import { Spacing } from "../../common/design/spacing";
import { SETTING_ACCOUNT_SVG } from "../../assets/images/assets";
import { ProgressPills } from "../intro/progress-pills";

const SignupSteps = {
  signup: 0,
  selectPlan: 1,
  createAccount: 2
};

export const Signup = ({
  changeMode,
  welcome
}: {
  changeMode: (mode: number) => void;
  welcome: boolean;
}) => {
  const [currentStep, setCurrentStep] = useState(SignupSteps.signup);
  const { colors } = useThemeColors();
  const formRef = useRef(
    createFormRef({
      email: "",
      password: "",
      confirmPassword: ""
    })
  );
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const setLastSynced = useUserStore((state) => state.setLastSynced);
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;
  const route = useRoute<RouteProp<RouteParams, "Auth">>();

  const signup = async () => {
    setErrorMessage(undefined);
    if (!formRef.current.validate()) return;
    if (loading) return;

    const values = formRef.current.getValues();

    setLoading(true);
    try {
      setCurrentStep(SignupSteps.createAccount);
      await db.user.signup(values.email.toLowerCase(), values.password);
      const user = await db.user.getUser();
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
      if (
        (e as Error).message === "Unable to create an account on this email."
      ) {
        formRef.current.setError("email", (e as Error).message);
      } else {
        setErrorMessage((e as Error).message);
      }

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
              flex: 1
            }}
            bounces={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                borderRadius: DDS.isTab ? 5 : 0,
                backgroundColor: colors.primary.background,
                zIndex: 10,
                width: "100%",
                alignSelf: "center",
                height: "100%",
                paddingHorizontal: Spacing.LEVEL_3,
                paddingTop: Spacing.LEVEL_6
              }}
            >
              <Heading
                style={{
                  paddingBottom: Spacing.LEVEL_4
                }}
                fontSize="XL"
              >
                {strings.createAccount()}
              </Heading>

              <View
                style={{
                  gap: Spacing.LEVEL_2,
                  paddingBottom: Spacing.LEVEL_4
                }}
              >
                <FormInput
                  name="email"
                  formRef={formRef}
                  fwdRef={emailInputRef}
                  loading={loading}
                  label={strings.email()}
                  testID="input.email"
                  returnKeyLabel="Next"
                  returnKeyType="next"
                  autoComplete="email"
                  keyboardType="email-address"
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  blurOnSubmit={false}
                  validators={[
                    validators.required(strings.emailRequired()),
                    validators.email(strings.enterAValidEmailAddress())
                  ]}
                  onSubmitEditing={() => {
                    passwordInputRef.current?.focus();
                  }}
                />

                <FormInput
                  name="password"
                  formRef={formRef}
                  fwdRef={passwordInputRef}
                  loading={loading}
                  testID="input.password"
                  returnKeyLabel="Next"
                  returnKeyType="next"
                  secureTextEntry
                  autoComplete="password"
                  autoCapitalize="none"
                  blurOnSubmit={false}
                  autoCorrect={false}
                  label={strings.password()}
                  placeholder="•••••••••"
                  validators={[validators.required(strings.passwordRequired())]}
                  onSubmitEditing={() => {
                    if (formRef.current.validateField("password")) return;
                    confirmPasswordInputRef.current?.focus();
                  }}
                />

                <FormInput
                  name="confirmPassword"
                  formRef={formRef}
                  fwdRef={confirmPasswordInputRef}
                  loading={loading}
                  testID="input.confirmPassword"
                  returnKeyLabel="Signup"
                  returnKeyType="done"
                  secureTextEntry
                  autoComplete="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  label={strings.confirmPassword()}
                  placeholder="•••••••••"
                  validators={[
                    validators.required(strings.confirmPasswordRequired()),
                    validators.matchField(
                      "password",
                      strings.passwordNotMatched()
                    )
                  ]}
                  onSubmitEditing={() => {
                    signup();
                  }}
                />
              </View>

              <View
                style={{
                  width: DDS.isTab ? "50%" : "100%",
                  backgroundColor: colors.primary.background,
                  flexGrow: 1,
                  alignSelf: "center",
                  gap: Spacing.LEVEL_2
                }}
              >
                <Button
                  title={!loading ? strings.continue() : null}
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
                    alignSelf: "center"
                  }}
                >
                  <Paragraph
                    style={{
                      marginBottom: 25,
                      textAlign: "center"
                    }}
                    fontSize="SM"
                    color={colors.secondary.paragraph}
                  >
                    {strings.dontHaveAccount()}{" "}
                    <Paragraph
                      fontSize="SM"
                      fontFamily="SEMI_BOLD"
                      style={{ color: colors.primary.accent }}
                    >
                      {strings.login()}
                    </Paragraph>
                  </Paragraph>
                </TouchableOpacity>

                {errorMessage ? (
                  <Paragraph
                    numberOfLines={4}
                    onPress={() => {}}
                    color={colors.error.accent}
                    style={{
                      textAlign: "center",
                      marginTop: DefaultAppStyles.GAP_VERTICAL
                    }}
                  >
                    <AppIcon
                      color={colors.error.accent}
                      name="alert-circle-outline"
                      size={AppFontSize.sm - 1}
                    />{" "}
                    {errorMessage}
                  </Paragraph>
                ) : null}
              </View>

              <View
                style={{
                  paddingHorizontal: DefaultAppStyles.GAP,
                  width: DDS.isTab ? "50%" : "100%",
                  alignSelf: "center"
                }}
              >
                <Paragraph
                  style={{
                    marginBottom: 25,
                    textAlign: "center"
                  }}
                  fontSize="XS"
                  color={colors.secondary.paragraph}
                >
                  {strings.signupAgreement[0]()}
                  <Paragraph
                    fontSize="XS"
                    onPress={() => {
                      openLinkInBrowser("https://notesnook.com/tos");
                    }}
                    fontFamily="SEMI_BOLD"
                    color={colors.primary.accent}
                  >
                    {" "}
                    {strings.signupAgreement[1]()}
                  </Paragraph>{" "}
                  {strings.signupAgreement[2]()}
                  <Paragraph
                    fontSize="XS"
                    onPress={() => {
                      openLinkInBrowser("https://notesnook.com/privacy");
                    }}
                    fontFamily="SEMI_BOLD"
                    color={colors.primary.accent}
                  >
                    {" "}
                    {strings.signupAgreement[3]()}
                  </Paragraph>
                </Paragraph>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </>
      ) : (
        <View
          style={{
            paddingHorizontal: Spacing.LEVEL_3
          }}
        >
          <ProgressPills activePillIndex={2} />
          <Loading
            title={"Setting up your account..."}
            svgSrc={SETTING_ACCOUNT_SVG}
            description="Your account is almost ready, please wait..."
            style={{
              height: undefined,
              marginTop: Spacing.LEVEL_6
            }}
          />
        </View>
      )}
    </SignupContext.Provider>
  );
};
