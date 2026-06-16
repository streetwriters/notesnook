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
import { Radius, Spacing } from "../../../common/design/spacing";
import { getContainerBorder } from "../../../utils/colors";
import { AppFontSize } from "../../../utils/size";
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
        padding: Spacing.LEVEL_2,
        flexDirection: "row",
        backgroundColor:
          type === "information"
            ? colors.primary.shade
            : colors.secondary.background,
        borderRadius: Radius.S,
        alignItems: "flex-start",
        gap: Spacing.LEVEL_1,
        ...getContainerBorder(colors.secondary.background),
        ...style
      }}
    >
      <View
        style={{
          borderRadius: 100,
          backgroundColor: colors.primary.accent,
          width: 20,
          height: 20,
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <AppIcon
          size={12}
          name={type === "information" ? "warning-circle" : type}
          iconFamily="notesnook"
          color={
            type === "alert"
              ? colors.error.icon
              : colors.primary.accentForeground
          }
        />
      </View>
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
