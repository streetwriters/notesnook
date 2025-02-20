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
import { Notebook } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { FlatList } from "react-native-actions-sheet";
import { db } from "../../../common/database";
import { presentSheet } from "../../../services/event-manager";
import {
  createNotebookTreeStores,
  TreeItem
} from "../../../stores/create-notebook-tree-stores";
import {
  useNotebooks,
  useNotebookStore
} from "../../../stores/use-notebook-store";
import {
  checkParentSelected,
  findRootNotebookId,
  getParentNotebookId
} from "../../../utils/notebooks";
import { DefaultAppStyles } from "../../../utils/styles";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { presentDialog } from "../../dialog/functions";
import SheetProvider from "../../sheet-provider";
import { NotebookItem } from "../../side-menu/notebook-item";
import {
  useSideMenuNotebookExpandedStore,
  useSideMenuNotebookSelectionStore
} from "../../side-menu/stores";
import { Button } from "../../ui/button";
import { AddNotebookSheet } from "../add-notebook";

const {
  useNotebookExpandedStore,
  useNotebookTreeStore,
  useNotebookSelectionStore
} = createNotebookTreeStores(false, false, "move-notebook-tree-expanded");

export const MoveNotebookSheet = ({
  selectedNotebooks,
  close
}: {
  selectedNotebooks: Notebook[];
  close?: () => void;
}) => {
  const [notebooks, loading] = useNotebooks();
  const { colors } = useThemeColors();
  const tree = useNotebookTreeStore((state) => state.tree);
  const lastQuery = React.useRef<string>();
  const [filteredNotebooks, setFilteredNotebooks] = React.useState(notebooks);
  const [moveToTopEnabled, setMoveToTopEnabled] = useState(false);
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
    if (lastQuery.current) {
      db.lookup
        .notebooks(lastQuery.current)
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

  useEffect(() => {
    (async () => {
      for (const notebook of selectedNotebooks) {
        const root = await findRootNotebookId(notebook.id);
        if (root !== notebook.id) {
          setMoveToTopEnabled(true);
          return;
        }
      }
    })();
  }, [selectedNotebooks]);

  const renderItem = useCallback(
    ({ item, index }: { item: TreeItem; index: number }) => {
      return (
        <NotebookItemWrapper
          index={index}
          item={item}
          onPress={async () => {
            const selectedNotebook = item.notebook;
            presentDialog({
              title: strings.moveNotebooks(selectedNotebooks.length),
              paragraph: strings.moveNotebooksConfirm(
                selectedNotebooks.length,
                selectedNotebook.title
              ),
              positiveText: strings.move(),
              context: "move-notebook",
              positivePress: async () => {
                for (const notebook of selectedNotebooks) {
                  if (await checkParentSelected(notebook.id, selectedNotebooks))
                    continue;

                  const parent = await getParentNotebookId(notebook.id);
                  const root = await findRootNotebookId(notebook.id);

                  if (selectedNotebook.id === notebook.id) continue;

                  if (root !== notebook.id) {
                    await db.relations.unlink(
                      {
                        type: "notebook",
                        id: parent
                      },
                      notebook
                    );
                  }
                  await db.relations.add(selectedNotebook, notebook);
                }
                useNotebookStore.getState().refresh();

                if (
                  !useSideMenuNotebookExpandedStore.getState().expanded[
                    selectedNotebook.id
                  ]
                ) {
                  useSideMenuNotebookExpandedStore
                    .getState()
                    .setExpanded(selectedNotebook.id);
                }

                useSideMenuNotebookSelectionStore.setState({
                  enabled: false,
                  selection: {}
                });
                close?.();
              }
            });
          }}
        />
      );
    },
    [close, selectedNotebooks]
  );
  const filteredTree = React.useMemo(
    () =>
      tree.filter(
        (treeItem) =>
          !selectedNotebooks.find((n) => n.id === treeItem.notebook?.id)
      ),
    [selectedNotebooks, tree]
  );

  return (
    <View>
      <SheetProvider context="move-notebook" />
      <Dialog context="move-notebook" />

      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP,
          borderBottomWidth: 1,
          borderBottomColor: colors.primary.border
        }}
      >
        <DialogHeader
          title={strings.moveNotebook(
            selectedNotebooks.length,
            selectedNotebooks[0].title
          )}
        />
      </View>

      <FlatList
        data={filteredTree}
        renderItem={renderItem}
        keyExtractor={(item) => item.notebook.id}
        windowSize={3}
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal: DefaultAppStyles.GAP
            }}
          >
            {moveToTopEnabled ? (
              <Button
                title={strings.moveToTop()}
                style={{
                  alignSelf: "flex-start",
                  width: "100%",
                  justifyContent: "space-between"
                }}
                icon="arrow-up-bold"
                iconPosition="right"
                type="secondaryAccented"
                onPress={async () => {
                  for (const notebook of selectedNotebooks) {
                    if (
                      await checkParentSelected(notebook.id, selectedNotebooks)
                    )
                      continue;
                    const parent = await getParentNotebookId(notebook.id);
                    const root = await findRootNotebookId(notebook.id);
                    if (root !== notebook.id) {
                      await db.relations.unlink(
                        {
                          type: "notebook",
                          id: parent
                        },
                        notebook
                      );
                    }
                  }
                  useNotebookStore.getState().refresh();
                  useSideMenuNotebookSelectionStore.setState({
                    enabled: false,
                    selection: {}
                  });
                  close?.();
                }}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              height: 200
            }}
          >
            <Text
              style={{
                color: colors.secondary.icon
              }}
            >
              No notebooks
            </Text>
          </View>
        }
      />
    </View>
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
    onPress: () => void;
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
          paddingHorizontal: DefaultAppStyles.GAP,
          marginTop: index === 0 ? DefaultAppStyles.GAP : 0
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
              "move-notebook",
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

MoveNotebookSheet.present = async (notebooks: Notebook[]) => {
  presentSheet({
    component: (ref, close) => (
      <MoveNotebookSheet selectedNotebooks={notebooks} close={close} />
    ),
    keyboardHandlerDisabled: true
  });
};
