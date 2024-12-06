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
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect } from "react";
import { FlatList, ListRenderItemInfo, View } from "react-native";
import { UseBoundStore } from "zustand";
import { db } from "../../common/database";
import { useTotalNotes } from "../../hooks/use-db-item";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import NotebookScreen from "../../screens/notebook";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { TreeItem } from "../../stores/create-notebook-tree-stores";
import { SelectionStore } from "../../stores/item-selection-store";
import useNavigationStore from "../../stores/use-navigation-store";
import { useNotebooks } from "../../stores/use-notebook-store";
import { eOnNotebookUpdated } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Properties } from "../properties";
import { AddNotebookSheet } from "../sheets/add-notebook";
import AppIcon from "../ui/AppIcon";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
import { SideMenuHeader } from "./side-menu-header";
import {
  useSideMenuNotebookExpandedStore,
  useSideMenuNotebookSelectionStore,
  useSideMenuNotebookTreeStore
} from "./stores";

const NotebookItem = ({
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
  onLongPress
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
}) => {
  const notebook = item.notebook;
  const [nestedNotebooksSelected, setNestedNotebooksSelected] =
    React.useState(false);
  const isFocused = focused;
  const { totalNotes, getTotalNotes } = useTotalNotes("notebook");
  const getTotalNotesRef = React.useRef(getTotalNotes);
  getTotalNotesRef.current = getTotalNotes;
  const { colors } = useThemeColors("sheet");

  useEffect(() => {
    getTotalNotesRef.current([item.notebook.id]);
  }, [item.notebook]);

  useEffect(() => {
    if (selectionEnabled) {
      const selector = db.relations.from(
        {
          type: "notebook",
          id: item.notebook.id
        },
        "notebook"
      ).selector;
      selector.ids().then((ids) => {
        setNestedNotebooksSelected(
          ids.length === 0
            ? true
            : ids.every(
                (id) => selectionStore.getState().selection[id] === "selected"
              )
        );
      });
    }
  }, [selected, item.notebook.id, selectionEnabled, selectionStore]);

  async function selectAll() {
    const selector = db.relations.from(
      {
        type: "notebook",
        id: item.notebook.id
      },
      "notebook"
    ).selector;
    const ids = await selector.ids();
    selectionStore.setState({
      selection: {
        ...selectionStore.getState().selection,
        ...ids.reduce((acc: any, id) => {
          acc[id] = "selected";
          return acc;
        }, {})
      }
    });
    setNestedNotebooksSelected(true);
  }

  async function deselectAll() {
    const selector = db.relations.from(
      {
        type: "notebook",
        id: item.notebook.id
      },
      "notebook"
    ).selector;
    const ids = await selector.ids();
    useSideMenuNotebookSelectionStore.setState({
      selection: {
        ...selectionStore.getState().selection,
        ...ids.reduce((acc: any, id) => {
          acc[id] = "deselected";
          return acc;
        }, {})
      }
    });
    setNestedNotebooksSelected(false);
  }

  useEffect(() => {
    const unsub = selectionStore.subscribe((state) => {
      if (state.enabled) {
        const selector = db.relations.from(
          {
            type: "notebook",
            id: item.notebook.id
          },
          "notebook"
        ).selector;
        selector.ids().then((ids) => {
          if (!ids.length) return;
          setNestedNotebooksSelected(
            ids.length === 0
              ? true
              : ids.every(
                  (id) => selectionStore.getState().selection[id] === "selected"
                )
          );
        });
      }
    });

    return () => {
      unsub();
    };
  }, [item.notebook.id, selectionStore]);

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
        paddingLeft: item.depth > 0 && item.depth < 6 ? 15 : undefined,
        width: "100%",
        marginTop: 2
      }}
    >
      <Pressable
        type={isFocused ? "selected" : "transparent"}
        onLongPress={() => {
          onLongPress?.();
        }}
        testID={`notebook-sheet-item-${item.depth}-${index}`}
        onPress={async () => {
          if (selectionEnabled) {
            if (selected && !nestedNotebooksSelected) {
              console.log("Select all...");
              return selectAll();
            }
            await deselectAll();
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
          borderRadius: 5,
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
            size={SIZE.md}
            color={selected ? colors.selected.icon : colors.primary.icon}
            onPress={() => {
              onToggleExpanded?.();
            }}
            top={0}
            left={0}
            bottom={0}
            right={0}
            style={{
              width: 32,
              height: 32,
              borderRadius: 5
            }}
            name={expanded ? "chevron-down" : "chevron-right"}
          />

          <Paragraph
            color={
              isFocused ? colors.selected.paragraph : colors.secondary.paragraph
            }
            size={SIZE.xs}
          >
            {notebook?.title}
          </Paragraph>
        </View>

        {selectionEnabled ? (
          <View
            style={{
              width: 22,
              height: 22,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <AppIcon
              name={
                selected
                  ? !nestedNotebooksSelected
                    ? "checkbox-intermediate"
                    : "checkbox-outline"
                  : "checkbox-blank-outline"
              }
              color={selected ? colors.selected.icon : colors.primary.icon}
            />
          </View>
        ) : (
          <>
            {totalNotes(notebook?.id) ? (
              <Paragraph size={SIZE.xxs} color={colors.secondary.paragraph}>
                {totalNotes?.(notebook?.id)}
              </Paragraph>
            ) : null}
          </>
        )}
      </Pressable>
    </View>
  );
};

export const SideMenuNotebooks = () => {
  const tree = useSideMenuNotebookTreeStore((state) => state.tree);
  const [notebooks, loading] = useNotebooks();
  const insets = useGlobalSafeAreaInsets();

  const loadRootNotebooks = React.useCallback(async () => {
    if (!notebooks) return;
    const _notebooks: Notebook[] = [];
    for (let i = 0; i < notebooks.placeholders.length; i++) {
      _notebooks[i] = (await notebooks?.item(i))?.item as Notebook;
    }
    useSideMenuNotebookTreeStore.getState().addNotebooks("root", _notebooks, 0);
  }, [notebooks]);

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

  const renderItem = React.useCallback((info: ListRenderItemInfo<TreeItem>) => {
    return <NotebookItemWrapper index={info.index} item={info.item} />;
  }, []);

  return (
    <FlatList
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        paddingTop: DefaultAppStyles.GAP_SMALL
      }}
      data={tree}
      keyExtractor={(item) => item.notebook.id}
      windowSize={3}
      ListHeaderComponent={
        <SideMenuHeader
          rightButtons={[
            {
              name: "plus",
              onPress: () => {
                AddNotebookSheet.present();
              }
            }
          ]}
        />
      }
      stickyHeaderIndices={[0]}
      renderItem={renderItem}
    />
  );
};

const NotebookItemWrapper = ({
  item,
  index
}: {
  item: TreeItem;
  index: number;
}) => {
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

  useEffect(() => {
    if (expanded) {
      useSideMenuNotebookTreeStore
        .getState()
        .fetchAndAdd(item.notebook.id, item.depth + 1);
    } else {
      useSideMenuNotebookTreeStore.getState().removeChildren(item.notebook.id);
    }
  }, [expanded, item.depth, item.notebook]);

  const onItemUpdate = React.useCallback(async () => {
    const notebook = await db.notebooks.notebook(item.notebook.id);
    if (notebook) {
      useSideMenuNotebookTreeStore
        .getState()
        .updateItem(item.notebook.id, notebook);
    } else {
      useSideMenuNotebookTreeStore.getState().removeItem(item.notebook.id);
    }
  }, [item.notebook.id]);

  return (
    <NotebookItem
      item={item}
      index={index}
      expanded={expanded}
      onToggleExpanded={() => {
        useSideMenuNotebookExpandedStore
          .getState()
          .setExpanded(item.notebook.id);
      }}
      selected={selected}
      selectionEnabled={selectionEnabled}
      selectionStore={useSideMenuNotebookSelectionStore}
      onItemUpdate={onItemUpdate}
      focused={focused}
      onPress={() => {
        NotebookScreen.navigate(item.notebook, false);
      }}
      onLongPress={() => {
        Properties.present(item.notebook, false);
      }}
    />
  );
};
