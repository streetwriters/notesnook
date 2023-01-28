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
import { DDS } from "../../services/device-detection";
import { useThemeColors } from "@notesnook/theme";
import { getElevation } from "../../utils";

const DialogContainer = ({ width, height, ...restProps }) => {
  const colors = useThemeColors();

  return (
    <View
      {...restProps}
      style={{
        ...getElevation(5),
        width: width || DDS.isTab ? 500 : "85%",
        maxHeight: height || 450,
        borderRadius: 10,
        backgroundColor: colors.primary.background,
        paddingTop: 12
      }}
    />
  );
};

export default DialogContainer;
