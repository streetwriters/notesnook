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
import React, { useCallback, useEffect } from "react";
import {
  BackHandler,
  NativeEventSubscription,
  Platform,
  View
} from "react-native";
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
import { IconButton } from "../ui/icon-button";
import Heading from "../ui/typography/heading";
import Animated, { FadeInUp } from "react-native-reanimated";

export const SelectionHeader = React.memo(
  ({
    items,
    type,
    id
  }: {
    items?: VirtualizedGrouping<Item>;
    id?: string;
    type?: ItemType;
  }) => {
    const { colors } = useThemeColors();
    const selectionMode = useSelectionStore((state) => state.selectionMode);
    const selectedItemsList = useSelectionStore(
      (state) => state.selectedItemsList
    );
    const clearSelection = useSelectionStore((state) => state.clearSelection);
    const insets = useGlobalSafeAreaInsets();
    const allSelected =
      items?.ids?.filter((id) => typeof id === "string").length ===
      selectedItemsList.length;
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
      <Animated.View
        entering={FadeInUp}
        style={{
          width: "100%",
          height: Platform.OS === "android" ? 50 + insets.top : 50,
          paddingTop: Platform.OS === "android" ? insets.top : null,
          backgroundColor: colors.primary.background,
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          zIndex: 999,
          paddingHorizontal: 12,
          marginVertical: 10
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
            customStyle={{
              justifyContent: "center",
              alignItems: "center",
              height: 40,
              width: 40,
              borderRadius: 100,
              marginRight: 10
            }}
            type="grayBg"
            onPress={() => {
              clearSelection();
            }}
            size={SIZE.xl}
            color={colors.primary.icon}
            name="close"
          />

          <View
            style={{
              backgroundColor: colors.secondary.background,
              height: 40,
              borderRadius: 100,
              paddingHorizontal: 16,
              justifyContent: "center",
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <Heading size={SIZE.md} color={colors.primary.accent}>
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
                .setAll(
                  allSelected
                    ? []
                    : [
                        ...((items?.ids.filter(
                          (id) => typeof id !== "object"
                        ) as string[]) || [])
                      ]
                );
            }}
            tooltipText="Select all"
            tooltipPosition={4}
            customStyle={{
              marginLeft: 10
            }}
            color={
              allSelected ? colors.primary.accent : colors.primary.paragraph
            }
            name="select-all"
            size={SIZE.xl}
          />

          {type === "note" ||
          (type === "notebook" && focusedRouteId === "Notebooks") ? null : (
            <>
              <IconButton
                onPress={async () => {
                  await sleep(100);
                  ManageTagsSheet.present(selectedItemsList);
                }}
                customStyle={{
                  marginLeft: 10
                }}
                color={colors.primary.icon}
                tooltipText="Manage tags"
                tooltipPosition={4}
                name="pound"
                size={SIZE.xl}
              />

              <IconButton
                onPress={async () => {
                  ExportNotesSheet.present(selectedItemsList);
                }}
                tooltipText="Export"
                tooltipPosition={4}
                customStyle={{
                  marginLeft: 10
                }}
                color={colors.primary.paragraph}
                name="export"
                size={SIZE.xl}
              />

              <IconButton
                onPress={async () => {
                  MoveNoteSheet.present();
                }}
                customStyle={{
                  marginLeft: 10
                }}
                tooltipText="Add to notebooks"
                tooltipPosition={4}
                color={colors.primary.paragraph}
                name="plus"
                size={SIZE.xl}
              />
            </>
          )}

          {type === "notebook" && focusedRouteId !== "Notebooks" ? (
            <IconButton
              onPress={async () => {
                if (selectedItemsList.length > 0) {
                  const { focusedRouteId } = useNavigationStore.getState();
                  if (!focusedRouteId) return;

                  await db.notes.removeFromNotebook(
                    focusedRouteId,
                    ...selectedItemsList
                  );

                  updateNotebook(focusedRouteId);
                  Navigation.queueRoutesForUpdate();
                  clearSelection();
                }
              }}
              customStyle={{
                marginLeft: 10
              }}
              tooltipText={`Remove from Notebook`}
              tooltipPosition={4}
              testID="select-minus"
              color={colors.primary.paragraph}
              name="minus"
              size={SIZE.xl}
            />
          ) : null}

          {focusedRouteId === "Favorites" ? (
            <IconButton
              onPress={addToFavorite}
              customStyle={{
                marginLeft: 10
              }}
              tooltipText="Remove from favorites"
              tooltipPosition={4}
              color={colors.primary.paragraph}
              name="star-off"
              size={SIZE.xl}
            />
          ) : null}

          {type === "trash" ? null : (
            <IconButton
              customStyle={{
                marginLeft: 10
              }}
              onPress={() => {
                deleteItems(
                  undefined,
                  useSelectionStore.getState().selectionMode
                );
              }}
              tooltipText="Move to trash"
              tooltipPosition={1}
              color={colors.primary.paragraph}
              name="delete"
              size={SIZE.xl}
            />
          )}

          {type === "trash" ? (
            <>
              <IconButton
                customStyle={{
                  marginLeft: 10
                }}
                color={colors.primary.paragraph}
                onPress={restoreItem}
                name="delete-restore"
                tooltipText="Restore"
                tooltipPosition={4}
                size={SIZE.xl - 3}
              />

              <IconButton
                customStyle={{
                  marginLeft: 10
                }}
                color={colors.primary.paragraph}
                onPress={deleteItem}
                tooltipText="Delete"
                tooltipPosition={4}
                name="delete"
                size={SIZE.xl - 3}
              />
            </>
          ) : null}
        </View>
      </Animated.View>
    );
  }
);

SelectionHeader.displayName = "SelectionHeader";

export default SelectionHeader;
