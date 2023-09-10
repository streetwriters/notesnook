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
import { Image } from "react-native";
import { getStyle } from "./functions";

export const Photo = ({ src, style = {} }) => {
  return src ? (
    <Image
      source={{ uri: src }}
      resizeMode="cover"
      style={{
        width: "100%",
        height: 200,
        alignSelf: "center",
        ...getStyle(style)
      }}
    />
  ) : null;
};
