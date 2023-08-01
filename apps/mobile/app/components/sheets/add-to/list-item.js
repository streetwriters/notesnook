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
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { db } from "../../../common/database";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { SIZE } from "../../../utils/size";
import { IconButton } from "../../ui/icon-button";
import { PressableButton } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { useSelectionContext } from "./context";
import { FilteredList } from "./filtered-list";
import { useItemSelectionStore } from "./store";

const SelectionIndicator = ({
  item,
  hasNotes,
  selectItem,
  onPress,
  onChange
}) => {
  const itemState = useItemSelectionStore((state) => state.itemState[item.id]);
  const multiSelect = useItemSelectionStore((state) => state.multiSelect);

  const isSelected = itemState === "selected";
  const isIntermediate = itemState === "intermediate";
  const isRemoved = !isSelected && hasNotes;
  const { colors } = useThemeColors("sheet");

  useEffect(() => {
    onChange?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemState]);

  return (
    <IconButton
      size={22}
      customStyle={{
        marginRight: 5,
        width: 23,
        height: 23
      }}
      color={
        isRemoved
          ? colors.static.red
          : isIntermediate || isSelected
          ? colors.selected.icon
          : colors.primary.icon
      }
      onPress={() => {
        if (multiSelect) return selectItem();
        onPress?.(item);
      }}
      onLongPress={() => {
        useItemSelectionStore.getState().setMultiSelect(true);
        selectItem();
      }}
      testID={
        isRemoved
          ? "close-circle-outline"
          : isSelected
          ? "check-circle-outline"
          : isIntermediate
          ? "minus-circle-outline"
          : "checkbox-blank-circle-outline"
      }
      name={
        isRemoved
          ? "close-circle-outline"
          : isSelected
          ? "check-circle-outline"
          : isIntermediate
          ? "minus-circle-outline"
          : "checkbox-blank-circle-outline"
      }
    />
  );
};

export const ListItem = ({
  item,
  index,
  icon,
  infoText,
  hasSubList,
  onPress,
  onScrollEnd,
  getListItems,
  style,
  type,
  sublistItemType,
  onAddItem,
  getSublistItemProps,
  hasHeaderSearch,
  onAddSublistItem,
  hasNotes,
  onChange,
  sheetRef
}) => {
  const { toggleSelection } = useSelectionContext();
  const multiSelect = useItemSelectionStore((state) => state.multiSelect);
  const [showSelectedIndicator, setShowSelectedIndicator] = useState(false);
  const { colors } = useThemeColors("sheet");
  const [expanded, setExpanded] = useState(false);

  function selectItem() {
    toggleSelection(item);
  }

  const getSelectedNotesCountInNotebookTopics = (item) => {
    if (item.type === "topic") return;

    let count = 0;
    const noteIds = [];
    for (let topic of item.topics) {
      noteIds.push(...(db.notes?.topicReferences.get(topic.id) || []));
      if (useItemSelectionStore.getState().itemState[topic.id] === "selected") {
        count++;
      }
    }
    useSelectionStore.getState().selectedItemsList.forEach((item) => {
      if (noteIds.indexOf(item.id) > -1) {
        count++;
      }
    });
    return count;
  };

  useEffect(() => {
    setShowSelectedIndicator(getSelectedNotesCountInNotebookTopics(item) > 0);
  }, [item]);

  const onChangeSubItem = () => {
    setShowSelectedIndicator(getSelectedNotesCountInNotebookTopics(item) > 0);
  };

  return (
    <View
      style={{
        overflow: "hidden",
        marginBottom: 10,
        ...style
      }}
    >
      <PressableButton
        onPress={() => {
          if (hasSubList) return setExpanded(!expanded);
          if (multiSelect) return selectItem();
          onPress?.(item);
        }}
        type={type}
        onLongPress={() => {
          useItemSelectionStore.getState().setMultiSelect(true);
          selectItem();
        }}
        customStyle={{
          height: style?.height || 50,
          width: "100%",
          alignItems: "flex-start"
        }}
      >
        <View
          style={{
            width: "100%",
            height: 50,
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <SelectionIndicator
              hasNotes={hasNotes}
              onPress={onPress}
              item={item}
              onChange={onChange}
              selectItem={selectItem}
            />
            <View>
              {hasSubList && expanded ? (
                <Heading size={SIZE.md}>{item.title}</Heading>
              ) : (
                <Paragraph size={SIZE.sm}>{item.title}</Paragraph>
              )}

              {infoText ? (
                <Paragraph size={SIZE.xs} color={colors.primary.icon}>
                  {infoText}
                </Paragraph>
              ) : null}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            {showSelectedIndicator ? (
              <View
                style={{
                  backgroundColor: colors.primary.accent,
                  width: 7,
                  height: 7,
                  borderRadius: 100,
                  marginRight: 12
                }}
              />
            ) : null}

            {onAddSublistItem ? (
              <IconButton
                name={"plus"}
                testID="add-item-icon"
                color={colors.primary.paragraph}
                size={SIZE.xl}
                onPress={() => {
                  onAddSublistItem(item);
                }}
              />
            ) : null}
            {icon ? (
              <IconButton
                name={icon(expanded).name}
                color={icon(expanded).color}
                size={icon(expanded).size || SIZE.xl}
                onPress={
                  hasSubList
                    ? () => setExpanded(!expanded)
                    : icon(expanded).onPress
                }
              />
            ) : null}
          </View>
        </View>
      </PressableButton>

      {expanded && hasSubList ? (
        <FilteredList
          nestedScrollEnabled
          data={getListItems(item)}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          onMomentumScrollEnd={onScrollEnd}
          style={{
            width: "95%",
            alignSelf: "flex-end",
            maxHeight: 250
          }}
          itemType={sublistItemType}
          hasHeaderSearch={hasHeaderSearch}
          renderItem={({ item, index }) => (
            <ListItem
              item={item}
              {...getSublistItemProps(item)}
              index={index}
              onChange={onChangeSubItem}
              onScrollEnd={onScrollEnd}
            />
          )}
          onAddItem={onAddItem}
        />
      ) : null}
    </View>
  );
};
