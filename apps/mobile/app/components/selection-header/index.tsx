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

import { Item, ItemType, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef } from "react";
import {
  BackHandler,
  NativeEventSubscription,
  Platform,
  View
} from "react-native";
import Menu from "react-native-reanimated-material-menu/src/Menu";
import { db } from "../../common/database";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { deleteItems } from "../../utils/functions";
import { tabBarRef } from "../../utils/global-refs";
import { updateNotebook } from "../../utils/notebooks";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { presentDialog } from "../dialog/functions";
import MoveNoteSheet from "../sheets/add-to";
import ExportNotesSheet from "../sheets/export-notes";
import ManageTagsSheet from "../sheets/manage-tags";
import { MoveNotebookSheet } from "../sheets/move-notebook";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Heading from "../ui/typography/heading";

export const SelectionHeader = React.memo(
  ({
    items,
    type,
    id,
    renderedInRoute
  }: {
    items?: VirtualizedGrouping<Item>;
    id?: string;
    type?: ItemType;
    renderedInRoute?: string;
  }) => {
    const menuRef = useRef<Menu>(null);
    const { colors: contextMenuColors } = useThemeColors("contextMenu");
    const { colors } = useThemeColors();
    const selectionMode = useSelectionStore((state) => state.selectionMode);
    const selectedItemsList = useSelectionStore(
      (state) => state.selectedItemsList
    );
    const clearSelection = useSelectionStore((state) => state.clearSelection);
    const insets = useGlobalSafeAreaInsets();
    const allSelected =
      items?.placeholders?.length === selectedItemsList.length;
    const focusedRouteId = useNavigationStore((state) => state.focusedRouteId);

    useEffect(() => {
      if (selectionMode) {
        tabBarRef.current?.lock();
      } else {
        tabBarRef.current?.unlock();
      }
    }, [selectionMode]);

    const addToFavorite = async () => {
      if (!selectedItemsList.length) return;
      db.notes.favorite(true, ...selectedItemsList);
      Navigation.queueRoutesForUpdate();
      clearSelection();
    };

    const restoreItem = async () => {
      if (!selectedItemsList.length) return;
      await db.trash.restore(...selectedItemsList);
      Navigation.queueRoutesForUpdate();

      clearSelection();
      ToastManager.show({
        heading: "Restore successful",
        type: "success"
      });
    };

    const deleteItem = async () => {
      presentDialog({
        title: `Delete ${selectedItemsList.length > 1 ? "items" : "item"}`,
        paragraph: `Are you sure you want to delete ${
          selectedItemsList.length > 1
            ? "these items permanently?"
            : "this item permanently?"
        }`,
        positiveText: "Delete",
        negativeText: "Cancel",
        positivePress: async () => {
          if (!selectedItemsList.length) return;
          await db.trash.delete(...selectedItemsList);
          Navigation.queueRoutesForUpdate();
          clearSelection();
        },
        positiveType: "errorShade"
      });
    };

    useEffect(() => {
      const onBackPress = () => {
        clearSelection();
        return true;
      };
      let sub: NativeEventSubscription | undefined;
      if (selectionMode) {
        sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      }

      return () => {
        sub?.remove();
      };
    }, [clearSelection, selectionMode]);

    return selectionMode !== type || focusedRouteId !== id ? null : (
      <View
        style={{
          width: "100%",
          height: Platform.OS === "android" ? 50 + insets.top : 50,
          paddingTop: Platform.OS === "android" ? insets.top : null,
          backgroundColor: colors.primary.background,
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          zIndex: 999,
          paddingHorizontal: 12
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            borderRadius: 100
          }}
        >
          <IconButton
            style={{
              justifyContent: "center",
              alignItems: "center",
              height: 40,
              width: 40,
              borderRadius: 100,
              marginRight: 10
            }}
            onPress={() => {
              clearSelection();
            }}
            color={colors.primary.icon}
            name="close"
          />

          <View
            style={{
              height: 40,
              borderRadius: 100,
              paddingHorizontal: 16,
              justifyContent: "center",
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <Heading size={SIZE.lg} color={colors.primary.paragraph}>
              {selectedItemsList.length}
            </Heading>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center"
          }}
        >
          <IconButton
            onPress={async () => {
              useSelectionStore
                .getState()
                .setAll(allSelected ? [] : [...((await items?.ids()) || [])]);
            }}
            tooltipText="Select all"
            tooltipPosition={4}
            style={{
              marginLeft: 10
            }}
            color={
              allSelected ? colors.primary.accent : colors.primary.paragraph
            }
            name="select-all"
          />

          {selectedItemsList.length ? (
            <Menu
              ref={menuRef}
              animationDuration={200}
              style={{
                borderRadius: 5,
                backgroundColor: contextMenuColors.primary.background,
                marginTop: -20
              }}
              onRequestClose={() => {
                menuRef.current?.hide();
              }}
              anchor={
                <IconButton
                  onPress={() => {
                    menuRef.current?.show();
                  }}
                  name="dots-vertical"
                  color={colors.primary.paragraph}
                />
              }
            >
              {[
                {
                  title:
                    selectedItemsList.length > 1
                      ? "Move notebooks"
                      : "Move notebook",
                  onPress: async () => {
                    const ids = selectedItemsList;
                    const notebooks = await db.notebooks.all.items(ids);
                    MoveNotebookSheet.present(notebooks);
                  },
                  visible: renderedInRoute === "Notebooks",
                  icon: "arrow-right-bold-box-outline"
                },
                {
                  title: "Manage tags",
                  onPress: async () => {
                    await sleep(100);
                    ManageTagsSheet.present(selectedItemsList);
                  },
                  visible: type === "note",
                  icon: "pound"
                },
                {
                  title: "Export",
                  onPress: async () => {
                    await sleep(100);
                    ExportNotesSheet.present(selectedItemsList);
                  },
                  visible: type === "note",
                  icon: "export"
                },
                {
                  title: "Link notebook",
                  onPress: async () => {
                    await sleep(100);
                    MoveNoteSheet.present();
                  },
                  visible: type === "note",
                  icon: "plus"
                },
                {
                  title: "Unlink notebook",
                  onPress: async () => {
                    if (!id) return;
                    await db.notes.removeFromNotebook(id, ...selectedItemsList);
                    updateNotebook(id);
                    Navigation.queueRoutesForUpdate();
                    clearSelection();
                  },
                  visible: renderedInRoute === "Notebook",
                  icon: "minus"
                },
                {
                  title: "Unfavorite",
                  onPress: addToFavorite,
                  visible: focusedRouteId === "Favorites",
                  icon: "star-off"
                },
                {
                  title: `Move to trash`,
                  onPress: async () => {
                    deleteItems(
                      undefined,
                      useSelectionStore.getState().selectionMode
                    ).then(() => {
                      useSelectionStore.getState().clearSelection();
                      useSelectionStore.getState().setSelectionMode(undefined);
                    });
                  },
                  visible: type !== "trash",
                  icon: "delete"
                },
                {
                  title: `Restore`,
                  onPress: restoreItem,
                  visible: type === "trash",
                  icon: "delete-restore"
                },
                {
                  title: `Delete`,
                  onPress: deleteItem,
                  visible: type === "trash",
                  icon: "delete"
                }
              ].map((item) =>
                !item.visible ? null : (
                  <Button
                    style={{
                      width: 150,
                      justifyContent: "flex-start",
                      borderRadius: 0
                    }}
                    type="plain"
                    buttonType={{
                      text: contextMenuColors.primary.paragraph
                    }}
                    icon={item.icon}
                    key={item.title}
                    title={item.title}
                    onPress={async () => {
                      menuRef.current?.hide();
                      if (Platform.OS === "ios") await sleep(300);
                      item.onPress();
                    }}
                  />
                )
              )}
            </Menu>
          ) : null}
        </View>
      </View>
    );
  }
);

SelectionHeader.displayName = "SelectionHeader";

export default SelectionHeader;
