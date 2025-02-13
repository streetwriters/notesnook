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
import { useThemeColors } from "@notesnook/theme";
import { defaultBorderRadius } from "../../utils/size";

export const SettingsPlaceholder = () => {
  const { colors } = useThemeColors();

  return (
    <View>
      <View
        style={{
          width: 100,
          height: 12,
          backgroundColor: colors.primary.shade,
          borderRadius: defaultBorderRadius,
          marginLeft: 12,
          marginBottom: 12
        }}
      />
      <View
        style={{
          width: "100%",
          height: 60,
          borderRadius: 10,
          marginBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.primary.hover,
            borderRadius: 100,
            marginRight: 20
          }}
        />
        <View>
          <View
            style={{
              width: 150,
              height: 12,
              backgroundColor: colors.secondary.background,
              borderRadius: defaultBorderRadius,
              marginBottom: 10
            }}
          />
          <View
            style={{
              width: 250,
              height: 16,
              backgroundColor: colors.secondary.background,
              borderRadius: defaultBorderRadius
            }}
          />
        </View>
      </View>

      <View
        style={{
          width: "100%",
          height: 60,
          borderRadius: 10,
          marginBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          justifyContent: "space-between"
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.primary.shade,
            borderRadius: 100,
            marginRight: 20
          }}
        />
        <View>
          <View
            style={{
              width: 150,
              height: 12,
              backgroundColor: colors.secondary.background,
              borderRadius: defaultBorderRadius,
              marginBottom: 10
            }}
          />
          <View
            style={{
              width: 250,
              height: 16,
              backgroundColor: colors.secondary.background,
              borderRadius: defaultBorderRadius
            }}
          />
        </View>

        <View
          style={{
            width: 40,
            height: 20,
            backgroundColor: colors.secondary.background,
            borderRadius: 100,
            marginLeft: 15,
            alignItems: "flex-end",
            justifyContent: "center",
            paddingHorizontal: 4
          }}
        >
          <View
            style={{
              width: 15,
              height: 15,
              backgroundColor: colors.primary.shade,
              borderRadius: 100,
              marginLeft: 15
            }}
          />
        </View>
      </View>
    </View>
  );
};
