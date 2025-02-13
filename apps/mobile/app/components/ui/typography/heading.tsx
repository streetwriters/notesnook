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
import { Platform, Text, TextProps, ViewStyle } from "react-native";
import { AppFontSize } from "../../../utils/size";
interface HeadingProps extends TextProps {
  color?: string;
  size?: number;
  extraBold?: boolean;
}

const extraBoldStyle = {
  fontFamily: Platform.OS === "android" ? "Inter-Bold" : undefined,
  fontWeight: Platform.OS === "ios" ? "800" : undefined
};
const boldStyle = {
  fontFamily: Platform.OS === "android" ? "Inter-SemiBold" : undefined,
  fontWeight: Platform.OS === "ios" ? "600" : undefined
};

const Heading = ({
  color,
  size = AppFontSize.xl,
  style,
  extraBold,
  ...restProps
}: HeadingProps) => {
  const { colors } = useThemeColors();

  return (
    <Text
      allowFontScaling={true}
      {...restProps}
      style={[
        {
          fontSize: size || AppFontSize.xl,
          color: color || colors.primary.heading
        },
        extraBold ? (extraBoldStyle as ViewStyle) : (boldStyle as ViewStyle),
        style
      ]}
    ></Text>
  );
};

export default Heading;
