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
import { useThemeColors } from "@notesnook/theme";
import Paragraph from "../ui/typography/paragraph";

/**
 *
 * @param {any} param0
 * @returns
 */
export const ProTag = ({ width, size, background }) => {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: background || colors.primary.background,
        borderRadius: 100,
        width: width || 60,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 2.5,
        flexDirection: "row"
      }}
    >
      <Icon
        style={{
          marginRight: 3
        }}
        size={size}
        color={colors.primary.accent}
        name="crown"
      />
      <Paragraph size={size - 1.5} color={colors.primary.accent}>
        PRO
      </Paragraph>
    </View>
  );
};
