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
import React, { useEffect } from "react";
import { View } from "react-native";
import { UseBoundStore } from "zustand";
import { useTotalNotes } from "../../hooks/use-db-item";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { TreeItem } from "../../stores/create-notebook-tree-stores";
import { SelectionStore } from "../../stores/item-selection-store";
import { eOnNotebookUpdated } from "../../utils/events";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import AppIcon from "../ui/AppIcon";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";

export const NotebookItem = ({
  index,
  item,
  expanded,
  selected,
  onToggleExpanded,
  focused,
  selectionEnabled,
  selectionStore,
  onItemUpdate,
  onPress,
  onLongPress,
  onAddNotebook
}: {
  index: number;
  item: TreeItem;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  selected?: boolean;
  focused?: boolean;
  selectionEnabled?: boolean;
  selectionStore: UseBoundStore<SelectionStore>;
  onItemUpdate: (id?: string) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  onAddNotebook?: () => void;
}) => {
  const notebook = item.notebook;
  const isFocused = focused;
  const { totalNotes, getTotalNotes } = useTotalNotes("notebook");
  const getTotalNotesRef = React.useRef(getTotalNotes);
  getTotalNotesRef.current = getTotalNotes;
  const { colors } = useThemeColors("sheet");

  useEffect(() => {
    getTotalNotesRef.current([item.notebook.id]);
  }, [item.notebook]);

  useEffect(() => {
    const onNotebookUpdate = (id?: string) => {
      if (id && id !== notebook.id) return;
      onItemUpdate(id);
    };

    eSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    return () => {
      eUnSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    };
  }, [notebook.id, onItemUpdate]);

  return (
    <View
      style={{
        paddingLeft:
          item.depth > 0 && item.depth < 6 ? 15 * item.depth : undefined,
        width: "100%",
        marginTop: 2
      }}
    >
      <Pressable
        type={isFocused || selected ? "selected" : "transparent"}
        onLongPress={onLongPress}
        testID={`notebook-item-${item.depth}-${index}`}
        onPress={async () => {
          if (selectionEnabled) {
            selectionStore
              .getState()
              .markAs(item.notebook, selected ? "deselected" : "selected");
            if (selectionStore.getState().getSelectedItemIds().length === 0) {
              selectionStore.setState({
                enabled: false
              });
            }
          } else {
            onPress?.();
          }
        }}
        style={{
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
          flexDirection: "row",
          borderRadius: defaultBorderRadius,
          paddingRight: DefaultAppStyles.GAP_SMALL
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          <IconButton
            size={AppFontSize.md}
            color={selected ? colors.selected.icon : colors.primary.icon}
            testID={item.hasChildren ? `expand-notebook-${index}` : ""}
            onPress={() => {
              if (item.hasChildren) {
                onToggleExpanded?.();
              } else {
                onPress?.();
              }
            }}
            top={0}
            left={50}
            bottom={0}
            right={40}
            style={{
              width: 32,
              height: 32,
              borderRadius: defaultBorderRadius
            }}
            name={
              !item.hasChildren
                ? "book-outline"
                : expanded
                ? "chevron-down"
                : "chevron-right"
            }
          />

          <Paragraph
            color={
              isFocused ? colors.selected.paragraph : colors.secondary.paragraph
            }
            size={AppFontSize.sm}
          >
            {notebook?.title}
          </Paragraph>
        </View>

        {selectionEnabled ? (
          <View
            style={{
              width: 25,
              height: 25,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <AppIcon
              name={selected ? "checkbox-outline" : "checkbox-blank-outline"}
              size={AppFontSize.md}
              color={selected ? colors.selected.icon : colors.primary.icon}
            />
          </View>
        ) : onAddNotebook ? (
          <IconButton
            name="plus"
            size={AppFontSize.md}
            top={0}
            left={50}
            bottom={0}
            right={40}
            style={{
              width: 32,
              height: 32,
              borderRadius: defaultBorderRadius
            }}
            onPress={() => {
              onAddNotebook();
            }}
          />
        ) : (
          <>
            <Paragraph
              size={AppFontSize.xxs}
              color={colors.secondary.paragraph}
            >
              {totalNotes?.(notebook?.id) || 0}
            </Paragraph>
          </>
        )}
      </Pressable>
    </View>
  );
};
