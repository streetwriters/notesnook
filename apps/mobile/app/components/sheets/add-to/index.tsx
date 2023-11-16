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

import { Note, Notebook } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { RefObject, useCallback, useEffect, useMemo } from "react";
import { Keyboard, TouchableOpacity, View } from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import SearchService from "../../../services/search";
import { useNotebookStore } from "../../../stores/use-notebook-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import { eOnNotebookUpdated } from "../../../utils/events";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import Paragraph from "../../ui/typography/paragraph";
import { SelectionProvider } from "./context";
import { FilteredList } from "./filtered-list";
import { ListItem } from "./list-item";
import { useItemSelectionStore } from "./store";

/**
 * Render all notebooks
 * Render sub notebooks
 * fix selection, remove topics stuff.
 * show already selected notebooks regardless of their level
 * show intermediate selection for nested notebooks at all levels.
 * @returns
 */
const MoveNoteSheet = ({
  note,
  actionSheetRef
}: {
  note: Note;
  actionSheetRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const notebooks = useNotebookStore((state) => state.notebooks);
  const dimensions = useSettingStore((state) => state.dimensions);
  const selectedItemsList = useSelectionStore(
    (state) => state.selectedItemsList
  );
  const setNotebooks = useNotebookStore((state) => state.setNotebooks);

  const multiSelect = useItemSelectionStore((state) => state.multiSelect);

  useEffect(() => {
    return () => {
      useItemSelectionStore.getState().setMultiSelect(false);
      useItemSelectionStore.getState().setItemState({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItemState = useCallback(function (
    item: Notebook,
    state: "selected" | "intermediate" | "deselected"
  ) {
    const itemState = { ...useItemSelectionStore.getState().itemState };
    const mergeState = {
      [item.id]: state
    };
    useItemSelectionStore.getState().setItemState({
      ...itemState,
      ...mergeState
    });
  },
  []);

  const contextValue = useMemo(
    () => ({
      toggleSelection: (item: Notebook) => {
        const itemState = useItemSelectionStore.getState().itemState;
        if (itemState[item.id] === "selected") {
          updateItemState(item, "deselected");
        } else {
          updateItemState(item, "selected");
        }
      },
      deselect: (item: Notebook) => {
        updateItemState(item, "deselected");
      },
      select: (item: Notebook) => {
        updateItemState(item, "selected");
      },
      deselectAll: () => {
        useItemSelectionStore.setState({
          itemState: {}
        });
      }
    }),
    [updateItemState]
  );

  const onSave = async () => {
    const noteIds = note
      ? [note.id]
      : selectedItemsList.map((n) => (n as Note).id);
    const itemState = useItemSelectionStore.getState().itemState;
    for (const id in itemState) {
      const item = await db.notebooks.notebook(id);
      if (!item) continue;
      if (itemState[id] === "selected") {
        for (let noteId of noteIds) {
          await db.relations.add(item, { id: noteId, type: "note" });
        }
      } else if (itemState[id] === "deselected") {
        for (let noteId of noteIds) {
          await db.relations.unlink(item, { id: noteId, type: "note" });
        }
      }
    }

    Navigation.queueRoutesForUpdate();
    setNotebooks();
    eSendEvent(eOnNotebookUpdated);
    SearchService.updateAndSearch();
    useRelationStore.getState().update();
    actionSheetRef.current?.hide();
  };

  return (
    <>
      <Dialog context="move_note" />
      <View>
        <TouchableOpacity
          style={{
            width: "100%",
            height: "100%",
            position: "absolute"
          }}
          onPress={() => {
            Keyboard.dismiss();
          }}
        />
        <View
          style={{
            paddingHorizontal: 12,
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "flex-start"
          }}
        >
          <DialogHeader
            style={{
              minHeight: 10,
              flexShrink: 1
            }}
            title="Select notebooks"
            paragraph={
              !multiSelect
                ? "Long press to enable multi-select."
                : "Select topics you want to add note(s) to."
            }
          />
          <Button
            height={35}
            style={{
              borderRadius: 100,
              paddingHorizontal: 24,
              alignSelf: "flex-start"
            }}
            title="Save"
            type={"accent"}
            onPress={onSave}
          />
        </View>

        <View
          style={{
            paddingHorizontal: 12
          }}
        >
          <Button
            title="Reset selection"
            height={30}
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 0,
              width: "100%",
              marginTop: 6
            }}
            type="grayAccent"
            onPress={() => {
              useItemSelectionStore.setState({
                itemState: {}
              });
            }}
          />
        </View>

        <SelectionProvider value={contextValue}>
          <View
            style={{
              paddingHorizontal: 12,
              maxHeight: dimensions.height * 0.85,
              height: 50 * ((notebooks?.ids.length || 0) + 2)
            }}
          >
            <FilteredList
              ListEmptyComponent={
                notebooks?.ids.length ? null : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <Icon
                      name="book-outline"
                      color={colors.primary.icon}
                      size={100}
                    />
                    <Paragraph style={{ marginBottom: 10 }}>
                      You do not have any notebooks.
                    </Paragraph>
                  </View>
                )
              }
              estimatedItemSize={50}
              data={notebooks?.ids.length}
              hasHeaderSearch={true}
              renderItem={({ item, index }) => (
                <ListItem
                  item={item}
                  key={item.id}
                  index={index}
                  hasNotes={getSelectedNotesCountInItem(item) > 0}
                  sheetRef={actionSheetRef}
                  infoText={
                    <>
                      {item.topics.length === 1
                        ? item.topics.length + " topic"
                        : item.topics.length + " topics"}
                    </>
                  }
                  getListItems={getItemsForItem}
                  getSublistItemProps={(topic) => ({
                    hasNotes: getSelectedNotesCountInItem(topic) > 0,
                    style: {
                      marginBottom: 0,
                      height: 40
                    },
                    onPress: (item) => {
                      const itemState =
                        useItemSelectionStore.getState().itemState;
                      const currentState = itemState[item.id];
                      if (currentState !== "selected") {
                        resetItemState("deselected");
                        contextValue.select(item);
                      } else {
                        contextValue.deselect(item);
                      }
                    },
                    key: item.id,
                    type: "transparent"
                  })}
                  icon={(expanded) => ({
                    name: expanded ? "chevron-up" : "chevron-down",
                    color: expanded
                      ? colors.primary.accent
                      : colors.primary.paragraph
                  })}
                  onScrollEnd={() => {
                    actionSheetRef.current?.handleChildScrollEnd();
                  }}
                  hasSubList={true}
                  hasHeaderSearch={false}
                  type="grayBg"
                  sublistItemType="topic"
                  onAddItem={(title) => {
                    return onAddTopic(title, item);
                  }}
                  onAddSublistItem={(item) => {
                    openAddTopicDialog(item);
                  }}
                  onPress={(item) => {
                    const itemState =
                      useItemSelectionStore.getState().itemState;
                    const currentState = itemState[item.id];
                    if (currentState !== "selected") {
                      resetItemState("deselected");
                      contextValue.select(item);
                    } else {
                      contextValue.deselect(item);
                    }
                  }}
                />
              )}
              itemType="notebook"
              onAddItem={async (title) => {
                return await onAddNotebook(title);
              }}
              ListFooterComponent={<View style={{ height: 20 }} />}
            />
          </View>
        </SelectionProvider>
      </View>
    </>
  );
};

MoveNoteSheet.present = (note) => {
  presentSheet({
    component: (ref) => <MoveNoteSheet actionSheetRef={ref} note={note} />,
    enableGesturesInScrollView: false,
    noBottomPadding: true
  });
};
export default MoveNoteSheet;
