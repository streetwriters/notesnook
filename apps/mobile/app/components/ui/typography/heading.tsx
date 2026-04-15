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
import { Text, TextProps, ViewStyle } from "react-native";
import { AppFontSize } from "../../../utils/size";
import { FontFamily, FontSizes } from "../../../common/design/font";

interface HeadingProps extends TextProps {
  color?: string;
  /**
   * @deprecated Use fontSize prop instead
   */
  size?: number;
  extraBold?: boolean;
  fontSize?: keyof typeof FontSizes;
  fontFamily?: keyof typeof FontFamily;
}

const extraBoldStyle = {
  fontFamily: FontFamily.BOLD
};
const boldStyle = {
  fontFamily: FontFamily.SEMI_BOLD
};

const Heading = ({
  color,
  size = AppFontSize.xl,
  style,
  extraBold,
  fontSize,
  fontFamily,
  ...restProps
}: HeadingProps) => {
  const { colors } = useThemeColors();

  return (
    <Text
      {...restProps}
      allowFontScaling={true}
      style={[
        {
          fontSize: fontSize ? FontSizes[fontSize] : size || AppFontSize.xl,
          color: color || colors.primary.heading
        },
        fontFamily
          ? { fontFamily: FontFamily[fontFamily] }
          : extraBold
            ? (extraBoldStyle as ViewStyle)
            : (boldStyle as ViewStyle),
        style
      ]}
    />
  );
};

export default Heading;
