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

import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { SlideInUp, SlideOutDown } from "react-native-reanimated";
import { db } from "../../../common/database";
import { openVault, ToastEvent } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useMenuStore } from "../../../stores/use-menu-store";
import { useNotebookStore } from "../../../stores/use-notebook-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import { useTrashStore } from "../../../stores/use-trash-store";
import { dWidth, getElevation, toTXT } from "../../../utils";
import { deleteItems } from "../../../utils/functions";
import { presentDialog } from "../../dialog/functions";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";

export const ActionStrip = ({ note, setActionStrip }) => {
  const colors = useThemeStore((state) => state.colors);
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const setNotebooks = useNotebookStore((state) => state.setNotebooks);
  const setMenuPins = useMenuStore((state) => state.setMenuPins);
  const setSelectedItem = useSelectionStore((state) => state.setSelectedItem);
  const setSelectionMode = useSelectionStore((state) => state.setSelectionMode);

  const [isPinnedToMenu, setIsPinnedToMenu] = useState(false);
  const [width, setWidth] = useState(dWidth - 16);
  useEffect(() => {
    if (note.type === "note") return;
    setIsPinnedToMenu(db.shortcuts.exists(note.id));
  }, [note.id, note.type]);

  const updateNotes = () => {
    Navigation.queueRoutesForUpdate(
      "Notes",
      "Favorites",
      "ColoredNotes",
      "TaggedNotes",
      "TopicNotes"
    );
  };

  const actions = [
    {
      title: "Pin " + note.type,
      icon: note.pinned ? "pin-off" : "pin",
      visible: note.type === "note" || note.type === "notebook",
      onPress: async () => {
        if (!note.id) return;

        if (note.type === "note") {
          await db.notes.note(note.id).pin();
        } else {
          await db.notebooks.notebook(note.id).pin();
          setNotebooks();
        }
        updateNotes();
        setActionStrip(false);
      }
    },
    {
      title: "Add to favorites",
      icon: note.favorite ? "star-off" : "star",
      onPress: async () => {
        if (!note.id) return;
        if (note.type === "note") {
          await db.notes.note(note.id).favorite();
        } else {
          await db.notebooks.notebook(note.id).favorite();
        }
        updateNotes();
        setActionStrip(false);
      },
      visible: note.type === "note",
      color: !note.favorite ? "orange" : null
    },

    {
      title: isPinnedToMenu
        ? "Remove Shortcut from Menu"
        : "Add Shortcut to Menu",
      icon: isPinnedToMenu ? "link-variant-remove" : "link-variant",
      onPress: async () => {
        try {
          if (isPinnedToMenu) {
            await db.shortcuts.remove(note.id);
            ToastEvent.show({
              heading: "Shortcut removed from menu",
              type: "success"
            });
          } else {
            if (note.type === "topic") {
              await db.shortcuts.add({
                item: {
                  type: "topic",
                  id: note.id,
                  notebookId: note.notebookId
                }
              });
            } else {
              await db.shortcuts.add({
                item: {
                  type: "notebook",
                  id: note.id
                }
              });
            }
            ToastEvent.show({
              heading: "Shortcut added to menu",
              type: "success"
            });
          }
          setIsPinnedToMenu(db.shortcuts.exists(note.id));
          setMenuPins();

          setActionStrip(false);
        } catch (e) {
          console.error(e);
        }
      },
      visible: note.type !== "note" && note.type !== "reminder"
    },
    {
      title: "Copy Note",
      icon: "content-copy",
      visible: note.type === "note",
      onPress: async () => {
        if (note.locked) {
          openVault({
            copyNote: true,
            novault: true,
            locked: true,
            item: note,
            title: "Copy note",
            description: "Unlock note to copy to clipboard."
          });
        } else {
          let text = await toTXT(note);
          text = `${note.title}\n \n ${text}`;
          Clipboard.setString(text);
          ToastEvent.show({
            heading: "Note copied to clipboard",
            type: "success"
          });
        }
        setActionStrip(false);
      }
    },
    {
      title: "Restore " + note.itemType,
      icon: "delete-restore",
      onPress: async () => {
        await db.trash.restore(note.id);
        Navigation.queueRoutesForUpdate(
          "Notes",
          "Favorites",
          "ColoredNotes",
          "TaggedNotes",
          "TopicNotes",
          "Trash",
          "Notebooks"
        );

        ToastEvent.show({
          heading:
            note.type === "note"
              ? "Note restored from trash"
              : "Notebook restored from trash",
          type: "success"
        });

        setActionStrip(false);
      },
      visible: note.type === "trash"
    },
    {
      title: "Delete" + note.itemType,
      icon: "delete",
      visible: note.type === "trash",
      onPress: () => {
        presentDialog({
          title: "Permanent delete",
          paragraph: `Are you sure you want to delete this ${note.itemType} permanantly from trash?`,
          positiveText: "Delete",
          negativeText: "Cancel",
          positivePress: async () => {
            await db.trash.delete(note.id);
            useTrashStore.getState().setTrash();
            useSelectionStore.getState().setSelectionMode(false);
            ToastEvent.show({
              heading: "Permanantly deleted items",
              type: "success",
              context: "local"
            });
          },
          positiveType: "errorShade"
        });
        setActionStrip(false);
      }
    },
    {
      title: "Delete" + note.type,
      icon: "delete",
      visible: note.type !== "trash",
      onPress: async () => {
        if (note.type === "reminder") {
          presentDialog({
            title: `Delete ${note.type}`,
            paragraph: "This reminder will be removed",
            positivePress: async () => {
              const routes = [];
              await db.reminders.remove(note.id);
              routes.push("Reminders");
              Navigation.queueRoutesForUpdate(...routes);
              useRelationStore.getState().update();
            },
            positiveText: "Delete",
            positiveType: "errorShade"
          });
          return;
        }
        try {
          await deleteItems(note);
        } catch (e) {
          console.error(e);
        }
        setActionStrip(false);
      }
    },
    {
      title: "Close",
      icon: "close",
      onPress: () => setActionStrip(false),
      color: colors.light,
      bg: colors.red,
      visible: true
    }
  ];

  return (
    <Animated.View
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
      entering={SlideInUp.springify().mass(0.4)}
      exiting={SlideOutDown}
      style={{
        position: "absolute",
        zIndex: 999,
        width: "102%",
        height: "100%",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center"
      }}
    >
      <Button
        type="accent"
        title="Select"
        icon="check"
        tooltipText="Select Item"
        onPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
          }
          setSelectedItem(note);
          setActionStrip(false);
        }}
        style={{
          borderRadius: 100,
          paddingHorizontal: 12,
          ...getElevation(5)
        }}
        height={30}
      />
      {actions.map((item) =>
        item.visible ? (
          <View
            key={item.icon}
            style={{
              width: width / 1.4 / actions.length,
              height: width / 1.4 / actions.length,
              backgroundColor: item.bg || colors.nav,
              borderRadius: 100,
              justifyContent: "center",
              alignItems: "center",
              ...getElevation(5),
              marginLeft: 15
            }}
          >
            <IconButton
              color={item.color || colors.heading}
              onPress={item.onPress}
              tooltipText={item.title}
              top={60}
              bottom={60}
              name={item.icon}
              size={width / 2.8 / actions.length}
            />
          </View>
        ) : null
      )}
    </Animated.View>
  );
};
