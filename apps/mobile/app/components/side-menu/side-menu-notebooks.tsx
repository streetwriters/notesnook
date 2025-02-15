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
import { UseBoundStore } from "zustand";
import { db } from "../../common/database";
import { useTotalNotes } from "../../hooks/use-db-item";
import NotebookScreen from "../../screens/notebook";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { TreeItem } from "../../stores/create-notebook-tree-stores";
import { SelectionStore } from "../../stores/item-selection-store";
import useNavigationStore from "../../stores/use-navigation-store";
import { useNotebooks } from "../../stores/use-notebook-store";
import { eOnNotebookUpdated } from "../../utils/events";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Properties } from "../properties";
import AppIcon from "../ui/AppIcon";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
import { SideMenuHeader } from "./side-menu-header";
import { SideMenuListEmpty } from "./side-menu-list-empty";
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
        paddingLeft:
          item.depth > 0 && item.depth < 6 ? 15 * item.depth : undefined,
        width: "100%",
        marginTop: 2
      }}
    >
      <Pressable
        type={isFocused ? "selected" : "transparent"}
        onLongPress={onLongPress}
        testID={`notebook-item-${item.depth}-${index}`}
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
          borderRadius: defaultBorderRadius,
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
            size={AppFontSize.md}
            color={selected ? colors.selected.icon : colors.primary.icon}
            testID={item.hasChildren ? `expand-notebook-${index}` : ""}
            onPress={() => {
              if (item.hasChildren) {
                onToggleExpanded?.();
              }
            }}
            top={0}
            left={20}
            bottom={0}
            right={20}
            style={{
              width: 32,
              height: 32,
              borderRadius: defaultBorderRadius
            }}
            name={
              !item.hasChildren
                ? "book-outline"
                : expanded
                ? "chevron-down"
                : "chevron-right"
            }
          />

          <Paragraph
            color={
              isFocused ? colors.selected.paragraph : colors.secondary.paragraph
            }
            size={AppFontSize.sm}
          >
            {notebook?.title}
          </Paragraph>
        </View>

        {selectionEnabled ? (
          <View
            style={{
              width: 25,
              height: 25,
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
              size={AppFontSize.md}
              color={selected ? colors.selected.icon : colors.primary.icon}
            />
          </View>
        ) : (
          <>
            {totalNotes(notebook?.id) ? (
              <Paragraph
                size={AppFontSize.xxs}
                color={colors.secondary.paragraph}
              >
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
    useSideMenuNotebookTreeStore.getState().addNotebooks("root", _notebooks, 0);
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

    useEffect(() => {
      if (expanded) {
        useSideMenuNotebookTreeStore
          .getState()
          .fetchAndAdd(item.notebook.id, item.depth + 1);
      } else {
        useSideMenuNotebookTreeStore
          .getState()
          .removeChildren(item.notebook.id);
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
      prev.item.notebook.dateEdited === next.item.notebook.dateEdited
    );
  }
);
NotebookItemWrapper.displayName = "NotebookItemWrapper";
