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
import { getContainerBorder } from "../../../utils/colors";
import { View, ViewStyle } from "react-native";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../../utils/size";
import { IconButton } from "../icon-button";
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
        padding: 12,
        flexDirection: "row",
        backgroundColor: colors.secondary.background,
        borderRadius: isSmall ? 5 : 10,
        alignItems: "flex-start",
        ...getContainerBorder(colors.secondary.background),
        ...style
      }}
    >
      <IconButton
        size={isSmall ? AppFontSize.lg + 1 : AppFontSize.xxl}
        name={type}
        style={{
          width: isSmall ? undefined : 40,
          height: isSmall ? undefined : 40,
          alignSelf: "flex-start"
        }}
        color={type === "alert" ? colors.error.icon : colors.primary.accent}
      />
      <Paragraph
        style={{
          marginLeft: 10,
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
