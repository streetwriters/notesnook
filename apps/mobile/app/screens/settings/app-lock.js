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

import React, { useState } from "react";
import { Dimensions, LayoutAnimation, Platform, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SVG_Z } from "../../components/intro";
import { WelcomeNotice } from "../../components/intro/welcome";
import { Button } from "../../components/ui/button";
import { PressableButton } from "../../components/ui/pressable";
import Seperator from "../../components/ui/seperator";
import { SvgView } from "../../components/ui/svg";
import { BouncingView } from "../../components/ui/transitions/bouncing-view";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import BiometicService from "../../services/biometrics";
import { DDS } from "../../services/device-detection";
import { presentSheet, ToastEvent } from "../../services/event-manager";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { useUserStore } from "../../stores/use-user-store";
import { getElevation } from "../../utils";
import { SIZE } from "../../utils/size";
const AppLock = ({ route }) => {
  const { colors, isDark } = useThemeColors();
  const appLockMode = useSettingStore((state) => state.settings.appLockMode);
  const [step, setStep] = useState(0);
  const welcome = route?.params?.welcome;

  const modes = [
    {
      title: "No privacy",
      value: "none",
      desc: "Your notes are always unlocked. Anyone who has access to your phone can read them.",
      activeColor: colors.error.paragraph
    },
    {
      title: "Medium privacy",
      value: "launch",
      desc: "Your notes are locked when you exit the app but remain unlocked when you switch to other apps or background.",
      activeColor: colors.primary.accent
    },
    {
      title: "Maximum privacy (Recommended)",
      value: "background",
      desc: `Your notes are locked immediately when you switch to other apps or background. ${
        Platform.OS === "ios"
          ? "App contents are hidden in app switcher"
          : "Screenshots are disabled and app contents are hidden in app switcher."
      }`,
      activeColor: colors.primary.accent
    }
  ];

  return (
    <>
      <Animated.View
        exiting={!welcome ? undefined : FadeOutUp}
        entering={!welcome ? undefined : FadeInDown}
        style={{
          justifyContent: !welcome ? undefined : "center",
          height: !welcome ? undefined : "100%",
          width: !welcome ? undefined : "100%"
        }}
      >
        {step === 0 ? (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                width: DDS.isTab && welcome ? "50%" : "95%",
                paddingVertical: 12,
                paddingHorizontal: 0,
                alignSelf: "center",
                minHeight: 125,
                borderBottomWidth: 1,
                borderBottomColor: welcome ? "transparent" : colors.secondary.background
              }}
            >
              <Icon
                name="shield-lock"
                color={colors.secondary.icon}
                size={100}
                style={{
                  position: "absolute",
                  right: 0,
                  top: 6
                }}
              />

              <View
                style={{
                  alignItems: !welcome ? undefined : "center",
                  width: "100%"
                }}
              >
                <Heading>Protect your notes</Heading>
                <Paragraph
                  style={{
                    textAlign: !welcome ? undefined : "center"
                  }}
                  size={SIZE.md}
                >
                  Choose how you want to secure your notes locally.
                </Paragraph>
              </View>
            </View>
            <Seperator />
            <View
              style={{
                paddingHorizontal: 12,
                width: DDS.isTab && welcome ? "50%" : "100%",
                alignSelf: "center"
              }}
            >
              {modes.map((item) => (
                <PressableButton
                  key={item.title}
                  type={appLockMode === item.value ? "grayBg" : "transparent"}
                  onPress={async () => {
                    if (
                      !(await BiometicService.isBiometryAvailable()) &&
                      !useUserStore.getState().user
                    ) {
                      ToastEvent.show({
                        heading: "Biometrics not enrolled",
                        type: "error",
                        message:
                          "To use app lock, you must enable biometrics such as Fingerprint lock or Face ID on your phone or create an account."
                      });
                      return;
                    }
                    SettingsService.set({ appLockMode: item.value });
                  }}
                  customStyle={{
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    marginTop: 0,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor:
                      appLockMode === item.value ? item.activeColor : colors.secondary.background
                  }}
                  style={{
                    marginBottom: 10
                  }}
                >
                  <Heading
                    color={
                      appLockMode === item.value ? item.activeColor : colors.primary.paragraph
                    }
                    style={{ maxWidth: "95%" }}
                    size={SIZE.md}
                  >
                    {item.title}
                  </Heading>
                  <Paragraph
                    color={
                      appLockMode === item.value
                        ? item.activeColor
                        : colors.secondary.paragraph
                    }
                    style={{ maxWidth: "95%" }}
                    size={SIZE.sm}
                  >
                    {item.desc}
                  </Paragraph>
                </PressableButton>
              ))}

              {welcome && (
                <Button
                  fontSize={SIZE.md}
                  height={45}
                  width={250}
                  onPress={async () => {
                    LayoutAnimation.configureNext({
                      ...LayoutAnimation.Presets.linear,
                      delete: {
                        duration: 50,
                        property: "opacity",
                        type: "linear"
                      }
                    });
                    setStep(1);
                  }}
                  style={{
                    paddingHorizontal: 24,
                    alignSelf: "center",
                    borderRadius: 100,
                    ...getElevation(5),
                    marginTop: 30
                  }}
                  type="accent"
                  title="Next"
                />
              )}
            </View>
          </>
        ) : (
          <WelcomeNotice />
        )}

        {welcome && !isDark ? (
          <BouncingView
            style={{
              position: "absolute",
              bottom: DDS.isTab ? -300 : -130,
              zIndex: -1
            }}
            animated={false}
            duration={3000}
          >
            <SvgView
              width={Dimensions.get("window").width}
              height={Dimensions.get("window").width}
              src={SVG_Z}
            />
          </BouncingView>
        ) : null}
      </Animated.View>
    </>
  );
};

AppLock.present = async (isWelcome) => {
  presentSheet({
    component: <AppLock welcome={isWelcome} s={0} />,
    disableClosing: isWelcome
  });
};

export default AppLock;
