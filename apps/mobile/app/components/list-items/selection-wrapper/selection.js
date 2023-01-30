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

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../../utils/size";

export const SelectionIcon = ({ item }) => {
  const { colors } = useThemeColors();

  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const selectedItemsList = useSelectionStore(
    (state) => state.selectedItemsList
  );
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    if (selectionMode) {
      let exists = selectedItemsList.filter(
        (o) => o.dateCreated === item.dateCreated
      );

      if (exists[0]) {
        if (!selected) {
          setSelected(true);
        }
      } else {
        if (selected) {
          setSelected(false);
        }
      }
    }
  }, [selectedItemsList, item.id, selectionMode, item.dateCreated, selected]);

  return selectionMode ? (
    <View
      style={{
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        borderWidth: 1,
        borderRadius: 100,
        borderColor: colors.primary.border
      }}
      pointerEvents="none"
    >
      <Icon
        size={SIZE.xl}
        color={selected ? colors.primary.accent : colors.primary.icon}
        name="check"
      />
    </View>
  ) : null;
};
