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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { db } from "../../../common/database";
import NotebookScreen from "../../../screens/notebook";
import {
  eSendEvent,
  eSubscribeEvent,
  presentSheet
} from "../../../services/event-manager";
import {
  createNotebookTreeStores,
  TreeItem
} from "../../../stores/create-notebook-tree-stores";
import useNavigationStore from "../../../stores/use-navigation-store";
import { eCloseSheet, eOnNotebookUpdated } from "../../../utils/events";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { sleep } from "../../../utils/time";
import { Properties } from "../../properties";
import SheetProvider from "../../sheet-provider";
import { NotebookItem } from "../../side-menu/notebook-item";
import { useSideMenuNotebookTreeStore } from "../../side-menu/stores";
import { IconButton } from "../../ui/icon-button";
import Paragraph from "../../ui/typography/paragraph";
import { AddNotebookSheet } from "../add-notebook";

const {
  useNotebookExpandedStore,
  useNotebookSelectionStore,
  useNotebookTreeStore
} = createNotebookTreeStores(false, false, "notebook-tree-sheet");

useNotebookSelectionStore.setState({
  multiSelect: true
});
export const Notebooks = (props: {
  rootNotebook: Notebook;
  close?: (ctx?: string) => void;
}) => {
  const tree = useNotebookTreeStore((state) => state.tree);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useThemeColors();
  const [notebooks, setNotebooks] = useState<Notebook[]>();
  const [filteredNotebooks, setFilteredNotebooks] =
    React.useState<VirtualizedGrouping<Notebook>>();
  const searchTimer = React.useRef<NodeJS.Timeout>();
  const lastQuery = React.useRef<string>();
  const loadRootNotebooks = React.useCallback(async () => {
    const notebooks = await db.relations
      .from(
        {
          type: "notebook",
          id: props.rootNotebook.id
        },
        "notebook"
      )
      .selector.items(undefined, db.settings.getGroupOptions("notebooks"));
    const items = await useNotebookTreeStore
      .getState()
      .addNotebooks("root", notebooks, 0);
    setNotebooks(notebooks);
    useNotebookTreeStore.getState().setTree(items);
  }, [props.rootNotebook.id]);

  const updateNotebooks = React.useCallback(() => {
    loadRootNotebooks();
  }, [loadRootNotebooks]);

  useEffect(() => {
    updateNotebooks();
  }, [updateNotebooks]);

  useEffect(() => {
    (async () => {
      loadRootNotebooks();
      setIsLoading(false);
    })();
  }, [loadRootNotebooks]);

  useEffect(() => {
    const sub = eSubscribeEvent(eOnNotebookUpdated, (id) => {
      if (id === props.rootNotebook.id) {
        updateNotebooks();
      }
    });
    return () => {
      sub?.unsubscribe();
    };
  }, [updateNotebooks, props.rootNotebook.id]);

  useEffect(() => {
    useNotebookSelectionStore.setState({
      selectAll: async () => {
        const allNotebooks = await db.notebooks.all.items();
        const allSelected = allNotebooks.every((notebook) => {
          return (
            useNotebookSelectionStore.getState().selection[notebook.id] ===
            "selected"
          );
        });

        if (allSelected) {
          useNotebookSelectionStore.setState({
            selection: {}
          });
          return;
        }

        useNotebookSelectionStore.setState({
          selection: allNotebooks.reduce((acc: any, item) => {
            acc[item.id] = "selected";
            return acc;
          }, {})
        });
      }
    });
  }, []);

  const renderItem = React.useCallback(
    (info: { item: TreeItem; index: number }) => {
      return <NotebookItemWrapper index={info.index} item={info.item} />;
    },
    []
  );

  return (
    <View
      style={{
        height: 400
      }}
    >
      <SheetProvider context="local" />

      <View
        style={{
          width: "100%",
          paddingHorizontal: DefaultAppStyles.GAP,
          backgroundColor: colors.primary.background,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
          Sub notebooks
        </Paragraph>

        <IconButton
          size={AppFontSize.lg}
          style={{
            width: 30,
            height: 30
          }}
          name="plus"
          onPress={() => {
            AddNotebookSheet.present(props.rootNotebook, undefined, "local");
          }}
        />
      </View>
      {!notebooks || notebooks.length === 0 ? (
        <View
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Paragraph>{strings.emptyPlaceholders("notebook")}</Paragraph>
        </View>
      ) : (
        <>
          <FlatList
            data={tree}
            bounces={false}
            bouncesZoom={false}
            overScrollMode="never"
            keyExtractor={(item) => item.notebook.id}
            windowSize={3}
            ListHeaderComponent={
              <View
                style={{
                  backgroundColor: colors.primary.background,
                  paddingTop: DefaultAppStyles.GAP_VERTICAL
                }}
              ></View>
            }
            renderItem={renderItem}
          />
        </>
      )}
    </View>
  );
};

Notebooks.present = (notebook: Notebook) => {
  if (!notebook) return;
  presentSheet({
    component: (ref, close) => (
      <Notebooks rootNotebook={notebook} close={close} />
    ),
    keyboardHandlerDisabled: true
  });
};

const NotebookItemWrapper = React.memo(
  ({ item, index }: { item: TreeItem; index: number }) => {
    const expanded = useNotebookExpandedStore(
      (state) => state.expanded[item.notebook.id]
    );

    const selectionEnabled = useNotebookSelectionStore(
      (state) => state.enabled
    );
    const selected = useNotebookSelectionStore(
      (state) => state.selection[item.notebook.id] === "selected"
    );
    const focused = useNavigationStore(
      (state) => state.focusedRouteId === item.notebook.id
    );

    const onItemUpdate = React.useCallback(async () => {
      const notebook = await db.notebooks.notebook(item.notebook.id);
      if (notebook) {
        useSideMenuNotebookTreeStore
          .getState()
          .updateItem(item.notebook.id, notebook);
        if (expanded) {
          useSideMenuNotebookTreeStore
            .getState()
            .setTree(
              await useSideMenuNotebookTreeStore
                .getState()
                .fetchAndAdd(item.notebook.id, item.depth + 1)
            );
        }
      } else {
        useSideMenuNotebookTreeStore.getState().removeItem(item.notebook.id);
      }
    }, [expanded, item.depth, item.notebook.id]);

    return (
      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP_SMALL
        }}
      >
        <NotebookItem
          item={item}
          index={index}
          expanded={expanded}
          onToggleExpanded={async () => {
            useNotebookExpandedStore.getState().setExpanded(item.notebook.id);
            if (!expanded) {
              useSideMenuNotebookTreeStore
                .getState()
                .setTree(
                  await useSideMenuNotebookTreeStore
                    .getState()
                    .fetchAndAdd(item.notebook.id, item.depth + 1)
                );
            } else {
              useSideMenuNotebookTreeStore
                .getState()
                .removeChildren(item.notebook.id);
            }
          }}
          selected={selected}
          selectionEnabled={selectionEnabled}
          selectionStore={useNotebookSelectionStore}
          onItemUpdate={onItemUpdate}
          focused={focused}
          onPress={() => {
            eSendEvent(eCloseSheet);
            NotebookScreen.navigate(item.notebook, false);
          }}
          onLongPress={async () => {
            eSendEvent(eCloseSheet);
            await sleep(300);
            Properties.present(item.notebook, false);
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
