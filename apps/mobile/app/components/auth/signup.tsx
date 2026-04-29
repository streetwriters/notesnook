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
import { SETTING_ACCOUNT_SVG } from "../../assets/images/assets";
import { db } from "../../common/database";
import { Spacing } from "../../common/design/spacing";
import { DDS } from "../../services/device-detection";
import { ToastManager } from "../../services/event-manager";
import { clearMessage, setEmailVerifyMessage } from "../../services/message";
import Navigation from "../../services/navigation";
import SettingsService from "../../services/settings";
import { RouteParams } from "../../stores/use-navigation-store";
import { useUserStore } from "../../stores/use-user-store";
import { openLinkInBrowser } from "../../utils/functions";
import { DefaultAppStyles } from "../../utils/styles";
import { ProgressPills } from "../intro/progress-pills";
import { Loading } from "../loading";
import { Button } from "../ui/button";
import Input from "../ui/input";
import {
  ErrorContainer,
  InputErrorProvider
} from "../ui/input/input-error-context";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { AuthHeader } from "./header";
import { SignupContext } from "./signup-context";

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
  const email = useRef<string>(undefined);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const password = useRef<string>(undefined);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const confirmPassword = useRef<string>(undefined);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const setLastSynced = useUserStore((state) => state.setLastSynced);
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;
  const route = useRoute<RouteProp<RouteParams, "Auth">>();

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
      await db.user.signup(email.current!.toLowerCase(), password.current!);
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
      ToastManager.show({
        heading: strings.signupFailed(),
        message: (e as Error).message,
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
              minHeight: "99%"
            }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <InputErrorProvider>
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
                  <Input
                    fwdRef={emailInputRef}
                    onChangeText={(value) => {
                      email.current = value;
                    }}
                    defaultValue={email.current}
                    label={strings.email()}
                    testID="input.email"
                    onErrorCheck={(e) => setError(e)}
                    returnKeyLabel="Next"
                    returnKeyType="next"
                    autoComplete="email"
                    validationType="email"
                    autoCorrect={false}
                    autoCapitalize="none"
                    errorMessage={strings.emailInvalid()}
                    placeholder="you@example.com"
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
                    label={strings.password()}
                    placeholder="•••••••••"
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
                    customValidator={() => password.current || ""}
                    errorMessage={strings.passwordNotMatched()}
                    label={strings.confirmPassword()}
                    placeholder="•••••••••"
                    onSubmit={() => {
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
                      alignSelf: "center"
                    }}
                  >
                    <Paragraph fontSize="SM" color={colors.primary.paragraph}>
                      {strings.alreadyHaveAccount()}{" "}
                      <Paragraph
                        fontSize="SM"
                        fontFamily="SEMI_BOLD"
                        style={{ color: colors.primary.accent }}
                      >
                        {strings.login()}
                      </Paragraph>
                    </Paragraph>
                  </TouchableOpacity>

                  <View
                    style={{
                      marginTop: Spacing.LEVEL_3,
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <ErrorContainer inputRef={emailInputRef} />
                    <ErrorContainer inputRef={confirmPasswordInputRef} />
                  </View>
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
                    color={colors.primary.paragraph}
                  >
                    {strings.signupAgreement[0]()}
                    <Paragraph
                      fontSize="XS"
                      onPress={() => {
                        openLinkInBrowser("https://notesnook.com/tos");
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
                      fontSize="XS"
                      onPress={() => {
                        openLinkInBrowser("https://notesnook.com/privacy");
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
            </InputErrorProvider>
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
