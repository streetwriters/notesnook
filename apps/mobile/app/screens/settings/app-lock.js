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

import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { Platform, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Pressable } from "../../components/ui/pressable";
import Seperator from "../../components/ui/seperator";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import BiometricService from "../../services/biometrics";
import { ToastManager, presentSheet } from "../../services/event-manager";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useUserStore } from "../../stores/use-user-store";
import { AppFontSize } from "../../utils/size";
import { strings } from "@notesnook/intl";
const AppLock = () => {
  const { colors } = useThemeColors();
  const appLockMode = useSettingStore((state) => state.settings.appLockMode);

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
      <Animated.View>
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              width: "95%",
              paddingVertical: 12,
              paddingHorizontal: 0,
              alignSelf: "center",
              minHeight: 125,
              borderBottomWidth: 1,
              borderBottomColor: colors.primary.border
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
                width: "100%"
              }}
            >
              <Heading>{strings.protectNotes()}</Heading>
              <Paragraph size={AppFontSize.md}>
                {strings.protectNotesDesc()}
              </Paragraph>
            </View>
          </View>

          <Seperator />
          <ScrollView
            style={{
              paddingHorizontal: 12,
              width: "100%",
              alignSelf: "center",
              flexGrow: 1
            }}
          >
            {modes.map((item) => (
              <Pressable
                key={item.title}
                type={appLockMode === item.value ? "secondary" : "transparent"}
                onPress={async () => {
                  if (
                    !(await BiometricService.isBiometryAvailable()) &&
                    !useUserStore.getState().user &&
                    item.value !== modes[0].value &&
                    !SettingsService.getProperty("appLockHasPasswordSecurity")
                  ) {
                    ToastManager.show({
                      heading: "Biometrics not enrolled",
                      type: "error",
                      message:
                        "To use app lock, you must enable biometrics such as Fingerprint lock or Face ID on your phone or create an account."
                    });
                    return;
                  }

                  if (
                    !SettingsService.getProperty(
                      "appLockHasPasswordSecurity"
                    ) &&
                    item.value !== modes[0].value
                  ) {
                    const verified = await BiometricService.validateUser(
                      "Verify it's you"
                    );
                    if (verified) {
                      SettingsService.setProperty(
                        "biometricsAuthEnabled",
                        true
                      );
                    } else {
                      return;
                    }
                  }

                  SettingsService.set({ appLockMode: item.value });
                }}
                style={{
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
              >
                <Heading
                  color={
                    appLockMode === item.value
                      ? item.activeColor
                      : colors.primary.heading
                  }
                  style={{ maxWidth: "95%" }}
                  size={AppFontSize.md}
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
                  size={AppFontSize.sm}
                >
                  {item.desc}
                </Paragraph>
              </Pressable>
            ))}
          </ScrollView>
        </>
      </Animated.View>
    </>
  );
};

AppLock.present = async () => {
  presentSheet({
    component: <AppLock />
  });
};

export default AppLock;
