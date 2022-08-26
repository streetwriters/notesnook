import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DDS } from "../../services/device-detection";
import { eSendEvent, ToastEvent } from "../../services/event-manager";
import { clearMessage } from "../../services/message";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import { useUserStore } from "../../stores/use-user-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { db } from "../../common/database";
import { eCloseLoginDialog } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import BaseDialog from "../dialog/base-dialog";
import SheetProvider from "../sheet-provider";
import { Progress } from "../sheets/progress";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import { SvgView } from "../ui/svg";
import { BouncingView } from "../ui/transitions/bouncing-view";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { SVG } from "./background";
import { ForgotPassword } from "./forgot-password";
import TwoFactorVerification from "./two-factor";
import Animated, {
  FadeInDown,
  FadeOutDown,
  FadeOutUp
} from "react-native-reanimated";
import Navigation from "../../services/navigation";
import { hideAuth } from "./common";
export const Login = ({ changeMode, welcome }) => {
  const colors = useThemeStore((state) => state.colors);
  const email = useRef();
  const emailInputRef = useRef();
  const passwordInputRef = useRef();
  const password = useRef();
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const setUser = useUserStore((state) => state.setUser);

  const validateInfo = () => {
    if (!password.current || !email.current) {
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
      await sleep(500);
      emailInputRef.current?.focus();
      setFocused(true);
    };
  }, []);

  const login = async (mfa, callback) => {
    if (!validateInfo() || error) return;
    setLoading(true);
    let user;
    try {
      if (mfa) {
        await db.user.mfaLogin(
          email.current.toLowerCase(),
          password.current,
          mfa
        );
      } else {
        await db.user.login(email.current.toLowerCase(), password.current);
      }
      callback && callback(true);

      user = await db.user.getUser();
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
    } catch (e) {
      callback && callback(false);
      if (e.message === "Multifactor authentication required.") {
        setLoading(false);
        await sleep(300);
        TwoFactorVerification.present(async (mfa) => {
          if (mfa) {
            console.log(mfa);
            await login(mfa);
          } else {
            setLoading(false);
          }
        }, e.data);
      } else {
        setLoading(false);
        ToastEvent.show({
          heading: user ? "Failed to sync" : "Login failed",
          message: e.message,
          type: "error",
          context: "local"
        });
      }
    }
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
            Don't have an account? Sign up
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
            returnKeyLabel="Done"
            returnKeyType="done"
            secureTextEntry
            autoComplete="password"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Password"
            marginBottom={0}
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

          <View
            style={{
              // position: 'absolute',
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
              onPress={() => login()}
              //  width="100%"
              type="accent"
              title={loading ? null : "Login to your account"}
            />
          </View>
        </View>
      </Animated.View>
    </>
  );
};
