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

import React from "react";
import { Platform, ScrollView, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthMode } from "../../components/auth";
import { Button } from "../../components/ui/button";
import { PressableButton } from "../../components/ui/pressable";
import Seperator from "../../components/ui/seperator";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import BiometicService from "../../services/biometrics";
import { DDS } from "../../services/device-detection";
import {
  ToastManager,
  eSendEvent,
  presentSheet
} from "../../services/event-manager";
import Navigation from "../../services/navigation";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { useUserStore } from "../../stores/use-user-store";
import { getElevationStyle } from "../../utils/elevation";
import { eOpenLoginDialog } from "../../utils/events";
import { SIZE } from "../../utils/size";
const AppLock = ({ route }) => {
  const { colors } = useThemeColors();
  const appLockMode = useSettingStore((state) => state.settings.appLockMode);
  const welcome = route?.params?.welcome;
  const deviceMode = useSettingStore((state) => state.deviceMode);

  const modes = [
    {
      title: "No privacy",
      value: "none",
      desc: "Your notes are always unlocked. Anyone who has access to your phone can read them.",
      activeColor: colors.error.paragraph,
      activeType: "error"
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
          height: !welcome ? undefined : "100%",
          width: !welcome ? undefined : "100%"
        }}
      >
        <>
          {!welcome ? (
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
                borderBottomColor: welcome
                  ? "transparent"
                  : colors.secondary.background
              }}
            >
              <Icon
                name="shield-lock"
                color={colors.secondary.icon}
                size={100}
                style={{
                  position: "absolute",
                  right: 0,
                  top: 6,
                  opacity: 0.2
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
          ) : (
            <View
              style={{
                flexGrow: 1,
                justifyContent: "flex-end",
                paddingHorizontal: 20,
                backgroundColor: colors.secondary.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.primary.border,
                alignSelf: deviceMode !== "mobile" ? "center" : undefined,
                borderWidth: deviceMode !== "mobile" ? 1 : null,
                borderColor:
                  deviceMode !== "mobile" ? colors.primary.border : null,
                borderRadius: deviceMode !== "mobile" ? 20 : null,
                marginTop: deviceMode !== "mobile" ? 50 : null,
                width: deviceMode === "mobile" ? null : "50%",
                minHeight: 180
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
                style={{
                  marginTop: 10
                }}
                extraBold
                size={SIZE.xxl}
              >
                Protect your notes
              </Heading>
              <Paragraph
                style={{
                  marginBottom: 25
                }}
              >
                Choose how you want to secure your notes locally.
              </Paragraph>
            </View>
          )}

          <Seperator />
          <ScrollView
            style={{
              paddingHorizontal: 12,
              width: DDS.isTab && welcome ? "50%" : "100%",
              alignSelf: "center",
              flexGrow: 1
            }}
          >
            {modes.map((item) => (
              <PressableButton
                key={item.title}
                type={appLockMode === item.value ? "grayBg" : "transparent"}
                onPress={async () => {
                  if (
                    !(await BiometicService.isBiometryAvailable()) &&
                    !useUserStore.getState().user &&
                    item.value !== modes[0].value
                  ) {
                    ToastManager.show({
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
                    appLockMode === item.value
                      ? item.activeColor
                      : colors.secondary.background
                }}
                style={{
                  marginBottom: 10
                }}
              >
                <Heading
                  color={
                    appLockMode === item.value
                      ? item.activeColor
                      : colors.primary.heading
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
                width={250}
                onPress={async () => {
                  eSendEvent(eOpenLoginDialog, AuthMode.welcomeSignup);
                  setTimeout(() => {
                    SettingsService.set({
                      introCompleted: true
                    });
                    Navigation.replace("Notes", {
                      canGoBack: false
                    });
                  }, 1000);
                }}
                style={{
                  paddingHorizontal: 24,
                  alignSelf: "center",
                  ...getElevationStyle(5),
                  marginTop: 30,
                  borderRadius: 100,
                  marginBottom: 30
                }}
                type="accent"
                title="Next"
              />
            )}
          </ScrollView>
        </>
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
