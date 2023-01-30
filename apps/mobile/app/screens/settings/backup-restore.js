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
import { Platform, TouchableOpacity, View } from "react-native";
import Paragraph from "../../components/ui/typography/paragraph";
import Backup from "../../services/backup";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../utils/size";
export const AutomaticBackupsSelector = () => {
  const { colors } = useThemeColors();
  const settings = useSettingStore((state) => state.settings);
  const updateAskForBackup = async () => {
    SettingsService.set({
      nextBackupRequestTime: Date.now() + 86400000 * 3
    });
  };

  return (
    <View
      style={{
        flexDirection: "row",
        borderRadius: 5,
        overflow: "hidden",
        flexShrink: 1,
        width: "100%"
      }}
    >
      {[
        {
          title: "Never",
          value: "useroff"
        },
        {
          title: "Daily",
          value: "daily"
        },
        {
          title: "Weekly",
          value: "weekly"
        },
        {
          title: "Monthly",
          value: "monthly"
        }
      ].map((item, index) => (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={async () => {
            if (item.value === "useroff") {
              await SettingsService.set({ reminder: item.value });
            } else {
              await PremiumService.verify(async () => {
                if (Platform.OS === "android") {
                  let granted = await Backup.checkBackupDirExists();
                  if (!granted) {
                    return;
                  }
                }
                await SettingsService.set({ reminder: item.value });
              });
            }
            updateAskForBackup();
          }}
          key={item.value}
          style={{
            backgroundColor:
              settings.reminder === item.value ? colors.primary.accent : colors.secondary.background,
            justifyContent: "center",
            alignItems: "center",
            width: "25%",
            height: 35,
            borderRightWidth: index !== 3 ? 1 : 0,
            borderRightColor: colors.primary.border
          }}
        >
          <Paragraph
            color={settings.reminder === item.value ? "white" : colors.secondary.paragraph}
            size={SIZE.sm - 1}
          >
            {item.title}
          </Paragraph>
        </TouchableOpacity>
      ))}
    </View>
  );
};
