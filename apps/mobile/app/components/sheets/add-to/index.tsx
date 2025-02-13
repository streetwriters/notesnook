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

import { Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import {
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  View
} from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import { db } from "../../../common/database";
import { presentSheet } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { ItemSelection } from "../../../stores/item-selection-store";
import { useNotebooks } from "../../../stores/use-notebook-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import { updateNotebook } from "../../../utils/notebooks";
import { AppFontSize } from "../../../utils/size";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import SheetProvider from "../../sheet-provider";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import Input from "../../ui/input";
import Paragraph from "../../ui/typography/paragraph";
import { AddNotebookSheet } from "../add-notebook";
import { NotebookItem } from "./notebook-item";
import { useNotebookItemSelectionStore } from "./store";

async function updateInitialSelectionState(items: string[]) {
  const relations = await db.relations
    .to(
      {
        type: "note",
        ids: items
      },
      "notebook"
    )
    .get();

  const initialSelectionState: ItemSelection = {};
  const notebookIds = [
    ...new Set(relations.map((relation) => relation.fromId))
  ];

  for (const id of notebookIds) {
    const all = items.every((noteId) => {
      return (
        relations.findIndex(
          (relation) => relation.fromId === id && relation.toId === noteId
        ) > -1
      );
    });
    if (all) {
      initialSelectionState[id] = "selected";
    } else {
      initialSelectionState[id] = "intermediate";
    }
  }
  useNotebookItemSelectionStore.setState({
    initialState: initialSelectionState,
    selection: { ...initialSelectionState },
    multiSelect: relations.length > 1
  });
}

const MoveNoteSheet = ({
  note,
  actionSheetRef
}: {
  note: Note | undefined;
  actionSheetRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const [rootNotebooks, loading] = useNotebooks();
  const searchQuery = useRef("");
  const searchTimer = useRef<NodeJS.Timeout>();
  const [notebooks, setNotebooks] = useState(rootNotebooks);

  const dimensions = useSettingStore((state) => state.dimensions);
  const selectedItemsList = useSelectionStore(
    (state) => state.selectedItemsList
  );

  const multiSelect = useNotebookItemSelectionStore(
    (state) => state.multiSelect
  );

  useEffect(() => {
    if (!loading) {
      setNotebooks(rootNotebooks);
    }
  }, [loading, rootNotebooks]);

  useEffect(() => {
    const items = note ? [note.id] : selectedItemsList;
    updateInitialSelectionState(items);
    return () => {
      useNotebookItemSelectionStore.setState({
        initialState: {},
        selection: {},
        multiSelect: false,
        canEnableMultiSelectMode: true
      });
    };
  }, [note, selectedItemsList]);

  const onSave = async () => {
    const noteIds = note ? [note.id] : selectedItemsList;

    const changedNotebooks = useNotebookItemSelectionStore.getState().selection;

    for (const id in changedNotebooks) {
      const item = await db.notebooks.notebook(id);
      if (!item) continue;
      if (changedNotebooks[id] === "selected") {
        for (const id of noteIds) {
          await db.relations.add(item, { id: id, type: "note" });
          updateNotebook(item.id);
        }
      } else if (changedNotebooks[id] === "deselected") {
        for (const id of noteIds) {
          await db.relations.unlink(item, { id: id, type: "note" });
          updateNotebook(item.id);
        }
      }
    }

    Navigation.queueRoutesForUpdate();
    useRelationStore.getState().update();
    actionSheetRef.current?.hide();
  };

  const hasSelected = () => {
    const selection = useNotebookItemSelectionStore.getState().selection;
    return Object.keys(selection).some((key) => selection[key] === "selected");
  };

  const renderNotebook = useCallback(
    ({ index }: { item: boolean; index: number }) => (
      <NotebookItem items={notebooks} id={index} index={index} />
    ),
    [notebooks]
  );

  return (
    <>
      <Dialog context="move_note" />
      <SheetProvider context="link-notebooks" />
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
            title={strings.selectNotebooks()}
            paragraph={
              !multiSelect
                ? strings.enableMultiSelect()
                : strings.selectNotebooksDesc()
            }
          />

          <View
            style={{
              flexDirection: "row",
              columnGap: 10
            }}
          >
            {hasSelected() ? (
              <IconButton
                name="restore"
                color={colors.primary.icon}
                onPress={() => {
                  const items = note ? [note.id] : selectedItemsList;
                  updateInitialSelectionState(items);
                }}
                style={{
                  width: 40,
                  height: 40
                }}
              />
            ) : null}

            <Button
              height={40}
              style={{
                borderRadius: 100,
                paddingHorizontal: 24,
                alignSelf: "flex-start"
              }}
              title={strings.save()}
              type={"accent"}
              onPress={onSave}
            />
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 0,
            maxHeight: dimensions.height * 0.85,
            height: dimensions.height * 0.85,
            paddingTop: 6
          }}
        >
          <FlashList
            data={notebooks?.placeholders}
            style={{
              width: "100%"
            }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View
                style={{
                  paddingHorizontal: 12,
                  width: "100%",
                  paddingTop: 12
                }}
              >
                <Input
                  placeholder={strings.searchNotebooks()}
                  button={{
                    icon: "plus",
                    onPress: () => {
                      AddNotebookSheet.present(
                        undefined,
                        undefined,
                        "link-notebooks",
                        undefined,
                        false,
                        searchQuery.current
                      );
                    },
                    color: colors.primary.icon
                  }}
                  onChangeText={(value) => {
                    searchQuery.current = value;
                    if (!searchQuery.current) {
                      setNotebooks(rootNotebooks);
                      return;
                    }
                    searchTimer.current = setTimeout(() => {
                      db.lookup
                        .notebooks(searchQuery.current)
                        .sorted()
                        .then((result) => {
                          if (searchQuery.current === value) {
                            setNotebooks(result);
                          }
                        });
                    }, 300);
                  }}
                />
              </View>
            }
            estimatedItemSize={50}
            renderItem={renderNotebook}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  height: 200
                }}
              >
                {loading ? (
                  <ActivityIndicator
                    size={AppFontSize.lg}
                    color={colors.primary.accent}
                  />
                ) : (
                  <Paragraph color={colors.primary.icon}>
                    {strings.emptyPlaceholders("notebook")}
                  </Paragraph>
                )}
              </View>
            }
            ListFooterComponent={<View style={{ height: 50 }} />}
          />
        </View>
      </View>
    </>
  );
};

MoveNoteSheet.present = (note?: Note) => {
  presentSheet({
    component: (ref) => <MoveNoteSheet actionSheetRef={ref} note={note} />,
    enableGesturesInScrollView: false,
    noBottomPadding: true,
    keyboardHandlerDisabled: true
  });
};
export default MoveNoteSheet;
