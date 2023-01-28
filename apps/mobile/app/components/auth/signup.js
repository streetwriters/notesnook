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

import React, { useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { ToastEvent } from "../../services/event-manager";
import { clearMessage, setEmailVerifyMessage } from "../../services/message";
import PremiumService from "../../services/premium";
import { useThemeColors } from "@notesnook/theme";
import { useUserStore } from "../../stores/use-user-store";
import { openLinkInBrowser } from "../../utils/functions";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
import Input from "../ui/input";
import { SvgView } from "../ui/svg";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { SVG } from "./background";
import { hideAuth } from "./common";

export const Signup = ({ changeMode, trial }) => {
  const colors = useThemeColors();
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

  const validateInfo = () => {
    if (!password.current || !email.current || !confirmPassword.current) {
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

  const signup = async () => {
    if (!validateInfo() || error) return;
    setLoading(true);
    try {
      await db.user.signup(email.current.toLowerCase(), password.current);
      let user = await db.user.getUser();
      setUser(user);
      setLastSynced(await db.lastSynced());
      clearMessage();
      setEmailVerifyMessage();
      hideAuth();
      await sleep(300);
      if (trial) {
        PremiumService.sheet(null, null, true);
      } else {
        PremiumService.showVerifyEmailDialog();
      }
    } catch (e) {
      setLoading(false);
      ToastEvent.show({
        heading: "Signup failed",
        message: e.message,
        type: "error",
        context: "local"
      });
    }
  };

  return (
    <>
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
            marginTop: Dimensions.get("window").height < 700 ? -75 : 15
          }}
        >
          <Heading
            style={{
              textAlign: "center"
            }}
            size={30}
            color={colors.primary.heading}
          >
            Create your account
          </Heading>
          <Paragraph
            style={{
              textDecorationLine: "underline",
              textAlign: "center"
            }}
            onPress={() => {
              if (loading) return;
              changeMode(0);
            }}
            size={SIZE.md}
          >
            Already have an account? Log in
          </Paragraph>
        </View>
        <View
          style={{
            width: DDS.isTab ? "50%" : "100%",
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
            placeholder="Email"
            onSubmit={() => {
              passwordInputRef.current?.focus();
            }}
          />

          <Input
            fwdRef={passwordInputRef}
            onChangeText={(value) => {
              password.current = value;
            }}
            testID="input.password"
            onErrorCheck={(e) => setError(e)}
            returnKeyLabel="Next"
            returnKeyType="next"
            secureTextEntry
            autoComplete="password"
            autoCapitalize="none"
            validationType="password"
            autoCorrect={false}
            placeholder="Password"
            onSubmit={() => {
              confirmPasswordInputRef.current?.focus();
            }}
          />

          <Input
            fwdRef={confirmPasswordInputRef}
            onChangeText={(value) => {
              confirmPassword.current = value;
            }}
            testID="input.confirmPassword"
            onErrorCheck={(e) => setError(e)}
            returnKeyLabel="Signup"
            returnKeyType="done"
            secureTextEntry
            autoComplete="password"
            autoCapitalize="none"
            autoCorrect={false}
            validationType="confirmPassword"
            customValidator={() => password.current}
            placeholder="Confirm password"
            marginBottom={5}
            onSubmit={signup}
          />
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
                signup();
              }}
              type="accent"
              title={loading ? null : "Agree and continue"}
            />
          </View>

          <Paragraph
            style={{
              textAlign: "center",
              position: "absolute",
              bottom: 0,
              alignSelf: "center",
              marginBottom: 20
            }}
            size={SIZE.xs}
            color={colors.secondary.paragraph}
          >
            By signing up, you agree to our{" "}
            <Paragraph
              size={SIZE.xs}
              onPress={() => {
                openLinkInBrowser("https://notesnook.com/tos", colors);
              }}
              style={{
                textDecorationLine: "underline"
              }}
              color={colors.primary.accent}
            >
              terms of service{" "}
            </Paragraph>
            and{" "}
            <Paragraph
              size={SIZE.xs}
              onPress={() => {
                openLinkInBrowser("https://notesnook.com/privacy", colors);
              }}
              style={{
                textDecorationLine: "underline"
              }}
              color={colors.primary.accent}
            >
              privacy policy.
            </Paragraph>
          </Paragraph>
        </View>
      </Animated.View>
    </>
  );
};
