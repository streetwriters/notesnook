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
import React, { useEffect } from "react";
import { FlatList, TextInput, View } from "react-native";
import { db } from "../../common/database";
import NotebookScreen from "../../screens/notebook";
import Navigation from "../../services/navigation";
import { TreeItem } from "../../stores/create-notebook-tree-stores";
import useNavigationStore from "../../stores/use-navigation-store";
import { useNotebooks } from "../../stores/use-notebook-store";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Properties } from "../properties";
import { NotebookItem } from "./notebook-item";
import { SideMenuHeader } from "./side-menu-header";
import { SideMenuListEmpty } from "./side-menu-list-empty";
import {
  useSideMenuNotebookExpandedStore,
  useSideMenuNotebookSelectionStore,
  useSideMenuNotebookTreeStore
} from "./stores";
useSideMenuNotebookSelectionStore.setState({
  multiSelect: true
});
export const SideMenuNotebooks = () => {
  const tree = useSideMenuNotebookTreeStore((state) => state.tree);
  const [notebooks, loading] = useNotebooks();
  const { colors } = useThemeColors();
  const [filteredNotebooks, setFilteredNotebooks] = React.useState(notebooks);
  const searchTimer = React.useRef<NodeJS.Timeout>();
  const lastQuery = React.useRef<string>();
  const loadRootNotebooks = React.useCallback(async () => {
    if (!filteredNotebooks) return;
    const _notebooks: Notebook[] = [];
    for (let i = 0; i < filteredNotebooks.placeholders.length; i++) {
      _notebooks[i] = (await filteredNotebooks?.item(i))?.item as Notebook;
    }
    const items = await useSideMenuNotebookTreeStore
      .getState()
      .addNotebooks("root", _notebooks, 0);
    useSideMenuNotebookTreeStore.getState().setTree(items);
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
    useSideMenuNotebookSelectionStore.setState({
      selectAll: async () => {
        const allNotebooks = await db.notebooks.all.items();
        const allSelected = allNotebooks.every((notebook) => {
          return (
            useSideMenuNotebookSelectionStore.getState().selection[
              notebook.id
            ] === "selected"
          );
        });

        if (allSelected) {
          useSideMenuNotebookSelectionStore.setState({
            selection: {}
          });
          return;
        }

        useSideMenuNotebookSelectionStore.setState({
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
        height: "100%"
      }}
    >
      {!notebooks || notebooks.placeholders.length === 0 ? (
        <SideMenuListEmpty
          placeholder={strings.emptyPlaceholders("notebook")}
        />
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
                  paddingTop: DefaultAppStyles.GAP_SMALL
                }}
              >
                <SideMenuHeader />
              </View>
            }
            renderItem={renderItem}
          />
          <View
            style={{
              width: "100%",
              paddingHorizontal: DefaultAppStyles.GAP,
              backgroundColor: colors.primary.background,
              borderTopColor: colors.primary.border,
              borderTopWidth: 1
            }}
          >
            <TextInput
              placeholder="Filter notebooks..."
              style={{
                fontFamily: "Inter-Regular",
                fontSize: AppFontSize.xs
              }}
              cursorColor={colors.primary.accent}
              onChangeText={async (value) => {
                searchTimer.current && clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(async () => {
                  lastQuery.current = value;
                  updateNotebooks();
                }, 500);
              }}
              placeholderTextColor={colors.primary.placeholder}
            />
          </View>
        </>
      )}
    </View>
  );
};

const NotebookItemWrapper = React.memo(
  ({ item, index }: { item: TreeItem; index: number }) => {
    const expanded = useSideMenuNotebookExpandedStore(
      (state) => state.expanded[item.notebook.id]
    );

    const selectionEnabled = useSideMenuNotebookSelectionStore(
      (state) => state.enabled
    );
    const selected = useSideMenuNotebookSelectionStore(
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
          paddingHorizontal: DefaultAppStyles.GAP,
          marginTop: index === 0 ? DefaultAppStyles.GAP : 0
        }}
      >
        <NotebookItem
          item={item}
          index={index}
          expanded={expanded}
          onToggleExpanded={async () => {
            useSideMenuNotebookExpandedStore
              .getState()
              .setExpanded(item.notebook.id);
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
          selectionStore={useSideMenuNotebookSelectionStore}
          onItemUpdate={onItemUpdate}
          focused={focused}
          onPress={() => {
            NotebookScreen.navigate(item.notebook, false);
            Navigation.closeDrawer();
          }}
          onLongPress={() => {
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
