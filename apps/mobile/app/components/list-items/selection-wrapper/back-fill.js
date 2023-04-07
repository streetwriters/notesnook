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
import { useEditorStore } from "../../../stores/use-editor-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import { hexToRGBA } from "../../../utils/color-scheme/utils";

export const Filler = ({ item }) => {
  const colors = useThemeStore((state) => state.colors);

  const currentEditingNote = useEditorStore(
    (state) => state.currentEditingNote
  );

  const color = "gray";

  return currentEditingNote === item.id ? (
    <View
      style={{
        position: "absolute",
        width: "110%",
        height: "150%",
        backgroundColor:
          currentEditingNote === item.id
            ? hexToRGBA(colors[color], 0.12)
            : null,
        borderLeftWidth: 5,
        borderLeftColor:
          currentEditingNote === item.id
            ? colors[item.color || "accent"]
            : "transparent"
      }}
    ></View>
  ) : null;
};
