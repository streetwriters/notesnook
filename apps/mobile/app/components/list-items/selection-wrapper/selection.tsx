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
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import useIsSelected from "../../../hooks/use-selected";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { AppFontSize } from "../../../utils/size";
import { Item, TrashItem } from "@notesnook/core";

export const SelectionIcon = ({ item }: { item: Item }) => {
  const { colors } = useThemeColors();
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const [selected] = useIsSelected(item);

  const compactMode = useIsCompactModeEnabled(
    (item as TrashItem).itemType || item.type
  );

  return selectionMode ? (
    <View
      style={{
        width: compactMode ? 30 : 40,
        height: compactMode ? 30 : 40,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        borderWidth: 1,
        borderRadius: 100,
        borderColor: colors.primary.border
      }}
      pointerEvents="none"
    >
      {selected ? (
        <Icon
          size={compactMode ? AppFontSize.xl - 2 : AppFontSize.xl}
          color={selected ? colors.selected.accent : colors.primary.icon}
          name={"check"}
        />
      ) : null}
    </View>
  ) : null;
};
