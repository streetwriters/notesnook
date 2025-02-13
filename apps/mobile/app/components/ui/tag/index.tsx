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
import { ViewStyle } from "react-native";
import { AppFontSize } from "../../../utils/size";
import Paragraph from "../typography/paragraph";

export default function Tag({
  text,
  textColor,
  background,
  visible,
  style
}: {
  text: string;
  background?: string;
  textColor?: string;
  visible?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useThemeColors();
  return !visible ? null : (
    <Paragraph
      style={{
        backgroundColor: background || colors.primary.accent,
        borderRadius: 100,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginLeft: 2,
        marginTop: -10,
        height: 20,
        textAlignVertical: "center",
        textAlign: "center",
        ...style
      }}
      color={textColor || colors.primary.accentForeground}
      size={AppFontSize.xxs}
    >
      {text}
    </Paragraph>
  );
}
