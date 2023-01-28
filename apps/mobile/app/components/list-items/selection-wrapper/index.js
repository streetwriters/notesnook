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

import React, { useRef } from "react";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { PressableButton } from "../../ui/pressable";
import { Filler } from "./back-fill";
import { SelectionIcon } from "./selection";

const SelectionWrapper = ({
  children,
  item,
  background,
  onLongPress,
  onPress,
  testID,
  isSheet
}) => {
  const itemId = useRef(item.id);
  const colors = useThemeColors();
  const notebooksListMode = useSettingStore(
    (state) => state.settings.notebooksListMode
  );
  const notesListMode = useSettingStore(
    (state) => state.settings.notesListMode
  );
  const listMode = item.type === "notebook" ? notebooksListMode : notesListMode;
  const compactMode =
    (item.type === "notebook" || item.type === "note") &&
    listMode === "compact";

  if (item.id !== itemId.current) {
    itemId.current = item.id;
  }

  const _onLongPress = () => {
    if (!useSelectionStore.getState().selectionMode) {
      useSelectionStore.getState().setSelectionMode(true);
    }
    useSelectionStore.getState().setSelectedItem(item);
  };

  const _onPress = async () => {
    await onPress();
  };
  return (
    <PressableButton
      customColor={isSheet ? colors.primary.hover : "transparent"}
      testID={testID}
      onLongPress={_onLongPress}
      onPress={_onPress}
      customSelectedColor={colors.primary.hover}
      customAlpha={!colors.isDark ? -0.02 : 0.02}
      customOpacity={1}
      customStyle={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        overflow: "hidden",
        paddingHorizontal: 12,
        paddingVertical: compactMode ? 8 : 12,
        borderRadius: isSheet ? 10 : 0,
        marginBottom: isSheet ? 12 : undefined
      }}
    >
      {item.type === "note" ? (
        <Filler background={background} item={item} />
      ) : null}
      <SelectionIcon
        compactMode={compactMode}
        item={item}
        onLongPress={onLongPress}
      />
      {children}
    </PressableButton>
  );
};

export default SelectionWrapper;
