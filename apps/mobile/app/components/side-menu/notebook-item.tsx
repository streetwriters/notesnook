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
import { StoreApi, UseBoundStore } from "zustand";
import { useTotalNotes } from "../../hooks/use-db-item";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { TreeItem } from "../../stores/create-notebook-tree-stores";
import { SelectionStore } from "../../stores/item-selection-store";
import { eOnNotebookUpdated } from "../../utils/events";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import AppIcon from "../ui/AppIcon";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
import { useRelationStore } from "../../stores/use-relation-store";
import { Radius, Spacing } from "../../common/design/spacing";
import Heading from "../ui/typography/heading";
import { AddNotebookSheet } from "../sheets/add-notebook";

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
  onAddNotebook,
  canDisableSelectionMode,
  disableExpand
}: {
  index: number;
  item: TreeItem;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  selected?: boolean;
  focused?: boolean;
  selectionEnabled?: boolean;
  selectionStore: UseBoundStore<StoreApi<SelectionStore>>;
  onItemUpdate: (id?: string) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  onAddNotebook?: () => void;
  canDisableSelectionMode?: boolean;
  disableExpand?: boolean;
}) => {
  const notebook = item.notebook;
  const isFocused = focused;
  const { totalNotes, getTotalNotes } = useTotalNotes("notebook");
  const updater = useRelationStore((state) => state.updater);
  const getTotalNotesRef = React.useRef(getTotalNotes);
  getTotalNotesRef.current = getTotalNotes;
  const { colors } = useThemeColors();

  useEffect(() => {
    getTotalNotesRef.current([item.notebook.id]);
  }, [item.notebook, updater]);

  useEffect(() => {
    const onNotebookUpdate = (id?: string) => {
      if (id && id !== notebook.id) return;
      getTotalNotesRef.current([item.notebook.id]);
      onItemUpdate(id);
    };

    eSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    return () => {
      eUnSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    };
  }, [item.notebook.id, notebook.id, onItemUpdate]);

  const itemPadding =
    item.depth === 0 ? undefined : item.depth < 6 ? 15 * item.depth : 15 * 5;

  return (
    <View
      style={{
        paddingLeft: itemPadding,
        width: "100%",
        opacity: item.disabled ? 0.5 : 1,
        paddingBottom: Spacing.LEVEL_0
      }}
    >
      {item.depth > 0 ? (
        <View
          style={{
            height: "100%",
            width: 1,
            backgroundColor: colors.primary.border,
            top: 0,
            bottom: 0,
            position: "absolute",
            left: itemPadding
          }}
        />
      ) : null}
      <Pressable
        type={isFocused || selected ? "selected" : "transparent"}
        onLongPress={onLongPress}
        testID={`notebook-item-${item.depth}-${index}`}
        onPress={async () => {
          if (selectionEnabled) {
            const state = selectionStore.getState();

            if (selected) {
              state.markAs(item.notebook, "deselected");
              return;
            }

            if (!state.multiSelect) {
              const keys = Object.keys(state.selection);
              const nextState: any = {};
              for (const key in keys) {
                nextState[key] = !state.initialState[key]
                  ? undefined
                  : "deselected";
              }

              state.setSelection({
                [item.notebook.id]: "selected",
                ...nextState
              });
            } else {
              state.markAs(item.notebook, "selected");
            }

            if (
              selectionStore.getState().getSelectedItemIds().length === 0 &&
              canDisableSelectionMode
            ) {
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
          borderRadius: Radius.XS,
          paddingVertical: Spacing.LEVEL_1,
          paddingHorizontal: Spacing.LEVEL_1,
          marginBottom:
            expanded && item.hasChildren ? Spacing.LEVEL_0 : undefined
          // borderLeftWidth: item.depth > 0 ? 1 : undefined,
          // borderLeftColor: colors.primary.border
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_1
          }}
        >
          {item.depth === 0 ? (
            <AppIcon
              size={AppFontSize.md}
              color={
                selected || isFocused
                  ? colors.selected.icon
                  : colors.primary.icon
              }
              testID={item.hasChildren ? `expand-notebook-${index}` : ""}
              style={{
                borderRadius: defaultBorderRadius
              }}
              iconFamily="notesnook"
              name={"bookmark"}
            />
          ) : null}

          <Paragraph
            color={
              isFocused ? colors.selected.paragraph : colors.primary.paragraph
            }
            size={AppFontSize.sm}
          >
            {notebook?.title}
          </Paragraph>
        </View>

        <View
          style={{
            gap: Spacing.LEVEL_1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {selectionEnabled ? (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <AppIcon
                name={selected ? "checkbox" : "box-empty"}
                iconFamily="notesnook"
                size={AppFontSize.md}
                color={
                  selected
                    ? [colors.selected.accent, colors.selected.accentForeground]
                    : colors.primary.icon
                }
              />
            </View>
          ) : (
            <>
              <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
                {totalNotes?.(notebook?.id) || 0}
              </Paragraph>
            </>
          )}

          {onAddNotebook ? (
            <IconButton
              name="plus"
              size={AppFontSize.md}
              testID={`add-notebook-${index}`}
              color={colors.primary.icon}
              top={0}
              left={0}
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
          ) : null}

          {item.hasChildren ? (
            <IconButton
              size={12}
              color={
                selected || isFocused
                  ? colors.selected.icon
                  : colors.primary.icon
              }
              testID={item.hasChildren ? `expand-notebook-${index}` : ""}
              onPress={() => {
                if (item.hasChildren && !disableExpand) {
                  onToggleExpanded?.();
                }
              }}
              top={0}
              left={20}
              bottom={0}
              right={20}
              style={{
                borderRadius: defaultBorderRadius,
                width: undefined,
                height: undefined
              }}
              iconFamily="notesnook"
              name={expanded ? "chevron-up" : "chevron-down"}
            />
          ) : null}
        </View>
      </Pressable>
      {expanded && item.hasChildren && !selectionEnabled ? (
        <View
          style={{
            width: "100%",
            paddingLeft: (item.depth + 1) * 15
          }}
        >
          <View
            style={{
              height: "100%",
              width: 1,
              backgroundColor: colors.primary.border,
              top: 0,
              bottom: 0,
              position: "absolute",
              left: (item.depth + 1) * 15
            }}
          />
          <Pressable
            style={{
              // borderLeftWidth: 1,
              // borderLeftColor: colors.primary.border,
              flexDirection: "row",
              gap: Spacing.LEVEL_1,
              justifyContent: "flex-start",
              paddingVertical: Spacing.LEVEL_1,
              paddingHorizontal: Spacing.LEVEL_1,
              alignItems: "center"
            }}
            onPress={() => {
              AddNotebookSheet.present(undefined, item.notebook);
            }}
          >
            <AppIcon
              name="plus"
              size={14}
              style={{
                marginTop: -2
              }}
              iconFamily="notesnook"
            />
            <Heading fontSize="SM">Create sub-notebook</Heading>
          </Pressable>{" "}
        </View>
      ) : null}
    </View>
  );
};
