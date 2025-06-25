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

import { Item } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import useIsSelected from "../../../hooks/use-selected";
import { useTabStore } from "../../../screens/editor/tiptap/use-tab-store";

export const Filler = ({ item, color }: { item: Item; color?: string }) => {
  const { colors } = useThemeColors();
  const isEditingNote = useTabStore(
    (state) =>
      state.tabs.find((t) => t.id === state.currentTab)?.session?.noteId ===
      item.id
  );

  const [selected] = useIsSelected(item);

  return isEditingNote || selected ? (
    <View
      style={{
        position: "absolute",
        width: "110%",
        height: "100%",
        backgroundColor: colors.selected.accent
        // borderLeftWidth: 5,
        // borderLeftColor: isEditingNote
        //   ? color
        //     ? color
        //     : colors.selected.accent
        //   : "transparent"
      }}
    />
  ) : null;
};
