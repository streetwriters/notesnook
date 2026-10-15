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

import { Item, TrashItem } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { PropsWithChildren, useRef } from "react";
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import { useTabStore } from "../../../screens/editor/tiptap/use-tab-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { Pressable } from "../../ui/pressable";
import { View, ViewStyle } from "react-native";
import { Spacing } from "../../../common/design/spacing";

type SelectionWrapperProps = PropsWithChildren<{
  item: Item;
  onPress: () => void;
  testID?: string;
  isSheet?: boolean;
  color?: string;
  index?: number;
  hasGroupHeader?: boolean;
  style?: ViewStyle;
  wrapperStyle?: ViewStyle;
  hideSeparator?: boolean;
}>;

const SelectionWrapper = ({
  item,
  onPress,
  testID,
  isSheet,
  children,
  color,
  hasGroupHeader,
  index = 0,
  style,
  wrapperStyle,
  hideSeparator
}: SelectionWrapperProps) => {
  const itemId = useRef(item.id);
  const { colors, isDark } = useThemeColors();
  const isEditingNote = useTabStore(
    (state) =>
      state.tabs.find((t) => t.id === state.currentTab)?.session?.noteId ===
      item.id
  );
  const compactMode = useIsCompactModeEnabled(
    (item as TrashItem).itemType || item.type
  );

  if (item.id !== itemId.current) {
    itemId.current = item.id;
  }

  const onLongPress = () => {
    if (isSheet) return;
    if (useSelectionStore.getState().selectionMode !== item.type) {
      useSelectionStore.getState().setSelectionMode(item.type);
    }
    useSelectionStore.getState().setSelectedItem(item.id);
  };

  return (
    <>
      {hasGroupHeader || hideSeparator ? null : (
        <View
          style={{
            paddingHorizontal: Spacing.LEVEL_3
          }}
        >
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.primary.separator,
              width: "100%"
            }}
          />
        </View>
      )}
      <View
        style={{
          backgroundColor: isEditingNote
            ? colors.secondary.background
            : undefined,
          ...wrapperStyle
        }}
      >
        <Pressable
          customColor={isSheet ? colors.primary.hover : "transparent"}
          testID={testID}
          onLongPress={onLongPress}
          onPress={onPress}
          customSelectedColor={colors.primary.hover}
          noborder
          customAlpha={!isDark ? -0.02 : 0.02}
          customOpacity={1}
          style={{
            paddingHorizontal: Spacing.LEVEL_3,
            paddingBottom: Spacing.LEVEL_2,
            paddingTop: hasGroupHeader ? Spacing.LEVEL_1 : Spacing.LEVEL_2,
            ...style
          }}
        >
          {isEditingNote ? (
            <View
              style={{
                backgroundColor: color || colors.selected.accent,
                position: "absolute",
                bottom: 0,
                top: 0,
                left: 0,
                width: 4
              }}
            />
          ) : null}

          <View
            style={{
              width: "100%",
              flexDirection: "row"
            }}
          >
            {children}
          </View>
        </Pressable>
      </View>
    </>
  );
};

export default SelectionWrapper;
