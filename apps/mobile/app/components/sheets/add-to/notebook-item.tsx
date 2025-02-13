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
import { Notebook, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect } from "react";
import { View, useWindowDimensions } from "react-native";
import { notesnook } from "../../../../e2e/test.ids";
import { useTotalNotes } from "../../../hooks/use-db-item";
import { useNotebook } from "../../../hooks/use-notebook";
import useNavigationStore from "../../../stores/use-navigation-store";
import { AppFontSize } from "../../../utils/size";
import { IconButton } from "../../ui/icon-button";
import { Pressable } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";
import { AddNotebookSheet } from "../add-notebook";
import {
  useNotebookExpandedStore,
  useNotebookItemSelectionStore
} from "./store";

type NotebookParentProp = {
  parent?: NotebookParentProp;
  item?: Notebook;
};

export const NotebookItem = ({
  id,
  currentLevel = 0,
  index,
  parent,
  items
}: {
  id: string | number;
  currentLevel?: number;
  index: number;
  parent?: NotebookParentProp;
  items?: VirtualizedGrouping<Notebook>;
}) => {
  const { nestedNotebooks, notebook: item } = useNotebook(id, items, true);
  const expanded = useNotebookExpandedStore((state) =>
    item?.id ? state.expanded[item?.id] : false
  );
  const { totalNotes: totalNotes, getTotalNotes } = useTotalNotes("notebook");
  const focusedRouteId = useNavigationStore((state) => state.focusedRouteId);
  const { colors } = useThemeColors("sheet");
  const selection = useNotebookItemSelectionStore((state) =>
    item?.id ? state.selection[item?.id] : undefined
  );
  const isSelected = selection === "selected";
  const isFocused = focusedRouteId === id;
  const { fontScale } = useWindowDimensions();

  useEffect(() => {
    if (item?.id) {
      getTotalNotes([item?.id]);
    }
  }, [getTotalNotes, item?.id]);

  const onPress = () => {
    if (!item) return;
    const state = useNotebookItemSelectionStore.getState();

    if (isSelected) {
      state.markAs(
        item,
        !state.initialState[item?.id] ? undefined : "deselected"
      );
      return;
    }

    if (!state.multiSelect) {
      const keys = Object.keys(state.selection);
      const nextState: any = {};
      for (const key in keys) {
        nextState[key] = !state.initialState[key] ? undefined : "deselected";
      }

      state.setSelection({
        [item.id]: "selected",
        ...nextState
      });
    } else {
      state.markAs(item, "selected");
    }
  };

  return (
    <View
      style={{
        paddingLeft: currentLevel > 0 && currentLevel < 6 ? 15 : undefined,
        width: "100%"
      }}
    >
      <Pressable
        type={"transparent"}
        onLongPress={() => {
          if (!item) return;
          useNotebookItemSelectionStore.setState({
            multiSelect: true
          });
          const state = useNotebookItemSelectionStore.getState();
          useNotebookItemSelectionStore
            .getState()
            .markAs(
              item,
              !isSelected
                ? "selected"
                : !state.initialState[item?.id]
                ? undefined
                : "deselected"
            );
        }}
        testID={`add-to-notebook-item-${currentLevel}-${index}`}
        onPress={onPress}
        style={{
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
          flexDirection: "row",
          paddingLeft: 12,
          paddingRight: 12,
          borderRadius: 0,
          height: 45
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          {nestedNotebooks?.placeholders.length ? (
            <IconButton
              size={AppFontSize.xl}
              color={isSelected ? colors.selected.icon : colors.primary.icon}
              onPress={() => {
                if (!item?.id) return;
                useNotebookExpandedStore.getState().setExpanded(item?.id);
              }}
              top={0}
              left={0}
              bottom={0}
              right={0}
              style={{
                width: 35,
                height: 35
              }}
              name={expanded ? "chevron-down" : "chevron-right"}
            />
          ) : null}

          <IconButton
            size={AppFontSize.xl}
            color={
              isSelected
                ? colors.selected.icon
                : selection === "deselected"
                ? colors.error.accent
                : colors.primary.icon
            }
            onPress={onPress}
            top={0}
            left={0}
            bottom={0}
            right={0}
            style={{
              width: 40,
              height: 40
            }}
            name={
              selection === "deselected"
                ? "close-circle-outline"
                : isSelected
                ? "check-circle-outline"
                : selection === "intermediate"
                ? "minus-circle-outline"
                : "checkbox-blank-circle-outline"
            }
          />

          <Paragraph
            color={
              isFocused ? colors.selected.paragraph : colors.secondary.paragraph
            }
            size={AppFontSize.sm}
          >
            {item?.title}
          </Paragraph>
        </View>

        <View
          style={{
            flexDirection: "row",
            columnGap: 10,
            alignItems: "center"
          }}
        >
          {item?.id && totalNotes?.(item?.id) ? (
            <Paragraph size={AppFontSize.sm} color={colors.secondary.paragraph}>
              {totalNotes(item?.id)}
            </Paragraph>
          ) : null}
          <IconButton
            name="plus"
            style={{
              width: 40 * fontScale,
              height: 40 * fontScale
            }}
            testID={notesnook.ids.notebook.menu}
            onPress={() => {
              if (!item) return;
              AddNotebookSheet.present(
                undefined,
                item,
                "link-notebooks",
                undefined,
                false
              );
            }}
            left={0}
            right={0}
            bottom={0}
            top={0}
            color={colors.primary.icon}
            size={AppFontSize.xl}
          />
        </View>
      </Pressable>

      {!expanded
        ? null
        : nestedNotebooks?.placeholders.map((id, index) => (
            <NotebookItem
              key={item?.id + "_" + index}
              id={index}
              index={index}
              currentLevel={currentLevel + 1}
              items={nestedNotebooks}
              parent={{
                parent: parent,
                item: item
              }}
            />
          ))}
    </View>
  );
};
