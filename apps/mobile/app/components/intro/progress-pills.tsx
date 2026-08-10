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
import { View } from "react-native";
import { Spacing } from "../../common/design/spacing";

export const ProgressPills = (props: {
  activePillIndex: number;
  count?: number;
}) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: Spacing.LEVEL_1
      }}
    >
      {new Array(props.count || 3).fill(0).map((item, index) => (
        <View
          key={`${item}-progress-pill-${props.count}`}
          style={{
            width: props.activePillIndex === index ? 26 : 14,
            height: 5,
            backgroundColor:
              props.activePillIndex === index
                ? colors.primary.accent
                : colors.secondary.background,
            borderRadius: 2
          }}
        />
      ))}
    </View>
  );
};
