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
import { View, ViewStyle } from "react-native";
import { getContainerBorder } from "../../../utils/colors";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import AppIcon from "../AppIcon";
import Paragraph from "../typography/paragraph";

export interface NoticeProps {
  type?: "alert" | "information";
  text: string;
  size?: "small" | "large";
  selectable?: boolean;
  style?: ViewStyle;
}

export const Notice = ({
  type = "alert",
  text,
  size = "large",
  selectable,
  style
}: NoticeProps) => {
  const { colors } = useThemeColors();
  const isSmall = size === "small";

  return (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        paddingLeft: 5,
        paddingVertical: DefaultAppStyles.GAP_VERTICAL,
        flexDirection: "row",
        backgroundColor: colors.secondary.background,
        borderRadius: isSmall ? 5 : 10,
        alignItems: "flex-start",
        gap: 5,
        ...getContainerBorder(colors.secondary.background),
        ...style
      }}
    >
      <AppIcon
        size={isSmall ? AppFontSize.md + 2 : AppFontSize.xxl}
        name={type}
        color={type === "alert" ? colors.error.icon : colors.primary.accent}
      />
      <Paragraph
        style={{
          flexShrink: 1
        }}
        selectable={selectable}
        size={isSmall ? AppFontSize.xs : AppFontSize.sm}
      >
        {text}
      </Paragraph>
    </View>
  );
};
