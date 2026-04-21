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
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { db } from "../../common/database";
import { Spacing } from "../../common/design/spacing";
import { DDS } from "../../services/device-detection";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import Sync from "../../services/sync";
import { RouteParams } from "../../stores/use-navigation-store";
import { useUserStore } from "../../stores/use-user-store";
import { eUserLoggedIn } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { sleep } from "../../utils/time";
import { ProgressPills } from "../intro/progress-pills";
import { Progress } from "../sheets/progress";
import { Button } from "../ui/button";
import Input from "../ui/input";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { hideAuth } from "./common";
import { ForgotPassword } from "./forgot-password";
import { AuthHeader } from "./header";
import TwoFactorVerification from "./two-factor";
import { useLogin } from "./use-login";

const LoginSteps = {
  emailAuth: 1,
  mfaAuth: 2
};

export const Login = ({
  changeMode
}: {
  changeMode: (mode: number) => void;
}) => {
  const { colors } = useThemeColors();
  const [focused, setFocused] = useState(false);
  const route = useRoute<RouteProp<RouteParams, "Auth">>();
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
    login,
    mfaData
  } = useLogin(async () => {
    eSendEvent(eUserLoggedIn, true);
    await sleep(500);
    hideAuth();
    setTimeout(() => {
      if (!useUserStore.getState().syncing) {
        Sync.run("global", false, "full");
      }
    }, 5000);

    if (!PremiumService.get() && !SettingsService.getProperty("serverUrls")) {
      Navigation.navigate("PayWall", {
        context: "signup",
        state: route.params?.state,
        canGoBack: false
      });
    } else {
      Progress.present();
    }
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
      <AuthHeader />

      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3,
          marginTop: Spacing.LEVEL_4
        }}
      >
        <ProgressPills
          count={2}
          activePillIndex={step === LoginSteps.emailAuth ? 0 : 1}
        />
      </View>

      <KeyboardAwareScrollView
        style={{
          width: "100%"
        }}
        contentContainerStyle={{
          minHeight: "99%"
        }}
        nestedScrollEnabled
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
      >
        {step === LoginSteps.emailAuth ? (
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
              {strings.loginToYourAccount()}
            </Heading>
            <View
              style={{
                width: DDS.isTab
                  ? focused
                    ? "50%"
                    : "49.99%"
                  : focused
                    ? "100%"
                    : "99.9%",
                backgroundColor: colors.primary.background,
                alignSelf: "center",
                gap: Spacing.LEVEL_2
              }}
            >
              <Input
                fwdRef={emailInputRef}
                onChangeText={(value) => {
                  email.current = value;
                }}
                label="Email"
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
                defaultValue={email.current}
                editable={step === LoginSteps.emailAuth && !loading}
                onSubmit={() => {
                  if (step === LoginSteps.emailAuth) {
                    login();
                  } else {
                    passwordInputRef.current?.focus();
                  }
                }}
              />

              <Input
                fwdRef={passwordInputRef}
                onChangeText={(value) => {
                  password.current = value;
                }}
                label="Password"
                testID="input.password"
                returnKeyLabel={strings.done()}
                returnKeyType="done"
                secureTextEntry
                autoComplete="password"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={"•••••••••"}
                editable={!loading}
                defaultValue={password.current}
                onSubmit={() => {
                  login();
                }}
              />
              <Button
                title={strings.forgotPassword()}
                style={{
                  alignSelf: "flex-end",
                  paddingVertical: 0,
                  paddingHorizontal: 0
                }}
                onPress={() => {
                  if (loading || !email.current) return;
                  presentSheet({
                    component: <ForgotPassword userEmail={email.current} />
                  });
                }}
                fontFamily="REGULAR"
                fontSize={AppFontSize.sm}
                type="plain"
              />

              <View
                style={{
                  marginTop: Spacing.LEVEL_1,
                  gap: Spacing.LEVEL_2
                }}
              >
                <Button
                  loading={loading}
                  onPress={() => {
                    if (loading) return;
                    login();
                  }}
                  style={{
                    width: "100%"
                  }}
                  type="accent"
                  title={!loading ? strings.continue() : null}
                  fontSize={AppFontSize.sm}
                />

                {/* {step === LoginSteps.passwordAuth && (
                <Button
                  title={strings.cancelLogin()}
                  style={{
                    alignSelf: "center",
                    width: "100%"
                  }}
                  onPress={() => {
                    if (loading) return;
                    setStep(LoginSteps.emailAuth);
                    setLoading(false);
                  }}
                  type="secondaryAccented"
                />
              )} */}

                {!loading ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (loading) return;
                      changeMode(1);
                    }}
                    activeOpacity={0.8}
                    style={{
                      alignSelf: "center",
                      paddingVertical: 0
                    }}
                  >
                    <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
                      {strings.dontHaveAccount()}{" "}
                      <Paragraph
                        fontSize="SM"
                        style={{ color: colors.primary.accent }}
                        fontFamily="SEMI_BOLD"
                      >
                        {strings.signUp()}
                      </Paragraph>
                    </Paragraph>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        ) : (
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
            <TwoFactorVerification
              onMfaLogin={async (
                mfa: any,
                callback: (success: boolean) => void
              ) => {
                try {
                  const success = await db.user.authenticateMultiFactorCode(
                    mfa.code,
                    mfa.method
                  );

                  await login();

                  if (success) {
                    setLoading(false);
                    callback && callback(true);
                  }
                  callback && callback(false);
                } catch (e) {
                  callback && callback(false);
                  if ((e as Error).message === "invalid_grant") {
                    setLoading(false);
                    setStep(LoginSteps.emailAuth);
                  }
                }
              }}
              mfaInfo={
                mfaData.current || {
                  primaryMethod: "email",
                  secondaryMethod: "sms",
                  token: ""
                }
              }
              onCancel={() => {
                setLoading(false);
                setStep(LoginSteps.emailAuth);
              }}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </>
  );
};
