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
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Pressable } from "../../components/ui/pressable";
import { DDS } from "../../services/device-detection";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import { useThemeColors } from "@notesnook/theme";
import {
  RGB_Linear_Shade,
  hexToRGBA,
  switchAccentColor
} from "../../utils/colors";
import { AppFontSize } from "../../utils/size";

export const AccentColorPicker = () => {
  const { colors, isDark } = useThemeColors();
  function changeAccentColor(color) {
    switchAccentColor(color);
  }

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        width: "100%"
      }}
    >
      {[
        "#FF5722",
        "#FFA000",
        "#1B5E20",
        "#008837",
        "#757575",
        "#0560ff",
        "#009688",
        "#2196F3",
        "#880E4F",
        "#9C27B0",
        "#FF1744",
        "#B71C1C"
      ].map((item) => (
        <Pressable
          key={item}
          customColor={
            colors.primary.accent === item
              ? RGB_Linear_Shade(!isDark ? -0.2 : 0.2, hexToRGBA(item, 1))
              : item
          }
          customSelectedColor={item}
          alpha={!isDark ? -0.1 : 0.1}
          opacity={1}
          onPress={async () => {
            await PremiumService.verify(async () => {
              changeAccentColor(item);
              SettingsService.set({
                theme: {
                  accent: item,
                  dark: SettingsService.get().theme.dark
                }
              });
            });
          }}
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
            marginVertical: 5,
            width: DDS.isLargeTablet() ? 40 : 50,
            height: DDS.isLargeTablet() ? 40 : 50,
            borderRadius: 100
          }}
        >
          {colors.primary.accent === item ? (
            <Icon
              size={DDS.isLargeTablet() ? AppFontSize.lg : AppFontSize.xxl}
              color="white"
              name="check"
            />
          ) : null}
        </Pressable>
      ))}
      <View style={{ width: 50 }} />
    </View>
  );
};
