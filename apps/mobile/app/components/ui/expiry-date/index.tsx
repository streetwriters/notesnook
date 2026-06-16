/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import { Note } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { TextStyle, ViewStyle } from "react-native";
import { AppFontSize, defaultBorderRadius } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { Button, ButtonProps } from "../button";
import dayjs from "dayjs";

export const ExpiryDate = ({
  note,
  color,
  style,
  textStyle,
  iconSize,
  short,
  ...props
}: {
  note: Note;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  short?: boolean;
} & ButtonProps) => {
  const { colors } = useThemeColors();
  const expiryValue = note?.expiryDate?.value;
  if (!expiryValue) return null;

  const formattedDate = dayjs(expiryValue).format("DD MMM YYYY");

  return (
    <Button
      title={formattedDate}
      icon="bomb"
      fontSize={textStyle?.fontSize || AppFontSize.xs}
      iconSize={iconSize || AppFontSize.sm}
      type="secondary"
      textStyle={{
        marginRight: 0,
        ...textStyle
      }}
      style={{
        height: "auto",
        borderRadius: defaultBorderRadius,
        borderColor: colors.primary.border,
        paddingHorizontal: DefaultAppStyles.GAP_SMALL,
        ...(style as ViewStyle)
      }}
      {...props}
    />
  );
};
