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
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";
import { IconButton } from "../icon-button";
import Paragraph from "../typography/paragraph";
export interface NoticeProps {
  type?: "alert" | "information";
  text: string;
  size?: "small" | "large";
  selectable?: boolean;
}

export const Notice = ({
  type = "alert",
  text,
  size = "large",
  selectable
}: NoticeProps) => {
  const colors = useThemeStore((state) => state.colors);
  const isSmall = size === "small";

  return (
    <View
      style={{
        padding: 12,
        flexDirection: "row",
        backgroundColor: colors.nav,
        borderRadius: isSmall ? 5 : 10,
        alignItems: "flex-start"
      }}
    >
      <IconButton
        size={isSmall ? SIZE.lg + 1 : SIZE.xxl}
        name={type}
        customStyle={{
          width: isSmall ? undefined : 40,
          height: isSmall ? undefined : 40,
          alignSelf: "flex-start"
        }}
        color={type === "alert" ? colors.errorText : colors.accent}
      />
      <Paragraph
        style={{
          marginLeft: 10,
          flexShrink: 1
        }}
        selectable={selectable}
        size={isSmall ? SIZE.xs + 1 : SIZE.sm}
      >
        {text}
      </Paragraph>
    </View>
  );
};
