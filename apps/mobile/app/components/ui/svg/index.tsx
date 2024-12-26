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
import { DimensionValue, View } from "react-native";
import { SvgXml } from "./lazy";
export const SvgView = ({
  width = 250,
  height = 250,
  src
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  src?: string;
}) => {
  if (!src) return null;
  return (
    <View
      style={{
        height: width || 250,
        width: height || 250
      }}
    >
      <SvgXml xml={src} width="100%" height="100%" />
    </View>
  );
};
