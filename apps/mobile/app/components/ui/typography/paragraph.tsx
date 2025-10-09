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
import { Text, TextProps } from "react-native";
import { AppFontSize } from "../../../utils/size";
interface ParagraphProps extends TextProps {
  color?: string;
  size?: number;
}
const Paragraph = ({
  color,
  size = AppFontSize.sm,
  style,
  ...restProps
}: ParagraphProps) => {
  const { colors } = useThemeColors();

  return (
    <Text
      {...restProps}
      style={[
        {
          fontSize: size || AppFontSize.sm,
          color: color || colors.primary.paragraph,
          fontWeight: "400",
          fontFamily: "Inter-Regular"
        },
        style
      ]}
    />
  );
};

export default Paragraph;
