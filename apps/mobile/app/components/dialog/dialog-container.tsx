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
import { View, ViewProps } from "react-native";
import { DDS } from "../../services/device-detection";
import { useThemeColors } from "@notesnook/theme";
import { getElevationStyle } from "../../utils/elevation";
import { getContainerBorder } from "../../utils/colors";

const DialogContainer = ({
  width,
  height,
  style,
  ...restProps
}: ViewProps & {
  width?: any;
  height?: any;
  noBorder?: boolean;
}) => {
  const { colors } = useThemeColors();

  return (
    <View
      {...restProps}
      style={[
        style,
        {
          width: width || DDS.isTab ? 500 : "85%",
          maxHeight: height || 450,
          borderRadius: 10,
          backgroundColor: colors.primary.background,
          paddingTop: 12
        },
        restProps?.noBorder
          ? {}
          : {
              ...getElevationStyle(5),
              ...getContainerBorder(colors.secondary.background, 0.8, 0.05)
            }
      ]}
    />
  );
};

export default DialogContainer;
