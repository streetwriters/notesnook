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
import { DimensionValue, View, ViewStyle } from "react-native";
import { useThemeColors } from "@notesnook/theme";

const LineSeparator = ({
  style,
  paddingHorizontal,
  paddingVertical,
  stroke = 1
}: {
  style?: ViewStyle;
  paddingHorizontal?: DimensionValue;
  paddingVertical?: DimensionValue;
  stroke?: number;
}) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={[
        style,
        {
          paddingHorizontal,
          paddingVertical
        }
      ]}
    >
      <View
        style={{
          width: "100%",
          height: stroke,
          backgroundColor: colors.primary.separator
        }}
      />
    </View>
  );
};

export default LineSeparator;
