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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef } from "react";
import {
  BackHandler,
  NativeEventSubscription,
  Platform,
  View
} from "react-native";
import { Menu } from "react-native-material-menu";
import { db } from "../../common/database";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { deleteItems } from "../../utils/functions";
import { fluidTabsRef } from "../../utils/global-refs";
import { updateNotebook } from "../../utils/notebooks";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { sleep } from "../../utils/time";
import { presentDialog } from "../dialog/functions";
import MoveNoteSheet from "../sheets/add-to";
import ExportNotesSheet from "../sheets/export-notes";
import ManageTagsSheet from "../sheets/manage-tags";
import { MoveNotebookSheet } from "../sheets/move-notebook";
import { IconButton } from "../ui/icon-button";

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
        fluidTabsRef.current?.lock();
      } else {
        fluidTabsRef.current?.unlock();
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
      if ((await db.trash.restore(...selectedItemsList)) === false) return;
      Navigation.queueRoutesForUpdate();

      clearSelection();
      ToastManager.show({
        heading: strings.restored(),
        type: "success"
      });
    };

    const deleteItem = async () => {
      if (!type) return;
      presentDialog({
        title: strings.doActions.delete.unknown(type, selectedItemsList.length),
        paragraph: strings.actionConfirmations.delete.unknown(
          type,
          selectedItemsList.length
        ),
        positiveText: strings.delete(),
        negativeText: strings.cancel(),
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
          backgroundColor: colors.primary.background,
          paddingVertical: DefaultAppStyles.GAP_VERTICAL,
          alignItems: "center",
          flexDirection: "row",
          zIndex: 999,
          paddingHorizontal: DefaultAppStyles.GAP,
          position: "absolute",
          bottom: 0,
          borderTopWidth: 1,
          borderColor: colors.primary.border,
          justifyContent: "space-between"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: DefaultAppStyles.GAP_SMALL
          }}
        >
          <IconButton
            onPress={async () => {
              useSelectionStore
                .getState()
                .setAll(allSelected ? [] : [...((await items?.ids()) || [])]);
            }}
            size={AppFontSize.lg}
            color={allSelected ? colors.primary.accent : colors.primary.icon}
            name="select-all"
          />

          {!selectedItemsList.length
            ? null
            : [
                {
                  title: strings.move(),
                  onPress: async () => {
                    const ids = selectedItemsList;
                    const notebooks = await db.notebooks.all.items(ids);
                    MoveNotebookSheet.present(notebooks);
                  },
                  visible: renderedInRoute === "Notebooks",
                  icon: "arrow-right-bold-box-outline"
                },
                {
                  title: strings.manageTags(),
                  onPress: async () => {
                    await sleep(100);
                    ManageTagsSheet.present(selectedItemsList);
                  },
                  visible: type === "note",
                  icon: "pound"
                },
                {
                  title: strings.export(),
                  onPress: async () => {
                    await sleep(100);
                    ExportNotesSheet.present(selectedItemsList);
                  },
                  visible: type === "note",
                  icon: "export"
                },
                {
                  title: strings.linkNotebook(),
                  onPress: async () => {
                    await sleep(100);
                    MoveNoteSheet.present();
                  },
                  visible: type === "note",
                  icon: "plus"
                },
                {
                  title: strings.unlinkNotebook(),
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
                  title: strings.unfavorite(),
                  onPress: addToFavorite,
                  visible: focusedRouteId === "Favorites",
                  icon: "star-off"
                },
                {
                  title: strings.moveToTrash(),
                  onPress: async () => {
                    const selection = useSelectionStore.getState();
                    if (!selection.selectionMode) return;
                    await deleteItems(
                      selection.selectionMode as ItemType,
                      selection.selectedItemsList
                    );
                    selection.clearSelection();
                    selection.setSelectionMode(undefined);
                  },
                  visible: type === "note" || type === "notebook",
                  icon: "delete"
                },
                {
                  title: strings.doActions.delete.unknown(
                    type!,
                    selectedItemsList.length
                  ),
                  onPress: async () => {
                    const selection = useSelectionStore.getState();
                    if (!selection.selectionMode) return;
                    await deleteItems(
                      selection.selectionMode as ItemType,
                      selection.selectedItemsList
                    );
                    selection.clearSelection();
                    selection.setSelectionMode(undefined);
                  },
                  visible:
                    type !== "trash" && type !== "note" && type !== "notebook",
                  icon: "delete"
                },
                {
                  title: strings.restore(),
                  onPress: restoreItem,
                  visible: type === "trash",
                  icon: "delete-restore"
                },
                {
                  title: strings.delete(),
                  onPress: deleteItem,
                  visible: type === "trash",
                  icon: "delete"
                }
              ].map((item) =>
                !item.visible ? null : (
                  <IconButton
                    size={AppFontSize.lg}
                    type="plain"
                    testID={`select-${item.icon}`}
                    name={item.icon}
                    key={item.title}
                    color={colors.primary.icon}
                    onPress={async () => {
                      //@ts-ignore
                      menuRef.current?.hide();
                      if (Platform.OS === "ios") await sleep(300);
                      item.onPress();
                    }}
                  />
                )
              )}
        </View>

        <IconButton
          size={AppFontSize.lg}
          onPress={() => {
            clearSelection();
          }}
          color={colors.primary.icon}
          name="close"
        />
      </View>
    );
  }
);

SelectionHeader.displayName = "SelectionHeader";

export default SelectionHeader;
