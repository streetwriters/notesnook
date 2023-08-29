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

import React, { useCallback, useEffect } from "react";
import { BackHandler, Platform, View } from "react-native";
import { db } from "../../common/database";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import SearchService from "../../services/search";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useThemeColors } from "@notesnook/theme";
import { deleteItems } from "../../utils/functions";
import { tabBarRef } from "../../utils/global-refs";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { presentDialog } from "../dialog/functions";
import MoveNoteSheet from "../sheets/add-to";
import ExportNotesSheet from "../sheets/export-notes";
import { IconButton } from "../ui/icon-button";
import Heading from "../ui/typography/heading";
import ManageTagsSheet from "../sheets/manage-tags";

export const SelectionHeader = React.memo(() => {
  const { colors } = useThemeColors();
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const selectedItemsList = useSelectionStore(
    (state) => state.selectedItemsList
  );
  const setSelectionMode = useSelectionStore((state) => state.setSelectionMode);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const currentScreen = useNavigationStore((state) => state.currentScreen);
  const screen = currentScreen.name;
  const insets = useGlobalSafeAreaInsets();
  SearchService.prepareSearch?.();
  const allItems = SearchService.getSearchInformation()?.get() || [];
  const allSelected = allItems.length === selectedItemsList.length;
  useEffect(() => {
    if (selectionMode) {
      tabBarRef.current?.lock();
    } else {
      tabBarRef.current?.unlock();
    }
  }, [selectionMode]);

  const addToFavorite = async () => {
    if (selectedItemsList.length > 0) {
      selectedItemsList.forEach((item) => {
        db.notes.note(item.id).favorite();
      });
      Navigation.queueRoutesForUpdate();
      clearSelection();
    }
  };

  const restoreItem = async () => {
    if (selectedItemsList.length > 0) {
      let noteIds = [];
      selectedItemsList.forEach((item) => {
        noteIds.push(item.id);
      });
      await db.trash.restore(...noteIds);
      Navigation.queueRoutesForUpdate();

      clearSelection();
      ToastManager.show({
        heading: "Restore successful",
        type: "success"
      });
    }
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
        if (selectedItemsList.length > 0) {
          let noteIds = [];
          selectedItemsList.forEach((item) => {
            noteIds.push(item.id);
          });
          await db.trash.delete(...noteIds);
          Navigation.queueRoutesForUpdate();
          clearSelection();
        }
      },
      positiveType: "errorShade"
    });
  };

  const onBackPress = useCallback(() => {
    clearSelection();
    return true;
  }, [clearSelection]);

  useEffect(() => {
    if (selectionMode) {
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
    } else {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }
  }, [onBackPress, selectionMode]);

  return !selectionMode ? null : (
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
            setSelectionMode(!selectionMode);
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
              .setAll(allSelected ? [] : [...allItems]);
          }}
          tooltipText="Select all"
          tooltipPosition={4}
          customStyle={{
            marginLeft: 10
          }}
          color={colors.primary.paragraph}
          name="select-all"
          size={SIZE.xl}
        />

        {screen === "Trash" ||
        screen === "Notebooks" ||
        screen === "Reminders" ? null : (
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
                //setSelectionMode(false);
                await sleep(100);
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

        {screen === "TopicNotes" || screen === "Notebook" ? (
          <IconButton
            onPress={async () => {
              if (selectedItemsList.length > 0) {
                const currentScreen =
                  useNavigationStore.getState().currentScreen;

                if (screen === "Notebook") {
                  for (const item of selectedItemsList) {
                    await db.relations.unlink(
                      { type: "notebook", id: currentScreen.id },
                      item
                    );
                  }
                } else {
                  await db.notes.removeFromNotebook(
                    {
                      id: currentScreen.notebookId,
                      topic: currentScreen.id
                    },
                    ...selectedItemsList.map((item) => item.id)
                  );
                }

                Navigation.queueRoutesForUpdate();
                clearSelection();
              }
            }}
            customStyle={{
              marginLeft: 10
            }}
            tooltipText={`Remove from ${
              screen === "Notebook" ? "notebook" : "topic"
            }`}
            tooltipPosition={4}
            testID="select-minus"
            color={colors.primary.paragraph}
            name="minus"
            size={SIZE.xl}
          />
        ) : null}

        {screen === "Favorites" ? (
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

        {screen === "Trash" ? null : (
          <IconButton
            customStyle={{
              marginLeft: 10
            }}
            onPress={() => {
              deleteItems();
            }}
            tooltipText="Move to trash"
            tooltipPosition={1}
            color={colors.primary.paragraph}
            name="delete"
            size={SIZE.xl}
          />
        )}

        {screen === "Trash" ? (
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
    </View>
  );
});

SelectionHeader.displayName = "SelectionHeader";

export default SelectionHeader;
