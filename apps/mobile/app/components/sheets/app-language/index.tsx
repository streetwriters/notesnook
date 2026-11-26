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

import { AVAILABLE_LANGUAGES, strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { useWindowDimensions, View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import RNRestart from "react-native-restart";
import { Radius, Spacing } from "../../../common/design/spacing";
import { initLocale } from "../../../common/locale";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { useSettingStore } from "../../../stores/use-setting-store";
import { eCloseSimpleDialog } from "../../../utils/events";
import { presentDialog } from "../../dialog/functions";
import AppIcon from "../../ui/AppIcon";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

const AUTO = "auto";

const getOptions = () => [
  { code: AUTO, label: strings.auto() },
  ...AVAILABLE_LANGUAGES.map((language) => ({
    code: language.code,
    label: `${language.label} (${language.nativeLabel})`
  }))
];

export const formatAppLanguage = (code?: string) => {
  if (!code || code === AUTO) return strings.auto();
  const language = AVAILABLE_LANGUAGES.find((l) => l.code === code);
  return language ? `${language.label} (${language.nativeLabel})` : code;
};

type AppLanguageProps = {
  close?: (ctx?: string) => void;
};

function AppLanguage({ close }: AppLanguageProps) {
  const { colors } = useThemeColors();
  const { height } = useWindowDimensions();
  const currentValue = useSettingStore(
    (state) => state.settings.appLanguage || AUTO
  );

  const onChange = (code: string) => {
    const currentLanguage = useSettingStore.getState().settings.appLanguage || "";
    const newLanguage = code === AUTO ? "" : code;
    close?.();
    if (newLanguage === currentLanguage) return;

    setTimeout(() => {
      presentDialog({
        title: strings.changeLanguage(),
        paragraph: strings.restartAppToApplyChanges(),
        positiveText: strings.restartNow(),
        negativeText: strings.cancel(),
        positivePress: async () => {
          eSendEvent(eCloseSimpleDialog);
          SettingsService.setProperty("appLanguage", newLanguage);
          initLocale();
          // restarting early causes appLanguage value to not get saved.
          setTimeout(() => RNRestart.restart(), 100);
          return true;
        }
      });
    }, 300);
  };

  return (
    <ScrollView
      style={{
        maxHeight: height * 0.8
      }}
    >
      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: Spacing.LEVEL_1,
            paddingTop: Spacing.LEVEL_2
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: Radius.XS,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondary.background
            }}
          >
            <AppIcon name="translate" size={16} color={colors.primary.icon} />
          </View>

          <View
            style={{
              flex: 1,
              gap: Spacing.LEVEL_1
            }}
          >
            <Heading fontSize="XL" lineHeight="100%">
              {strings.selectLanguage()}
            </Heading>
            <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
              {strings.changeLanguage()}
            </Paragraph>
          </View>
        </View>
      </View>

      <View
        style={{
          width: "100%",
          backgroundColor: colors.primary.background,
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
          paddingHorizontal: Spacing.LEVEL_3,
          paddingTop: Spacing.LEVEL_2,
          gap: Spacing.LEVEL_2
        }}
      >
        {getOptions().map((item) => {
          const selected = currentValue === item.code;
          return (
            <Pressable
              key={item.code}
              type={selected ? "selected" : "transparent"}
              onPress={() => onChange(item.code)}
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: Spacing.LEVEL_2,
                borderRadius: Radius.XS,
                borderWidth: selected ? 0 : 1,
                borderColor: colors.primary.border
              }}
            >
              <Heading
                fontFamily="MEDIUM"
                fontSize="SM"
                lineHeight="100%"
                color={colors.primary.heading}
              >
                {item.label}
              </Heading>

              <AppIcon
                name={selected ? "radio-button" : "ellipse"}
                iconFamily="notesnook"
                size={16}
                color={
                  selected
                    ? [colors.selected.accent, colors.static.white]
                    : colors.secondary.icon
                }
              />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

AppLanguage.present = () => {
  presentSheet({
    component: (_ref, close) => <AppLanguage close={close} />
  });
};

export default AppLanguage;
