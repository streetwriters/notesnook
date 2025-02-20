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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { RefObject, useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { ActionSheetRef, FlatList } from "react-native-actions-sheet";
import { db } from "../../../common/database";
import { presentSheet } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import {
  createNotebookTreeStores,
  TreeItem
} from "../../../stores/create-notebook-tree-stores";
import { ItemSelection } from "../../../stores/item-selection-store";
import { useNotebooks } from "../../../stores/use-notebook-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { updateNotebook } from "../../../utils/notebooks";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import SheetProvider from "../../sheet-provider";
import { NotebookItem } from "../../side-menu/notebook-item";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import Input from "../../ui/input";
import Paragraph from "../../ui/typography/paragraph";
import { AddNotebookSheet } from "../add-notebook";

const {
  useNotebookExpandedStore,
  useNotebookSelectionStore,
  useNotebookTreeStore
} = createNotebookTreeStores(true, true, "link-notebooks-expanded-store");

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
  useNotebookSelectionStore.setState({
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
  const [notebooks, loading] = useNotebooks();
  const tree = useNotebookTreeStore((state) => state.tree);
  const searchQuery = useRef("");
  const searchTimer = useRef<NodeJS.Timeout>();
  const [filteredNotebooks, setFilteredNotebooks] = React.useState(notebooks);
  const loadRootNotebooks = React.useCallback(async () => {
    if (!filteredNotebooks) return;
    const _notebooks: Notebook[] = [];
    for (let i = 0; i < filteredNotebooks.placeholders.length; i++) {
      _notebooks[i] = (await filteredNotebooks?.item(i))?.item as Notebook;
    }
    const items = await useNotebookTreeStore
      .getState()
      .addNotebooks("root", _notebooks, 0);
    useNotebookTreeStore.getState().setTree(items);
  }, [filteredNotebooks]);

  const updateNotebooks = React.useCallback(() => {
    if (searchQuery.current) {
      db.lookup
        .notebooks(searchQuery.current)
        .sorted()
        .then((filtered) => {
          setFilteredNotebooks(filtered);
        });
    } else {
      setFilteredNotebooks(notebooks);
    }
  }, [notebooks]);

  useEffect(() => {
    updateNotebooks();
  }, [updateNotebooks]);

  useEffect(() => {
    (async () => {
      if (!loading) {
        loadRootNotebooks();
      }
    })();
  }, [loadRootNotebooks, loading]);

  const selectedItemsList = useSelectionStore(
    (state) => state.selectedItemsList
  );
  const multiSelect = useNotebookSelectionStore((state) => state.multiSelect);

  useEffect(() => {
    const items = note ? [note.id] : selectedItemsList;
    updateInitialSelectionState(items);
    return () => {
      useNotebookSelectionStore.setState({
        initialState: {},
        selection: {},
        multiSelect: false,
        canEnableMultiSelectMode: true
      });
    };
  }, [note, selectedItemsList]);

  const onSave = async () => {
    const noteIds = note ? [note.id] : selectedItemsList;

    const changedNotebooks = useNotebookSelectionStore.getState().selection;

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
    const selection = useNotebookSelectionStore.getState().selection;
    return Object.keys(selection).some((key) => selection[key] === "selected");
  };

  const renderNotebook = useCallback(
    ({ item, index }: { item: TreeItem; index: number }) => (
      <NotebookItemWrapper item={item} index={index} />
    ),
    []
  );

  return (
    <>
      <Dialog context="move_note" />
      <SheetProvider context="link-notebooks" />
      <View
        style={{
          gap: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        <View
          style={{
            paddingHorizontal: DefaultAppStyles.GAP,
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: colors.primary.border,
            paddingBottom: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <DialogHeader
            style={{
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
              columnGap: DefaultAppStyles.GAP_SMALL
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
                paddingHorizontal: 24,
                alignSelf: "flex-start"
              }}
              title={strings.save()}
              type="accent"
              onPress={onSave}
            />
          </View>
        </View>

        <FlatList
          data={tree}
          windowSize={3}
          style={{
            width: "100%"
          }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View
              style={{
                paddingHorizontal: DefaultAppStyles.GAP,
                width: "100%",
                paddingTop: DefaultAppStyles.GAP_VERTICAL
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
                  searchTimer.current = setTimeout(() => {
                    updateNotebooks();
                  }, 300);
                }}
              />
            </View>
          }
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
        />
      </View>
    </>
  );
};

const NotebookItemWrapper = React.memo(
  ({
    item,
    index,
    onPress
  }: {
    item: TreeItem;
    index: number;
    onPress?: () => void;
  }) => {
    const expanded = useNotebookExpandedStore(
      (state) => state.expanded[item.notebook.id]
    );
    const selectionEnabled = useNotebookSelectionStore(
      (state) => state.enabled
    );
    const selected = useNotebookSelectionStore(
      (state) => state.selection[item.notebook.id] === "selected"
    );

    const onItemUpdate = React.useCallback(async () => {
      const notebook = await db.notebooks.notebook(item.notebook.id);
      if (notebook) {
        useNotebookTreeStore.getState().updateItem(item.notebook.id, notebook);
        if (expanded) {
          useNotebookTreeStore
            .getState()
            .setTree(
              await useNotebookTreeStore
                .getState()
                .fetchAndAdd(item.notebook.id, item.depth + 1)
            );
        }
      } else {
        useNotebookTreeStore.getState().removeItem(item.notebook.id);
      }
    }, [expanded, item.depth, item.notebook.id]);

    return (
      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP
        }}
      >
        <NotebookItem
          item={item}
          index={index}
          expanded={expanded}
          onToggleExpanded={async () => {
            useNotebookExpandedStore.getState().setExpanded(item.notebook.id);
            if (!expanded) {
              useNotebookTreeStore
                .getState()
                .setTree(
                  await useNotebookTreeStore
                    .getState()
                    .fetchAndAdd(item.notebook.id, item.depth + 1)
                );
            } else {
              useNotebookTreeStore.getState().removeChildren(item.notebook.id);
            }
          }}
          onLongPress={() => {
            useNotebookSelectionStore.setState({
              multiSelect: !useNotebookSelectionStore.getState().multiSelect
            });

            const state = useNotebookSelectionStore.getState();
            useNotebookSelectionStore
              .getState()
              .markAs(
                item.notebook,
                !selected
                  ? "selected"
                  : !state.initialState[item.notebook.id]
                  ? undefined
                  : "deselected"
              );
          }}
          canDisableSelectionMode={false}
          selected={selected}
          selectionEnabled={selectionEnabled}
          selectionStore={useNotebookSelectionStore}
          onItemUpdate={onItemUpdate}
          focused={false}
          onPress={onPress}
          onAddNotebook={() => {
            AddNotebookSheet.present(
              undefined,
              item.notebook,
              "link-notebooks",
              undefined,
              false
            );
          }}
        />
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.item.notebook.id === next.item.notebook.id &&
      prev.item.notebook.dateModified === next.item.notebook.dateModified &&
      prev.item.notebook.dateEdited === next.item.notebook.dateEdited &&
      prev.item.hasChildren === next.item.hasChildren &&
      prev.index === next.index &&
      prev.item.parentId === next.item.parentId
    );
  }
);
NotebookItemWrapper.displayName = "NotebookItemWrapper";

MoveNoteSheet.present = (note?: Note) => {
  presentSheet({
    component: (ref) => <MoveNoteSheet actionSheetRef={ref} note={note} />
  });
};
export default MoveNoteSheet;
